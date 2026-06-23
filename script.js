document.documentElement.classList.add("js");

const header = document.getElementById("siteHeader");
const nav = document.getElementById("mainNav");
const navToggle = document.getElementById("navToggle");

function updateHeader() {
  header.classList.toggle("is-scrolled", window.scrollY > 32);
}

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

navToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

document.querySelectorAll(".main-nav a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.14, rootMargin: "0px 0px -30px 0px" });

document.querySelectorAll(".reveal").forEach((item) => revealObserver.observe(item));

function createHeroCarousel(root) {
  const slides = Array.from(root.querySelectorAll(".hero-slide"));
  const prev = root.querySelector("[data-hero-prev]");
  const next = root.querySelector("[data-hero-next]");
  const dotsWrap = root.querySelector("[data-hero-dots]");
  let index = 0;
  let timer = null;

  slides.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `切换到第 ${i + 1} 张`);
    dot.addEventListener("click", () => show(i));
    dotsWrap.appendChild(dot);
  });

  const dots = Array.from(dotsWrap.children);

  function show(nextIndex) {
    index = (nextIndex + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.classList.toggle("is-active", i === index));
    dots.forEach((dot, i) => dot.classList.toggle("is-active", i === index));
  }

  function start() {
    stop();
    timer = window.setInterval(() => show(index + 1), 3000);
  }

  function stop() {
    if (timer) window.clearInterval(timer);
  }

  prev.addEventListener("click", () => show(index - 1));
  next.addEventListener("click", () => show(index + 1));
  root.addEventListener("mouseenter", stop);
  root.addEventListener("mouseleave", start);
  root.addEventListener("focusin", stop);
  root.addEventListener("focusout", start);
  show(0);
  start();
}

function createProductCarousel(root) {
  const track = root.querySelector(".product-grid");
  const prev = root.querySelector("[data-product-prev]");
  const next = root.querySelector("[data-product-next]");
  const originalCards = Array.from(root.querySelectorAll(".product-card"));
  let cards = [];
  let index = 0;
  let timer = null;
  let cloneCount = 0;
  let isMoving = false;

  function visibleCount() {
    return window.matchMedia("(max-width: 780px)").matches ? 2 : 4;
  }

  function setPosition(withTransition = true) {
    const count = visibleCount();
    const first = cards[0];
    const gap = Number.parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
    const itemWidth = first ? first.getBoundingClientRect().width + gap : 0;
    track.classList.toggle("no-transition", !withTransition);
    track.style.transform = `translateX(${-index * itemWidth}px)`;
    cards.forEach((card, i) => {
      card.classList.toggle("is-visible", i >= index && i < index + count);
    });
    if (!withTransition) {
      void track.offsetWidth;
      track.classList.remove("no-transition");
    }
  }

  function slideTo(nextIndex) {
    index = nextIndex;
    isMoving = true;
    setPosition(true);
  }

  function buildLoop() {
    cloneCount = visibleCount();
    track.replaceChildren();

    if (originalCards.length <= cloneCount) {
      originalCards.forEach((card) => {
        card.classList.add("is-visible");
        track.appendChild(card);
      });
      cards = Array.from(track.querySelectorAll(".product-card"));
      index = 0;
      track.style.transform = "translateX(0)";
      prev.disabled = true;
      next.disabled = true;
      return;
    }

    prev.disabled = false;
    next.disabled = false;
    const append = originalCards.slice(0, cloneCount).map((card) => card.cloneNode(true));
    [...originalCards, ...append].forEach((card, i) => {
      const isClone = i >= originalCards.length;
      card.classList.remove("is-visible");
      if (isClone) card.setAttribute("aria-hidden", "true");
      track.appendChild(card);
    });

    cards = Array.from(track.querySelectorAll(".product-card"));
    index = 0;
    setPosition(false);
  }

  function normalizeLoop() {
    if (index >= originalCards.length) {
      index = 0;
      setPosition(false);
    }
  }

  function move(step) {
    if (isMoving || originalCards.length <= visibleCount()) return;

    if (step < 0 && index === 0) {
      index = originalCards.length;
      setPosition(false);
      requestAnimationFrame(() => slideTo(originalCards.length - 1));
      return;
    }

    if (step > 0 && index >= originalCards.length) {
      index = 0;
      setPosition(false);
      requestAnimationFrame(() => slideTo(1));
      return;
    }

    slideTo(index + step);
  }

  function start() {
    stop();
    timer = window.setInterval(() => move(1), 3000);
  }

  function stop() {
    if (timer) window.clearInterval(timer);
  }

  prev.addEventListener("click", () => {
    move(-1);
    start();
  });
  next.addEventListener("click", () => {
    move(1);
    start();
  });
  root.addEventListener("mouseenter", stop);
  root.addEventListener("mouseleave", start);
  root.addEventListener("focusin", stop);
  root.addEventListener("focusout", start);
  track.addEventListener("transitionend", (event) => {
    if (event.propertyName !== "transform") return;
    normalizeLoop();
    isMoving = false;
  });
  window.addEventListener("resize", () => {
    if (cloneCount !== visibleCount()) buildLoop();
    else setPosition(false);
  }, { passive: true });
  buildLoop();
  start();
}

const hero = document.querySelector("[data-hero-carousel]");
if (hero) createHeroCarousel(hero);

document.querySelectorAll("[data-product-carousel]").forEach(createProductCarousel);
