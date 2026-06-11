(function() {
  function addGoogleSearchIcon() {
    var menu = document.getElementById('logged-in-menu');
    if (!menu || document.getElementById('google-search-li')) return;

    var li = document.createElement('li');
    li.id = 'google-search-li';
    li.className = 'nav-item mx-2';
    li.setAttribute('role', 'menuitem');
    li.innerHTML = '<a href="#" id="google-search-trigger" role="button" class="nav-link d-flex gap-2 align-items-center" aria-label="Google Search"><span class="position-relative"><i class="fa fa-fw fa-magnifying-glass"></i></span><span class="nav-text small visible-open fw-semibold">Search</span></a>';

    var notifItem = menu.querySelector('li[component="notifications"]');
    if (notifItem) {
      notifItem.insertAdjacentElement('afterend', li);
    } else {
      menu.appendChild(li);
    }

    document.getElementById('google-search-trigger').addEventListener('click', function(e) {
      e.preventDefault();
      var q = prompt('Google検索:（👉 This leaves this site! ）', '');
      if (q === null) return;
      q = q.trim();
      if (!q) return;
      var host = location.hostname;
      location.href = 'https://www.google.com/search?q=site%3A' + host + '+' + encodeURIComponent(q);
    });
  }

  // Re-adds the icon after the menu is (re)rendered.
  function rebindSearchIcon() {
    var existing = document.getElementById('google-search-li');
    if (existing) existing.remove();
    addGoogleSearchIcon();
  }

  // Initial load safety net (in case the first ajaxify.end fired before this ran).
  setTimeout(addGoogleSearchIcon, 1000);

  // NodeBB fires action:ajaxify.end as a jQuery event on window, so native
  // window.addEventListener will NOT catch it — bind via jQuery.
  if (window.jQuery) {
    jQuery(window).on('action:ajaxify.end', rebindSearchIcon);
  }
})();


/* ──────────────────────────────────────────────────────────────
 * Toggle body.ai-chat-active so the CSS can calm the AI button
 * (remove glow / badge / float) while the user is on the chat page.
 *
 * Lives here in the global custom JS — rather than the header widget —
 * because this file is guaranteed to load once per page and hooks
 * NodeBB's ajaxify navigation reliably. The regex matches /ai-chat
 * even if the forum is mounted under a subfolder (e.g. /forum/ai-chat).
 * ────────────────────────────────────────────────────────────── */
(function () {
  if (window.__nbAiStateInit) return;
  window.__nbAiStateInit = true;

  var AI_CHAT_RE = /(^|\/)ai-chat(\/|$)/;

  function updateAiButtonState() {
    if (AI_CHAT_RE.test(window.location.pathname)) {
      document.body.classList.add('ai-chat-active');
    } else {
      document.body.classList.remove('ai-chat-active');
    }
  }

  updateAiButtonState();
  window.addEventListener('popstate', updateAiButtonState);

  if (window.jQuery) {
    jQuery(window).on('action:ajaxify.end', updateAiButtonState);
  }
})();

/* tooltip mod for brand logo */
(function () {
  // Guard: this block uses jQuery directly; bail out safely if missing.
  if (!window.jQuery) return;
  var $ = window.jQuery;

  function bindBrandTooltip() {
    var brandAnchor = $('[component="brand/anchor"]');
    if (!brandAnchor.length) return;

    // The header persists across ajaxify navigations, so unbind our
    // namespaced handlers first — otherwise they stack on every page change.
    brandAnchor
      .off('mouseenter.nbBrandTip mouseleave.nbBrandTip')
      .on('mouseenter.nbBrandTip', function () {
        $(this).attr('title', 'Home');
      })
      .on('mouseleave.nbBrandTip', function () {
        $(this).attr('title', 'Brand Logo');
      });
  }

  bindBrandTooltip();
  $(window).on('action:ajaxify.end', bindBrandTooltip);
})();
