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

// Matches DashboardService.stats()'s actual return shape on the
// backend. Note the field is `storagePercent`, not `usagePercentage`,
// and there is no `subscriptionExpiresAt` in this response.
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
}

class DashboardService {
  async getStats(): Promise<DashboardStats> {
    const response = await api.get<DashboardStats>(
      '/dashboard/stats',
    );

    return response.data;
  }
}

export default new DashboardService();
