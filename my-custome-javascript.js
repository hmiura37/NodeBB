// 1. Logo hover swap
function applyLogoHoverEffect() {
  const logoImg = document.querySelector('[component="brand/logo"]');
  if (!logoImg) return;

  const homeSrc = "/assets/uploads/system/home2.png";
  const brandAnchor =
    logoImg.closest('[component="brand/anchor"]') || logoImg.parentElement;

  // Capture the originals ONCE. The header persists across ajaxify
  // navigations, so if we re-read src here after a hover+click, we'd
  // capture home2.png as the "original" and the real logo is lost.
  if (!logoImg.dataset.origSrc) {
    logoImg.dataset.origSrc = logoImg.getAttribute("src");
    brandAnchor.dataset.origTitle =
      brandAnchor.getAttribute("title") || "ブランドロゴ";
  }
  const originalSrc = logoImg.dataset.origSrc;
  const originalTitle = brandAnchor.dataset.origTitle;

  // Reset to the original on every page change. This covers the case
  // where the user clicks the logo while hovering: mouseleave never
  // fires, so the home icon would otherwise stay stuck on screen.
  logoImg.setAttribute("src", originalSrc);
  brandAnchor.setAttribute("title", originalTitle);
  brandAnchor.setAttribute("data-bs-original-title", originalTitle);

  brandAnchor.onmouseenter = function () {
    logoImg.setAttribute("src", homeSrc);
    brandAnchor.setAttribute("title", "Home");
    brandAnchor.setAttribute("data-bs-original-title", "Home");
  };
  brandAnchor.onmouseleave = function () {
    logoImg.setAttribute("src", originalSrc);
    brandAnchor.setAttribute("title", originalTitle);
    brandAnchor.setAttribute("data-bs-original-title", originalTitle);
  };
}

// 2. About dialog (brand header widget)
function initAboutDialog() {
  const btn = document.getElementById("yumeAboutBtn");
  const dialog = document.getElementById("yumeAboutDialog");
  const closeBtn = document.getElementById("yumeAboutClose");
  if (!btn || !dialog || !closeBtn) return;
  if (btn.dataset.yumeBound) return; // guard against double-binding
  btn.dataset.yumeBound = "1";

  btn.addEventListener("click", function () {
    typeof dialog.showModal === "function"
      ? dialog.showModal()
      : dialog.setAttribute("open", "");
  });
  closeBtn.addEventListener("click", function () {
    dialog.close ? dialog.close() : dialog.removeAttribute("open");
  });
  dialog.addEventListener("click", function (e) {
    if (e.target === dialog) {
      dialog.close ? dialog.close() : dialog.removeAttribute("open");
    }
  });
}

// Helper: attach a tooltip the NodeBB/jQuery way, falling back to native title
function attachTooltip(el, text, placement) {
  if (!el) return;
  el.setAttribute("title", text);
  // Try jQuery tooltip (NodeBB's built-in mechanism)
  if (typeof $ !== "undefined" && $.fn.tooltip) {
    $(el).tooltip({ placement: placement || "bottom", trigger: "hover" });
  }
}

// 3. Google site-search icon in the logged-in menu
function addGoogleSearchIcon() {
  var menu = document.getElementById("logged-in-menu");
  if (!menu || document.getElementById("google-search-li")) return;

  var li = document.createElement("li");
  li.id = "google-search-li";
  li.className = "nav-item mx-2";
  li.setAttribute("role", "menuitem");
  li.innerHTML =
    '<a href="#" id="google-search-trigger" role="button" class="nav-link d-flex gap-2 align-items-center" aria-label="Search"><span class="position-relative"><i class="fa fa-fw fa-magnifying-glass"></i></span><span class="nav-text small visible-open fw-semibold">Search</span></a>';

  var notifItem = menu.querySelector('li[component="notifications"]');
  if (notifItem) {
    notifItem.insertAdjacentElement("afterend", li);
  } else {
    menu.appendChild(li);
  }

  attachTooltip(
    document.getElementById("google-search-trigger"),
    "Search",
    "bottom"
  );

  document
    .getElementById("google-search-trigger")
    .addEventListener("click", function (e) {
      e.preventDefault();
      var q = prompt("Google検索:（👉 This leaves this site! ）", "");
      if (q === null) return;
      q = q.trim();
      if (!q) return;
      location.href =
        "https://www.google.com/search?q=site%3A" +
        location.hostname +
        "+" +
        encodeURIComponent(q);
    });
}

// 4. X/Twitter live-search icon, placed right after the Google search icon
function addTwitterIcon() {
  var menu = document.getElementById("logged-in-menu");
  if (!menu || document.getElementById("twitter-search-li")) return;

  var li = document.createElement("li");
  li.id = "twitter-search-li";
  li.className = "nav-item mx-2";
  li.setAttribute("role", "menuitem");
  li.innerHTML =
    '<a href="#" id="twitter-search-trigger" role="button" class="nav-link d-flex gap-2 align-items-center" aria-label="夢 by X"><span class="position-relative"><i class="fa-brands fa-fw fa-x-twitter"></i></span><span class="nav-text small visible-open fw-semibold">X</span></a>';

  // Insert right after the Google search item. addGoogleSearchIcon()
  // must run before this function so #google-search-li already exists.
  var googleItem = document.getElementById("google-search-li");
  if (googleItem) {
    googleItem.insertAdjacentElement("afterend", li);
  } else {
    menu.appendChild(li);
  }

  attachTooltip(
    document.getElementById("twitter-search-trigger"),
    "夢 by X",
    "bottom"
  );

  document
    .getElementById("twitter-search-trigger")
    .addEventListener("click", function (e) {
      e.preventDefault();
      window.open(
        "https://x.com/search?q=夢&src=typed_query&f=live",
        "_blank",
        "noopener"
      );
    });
}

// 5. ONE binding — NodeBB fires action:ajaxify.end on initial load
//    and on every page change, so all four run when needed.
$(window).on("action:ajaxify.end", function () {
  applyLogoHoverEffect();
  initAboutDialog();
  addGoogleSearchIcon();
  addTwitterIcon(); // after Google so the insert-after anchor exists
});