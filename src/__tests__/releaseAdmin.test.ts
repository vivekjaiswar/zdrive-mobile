import { useReleaseAdminStore } from '../store/releaseAdmin.store';

describe('useReleaseAdminStore', () => {
  beforeEach(() => {
    // Reset to initial state
    useReleaseAdminStore.setState({
      appVersion: '1.9.5',
      buildNumber: '17',
      releaseChannel: 'production',
      releaseStatus: 'STABLE',
      maintenanceMode: false,
      maintenanceMessage: 'OJI Drive is temporarily down for scheduled backend upgrades.',
      featureFlags: {
        smartSearch: true,
        zipExtraction: true,
        autoBackup: true,
        videoPreview: true,
        twoFactorAuth: true,
        sentryTelemetry: true,
      },
      errorReports: [],
      isHydrated: true,
    });
  });

  it('toggles feature flags individually', async () => {
    const { setFeatureFlag } = useReleaseAdminStore.getState();
    await setFeatureFlag('smartSearch', false);

    expect(useReleaseAdminStore.getState().featureFlags.smartSearch).toBe(false);
    expect(useReleaseAdminStore.getState().featureFlags.zipExtraction).toBe(true);
  });

  it('rolls back all features and marks status as ROLLED_BACK', async () => {
    const { rollbackAllFeatures } = useReleaseAdminStore.getState();
    await rollbackAllFeatures();

    const state = useReleaseAdminStore.getState();
    expect(state.releaseStatus).toBe('ROLLED_BACK');
    expect(state.featureFlags.smartSearch).toBe(false);
    expect(state.featureFlags.zipExtraction).toBe(false);
    expect(state.featureFlags.autoBackup).toBe(false);
  });

  it('restores all features and returns status to STABLE', async () => {
    const { rollbackAllFeatures, restoreAllFeatures } = useReleaseAdminStore.getState();
    await rollbackAllFeatures();
    await restoreAllFeatures();

    const state = useReleaseAdminStore.getState();
    expect(state.releaseStatus).toBe('STABLE');
    expect(state.featureFlags.smartSearch).toBe(true);
    expect(state.featureFlags.zipExtraction).toBe(true);
  });

  it('records, queries, and resolves error reports', async () => {
    const { addErrorReport, markReportResolved } = useReleaseAdminStore.getState();

    await addErrorReport({
      message: 'Failed to upload blob',
      code: 'NETWORK_TIMEOUT',
      endpoint: '/files/upload',
      severity: 'CRITICAL',
    });

    let reports = useReleaseAdminStore.getState().errorReports;
    expect(reports.length).toBe(1);
    expect(reports[0].message).toBe('Failed to upload blob');
    expect(reports[0].resolved).toBe(false);

    await markReportResolved(reports[0].id);
    reports = useReleaseAdminStore.getState().errorReports;
    expect(reports[0].resolved).toBe(true);
  });

  it('controls maintenance mode and broadcast message', async () => {
    const { setMaintenanceMode } = useReleaseAdminStore.getState();
    await setMaintenanceMode(true, 'Server migrating databases.');

    const state = useReleaseAdminStore.getState();
    expect(state.maintenanceMode).toBe(true);
    expect(state.maintenanceMessage).toBe('Server migrating databases.');
  });
});
