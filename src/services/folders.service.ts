import api from './api';
import { ZDriveFolder } from '@/types/folder';

class FoldersService {
  // GET /folders returns only root-level folders (parentId: null) -
  // see folders.service.ts findAll() on the backend. There's no
  // single endpoint for "all folders regardless of nesting," so this
  // is what backs the Move-to-folder picker for now.
  async list(): Promise<ZDriveFolder[]> {
    const { data } = await api.get('/folders');
    return data;
  }
}

export default new FoldersService();
