import api from './api';
import { Collaborator, ZDriveFile } from '@/types/file';
import { SharedWithMeFolder, ZDriveFolder } from '@/types/folder';

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
  // used for the root "My Drive" view.
  async list(): Promise<ZDriveFolder[]> {
    const { data } = await api.get('/folders');
    return data;
  }

  // GET /folders/all returns a flat list of every folder the user owns,
  // regardless of nesting - used by move-to-folder pickers.
  async listAll(): Promise<ZDriveFolder[]> {
    const { data } = await api.get('/folders/all');
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

  // PATCH /folders/:id, body: { name }.
  async rename(id: string, name: string): Promise<ZDriveFolder> {
    const { data } = await api.patch(`/folders/${id}`, { name });
    return data;
  }

  // PATCH /folders/:id/move, body: { parentId?: string }.
  // Reparents folder; omit or set parentId to null to move to root.
  async move(id: string, parentId?: string): Promise<ZDriveFolder> {
    const { data } = await api.patch(`/folders/${id}/move`, { parentId });
    return data;
  }

  // GET /folders/shared-with-me - folders shared directly with this user.
  async sharedWithMe(): Promise<SharedWithMeFolder[]> {
    const { data } = await api.get('/folders/shared-with-me');
    return data;
  }

  // Collaborator management (FolderCollaborator)
  async listCollaborators(id: string): Promise<Collaborator[]> {
    const { data } = await api.get(`/folders/${id}/collaborators`);
    return data;
  }

  async addCollaborator(
    id: string,
    email: string,
    role: 'EDITOR' | 'VIEWER' = 'VIEWER',
  ): Promise<any> {
    const { data } = await api.post(`/folders/${id}/collaborators`, { email, role });
    return data;
  }

  async updateCollaborator(
    id: string,
    collaboratorId: string,
    role: 'EDITOR' | 'VIEWER',
  ): Promise<any> {
    const { data } = await api.patch(`/folders/${id}/collaborators/${collaboratorId}`, { role });
    return data;
  }

  async removeCollaborator(id: string, collaboratorId: string): Promise<void> {
    await api.delete(`/folders/${id}/collaborators/${collaboratorId}`);
  }

  // Backend rejects this with a clear error message if the folder
  // still has child folders or files - surface that message as-is
  // rather than a generic failure.
  async delete(id: string): Promise<void> {
    await api.delete(`/folders/${id}`);
  }
}

export default new FoldersService();

