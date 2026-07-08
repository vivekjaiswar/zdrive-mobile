// NOTE: the backend stores file size as a Postgres BigInt and always
// serializes it as a string (`size.toString()`) in every JSON response
// (files.service.ts findAll/findOne/search/etc). Do not type this as
// number — parse with Number(...) at the point of use instead.
export interface ZDriveFile {
  id: string;
  name: string;
  size: string;
  mimeType?: string;
  createdAt: string;
  // Present on every backend file response (files.service.ts maps
  // straight off the Prisma File row) but was missing from this type
  // until now - null means the file lives at root ("My Drive").
  folderId: string | null;
}

// Matches FilesService.findOne()'s actual return shape.
export interface FileDetails {
  id: string;
  name: string;
  mimeType: string;
  size: string;
  previewUrl: string;
  createdAt: string;
}

// Matches FilesService.createShareLink()'s actual return shape.
// `shareUrl` is a relative path ("/share/:token"), not an absolute
// URL - prefix with WEB_BASE_URL before sharing/opening it.
export interface ShareResponse {
  token: string;
  shareUrl: string;
}

// Matches FilesService.getSharedFiles()'s actual return shape.
// GET /files/shared returns FileShare records with a nested `file`
// summary, NOT a flat ZDriveFile[] - don't destructure name/size
// directly off the top-level item.
export interface SharedFileEntry {
  id: string;
  token: string;
  shareUrl: string;
  createdAt: string;
  file: {
    id: string;
    name: string;
    size: string;
  };
}

// Matches StorageService.uploadFile()'s actual return shape.
// There is no `success` flag and no `fileId` key - the created
// file's id is returned as `id`. A thrown error (non-2xx) is how
// failure is signaled, not a boolean field.
export interface UploadResponse {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  s3Key: string;
  folderId: string | null;
}
