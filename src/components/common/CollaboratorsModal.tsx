import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import filesService from '@/services/files.service';
import foldersService from '@/services/folders.service';
import { Collaborator } from '@/types/file';
import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';

interface Props {
  visible: boolean;
  resourceId: string | null;
  resourceName?: string;
  resourceType: 'file' | 'folder';
  onClose: () => void;
}

export default function CollaboratorsModal({
  visible,
  resourceId,
  resourceName,
  resourceType,
  onClose,
}: Props) {
  const colors = useColors();
  const styles = getStyles(colors);

  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'VIEWER' | 'EDITOR'>('VIEWER');
  const [inviting, setInviting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (visible && resourceId) {
      loadCollaborators();
      setEmail('');
    }
  }, [visible, resourceId]);

  async function loadCollaborators() {
    if (!resourceId) return;
    try {
      setLoading(true);
      const data =
        resourceType === 'file'
          ? await filesService.listCollaborators(resourceId)
          : await foldersService.listCollaborators(resourceId);
      setCollaborators(data);
    } catch {
      setCollaborators([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!resourceId || !email.trim()) return;
    try {
      setInviting(true);
      if (resourceType === 'file') {
        await filesService.addCollaborator(resourceId, email.trim(), role);
      } else {
        await foldersService.addCollaborator(resourceId, email.trim(), role);
      }
      setEmail('');
      await loadCollaborators();
      Alert.alert('Success', `Invited ${email.trim()} as ${role}.`);
    } catch (e: any) {
      Alert.alert('Invite Failed', e?.response?.data?.message ?? 'Could not add collaborator.');
    } finally {
      setInviting(false);
    }
  }

  async function handleRoleToggle(collab: Collaborator) {
    if (!resourceId) return;
    const newRole: 'VIEWER' | 'EDITOR' = collab.role === 'EDITOR' ? 'VIEWER' : 'EDITOR';
    try {
      if (resourceType === 'file') {
        await filesService.updateCollaborator(resourceId, collab.id, newRole);
      } else {
        await foldersService.updateCollaborator(resourceId, collab.id, newRole);
      }
      await loadCollaborators();
    } catch (e: any) {
      Alert.alert('Update Failed', e?.response?.data?.message ?? 'Could not update role.');
    }
  }

  async function handleRemove(collaboratorId: string, collabEmail: string) {
    if (!resourceId) return;
    Alert.alert('Remove Collaborator?', `Remove access for ${collabEmail}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            setRemovingId(collaboratorId);
            if (resourceType === 'file') {
              await filesService.removeCollaborator(resourceId, collaboratorId);
            } else {
              await foldersService.removeCollaborator(resourceId, collaboratorId);
            }
            await loadCollaborators();
          } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.message ?? 'Could not remove collaborator.');
          } finally {
            setRemovingId(null);
          }
        },
      },
    ]);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>Collaborators</Text>
            {resourceName && (
              <Text style={styles.subtitle} numberOfLines={1}>
                {resourceName}
              </Text>
            )}
          </View>

          {/* Invite Form */}
          <View style={styles.inviteCard}>
            <Text style={styles.formLabel}>Invite Person</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="User's email"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Pressable
                style={[styles.roleChip, role === 'EDITOR' && styles.roleChipActive]}
                onPress={() => setRole(role === 'EDITOR' ? 'VIEWER' : 'EDITOR')}
              >
                <Text style={[styles.roleChipText, role === 'EDITOR' && styles.roleChipTextActive]}>
                  {role}
                </Text>
              </Pressable>
            </View>

            <Pressable
              style={[styles.inviteBtn, (!email.trim() || inviting) && styles.btnDisabled]}
              disabled={!email.trim() || inviting}
              onPress={handleAdd}
            >
              {inviting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.inviteBtnText}>Invite Collaborator</Text>
              )}
            </Pressable>
          </View>

          <Text style={styles.listLabel}>People With Direct Access</Text>

          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 24 }} />
          ) : (
            <FlatList
              data={collaborators}
              keyExtractor={(item) => item.id}
              style={styles.list}
              renderItem={({ item }) => (
                <View style={styles.collabRow}>
                  <View style={styles.collabAvatar}>
                    <Text style={styles.avatarInitial}>
                      {(item.user.name ?? item.user.email)[0].toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.collabInfo}>
                    <Text style={styles.collabEmail} numberOfLines={1}>
                      {item.user.name ? `${item.user.name} (${item.user.email})` : item.user.email}
                    </Text>
                    <Pressable onPress={() => handleRoleToggle(item)}>
                      <Text style={styles.collabRoleToggle}>Role: {item.role} (Tap to change)</Text>
                    </Pressable>
                  </View>

                  <Pressable
                    hitSlop={10}
                    disabled={removingId === item.id}
                    onPress={() => handleRemove(item.id, item.user.email)}
                    style={styles.removeBtn}
                  >
                    {removingId === item.id ? (
                      <ActivityIndicator size="small" color={colors.danger} />
                    ) : (
                      <MaterialCommunityIcons name="delete-outline" size={20} color={colors.danger} />
                    )}
                  </Pressable>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No collaborators yet. Invite someone above.</Text>
              }
            />
          )}

          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Done</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

import { fonts } from '@/theme/typography';

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(8, 12, 22, 0.55)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 22,
      paddingTop: 12,
      paddingBottom: 32,
      maxHeight: '85%',
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 3,
      backgroundColor: colors.border,
      marginBottom: 16,
    },
    header: {
      marginBottom: 16,
    },
    title: {
      fontFamily: fonts.bold,
      fontSize: 20,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.4,
    },
    subtitle: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    inviteCard: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: 16,
      padding: 14,
      marginBottom: 18,
    },
    formLabel: {
      fontFamily: fonts.semiBold,
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 10,
    },
    input: {
      fontFamily: fonts.regular,
      flex: 1,
      height: 44,
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 12,
      fontSize: 14,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    roleChip: {
      height: 44,
      paddingHorizontal: 12,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    roleChipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    roleChipText: {
      fontFamily: fonts.bold,
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    roleChipTextActive: {
      color: colors.primary,
    },
    inviteBtn: {
      height: 42,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnDisabled: {
      opacity: 0.5,
    },
    inviteBtnText: {
      fontFamily: fonts.bold,
      color: '#fff',
      fontSize: 14,
      fontWeight: '700',
    },
    listLabel: {
      fontFamily: fonts.semiBold,
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 10,
    },
    list: {
      flexGrow: 0,
      maxHeight: 220,
    },
    collabRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 12,
    },
    collabAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitial: {
      fontFamily: fonts.bold,
      fontSize: 15,
      fontWeight: '700',
      color: colors.primary,
    },
    collabInfo: {
      flex: 1,
    },
    collabEmail: {
      fontFamily: fonts.semiBold,
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    collabRoleToggle: {
      fontFamily: fonts.medium,
      fontSize: 11,
      color: colors.primary,
      marginTop: 2,
    },
    removeBtn: {
      padding: 6,
    },
    emptyText: {
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingVertical: 16,
      fontSize: 13,
    },
    closeBtn: {
      marginTop: 16,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 14,
      backgroundColor: colors.surfaceAlt,
    },
    closeBtnText: {
      fontFamily: fonts.bold,
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
  });
}
