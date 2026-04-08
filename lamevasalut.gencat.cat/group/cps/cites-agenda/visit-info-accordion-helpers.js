(function(root, factory) {
  var api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.VisitInfoAccordionHelpers = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function() {
  function normalizeHeading(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }

  function sanitizeIdPart(value) {
    return (
      String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "sec"
    );
  }

  function isWarningCriticalHeading(headingText) {
    return /avisos importants|abans de la prova/i.test(headingText || "");
  }

  function createSection(sectionId, index, headingText, isFallback) {
    var normalizedHeading = normalizeHeading(headingText);
    var generatedLabel = isFallback ? "Informacio general" : "Seccio " + (index + 1);

    return {
      id: "visit-info-sec-" + sanitizeIdPart(sectionId) + "-" + (index + 1),
      heading: normalizedHeading || generatedLabel,
      contentBlocks: [],
      hasWarningSource: false,
    };
  }

  function groupBlocksByHeading(sectionId, blockEntries) {
    var sections = [];
    var currentSection = null;

    for (var idx = 0; idx < blockEntries.length; idx += 1) {
      var entry = blockEntries[idx] || {};
      var block = entry.block;
      var source = entry.source || "section";

      if (!block || !block.type) {
        continue;
      }

      if (block.type === "heading") {
        currentSection = createSection(sectionId, sections.length, block.text, false);
        currentSection.hasWarningSource = source === "warning";
        sections.push(currentSection);
        continue;
      }

      if (!currentSection) {
        currentSection = createSection(sectionId, sections.length, "", true);
        currentSection.hasWarningSource = source === "warning";
        sections.push(currentSection);
      }

      if (source === "warning") {
        currentSection.hasWarningSource = true;
      }

      currentSection.contentBlocks.push(block);
    }

    for (var sectionIdx = 0; sectionIdx < sections.length; sectionIdx += 1) {
      sections[sectionIdx].isWarningCritical =
        sections[sectionIdx].hasWarningSource ||
        isWarningCriticalHeading(sections[sectionIdx].heading);
    }

    return sections;
  }

  function computeInitialExpandedSectionId(sections) {
    if (!sections.length) {
      return null;
    }

    for (var idx = 0; idx < sections.length; idx += 1) {
      if (sections[idx].isWarningCritical) {
        return sections[idx].id;
      }
    }

    return sections[0].id;
  }

  function computeNextExpandedSectionId(currentExpandedSectionId, targetSectionId) {
    if (currentExpandedSectionId === targetSectionId) {
      return null;
    }

    return targetSectionId;
  }

  return {
    groupBlocksByHeading: groupBlocksByHeading,
    computeInitialExpandedSectionId: computeInitialExpandedSectionId,
    computeNextExpandedSectionId: computeNextExpandedSectionId,
  };
});
