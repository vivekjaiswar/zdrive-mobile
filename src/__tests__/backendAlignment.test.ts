import filesService from '@/services/files.service';
import foldersService from '@/services/folders.service';
import usersService from '@/services/users.service';
import billingService from '@/services/billing.service';
import dashboardService from '@/services/dashboard.service';
import authService from '@/services/auth.service';
import api from '@/services/api';

jest.mock('@/services/api');

describe('Backend Alignment Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('FoldersService alignment', () => {
    it('calls GET /folders/all for flat folder list', async () => {
      const mockFolders = [{ id: 'f1', name: 'Folder 1', userId: 'u1', parentId: null, createdAt: '', updatedAt: '' }];
      (api.get as jest.Mock).mockResolvedValueOnce({ data: mockFolders });

      const res = await foldersService.listAll();
      expect(api.get).toHaveBeenCalledWith('/folders/all');
      expect(res).toEqual(mockFolders);
    });

    it('calls PATCH /folders/:id/move to reparent folder', async () => {
      const mockFolder = { id: 'f1', name: 'Folder 1', userId: 'u1', parentId: 'p1', createdAt: '', updatedAt: '' };
      (api.patch as jest.Mock).mockResolvedValueOnce({ data: mockFolder });

      const res = await foldersService.move('f1', 'p1');
      expect(api.patch).toHaveBeenCalledWith('/folders/f1/move', { parentId: 'p1' });
      expect(res).toEqual(mockFolder);
    });

    it('calls GET /folders/shared-with-me', async () => {
      const mockShared = [{ id: 'f2', name: 'Shared Folder', createdAt: '', ownerEmail: 'test@example.com', role: 'VIEWER' as const, sharedAt: '' }];
      (api.get as jest.Mock).mockResolvedValueOnce({ data: mockShared });

      const res = await foldersService.sharedWithMe();
      expect(api.get).toHaveBeenCalledWith('/folders/shared-with-me');
      expect(res).toEqual(mockShared);
    });
  });

  describe('FilesService alignment', () => {
    it('calls GET /files/shared-with-me', async () => {
      const mockSharedFiles = [{ id: 'file-1', name: 'Doc.pdf', mimeType: 'application/pdf', size: '1024', createdAt: '', ownerEmail: 'test@example.com', role: 'EDITOR' as const, sharedAt: '' }];
      (api.get as jest.Mock).mockResolvedValueOnce({ data: mockSharedFiles });

      const res = await filesService.sharedWithMe();
      expect(api.get).toHaveBeenCalledWith('/files/shared-with-me');
      expect(res).toEqual(mockSharedFiles);
    });

    it('manages file collaborators', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({ data: [] });
      await filesService.listCollaborators('file-1');
      expect(api.get).toHaveBeenCalledWith('/files/file-1/collaborators');

      (api.post as jest.Mock).mockResolvedValueOnce({ data: { success: true } });
      await filesService.addCollaborator('file-1', 'collab@test.com', 'EDITOR');
      expect(api.post).toHaveBeenCalledWith('/files/file-1/collaborators', { email: 'collab@test.com', role: 'EDITOR' });

      (api.delete as jest.Mock).mockResolvedValueOnce({ data: {} });
      await filesService.removeCollaborator('file-1', 'c-1');
      expect(api.delete).toHaveBeenCalledWith('/files/file-1/collaborators/c-1');
    });
  });

  describe('UsersService alignment', () => {
    it('calls GET /users/referral for referral stats', async () => {
      const mockReferral = { referralCode: 'ABC1234', referralUrl: 'https://zhdrive.in/register?ref=ABC1234', referredCount: 3, bonusStorageBytes: '6442450944' };
      (api.get as jest.Mock).mockResolvedValueOnce({ data: mockReferral });

      const res = await usersService.getReferralInfo();
      expect(api.get).toHaveBeenCalledWith('/users/referral');
      expect(res).toEqual(mockReferral);
    });

    it('calls GET /users/storage', async () => {
      const mockStorage = { storageUsed: '1000', storageLimit: '5000' };
      (api.get as jest.Mock).mockResolvedValueOnce({ data: mockStorage });

      const res = await usersService.getStorage();
      expect(api.get).toHaveBeenCalledWith('/users/storage');
      expect(res).toEqual(mockStorage);
    });

    it('calls GET /users/activity', async () => {
      const mockActivity = [{ id: 'a1', action: 'LOGIN', metadata: {}, createdAt: '', formattedDate: '' }];
      (api.get as jest.Mock).mockResolvedValueOnce({ data: mockActivity });

      const res = await usersService.getActivity();
      expect(api.get).toHaveBeenCalledWith('/users/activity');
      expect(res).toEqual(mockActivity);
    });
  });

  describe('BillingService alignment', () => {
    it('supports audience parameter on getPlans', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({ data: [] });
      await billingService.getPlans('BUSINESS');
      expect(api.get).toHaveBeenCalledWith('/billing/plans?audience=BUSINESS');
    });

    it('calls GET /billing/payments', async () => {
      const mockPayments = [{ id: 'pay-1', userId: 'u1', gateway: 'RAZORPAY', gatewayOrderId: 'ord_1', gatewayPaymentId: 'pay_1', amount: 9900, currency: 'INR', status: 'PAID', planCode: 'PRO', createdAt: '' }];
      (api.get as jest.Mock).mockResolvedValueOnce({ data: mockPayments });

      const res = await billingService.getPayments();
      expect(api.get).toHaveBeenCalledWith('/billing/payments');
      expect(res).toEqual(mockPayments);
    });
  });

  describe('DashboardService alignment', () => {
    it('calls GET /dashboard/upload-timeline with range params', async () => {
      const mockTimeline = { granularity: 'day', from: '2026-10-01', to: '2026-10-07', buckets: [] };
      (api.get as jest.Mock).mockResolvedValueOnce({ data: mockTimeline });

      const res = await dashboardService.getUploadTimeline('2026-10-01', '2026-10-07');
      expect(api.get).toHaveBeenCalledWith('/dashboard/upload-timeline?from=2026-10-01&to=2026-10-07');
      expect(res).toEqual(mockTimeline);
    });
  });

  describe('AuthService device flow alignment', () => {
    it('calls POST /auth/device/approve with userCode', async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({ data: { success: true } });

      const res = await authService.approveDevice('ABCD-1234');
      expect(api.post).toHaveBeenCalledWith('/auth/device/approve', { userCode: 'ABCD-1234' });
      expect(res).toEqual({ success: true });
    });

    it('calls POST /auth/device/deny with userCode', async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({ data: { success: true } });

      const res = await authService.denyDevice('ABCD-1234');
      expect(api.post).toHaveBeenCalledWith('/auth/device/deny', { userCode: 'ABCD-1234' });
      expect(res).toEqual({ success: true });
    });
  });
});
