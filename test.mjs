import test from "node:test";
import assert from "node:assert/strict";
import { normalizeLanguage, translatedText } from "./app.js";

test("language helpers always return a complete supported translation", () => {
  const copy = { zh: "中心城", en: "Canterlot" };
  assert.equal(normalizeLanguage("en"), "en");
  assert.equal(normalizeLanguage("fr"), "zh");
  assert.equal(translatedText(copy, "zh"), "中心城");
  assert.equal(translatedText(copy, "en"), "Canterlot");
  assert.equal(translatedText(copy, "fr"), "中心城");
});
