import { useState } from 'react';

// Generic long-press-to-select state machine shared by the root Files
// screen and the Folder Explorer screen. Deliberately just tracks ids
// (not full objects) - callers already hold the file list and can
// filter it by id when they need the actual objects for a bulk action.
export function useMultiSelect() {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Long-press on a file when nothing is selected yet: enters
  // selection mode with that one file pre-selected.
  function enter(id: string) {
    setSelectionMode(true);
    setSelectedIds(new Set([id]));
  }

  // Tap on a file while selection mode is active: toggles it.
  // Deselecting the last remaining file exits selection mode entirely
  // rather than leaving an empty selection bar on screen.
  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      if (next.size === 0) {
        setSelectionMode(false);
      }

      return next;
    });
  }

  function clear() {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }

  return { selectionMode, selectedIds, enter, toggle, clear };
}
