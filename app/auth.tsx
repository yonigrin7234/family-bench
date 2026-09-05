import { useRef, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Linking from 'expo-linking';
import { supabase, supabaseEnvironmentStatus } from '@/lib/supabase/client';
import { hasVerifiedSession, signOut, useAuthStore } from '@/lib/auth/session';
import { NEW_PASSWORD_HELP, normalizeEmail, validateNewPassword } from '@/lib/auth/validation';
import { Display, PillButton, SoftCard, fbColors, fbFonts, fbRadii, fbSpacing } from '@/components/ui/fb';
import { Redirect } from 'expo-router';

type Mode = 'signin' | 'signup' | 'reset';

export default function AuthScreen() {
  const { session, initialized, recovery, error: sessionError } = useAuthStore();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const passwordInput = useRef<TextInput>(null);

  if (initialized && hasVerifiedSession(session) && !recovery) return <Redirect href="/" />;
  const verifying = Boolean(session && !session.user.email_confirmed_at);

  function changeMode(next: Mode) {
    setMode(next); setPassword(''); setError(null); setNotice(null);
  }

  async function submit() {
    if (busy || !supabase) return;
    setBusy(true); setError(null); setNotice(null);
    try {
      const redirectTo = Platform.OS === 'web' && typeof window !== 'undefined'
        ? `${window.location.origin}/auth`
        : Linking.createURL('auth');
      if (recovery) {
        validateNewPassword(password);
        const { error: authError } = await supabase.auth.updateUser({ password });
        if (authError) throw authError;
        // Require a fresh sign-in after a password reset, with case memory cleared.
        await signOut();
        setPassword(''); setMode('signin'); setNotice('Password updated. Sign in to open your case.');
      } else if (verifying) {
        const { error: authError } = await supabase.auth.resend({
          type: 'signup', email: session!.user.email!, options: { emailRedirectTo: redirectTo },
        });
        if (authError) throw authError;
        setNotice('Verification email requested. Open the link on this device, then sign in.');
      } else {
        const address = normalizeEmail(email);
        if (mode === 'reset') {
          const { error: authError } = await supabase.auth.resetPasswordForEmail(address, { redirectTo });
          if (authError) throw authError;
          setNotice('If an account exists for this address, you will receive a password reset email. Open it on this device.');
        } else if (mode === 'signup') {
          validateNewPassword(password);
          const { error: authError } = await supabase.auth.signUp({ email: address, password, options: { emailRedirectTo: redirectTo } });
          if (authError) throw authError;
          setPassword(''); setMode('signin');
          setNotice('Check your email to verify your account. Open the link on this device, then sign in.');
        } else {
          if (!password) throw new Error('Enter your password.');
          const { error: authError } = await supabase.auth.signInWithPassword({ email: address, password });
          if (authError) throw authError;
          setPassword('');
        }
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to complete this request. Please try again.'); }
    finally { setBusy(false); }
  }

  const heading = recovery ? 'Set a new password' : verifying ? 'Verify your email' : mode === 'signup' ? 'Create your account' : mode === 'reset' ? 'Reset your password' : 'Welcome to Family Bench';
  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <Text style={styles.brand}>FAMILY BENCH</Text>
        <Display size={36} accessibilityRole="header">{heading}</Display>
        <Text style={styles.intro}>A private place to document parenting events and organize your case records.</Text>
        <SoftCard p={24}>
          {!initialized ? <ActivityIndicator accessibilityLabel="Restoring session" /> : !supabase ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {supabaseEnvironmentStatus === 'wrong_project' ? 'This build is not connected to the Family Bench project.' : 'Account access is not configured for this build.'} Contact the person who provided this build.
            </Text>
          ) : <>
            {verifying ? <Text style={styles.intro}>Verify {session?.user.email} before creating case records.</Text> : <>
              {!recovery && <>
                <Text nativeID="auth-email-label" style={styles.label}>Email</Text>
                <TextInput accessibilityLabel="Email" aria-labelledby="auth-email-label" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" textContentType="emailAddress" style={styles.input} editable={!busy} returnKeyType={mode === 'reset' ? 'go' : 'next'} onSubmitEditing={mode === 'reset' ? submit : () => passwordInput.current?.focus()} />
              </>}
              {(recovery || mode !== 'reset') && <>
                <Text nativeID="auth-password-label" style={styles.label}>{recovery ? 'New password' : 'Password'}</Text>
                <TextInput ref={passwordInput} accessibilityLabel={recovery ? 'New password' : 'Password'} aria-labelledby="auth-password-label" accessibilityHint={mode === 'signup' || recovery ? NEW_PASSWORD_HELP : undefined} value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete={mode === 'signup' || recovery ? 'new-password' : 'current-password'} textContentType={mode === 'signup' || recovery ? 'newPassword' : 'password'} style={styles.input} editable={!busy} returnKeyType="go" onSubmitEditing={submit} />
                {(recovery || mode === 'signup') && <Text style={styles.help}>{NEW_PASSWORD_HELP}</Text>}
              </>}
            </>}
            {(error || sessionError) && <Text accessibilityRole="alert" style={styles.error}>{error || sessionError}</Text>}
            {notice && <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text>}
            <View style={styles.actions}>
              <PillButton full tone="primary" onPress={submit} disabled={busy}>
                {busy ? 'Please wait…' : recovery ? 'Update password' : verifying ? 'Resend verification email' : mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Send reset email' : 'Sign in'}
              </PillButton>
              {verifying ? <PillButton full tone="ghost" disabled={busy} onPress={() => { void signOut().catch((err) => setError(err.message)); }}>Use another account</PillButton> : !recovery && <>
                <PillButton full tone="ghost" onPress={() => changeMode(mode === 'signin' ? 'signup' : 'signin')} disabled={busy}>{mode === 'signin' ? 'Create an account' : 'Back to sign in'}</PillButton>
                {mode === 'signin' && <PillButton full tone="ghost" onPress={() => changeMode('reset')} disabled={busy}>Forgot password?</PillButton>}
              </>}
            </View>
          </>}
        </SoftCard>
        <Text style={styles.help}>Your email must be verified before you can create a case.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, backgroundColor: fbColors.paper, justifyContent: 'center', padding: 24 },
  container: { width: '100%', maxWidth: 460, alignSelf: 'center', gap: 20 },
  actions: { gap: fbSpacing.x2 },
  brand: { fontFamily: fbFonts.monoRegular, color: fbColors.ox, letterSpacing: 2, fontSize: 12 },
  intro: { fontFamily: fbFonts.sansRegular, color: fbColors.inkMute, fontSize: 16, lineHeight: 24, marginBottom: 12 },
  label: { fontFamily: fbFonts.sansSemi, color: fbColors.ink, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: fbColors.rule, borderRadius: fbRadii.sm, padding: 14, marginBottom: 18, fontSize: 16, color: fbColors.ink, backgroundColor: fbColors.paper, fontFamily: fbFonts.sansRegular },
  help: { fontFamily: fbFonts.sansRegular, color: fbColors.inkMute, fontSize: 13, lineHeight: 20, marginBottom: 12 },
  error: { color: fbColors.ox, lineHeight: 22, marginBottom: 16, fontFamily: fbFonts.sansRegular },
  notice: { color: fbColors.forest, lineHeight: 22, marginBottom: 16, fontFamily: fbFonts.sansRegular },
});
