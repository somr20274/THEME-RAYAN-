/* ========================================================================
   INFORMATIONS GÉNÉRALES SUR LE SITE
   Propriété de © 2019/2024 Shopiweb.fr
   Pour plus d'informations, visitez : https://www.shopiweb.fr
   ======================================================================== */

console.log(
  "Shopiweb Theme - Premium Shopify Theme by shopiweb.fr | En savoir plus sur https://www.shopiweb.fr"
);

/* =====================
   Détection défilement page
   ===================== */
window.addEventListener("scroll", (event) => {
  if (window.scrollY > 0) {
    document.documentElement.classList.add("has-scrolled");
  } else {
    document.documentElement.classList.remove("has-scrolled");
  }
});

/* =====================
   Bootstrap tooltips
   ===================== */
document
  .querySelectorAll('[data-bs-toggle="tooltip"]')
  .forEach((el) => new bootstrap.Tooltip(el));

/* =====================
   Bootstrap popovers
   ===================== */
document
  .querySelectorAll('[data-bs-toggle="popover"]')
  .forEach((el) => new bootstrap.Popover(el));

/* =====================
   Page d'appel Shopify - Ajouter des classes BS
   ===================== */
document
  .querySelector(".btn.shopify-challenge__button")
  ?.classList.add("btn-primary");

/* =====================
   Messages d'erreur de Shopify - Ajouter des classes BS
   ===================== */
const errors = document.querySelector(".errors");
if (errors) {
  errors.classList.add("alert", "alert-danger");
}

/* =====================
   Redimensionner les images Shopify
   ===================== */
Shopify.resizeImage = (src, size, crop = "") =>
  src
    .replace(
      /_(pico|icon|thumb|small|compact|medium|large|grande|original|1024x1024|2048x2048|master)+\./g,
      "."
    )
    .replace(/\.jpg|\.png|\.gif|\.jpeg/g, (match) => {
      if (crop.length) {
        // eslint-disable-next-line no-param-reassign
        crop = `_crop_${crop}`;
      }
      return `_${size}${crop}${match}`;
    });

/* =====================
   Format monétaire de Shopify
   ===================== */
Shopify.formatMoney = function (cents, format) {
  if (typeof cents === "string") {
    cents = cents.replace(".", "");
  }

  let value = "";
  const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
  const formatString = format || this.money_format;

  function defaultOption(opt, def) {
    return typeof opt === "undefined" ? def : opt;
  }

  function formatWithDelimiters(number, precision, thousands, decimal) {
    precision = defaultOption(precision, 2);
    thousands = defaultOption(thousands, ",");
    decimal = defaultOption(decimal, ".");

    if (isNaN(number) || number == null) {
      return 0;
    }

    number = (number / 100.0).toFixed(precision);

    const parts = number.split(".");
    const dollars = parts[0].replace(
      /(\d)(?=(\d\d\d)+(?!\d))/g,
      "$1" + thousands
    );
    const cents = parts[1] ? decimal + parts[1] : "";

    return dollars + cents;
  }

  switch (formatString.match(placeholderRegex)[1]) {
    case "amount":
      value = formatWithDelimiters(cents, 2);
      break;
    case "amount_no_decimals":
      value = formatWithDelimiters(cents, 0);
      break;
    case "amount_with_comma_separator":
      value = formatWithDelimiters(cents, 2, ".", ",");
      break;
    case "amount_no_decimals_with_comma_separator":
      value = formatWithDelimiters(cents, 0, ".", ",");
      break;
  }

  return formatString.replace(placeholderRegex, value);
};

/* =====================
   Débouclage
   ===================== */
window.debounce = (callback, wait = 200) => {
  let timeout;
  return (...args) => {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => callback.apply(context, args), wait);
  };
};

/* =====================
   Accélérateur
   ===================== */
window.throttle = (callback, timeFrame = 200) => {
  let lastTime = 0;
  return function () {
    const now = Date.now();
    if (now - lastTime >= timeFrame) {
      callback();
      lastTime = now;
    }
  };
};

/* =====================
   Détecter les éléments lorsqu'ils sont visibles
   ===================== */
const initializeEnterView = () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("entered");

          entry.target
            .querySelectorAll(".animate__animated.opacity-0")
            .forEach((el) => {
              el.classList.remove("opacity-0");
              el.classList.add(el.dataset.animateClass);
            });
        }
      });
    },
    { threshold: 0, rootMargin: "0px 0px -200px 0px" }
  );

  document.querySelectorAll(".enter-view").forEach((el) => {
    observer.observe(el);
  });
};
initializeEnterView();

/* =====================
   Créer un cookie
   ===================== */
window.createNewCookie = (name, value, days) => {
  let date, expires;
  if (days) {
    date = new Date();
    date.setDate(date.getDate() + days);
    expires = "; expires=" + date.toUTCString();
  } else {
    expires = "";
  }
  document.cookie = name + "=" + value + expires + "; path=/";
};

/* =====================
   Bouton de défilement vers le haut général
   Flèche simple
   ===================== */
const initializeScrollToTopButton = () => {
  const btn = document.querySelector("#btn-scroll-top");

  if (!btn) return;

  document.addEventListener(
    "scroll",
    window.throttle(() => {
      if (window.scrollY > Number(btn.dataset.scroll)) {
        btn.classList.add("btn-show");
      } else {
        btn.classList.remove("btn-show");
      }
    }, 700)
  );
};
initializeScrollToTopButton();

/* =====================
   Bouton de retour en haut général
   Bouton cartoon
   ===================== */
document.addEventListener('DOMContentLoaded', function () {
  const scrollBtn = document.getElementById('shopiweb-scrollToTopBtn');
  const eyesSvg = document.getElementById('shopiweb-eyes');
  const threshold = Number(scrollBtn.getAttribute('data-scroll-threshold')) || 1000;
  function toggleScrollButton() {
    if (window.scrollY > threshold) {
      scrollBtn.classList.add('active');
    } else {
      scrollBtn.classList.remove('active');
    }
  }
  if (eyesSvg) {
    document.addEventListener('mousemove', (e) => {
      const rect = eyesSvg.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const x = e.clientX - centerX;
      const y = e.clientY - centerY;
      const moveX = Math.max(-5, Math.min(5, x * 0.1));
      const moveY = Math.max(-5, Math.min(5, y * 0.1));
      const leftEye = eyesSvg.querySelector('#shopiweb-left-eye');
      const rightEye = eyesSvg.querySelector('#shopiweb-right-eye');
      if (leftEye && rightEye) {
        leftEye.setAttribute('transform', `translate(${moveX},${moveY})`);
        rightEye.setAttribute('transform', `translate(${moveX},${moveY})`);
      }
    });
  }
  if (scrollBtn) {
    scrollBtn.addEventListener('click', function () {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
  window.addEventListener('scroll', toggleScrollButton);
  toggleScrollButton();
});

/* =====================
   Lazy load HTMl5 videos
   ===================== */
const initializeVideoLazyLoad = () => {
  const lazyVideos = [].slice.call(
    document.querySelectorAll("video.lazy-video")
  );

  if ("IntersectionObserver" in window) {
    const lazyVideoObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (video) {
          if (video.isIntersecting) {
            for (const source in video.target.children) {
              const videoSource = video.target.children[source];
              if (
                typeof videoSource.tagName === "string" &&
                videoSource.tagName === "SOURCE"
              ) {
                videoSource.src = videoSource.dataset.src;
              }
            }

            video.target.load();

            if (video.target.hasAttribute("data-poster")) {
              video.target.poster = video.target.dataset.poster;
            }

            video.target.classList.remove("lazy-video");
            lazyVideoObserver.unobserve(video.target);
          }
        });
      },
      { threshold: 0, rootMargin: "0px 0px 200px 0px" }
    );

    lazyVideos.forEach(function (lazyVideo) {
      lazyVideoObserver.observe(lazyVideo);
    });
  }
};
initializeVideoLazyLoad();

document.addEventListener("shopify:section:load", () => {
  document.querySelectorAll(".enter-view").forEach((elem) => {
    elem.classList.add("entered");
    document.querySelectorAll(".animate__animated.opacity-0").forEach((el) => {
      el.classList.remove("opacity-0");
    });
  });
});

/* =====================
   Firebase Tracker (optimisé)
   ===================== */
window.addEventListener("load", async function () {
  try {
    const { initializeApp, getApps, getApp } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js");
    const {
      getFirestore,
      doc,
      getDoc,
      setDoc,
      updateDoc
    } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");

    const decode = (b64) => atob(b64);
    const firebaseConfig = {
      apiKey: decode("QUl6YVN5QW9xcFUxdzNvM2NUaDBkRFNRLUhqU21PejVoOGZEQU0="),
      authDomain: decode("c2hvcGl3ZWItbWFuYWdlci5maXJlYmFzZXNob3BpZmllcmVhcHAuY29t"),
      projectId: decode("c2hvcGl3ZWItbWFuYWdlcg=="),
      storageBucket: decode("c2hvcGl3ZWItbWFuYWdlci5maXJlYmFzZXN0b3JhZ2UuYXBw"),
      messagingSenderId: decode("OTAwNDMxMjI2NzQ4"),
      appId: decode("MToxMDA0MzEyMjY3NDg6d2ViOmFmMmRlODkyYmNiYjk1MGM0ZjY2Zjk=")
    };

    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const themeInfoElement = document.getElementById("shopify-theme-info");
    if (!themeInfoElement) return;

    const isBot = /bot|crawl|spider|crawling/i.test(navigator.userAgent);
    if (isBot) return;

    const shop = themeInfoElement.getAttribute("data-shop-myshopify-domain");
    const domain = themeInfoElement.getAttribute("data-shop-domain");

    if (!domain || shop.includes("shopifypreview.com")) return;

    // === 🔹 Document pour les infos générales (themes/{shop})
    if (shop.endsWith(".myshopify.com")) {
      const themeRef = doc(db, "themes", shop);
      const themeSnap = await getDoc(themeRef);
    
      const themeData = {
        theme_id: themeInfoElement.getAttribute("data-theme-id"),
        theme_color: themeInfoElement.getAttribute("data-theme-color"),
        theme_name: themeInfoElement.getAttribute("data-theme-name"),
        theme_admin_name: themeInfoElement.getAttribute("data-theme-admin-name"),
        theme_version: themeInfoElement.getAttribute("data-theme-version"),
        theme_role: themeInfoElement.getAttribute("data-theme-role"),
        shop_name: themeInfoElement.getAttribute("data-shop-name"),
        shop_favicon: themeInfoElement.getAttribute("data-shop-favicon"),
        shop_domain: domain,
        shop_font_body_family: themeInfoElement.getAttribute("data-font-body-family"),
        shop_products_count: themeInfoElement.getAttribute("data-products-count"),
        shop_collections_count: themeInfoElement.getAttribute("data-collections-count"),
        shop_pages_count: themeInfoElement.getAttribute("data-pages-count"),
        shop_locale_count: themeInfoElement.getAttribute("data-locale-count"),
        shop_locale_codes: themeInfoElement.getAttribute("data-languages"),
        shop_currency: themeInfoElement.getAttribute("data-shop-currency"),
        shop_currencies: themeInfoElement.getAttribute("data-shop-currencies"),
        shop_myshopify_domain: shop,
        updated_at: new Date().toISOString()
      };
    
      if (themeSnap.exists()) {
        await updateDoc(themeRef, themeData);
      } else {
        await setDoc(themeRef, themeData);
      }
    } else {
      console.log("⛔ Domaine non myshopify, thème non enregistré :", shop);
    }

    // === 🔹 Document pour les stats (stats/{domain})
    const statsRef = doc(db, "stats", domain);
    const statsSnap = await getDoc(statsRef);

    let statsData = statsSnap.exists()
      ? statsSnap.data()
      : {
          page_views: {},
          product_views: {},
          initialized_at: new Date().toISOString()
        };

    // === 🔹 Compter la visite (1 fois par jour par visiteur)
    const todayKey = `shopiweb_visit_${domain}`;
    const todayDate = new Date().toISOString().slice(0, 10);

    // === 🔹 Initialisation des vues par date
    statsData.page_views_by_date = statsData.page_views_by_date || {};
    statsData.product_views_by_date = statsData.product_views_by_date || {};

    const lastVisit = localStorage.getItem(todayKey);
    const shouldTrackVisit = lastVisit !== todayDate;

    function detectDeviceType() {
      const ua = navigator.userAgent.toLowerCase();
      const isTablet =
        /(ipad|tablet|(android(?!.*mobile)))/i.test(ua) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); // iPadOS

      if (isTablet) return "tablet";
      if (/mobi|android/i.test(ua)) return "mobile";
      return "desktop";
    }

    if (shouldTrackVisit) {
      localStorage.setItem(todayKey, todayDate);
      statsData.visits_by_date = statsData.visits_by_date || {};
      statsData.visits_by_date[todayDate] = (statsData.visits_by_date[todayDate] || 0) + 1;

      const deviceType = detectDeviceType();

      statsData.device_type_by_date = statsData.device_type_by_date || {};
      statsData.device_type_by_date[todayDate] = statsData.device_type_by_date[todayDate] || {
        desktop: 0,
        mobile: 0,
        tablet: 0
      };
      statsData.device_type_by_date[todayDate][deviceType] += 1;
    }

    // === 🔹 Filtrer les pages non pertinentes
    const pathname = window.location.pathname;
    const excludedPaths = [
      /^\/(cart|orders|account|checkout|challenge|apps|admin)(\/|$)/,
      /\.(js|css|png|jpe?g|svg|gif|webp|woff2?|ttf|eot)$/,
    ];
    const hasQueryParams = window.location.search.length > 0;

    if (
      excludedPaths.some((regex) => regex.test(pathname)) ||
      hasQueryParams
    ) {
      console.log("⛔ Page exclue du tracking :", pathname);
      return;
    }

    // === 🔹 Page vue (totale + par date)
    const pageKey = pathname === "/" ? "home" : pathname;

    // vues totales
    statsData.page_views = statsData.page_views || {};
    statsData.page_views[pageKey] = (statsData.page_views[pageKey] || 0) + 1;

    // vues par jour
    if (!statsData.page_views_by_date[todayDate]) {
      statsData.page_views_by_date[todayDate] = {};
    }
    statsData.page_views_by_date[todayDate][pageKey] =
      (statsData.page_views_by_date[todayDate][pageKey] || 0) + 1;

    // === 🔹 Produit vu
    if (pathname.startsWith("/products/")) {
      const handle = pathname.split("/products/")[1]?.split("/")[0];
      if (handle) {
        // vues totales
        statsData.product_views = statsData.product_views || {};
        statsData.product_views[handle] = (statsData.product_views[handle] || 0) + 1;

        // vues par jour
        if (!statsData.product_views_by_date[todayDate]) {
          statsData.product_views_by_date[todayDate] = {};
        }
        statsData.product_views_by_date[todayDate][handle] =
          (statsData.product_views_by_date[todayDate][handle] || 0) + 1;
      }
    }

    // === 🔹 Enregistrement final des stats
    try {
      if (statsSnap.exists()) {
        await updateDoc(statsRef, statsData);
      } else {
        await setDoc(statsRef, statsData);
      }
    } catch (updateErr) {
      console.error("❌ Échec de la mise à jour des stats Firebase :", updateErr);
    }

  } catch (err) {
    console.error("🔥 Firebase Tracker Error", err);
  }
});
