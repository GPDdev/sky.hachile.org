import test from "node:test";
import assert from "node:assert/strict";
import { languageForPath, normalizeLanguage, parallaxOffset, translatedText } from "./app.js";

test("language helpers always return a complete supported translation", () => {
  const copy = { zh: "中心城", en: "Canterlot" };
  assert.equal(normalizeLanguage("en"), "en");
  assert.equal(normalizeLanguage("fr"), "zh");
  assert.equal(translatedText(copy, "zh"), "中心城");
  assert.equal(translatedText(copy, "en"), "Canterlot");
  assert.equal(translatedText(copy, "fr"), "中心城");
});

test("English has its own route and parallax stays subtle", () => {
  assert.equal(languageForPath("/"), "zh");
  assert.equal(languageForPath("/en"), "en");
  assert.equal(languageForPath("/en/"), "en");
  assert.equal(parallaxOffset(0, 100), -10);
  assert.equal(parallaxOffset(50, 100), 0);
  assert.equal(parallaxOffset(100, 100), 10);
});
