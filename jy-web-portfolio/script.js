const header = document.querySelector('#siteHeader');
const menuToggle = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('#mobileMenu');
const progress = document.querySelector('.scroll-progress');
const navLinks = document.querySelectorAll('.desktop-nav a, .mobile-menu a');
const sections = document.querySelectorAll('main > section[id]');

function updateScroll() {
  header.classList.toggle('is-scrolled', window.scrollY > 20);
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = `scaleX(${scrollable > 0 ? window.scrollY / scrollable : 0})`;
  const marker = window.innerHeight * 0.35;
  const currentSection = Array.from(sections).find(section => {
    const bounds = section.getBoundingClientRect();
    return bounds.top <= marker && bounds.bottom > marker;
  });
  navLinks.forEach(link => {
    if (currentSection && link.hash === `#${currentSection.id}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}

let scrollFramePending = false;
window.addEventListener('scroll', () => {
  if (scrollFramePending) return;
  scrollFramePending = true;
  requestAnimationFrame(() => {
    updateScroll();
    scrollFramePending = false;
  });
}, { passive: true });
window.addEventListener('resize', updateScroll);
window.addEventListener('load', updateScroll);
updateScroll();

function closeMenu(returnFocus = false) {
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', '메뉴 열기');
  mobileMenu.classList.remove('is-open');
  if (returnFocus) menuToggle.focus();
}

menuToggle.addEventListener('click', () => {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? '메뉴 열기' : '메뉴 닫기');
  mobileMenu.classList.toggle('is-open', !isOpen);
});
mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => closeMenu());
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') closeMenu(true);
});
document.addEventListener('click', event => {
  if (!header.contains(event.target)) closeMenu();
});
window.matchMedia('(min-width: 821px)').addEventListener('change', event => {
  if (event.matches) closeMenu();
});

if ('IntersectionObserver' in window) {
  document.documentElement.classList.add('js-motion');
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(element => {
    if (element.dataset.delay) element.style.setProperty('--delay', `${element.dataset.delay}ms`);
    revealObserver.observe(element);
  });

}

// Decorative pointer effects run only for a mouse with motion enabled.
const pointerPreference = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
const mouseEffects = document.querySelector('.mouse-effects');
const sparkleLayer = document.querySelector('.sparkle-layer');
const cursorParts = mouseEffects.querySelectorAll('.cursor-aura, .cursor-ring, .cursor-heart');
const tiltCards = document.querySelectorAll('.hero-project, .website-preview, .featured-artwork');
let pointerFrame = 0;
let lastSparkle = 0;
let pointerX = 0;
let pointerY = 0;
let followX = 0;
let followY = 0;

function drawPointer() {
  followX += (pointerX - followX) * 0.22;
  followY += (pointerY - followY) * 0.22;
  cursorParts.forEach(part => {
    part.style.transform = `translate3d(${followX}px, ${followY}px, 0)`;
  });
  if (Math.abs(pointerX - followX) + Math.abs(pointerY - followY) > 0.4) {
    pointerFrame = requestAnimationFrame(drawPointer);
  } else {
    pointerFrame = 0;
  }
}

function movePointer(event) {
  if (event.pointerType !== 'mouse') return;
  pointerX = event.clientX;
  pointerY = event.clientY;
  if (!mouseEffects.classList.contains('is-visible')) {
    followX = pointerX;
    followY = pointerY;
  }
  mouseEffects.classList.add('is-visible');
  mouseEffects.classList.toggle('is-link', Boolean(event.target.closest('a, button')));
  mouseEffects.classList.toggle('is-project', Boolean(event.target.closest('.hero-project, .website-card > a')));
  if (!pointerFrame) pointerFrame = requestAnimationFrame(drawPointer);
  const now = performance.now();
  if (now - lastSparkle > 95 && sparkleLayer.childElementCount < 8) {
    lastSparkle = now;
    const spark = document.createElement('span');
    spark.className = 'cursor-spark';
    spark.textContent = Math.random() > 0.5 ? '♡' : '✧';
    spark.style.left = `${pointerX}px`;
    spark.style.top = `${pointerY}px`;
    spark.style.setProperty('--drift', `${(Math.random() - 0.5) * 40}px`);
    spark.addEventListener('animationend', () => spark.remove(), { once: true });
    sparkleLayer.append(spark);
  }
}

function resetTilt(event) {
  event.currentTarget.style.removeProperty('--tilt-x');
  event.currentTarget.style.removeProperty('--tilt-y');
}

function tiltCard(event) {
  if (event.pointerType !== 'mouse') return;
  const bounds = event.currentTarget.getBoundingClientRect();
  const x = Math.max(-0.5, Math.min(0.5, (event.clientX - bounds.left) / bounds.width - 0.5));
  const y = Math.max(-0.5, Math.min(0.5, (event.clientY - bounds.top) / bounds.height - 0.5));
  event.currentTarget.style.setProperty('--tilt-x', `${-y * 5}deg`);
  event.currentTarget.style.setProperty('--tilt-y', `${x * 5}deg`);
}

function hidePointer() {
  mouseEffects.classList.remove('is-visible', 'is-link', 'is-project');
  cancelAnimationFrame(pointerFrame);
  pointerFrame = 0;
  sparkleLayer.replaceChildren();
  tiltCards.forEach(card => {
    card.style.removeProperty('--tilt-x');
    card.style.removeProperty('--tilt-y');
  });
}

function syncPointerEffects() {
  document.removeEventListener('pointermove', movePointer);
  tiltCards.forEach(card => {
    card.removeEventListener('pointermove', tiltCard);
    card.removeEventListener('pointerleave', resetTilt);
  });
  hidePointer();
  document.documentElement.classList.toggle('pointer-effects', pointerPreference.matches);
  if (pointerPreference.matches) {
    document.addEventListener('pointermove', movePointer, { passive: true });
    tiltCards.forEach(card => {
      card.addEventListener('pointermove', tiltCard, { passive: true });
      card.addEventListener('pointerleave', resetTilt);
    });
  }
}

pointerPreference.addEventListener('change', syncPointerEffects);
document.documentElement.addEventListener('pointerleave', hidePointer);
window.addEventListener('blur', hidePointer);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) hidePointer();
});
syncPointerEffects();
