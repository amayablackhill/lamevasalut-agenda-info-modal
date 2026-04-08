const fs = require("node:fs");
const path = require("node:path");

const SECTION_COUNT = 8;
const ALLOWED_BLOCK_TYPES = new Set(["heading", "paragraph", "list"]);

function fail(message) {
  throw new Error(message);
}

function readTextFile(filePath, label) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (error) {
    if (error && error.code === "ENOENT") {
      fail(label + " not found: " + filePath);
    }
    fail("Unable to read " + label + ": " + filePath + " (" + error.message + ")");
  }
}

function parseModalInfoMarkdown(markdown) {
  const lines = markdown.split(/\r?\n/);
  const firstSeparator = lines.findIndex((line) => line.trim() === "---");

  if (firstSeparator < 0) {
    fail("Invalid markdown: missing separator after warning block");
  }

  const warningLines = lines.slice(0, firstSeparator);
  const warning = parseBlocks(warningLines, "warning");

  const sections = {};
  let pointer = firstSeparator + 1;
  let expectedSectionId = 1;

  while (pointer < lines.length) {
    while (pointer < lines.length && lines[pointer].trim() === "") {
      pointer += 1;
    }

    if (pointer >= lines.length) {
      break;
    }

    const headingLine = lines[pointer];
    const headingMatch = headingLine.match(/^##\s+([1-8])\)\s+(.+)$/);

    if (!headingMatch) {
      fail("Expected section heading '## n)' at line " + (pointer + 1));
    }

    const sectionId = headingMatch[1];
    const sectionTitle = headingMatch[2].trim();
    const expectedStringId = String(expectedSectionId);

    if (sectionId !== expectedStringId) {
      fail(
        "Section order mismatch at line " +
          (pointer + 1) +
          ": expected '## " +
          expectedStringId +
          ")', got '## " +
          sectionId +
          ")'"
      );
    }

    pointer += 1;
    const sectionContentStart = pointer;

    while (pointer < lines.length && lines[pointer].trim() !== "---") {
      pointer += 1;
    }

    const sectionLines = lines.slice(sectionContentStart, pointer);
    const blocks = parseBlocks(sectionLines, "section " + sectionId);

    if (!blocks.length) {
      fail("Section " + sectionId + " has no content blocks");
    }

    sections[sectionId] = {
      title: sectionTitle,
      blocks: blocks,
    };

    expectedSectionId += 1;

    if (pointer < lines.length && lines[pointer].trim() === "---") {
      pointer += 1;
    }
  }

  if (expectedSectionId !== SECTION_COUNT + 1) {
    fail("Expected sections 1..8; found up to " + (expectedSectionId - 1));
  }

  return {
    warning: warning,
    sections: sections,
  };
}

function parseBlocks(lines, contextLabel) {
  const blocks = [];
  let paragraphBuffer = [];

  function flushParagraph() {
    if (!paragraphBuffer.length) {
      return;
    }
    blocks.push({
      type: "paragraph",
      text: paragraphBuffer.join(" ").trim(),
    });
    paragraphBuffer = [];
  }

  let lineIndex = 0;
  while (lineIndex < lines.length) {
    const rawLine = lines[lineIndex];
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      lineIndex += 1;
      continue;
    }

    if (line === "---") {
      fail("Unexpected separator inside " + contextLabel + " at line offset " + (lineIndex + 1));
    }

    if (/^##\s+/.test(line)) {
      blocks.push({
        type: "heading",
        text: line.replace(/^##\s+/, "").trim(),
      });
      lineIndex += 1;
      continue;
    }

    const subsectionMatch = line.match(/^\*\*(.+)\*\*$/);
    if (subsectionMatch) {
      flushParagraph();
      blocks.push({
        type: "heading",
        text: subsectionMatch[1].trim(),
      });
      lineIndex += 1;
      continue;
    }

    if (/^\*\s+/.test(line)) {
      flushParagraph();
      const items = [];
      while (lineIndex < lines.length && /^\*\s+/.test(lines[lineIndex].trim())) {
        const item = lines[lineIndex].trim().replace(/^\*\s+/, "").trim();
        items.push(item);
        lineIndex += 1;
      }
      if (!items.length) {
        fail("Empty list in " + contextLabel + " at line offset " + (lineIndex + 1));
      }
      blocks.push({
        type: "list",
        items: items,
      });
      continue;
    }

    assertNoUnsupportedMarkup(line, contextLabel, lineIndex + 1);
    paragraphBuffer.push(line);
    lineIndex += 1;
  }

  flushParagraph();
  return blocks;
}

function assertNoUnsupportedMarkup(line, contextLabel, lineOffset) {
  if (/^#{1}[^#]/.test(line) || /^###\s+/.test(line)) {
    fail("Unsupported heading markup in " + contextLabel + " at line offset " + lineOffset);
  }
  if (/^>\s+/.test(line)) {
    fail("Unsupported blockquote markup in " + contextLabel + " at line offset " + lineOffset);
  }
  if (/^```/.test(line) || /^`/.test(line) || /`/.test(line)) {
    fail("Unsupported code markup in " + contextLabel + " at line offset " + lineOffset);
  }
  if (/^[-+]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
    fail("Unsupported list markup in " + contextLabel + " at line offset " + lineOffset);
  }
  if (/\[[^\]]+\]\([^\)]+\)/.test(line)) {
    fail("Unsupported link markup in " + contextLabel + " at line offset " + lineOffset);
  }
  if (/<\/?[a-z][^>]*>/i.test(line)) {
    fail("Unsupported HTML markup in " + contextLabel + " at line offset " + lineOffset);
  }
}

function loadMapping(mapPath) {
  const json = readTextFile(mapPath, "mapping file");
  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch (error) {
    fail("Invalid JSON in mapping file: " + mapPath + " (" + error.message + ")");
  }

  if (!parsed || !Array.isArray(parsed.cards)) {
    fail("Invalid mapping file structure: expected { cards: [] }");
  }

  return parsed;
}

function validateMappingIntegrity(mapping, sectionIds) {
  if (mapping.cards.length !== SECTION_COUNT) {
    fail("Mapping must define exactly 8 cards; found " + mapping.cards.length);
  }

  const seenCardIds = new Set();
  const seenSectionIds = new Set();

  for (let i = 0; i < mapping.cards.length; i += 1) {
    const entry = mapping.cards[i];
    if (!entry || typeof entry.cardId !== "string" || typeof entry.sectionId !== "string") {
      fail("Invalid mapping entry at index " + i + "; expected { cardId, sectionId }");
    }

    if (!entry.cardId.trim() || !entry.sectionId.trim()) {
      fail("Mapping entry at index " + i + " has empty cardId/sectionId");
    }

    if (seenCardIds.has(entry.cardId)) {
      fail("Duplicate cardId in mapping: " + entry.cardId);
    }
    seenCardIds.add(entry.cardId);

    if (seenSectionIds.has(entry.sectionId)) {
      fail("Duplicate sectionId in mapping: " + entry.sectionId);
    }
    seenSectionIds.add(entry.sectionId);
  }

  for (let i = 1; i <= SECTION_COUNT; i += 1) {
    const sectionId = String(i);
    if (!seenSectionIds.has(sectionId)) {
      fail("Missing sectionId in mapping: " + sectionId);
    }
    if (!sectionIds.has(sectionId)) {
      fail("Mapping references unknown sectionId: " + sectionId);
    }
  }
}

function buildPayload(parsedMarkdown) {
  return {
    version: 1,
    source: "MODAL-INFO.md",
    warning: parsedMarkdown.warning,
    sections: parsedMarkdown.sections,
  };
}

function assertExtractionFidelity(markdown, payload) {
  const expected = buildPayload(parseModalInfoMarkdown(markdown));
  if (JSON.stringify(expected) !== JSON.stringify(payload)) {
    fail("Extraction fidelity check failed: generated payload diverges from MODAL-INFO.md source");
  }
}

function validateNoLegacyAttributesInHtml(htmlText, htmlPath) {
  const hasLegacyTitle = /data-info-title\s*=/.test(htmlText);
  const hasLegacyBody = /data-info-body\s*=/.test(htmlText);
  if (hasLegacyTitle || hasLegacyBody) {
    fail(
      "Legacy modal attributes detected in " +
        htmlPath +
        ": use data-visit-info-id only (remove data-info-title/data-info-body)"
    );
  }
}

function generateModalInfo(options) {
  const markdown = readTextFile(options.inputPath, "MODAL-INFO.md");
  const parsed = parseModalInfoMarkdown(markdown);

  const payload = buildPayload(parsed);
  const mapping = loadMapping(options.mappingPath);

  validateMappingIntegrity(mapping, new Set(Object.keys(payload.sections)));

  for (const key of Object.keys(payload.sections)) {
    const section = payload.sections[key];
    section.blocks.forEach((block) => {
      if (!ALLOWED_BLOCK_TYPES.has(block.type)) {
        fail("Unsupported block type in section " + key + ": " + block.type);
      }
    });
  }
  payload.warning.forEach((block) => {
    if (!ALLOWED_BLOCK_TYPES.has(block.type)) {
      fail("Unsupported warning block type: " + block.type);
    }
  });

  assertExtractionFidelity(markdown, payload);

  if (options.agendaPath) {
    const agendaHtml = readTextFile(options.agendaPath, "agenda.html");
    validateNoLegacyAttributesInHtml(agendaHtml, options.agendaPath);
  }

  fs.mkdirSync(path.dirname(options.outputPath), { recursive: true });
  fs.writeFileSync(options.outputPath, JSON.stringify(payload, null, 2) + "\n", "utf8");

  return payload;
}

function resolveSectionById(payload, sectionId) {
  if (!payload || !payload.sections || typeof payload.sections !== "object") {
    return null;
  }
  return payload.sections[sectionId] || null;
}

function defaultPaths() {
  const root = path.resolve(__dirname, "..");
  return {
    inputPath: path.join(root, "MODAL-INFO.md"),
    mappingPath: path.join(root, "scripts", "modal-info-map.json"),
    outputPath: path.join(
      root,
      "lamevasalut.gencat.cat",
      "group",
      "cps",
      "cites-agenda",
      "modal-info.generated.json"
    ),
    agendaPath: path.join(root, "lamevasalut.gencat.cat", "group", "cps", "cites-agenda", "agenda.html"),
  };
}

if (require.main === module) {
  const paths = defaultPaths();
  generateModalInfo(paths);
}

module.exports = {
  SECTION_COUNT,
  parseModalInfoMarkdown,
  loadMapping,
  validateMappingIntegrity,
  assertExtractionFidelity,
  validateNoLegacyAttributesInHtml,
  generateModalInfo,
  resolveSectionById,
  defaultPaths,
};
