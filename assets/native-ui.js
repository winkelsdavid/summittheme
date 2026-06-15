/*
 * native-ui.js — dependency-free UI controllers (replaces jQuery + Bootstrap).
 * v1: native <dialog> modal controller.
 *
 * Why native <dialog>: the browser gives us focus-trapping, ESC-to-close,
 * background `inert`, top-layer stacking, focus-return and ::backdrop for
 * free — the exact robustness a hand-rolled shim tends to get subtly wrong.
 *
 * Markup contract (kept compatible with the old Bootstrap markup):
 *   - Trigger: any element with [data-toggle="modal"] and [data-target="#id"]
 *     (or [href="#id"]).
 *   - Container: a <dialog id="id" class="modal"> ... </dialog>.
 *   - Close:   any element with [data-dismiss="modal"], ESC, or a backdrop click.
 *
 * Programmatic API (for theme.js, which opens some modals from JS):
 *   window.NativeUI.openModal('#jsQuickview')  / openModal(el)
 *   window.NativeUI.closeModal('#jsQuickview') / closeModal(el)
 *
 * Compat events dispatched on the <dialog> (bubbling), replacing
 * Bootstrap's shown.bs.modal / hidden.bs.modal:
 *   'modal:shown'  'modal:hidden'
 */
(function () {
  'use strict';

  function resolve(target) {
    if (!target) return null;
    if (typeof target !== 'string') return target;
    try { return document.querySelector(target.charAt(0) === '#' || target.charAt(0) === '.' ? target : '#' + target); }
    catch (e) { return null; }
  }

  function lockScroll() { document.documentElement.classList.add('has-modal-open'); }
  function unlockScroll() {
    if (!document.querySelector('dialog.modal[open]')) {
      document.documentElement.classList.remove('has-modal-open');
    }
  }

  function openModal(target) {
    var dlg = resolve(target);
    if (!dlg) return null;
    if (typeof dlg.showModal === 'function') {
      if (!dlg.open) {
        try { dlg.showModal(); }
        catch (e) { dlg.setAttribute('open', ''); }
      }
    } else {
      dlg.setAttribute('open', '');
    }
    lockScroll();
    dlg.dispatchEvent(new CustomEvent('modal:shown', { bubbles: true }));
    return dlg;
  }

  function closeModal(target) {
    var dlg = resolve(target);
    // No explicit target -> close the top-most open dialog.
    if (!dlg) dlg = document.querySelector('dialog.modal[open]');
    if (!dlg) return;
    if (typeof dlg.close === 'function') { if (dlg.open) dlg.close(); }
    else { dlg.removeAttribute('open'); dlg.dispatchEvent(new CustomEvent('close', { bubbles: false })); }
  }

  // ---- Delegated open / close ----
  document.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-toggle="modal"]');
    if (opener) {
      var sel = opener.getAttribute('data-target') || opener.getAttribute('href');
      if (sel && sel !== '#') { e.preventDefault(); openModal(sel); }
      return;
    }
    var dismiss = e.target.closest('[data-dismiss="modal"]');
    if (dismiss) {
      e.preventDefault();
      closeModal(dismiss.closest('dialog'));
      return;
    }
    // Backdrop click: the click lands directly on the <dialog> element
    // (its content sits in an inner wrapper), so target === the dialog.
    if (e.target.tagName === 'DIALOG' && e.target.classList.contains('modal')) {
      closeModal(e.target);
    }
  });

  // ---- Native close (ESC or .close()) cleanup + compat event ----
  document.addEventListener('close', function (e) {
    var dlg = e.target;
    if (dlg && dlg.tagName === 'DIALOG') {
      unlockScroll();
      dlg.dispatchEvent(new CustomEvent('modal:hidden', { bubbles: true }));
    }
  }, true);

  // ---- Public API ----
  window.NativeUI = window.NativeUI || {};
  window.NativeUI.openModal = openModal;
  window.NativeUI.closeModal = closeModal;

  // ---- jQuery / Bootstrap compatibility bridge ----
  // While vendor.js (jQuery + Bootstrap) is still loaded, route the legacy
  // $.fn.modal('show'|'hide') plugin calls (theme.js) AND Bootstrap's
  // [data-toggle="modal"] data-api through the native controller, and re-emit
  // the Bootstrap 'hidden.bs.modal' jQuery event on close so existing listeners
  // keep working. Falls away cleanly once vendor.js is removed.
  (function bridge() {
    var jq = window.jQuery;
    if (jq && jq.fn) {
      jq.fn.modal = function (action) {
        this.each(function () {
          if (action === 'hide') closeModal(this);
          else openModal(this);
        });
        return this;
      };
    }
    document.addEventListener('close', function (e) {
      if (e.target && e.target.tagName === 'DIALOG' && window.jQuery) {
        try { window.jQuery(e.target).trigger('hidden.bs.modal'); } catch (err) {}
      }
    }, true);
  })();
})();
