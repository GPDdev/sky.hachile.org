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

// Traced against the map: route endpoints sit on the visible rail, near each place.
export const RAIL_ROUTES = [
  { from: "Los Pegasus", to: "Ponyville", path: "M 338 790 C 336 762 335 738 340 717 C 347 679 375 646 410 640 C 451 638 473 655 502 667 C 529 678 555 679 581 665 C 612 654 647 669 671 685", seconds: 39 },
  { from: "Ponyville", to: "Appleloosa", path: "M 671 685 C 630 693 601 706 590 727 C 579 749 611 771 651 794 C 692 818 737 835 774 843", seconds: 31 },
  { from: "Mysterious South", to: "Appleloosa", path: "M 786 1130 C 782 1060 781 973 778 890 C 777 870 775 851 773 843", seconds: 26 },
  { from: "Appleloosa", to: "Dodge City", path: "M 774 843 C 813 838 855 840 902 845 C 932 846 959 845 982 844", seconds: 19 },
  { from: "Vanhoover", to: "Canterlot", path: "M 224 481 C 271 487 304 491 334 481 C 354 473 379 473 394 490 C 419 516 452 515 490 517 C 530 518 558 527 580 544 C 629 569 680 579 741 579", seconds: 42 },
  { from: "Crystal Empire", to: "Vanhoover", path: "M 746 320 C 685 329 635 326 590 328 C 542 326 517 340 513 376 C 509 404 480 417 440 424 C 392 432 355 418 348 441 C 339 460 351 477 371 486 C 328 493 275 489 224 481", seconds: 43 },
  { from: "Canterlot", to: "Manehattan", path: "M 827 549 C 845 529 865 516 905 514 C 945 512 973 518 1006 529 C 1035 535 1053 526 1076 518 C 1122 511 1150 518 1184 526 C 1220 538 1254 541 1281 531 C 1315 520 1344 516 1371 527", seconds: 38 },
  { from: "Canterlot", to: "Fillydelphia", path: "M 780 628 C 811 637 827 652 856 655 C 902 665 946 669 982 663 C 1018 661 1045 640 1072 630 C 1104 623 1124 633 1155 644 C 1178 651 1200 648 1213 645", seconds: 39 },
  { from: "Canterlot", to: "Baltimare", path: "M 780 628 C 811 637 827 652 856 655 C 902 665 946 669 982 663 C 1009 661 1015 684 1012 704 C 1010 726 1045 738 1086 740 C 1151 745 1211 756 1260 765", seconds: 40 },
  { from: "Crystal Mountains", to: "Griffonstone Station", path: "M 1016 309 C 1086 308 1109 291 1150 288 C 1185 287 1192 315 1230 316 C 1300 327 1389 326 1458 333 C 1507 330 1530 344 1578 347 C 1632 348 1694 350 1745 372", seconds: 47 },
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
  const loadImage = (src) => new Promise((resolve, reject) => {
    const picture = new Image();
    picture.onload = () => resolve(picture);
    picture.onerror = reject;
    picture.src = src;
  });

  function prepareBoats() {
    loadImage("/boat.jpg").then((picture) => {
      const canvas = document.createElement("canvas");
      canvas.width = picture.width;
      canvas.height = picture.height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.drawImage(picture, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      const removed = new Uint8Array(canvas.width * canvas.height);
      const queue = [];
      const isWhite = (index) => {
        const offset = index * 4;
        const colors = pixels.data.subarray(offset, offset + 3);
        return Math.min(...colors) > 218 && Math.max(...colors) - Math.min(...colors) < 25;
      };
      const enqueue = (index) => {
        if (index < 0 || index >= removed.length || removed[index] || !isWhite(index)) return;
        removed[index] = 1;
        queue.push(index);
      };
      for (let x = 0; x < canvas.width; x++) {
        enqueue(x);
        enqueue((canvas.height - 1) * canvas.width + x);
      }
      for (let y = 0; y < canvas.height; y++) {
        enqueue(y * canvas.width);
        enqueue(y * canvas.width + canvas.width - 1);
      }
      for (let cursor = 0; cursor < queue.length; cursor++) {
        const index = queue[cursor];
        const x = index % canvas.width;
        if (x > 0) enqueue(index - 1);
        if (x < canvas.width - 1) enqueue(index + 1);
        if (index >= canvas.width) enqueue(index - canvas.width);
        if (index < removed.length - canvas.width) enqueue(index + canvas.width);
      }
      let left = canvas.width, top = canvas.height, right = 0, bottom = 0;
      for (let index = 0; index < removed.length; index++) {
        if (removed[index]) pixels.data[index * 4 + 3] = 0;
        else {
          const x = index % canvas.width, y = Math.floor(index / canvas.width);
          left = Math.min(left, x); top = Math.min(top, y);
          right = Math.max(right, x); bottom = Math.max(bottom, y);
        }
      }
      context.putImageData(pixels, 0, 0);
      for (const boat of document.querySelectorAll(".bobbing-boat")) {
        boat.width = right - left + 1;
        boat.height = bottom - top + 1;
        boat.getContext("2d").drawImage(canvas, left, top, boat.width, boat.height, 0, 0, boat.width, boat.height);
      }
    }).catch((error) => console.warn("Boat artwork could not load", error));
  }

  function prepareWaves() {
    loadImage("/newnewmap.png").then((picture) => {
      const source = document.createElement("canvas");
      source.width = MAP_WIDTH;
      source.height = MAP_HEIGHT;
      const context = source.getContext("2d", { willReadFrequently: true });
      context.drawImage(picture, 0, 0, MAP_WIDTH, MAP_HEIGHT);
      // Three original wave clusters, with only their pale strokes kept.
      const sprites = [
        [1412, 491, 54, 29], [1513, 607, 63, 31], [1455, 964, 56, 31],
      ].map(([x, y, width, height]) => {
        const sprite = document.createElement("canvas");
        sprite.width = width;
        sprite.height = height;
        const pixels = context.getImageData(x, y, width, height);
        const red = [], green = [];
        for (let offset = 0; offset < pixels.data.length; offset += 4) {
          red.push(pixels.data[offset]);
          green.push(pixels.data[offset + 1]);
        }
        red.sort((a, b) => a - b);
        green.sort((a, b) => a - b);
        const baseRed = red[Math.floor(red.length * .35)];
        const baseGreen = green[Math.floor(green.length * .35)];
        for (let offset = 0; offset < pixels.data.length; offset += 4) {
          const lift = Math.min(pixels.data[offset] - baseRed, pixels.data[offset + 1] - baseGreen);
          pixels.data[offset + 3] = Math.min(255, Math.max(0, (lift - 5) * 16));
        }
        sprite.getContext("2d").putImageData(pixels, 0, 0);
        return sprite.toDataURL("image/png");
      });
      const lanes = [
        [510, 590, 1415, 1580], [590, 730, 1370, 1580],
        [730, 830, 1400, 1560], [830, 880, 1430, 1600],
        [880, 940, 1430, 1710], [940, 990, 1430, 1630],
        [990, 1030, 1430, 1550],
      ];
      const ambience = document.querySelector(".map-ambience");
      const spawn = () => {
        if (!document.hidden && !reducedMotion.matches) {
          const [top, bottom, left, right] = lanes[Math.floor(Math.random() * lanes.length)];
          const variant = Math.floor(Math.random() * sprites.length);
          const wave = document.createElement("img");
          wave.className = "drifting-wave";
          wave.src = sprites[variant];
          wave.alt = "";
          wave.style.left = `${left}px`;
          wave.style.top = `${top + Math.random() * (bottom - top)}px`;
          wave.style.setProperty("--wave-distance", `${right - left - [54, 63, 56][variant]}px`);
          wave.style.setProperty("--wave-duration", `${14 + Math.random() * 7}s`);
          wave.addEventListener("animationend", () => wave.remove(), { once: true });
          ambience.append(wave);
        }
        setTimeout(spawn, 2600 + Math.random() * 2800);
      };
      setTimeout(spawn, 700);
    }).catch((error) => console.warn("Wave artwork could not load", error));
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
  prepareBoats();
  prepareWaves();
}
