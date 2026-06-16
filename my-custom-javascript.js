// Shared helper: attach a tooltip the NodeBB/jQuery way.
// Defined at global scope so all IIFEs below can use it.
function attachTooltip(el, text, placement) {
  if (!el) return;
  el.setAttribute('title', text);
  if (window.jQuery && jQuery.fn.tooltip) {
    jQuery(el).tooltip({ placement: placement || 'bottom', trigger: 'hover' });
  }
}

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

    attachTooltip(document.getElementById('google-search-trigger'), 'Search', 'bottom');

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
 * X/Twitter live-search icon, right after the Google search icon.
 * Always visible, on every page including /ai-chat.
 * ────────────────────────────────────────────────────────────── */
(function () {
  function addTwitterIcon() {
    var menu = document.getElementById('logged-in-menu');
    if (!menu || document.getElementById('twitter-search-li')) return;

    var li = document.createElement('li');
    li.id = 'twitter-search-li';
    li.className = 'nav-item mx-2';
    li.setAttribute('role', 'menuitem');
    li.innerHTML = '<a href="#" id="twitter-search-trigger" role="button" class="nav-link d-flex gap-2 align-items-center" aria-label="認知症：フィード"><span class="position-relative"><i class="fa-brands fa-fw fa-x-twitter"></i></span><span class="nav-text small visible-open fw-semibold">X</span></a>';

    // Insert right after the Google search item when it exists;
    // otherwise fall back to the end of the menu.
    var googleItem = document.getElementById('google-search-li');
    if (googleItem) {
      googleItem.insertAdjacentElement('afterend', li);
    } else {
      menu.appendChild(li);
    }

    attachTooltip(document.getElementById('twitter-search-trigger'), '認知症：フィード', 'bottom');

    document.getElementById('twitter-search-trigger').addEventListener('click', function (e) {
      e.preventDefault();
      window.open('https://x.com/search?q=認知症&src=typed_query&f=live', '_blank', 'noopener');
    });
  }

  // Remove first, then re-add on every page change so the icon
  // always sits right after the freshly rebuilt Google icon.
  function rebindTwitterIcon() {
    var existing = document.getElementById('twitter-search-li');
    if (existing) existing.remove();
    addTwitterIcon();
  }

  // Initial-load safety net: fires just after the Google icon's 1000ms
  // net so #google-search-li already exists as the insertion anchor.
  setTimeout(addTwitterIcon, 1100);

  if (window.jQuery) {
    // Bound after the Google block's handler, so on each ajaxify.end the
    // Google icon is rebuilt first and ours lands right behind it.
    jQuery(window).on('action:ajaxify.end', rebindTwitterIcon);
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


/* ──────────────────────────────────────────────────────────────
 * Newsletter (email delivery) on/off icon, right after the X icon.
 * Clicking opens a dialog explaining the WEEKLY dementia-news digest
 * and lets the user toggle their subscription on/off.
 *
 * Uses the same /api/ai-chat/newsletter endpoints the old in-page
 * toggle used (GET = read status, POST { subscribed } = update).
 * The in-page toggle on /ai-chat has been removed in favour of this.
 * ────────────────────────────────────────────────────────────── */
(function () {
  var DIALOG_ID = 'nb-newsletter-dialog';
  var DESC_TEXT = '認知症の最新ニュースを購読したい場合は、配信設定をONにしてください。最新ニュースは毎週配信されます。';

  function csrfToken() {
    return (window.config && window.config.csrf_token) ? window.config.csrf_token : '';
  }

  // ── Menu icon ──────────────────────────────────────────────
  function addNewsletterIcon() {
    var menu = document.getElementById('logged-in-menu');
    if (!menu || document.getElementById('newsletter-li')) return;

    var li = document.createElement('li');
    li.id = 'newsletter-li';
    li.className = 'nav-item mx-2';
    li.setAttribute('role', 'menuitem');
    li.innerHTML = '<a href="#" id="newsletter-trigger" role="button" class="nav-link d-flex gap-2 align-items-center" aria-label="メール配信"><span class="position-relative"><i class="fa fa-fw fa-envelope"></i></span><span class="nav-text small visible-open fw-semibold">メール</span></a>';

    // Sit right after the X icon when present; otherwise after Google;
    // otherwise fall back to the end of the menu.
    var twitterItem = document.getElementById('twitter-search-li');
    var googleItem  = document.getElementById('google-search-li');
    if (twitterItem) {
      twitterItem.insertAdjacentElement('afterend', li);
    } else if (googleItem) {
      googleItem.insertAdjacentElement('afterend', li);
    } else {
      menu.appendChild(li);
    }

    // Tooltip — same NodeBB/jQuery helper the other icons use.
    attachTooltip(document.getElementById('newsletter-trigger'), 'メール配信', 'bottom');

    document.getElementById('newsletter-trigger').addEventListener('click', function (e) {
      e.preventDefault();
      openNewsletterDialog();
    });
  }

  // Remove first, then re-add on every page change so the icon always
  // lands right after the freshly rebuilt X icon.
  function rebindNewsletterIcon() {
    var existing = document.getElementById('newsletter-li');
    if (existing) existing.remove();
    addNewsletterIcon();
  }

  // ── Dialog ─────────────────────────────────────────────────
  function onEscKey(e) {
    if (e.key === 'Escape') closeNewsletterDialog();
  }

  function closeNewsletterDialog() {
    var d = document.getElementById(DIALOG_ID);
    if (d) d.remove();
    document.removeEventListener('keydown', onEscKey);
  }

  function openNewsletterDialog() {
    if (document.getElementById(DIALOG_ID)) return; // already open

    var overlay = document.createElement('div');
    overlay.id = DIALOG_ID;
    overlay.className = 'nb-nl-overlay';
    overlay.innerHTML =
      '<div class="nb-nl-modal" role="dialog" aria-modal="true" aria-labelledby="nb-nl-title">' +
        '<button type="button" class="nb-nl-close" aria-label="閉じる">&times;</button>' +
        '<div class="nb-nl-head">' +
          '<i class="fa fa-envelope nb-nl-head-icon" aria-hidden="true"></i>' +
          '<h3 id="nb-nl-title" class="nb-nl-title">メール配信設定</h3>' +
        '</div>' +
        '<p class="nb-nl-desc"></p>' +
        '<div class="nb-nl-row">' +
          '<span class="nb-nl-row-label">ニュース配信</span>' +
          '<label class="nb-nl-switch">' +
            '<input type="checkbox" id="nb-nl-toggle">' +
            '<span class="nb-nl-slider"></span>' +
          '</label>' +
          '<span class="nb-nl-state" id="nb-nl-state">…</span>' +
        '</div>' +
        '<div class="nb-nl-msg" id="nb-nl-msg" role="status"></div>' +
      '</div>';

    // Set description via textContent to avoid any HTML injection concerns.
    overlay.querySelector('.nb-nl-desc').textContent = DESC_TEXT;

    document.body.appendChild(overlay);

    var toggle     = overlay.querySelector('#nb-nl-toggle');
    var stateLabel = overlay.querySelector('#nb-nl-state');
    var msg        = overlay.querySelector('#nb-nl-msg');

    function setState(on) {
      stateLabel.textContent = on ? 'ON' : 'OFF';
      stateLabel.classList.toggle('is-on', !!on);
    }

    // Close handlers: × button, backdrop click, Esc key.
    overlay.querySelector('.nb-nl-close').addEventListener('click', closeNewsletterDialog);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeNewsletterDialog();
    });
    document.addEventListener('keydown', onEscKey);

    // Load current subscription status.
    toggle.disabled = true;
    fetch('/api/ai-chat/newsletter', {
      headers: { 'x-csrf-token': csrfToken() }
    }).then(function (r) {
      if (r.status === 403) {
        msg.textContent = 'ログインが必要です。';
        msg.className = 'nb-nl-msg is-error';
        setState(false);
        return null;
      }
      if (!r.ok) throw new Error('status ' + r.status);
      return r.json();
    }).then(function (d) {
      if (!d) return;
      toggle.checked = !!d.subscribed;
      setState(toggle.checked);
      toggle.disabled = false;
    }).catch(function () {
      msg.textContent = '状態を取得できませんでした。';
      msg.className = 'nb-nl-msg is-error';
      setState(false);
    });

    // Toggle change → persist via POST, revert on failure.
    toggle.addEventListener('change', function () {
      var subscribed = toggle.checked;
      toggle.disabled = true;
      msg.textContent = '';
      msg.className = 'nb-nl-msg';
      fetch('/api/ai-chat/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken()
        },
        body: JSON.stringify({ subscribed: subscribed })
      }).then(function (r) {
        if (!r.ok) throw new Error('status ' + r.status);
        setState(subscribed);
        msg.textContent = subscribed ? '配信をONにしました ✓' : '配信をOFFにしました';
        msg.className = 'nb-nl-msg is-ok';
        toggle.disabled = false;
      }).catch(function () {
        toggle.checked = !subscribed; // revert
        setState(toggle.checked);
        msg.textContent = '更新に失敗しました。もう一度お試しください。';
        msg.className = 'nb-nl-msg is-error';
        toggle.disabled = false;
      });
    });
  }

  // Initial-load safety net: fires just after the Google (1000ms) and
  // X (1100ms) nets, so #twitter-search-li already exists as the anchor.
  setTimeout(addNewsletterIcon, 1200);

  if (window.jQuery) {
    // Bound after the Google and X blocks' handlers, so on each
    // ajaxify.end those icons are rebuilt first and ours lands behind them.
    jQuery(window).on('action:ajaxify.end', rebindNewsletterIcon);
  }
})();
