export const SUPPORTED_LANGUAGES = ["zh", "en"];

export function normalizeLanguage(value) {
  return SUPPORTED_LANGUAGES.includes(value) ? value : "zh";
}

export function translatedText(dataset, language) {
  return dataset[normalizeLanguage(language)] || dataset.zh || "";
}

export function languageForPath(pathname) {
  return /^\/en(?:\/|$)/.test(pathname) ? "en" : "zh";
}

export function mobileRoute(pathname, isMobile) {
  if (!isMobile || /^\/m(?:\/|$)/.test(pathname)) return null;
  return languageForPath(pathname) === "en" ? "/m/en/" : "/m/";
}

export const MAP_WIDTH = 1920;
export const MAP_HEIGHT = 1200;

// Each trip follows one visible stretch of the map's railway and ends at the next named stop.
export const RAIL_ROUTES = [
  { from: "Los Pegasus", to: "Appleloosa", path: "M 338 733 C 335 760 342 789 386 797 C 490 809 624 827 773 843", seconds: 31 },
  { from: "Mysterious South", to: "Appleloosa", path: "M 786 1130 C 782 1060 781 973 778 890 C 777 870 775 851 773 843", seconds: 26 },
  { from: "Appleloosa", to: "Dodge City", path: "M 773 843 C 831 845 882 837 956 840", seconds: 17 },
  { from: "Los Pegasus", to: "Ponyville", path: "M 338 733 C 333 711 351 684 404 666 C 474 642 520 669 579 644 C 603 630 623 605 640 590", seconds: 29 },
  { from: "Ponyville", to: "Canterlot", path: "M 640 590 C 674 573 704 569 740 553", seconds: 17 },
  { from: "Vanhoover", to: "Canterlot", path: "M 225 486 C 281 493 318 504 361 481 C 380 517 434 520 501 518 C 591 523 664 544 740 553", seconds: 34 },
  { from: "Crystal Empire", to: "Vanhoover", path: "M 765 321 C 707 332 630 330 572 329 C 530 328 510 346 512 384 C 511 412 452 425 397 429 C 343 433 340 451 361 481 C 325 493 279 490 225 486", seconds: 38 },
  { from: "Canterlot", to: "Fillydelphia", path: "M 740 553 C 783 569 825 576 852 543 C 864 511 896 512 948 518 C 1048 530 1120 510 1192 531 C 1226 548 1217 608 1208 651", seconds: 36 },
  { from: "Fillydelphia", to: "Baltimare", path: "M 1208 651 C 1218 701 1241 731 1262 764", seconds: 18 },
  { from: "Manehattan", to: "Fillydelphia", path: "M 1367 517 C 1306 512 1251 524 1192 531 C 1216 558 1217 607 1208 651", seconds: 22 },
  { from: "Griffonstone Station", to: "Manehattan", path: "M 1743 371 C 1692 353 1653 348 1604 346 C 1558 374 1510 423 1472 461 C 1442 492 1409 512 1367 517", seconds: 32 },
];

// Sprite sections run from the locomotive backwards through the tender and four coaches.
export const TRAIN_SLICES = [
  [1608, 2132, 0], [1260, 1608, 23], [930, 1260, 41],
  [650, 930, 57], [350, 650, 73], [45, 350, 89],
];

export function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function fitCoverScale(width, height) {
  if (width <= 0 || height <= 0) return 1;
  return Math.max(width / MAP_WIDTH, height / MAP_HEIGHT);
}

export function clampPan(x, y, scale, width, height) {
  return {
    x: clamp(x, Math.min(0, width - MAP_WIDTH * scale), 0),
    y: clamp(y, Math.min(0, height - MAP_HEIGHT * scale), 0),
  };
}

if (typeof document !== "undefined") {
  const isMobile = navigator.userAgentData?.mobile
    ?? matchMedia("(max-width: 760px) and (pointer: coarse)").matches;
  const targetRoute = mobileRoute(location.pathname, isMobile);
  if (targetRoute) location.replace(targetRoute);

  const languageButton = document.querySelector(".language");
  const viewport = document.querySelector(".map-viewport");
  const world = document.querySelector(".map-world");
  const toast = document.querySelector(".toast");
  let language = languageForPath(location.pathname);
  let toastTimer;
  let baseScale = 1;
  let zoom = 1;
  let x = 0;
  let y = 0;
  let drag;

  function renderMap() {
    const { width, height } = viewport.getBoundingClientRect();
    const scale = baseScale * zoom;
    ({ x, y } = clampPan(x, y, scale, width, height));
    world.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
    world.style.setProperty("--marker-scale", 1 / scale);
  }

  function resetMap() {
    const { width, height } = viewport.getBoundingClientRect();
    baseScale = fitCoverScale(width, height);
    zoom = 1;
    x = (width - MAP_WIDTH * baseScale) / 2;
    y = (height - MAP_HEIGHT * baseScale) / 2;
    renderMap();
  }

  function setLanguage(nextLanguage) {
    language = normalizeLanguage(nextLanguage);
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    document.querySelector(".place-canterlot").href = language === "en"
      ? "https://home.hachile.org/en/"
      : "https://home.hachile.org/";
    document.querySelectorAll("[data-zh][data-en]").forEach((element) => {
      element.textContent = translatedText(element.dataset, language);
    });
    languageButton.querySelector(".language-current").textContent = language === "zh" ? "中" : "EN";
    languageButton.querySelector(".language-next").textContent = language === "zh" ? "EN" : "中";
    languageButton.setAttribute("aria-label", language === "zh" ? "Switch to English" : "切换到中文");
  }

  function showToast(value) {
    toast.textContent = language === "zh" ? `已复制：${value}` : `Copied: ${value}`;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
  }

  languageButton.addEventListener("click", () => location.assign(language === "zh" ? "/en/" : "/"));

  viewport.addEventListener("wheel", (event) => {
    event.preventDefault();
    const rect = viewport.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;
    const oldScale = baseScale * zoom;
    const mapX = (pointerX - x) / oldScale;
    const mapY = (pointerY - y) / oldScale;
    zoom = clamp(zoom * Math.exp(-event.deltaY * .001), 1, 4);
    const nextScale = baseScale * zoom;
    x = pointerX - mapX * nextScale;
    y = pointerY - mapY * nextScale;
    renderMap();
  }, { passive: false });

  viewport.addEventListener("pointerdown", (event) => {
    if (event.target.closest("a, button")) return;
    drag = { pointerId: event.pointerId, pointerX: event.clientX, pointerY: event.clientY, x, y };
    viewport.setPointerCapture(event.pointerId);
    viewport.classList.add("dragging");
  });

  viewport.addEventListener("pointermove", (event) => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    x = drag.x + event.clientX - drag.pointerX;
    y = drag.y + event.clientY - drag.pointerY;
    renderMap();
  });

  function stopDragging(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    drag = undefined;
    viewport.classList.remove("dragging");
  }

  viewport.addEventListener("pointerup", stopDragging);
  viewport.addEventListener("pointercancel", stopDragging);

  viewport.addEventListener("keydown", (event) => {
    const moves = { ArrowLeft: [48, 0], ArrowRight: [-48, 0], ArrowUp: [0, 48], ArrowDown: [0, -48] };
    if (!moves[event.key]) return;
    event.preventDefault();
    x += moves[event.key][0];
    y += moves[event.key][1];
    renderMap();
  });

  addEventListener("resize", resetMap);

  document.querySelectorAll("[data-dialog]").forEach((trigger) => {
    trigger.addEventListener("click", () => document.getElementById(trigger.dataset.dialog)?.showModal());
  });

  document.querySelectorAll("dialog").forEach((dialog) => {
    dialog.querySelector("[data-close]")?.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  });

  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const value = button.dataset.copy;
      try {
        await navigator.clipboard.writeText(value);
      } catch {
        const input = document.createElement("textarea");
        input.value = value;
        document.body.append(input);
        input.select();
        document.execCommand("copy");
        input.remove();
      }
      showToast(value);
    });
  });

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  // Scan the open sea, excluding the waterfall and the volcano's illustrated smoke.
  const sourceWaveAreas = [
    [0, 330, 260, 325], [0, 820, 420, 393],
    [1200, 470, 440, 743], [1640, 470, 280, 390], [1640, 1050, 280, 163],
  ];
  function prepareMapArtwork() {
    const canvas = document.querySelector(".map-artwork");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const picture = new Image();
    picture.onload = () => {
      context.drawImage(picture, 0, 0, MAP_WIDTH, MAP_HEIGHT);
      const source = context.getImageData(0, 0, MAP_WIDTH, MAP_HEIGHT);
      const cleaned = context.createImageData(source);
      cleaned.data.set(source.data);
      const ambience = document.querySelector(".map-ambience");
      const waves = context.createImageData(MAP_WIDTH, MAP_HEIGHT);
      const isSea = (offset) => source.data[offset + 2] > source.data[offset + 1] + 6
        && source.data[offset + 1] > source.data[offset] + 12
        && source.data[offset] < 165;
      const isOpenSea = (offset) => isSea(offset)
        && isSea(offset - 64) && isSea(offset + 64)
        && isSea(offset - 16 * MAP_WIDTH * 4)
        && isSea(offset + 16 * MAP_WIDTH * 4);
      function seaAround(position) {
        const neighbors = [position - 96, position + 96,
          position - 24 * MAP_WIDTH * 4, position + 24 * MAP_WIDTH * 4];
        const sea = [0, 0, 0];
        let count = 0;
        for (const neighbor of neighbors) {
          if (!isSea(neighbor)) continue;
          count++;
          for (let channel = 0; channel < 3; channel++) sea[channel] += source.data[neighbor + channel];
        }
        return count < 2 ? null : sea.map((value) => value / count);
      }
      for (const [x, sourceY, width, sourceHeight] of sourceWaveAreas) {
        const y = Math.round(sourceY * MAP_HEIGHT / 1213);
        const height = Math.round(sourceHeight * MAP_HEIGHT / 1213);
        const hits = new Uint8Array(width * height);
        for (let row = 0; row < height; row++) {
          for (let column = 0; column < width; column++) {
            const position = ((y + row) * MAP_WIDTH + x + column) * 4;
            const red = source.data[position];
            const green = source.data[position + 1];
            const blue = source.data[position + 2];
            const sea = seaAround(position);
            hits[row * width + column] = isOpenSea(position)
              && blue > green + 8 && green > red + 8
              && sea && red - sea[0] > 3 && green - sea[1] > 3 ? 1 : 0;
          }
        }
        for (let row = 2; row < height - 2; row++) {
          for (let column = 2; column < width - 2; column++) {
            let nearMark = false;
            for (let dy = -2; dy <= 2 && !nearMark; dy++) {
              for (let dx = -2; dx <= 2; dx++) {
                if (hits[(row + dy) * width + column + dx]) { nearMark = true; break; }
              }
            }
            if (!nearMark) continue;
            const position = ((y + row) * MAP_WIDTH + x + column) * 4;
            const sea = seaAround(position);
            if (!sea || !isOpenSea(position)) continue;
            for (let channel = 0; channel < 3; channel++) {
              cleaned.data[position + channel] = sea[channel];
              waves.data[position + channel] = source.data[position + channel];
            }
            waves.data[position + 3] = Math.min(210, Math.max(0,
              (source.data[position] - sea[0]) * 7));
          }
        }
      }
      if (!reducedMotion.matches) {
        const movingWaves = document.createElement("canvas");
        movingWaves.width = MAP_WIDTH;
        movingWaves.height = MAP_HEIGHT;
        movingWaves.className = "map-waves";
        movingWaves.getContext("2d").putImageData(waves, 0, 0);
        ambience.prepend(movingWaves);
      }

      for (let row = 892; row < 962; row++) {
        for (let column = 1672; column < 1852; column++) {
          const position = (row * MAP_WIDTH + column) * 4;
          const red = source.data[position];
          const green = source.data[position + 1];
          const blue = source.data[position + 2];
          if (red < 106 || green < 166 || blue < 183) continue;
          const left = (row * MAP_WIDTH + 1655) * 4;
          const right = (row * MAP_WIDTH + 1860) * 4;
          const across = (column - 1655) / 205;
          for (let channel = 0; channel < 3; channel++) {
            cleaned.data[position + channel] = source.data[left + channel] * (1 - across)
              + source.data[right + channel] * across;
          }
        }
      }
      // The lower wisp crosses the island; sample grass, not sea, behind those pixels.
      for (let row = 950; row < 1030; row++) {
        for (let column = 1695; column < 1785; column++) {
          const position = (row * MAP_WIDTH + column) * 4;
          const red = source.data[position];
          const green = source.data[position + 1];
          const grass = (row * MAP_WIDTH + column + 70) * 4;
          if (green < 170 || red - source.data[grass] < 8
            || source.data[position + 2] - source.data[grass + 2] < 0) continue;
          for (let channel = 0; channel < 3; channel++) cleaned.data[position + channel] = source.data[grass + channel];
        }
      }
      context.putImageData(cleaned, 0, 0);
    };
    picture.src = "/map-clean.png";
  }

  function launchTrain() {
    if (reducedMotion.matches || document.hidden) return;
    const route = RAIL_ROUTES[Math.floor(Math.random() * RAIL_ROUTES.length)];
    const track = document.createElementNS("http://www.w3.org/2000/svg", "path");
    track.setAttribute("d", route.path);
    const speed = track.getTotalLength() / route.seconds;
    const ambience = document.querySelector(".map-ambience");
    for (const [start, end, lag] of TRAIN_SLICES) {
      const car = document.createElement("span");
      car.className = "rail-car";
      car.style.width = `${(end - start) * 114 / 2172}px`;
      car.style.backgroundPositionX = `${-start * 114 / 2172}px`;
      car.style.offsetPath = `path("${route.path}")`;
      car.style.setProperty("--trip-duration", `${route.seconds}s`);
      car.style.animationDelay = `${lag / speed}s`;
      car.title = `${route.from} → ${route.to}`;
      car.addEventListener("animationend", () => car.remove(), { once: true });
      ambience.append(car);
    }
  }
  setTimeout(launchTrain, 4000);
  setInterval(launchTrain, 44000);

  setLanguage(language);
  resetMap();
  prepareMapArtwork();
}
