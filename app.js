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

export function parallaxOffset(position, size, range = 10) {
  if (!Number.isFinite(position) || !Number.isFinite(size) || size <= 0) return 0;
  return Math.max(-range, Math.min(range, (position / size - 0.5) * range * 2));
}

if (typeof document !== "undefined") {
  const languageButton = document.querySelector(".language");
  const map = document.querySelector(".map");
  const toast = document.querySelector(".toast");
  let language = languageForPath(location.pathname);
  let toastTimer;

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

  if (matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches) {
    let frame;
    document.addEventListener("pointermove", (event) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        map.style.setProperty("--map-x", `${parallaxOffset(event.clientX, innerWidth)}px`);
        map.style.setProperty("--map-y", `${parallaxOffset(event.clientY, innerHeight)}px`);
      });
    });
    document.addEventListener("pointerleave", () => {
      map.style.setProperty("--map-x", "0px");
      map.style.setProperty("--map-y", "0px");
    });
  }

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
}
