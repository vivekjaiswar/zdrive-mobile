import { File, Paths } from 'expo-file-system';

import api, { API_BASE_URL, WEB_BASE_URL } from './api';

import {
  BulkDownloadTicket,
  Collaborator,
  FileDetails,
  FileVersion,
  ShareResponse,
  SharedFileEntry,
  SharedWithMeFile,
  UploadResponse,
  ZDriveFile,
} from '@/types/file';

export const MAX_BULK_DOWNLOAD_IDS = 200;

class FilesService {
  async list(): Promise<ZDriveFile[]> {
    const { data } = await api.get('/files');
    return data;
  }

  async details(id: string): Promise<FileDetails> {
    const { data } = await api.get(`/files/${id}`);

    return {
      ...data,
      previewUrl: `${API_BASE_URL}${data.previewUrl}`,
    };
  }

  async getVersions(id: string): Promise<FileVersion[]> {
    try {
      const { data } = await api.get(`/files/${id}/versions`);
      return data;
    } catch {
      return [];
    }
  }

  // Upload a new revision of an existing file (POST /files/:id/version)
  async uploadVersion(
    id: string,
    uri: string,
    name: string,
    mimeType: string,
  ): Promise<FileVersion> {
    const form = new FormData();
    form.append('file', {
      uri,
      name,
      type: mimeType,
    } as any);

    const { data } = await api.post(`/files/${id}/version`, form, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return data;
  }

  async share(id: string): Promise<ShareResponse & { absoluteUrl: string }> {
    const { data } = await api.post<ShareResponse>(`/files/${id}/share`);

    return {
      ...data,
      absoluteUrl: `${WEB_BASE_URL}${data.shareUrl}`,
    };
  }

  async shared(): Promise<SharedFileEntry[]> {
    const { data } = await api.get('/files/shared');
    return data;
  }

  // GET /files/shared-with-me - files shared directly with this user
  async sharedWithMe(): Promise<SharedWithMeFile[]> {
    const { data } = await api.get('/files/shared-with-me');
    return data;
  }

  async revokeShare(shareId: string): Promise<void> {
    await api.delete(`/files/share/${shareId}`);
  }

  // Collaborator management (FileCollaborator)
  async listCollaborators(id: string): Promise<Collaborator[]> {
    const { data } = await api.get(`/files/${id}/collaborators`);
    return data;
  }

  async addCollaborator(
    id: string,
    email: string,
    role: 'EDITOR' | 'VIEWER' = 'VIEWER',
  ): Promise<any> {
    const { data } = await api.post(`/files/${id}/collaborators`, { email, role });
    return data;
  }

  async updateCollaborator(
    id: string,
    collaboratorId: string,
    role: 'EDITOR' | 'VIEWER',
  ): Promise<any> {
    const { data } = await api.patch(`/files/${id}/collaborators/${collaboratorId}`, { role });
    return data;
  }

  async removeCollaborator(id: string, collaboratorId: string): Promise<void> {
    await api.delete(`/files/${id}/collaborators/${collaboratorId}`);
  }


  async delete(id: string): Promise<void> {
    await api.delete(`/files/${id}`);
  }

  async rename(id: string, name: string): Promise<ZDriveFile> {
    const { data } = await api.patch(`/files/${id}`, { name });
    return data;
  }

  async move(id: string, folderId?: string): Promise<ZDriveFile> {
    const { data } = await api.patch(`/files/${id}/move`, {
      folderId,
    });
    return data;
  }

  async restore(id: string): Promise<void> {
    await api.patch(`/files/${id}/restore`);
  }

  async trash(): Promise<ZDriveFile[]> {
    const { data } = await api.get('/files/trash');
    return data;
  }

  async permanentlyDelete(id: string): Promise<void> {
    await api.delete(`/files/${id}/permanent`);
  }

  async search(query: string): Promise<ZDriveFile[]> {
    const { data } = await api.get(
      `/files/search/${encodeURIComponent(query)}`,
    );
    return data;
  }

  async searchSemantic(query: string): Promise<ZDriveFile[]> {
    const { data } = await api.get(
      `/files/search-semantic/${encodeURIComponent(query)}`,
    );
    return data;
  }

  async searchSemanticDocuments(query: string): Promise<ZDriveFile[]> {
    const { data } = await api.get(
      `/files/search-semantic-documents/${encodeURIComponent(query)}`,
    );
    return data;
  }

  async upload(
    uri: string,
    name: string,
    mimeType: string,
    folderId?: string,
  ): Promise<UploadResponse> {
    const form = new FormData();

    form.append('file', {
      uri,
      name,
      type: mimeType,
    } as any);

    if (folderId) {
      form.append('folderId', folderId);
    }

    const { data } = await api.post<UploadResponse>(
      '/storage/upload',
      form,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    return data;
  }

  async requestBulkDownloadTicket(
    fileIds: string[],
    folderIds: string[] = [],
  ): Promise<BulkDownloadTicket> {
    const { data } = await api.post<BulkDownloadTicket>(
      '/files/bulk-download-ticket',
      { fileIds, folderIds },
    );

    return data;
  }

  async downloadBulkZip(downloadUrl: string, filename: string): Promise<File> {
    const absoluteUrl = `${API_BASE_URL}${downloadUrl}`;
    const destination = new File(Paths.document, filename);

    return File.downloadFileAsync(absoluteUrl, destination, {
      idempotent: true,
    });
  }

  async download(id: string, filename: string): Promise<File> {
    const { data } = await api.get<{ downloadUrl: string }>(
      `/files/${id}/download`,
    );

    const absoluteUrl = `${API_BASE_URL}${data.downloadUrl}`;
    const destination = new File(Paths.document, filename);

    return File.downloadFileAsync(absoluteUrl, destination, {
      idempotent: true,
    });
  }
}

export default new FilesService();
