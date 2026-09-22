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

export const MAP_WIDTH = 1920;
export const MAP_HEIGHT = 1200;

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

  setLanguage(language);
  resetMap();
}
