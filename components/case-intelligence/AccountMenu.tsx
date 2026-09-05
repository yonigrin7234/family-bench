import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signOut, useAuthStore } from '@/lib/auth/session';
import { useCaseIntelligenceStore } from '@/lib/case-intelligence/useCaseIntelligence';
import { retryTemporarySourceCleanup } from '@/lib/evidence/sourceCleanup';
import { PillButton } from '@/components/ui/fb/PillButton';
import { fbBorder, fbColors, fbFonts, fbRadii, fbSpacing, fbTouch } from '@/components/ui/fb/tokens';

export function accountInitials(user: { email?: string; user_metadata?: Record<string, unknown> }): string {
  const name = typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name.trim() : '';
  const parts = (name || user.email?.split('@')[0] || '').split(/[\s._+\-]+/).filter(Boolean);
  if (!parts.length) return '?';
  return [parts[0], ...(parts.length > 1 ? [parts[parts.length - 1]] : [])].map((part) => Array.from(part)[0]).join('').toLocaleUpperCase();
}

export function AccountDetails() {
  const user = useAuthStore((state) => state.session?.user);
  if (!user) return null;
  return <View style={styles.details}>
    <Text selectable style={styles.email}>{user.email || 'Email unavailable'}</Text>
    <Text style={styles.meta}>{user.email_confirmed_at ? 'Email verified' : 'Email verification pending'}</Text>
  </View>;
}

/** Reuse the same guarded, awaited action in the header and Settings. */
export function AccountSignOutButton({ onSignedOut, disabled = false }: { onSignedOut?: () => void; disabled?: boolean }) {
  const workspace = useCaseIntelligenceStore();
  const [busy, setBusy] = useState(false); const busyRef = useRef(false);
  const [error, setError] = useState<string | null>(null); const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const blocked = Boolean(disabled || workspace.saving || workspace.syncing || workspace.loading || workspace.switchingCase || workspace.persistence.error);

  async function leave() {
    if (busyRef.current || disabled) return;
    const auth = useAuthStore.getState(); const owner = auth.session?.user.id;
    const state = useCaseIntelligenceStore.getState();
    if (!owner || state.saving || state.syncing || state.loading || state.switchingCase || state.persistence.error) return;
    busyRef.current = true; setBusy(true); setError(null);
    try {
      // Abandoned native cache copies must remain retryable and visible. Active
      // selections are released by their screens when sign-out unmounts them.
      await retryTemporarySourceCleanup();
      const current = useAuthStore.getState(); const currentWorkspace = useCaseIntelligenceStore.getState();
      if (!mounted.current || current.session?.user.id !== owner || current.sessionGeneration !== auth.sessionGeneration) return;
      if (currentWorkspace.saving || currentWorkspace.syncing || currentWorkspace.loading || currentWorkspace.switchingCase || currentWorkspace.persistence.error) throw new Error('Finish saving your changes before signing out.');
      await signOut();
      if (mounted.current) onSignedOut?.();
    } catch (failure) {
      if (mounted.current && useAuthStore.getState().session?.user.id === owner) setError(failure instanceof Error ? failure.message : 'Unable to sign out. Please try again.');
    } finally { busyRef.current = false; if (mounted.current) setBusy(false); }
  }

  return <View style={styles.signOut}>
    {workspace.persistence.error ? <Text style={styles.error}>Retry the failed save before signing out to preserve your latest changes.</Text>
      : blocked ? <Text style={styles.meta}>Wait for saving and sync to finish before signing out.</Text> : null}
    {error ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
    <PillButton tone="ghost" disabled={busy || blocked} onPress={() => void leave()}>{busy ? 'Signing out…' : 'Sign out'}</PillButton>
  </View>;
}

export function AccountMenu() {
  const user = useAuthStore((state) => state.session?.user);
  const sessionGeneration = useAuthStore((state) => state.sessionGeneration);
  const [open, setOpen] = useState(false); const [focused, setFocused] = useState(false);
  const insets = useSafeAreaInsets();
  useEffect(() => { setOpen(false); }, [user?.id, sessionGeneration]);
  if (!user) return null;
  const close = () => setOpen(false);
  const navigate = (destination: '/' | '/settings') => { close(); router.push(destination as never); };

  return <>
    <Pressable accessibilityRole="button" accessibilityLabel={`Account menu${user.email ? ` for ${user.email}` : ''}`}
      accessibilityHint="Opens dashboard, account settings and sign out." accessibilityState={{ expanded: open }}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onPress={() => setOpen(true)}
      style={[styles.avatar, focused && styles.avatarFocused]}>
      <Text style={styles.initials}>{accountInitials(user)}</Text>
    </Pressable>
    <Modal visible={open} transparent animationType="none" onRequestClose={close} accessibilityLabel="Account menu">
      <View style={styles.overlay}>
        <Pressable accessible={false} focusable={false} importantForAccessibility="no" onPress={close} style={styles.backdrop} />
        <ScrollView accessibilityViewIsModal style={[styles.panel, { marginTop: insets.top + fbTouch.min + fbSpacing.x2, marginBottom: Math.max(insets.bottom, fbSpacing.x4) }]} contentContainerStyle={styles.panelContent} keyboardShouldPersistTaps="handled">
          <View style={styles.heading}><Text accessibilityRole="header" style={styles.title}>Account</Text><PillButton size="sm" accessibilityLabel="Close account menu" onPress={close}>Close</PillButton></View>
          <AccountDetails />
          <View style={styles.links}>
            <PillButton full onPress={() => navigate('/')}>Dashboard</PillButton>
            <PillButton full onPress={() => navigate('/settings')}>Account & settings</PillButton>
          </View>
          <Text style={styles.meta}>Signing out clears the open workspace from memory. Encrypted records stay on this device for your next sign-in.</Text>
          <AccountSignOutButton onSignedOut={close} />
        </ScrollView>
      </View>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  avatar: { width: fbTouch.min, height: fbTouch.min, borderRadius: fbRadii.pill, alignItems: 'center', justifyContent: 'center', borderWidth: fbBorder.selected, borderColor: fbColors.rule, backgroundColor: fbColors.paperDeep },
  avatarFocused: { borderWidth: fbBorder.focus, borderColor: fbColors.ox },
  initials: { color: fbColors.ink, fontFamily: fbFonts.sansSemi, fontSize: 13 },
  overlay: { flex: 1, alignItems: 'flex-end', paddingHorizontal: fbSpacing.x4 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: fbColors.rule },
  panel: { flexGrow: 0, width: 320, maxWidth: '100%', backgroundColor: fbColors.paper, borderWidth: fbBorder.hairline, borderColor: fbColors.inkMute, borderRadius: fbRadii.lg },
  panelContent: { padding: fbSpacing.x4, gap: fbSpacing.x4 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: fbSpacing.x2 },
  title: { fontFamily: fbFonts.serifRegular, fontSize: 26, color: fbColors.ink },
  details: { gap: fbSpacing.x1 },
  email: { fontFamily: fbFonts.sansMedium, fontSize: 14, lineHeight: 21, color: fbColors.ink },
  meta: { fontFamily: fbFonts.sansRegular, fontSize: 12, lineHeight: 18, color: fbColors.inkMute },
  links: { gap: fbSpacing.x2, borderTopWidth: fbBorder.hairline, borderTopColor: fbColors.rule, paddingTop: fbSpacing.x4 },
  signOut: { gap: fbSpacing.x2 },
  error: { color: fbColors.oxDeep, fontFamily: fbFonts.sansRegular, fontSize: 13, lineHeight: 19 },
});
