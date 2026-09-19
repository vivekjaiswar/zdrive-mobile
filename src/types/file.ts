export interface ZDriveFile {
  id: string;
  name: string;
  size: string;
  mimeType?: string;
  createdAt: string;
  folderId: string | null;
  moderationStatus?: 'NOT_APPLICABLE' | 'CLEAN' | 'FLAGGED' | 'UNCHECKED';
  moderationScore?: number | null;
  distance?: number;
}

export interface FileDetails {
  id: string;
  name: string;
  mimeType: string;
  size: string;
  previewUrl: string;
  createdAt: string;
}

export interface FileVersion {
  id: string;
  fileId: string;
  versionNumber: number;
  size: string;
  createdAt: string;
}

export interface ShareResponse {
  token: string;
  shareUrl: string;
}

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

export interface UploadResponse {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  s3Key: string;
  folderId: string | null;
}

export interface BulkDownloadTicket {
  downloadUrl: string;
  expiresIn: number;
  fileCount: number;
}
