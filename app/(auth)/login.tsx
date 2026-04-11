import { View, Text, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Separator } from '@/components/ui/Separator';
import { supabase } from '@/lib/supabase/client';
import { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const handleEmailAuth = async () => {
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setError('Check your email for a confirmation link.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace('/(app)/(journal)');
      }
    } catch (e: any) {
      setError(e.message ?? 'Authentication failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: Platform.OS === 'web'
            ? window.location.origin
            : 'familybench://auth/callback',
          skipBrowserRedirect: Platform.OS !== 'web',
        },
      });

      if (error) throw error;

      if (data.url && Platform.OS !== 'web') {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          'familybench://auth/callback'
        );
        if (result.type === 'success') {
          router.replace('/(app)/(journal)');
        }
      }
    } catch (e: any) {
      setError(e.message ?? 'OAuth failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-page dark:bg-dark-page">
      <View className="flex-1 justify-center px-6">
        {/* Brand */}
        <Text className="font-display text-[28px] font-semibold text-text-primary dark:text-dark-text mb-2">
          Family Bench
        </Text>
        <Text className="font-ui text-[15px] text-text-muted dark:text-dark-text-muted mb-8 leading-relaxed">
          Document your custody case. Build court-ready evidence. Protect your children.
        </Text>

        {/* OAuth buttons */}
        <View className="gap-3 mb-6">
          <Button
            variant="primary"
            label="Continue with Google"
            onPress={() => handleOAuth('google')}
            loading={loading}
            fullWidth
          />
          <Button
            variant="primary"
            label="Continue with Apple"
            onPress={() => handleOAuth('apple')}
            loading={loading}
            fullWidth
          />
        </View>

        {/* Divider */}
        <View className="flex-row items-center gap-4 mb-6">
          <View className="flex-1 h-[1px] bg-border" />
          <Text className="font-ui text-[13px] text-text-muted">or</Text>
          <View className="flex-1 h-[1px] bg-border" />
        </View>

        {/* Email/password */}
        <View className="gap-3 mb-4">
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
          />
        </View>

        {error && (
          <Text className="font-ui text-[13px] text-danger mb-4">{error}</Text>
        )}

        <Button
          variant="accent"
          label={mode === 'login' ? 'Sign in' : 'Create account'}
          onPress={handleEmailAuth}
          loading={loading}
          fullWidth
        />

        <Pressable
          onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}
          className="mt-4 py-2"
        >
          <Text className="font-ui text-[14px] text-accent text-center">
            {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </Text>
        </Pressable>
      </View>

      {/* Legal disclaimer */}
      <View className="px-6 pb-4">
        <Text className="font-ui text-[11px] text-text-muted text-center leading-relaxed">
          Family Bench is not a law firm and does not provide legal advice. Consult a licensed attorney for legal strategy.
        </Text>
      </View>
    </SafeAreaView>
  );
}
