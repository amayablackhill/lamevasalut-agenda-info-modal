const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
  SECTION_COUNT,
  parseModalInfoMarkdown,
  validateMappingIntegrity,
  assertExtractionFidelity,
  validateNoLegacyAttributesInHtml,
  generateModalInfo,
  resolveSectionById,
  defaultPaths,
} = require("./modal-info-from-md");

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "modal-info-test-"));
}

function createValidMarkdown() {
  const lines = [
    "## Abans de la prova, avisi si:",
    "",
    "* està embarassada o podria estar-ho",
    "* ha tingut una reacció prèvia a un contrast",
    "",
    "---",
    "",
  ];

  for (let sectionId = 1; sectionId <= SECTION_COUNT; sectionId += 1) {
    lines.push("## " + sectionId + ") Prova " + sectionId);
    lines.push("");
    lines.push("**Què és?**");
    lines.push("Text " + sectionId + ".");
    lines.push("");
    if (sectionId !== SECTION_COUNT) {
      lines.push("---");
      lines.push("");
    }
  }

  return lines.join("\n");
}

function createValidMapping() {
  return {
    cards: Array.from({ length: SECTION_COUNT }, (_, index) => ({
      cardId: "card-" + String(index + 1),
      sectionId: String(index + 1),
    })),
  };
}

function extractVisibleTokensFromMarkdown(markdown) {
  const lines = markdown.split(/\r?\n/);
  const tokens = [];
  let paragraphBuffer = [];

  function flushParagraph() {
    if (!paragraphBuffer.length) {
      return;
    }
    tokens.push("paragraph:" + paragraphBuffer.join(" ").trim());
    paragraphBuffer = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line || line === "---") {
      flushParagraph();
      continue;
    }

    const sectionHeading = line.match(/^##\s+([1-8])\)\s+(.+)$/);
    if (sectionHeading) {
      flushParagraph();
      tokens.push("section-title:" + sectionHeading[2].trim());
      continue;
    }

    if (/^##\s+/.test(line)) {
      flushParagraph();
      tokens.push("heading:" + line.replace(/^##\s+/, "").trim());
      continue;
    }

    const subsection = line.match(/^\*\*(.+)\*\*$/);
    if (subsection) {
      flushParagraph();
      tokens.push("heading:" + subsection[1].trim());
      continue;
    }

    const listItem = line.match(/^\*\s+(.+)$/);
    if (listItem) {
      flushParagraph();
      tokens.push("list:" + listItem[1].trim());
      continue;
    }

    paragraphBuffer.push(line);
  }

  flushParagraph();
  return tokens;
}

function extractVisibleTokensFromPayload(payload) {
  const tokens = [];

  payload.warning.forEach((block) => {
    if (block.type === "heading") {
      tokens.push("heading:" + block.text);
      return;
    }
    if (block.type === "paragraph") {
      tokens.push("paragraph:" + block.text);
      return;
    }
    if (block.type === "list") {
      block.items.forEach((item) => tokens.push("list:" + item));
    }
  });

  for (let sectionId = 1; sectionId <= SECTION_COUNT; sectionId += 1) {
    const section = payload.sections[String(sectionId)];
    tokens.push("section-title:" + section.title);
    section.blocks.forEach((block) => {
      if (block.type === "heading") {
        tokens.push("heading:" + block.text);
      } else if (block.type === "paragraph") {
        tokens.push("paragraph:" + block.text);
      } else if (block.type === "list") {
        block.items.forEach((item) => tokens.push("list:" + item));
      }
    });
  }

  return tokens;
}

test("parser preserves section labels, order, and language", () => {
  const parsed = parseModalInfoMarkdown(createValidMarkdown());

  assert.equal(Object.keys(parsed.sections).join(","), "1,2,3,4,5,6,7,8");
  assert.equal(parsed.sections["1"].title, "Prova 1");
  assert.equal(parsed.sections["8"].title, "Prova 8");
  assert.equal(parsed.sections["3"].blocks[0].text, "Què és?");
  assert.equal(parsed.sections["3"].blocks[1].text, "Text 3.");
});

test("generation fails when source file is missing", () => {
  const tempDir = createTempDir();
  const mappingPath = path.join(tempDir, "map.json");
  fs.writeFileSync(mappingPath, JSON.stringify(createValidMapping(), null, 2), "utf8");

  assert.throws(
    () =>
      generateModalInfo({
        inputPath: path.join(tempDir, "missing.md"),
        mappingPath,
        outputPath: path.join(tempDir, "out.json"),
      }),
    /MODAL-INFO\.md not found/
  );
});

test("parser fails for out-of-order sections", () => {
  const invalidMarkdown = createValidMarkdown().replace("## 2) Prova 2", "## 3) Prova 2");
  assert.throws(() => parseModalInfoMarkdown(invalidMarkdown), /Section order mismatch/);
});

test("parser fails for duplicate ids", () => {
  const invalidMarkdown = createValidMarkdown().replace("## 2) Prova 2", "## 1) Prova 2");
  assert.throws(() => parseModalInfoMarkdown(invalidMarkdown), /Section order mismatch/);
});

test("parser fails for unsupported markup", () => {
  const invalidMarkdown = createValidMarkdown().replace("Text 3.", "> Unsupported blockquote");
  assert.throws(() => parseModalInfoMarkdown(invalidMarkdown), /Unsupported blockquote markup/);
});

test("editorial normalization drift is rejected by fidelity guard", () => {
  const markdown = createValidMarkdown();
  const parsed = parseModalInfoMarkdown(markdown);
  const payload = {
    version: 1,
    source: "MODAL-INFO.md",
    warning: parsed.warning,
    sections: {
      ...parsed.sections,
      "1": {
        ...parsed.sections["1"],
        title: "PROVA 1",
      },
    },
  };

  assert.throws(
    () => assertExtractionFidelity(markdown, payload),
    /Extraction fidelity check failed/
  );
});

test("mapping integrity validates uniqueness and full coverage", () => {
  const mapping = createValidMapping();
  const sectionIds = new Set(mapping.cards.map((entry) => entry.sectionId));
  assert.doesNotThrow(() => validateMappingIntegrity(mapping, sectionIds));

  const duplicate = createValidMapping();
  duplicate.cards[7].sectionId = "7";
  assert.throws(() => validateMappingIntegrity(duplicate, sectionIds), /Duplicate sectionId/);

  const missing = createValidMapping();
  missing.cards = missing.cards.slice(0, 7);
  assert.throws(() => validateMappingIntegrity(missing, sectionIds), /exactly 8 cards/);
});

test("modal resolution by data-visit-info-id uses generated payload", () => {
  const payload = {
    version: 1,
    source: "MODAL-INFO.md",
    warning: [],
    sections: {
      "1": {
        title: "Radiografies convencionals (Rx)",
        blocks: [{ type: "paragraph", text: "Text de prova" }],
      },
    },
  };

  assert.equal(resolveSectionById(payload, "1").title, "Radiografies convencionals (Rx)");
  assert.equal(resolveSectionById(payload, "99"), null);
});

test("legacy data-info attributes are rejected", () => {
  const html = '<button data-info-title="T" data-info-body="B"></button>';
  assert.throws(
    () => validateNoLegacyAttributesInHtml(html, "agenda.html"),
    /Legacy modal attributes detected/
  );
});

test("generation fails when agenda HTML reintroduces legacy attributes", () => {
  const tempDir = createTempDir();
  const inputPath = path.join(tempDir, "MODAL-INFO.md");
  const mappingPath = path.join(tempDir, "map.json");
  const outputPath = path.join(tempDir, "out.json");
  const agendaPath = path.join(tempDir, "agenda.html");

  fs.writeFileSync(inputPath, createValidMarkdown(), "utf8");
  fs.writeFileSync(mappingPath, JSON.stringify(createValidMapping(), null, 2), "utf8");
  fs.writeFileSync(agendaPath, '<button data-info-title="x"></button>', "utf8");

  assert.throws(
    () =>
      generateModalInfo({
        inputPath,
        mappingPath,
        outputPath,
        agendaPath,
      }),
    /Legacy modal attributes detected/
  );
});

test("generated payload is deterministic and text-fidelity matches MODAL-INFO.md", () => {
  const paths = defaultPaths();
  const markdown = fs.readFileSync(paths.inputPath, "utf8");
  const committed = JSON.parse(fs.readFileSync(paths.outputPath, "utf8"));

  const tempDir = createTempDir();
  const regeneratedPath = path.join(tempDir, "regenerated.json");
  const regenerated = generateModalInfo({
    inputPath: paths.inputPath,
    mappingPath: paths.mappingPath,
    outputPath: regeneratedPath,
    agendaPath: paths.agendaPath,
  });

  assert.deepEqual(regenerated, committed);
  assert.deepEqual(extractVisibleTokensFromPayload(committed), extractVisibleTokensFromMarkdown(markdown));
});
