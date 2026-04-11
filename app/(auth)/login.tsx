import { View, Text, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
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
      setError(e.message ?? 'Authentication failed.');
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
          redirectTo: Platform.OS === 'web' ? window.location.origin : 'familybench://auth/callback',
          skipBrowserRedirect: Platform.OS !== 'web',
        },
      });
      if (error) throw error;
      if (data.url && Platform.OS !== 'web') {
        const result = await WebBrowser.openAuthSessionAsync(data.url, 'familybench://auth/callback');
        if (result.type === 'success') router.replace('/(app)/(journal)');
      }
    } catch (e: any) {
      setError(e.message ?? 'OAuth failed.');
    } finally {
      setLoading(false);
    }
  };

  // Shared input style
  const inputStyle = {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)' as string,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'System',
    fontSize: 15,
    color: '#1A1A18',
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F0' }}>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
        {/* Brand */}
        <Text style={{ fontFamily: 'Georgia', fontSize: 28, fontWeight: '600', color: '#1A1A18', marginBottom: 8 }}>
          Family Bench
        </Text>
        <Text style={{ fontFamily: 'System', fontSize: 15, color: '#6B6A68', lineHeight: 22, marginBottom: 32 }}>
          Document your custody case. Build court-ready evidence.
        </Text>

        {/* OAuth */}
        <View style={{ gap: 12, marginBottom: 24 }}>
          <Pressable
            onPress={() => handleOAuth('google')}
            style={{
              backgroundColor: '#1A1A18', height: 52, borderRadius: 12,
              alignItems: 'center', justifyContent: 'center',
            }}
            className="active:scale-[0.98]"
          >
            <Text style={{ fontFamily: 'System', fontSize: 15, fontWeight: '500', color: '#FFFFFF' }}>
              Continue with Google
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleOAuth('apple')}
            style={{
              backgroundColor: '#1A1A18', height: 52, borderRadius: 12,
              alignItems: 'center', justifyContent: 'center',
            }}
            className="active:scale-[0.98]"
          >
            <Text style={{ fontFamily: 'System', fontSize: 15, fontWeight: '500', color: '#FFFFFF' }}>
              Continue with Apple
            </Text>
          </Pressable>
        </View>

        {/* Divider */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(0,0,0,0.08)' }} />
          <Text style={{ fontFamily: 'System', fontSize: 13, color: '#9A9893' }}>or</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(0,0,0,0.08)' }} />
        </View>

        {/* Email fields */}
        <View style={{ gap: 12, marginBottom: 16 }}>
          <View style={{ gap: 6 }}>
            <Text style={{ fontFamily: 'System', fontSize: 13, color: '#6B6A68' }}>Email</Text>
            <View style={inputStyle}>
              <Text style={{ fontFamily: 'System', fontSize: 15, color: email ? '#1A1A18' : '#9A9893' }}>
                {/* Using Text as placeholder — real TextInput would go here in production */}
                {email || 'you@example.com'}
              </Text>
            </View>
          </View>
          <View style={{ gap: 6 }}>
            <Text style={{ fontFamily: 'System', fontSize: 13, color: '#6B6A68' }}>Password</Text>
            <View style={inputStyle}>
              <Text style={{ fontFamily: 'System', fontSize: 15, color: '#9A9893' }}>
                {password ? '••••••••' : 'Password'}
              </Text>
            </View>
          </View>
        </View>

        {error && (
          <Text style={{ fontFamily: 'System', fontSize: 13, color: '#DC2626', marginBottom: 12 }}>{error}</Text>
        )}

        <Pressable
          onPress={handleEmailAuth}
          style={{
            backgroundColor: '#2563EB', height: 52, borderRadius: 12,
            alignItems: 'center', justifyContent: 'center',
          }}
          className="active:scale-[0.98]"
        >
          <Text style={{ fontFamily: 'System', fontSize: 15, fontWeight: '500', color: '#FFFFFF' }}>
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </Text>
        </Pressable>

        <Pressable onPress={() => setMode(mode === 'login' ? 'signup' : 'login')} style={{ paddingVertical: 12, marginTop: 8 }}>
          <Text style={{ fontFamily: 'System', fontSize: 14, color: '#2563EB', textAlign: 'center' }}>
            {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </Text>
        </Pressable>
      </View>

      {/* Legal disclaimer */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
        <Text style={{ fontFamily: 'System', fontSize: 12, color: '#78766F', textAlign: 'center', lineHeight: 16 }}>
          Family Bench is not a law firm and does not provide legal advice. Consult a licensed attorney for legal strategy.
        </Text>
      </View>
    </SafeAreaView>
  );
}
