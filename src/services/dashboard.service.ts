import api from './api';

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
  recentFiles: Array<{
    id: string;
    name: string;
    mimeType: string;
    createdAt: string;
  }>;
  recentFolders: Array<{
    id: string;
    name: string;
    createdAt: string;
  }>;
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
