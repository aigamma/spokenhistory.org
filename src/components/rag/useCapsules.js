/**
 * @fileoverview useCapsules, module-level cached fetch of capsules.json
 * + a hook for components that want to display the capsule for a given
 * entry_number.
 *
 * The capsules JSON is small (~30 KB, 136 entries) so a single fetch on
 * first use is fine; we cache the result at module scope and share it.
 */

import { useEffect, useState } from 'react';

let _capsulesPromise = null;

function loadCapsules() {
  if (_capsulesPromise) return _capsulesPromise;
  _capsulesPromise = fetch('/rag/summaries/capsules.json')
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => j?.capsules || j || {})
    .catch(() => ({}));
  return _capsulesPromise;
}

/**
 * useCapsule, return the capsule text for a given entry_number.
 * Returns null while loading or if no capsule exists for that entry.
 */
export function useCapsule(entryNumber) {
  const [capsule, setCapsule] = useState(null);
  useEffect(() => {
    if (entryNumber == null) {
      setCapsule(null);
      return undefined;
    }
    let cancelled = false;
    loadCapsules().then((map) => {
      if (cancelled) return;
      const entry = map[entryNumber] || map[String(entryNumber)];
      setCapsule(entry?.capsule || null);
    });
    return () => { cancelled = true; };
  }, [entryNumber]);
  return capsule;
}
