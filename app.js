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

// Survey points on the printed rail centreline in 1920 × 1200 map coordinates.
function trip(from, to, seconds, survey, tunnels = []) {
  const p = survey.split(" ").map(pair => pair.split(",").map(Number));
  let path = `M ${p[0].join(" ")}`;
  for (let i = 1; i < p.length; i++) {
    const a = p[i - 1], b = p[i], prev = p[i - 2] || a, next = p[i + 1] || b;
    const handles = [0, 1].map(k => a[k] + (b[k] - prev[k]) / 6);
    handles.push(...[0, 1].map(k => b[k] - (next[k] - a[k]) / 6));
    path += ` C ${handles.map(v => v.toFixed(1)).join(" ")} ${b.join(" ")}`;
  }
  return { from, to, seconds, path, tunnels };
}

const westOfCanterlot = "370,463 383,471 395,490 408,505 428,514 467,513 515,516 551,520 581,527 601,543 615,556 642,563 678,566 705,570 728,580 744,589";
const southOfCanterlot = "842,626 855,634 874,653 894,663 925,667 959,669";
const ghastlyGorge = "590,736 596,748 611,759 641,775 663,792 697,815 730,828";
export const RAIL_ROUTES = [
  trip("Los Pegasus", "Ponyville", 34, "337,793 335,781 338,758 337,744 328,728 329,723 341,718 346,707 356,705 384,705 416,699 442,692 454,684 466,671 483,666 508,667 535,666 565,672 623,682 660,688", [[566,665]]),
  trip("Ponyville", "Appleloosa", 30, `658,690 633,697 611,706 595,715 591,723 ${ghastlyGorge} 748,839 758,853 763,867 764,882 773,896 778,908`),
  trip("Mysterious South", "Appleloosa", 24, "785,1144 785,1129 792,1108 792,1091 787,1062 787,1034 786,1018 779,999 783,977 780,959 773,946 774,929 778,909 775,898 766,886 763,873"),
  trip("Dodge City", "Ponyville", 34, "962,855 941,855 911,851 878,840 848,833 821,831 798,832 758,834 730,828 697,815 663,792 641,775 611,759 596,748 590,736 591,723 595,715 611,706 633,697 658,690"),
  trip("Vanhoover", "Canterlot", 39, `239,483 263,479 284,479 306,487 321,486 336,470 353,465 ${westOfCanterlot}`, [[602,611]]),
  trip("Crystal Empire", "Canterlot", 45, `751,318 723,318 601,326 583,329 552,338 528,344 516,358 511,380 504,393 426,417 388,424 361,432 349,440 349,448 356,456 ${westOfCanterlot}`, [[428,503,440],[602,723,380]]),
  trip("Canterlot", "Manehattan", 36, "834,582 847,575 857,563 862,549 868,538 887,527 911,517 931,516 955,517 984,520 1004,521 1039,517 1069,512 1097,515 1104,517 1206,526 1229,533 1248,532 1265,525 1290,511 1308,506 1332,506", [[1103,1205]]),
  trip("Canterlot", "Fillydelphia", 27, `${southOfCanterlot} 976,657 997,643 1011,639 1037,640 1060,649 1073,649 1092,645 1105,644 1129,650 1150,653 1169,653`),
  trip("Canterlot", "Baltimare", 34, `${southOfCanterlot} 977,672 997,681 1011,694 1012,708 1018,719 1038,730 1066,737 1091,738 1118,738 1142,744 1167,752 1200,757 1235,760 1253,761`),
  trip("Crystal Mountains", "Griffonstone Station", 46, "1020,307 1050,307 1087,304 1125,296 1154,298 1181,292 1204,283 1230,282 1249,287 1263,301 1284,308 1318,312 1355,320 1390,323 1436,323 1452,322 1541,326 1571,335 1604,347 1620,353 1659,353 1697,351 1720,354 1735,361 1746,373 1747,386 1742,406 1743,426 1750,441", [[1451,1541]]),
];

// The original artwork is 2172 × 724; wheel rims touch row 568.
const TRAIN_SCALE = .058;
const TRAIN_TOP = 137;
const WHEEL_LINE = 568;
export const TRAIN_SLICES = [
  [1610, 2127], [1260, 1610], [933, 1260], [650, 933], [345, 650], [48, 345],
];

// Two points on the rail define each car's rigid wheelbase, including on bends.
export function carPose(front, rear, facing) {
  const dx = front.x - rear.x, dy = front.y - rear.y;
  const span = Math.hypot(dx, dy) || 1;
  const along = dx / span, slope = dy / span;
  return {
    x: (front.x + rear.x) / 2, y: (front.y + rear.y) / 2,
    // Steep rails lean into the perspective of the illustration. Roofs stay above the wheels.
    a: along, b: slope, c: -slope * facing * .52, d: .82 + .18 * Math.abs(along),
  };
}

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

  let activeTrain;
  function launchTrain() {
    if (activeTrain || reducedMotion.matches || document.hidden) return;
    const route = RAIL_ROUTES[Math.floor(Math.random() * RAIL_ROUTES.length)];
    const track = document.createElementNS("http://www.w3.org/2000/svg", "path");
    track.setAttribute("d", route.path);
    const length = track.getTotalLength();
    // Cache the expensive SVG measurements once; interpolate between two-pixel samples.
    const count = Math.ceil(length / 2);
    const points = Array.from({ length: count + 1 }, (_, i) => track.getPointAtLength(i * length / count));
    function pointAt(distance) {
      const sample = clamp(distance * count / length, 0, count);
      const i = Math.min(count - 1, Math.floor(sample)), t = sample - i;
      return { x: points[i].x * (1 - t) + points[i + 1].x * t, y: points[i].y * (1 - t) + points[i + 1].y * t };
    }
    const consist = document.createElement("div");
    consist.className = "rail-trip";
    if (route.tunnels.length) {
      const holes = route.tunnels.map(([x1, x2, floor = MAP_HEIGHT]) => `M${x1} 0H${x2}V${floor}H${x1}Z`);
      consist.style.clipPath = `path(evenodd, "M0 0H${MAP_WIDTH}V${MAP_HEIGHT}H0Z ${holes.join(" ")}")`;
    }
    let trainLength = 0;
    const cars = TRAIN_SLICES.map(([left, right]) => {
      const node = document.createElement("span");
      const width = (right - left) * TRAIN_SCALE;
      const offset = trainLength + width / 2;
      trainLength += width;
      node.className = "rail-car";
      node.style.width = `${width}px`;
      node.style.height = `${(WHEEL_LINE - TRAIN_TOP + 2) * TRAIN_SCALE}px`;
      node.style.backgroundSize = `${2172 * TRAIN_SCALE}px auto`;
      node.style.backgroundPosition = `${-left * TRAIN_SCALE}px ${-TRAIN_TOP * TRAIN_SCALE}px`;
      consist.append(node);
      return { node, width, offset, facing: Math.sign(points[count].x - points[0].x) || 1 };
    });
    document.querySelector(".map-ambience").append(consist);
    activeTrain = consist;
    const started = performance.now();
    let lastChuff = -Infinity;
    function frame(now) {
      const t = clamp((now - started) / (route.seconds * 1000), 0, 1);
      if (t === 1 || reducedMotion.matches || document.hidden) {
        consist.remove();
        activeTrain = null;
        return;
      }
      // Ease the whole consist together. Each carriage retains a fixed coupling distance.
      const travel = (length + trainLength) * (t - .65 * Math.sin(2 * Math.PI * t) / (2 * Math.PI));
      for (const car of cars) {
        const station = travel - car.offset;
        car.node.hidden = station <= 0 || station >= length;
        if (car.node.hidden) continue;
        const front = pointAt(station + car.width * .30), rear = pointAt(station - car.width * .30);
        if (Math.abs(front.x - rear.x) > car.width * .2) car.facing = Math.sign(front.x - rear.x);
        const { x, y, a, b, c, d } = carPose(front, rear, car.facing);
        const wheelY = (WHEEL_LINE - TRAIN_TOP) * TRAIN_SCALE;
        car.node.style.transform = `matrix(${a},${b},${c},${d},${x - a * car.width / 2 - c * wheelY},${y - b * car.width / 2 - d * wheelY})`;
        car.node.style.opacity = clamp(Math.min(station, length - station) / car.width, 0, 1);
        car.node.style.zIndex = Math.round(y);
        if (car === cars[0] && station > car.width && length - station > car.width && now - lastChuff > 860) {
          const steam = document.createElement("span");
          steam.className = "rail-steam";
          const chimneyX = car.width * .25, chimneyY = -wheelY * .95;
          steam.style.left = `${x + a * chimneyX + c * chimneyY}px`;
          steam.style.top = `${y + b * chimneyX + d * chimneyY}px`;
          steam.addEventListener("animationend", () => steam.remove(), { once: true });
          consist.append(steam);
          lastChuff = now;
        }
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  setTimeout(launchTrain, 4000);
  setInterval(launchTrain, 44000);

  setLanguage(language);
  resetMap();
  prepareWaves();
}
