// Website-only pageview counting. No SDK, autocapture, replay, or app identity.
(() => {
  "use strict";
  const ID_KEY = "bsn_website_visitor_v1";
  const CHOICE_KEY = "bsn_website_analytics_off";
  const production = ["bloodsugarninjaapp.com", "www.bloodsugarninjaapp.com"].includes(location.hostname);
  const countablePage = ["/", "/index.html", "/support.html"].includes(location.pathname);
  const browserOptOut = navigator.globalPrivacyControl === true ||
    navigator.doNotTrack === "1" || window.doNotTrack === "1";
  let sent = false;

  function enabled() {
    if (browserOptOut) return false;
    try { return localStorage.getItem(CHOICE_KEY) !== "1"; }
    catch { return false; }
  }

  function capturePageview() {
    if (!production || !countablePage || sent || !enabled()) return;
    try {
      let id = localStorage.getItem(ID_KEY);
      if (!/^bsn-web-[0-9a-f-]{36}$/.test(id || "")) {
        id = `bsn-web-${crypto.randomUUID()}`;
        localStorage.setItem(ID_KEY, id);
      }
      // Only these public static paths are allowed. Never send query strings,
      // fragments, referrers, page text, clicks, forms, or account/health data.
      const payload = {
        api_key: "phc_1tcOuMsXWwQOxKbdvqSV5AyKUhsnDGveZkOyqMtv7vU",
        event: "$pageview",
        distinct_id: id,
        properties: {
          app: "blood_sugar_ninja_website",
          environment: "production",
          $current_url: `https://${location.hostname}${location.pathname}`,
          $host: location.hostname,
          $pathname: location.pathname,
          $process_person_profile: false,
          $geoip_disable: true,
          $ip: "0.0.0.0"
        }
      };
      sent = true;
      fetch("https://us.i.posthog.com/i/v0/e/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "omit",
        referrerPolicy: "no-referrer",
        keepalive: true
      }).catch(() => {}); // Analytics must never interrupt the website.
    } catch { /* Storage or network restrictions simply disable counting. */ }
  }

  const controls = document.querySelectorAll("[data-website-analytics]");
  function refreshControls() {
    for (const button of controls) {
      button.hidden = false;
      button.disabled = browserOptOut;
      button.textContent = browserOptOut ? "Website analytics off (browser preference)" :
        enabled() ? "Turn off website analytics" : "Turn on website analytics";
    }
  }
  for (const button of controls) {
    button.addEventListener("click", () => {
      try {
        if (enabled()) {
          localStorage.setItem(CHOICE_KEY, "1");
          localStorage.removeItem(ID_KEY);
        } else if (!browserOptOut) {
          localStorage.removeItem(CHOICE_KEY);
          capturePageview();
        }
      } catch { /* The browser may block website storage. */ }
      refreshControls();
    });
  }
  window.addEventListener("storage", refreshControls);
  refreshControls();
  capturePageview();
})();
