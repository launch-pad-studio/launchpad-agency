/* =========================================================
   Launch Pad — interactions & scroll animations
   GSAP + ScrollTrigger + Lenis
   ========================================================= */
(function () {
  "use strict";

  // Respect the OS "reduce motion" setting, but allow ?motion=on to force the
  // full animated experience (useful for previewing on a reduce-motion machine).
  const params = new URLSearchParams(location.search);
  // Showcase site: animations are ON by default (the OS "reduce motion"
  // setting is NOT auto-honored, since the motion is core to the design).
  // Add ?motion=off to disable; ?motion=on is also still supported.
  const reduce = params.get("motion") === "off";
  const hasGSAP = window.gsap && window.ScrollTrigger;
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Lenis smooth scroll (own rAF loop — never hijack gsap.ticker) ---------- */
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
    if (hasGSAP) lenis.on("scroll", ScrollTrigger.update);
    const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  /* ---------- Anchor links via Lenis ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -70, duration: 1.1 });
      else target.scrollIntoView({ behavior: "smooth" });
    });
  });

  /* ---------- Nav scrolled state ---------- */
  const nav = document.getElementById("nav");
  const onScroll = () => {
    if (window.scrollY > 24) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- FAQ accordion (single open) ---------- */
  const faqs = document.querySelectorAll(".qa");
  faqs.forEach((qa) => {
    qa.addEventListener("toggle", () => {
      if (qa.open) faqs.forEach((o) => { if (o !== qa) o.open = false; });
      if (hasGSAP) ScrollTrigger.refresh();
    });
  });

  /* ---------- Testimonials carousel ---------- */
  (function carousel() {
    const track = document.querySelector(".tst__track");
    if (!track) return;
    const cards = track.querySelectorAll(".tcard");
    const arrows = document.querySelectorAll(".tst__arrow");
    let index = 0;
    const step = () => {
      const card = cards[0];
      const gap = parseFloat(getComputedStyle(track).gap) || 24;
      return card.getBoundingClientRect().width + gap;
    };
    const max = () => Math.max(0, cards.length - 1);
    const rtl = document.documentElement.dir === "rtl";
    const apply = () => { track.style.transform = `translateX(${(rtl ? 1 : -1) * index * step()}px)`; };
    arrows.forEach((b) =>
      b.addEventListener("click", () => {
        const dir = parseInt(b.dataset.dir, 10);
        index = Math.min(max(), Math.max(0, index + dir));
        apply();
      })
    );
    window.addEventListener("resize", apply);
  })();

  /* ---------- Service glass icons — pointer parallax tilt ---------- */
  if (!reduce) {
    document.querySelectorAll(".workcard").forEach((card) => {
      const shot = card.querySelector(".svc-shot");
      if (!shot) return;
      let raf = null, tx = 0, ty = 0, rx = 0, ry = 0;
      const apply = () => {
        raf = null;
        shot.style.transform =
          `translate3d(${tx}px,${ty}px,0) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.08)`;
      };
      card.addEventListener("pointermove", (e) => {
        if (e.pointerType === "touch") return; // no tilt on touch (no hover)
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;  // -0.5..0.5
        const py = (e.clientY - r.top) / r.height - 0.5;
        tx = px * 30; ty = py * 30;
        ry = px * 15; rx = -py * 15;
        if (!raf) raf = requestAnimationFrame(apply);
      });
      const reset = () => {
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        tx = ty = rx = ry = 0;
        shot.style.transform = "";
      };
      card.addEventListener("pointerleave", reset);
      card.addEventListener("pointercancel", reset);
    });
  }

  if (!hasGSAP) return; // animations below need GSAP

  /* ---------- Count-up stats ---------- */
  function countUp(el) {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    if (isNaN(target) || suffix.charAt(0) === "→") return; // skip non-numeric (→)
    if (document.hidden) { el.textContent = Math.round(target) + suffix; return; } // bg tab: no rAF
    const obj = { v: 0 };
    gsap.to(obj, {
      v: target, duration: 1.6, ease: "power2.out",
      onUpdate() { el.textContent = Math.round(obj.v) + suffix; },
    });
  }
  if (!reduce) {
    document.querySelectorAll("[data-count]").forEach((el) => {
      ScrollTrigger.create({ trigger: el, start: "top 88%", once: true, onEnter: () => countUp(el) });
    });
  }

  /* ---------- Generic scroll reveal ---------- */
  const revealSel =
    ".section-title,.section-sub,.workcard,.step,.srv,.compare,.tcard,.post,.qa," +
    ".int-tile,.bigstat,.logos__label,.logos__grid,.works__intro .pill,.how__head .pill," +
    ".integration .pill,.services__sticky .pill,.why .pill,.tst__head .pill,.blog__head .pill," +
    ".faq__head .pill,.cta .pill,.quote .pill,.quote__note,.works__more,.tst__nav";
  const revealEls = Array.from(document.querySelectorAll(revealSel)).filter(
    (el) => !el.closest("#hero") && !el.closest(".pain")
  );
  if (!reduce) {
    gsap.set(revealEls, { opacity: 0, y: 26 });
    ScrollTrigger.batch(revealEls, {
      start: "top 90%",
      onEnter: (batch) =>
        gsap.to(batch, { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: "power3.out", overwrite: true }),
    });
  }

  /* ---------- Text scramble / decode (similar to the reference nav hover) ---------- */
  function TextScramble(el) {
    const chars = "!<>-_/\\[]:;.·^|*+=";
    let frameRequest, frame, queue = [], resolve;
    const update = () => {
      let output = "", complete = 0;
      for (let i = 0; i < queue.length; i++) {
        let { from, to, start, end, char } = queue[i];
        if (frame >= end) { complete++; output += to; }
        else if (frame >= start) {
          if (!char || Math.random() < 0.22) { char = chars[Math.floor(Math.random() * chars.length)]; queue[i].char = char; }
          output += '<span class="dud">' + char + "</span>";
        } else { output += from; }
      }
      el.innerHTML = output;
      if (complete === queue.length) { resolve && resolve(); }
      else { frameRequest = requestAnimationFrame(update); frame++; }
    };
    this.setText = (newText) => {
      const old = el.textContent;
      const len = Math.max(old.length, newText.length);
      const p = new Promise((r) => (resolve = r));
      queue = [];
      for (let i = 0; i < len; i++) {
        const start = Math.floor(Math.random() * 70);
        const end = start + Math.floor(Math.random() * 70) + 24;
        queue.push({ from: old[i] || "", to: newText[i] || "", start, end });
      }
      cancelAnimationFrame(frameRequest); frame = 0; update(); return p;
    };
  }

  if (!reduce) {
    // lock the box width during a scramble so it never reflows / stretches sideways
    const runScramble = (el, fx, text) => {
      el.style.width = el.offsetWidth + "px";
      return fx.setText(text).then(() => { el.style.width = ""; });
    };
    // hover decode on nav links + nav CTA (matches the reference)
    document.querySelectorAll(".nav__links a, .nav__cta").forEach((el) => {
      const text = el.textContent, fx = new TextScramble(el);
      let busy = false;
      el.addEventListener("mouseenter", () => {
        if (busy) return;
        busy = true;
        runScramble(el, fx, text).then(() => { busy = false; });
      });
    });
    // decode-in on scroll for the mono eyebrow labels + pills
    document.querySelectorAll(".hero__services li, .pill, .logos__label").forEach((el) => {
      const text = el.textContent, fx = new TextScramble(el);
      ScrollTrigger.create({
        trigger: el, start: "top 94%", once: true,
        onEnter: () => { if (document.hidden) { el.textContent = text; return; } runScramble(el, fx, text); },
      });
    });
  }

  /* ---------- HERO intro ---------- */
  (function heroIntro() {
    const hero = document.getElementById("hero");
    if (!hero) return;
    if (reduce) return; // content visible by default; no entrance animation
    const lines = hero.querySelectorAll(".hero__title .line");
    const rings = hero.querySelectorAll(".hero__rings .ring");
    const corners = [
      hero.querySelector(".hero__services"),
      hero.querySelector(".hero__desc"),
      hero.querySelector(".hero__headline .pill"),
      hero.querySelector(".talkcard"),
    ].filter(Boolean);

    gsap.set(rings, { opacity: 0 }); // opacity only — rings keep their CSS centering transform
    gsap.set(lines, { yPercent: 120, opacity: 0 });
    gsap.set(corners, { opacity: 0, y: 18 });

    const tl = gsap.timeline({ defaults: { ease: "power3.out" }, delay: 0.15 });
    tl.to(rings, { opacity: 1, duration: 1.4, stagger: 0.08, ease: "power2.out" }, 0)
      .to(lines, { yPercent: 0, opacity: 1, duration: 0.9, stagger: 0.1 }, 0.25)
      .to(corners, { opacity: 1, y: 0, duration: 0.8, stagger: 0.12 }, 0.5);

    // slow continuous ring rotation
    gsap.to(hero.querySelector(".hero__rings"), { rotate: 360, duration: 160, repeat: -1, ease: "none" });
  })();

  /* ---------- PAIN POINT — pinned orbit reveal ---------- */
  (function painOrbit() {
    const pain = document.querySelector(".pain");
    if (!pain) return;
    const pills = gsap.utils.toArray(".pain-pill");
    const inners = gsap.utils.toArray(".pain-pill__inner");
    const orbit = pain.querySelector(".pain__orbit");
    gsap.set(pills, { opacity: 0 }); // opacity only — pills keep their CSS orbit transform
    if (reduce) { gsap.set(pills, { opacity: 1 }); return; } // show statically

    // reveal pills + rotate the whole ring system as you scroll through the pinned section
    const tl = gsap.timeline({
      scrollTrigger: { trigger: pain, start: "top top", end: "bottom bottom", scrub: 0.6 },
    });
    if (orbit) tl.to(orbit, { rotate: 150, ease: "none" }, 0);
    pills.forEach((p, i) => {
      tl.to(p, { opacity: 1, duration: 0.5, ease: "power2.out" }, 0.08 + i * 0.12);
    });

    // the rings constantly drift — different speeds + directions give a spiral feel (never static)
    if (orbit) {
      gsap.utils.toArray(orbit.querySelectorAll(".ring")).forEach((r, i) => {
        gsap.to(r, { rotate: i % 2 ? "-=360" : "+=360", duration: 22 + i * 11, repeat: -1, ease: "none" });
      });
    }

    // each pill floats gently up/down, out of phase — like bobbing on water
    inners.forEach((el, i) => {
      gsap.fromTo(
        el,
        { y: -(4 + (i % 3) * 2) },
        { y: 4 + (i % 3) * 2, duration: 2.6 + (i % 4) * 0.5, repeat: -1, yoyo: true, ease: "sine.inOut", delay: i * 0.3 }
      );
    });
  })();

  /* ---------- OUR WORKS — stacked card depth ---------- */
  (function worksStack() {
    if (reduce) return;
    const cards = gsap.utils.toArray(".workcard");
    cards.forEach((card, i) => {
      if (i === cards.length - 1) return;
      ScrollTrigger.create({
        trigger: cards[i + 1],
        start: "top bottom",
        end: "top top",
        scrub: true,
        onUpdate(self) {
          const p = self.progress;
          gsap.set(card, { scale: 1 - p * 0.07, filter: `brightness(${1 - p * 0.35})` });
        },
      });
    });
  })();

  /* ---------- Hide the nav while scrolling through the works section ---------- */
  (function navHideOnWorks() {
    const works = document.querySelector(".works");
    if (!works || !nav) return;
    ScrollTrigger.create({
      trigger: works,
      start: "top top",
      end: "bottom bottom",
      onToggle: (self) => nav.classList.toggle("nav--hidden", self.isActive),
    });
  })();

  /* ---------- Services media parallax (subtle) ---------- */
  if (!reduce) {
    gsap.utils.toArray(".srv__media .media-noise").forEach((m) => {
      gsap.to(m, {
        yPercent: 12,
        ease: "none",
        scrollTrigger: { trigger: m.closest(".srv"), start: "top bottom", end: "bottom top", scrub: true },
      });
    });
  }

  /* ---------- INTEGRATION — neon tiles light up one at a time ---------- */
  if (!reduce) {
    const tiles = gsap.utils.toArray(".int-tile");
    if (tiles.length) {
      let prev = -1, timer = null;
      const step = () => {
        tiles.forEach((t) => t.classList.remove("is-lit"));
        let n = Math.floor(Math.random() * tiles.length);
        if (tiles.length > 1 && n === prev) n = (n + 1) % tiles.length; // never light the same tile twice in a row
        prev = n;
        tiles[n].classList.add("is-lit");
      };
      const start = () => { if (!timer) { step(); timer = setInterval(step, 2600); } };
      const stop = () => { clearInterval(timer); timer = null; tiles.forEach((t) => t.classList.remove("is-lit")); };
      // only cycle while the section is on screen
      ScrollTrigger.create({
        trigger: ".integration", start: "top 80%", end: "bottom 20%",
        onEnter: start, onEnterBack: start, onLeave: stop, onLeaveBack: stop,
      });
    }
  }

  /* ---------- Failsafe: never leave entrance content hidden ----------
     If requestAnimationFrame never pumps (e.g. the page loads in a
     background tab and gsap's ticker is paused), reveal everything so the
     content is never permanently stuck behind an animation. */
  if (!reduce) {
    const failsafe = () => {
      gsap.set(".hero__rings .ring,.pain-pill", { opacity: 1 }); // opacity only (CSS transforms)
      const els = document.querySelectorAll(
        ".hero__services,.hero__desc,.hero__title .line,.talkcard,.hero .pill," + revealSel
      );
      gsap.set(els, { opacity: 1, y: 0, yPercent: 0 });
    };
    setTimeout(() => { if (gsap.ticker.frame < 5) failsafe(); }, 1800);
  }

  /* ---------- refresh after fonts/layout ---------- */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
  window.addEventListener("load", () => ScrollTrigger.refresh());

  /* ---------- Hamburger / mobile menu ---------- */
  const ham = document.getElementById("nav-ham");
  const mobMenu = document.getElementById("mob-menu");
  if (ham && mobMenu) {
    const openMenu = () => {
      mobMenu.classList.add("open");
      ham.classList.add("open");
      ham.setAttribute("aria-expanded", "true");
      mobMenu.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    };
    const closeMenu = () => {
      mobMenu.classList.remove("open");
      ham.classList.remove("open");
      ham.setAttribute("aria-expanded", "false");
      mobMenu.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    };
    ham.addEventListener("click", () =>
      mobMenu.classList.contains("open") ? closeMenu() : openMenu()
    );
    mobMenu.querySelectorAll(".mob-menu__link, #mob-cta, #mob-close").forEach(el =>
      el.addEventListener("click", closeMenu)
    );
  }
})();
