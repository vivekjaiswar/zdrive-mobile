// expo-file-system 19.x (bundled with SDK 56) replaced the old
// documentDirectory/createDownloadResumable API with File/Directory/
// Paths classes - see https://docs.expo.dev/versions/v56.0.0/sdk/filesystem/
import { File, Paths } from 'expo-file-system';

import api, { WEB_BASE_URL } from './api';

import {
  FileDetails,
  ShareResponse,
  SharedFileEntry,
  UploadResponse,
  ZDriveFile,
} from '@/types/file';

class FilesService {
  async list(): Promise<ZDriveFile[]> {
    const { data } = await api.get('/files');
    return data;
  }

  async details(id: string): Promise<FileDetails> {
    const { data } = await api.get(`/files/${id}`);
    return data;
  }

  async share(id: string): Promise<ShareResponse & { absoluteUrl: string }> {
    const { data } = await api.post<ShareResponse>(`/files/${id}/share`);

    return {
      ...data,
      // Backend returns a relative path ("/share/:token"); build the
      // absolute URL here since that's what Share.share()/Linking need.
      absoluteUrl: `${WEB_BASE_URL}${data.shareUrl}`,
    };
  }

  async shared(): Promise<SharedFileEntry[]> {
    const { data } = await api.get('/files/shared');
    return data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/files/${id}`);
  }

  // PATCH /files/:id, body: { name }.
  async rename(id: string, name: string): Promise<ZDriveFile> {
    const { data } = await api.patch(`/files/${id}`, { name });
    return data;
  }

  // PATCH /files/:id/move, body: { folderId }. Pass undefined/omit
  // to move back to root - MoveFileDto's folderId is optional.
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

  // DELETE /files/:id/permanent - actually removes the S3 object and
  // DB row (unlike delete(), which just soft-deletes into trash).
  // Irreversible.
  async permanentlyDelete(id: string): Promise<void> {
    await api.delete(`/files/${id}/permanent`);
  }

  async search(query: string): Promise<ZDriveFile[]> {
    const { data } = await api.get(
      `/files/search/${encodeURIComponent(query)}`,
    );
    return data;
  }

  // Response shape is StorageService.uploadFile()'s return value:
  // { id, name, size, mimeType, s3Key, folderId }. There is no
  // `success` flag - a non-2xx response throws, so success is
  // "the promise resolved."
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

  async download(id: string, filename: string): Promise<File> {
    // GET /files/:id/download does NOT stream the file - it returns
    // JSON: { fileId, fileName, downloadUrl, expiresIn } where
    // downloadUrl is a pre-signed S3 URL (files.service.ts download()
    // on the backend). Fetch that first, then download from S3
    // directly - the pre-signed URL is already authenticated, so it
    // needs no Authorization header of its own.
    const { data } = await api.get<{ downloadUrl: string }>(
      `/files/${id}/download`,
    );

    const destination = new File(Paths.document, filename);

    return File.downloadFileAsync(data.downloadUrl, destination, {
      idempotent: true,
    });
  }
}

export default new FilesService();
