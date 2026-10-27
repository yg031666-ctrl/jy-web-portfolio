const header = document.querySelector("#siteHeader");
const toggle = document.querySelector(".menu-toggle");
const menu = document.querySelector("#mobileMenu");
const navigation = document.querySelectorAll(".desktop-nav a, .mobile-menu a");
const sections = [...document.querySelectorAll("main > section[id]")];
const progress = document.querySelector(".scroll-progress");
const mobile = window.matchMedia("(max-width: 820px)");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const english = document.documentElement.lang === "en";
const menuLabels = english
  ? { open: "Open menu", close: "Close menu" }
  : { open: "메뉴 열기", close: "메뉴 닫기" };

document.querySelectorAll(".language-switch a").forEach((link) => {
  link.addEventListener("click", () => {
    const destination = new URL(link.href);
    destination.hash = window.location.hash;
    link.href = destination.href;
  });
});

function closeMenu(returnFocus = false) {
  menu.hidden = true;
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-label", menuLabels.open);
  if (returnFocus) toggle.focus();
}
toggle.addEventListener("click", () => {
  const open = toggle.getAttribute("aria-expanded") !== "true";
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? menuLabels.close : menuLabels.open);
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

// A quiet star field with occasional falling light. No interaction is intercepted.
(() => {
  const canvas = document.querySelector("#cosmosCanvas");
  const context = canvas.getContext("2d");
  if (!context) return;
  const compact = window.matchMedia("(max-width: 820px)");
  let width = 0;
  let height = 0;
  let stars = [];
  let frame = 0;
  let previous = 0;
  let nextLight = performance.now() + 2500;
  let fallingLight;

  function resizeSky() {
    width = window.innerWidth;
    height = window.innerHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = Math.min(
      compact.matches ? 75 : 160,
      Math.round((width * height) / 6500),
    );
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 0.35 + Math.random() * 1.05,
      phase: Math.random() * Math.PI * 2,
      alpha: 0.22 + Math.random() * 0.5,
    }));
    drawSky(performance.now(), false);
  }

  function drawSky(now, animated) {
    context.clearRect(0, 0, width, height);
    stars.forEach((star) => {
      const shimmer = animated
        ? 0.72 + 0.28 * Math.sin(now * 0.0008 + star.phase)
        : 0.8;
      context.beginPath();
      context.fillStyle = `rgba(238, 240, 248, ${star.alpha * shimmer})`;
      context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      context.fill();
      if (star.radius > 1.2) {
        context.strokeStyle = `rgba(245, 246, 255, ${star.alpha * shimmer * 0.4})`;
        context.lineWidth = 0.5;
        context.beginPath();
        context.moveTo(star.x - 3, star.y);
        context.lineTo(star.x + 3, star.y);
        context.moveTo(star.x, star.y - 3);
        context.lineTo(star.x, star.y + 3);
        context.stroke();
      }
    });
    if (!animated) return;
    if (now > nextLight) {
      fallingLight = {
        start: now,
        x: width * (0.4 + Math.random() * 0.5),
        y: height * 0.06,
      };
      nextLight = now + 9000 + Math.random() * 4000;
    }
    if (fallingLight) {
      const age = (now - fallingLight.start) / 1300;
      if (age > 1) {
        fallingLight = null;
        return;
      }
      const x = fallingLight.x - age * width * 0.4;
      const y = fallingLight.y + age * height * 0.45;
      const opacity = Math.sin(age * Math.PI) * 0.65;
      const gradient = context.createLinearGradient(x, y, x + 95, y - 65);
      gradient.addColorStop(0, `rgba(255,255,255,${opacity})`);
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      context.strokeStyle = gradient;
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + 95, y - 65);
      context.stroke();
    }
  }

  function tick(now) {
    const interval = compact.matches ? 66 : 40;
    if (now - previous >= interval) {
      drawSky(now, true);
      previous = now;
    }
    frame = requestAnimationFrame(tick);
  }
  function syncSky() {
    cancelAnimationFrame(frame);
    canvas.dataset.motion =
      !document.hidden && !reducedMotion.matches ? "active" : "paused";
    fallingLight = null;
    if (canvas.dataset.motion === "active") frame = requestAnimationFrame(tick);
    else drawSky(performance.now(), false);
  }
  window.addEventListener("resize", resizeSky);
  document.addEventListener("visibilitychange", syncSky);
  reducedMotion.addEventListener("change", syncSky);
  resizeSky();
  syncSky();
})();

// A precise light point follows the mouse; its halo and brief star trail drift behind.
(() => {
  const cursor = document.querySelector(".cosmic-cursor");
  const dot = cursor.querySelector(".cursor-dot");
  const halo = cursor.querySelector(".cursor-halo");
  const trail = document.querySelector(".cursor-trail");
  const precise = window.matchMedia("(hover: hover) and (pointer: fine)");
  const forcedColors = window.matchMedia("(forced-colors: active)");
  let x = 0,
    y = 0,
    followX = 0,
    followY = 0,
    frame = 0,
    lastSpark = 0;
  function hideCursor() {
    cancelAnimationFrame(frame);
    frame = 0;
    cursor.classList.remove("is-visible", "is-link");
    document.documentElement.classList.remove("cosmic-pointer");
    trail.replaceChildren();
  }
  function follow() {
    followX += (x - followX) * 0.22;
    followY += (y - followY) * 0.22;
    halo.style.transform = `translate3d(${followX}px,${followY}px,0)`;
    if (Math.abs(x - followX) + Math.abs(y - followY) > 0.1)
      frame = requestAnimationFrame(follow);
    else frame = 0;
  }
  document.addEventListener(
    "pointermove",
    (event) => {
      if (
        event.pointerType !== "mouse" ||
        !precise.matches ||
        reducedMotion.matches ||
        forcedColors.matches
      )
        return;
      x = event.clientX;
      y = event.clientY;
      if (!cursor.classList.contains("is-visible")) {
        followX = x;
        followY = y;
      }
      cursor.classList.add("is-visible");
      document.documentElement.classList.add("cosmic-pointer");
      cursor.classList.toggle(
        "is-link",
        Boolean(event.target.closest("a,button")),
      );
      dot.style.transform = `translate3d(${x}px,${y}px,0)`;
      if (!frame) frame = requestAnimationFrame(follow);
      const now = performance.now();
      if (now - lastSpark > 80 && trail.childElementCount < 9) {
        const spark = document.createElement("i");
        spark.className = "cursor-spark";
        spark.style.left = `${x}px`;
        spark.style.top = `${y}px`;
        spark.addEventListener("animationend", () => spark.remove(), {
          once: true,
        });
        trail.append(spark);
        lastSpark = now;
      }
    },
    { passive: true },
  );
  document.documentElement.addEventListener("pointerleave", hideCursor);
  document.addEventListener("keydown", hideCursor);
  document.addEventListener("visibilitychange", hideCursor);
  precise.addEventListener("change", hideCursor);
  reducedMotion.addEventListener("change", hideCursor);
  forcedColors.addEventListener("change", hideCursor);
})();
