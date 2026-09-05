import { Link, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CaseScreen } from '@/components/case-intelligence/CaseScreen';
import { Display, Icon, PillButton, SoftCard, fbColors, fbFonts, fbSpacing } from '@/components/ui/fb';
import { getSurfaceNavRoutes } from '@/lib/surface/surfaceRegistry';

const routes = getSurfaceNavRoutes('desktop').filter((route) => !route.appearsInMobileNav);

export default function More() {
  return (
    <CaseScreen desktopMaxWidth={800} rightRail={false}>
      <Display size={32} accessibilityRole="header">Your workspace</Display>
      <Text style={styles.intro}>Prepare your case, find hearing records, and manage your account.</Text>
      <PillButton tone="ghost" onPress={() => router.push('/welcome' as never)}>Getting started</PillButton>
      <SoftCard p={8} style={styles.links}>
        {routes.map((route) => (
          <Link key={route.id} href={route.path as never} asChild>
            <Pressable accessibilityRole="link" style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
              <Icon name={route.icon} size={21} />
              <View style={styles.copy}>
                <Text style={styles.label}>{route.label}</Text>
              </View>
              <Icon name="chevR" size={16} color={fbColors.inkMute} />
            </Pressable>
          </Link>
        ))}
      </SoftCard>
    </CaseScreen>
  );
}

const styles = StyleSheet.create({
  intro: { color: fbColors.inkSoft, fontFamily: fbFonts.sansRegular, fontSize: 16, lineHeight: 24, marginTop: fbSpacing.x2 },
  links: { marginTop: fbSpacing.x5 },
  link: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 8 },
  copy: { flex: 1, minWidth: 0 },
  label: { color: fbColors.ink, fontFamily: fbFonts.sansMedium, fontSize: 16, lineHeight: 22 },
  pressed: { backgroundColor: fbColors.paperDeep },
});
