// expo-file-system 19.x (bundled with SDK 56) replaced the old
// documentDirectory/createDownloadResumable API with File/Directory/
// Paths classes - see https://docs.expo.dev/versions/v56.0.0/sdk/filesystem/
import { File, Paths } from 'expo-file-system';

import api, { API_BASE_URL, WEB_BASE_URL } from './api';

import {
  BulkDownloadTicket,
  FileDetails,
  ShareResponse,
  SharedFileEntry,
  UploadResponse,
  ZDriveFile,
} from '@/types/file';

// Hard server-side caps (shipped 2026-07-15 changelog) - validate
// client-side too so the user gets an immediate, specific message
// instead of waiting on a round-trip just to get a 400 back.
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
      // Backend now returns previewUrl as a RELATIVE path with a
      // short-lived (60s) signed ticket embedded in the query string
      // (see files.service.ts's signContentTicket on the backend) -
      // it's no longer an absolute pre-signed S3 URL. No Authorization
      // header is needed (the ticket is the credential), but fetch()/
      // <Image> in React Native can't resolve a relative path at all,
      // so it has to be turned into an absolute URL here.
      previewUrl: `${API_BASE_URL}${data.previewUrl}`,
    };
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

  // DELETE /files/share/:shareId - shareId is the FileShare record's
  // own id (SharedFileEntry.id), NOT the file's id or the token.
  async revokeShare(shareId: string): Promise<void> {
    await api.delete(`/files/share/${shareId}`);
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

  // Semantic (AI) search over image files - CLIP embeddings, so a query
  // like "beach at sunset" matches photos by content, not filename.
  // Returns file rows plus a `distance` (lower = closer). The backend
  // keeps this separate from document search below because the two
  // embedding spaces aren't comparable and can't be ranked together.
  async searchSemantic(query: string): Promise<ZDriveFile[]> {
    const { data } = await api.get(
      `/files/search-semantic/${encodeURIComponent(query)}`,
    );
    return data;
  }

  // Semantic search over PDF document *contents* (a different embedding
  // model than searchSemantic). Separate call/result set on purpose -
  // see the comment above.
  async searchSemanticDocuments(query: string): Promise<ZDriveFile[]> {
    const { data } = await api.get(
      `/files/search-semantic-documents/${encodeURIComponent(query)}`,
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

  // POST /files/bulk-download-ticket - fileIds/folderIds are any mix,
  // folders get expanded recursively server-side. At least one of the
  // two arrays must be non-empty (enforced by the backend, but the
  // multi-select UI only ever passes fileIds today - folder bulk
  // download is a separate, not-yet-built feature).
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

  // GET /files/bulk-download/content?ticket=... - streams a zip, no
  // cookie needed (the ticket itself is the credential). Same
  // relative-path-needs-API_BASE_URL pattern as download() below, and
  // same File.downloadFileAsync mechanics - just a much larger,
  // longer-running response on average.
  async downloadBulkZip(downloadUrl: string, filename: string): Promise<File> {
    const absoluteUrl = `${API_BASE_URL}${downloadUrl}`;
    const destination = new File(Paths.document, filename);

    return File.downloadFileAsync(absoluteUrl, destination, {
      idempotent: true,
    });
  }

  async download(id: string, filename: string): Promise<File> {
    // GET /files/:id/download does NOT stream the file - it returns
    // JSON: { fileId, fileName, downloadUrl, expiresIn }. downloadUrl
    // is now a RELATIVE path (backend content-streaming route) with a
    // short-lived signed ticket embedded in the query string, NOT an
    // absolute pre-signed S3 URL like before - needs no Authorization
    // header (the ticket is the credential) but does need the API
    // origin prepended. Also: don't trust `expiresIn` here - it still
    // says 3600 but the actual embedded ticket expires in 60s; that
    // field is stale from the old S3 design and hasn't been updated.
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
