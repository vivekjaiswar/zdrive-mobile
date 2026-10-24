import { useState, useMemo } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

import GlassScreen from '@/components/glass/GlassScreen';
import GlassCard from '@/components/glass/GlassCard';
import { GlassTheme, useGlass } from '@/theme/glass';
import { fonts } from '@/theme/typography';
import { useAuthStore } from '@/store/auth.store';
import {
  useReleaseAdminStore,
  ReleaseStatus,
  ReleaseChannel,
  ErrorSeverity,
  ErrorReport,
} from '@/store/releaseAdmin.store';

export default function AdminPortalScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  if (user?.role !== 'ADMIN') {
    return <Redirect href="/(tabs)/dashboard" />;
  }

  const g = useGlass();
  const styles = getStyles(g);

  const {
    appVersion,
    buildNumber,
    releaseChannel,
    releaseStatus,
    maintenanceMode,
    maintenanceMessage,
    featureFlags,
    errorReports,
    setFeatureFlag,
    rollbackAllFeatures,
    restoreAllFeatures,
    setReleaseStatus,
    setReleaseChannel,
    setMaintenanceMode,
    addErrorReport,
    markReportResolved,
    clearErrorReports,
  } = useReleaseAdminStore();

  const [activeTab, setActiveTab] = useState<'release' | 'features' | 'errors'>('release');
  const [errorFilter, setErrorFilter] = useState<'ALL' | ErrorSeverity>('ALL');
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [editingMessage, setEditingMessage] = useState(false);
  const [customMsg, setCustomMsg] = useState(maintenanceMessage);

  const filteredErrors = useMemo(() => {
    if (errorFilter === 'ALL') return errorReports;
    return errorReports.filter((r) => r.severity === errorFilter);
  }, [errorReports, errorFilter]);

  const unresolvedCount = errorReports.filter((r) => !r.resolved).length;

  function handleRollbackConfirm() {
    Alert.alert(
      'Confirm Emergency Rollback',
      'This will instantly disable all new and experimental features (Smart AI search, Zip decompression, Auto Backup, and Video Player) and set the release state to ROLLED_BACK.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Rollback Now',
          style: 'destructive',
          onPress: async () => {
            await rollbackAllFeatures();
            Alert.alert('Rollback Activated', 'All new features have been disabled across the client.');
          },
        },
      ],
    );
  }

  function handleRestoreConfirm() {
    Alert.alert('Restore All Features', 'Re-enable all stable features and mark the release as STABLE?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Restore',
        onPress: async () => {
          await restoreAllFeatures();
          Alert.alert('Restored', 'All features are now active.');
        },
      },
    ]);
  }

  async function handleCopyDiagnostics() {
    const payload = JSON.stringify(
      {
        appVersion,
        buildNumber,
        releaseChannel,
        releaseStatus,
        maintenanceMode,
        featureFlags,
        totalErrors: errorReports.length,
        errors: errorReports,
      },
      null,
      2,
    );
    await Clipboard.setStringAsync(payload);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  }

  function handleSimulateError() {
    const samples = [
      {
        message: 'Request failed with status code 503: Service Unavailable',
        code: '503',
        endpoint: '/files/search/semantic',
        severity: 'CRITICAL' as ErrorSeverity,
      },
      {
        message: 'Network connection timeout (30000ms exceeded)',
        code: 'ECONNABORTED',
        endpoint: '/users/backup/upload',
        severity: 'CRITICAL' as ErrorSeverity,
      },
      {
        message: 'Invalid authorization payload: token expired',
        code: '403',
        endpoint: '/folders/contents',
        severity: 'WARNING' as ErrorSeverity,
      },
    ];
    const sample = samples[Math.floor(Math.random() * samples.length)];
    addErrorReport(sample);
  }

  return (
    <GlassScreen edges={['top', 'left', 'right', 'bottom']}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={g.text} />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Admin Console</Text>
          <Text style={styles.headerSub}>Release Management & Error Control</Text>
        </View>

        <View
          style={[
            styles.statusTag,
            releaseStatus === 'STABLE'
              ? styles.tagStable
              : releaseStatus === 'HOTFIX'
                ? styles.tagHotfix
                : styles.tagRolledBack,
          ]}
        >
          <Text style={styles.statusTagText}>{releaseStatus}</Text>
        </View>
      </View>

      {/* Segmented Navigation */}
      <View style={styles.segmentContainer}>
        {(
          [
            { id: 'release', label: 'Release', icon: 'rocket-launch-outline' },
            { id: 'features', label: 'Feature Flags', icon: 'toggle-switch-outline' },
            {
              id: 'errors',
              label: `Errors (${unresolvedCount})`,
              icon: 'alert-circle-outline',
            },
          ] as const
        ).map((tab) => {
          const active = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[styles.segmentBtn, active && styles.segmentBtnActive]}
            >
              <MaterialCommunityIcons
                name={tab.icon}
                size={16}
                color={active ? '#FFFFFF' : g.textSecondary}
              />
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {copiedNotification && (
        <View style={styles.toast}>
          <MaterialCommunityIcons name="check-circle" size={16} color="#FFFFFF" />
          <Text style={styles.toastText}>Diagnostics JSON copied to clipboard!</Text>
        </View>
      )}

      {/* Tab 1: Release & App Control */}
      {activeTab === 'release' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Version Info Card */}
          <GlassCard strong padding={18} radius={20} style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="cellphone-cog" size={22} color={g.accent} />
              <Text style={styles.cardTitle}>App Version & Target</Text>
            </View>

            <View style={styles.metricGrid}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>INSTALLED VERSION</Text>
                <Text style={styles.metricVal}>v{appVersion}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>BUILD CODE</Text>
                <Text style={styles.metricVal}>#{buildNumber}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.inputLabel}>RELEASE CHANNEL</Text>
            <View style={styles.channelRow}>
              {(['production', 'staging', 'preview'] as ReleaseChannel[]).map((ch) => {
                const active = releaseChannel === ch;
                return (
                  <Pressable
                    key={ch}
                    onPress={() => setReleaseChannel(ch)}
                    style={[styles.channelChip, active && styles.channelChipActive]}
                  >
                    <Text
                      style={[styles.channelChipText, active && styles.channelChipTextActive]}
                    >
                      {ch.toUpperCase()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.divider} />

            <Text style={styles.inputLabel}>RELEASE STATE OVERRIDE</Text>
            <View style={styles.channelRow}>
              {(['STABLE', 'HOTFIX', 'ROLLED_BACK'] as ReleaseStatus[]).map((st) => {
                const active = releaseStatus === st;
                return (
                  <Pressable
                    key={st}
                    onPress={() => setReleaseStatus(st)}
                    style={[
                      styles.channelChip,
                      active &&
                        (st === 'STABLE'
                          ? styles.chipGreen
                          : st === 'HOTFIX'
                            ? styles.chipOrange
                            : styles.chipRed),
                    ]}
                  >
                    <Text
                      style={[styles.channelChipText, active && styles.channelChipTextActive]}
                    >
                      {st}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </GlassCard>

          {/* Maintenance Mode Card */}
          <GlassCard strong padding={18} radius={20} style={styles.card}>
            <View style={styles.switchRow}>
              <View style={styles.switchTextWrap}>
                <Text style={styles.cardTitle}>Maintenance Mode</Text>
                <Text style={styles.cardDesc}>
                  Blocks user actions with an in-app upgrade message while backend maintenance is in
                  progress.
                </Text>
              </View>
              <Switch
                value={maintenanceMode}
                onValueChange={(val) => setMaintenanceMode(val)}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: g.accent }}
              />
            </View>

            {maintenanceMode && (
              <View style={styles.maintenanceBox}>
                <Text style={styles.inputLabel}>ANNOUNCEMENT MESSAGE</Text>
                {editingMessage ? (
                  <View>
                    <TextInput
                      style={styles.textInput}
                      value={customMsg}
                      onChangeText={setCustomMsg}
                      multiline
                    />
                    <Pressable
                      style={styles.saveBtn}
                      onPress={() => {
                        setMaintenanceMode(true, customMsg);
                        setEditingMessage(false);
                      }}
                    >
                      <Text style={styles.saveBtnText}>Save Message</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.msgRow}>
                    <Text style={styles.maintenancePreview}>{maintenanceMessage}</Text>
                    <Pressable onPress={() => setEditingMessage(true)} hitSlop={8}>
                      <MaterialCommunityIcons name="pencil-outline" size={18} color={g.accent} />
                    </Pressable>
                  </View>
                )}
              </View>
            )}
          </GlassCard>

          {/* Action Center Card */}
          <GlassCard strong padding={18} radius={20} style={styles.card}>
            <Text style={styles.cardTitle}>Emergency Release Actions</Text>
            <Text style={styles.cardDesc}>
              Instantly mitigate production incidents by triggering a client rollback or full
              restoration.
            </Text>

            <Pressable style={styles.rollbackBtn} onPress={handleRollbackConfirm}>
              <MaterialCommunityIcons name="undo-variant" size={20} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>Fix Release: Rollback New Features</Text>
            </Pressable>

            <Pressable style={styles.restoreBtn} onPress={handleRestoreConfirm}>
              <MaterialCommunityIcons name="shield-check" size={20} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>Restore All Features (Mark Stable)</Text>
            </Pressable>
          </GlassCard>
        </ScrollView>
      )}

      {/* Tab 2: Feature Flags */}
      {activeTab === 'features' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <GlassCard strong padding={18} radius={20} style={styles.card}>
            <Text style={styles.cardTitle}>Live Feature Flags</Text>
            <Text style={styles.cardDesc}>
              Toggle specific client components on or off without re-deploying the binary.
            </Text>

            {(
              [
                {
                  key: 'smartSearch',
                  title: 'AI Smart Search',
                  desc: 'Semantic image content and PDF document text embedding search',
                  icon: 'star-four-points-outline',
                },
                {
                  key: 'zipExtraction',
                  title: 'In-App Zip Extraction',
                  desc: 'Inspect and extract zip archives directly into cloud folders',
                  icon: 'zip-box-outline',
                },
                {
                  key: 'autoBackup',
                  title: 'Auto Photo Backup',
                  desc: 'Background asset synchronization from local media library',
                  icon: 'cloud-sync-outline',
                },
                {
                  key: 'videoPreview',
                  title: 'Video Player & Thumbnails',
                  desc: 'Local thumbnail extraction and native video player preview',
                  icon: 'video-outline',
                },
                {
                  key: 'twoFactorAuth',
                  title: 'Two-Factor Authentication',
                  desc: 'Enforce TOTP authenticator verification on login & settings',
                  icon: 'shield-lock-outline',
                },
                {
                  key: 'sentryTelemetry',
                  title: 'Sentry Telemetry Tracking',
                  desc: 'Capture unhandled crashes and upload diagnostic traces',
                  icon: 'chart-bell-curve-cumulative',
                },
              ] as const
            ).map((item) => (
              <View key={item.key} style={styles.flagRow}>
                <View style={styles.flagIconWrap}>
                  <MaterialCommunityIcons name={item.icon} size={20} color={g.accent} />
                </View>
                <View style={styles.flagTextWrap}>
                  <Text style={styles.flagTitle}>{item.title}</Text>
                  <Text style={styles.flagDesc}>{item.desc}</Text>
                </View>
                <Switch
                  value={featureFlags[item.key]}
                  onValueChange={(val) => setFeatureFlag(item.key, val)}
                  trackColor={{ false: 'rgba(255,255,255,0.2)', true: g.accent }}
                />
              </View>
            ))}
          </GlassCard>

          <View style={styles.quickActionRow}>
            <Pressable style={styles.halfBtnRollback} onPress={handleRollbackConfirm}>
              <MaterialCommunityIcons name="alert-octagon-outline" size={18} color="#FFFFFF" />
              <Text style={styles.halfBtnText}>Rollback All</Text>
            </Pressable>

            <Pressable style={styles.halfBtnRestore} onPress={handleRestoreConfirm}>
              <MaterialCommunityIcons name="refresh" size={18} color="#FFFFFF" />
              <Text style={styles.halfBtnText}>Enable All</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      {/* Tab 3: Live Error Reports */}
      {activeTab === 'errors' && (
        <View style={styles.errorTabContainer}>
          <View style={styles.errorControlsCard}>
            <View style={styles.filterRow}>
              {(['ALL', 'CRITICAL', 'WARNING'] as const).map((filter) => {
                const active = errorFilter === filter;
                return (
                  <Pressable
                    key={filter}
                    onPress={() => setErrorFilter(filter)}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                  >
                    <Text style={[styles.filterText, active && styles.filterTextActive]}>
                      {filter}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.errorActionsRow}>
              <Pressable style={styles.smallActionBtn} onPress={handleSimulateError}>
                <MaterialCommunityIcons name="plus" size={15} color={g.accent} />
                <Text style={styles.smallActionText}>Simulate</Text>
              </Pressable>

              <Pressable style={styles.smallActionBtn} onPress={handleCopyDiagnostics}>
                <MaterialCommunityIcons name="content-copy" size={15} color={g.accent} />
                <Text style={styles.smallActionText}>Export JSON</Text>
              </Pressable>

              <Pressable
                style={[styles.smallActionBtn, { borderColor: g.danger }]}
                onPress={() => {
                  Alert.alert('Clear Error Log', 'Delete all recorded errors?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Clear', style: 'destructive', onPress: clearErrorReports },
                  ]);
                }}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={15} color={g.danger} />
                <Text style={[styles.smallActionText, { color: g.danger }]}>Clear</Text>
              </Pressable>
            </View>
          </View>

          {filteredErrors.length === 0 ? (
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name="check-decagram-outline" size={56} color={g.success} />
              <Text style={styles.emptyTitle}>No Errors Recorded</Text>
              <Text style={styles.emptySub}>
                All API requests and client components are performing within normal parameters.
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredErrors}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.errorList}
              renderItem={({ item }) => (
                <GlassCard strong padding={14} radius={16} style={styles.errorCard}>
                  <View style={styles.errorCardTop}>
                    <View
                      style={[
                        styles.severityTag,
                        item.severity === 'CRITICAL' ? styles.tagCritical : styles.tagWarning,
                      ]}
                    >
                      <Text style={styles.severityTagText}>{item.severity}</Text>
                    </View>

                    {item.code && (
                      <View style={styles.codeTag}>
                        <Text style={styles.codeTagText}>{item.code}</Text>
                      </View>
                    )}

                    <Text style={styles.errorTime}>
                      {new Date(item.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </Text>

                    {item.resolved ? (
                      <View style={styles.resolvedBadge}>
                        <MaterialCommunityIcons name="check" size={12} color={g.success} />
                        <Text style={styles.resolvedText}>Resolved</Text>
                      </View>
                    ) : (
                      <Pressable
                        style={styles.resolveBtn}
                        onPress={() => markReportResolved(item.id)}
                        hitSlop={8}
                      >
                        <Text style={styles.resolveBtnText}>Mark Fixed</Text>
                      </Pressable>
                    )}
                  </View>

                  <Text style={styles.errorMessage}>{item.message}</Text>

                  {item.endpoint && (
                    <Text style={styles.errorEndpoint}>Endpoint: {item.endpoint}</Text>
                  )}
                </GlassCard>
              )}
            />
          )}
        </View>
      )}
    </GlassScreen>
  );
}

function getStyles(g: GlassTheme) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      marginBottom: 6,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: g.glassFillStrong,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: g.glassBorder,
    },
    headerTitleWrap: {
      flex: 1,
      marginLeft: 12,
    },
    headerTitle: {
      fontSize: 18,
      fontFamily: fonts.bold,
      color: g.text,
      letterSpacing: -0.3,
    },
    headerSub: {
      fontSize: 11.5,
      fontFamily: fonts.medium,
      color: g.textSecondary,
      marginTop: 1,
    },
    statusTag: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    statusTagText: {
      fontSize: 10.5,
      fontFamily: fonts.bold,
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },
    tagStable: { backgroundColor: '#059669' },
    tagHotfix: { backgroundColor: '#D97706' },
    tagRolledBack: { backgroundColor: '#DC2626' },
    segmentContainer: {
      flexDirection: 'row',
      backgroundColor: g.glassFillStrong,
      borderRadius: 14,
      padding: 4,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: g.glassBorder,
    },
    segmentBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 8,
      borderRadius: 10,
    },
    segmentBtnActive: {
      backgroundColor: g.accent,
    },
    segmentText: {
      fontSize: 12,
      fontFamily: fonts.medium,
      color: g.textSecondary,
    },
    segmentTextActive: {
      color: '#FFFFFF',
      fontFamily: fonts.semiBold,
    },
    scroll: {
      paddingBottom: 40,
    },
    card: {
      marginBottom: 14,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    cardTitle: {
      fontSize: 15,
      fontFamily: fonts.semiBold,
      color: g.text,
    },
    cardDesc: {
      fontSize: 12,
      fontFamily: fonts.regular,
      color: g.textSecondary,
      marginTop: 2,
      lineHeight: 17,
      marginBottom: 12,
    },
    metricGrid: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 8,
    },
    metricBox: {
      flex: 1,
      backgroundColor: g.accentSoft,
      padding: 12,
      borderRadius: 12,
    },
    metricLabel: {
      fontSize: 10,
      fontFamily: fonts.bold,
      color: g.textSecondary,
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    metricVal: {
      fontSize: 16,
      fontFamily: fonts.bold,
      color: g.text,
    },
    divider: {
      height: 1,
      backgroundColor: g.glassBorder,
      marginVertical: 12,
    },
    inputLabel: {
      fontSize: 10.5,
      fontFamily: fonts.bold,
      color: g.textSecondary,
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    channelRow: {
      flexDirection: 'row',
      gap: 8,
    },
    channelChip: {
      flex: 1,
      paddingVertical: 7,
      alignItems: 'center',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: g.glassBorder,
      backgroundColor: g.glassFill,
    },
    channelChipActive: {
      backgroundColor: g.accent,
      borderColor: g.accent,
    },
    chipGreen: { backgroundColor: '#059669', borderColor: '#059669' },
    chipOrange: { backgroundColor: '#D97706', borderColor: '#D97706' },
    chipRed: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
    channelChipText: {
      fontSize: 11,
      fontFamily: fonts.semiBold,
      color: g.textSecondary,
    },
    channelChipTextActive: {
      color: '#FFFFFF',
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    switchTextWrap: {
      flex: 1,
      marginRight: 12,
    },
    maintenanceBox: {
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderColor: g.glassBorder,
    },
    textInput: {
      backgroundColor: g.glassFill,
      borderWidth: 1,
      borderColor: g.glassBorder,
      borderRadius: 10,
      padding: 10,
      fontSize: 13,
      fontFamily: fonts.regular,
      color: g.text,
      minHeight: 60,
    },
    saveBtn: {
      alignSelf: 'flex-end',
      backgroundColor: g.accent,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      marginTop: 6,
    },
    saveBtnText: {
      fontSize: 12,
      fontFamily: fonts.semiBold,
      color: '#FFFFFF',
    },
    msgRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: g.glassFill,
      padding: 10,
      borderRadius: 10,
    },
    maintenancePreview: {
      fontSize: 12.5,
      fontFamily: fonts.medium,
      color: g.text,
      flex: 1,
      marginRight: 8,
    },
    rollbackBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: '#DC2626',
      paddingVertical: 12,
      borderRadius: 14,
      marginTop: 6,
      marginBottom: 10,
    },
    restoreBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: '#059669',
      paddingVertical: 12,
      borderRadius: 14,
    },
    actionBtnText: {
      fontSize: 13.5,
      fontFamily: fonts.semiBold,
      color: '#FFFFFF',
    },
    flagRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderColor: g.glassBorder,
    },
    flagIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: g.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    flagTextWrap: {
      flex: 1,
      marginRight: 8,
    },
    flagTitle: {
      fontSize: 13.5,
      fontFamily: fonts.semiBold,
      color: g.text,
    },
    flagDesc: {
      fontSize: 11,
      fontFamily: fonts.regular,
      color: g.textSecondary,
      marginTop: 2,
    },
    quickActionRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 6,
    },
    halfBtnRollback: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: '#DC2626',
      paddingVertical: 12,
      borderRadius: 12,
    },
    halfBtnRestore: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: '#059669',
      paddingVertical: 12,
      borderRadius: 12,
    },
    halfBtnText: {
      fontSize: 13,
      fontFamily: fonts.semiBold,
      color: '#FFFFFF',
    },
    errorTabContainer: {
      flex: 1,
    },
    errorControlsCard: {
      backgroundColor: g.glassFillStrong,
      borderRadius: 16,
      padding: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: g.glassBorder,
    },
    filterRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 10,
    },
    filterChip: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor: g.glassFill,
      borderWidth: 1,
      borderColor: g.glassBorder,
    },
    filterChipActive: {
      backgroundColor: g.accent,
      borderColor: g.accent,
    },
    filterText: {
      fontSize: 11,
      fontFamily: fonts.medium,
      color: g.textSecondary,
    },
    filterTextActive: {
      color: '#FFFFFF',
      fontFamily: fonts.semiBold,
    },
    errorActionsRow: {
      flexDirection: 'row',
      gap: 8,
      justifyContent: 'flex-end',
    },
    smallActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: g.accent,
      backgroundColor: g.glassFill,
    },
    smallActionText: {
      fontSize: 11,
      fontFamily: fonts.medium,
      color: g.accent,
    },
    errorList: {
      paddingBottom: 30,
    },
    errorCard: {
      marginBottom: 8,
    },
    errorCardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 6,
    },
    severityTag: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 5,
    },
    severityTagText: {
      fontSize: 9.5,
      fontFamily: fonts.bold,
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },
    tagCritical: { backgroundColor: '#DC2626' },
    tagWarning: { backgroundColor: '#D97706' },
    codeTag: {
      backgroundColor: g.glassFill,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 5,
      borderWidth: 1,
      borderColor: g.glassBorder,
    },
    codeTagText: {
      fontSize: 9.5,
      fontFamily: fonts.bold,
      color: g.text,
    },
    errorTime: {
      fontSize: 11,
      fontFamily: fonts.regular,
      color: g.textSecondary,
      flex: 1,
    },
    resolvedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    resolvedText: {
      fontSize: 11,
      fontFamily: fonts.medium,
      color: g.success,
    },
    resolveBtn: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: g.accentSoft,
    },
    resolveBtnText: {
      fontSize: 10.5,
      fontFamily: fonts.semiBold,
      color: g.accent,
    },
    errorMessage: {
      fontSize: 12.5,
      fontFamily: fonts.medium,
      color: g.text,
      lineHeight: 18,
    },
    errorEndpoint: {
      fontSize: 11,
      fontFamily: fonts.regular,
      color: g.textSecondary,
      marginTop: 4,
    },
    emptyWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
    },
    emptyTitle: {
      fontSize: 16,
      fontFamily: fonts.semiBold,
      color: g.text,
      marginTop: 12,
      marginBottom: 4,
    },
    emptySub: {
      fontSize: 12.5,
      fontFamily: fonts.regular,
      color: g.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
    },
    toast: {
      position: 'absolute',
      bottom: 24,
      left: 24,
      right: 24,
      backgroundColor: 'rgba(30,30,30,0.92)',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      zIndex: 100,
    },
    toastText: {
      color: '#FFFFFF',
      fontSize: 12.5,
      fontFamily: fonts.semiBold,
    },
  });
}
