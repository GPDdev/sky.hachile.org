const english = /^\/m\/en(?:\/|$)/.test(location.pathname);
const language = english ? "en" : "zh";
const languageLink = document.querySelector(".language");
const toast = document.querySelector(".toast");
let toastTimer;

document.documentElement.lang = english ? "en" : "zh-CN";
document.querySelector(".route-canterlot").href = english
  ? "https://home.hachile.org/en/"
  : "https://home.hachile.org/";
document.querySelectorAll("[data-zh][data-en]").forEach((element) => {
  element.textContent = element.dataset[language];
});
languageLink.href = english ? "/m/" : "/m/en/";
languageLink.innerHTML = english ? "EN / <b>中</b>" : "<b>中</b> / EN";
languageLink.setAttribute("aria-label", english ? "切换到中文" : "Switch to English");

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
    toast.textContent = english ? `Copied: ${value}` : `已复制：${value}`;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
  });
});
