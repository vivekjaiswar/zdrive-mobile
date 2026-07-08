import api from './api';
import { ZDriveFile } from '@/types/file';
import { ZDriveFolder } from '@/types/folder';

// Matches FoldersService.explorer()'s actual return shape on the
// backend - the one call that gives us a folder's own metadata plus
// its immediate children (subfolders) and the files that live in it.
export interface FolderExplorerResult {
  folder: ZDriveFolder;
  folders: ZDriveFolder[];
  files: ZDriveFile[];
}

class FoldersService {
  // GET /folders returns only root-level folders (parentId: null) -
  // see folders.service.ts findAll() on the backend. There's no
  // single endpoint for "all folders regardless of nesting," so this
  // is what backs the Move-to-folder picker and the root "My Drive"
  // view for now.
  async list(): Promise<ZDriveFolder[]> {
    const { data } = await api.get('/folders');
    return data;
  }

  // POST /folders, body: { name, parentId? }. Omit parentId to
  // create at root.
  async create(name: string, parentId?: string): Promise<ZDriveFolder> {
    const { data } = await api.post('/folders', { name, parentId });
    return data;
  }

  async explorer(id: string): Promise<FolderExplorerResult> {
    const { data } = await api.get(`/folders/${id}/explorer`);
    return data;
  }

  // PATCH /folders/:id, body: { name }. Note: there is no
  // folder-move endpoint on the backend - UpdateFolderDto only has
  // `name`, so a folder's parentId can never change once created.
  async rename(id: string, name: string): Promise<ZDriveFolder> {
    const { data } = await api.patch(`/folders/${id}`, { name });
    return data;
  }

  // Backend rejects this with a clear error message if the folder
  // still has child folders or files - surface that message as-is
  // rather than a generic failure.
  async delete(id: string): Promise<void> {
    await api.delete(`/folders/${id}`);
  }
}

export default new FoldersService();
