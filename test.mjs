import test from "node:test";
import assert from "node:assert/strict";
import { clampPan, fitCoverScale, languageForPath, mobileRoute, normalizeLanguage, translatedText } from "./app.js";

test("language helpers always return a complete supported translation", () => {
  const copy = { zh: "中心城", en: "Canterlot" };
  assert.equal(normalizeLanguage("en"), "en");
  assert.equal(normalizeLanguage("fr"), "zh");
  assert.equal(translatedText(copy, "zh"), "中心城");
  assert.equal(translatedText(copy, "en"), "Canterlot");
  assert.equal(translatedText(copy, "fr"), "中心城");
});

test("English has its own route", () => {
  assert.equal(languageForPath("/"), "zh");
  assert.equal(languageForPath("/en"), "en");
  assert.equal(languageForPath("/en/"), "en");
});

test("phones use the matching mobile language route", () => {
  assert.equal(mobileRoute("/", true), "/m/");
  assert.equal(mobileRoute("/en/", true), "/m/en/");
  assert.equal(mobileRoute("/", false), null);
  assert.equal(mobileRoute("/m/en/", true), null);
});

test("map fills its viewport and cannot be dragged beyond an edge", () => {
  assert.equal(fitCoverScale(1920, 1200), 1);
  assert.equal(fitCoverScale(1600, 900), 1600 / 1920);
  assert.equal(fitCoverScale(390, 844), 844 / 1200);
  assert.deepEqual(clampPan(50, -999, 1, 800, 600), { x: 0, y: -600 });
});
