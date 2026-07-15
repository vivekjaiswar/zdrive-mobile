import { create } from 'zustand';

interface FilePreviewStore {
  // Ordered ids of whichever file list the user last tapped into a
  // preview from (root Files list, a folder's contents, search
  // results) - lets files/[id].tsx swipe to the next/previous file in
  // that same list without threading a potentially large id array
  // through route params. Deliberately in-memory only, no persistence
  // needed - it's just "what was on screen a moment ago."
  fileIds: string[];
  setFileIds: (ids: string[]) => void;
}

export const useFilePreviewStore = create<FilePreviewStore>((set) => ({
  fileIds: [],
  setFileIds: (ids) => set({ fileIds: ids }),
}));
