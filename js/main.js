document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("main-nav--open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  initHeaderOffset();
  initSmoothScroll();
  initStoryReveal();
  initStickerTravel();
  initMenuPanels();
  initExploreDrag();
  initMenuSubnavPin();
  initSubnavDrag();
  initHashScroll();
  initTimelineTabs();
  initScrollNextButtons();
  initPageHero();
  initNavHoverGuard();
});

// Mega-menu dropdowns used to open via pure CSS :hover, which the browser
// re-evaluates against the cursor's current position as soon as a new page
// paints — so clicking a link inside a dropdown and landing on the next
// page without moving the mouse made the dropdown flash open again. Gating
// it on real mouseenter/mouseleave events fixes this: those only fire on
// actual pointer movement, never just because the page loaded under a
// stationary cursor.
function initNavHoverGuard() {
  document.querySelectorAll(".nav-item--mega").forEach((item) => {
    item.addEventListener("mouseenter", () => item.classList.add("is-open"));
    item.addEventListener("mouseleave", () => item.classList.remove("is-open"));
  });
}

// .page-hero entrance (the reusable inner-page hero template — solid
// brand color, no photo): the background panel slides in left-to-right
// first, then the title/eyebrow play the same SplitText masked-line
// reveal used everywhere else on the site (see initStoryReveal),
// sequenced to start only once the slide finishes rather than running
// both at once.
function initPageHero() {
  const hero = document.querySelector(".page-hero");
  const bg = hero && hero.querySelector(".page-hero__bg");
  if (!hero || !bg) return;

  const revealEls = hero.querySelectorAll(".page-hero__title, .page-hero__eyebrow");

  const playTextReveal = () => {
    // CSS hides these until this runs (opacity:0), so if GSAP/SplitText
    // ever fails to load, fall back to just making them visible rather
    // than leaving the hero permanently blank.
    if (!(window.gsap && window.SplitText)) {
      revealEls.forEach((el) => (el.style.opacity = 1));
      return;
    }
    gsap.registerPlugin(SplitText);
    revealEls.forEach((el) => {
      el.style.opacity = 1;
      SplitText.create(el, {
        type: "lines",
        mask: "lines",
        autoSplit: true,
        onSplit(self) {
          return gsap.from(self.lines, {
            yPercent: 110,
            opacity: 0,
            duration: 0.9,
            ease: "power4.out",
            stagger: 0.08,
          });
        },
      });
    });
  };

  const runBgSlide = () => {
    if (window.gsap) {
      gsap.fromTo(
        bg,
        { xPercent: -100 },
        { xPercent: 0, duration: 0.8, ease: "power3.out", onComplete: playTextReveal }
      );
    } else {
      playTextReveal();
    }
  };

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(runBgSlide);
  } else {
    window.addEventListener("load", runBgSlide);
  }
}

// Generic "next" arrow overlay for a horizontally-scrolling row — used by
// the "Team Behind It" section on our-story.html. Advances by roughly one
// item's width per click; loops back to the start once it hits the end.
function initScrollNextButtons() {
  document.querySelectorAll(".scroll-next").forEach((btn) => {
    const row = btn.closest(".story-scroll__row");
    const track = row && row.querySelector(".mega-menu__cards");
    if (!track) return;
    btn.addEventListener("click", () => {
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      const item = track.querySelector(":scope > *");
      const step = item ? item.getBoundingClientRect().width + 24 : track.clientWidth * 0.8;
      track.scrollTo({ left: atEnd ? 0 : track.scrollLeft + step, behavior: "smooth" });
    });
  });
}

// our-story.html timeline: clicking a year tab scrolls that year's card
// into view within the horizontally-scrolling .timeline-track (a
// .mega-menu__cards row, so it already has drag/scroll wired up by
// initExploreDrag) and marks the tab active. A plain scrollIntoView is
// enough here — unlike the menu subnav this track isn't also driven by
// ScrollSmoother's vertical page scroll, just its own horizontal one.
function initTimelineTabs() {
  const tabs = document.querySelector(".timeline-tabs");
  const track = document.querySelector(".timeline-track");
  if (!tabs || !track) return;

  tabs.querySelectorAll("a").forEach((tab) => {
    tab.addEventListener("click", (e) => {
      const id = tab.getAttribute("href");
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      tabs.querySelectorAll("a").forEach((t) => t.classList.toggle("is-active", t === tab));
      // Not target.scrollIntoView({behavior:"smooth"}) — that silently
      // no-ops here because .timeline-track sits inside ScrollSmoother's
      // transformed #smooth-content, which breaks native smooth-scroll
      // targeting in some browsers. Animating scrollLeft directly with
      // GSAP sidesteps that entirely.
      const inset = parseFloat(getComputedStyle(track).paddingLeft) || 0;
      const delta = target.getBoundingClientRect().left - track.getBoundingClientRect().left;
      const targetScrollLeft = track.scrollLeft + delta - inset;
      if (window.gsap) {
        gsap.to(track, { scrollLeft: targetScrollLeft, duration: 0.6, ease: "power2.out" });
      } else {
        track.scrollLeft = targetScrollLeft;
      }
    });
  });
}

// The header's "View Menu" mega menu links to menus.html#cat-x from other
// pages, so a fresh page load can arrive with a #cat- hash already in the
// URL. The browser's own native anchor jump fires before ScrollSmoother
// and the fixed header are set up and lands at the wrong position, so this
// waits for everything to settle and then re-scrolls to the same target
// using the same offset math as a normal in-page click.
function initHashScroll() {
  const id = window.location.hash;
  if (!id || !id.startsWith("#cat-")) return;
  const target = document.querySelector(id);
  if (!target) return;

  const run = () => {
    document.querySelectorAll(".menu-subnav a").forEach((l) => {
      l.classList.toggle("is-active", l.getAttribute("href") === id);
    });
    const headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 0;
    const subnav = document.querySelector(".menu-subnav:not(.menu-subnav--sticky-clone)");
    const subnavH = subnav ? subnav.getBoundingClientRect().height : 0;
    const offset = headerH + subnavH + 16;
    if (window.ScrollSmoother && ScrollSmoother.get()) {
      const smoother = ScrollSmoother.get();
      const targetY = target.getBoundingClientRect().top + smoother.scrollTop() - offset;
      smoother.scrollTo(targetY, true);
    } else {
      const targetY = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: targetY, behavior: "smooth" });
    }
  };

  window.addEventListener("load", () => setTimeout(run, 350));
}

// Click-and-drag scrolling with the mouse for a horizontally-scrolling
// track, in addition to the native trackpad/touch swipe overflow-x already
// gives it for free. Tracks whether a real drag happened so a drag-release
// doesn't also fire a card/pill's link navigation. Shared by the explore
// carousel and the menu subnav pill row (see initExploreDrag /
// initSubnavDrag below).
function bindDragScroll(track) {
  if (!track) return;

  let isDown = false;
  let didDrag = false;
  let startX = 0;
  let startScroll = 0;

  track.querySelectorAll("img").forEach((img) => {
    img.draggable = false;
  });
  track.addEventListener("dragstart", (e) => e.preventDefault());

  track.addEventListener("mousedown", (e) => {
    isDown = true;
    didDrag = false;
    startX = e.pageX;
    startScroll = track.scrollLeft;
    track.classList.add("is-dragging");
    e.preventDefault();
  });

  window.addEventListener("mouseup", () => {
    isDown = false;
    track.classList.remove("is-dragging");
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    const dx = e.pageX - startX;
    if (Math.abs(dx) > 4) didDrag = true;
    track.scrollLeft = startScroll - dx;
  });

  // Suppress the click-through navigation only when the mousedown actually
  // turned into a drag, so a plain click still follows the link.
  track.querySelectorAll("a").forEach((link) => {
    link.addEventListener(
      "click",
      (e) => {
        if (didDrag) e.preventDefault();
      },
      true
    );
  });
}

// Every header dropdown (About / View Menu / Investors) has its own
// .mega-menu__cards row — bind all of them, not just one.
function initExploreDrag() {
  document.querySelectorAll(".mega-menu__cards").forEach(bindDragScroll);
}

// Binds both the in-flow subnav pill row and its fixed sticky-nav clone
// (see initMenuSubnavPin — must run first so the clone already exists).
function initSubnavDrag() {
  document.querySelectorAll(".menu-subnav__track").forEach(bindDragScroll);
}

// The header sits outside #smooth-wrapper (fixed, not sticky — see
// css/base.css), so the content underneath needs top padding equal to the
// header's real rendered height, kept in sync on resize. The menu subnav
// used to be fixed too (folded into this same offset) but now sits inline
// in the flow under "Explore Our Menu", so only the header itself matters.
function initHeaderOffset() {
  const header = document.querySelector(".site-header");
  const content = document.getElementById("smooth-content");
  if (!header || !content) return;

  const sync = () => {
    // getBoundingClientRect() (sub-pixel float) instead of offsetHeight
    // (rounded to the nearest integer) — with the header's 0.5px border,
    // offsetHeight's rounding could land a fraction of a pixel short,
    // leaving a hairline gap between the header and the mega-menu
    // dropdowns that sit flush against --header-h.
    const headerH = header.getBoundingClientRect().height;
    document.documentElement.style.setProperty("--header-h", headerH + "px");
    content.style.paddingTop = headerH + "px";
  };
  sync();
  window.addEventListener("resize", sync);
}

// Menu category panels: every category is visible at once, stacked in
// document order. Clicking a subnav pill or an "Explore Our Menu" card
// scrolls to the matching category; an IntersectionObserver keeps the
// matching subnav pill marked active as the page scrolls past each
// section on its own, not just on click. Uses event delegation for clicks
// (rather than binding each link once at init) so it keeps working on the
// fixed sticky-nav clone that initMenuSubnavPin adds to the page after
// this runs.
function initMenuPanels() {
  const panelsRoot = document.querySelector(".menu-panels");
  if (!panelsRoot) return;

  const panels = Array.from(panelsRoot.querySelectorAll(".menu-category"));

  const setActive = (id) => {
    document.querySelectorAll(".menu-subnav a").forEach((l) => {
      l.classList.toggle("is-active", l.getAttribute("href") === id);
    });
  };

  const scrollToTarget = (target) => {
    const headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 0;
    const subnav = document.querySelector(".menu-subnav:not(.menu-subnav--sticky-clone)");
    const subnavH = subnav ? subnav.getBoundingClientRect().height : 0;
    const offset = headerH + subnavH + 16;
    if (window.ScrollSmoother && ScrollSmoother.get()) {
      const smoother = ScrollSmoother.get();
      const targetY = target.getBoundingClientRect().top + smoother.scrollTop() - offset;
      smoother.scrollTo(targetY, true);
    } else {
      const targetY = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: targetY, behavior: "smooth" });
    }
  };

  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href^="#cat-"]');
    if (!link) return;
    const id = link.getAttribute("href");
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    setActive(id);
    scrollToTarget(target);
  });

  if (!panels.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive("#" + entry.target.id);
      });
    },
    { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
  );
  panels.forEach((p) => io.observe(p));
}

// Sticky menu subnav: rather than a GSAP ScrollTrigger pin (which reserves
// scroll distance equal to its whole pin duration right at its original
// spot in the document — that showed up as a large blank gap under the
// nav, worse the longer it needed to stay pinned), this clones the subnav
// into a position:fixed twin appended to <body> — outside #smooth-content,
// same reason the real header is fixed rather than sticky (position:fixed
// on a descendant of a transformed ancestor sticks to THAT ancestor, not
// the viewport). The clone fades in only once the original has scrolled
// up under the header, so the original keeps sitting inline in the flow
// with zero reserved space, and the illusion of stickiness comes entirely
// from the always-fixed clone layered on top.
function initMenuSubnavPin() {
  const subnav = document.querySelector(".menu-subnav");
  const header = document.querySelector(".site-header");
  if (!subnav) return;

  const clone = subnav.cloneNode(true);
  clone.classList.add("menu-subnav--sticky-clone");
  clone.setAttribute("aria-hidden", "true");
  document.body.appendChild(clone);

  const sync = () => {
    clone.style.top = (header ? header.offsetHeight : 0) + "px";
  };
  sync();
  window.addEventListener("resize", sync);

  const toggle = () => {
    const headerH = header ? header.offsetHeight : 0;
    const shouldShow = subnav.getBoundingClientRect().top <= headerH;
    clone.classList.toggle("is-visible", shouldShow);
    clone.setAttribute("aria-hidden", shouldShow ? "false" : "true");
  };

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.create({ onUpdate: toggle, onRefresh: toggle });
  } else {
    window.addEventListener("scroll", toggle, { passive: true });
  }
  toggle();
}

// Smooth scrolling, per https://demos.gsap.com/demo/smooth-scrolling/
function initSmoothScroll() {
  if (!(window.gsap && window.ScrollSmoother)) return;
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

  ScrollSmoother.create({
    wrapper: "#smooth-wrapper",
    content: "#smooth-content",
    smooth: 1.4,
    effects: true,
    normalizeScroll: { allowNestedScroll: true },
  });
}

// Masked line-reveal on the hero, signature tiles, and story-rows
// headings/eyebrows, per
// https://gsap.com/docs/v3/Plugins/SplitText/#masking
// Guarded so a CDN hiccup just skips the animation, not the page.
//
// Playback is driven by a plain IntersectionObserver rather than
// ScrollTrigger's pixel-position triggers — this content sits well down
// the page, and ScrollTrigger's start offsets are calculated once against
// document layout that can still be settling (webfont swap, image
// aspect-ratio boxes reserving space at different times), which made the
// trigger fire at the wrong scroll position in testing. IntersectionObserver
// just watches the real element's real box, so it can't drift out of sync.
//
// SplitText measures line-wrap positions from rendered text, so it still
// has to run AFTER the Avenir webfont has actually loaded — otherwise it
// measures the fallback font's metrics and the lines it split don't match
// where the real text wraps.
function initStoryReveal() {
  if (!(window.gsap && window.SplitText)) return;

  const run = () => {
    gsap.registerPlugin(SplitText);

    const revealSelector = [
      ".story-rows .script-accent",
      ".story-rows h2",
      ".hero__content h1",
      ".hero__content .tile-eyebrow",
      ".signature-tile__label .tile-eyebrow",
      ".signature-tile__label h3",
      ".menu-category__title",
    ].join(", ");

    document.querySelectorAll(revealSelector).forEach((el) => {
      SplitText.create(el, {
        type: "lines",
        mask: "lines",
        autoSplit: true,
        onSplit(self) {
          const tween = gsap.from(self.lines, {
            yPercent: 110,
            opacity: 0,
            duration: 0.9,
            ease: "power4.out",
            stagger: 0.08,
            paused: true,
          });
          const io = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  tween.play();
                  io.disconnect();
                }
              });
            },
            { threshold: 0.15 }
          );
          io.observe(el);
          return tween;
        },
      });
    });
  };

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(run);
  } else {
    window.addEventListener("load", run);
  }
}

// One sticker travels between the three resting spots in the story-rows
// section (founder photo → farm-fresh photo → partner photo) along a
// curved MotionPath, scrubbed to scroll, per
// https://demos.gsap.com/demo/motionpath-waypoints/
// It leans left heading into row 2, then swings back right into row 3.
//
// The three original static stickers became invisible ".sticker-spot"
// markers (see index.html) so their laid-out positions can still be
// measured at runtime — the traveler animates between those exact
// coordinates rather than duplicated/hardcoded ones.
function initStickerTravel() {
  if (!(window.gsap && window.MotionPathPlugin && window.ScrollTrigger)) return;

  const content = document.getElementById("smooth-content");
  const traveler = document.getElementById("traveling-sticker");
  const spot1 = document.getElementById("sticker-spot-1");
  const spot2 = document.getElementById("sticker-spot-2");
  const spot3 = document.getElementById("sticker-spot-3");
  if (!content || !traveler || !spot1 || !spot2 || !spot3) return;

  gsap.registerPlugin(MotionPathPlugin, ScrollTrigger);

  // Position relative to #smooth-content — same ancestor the traveler is
  // positioned within — so the numbers hold up regardless of scroll
  // position or ScrollSmoother's transform.
  const localCenter = (el) => {
    const r = el.getBoundingClientRect();
    const c = content.getBoundingClientRect();
    return { x: r.left - c.left + r.width / 2, y: r.top - c.top + r.height / 2 };
  };

  let ownTriggers = [];

  const build = () => {
    ownTriggers.forEach((st) => st.kill());
    ownTriggers = [];

    const size = traveler.offsetWidth || 110;
    const half = size / 2;
    const p1 = localCenter(spot1);
    const p2 = localCenter(spot2);
    const p3 = localCenter(spot3);

    // Base position = waypoint 1, set as plain top/left (not transform).
    // MotionPathPlugin animates x/y via translate on top of that base, so
    // the path below is expressed as offsets *relative to p1* — {x:0,y:0}
    // is "stay put," not literal document coordinates.
    gsap.set(traveler, { top: p1.y - half, left: p1.x - half, x: 0, y: 0, rotation: 0 });
    traveler.src = spot1.dataset.src;
    traveler.classList.add("is-ready");

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: spot1,
        start: "top 65%",
        endTrigger: spot3,
        end: "top 55%",
        scrub: 0.6,
      },
    });
    // Leg 1: row 1 → row 2, leaning left along the way. Rotation is a
    // separate tween running in parallel (position "0") rather than a
    // property on the motionPath tween itself — MotionPathPlugin treats
    // "rotation" as its own auto-rotate-along-path control and silently
    // ignores a manually-set value passed alongside `motionPath`.
    tl.to(traveler, {
      motionPath: {
        path: [
          { x: 0, y: 0 },
          { x: p2.x - p1.x, y: p2.y - p1.y },
        ],
        curviness: 1.25,
      },
      ease: "sine.inOut",
    }, 0).to(traveler, { rotation: 45, ease: "sine.inOut" }, 0)
      // Leg 2: row 2 → row 3, swinging back right past upright.
      .to(traveler, {
        motionPath: {
          path: [
            { x: p2.x - p1.x, y: p2.y - p1.y },
            { x: p3.x - p1.x, y: p3.y - p1.y },
          ],
          curviness: 1.25,
        },
        ease: "sine.inOut",
      }).to(traveler, { rotation: -15, ease: "sine.inOut" }, "<");
    ownTriggers.push(tl.scrollTrigger);

    // Swap the artwork as the traveler reaches each resting spot.
    ownTriggers.push(
      ScrollTrigger.create({
        trigger: spot2,
        start: "top 65%",
        onEnter: () => (traveler.src = spot2.dataset.src),
        onLeaveBack: () => (traveler.src = spot1.dataset.src),
      }),
      ScrollTrigger.create({
        trigger: spot3,
        start: "top 55%",
        onEnter: () => (traveler.src = spot3.dataset.src),
        onLeaveBack: () => (traveler.src = spot2.dataset.src),
      })
    );
  };

  const run = () => {
    build();
    // Rebuild once more once everything (images included) has fully
    // settled — initStoryReveal's SplitText wrapping runs on a similar
    // timer and can shift row heights by a few lines' worth of pixels
    // after this function's first pass already measured its waypoints.
    window.addEventListener("load", () => {
      ScrollTrigger.refresh();
      setTimeout(build, 300);
    });
    window.addEventListener("resize", build);
  };

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(run);
  } else {
    window.addEventListener("load", run);
  }
}
