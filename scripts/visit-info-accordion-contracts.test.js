const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const agendaPath = path.join(
  __dirname,
  "..",
  "lamevasalut.gencat.cat",
  "group",
  "cps",
  "cites-agenda",
  "agenda.html"
);

const agendaHtml = fs.readFileSync(agendaPath, "utf8");

test("accordion render wiring keeps ARIA control-region linkage contract", () => {
  assert.match(agendaHtml, /var triggerId = section\.id \+ '-trigger';/);
  assert.match(agendaHtml, /var panelId = section\.id \+ '-panel';/);
  assert.match(agendaHtml, /triggerButton\.id = triggerId;/);
  assert.match(agendaHtml, /triggerButton\.setAttribute\('aria-controls', panelId\);/);
  assert.match(agendaHtml, /panel\.id = panelId;/);
  assert.match(agendaHtml, /panel\.setAttribute\('aria-labelledby', triggerId\);/);
  assert.match(agendaHtml, /panel\.setAttribute\('role', 'region'\);/);
});

test("accordion toggle handlers keep click and Enter/Space keyboard behavior", () => {
  assert.match(agendaHtml, /if \(event && event\.type === 'keydown'\) \{/);
  assert.match(agendaHtml, /if \(event\.key !== 'Enter' && event\.key !== ' '\) \{/);
  assert.match(agendaHtml, /event\.preventDefault\(\);/);
  assert.match(
    agendaHtml,
    /expandedSectionId = accordionHelpers\.computeNextExpandedSectionId\([\s\S]*setExpandedSection\(expandedSectionId\);/
  );
  assert.match(
    agendaHtml,
    /triggerButton\.addEventListener\('click', onToggle\.bind\(null, section\)\);/
  );
  assert.match(
    agendaHtml,
    /triggerButton\.addEventListener\('keydown', onToggle\.bind\(null, section\)\);/
  );
});

test("accordion CSS defines heading hierarchy and section spacing contracts", () => {
  assert.match(agendaHtml, /\.lms-visitinfo-accordion\s*\{[\s\S]*gap: var\(--visitinfo-section-gap\);[\s\S]*\}/);
  assert.match(
    agendaHtml,
    /\.lms-visitinfo-accordion-trigger\s*\{[\s\S]*font-size: var\(--visitinfo-heading-size\);[\s\S]*font-weight: 700;[\s\S]*\}/
  );
  assert.match(
    agendaHtml,
    /\.lms-visitinfo-body\s*\{[\s\S]*font-size: var\(--visitinfo-body-size\);[\s\S]*line-height: var\(--visitinfo-line-height\);[\s\S]*\}/
  );
  assert.match(
    agendaHtml,
    /\.lms-visitinfo-accordion-panel-inner h3\s*\{[\s\S]*font-size: 0\.95rem;[\s\S]*font-weight: 700;[\s\S]*\}/
  );
});

test("accordion mobile CSS includes readability and overflow safeguards", () => {
  assert.match(
    agendaHtml,
    /@media \(max-width: 992px\)\s*\{[\s\S]*\.lms-visitinfo-body\s*\{[\s\S]*max-height: 68vh;[\s\S]*\}[\s\S]*\}/
  );
  assert.match(
    agendaHtml,
    /@media \(max-width: 992px\)\s*\{[\s\S]*\.lms-visitinfo-accordion-trigger\s*\{[\s\S]*font-size: 0\.95rem;[\s\S]*\}[\s\S]*\}/
  );
  assert.match(
    agendaHtml,
    /@media \(max-width: 992px\)\s*\{[\s\S]*\.lms-visitinfo-accordion-panel-inner\s*\{[\s\S]*overflow-wrap: anywhere;[\s\S]*word-break: break-word;[\s\S]*\}[\s\S]*\}/
  );
  assert.match(
    agendaHtml,
    /\.lms-visitinfo-body\s*\{[\s\S]*overflow-y: auto;[\s\S]*\}/
  );
});
