import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { clampPan, fitCoverScale, languageForPath, mobileRoute, normalizeLanguage, RAIL_ROUTES, TRAIN_SLICES, translatedText } from "./app.js";

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

test("every requested train stop is connected by a visible railway trip", () => {
  const stops = new Set(RAIL_ROUTES.flatMap(({ from, to }) => [from, to]));
  for (const stop of ["Los Pegasus", "Mysterious South", "Appleloosa", "Dodge City", "Ponyville", "Canterlot", "Vanhoover", "Crystal Empire", "Manehattan", "Fillydelphia", "Baltimare", "Griffonstone Station"]) {
    assert.ok(stops.has(stop), stop);
  }
  assert.ok(RAIL_ROUTES.every(({ path, seconds }) => /^M \d+ \d+ C /.test(path) && seconds > 0));
  assert.ok(RAIL_ROUTES.some(({ from, to }) => from === "Crystal Mountains" && to === "Griffonstone Station"));
  assert.ok(!RAIL_ROUTES.some(({ from, to }) => [from, to].includes("Griffonstone Station") && [from, to].includes("Manehattan")));
});

test("the original supplied map is the background and both ship sources are deployed", () => {
  assert.match(readFileSync(new URL("./style.css", import.meta.url), "utf8"), /background: url\("newnewmap\.png"\)/);
  assert.doesNotMatch(readFileSync(new URL("./index.html", import.meta.url), "utf8"), /map-artwork|map-waves/);
  assert.doesNotMatch(readFileSync(new URL("./app.js", import.meta.url), "utf8"), /map-artwork|map-waves|movingWaves/);
  const workflow = readFileSync(new URL("./.github/workflows/pages.yml", import.meta.url), "utf8");
  assert.match(workflow, /newnewmap\.png map\.png/);
});

test("the locomotive and five trailing cars are separate ordered sprite sections", () => {
  assert.equal(TRAIN_SLICES.length, 6);
  assert.equal(TRAIN_SLICES[0][2], 0);
  for (let i = 1; i < TRAIN_SLICES.length; i++) {
    assert.equal(TRAIN_SLICES[i][1], TRAIN_SLICES[i - 1][0]);
    assert.ok(TRAIN_SLICES[i][2] > TRAIN_SLICES[i - 1][2]);
  }
});
