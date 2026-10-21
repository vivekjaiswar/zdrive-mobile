import { File, Paths } from 'expo-file-system';
import { unzip, unzipSync } from 'fflate';

import filesService from './files.service';
import foldersService from './folders.service';
import { ZDriveFile } from '@/types/file';

export interface ZipEntryInfo {
  name: string;
  path: string;
  size: number;
  isDirectory: boolean;
}

export interface UnzipProgress {
  current: number;
  total: number;
  filename: string;
}

function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'svg':
      return 'image/svg+xml';
    case 'mp4':
      return 'video/mp4';
    case 'mov':
      return 'video/quicktime';
    case 'mkv':
      return 'video/x-matroska';
    case 'mp3':
      return 'audio/mpeg';
    case 'wav':
      return 'audio/wav';
    case 'm4a':
      return 'audio/mp4';
    case 'pdf':
      return 'application/pdf';
    case 'json':
      return 'application/json';
    case 'txt':
    case 'md':
    case 'log':
      return 'text/plain';
    case 'html':
    case 'htm':
      return 'text/html';
    case 'css':
      return 'text/css';
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      return 'text/javascript';
    default:
      return 'application/octet-stream';
  }
}

class UnzipService {
  /**
   * Reads a remote or local zip file and lists all entries without uploading.
   */
  async listEntries(previewUrl: string): Promise<ZipEntryInfo[]> {
    const res = await fetch(previewUrl);
    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    const unzipped = unzipSync(bytes);
    const entries: ZipEntryInfo[] = Object.keys(unzipped).map((path) => {
      const isDirectory = path.endsWith('/');
      const parts = path.replace(/\/$/, '').split('/');
      const name = parts[parts.length - 1];
      const size = unzipped[path].byteLength;
      return { name, path, size, isDirectory };
    });

    return entries;
  }

  /**
   * Downloads a zip file, extracts all entries, and uploads them to the target folder.
   * If createSubfolder is true, creates a new folder named after the zip file.
   */
  async extractZip(
    file: ZDriveFile | { id: string; name: string; previewUrl?: string },
    options: {
      targetFolderId?: string;
      createSubfolder?: boolean;
      onProgress?: (progress: UnzipProgress) => void;
    } = {},
  ): Promise<{ extractedCount: number; destinationFolderId?: string }> {
    const { targetFolderId, createSubfolder = true, onProgress } = options;

    // 1. Fetch preview URL if not present
    let url = (file as any).previewUrl;
    if (!url) {
      const details = await filesService.details(file.id);
      url = details.previewUrl;
    }

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to download zip file (HTTP ${res.status})`);
    }

    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // 2. Decompress synchronously (fflate's async unzip requires Web Workers not available in Hermes)
    const unzipped = unzipSync(bytes);

    // 3. Determine base destination folder
    let destFolderId = targetFolderId;
    if (createSubfolder) {
      const folderName = file.name.replace(/\.zip$/i, '') || 'Extracted Files';
      const newFolder = await foldersService.create(folderName, targetFolderId);
      destFolderId = newFolder.id;
    }

    // 4. Cache created subfolders so we don't recreate them repeatedly
    const folderCache = new Map<string, string>();
    if (destFolderId) {
      folderCache.set('', destFolderId);
    }

    // Filter out directories and root noise (like __MACOSX)
    const validEntries = Object.keys(unzipped).filter(
      (path) => !path.endsWith('/') && !path.startsWith('__MACOSX/'),
    );

    let extractedCount = 0;

    for (let i = 0; i < validEntries.length; i++) {
      const entryPath = validEntries[i];
      const entryBytes = unzipped[entryPath];
      const pathParts = entryPath.split('/');
      const fileName = pathParts.pop() || `file_${i}`;
      const dirPath = pathParts.join('/');

      onProgress?.({
        current: i + 1,
        total: validEntries.length,
        filename: fileName,
      });

      // Resolve subfolder if the entry was in a subfolder inside the zip
      let entryFolderId = destFolderId;
      if (dirPath) {
        let currentParent = destFolderId;
        let cumulative = '';

        for (const segment of pathParts) {
          cumulative = cumulative ? `${cumulative}/${segment}` : segment;
          if (folderCache.has(cumulative)) {
            currentParent = folderCache.get(cumulative);
          } else {
            try {
              const created = await foldersService.create(segment, currentParent);
              folderCache.set(cumulative, created.id);
              currentParent = created.id;
            } catch {
              // If folder exists, fallback to currentParent
            }
          }
        }
        entryFolderId = currentParent;
      }

      // Write bytes to temp cache file
      const safeTempName = `unzip_${Date.now()}_${i}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const tempFile = new File(Paths.cache, safeTempName);

      try {
        tempFile.write(entryBytes);
        const mimeType = getMimeType(fileName);

        await filesService.upload(
          tempFile.uri,
          fileName,
          mimeType,
          entryFolderId,
        );

        extractedCount++;
      } catch (uploadErr) {
        console.warn(`Failed to upload extracted file ${fileName}:`, uploadErr);
      } finally {
        try {
          if (tempFile.exists) tempFile.delete();
        } catch {}
      }
    }

    return { extractedCount, destinationFolderId: destFolderId };
  }
}

export default new UnzipService();
