// ---------------------------------------------------------------
// App record verified in App Store Connect. Public availability follows approval.
// Every download link on the site reads from this one constant.
// ---------------------------------------------------------------
const APP_STORE_LIVE = false;
const APP_STORE_URL = "https://apps.apple.com/us/app/id6772038196";

document.querySelectorAll("[data-app-store]").forEach((a) => {
  a.href = APP_STORE_LIVE ? APP_STORE_URL : "index.html#availability";
  if (!APP_STORE_LIVE) {
    const label = a.querySelector(".small");
    if (label) label.textContent = "Coming soon to the";
    else a.textContent = "Coming soon";
    a.setAttribute("aria-label", "App Store release coming soon");
  }
});

document.querySelectorAll("[data-year]").forEach((el) => {
  el.textContent = new Date().getFullYear();
});

// Gentle scroll reveals. CSS strips the translate under
// prefers-reduced-motion, so reduced-motion users still get the
// crossfade — delight stays, travel goes.
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
);

document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

// ---------------------------------------------------------------
// Ninja sprite animation — a small web port of the app's
// NinjaSprite.swift. Sheets are 13-frame strips whose frame 0 is the
// rest pose; playback is a palindrome (rest → far end → rest) so the
// ninja always settles calm. Under prefers-reduced-motion no frames
// step at all: the rest pose just holds, matching the app.
// ---------------------------------------------------------------
const SPRITE_FRAMES = 13;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function makeSprite(el) {
  const set = (frame) => {
    el.style.backgroundPosition = `${(frame / (SPRITE_FRAMES - 1)) * 100}% 0%`;
  };
  const sweep = async (stepMs) => {
    for (let f = 1; f < SPRITE_FRAMES; f++) {
      set(f);
      await sleep(stepMs);
    }
    for (let f = SPRITE_FRAMES - 2; f >= 0; f--) {
      set(f);
      await sleep(stepMs);
    }
  };
  return { set, sweep };
}

// Hero idle: sweep ≈1s per direction (the app's 49 frames at 20ms),
// then dwell 2–8s, repeat — but only while the ninja is on screen and
// the tab is visible. A tap replays it immediately, like the app's.
const hero = document.querySelector('[data-sprite="hero"]');
if (hero) {
  const sprite = makeSprite(hero);
  let onScreen = false;
  let poke = null;

  new IntersectionObserver(
    (entries) => {
      onScreen = entries[0].isIntersecting;
    },
    { threshold: 0.2 }
  ).observe(hero);

  hero.addEventListener("click", () => {
    if (poke) poke();
  });

  (async () => {
    for (;;) {
      if (reduceMotion.matches || !onScreen || document.hidden) {
        sprite.set(0);
        await sleep(400);
        continue;
      }
      await sprite.sweep(75);
      await new Promise((resolve) => {
        poke = resolve;
        setTimeout(resolve, 2000 + Math.random() * 6000);
      });
      poke = null;
    }
  })();
}

// Celebrate: plays once when the closing band scrolls into view, and
// again on tap — with the app's 8-sparkle burst. Skipped entirely
// under reduced motion (rest pose holds, no sparkles).
const band = document.querySelector('[data-sprite="celebrate"]');
if (band) {
  const sprite = makeSprite(band.querySelector(".sprite"));
  let playing = false;

  const celebrate = async () => {
    if (playing || reduceMotion.matches) return;
    playing = true;
    spawnSparkles(band);
    await sprite.sweep(60);
    playing = false;
  };

  const once = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        celebrate();
        once.disconnect();
      }
    },
    { threshold: 0.5 }
  );
  once.observe(band);

  band.addEventListener("click", celebrate);
}

function spawnSparkles(host) {
  const count = 8;
  for (let i = 0; i < count; i++) {
    const spark = document.createElement("span");
    spark.className = "sparkle";
    const angle = (i / count) * 2 * Math.PI + (Math.random() - 0.5) * 0.6;
    const distance = host.offsetWidth * (0.55 + Math.random() * 0.3);
    spark.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
    spark.style.setProperty("--dy", `${Math.sin(angle) * distance}px`);
    spark.style.setProperty("--scale", `${0.7 + Math.random() * 0.5}`);
    spark.style.animationDelay = `${i * 50}ms`;
    host.appendChild(spark);
    setTimeout(() => spark.remove(), 1400);
  }
}
