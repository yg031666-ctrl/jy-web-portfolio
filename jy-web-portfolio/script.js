const header = document.querySelector("#siteHeader");
const toggle = document.querySelector(".menu-toggle");
const menu = document.querySelector("#mobileMenu");
const navigation = document.querySelectorAll(".desktop-nav a, .mobile-menu a");
const sections = [...document.querySelectorAll("main > section[id]")];
const progress = document.querySelector(".scroll-progress");
const mobile = window.matchMedia("(max-width: 820px)");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function closeMenu(returnFocus = false) {
  menu.hidden = true;
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-label", "메뉴 열기");
  if (returnFocus) toggle.focus();
}
toggle.addEventListener("click", () => {
  const open = toggle.getAttribute("aria-expanded") !== "true";
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
  menu.hidden = !open;
});
menu.addEventListener("click", (event) => {
  const link = event.target.closest("a");
  if (!link) return;
  closeMenu();
  const target = document.querySelector(link.hash);
  if (target) {
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    target.addEventListener("blur", () => target.removeAttribute("tabindex"), {
      once: true,
    });
  }
});
document.addEventListener("keydown", (event) => {
  if (menu.hidden) return;
  if (event.key === "Escape") closeMenu(true);
  if (event.key === "Tab") {
    const controls = [toggle, ...menu.querySelectorAll("a")];
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});
document.addEventListener("click", (event) => {
  if (!header.contains(event.target)) closeMenu();
});
mobile.addEventListener("change", () => closeMenu());

let framePending = false;
function updateScroll() {
  const distance = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = `scaleX(${distance > 0 ? Math.min(1, window.scrollY / distance) : 0})`;
  const marker = window.innerHeight * 0.4;
  const current = sections.find((section) => {
    const rect = section.getBoundingClientRect();
    return rect.top <= marker && rect.bottom > marker;
  });
  navigation.forEach((link) => {
    if (current && link.hash === `#${current.id}`)
      link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
  framePending = false;
}
window.addEventListener(
  "scroll",
  () => {
    if (!framePending) {
      framePending = true;
      requestAnimationFrame(updateScroll);
    }
  },
  { passive: true },
);
window.addEventListener("resize", updateScroll);
window.addEventListener("load", updateScroll);
updateScroll();

let observer;
function setupReveals() {
  observer?.disconnect();
  document.documentElement.classList.remove("js-motion");
  if (reducedMotion.matches || !("IntersectionObserver" in window)) return;
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.06 },
  );
  document
    .querySelectorAll(".reveal")
    .forEach((element) => observer.observe(element));
  document.documentElement.classList.add("js-motion");
}
reducedMotion.addEventListener("change", setupReveals);
setupReveals();
