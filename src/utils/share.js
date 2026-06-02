/**
 * @fileoverview Share helpers for the static single-page app.
 *
 * Every shareable thing on this site is a route plus an optional query string
 * or hash fragment (the app is static, so a URL is the whole shareable unit).
 * These helpers turn an in-app path into an absolute URL and either hand it to
 * the device share sheet (phones) or copy it to the clipboard (everything
 * else), so one Share control behaves correctly on desktop and on mobile.
 */

/**
 * Turn a relative in-app path (e.g. "/interview/142?t=120") into an absolute,
 * shareable URL. The app runs under a HashRouter, so every in-app route lives
 * after "/#": a bare path must be shared as "<origin>/#<path>", otherwise the
 * link opens with an empty hash and the router falls back to the home route.
 * This is the fix for shared clip, interview, and directory links all landing
 * on the homepage. Absolute (http) URLs and already-hash-rooted paths pass
 * through unchanged.
 *
 * @param {string} pathWithQuery
 * @returns {string}
 */
export function buildShareUrl(pathWithQuery) {
  const p = String(pathWithQuery || '');
  if (/^https?:\/\//i.test(p)) return p;
  if (typeof window === 'undefined' || !window.location) return p;
  const origin = window.location.origin;
  if (p.startsWith('/#')) return `${origin}${p}`;   // already hash-rooted
  if (p.startsWith('#')) return `${origin}/${p}`;   // "#/route" -> "<origin>/#/route"
  const path = p.startsWith('/') ? p : `/${p}`;
  return `${origin}/#${path}`;
}

/**
 * Native share is a clean one-tap on phones but an awkward OS sheet on desktop,
 * where our stakeholders (teachers, archivists) expect "copy link." Prefer the
 * share sheet only on coarse pointers (touch); copy everywhere else.
 *
 * @returns {boolean}
 */
export function prefersNativeShare() {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return false;
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  try {
    return window.matchMedia('(pointer: coarse)').matches;
  } catch {
    return false;
  }
}

async function writeClipboard(text) {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the legacy path (older browsers or insecure contexts).
  }
  try {
    // execCommand('copy') and the Clipboard API can both fail when the document
    // is not the focused surface (e.g. focus is in a devtools pane or another
    // frame). Re-focus the window before selecting the textarea.
    if (typeof window !== 'undefined' && typeof window.focus === 'function') {
      window.focus();
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Share `url` via the device sheet (touch) or copy it to the clipboard.
 *
 * @param {{ url: string, title?: string, text?: string }} payload
 * @returns {Promise<'shared'|'copied'|'failed'>} how the link was delivered.
 */
export async function shareOrCopy({ url, title, text }) {
  try {
    if (prefersNativeShare()) {
      try {
        await navigator.share({ url, title, text });
        return 'shared';
      } catch (e) {
        // The user dismissing the sheet is a no-op, not a failure.
        if (e && e.name === 'AbortError') return 'shared';
        // Any other native-share error falls back to the clipboard path below.
      }
    }
    const ok = await writeClipboard(url);
    return ok ? 'copied' : 'failed';
  } catch {
    // Never throw out of the share path: a caller-facing 'failed' lets the UI
    // tell the reader to copy the link manually.
    return 'failed';
  }
}
