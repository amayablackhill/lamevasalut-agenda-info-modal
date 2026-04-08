const test = require("node:test");
const assert = require("node:assert/strict");

const {
  groupBlocksByHeading,
  computeInitialExpandedSectionId,
  computeNextExpandedSectionId,
} = require("../lamevasalut.gencat.cat/group/cps/cites-agenda/visit-info-accordion-helpers.js");

test("groups blocks by heading-delimited sections", () => {
  const sections = groupBlocksByHeading("3", [
    { source: "section", block: { type: "heading", text: "Què és?" } },
    { source: "section", block: { type: "paragraph", text: "Text 1" } },
    { source: "section", block: { type: "heading", text: "Preparació" } },
    { source: "section", block: { type: "list", items: ["A", "B"] } },
  ]);

  assert.equal(sections.length, 2);
  assert.equal(sections[0].heading, "Què és?");
  assert.equal(sections[0].contentBlocks.length, 1);
  assert.equal(sections[1].heading, "Preparació");
  assert.equal(sections[1].contentBlocks.length, 1);
});

test("creates fallback section when content starts without heading", () => {
  const sections = groupBlocksByHeading("fallback", [
    { source: "section", block: { type: "paragraph", text: "Intro" } },
    { source: "section", block: { type: "list", items: ["item"] } },
    { source: "section", block: { type: "heading", text: "Detalls" } },
    { source: "section", block: { type: "paragraph", text: "Cos" } },
  ]);

  assert.equal(sections.length, 2);
  assert.equal(sections[0].heading, "Informacio general");
  assert.equal(sections[0].contentBlocks.length, 2);
  assert.equal(sections[1].heading, "Detalls");
  assert.equal(sections[1].contentBlocks.length, 1);
});

test("initial expanded section is warning-critical override, else first section", () => {
  const regularSections = [
    { id: "a", isWarningCritical: false },
    { id: "b", isWarningCritical: false },
  ];
  assert.equal(computeInitialExpandedSectionId(regularSections), "a");

  const warningSections = [
    { id: "a", isWarningCritical: false },
    { id: "b", isWarningCritical: true },
    { id: "c", isWarningCritical: true },
  ];
  assert.equal(computeInitialExpandedSectionId(warningSections), "b");
  assert.equal(computeInitialExpandedSectionId([]), null);
});

test("toggle behavior keeps single-open semantics and allows collapse", () => {
  assert.equal(computeNextExpandedSectionId("sec-1", "sec-2"), "sec-2");
  assert.equal(computeNextExpandedSectionId("sec-2", "sec-2"), null);
  assert.equal(computeNextExpandedSectionId(null, "sec-3"), "sec-3");
});
