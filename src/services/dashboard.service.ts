import api from './api';

// Narrower than ZDriveFile - the dashboard endpoint's recentFiles
// entries have no `size` or `folderId`, unlike GET /files.
export interface RecentFile {
  id: string;
  name: string;
  mimeType: string;
  createdAt: string;
}

// Narrower than ZDriveFolder - no `userId`/`parentId`/`updatedAt`.
export interface RecentFolder {
  id: string;
  name: string;
  createdAt: string;
}

export interface FileTypeBreakdown {
  Images: number;
  Videos: number;
  Documents: number;
  Archives: number;
  Other: number;
}

export interface ScanStatusBreakdown {
  CLEAN: number;
  PENDING: number;
  MALICIOUS: number;
}

export interface UploadTimelineBucket {
  bucketStart: string;
  count: number;
}

export interface UploadTimelineResult {
  granularity: 'day' | 'hour';
  from: string;
  to: string;
  buckets: UploadTimelineBucket[];
}

// Matches DashboardService.stats()'s actual return shape on the
// backend.
export interface DashboardStats {
  userName: string;
  storageUsed: string;
  storageLimit: string;
  storagePercent: number;
  fileCount: number;
  folderCount: number;
  trashFiles: number;
  sharedFiles: number;
  recentFiles: RecentFile[];
  recentFolders: RecentFolder[];
  plan: string;
  subscriptionStatus: string;
  accountCreated: string | null;
  fileTypeBreakdown?: FileTypeBreakdown;
  scanStatusBreakdown?: ScanStatusBreakdown;
}

class DashboardService {
  async getStats(): Promise<DashboardStats> {
    const response = await api.get<DashboardStats>(
      '/dashboard/stats',
    );

    return response.data;
  }

  async getUploadTimeline(from?: string, to?: string): Promise<UploadTimelineResult> {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const { data } = await api.get(`/dashboard/upload-timeline${queryString}`);
    return data;
  }
}

export default new DashboardService();
