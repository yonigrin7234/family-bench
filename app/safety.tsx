import { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { CaseScreen } from '@/components/case-intelligence/CaseScreen';
import { Chip, Display, PillButton, SoftCard, fbColors, fbFonts, fbSpacing, fbType } from '@/components/ui/fb';
import { SAFETY_ACTIONS, SAFETY_RESOURCES_CHECKED, openSafetyAction, type SafetyActionId } from '@/lib/safety/resources';

export default function Safety() {
  const [busy, setBusy] = useState<SafetyActionId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  async function open(id: SafetyActionId) {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(id); setError(null);
    try { await openSafetyAction(id, (url) => Linking.openURL(url)); }
    catch (failure) { if (mounted.current) setError(failure instanceof Error ? failure.message : 'Use the listed number or website directly.'); }
    finally { inFlight.current = false; if (mounted.current) setBusy(null); }
  }
  function action(id: SafetyActionId, primary = false) {
    const resource = SAFETY_ACTIONS.find((row) => row.id === id)!;
    return <PillButton key={id} tone={primary ? 'primary' : 'ghost'} disabled={Boolean(busy)} accessibilityLabel={resource.label} onPress={() => void open(id)}>{busy === id ? 'Opening…' : resource.label}</PillButton>;
  }

  return <CaseScreen desktopMaxWidth={960} rightRail={false}>
    <View style={styles.page}>
      <View style={styles.header}>
        <View style={styles.row}><Chip tone="amber">United States resources</Chip><PillButton size="sm" tone="ghost" onPress={() => router.back()}>Back</PillButton></View>
        <Display size={34} accessibilityRole="header">Safety and support</Display>
        <Text style={styles.intro}>Choose the support that fits your situation. Outside the United States, use your local emergency number and local support services.</Text>
        <Text style={styles.body}>Buttons open a provider website, your phone app, or a text composer. If a phone or text link does not open, use the displayed number directly. No message is sent from this page.</Text>
        {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      </View>

      <SoftCard p={18} style={[styles.card, styles.emergency]}>
        <Text accessibilityRole="header" style={styles.title}>Immediate danger or a life-threatening emergency</Text>
        <Text selectable style={styles.number}>911</Text>
        <Text style={[styles.body, styles.emergencyBody]}>Call 911 for immediate police, fire, or ambulance help. Tell the dispatcher where you are and what is happening.</Text>
        <View style={styles.row}>{action('emergency-call', true)}{action('emergency-guide')}</View>
      </SoftCard>

      <SoftCard p={18} style={styles.card}>
        <Text accessibilityRole="header" style={styles.title}>National Domestic Violence Hotline</Text>
        <Text style={styles.body}>Support for relationship abuse, safety planning, and local referrals. The Hotline offers confidential support around the clock; connection times can vary.</Text>
        <Text selectable style={styles.number}>800-799-7233</Text>
        <Text selectable style={styles.body}>Text START to 88788. Message and data rates may apply.</Text>
        <View style={styles.row}>{action('hotline-call', true)}{action('hotline-text')}{action('hotline-help')}</View>
      </SoftCard>

      <SoftCard p={18} style={styles.card}>
        <Text accessibilityRole="header" style={styles.title}>988 Suicide &amp; Crisis Lifeline</Text>
        <Text style={styles.body}>For emotional distress or a mental health crisis, the 988 Lifeline provides confidential support 24/7 in the United States and its territories.</Text>
        <Text selectable style={styles.number}>Call or text 988</Text>
        <View style={styles.row}>{action('lifeline-call', true)}{action('lifeline-text')}{action('lifeline-help')}</View>
      </SoftCard>

      <SoftCard p={18} style={styles.card}>
        <Text accessibilityRole="header" style={styles.title}>Plan with support</Text>
        <Text style={styles.body}>The Hotline’s guides and provider directory can help you explore safety planning, shelters, counseling, and legal advocacy. You choose what to share with a provider.</Text>
        <View style={styles.row}>{action('safety-plan')}{action('local-providers')}</View>
      </SoftCard>

      <SoftCard p={18} style={styles.card}>
        <Text accessibilityRole="header" style={styles.title}>Consider the device you are using</Text>
        <Text style={styles.body}>Internet, phone, and text activity may be monitored. Private browsing does not erase every trace. If you are concerned, consider a device or account that the other person cannot access and review The Hotline’s internet safety guidance.</Text>
        {action('digital-safety')}
        <Text style={styles.body}>Before sharing a Family Bench report, review addresses, contact details, and original files. Private notes are excluded from factual exports, but sensitive details inside an original file remain in that file.</Text>
        <PillButton tone="ghost" onPress={() => router.push('/trust-center' as never)}>Review record and sharing controls</PillButton>
      </SoftCard>
      <Text style={styles.source}>Resource details checked against the linked provider pages on {SAFETY_RESOURCES_CHECKED}. Opening a link can leave browser or device activity records. Family Bench cannot confirm whether a call connects or a provider responds.</Text>
    </View>
  </CaseScreen>;
}

const styles = StyleSheet.create({
  page: { gap: fbSpacing.x5 }, header: { gap: fbSpacing.x3 }, card: { gap: fbSpacing.x3 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: fbSpacing.x2 },
  emergency: { backgroundColor: fbColors.oxWash },
  emergencyBody: { color: fbColors.inkSoft },
  intro: { fontFamily: fbFonts.sansRegular, fontSize: 16, lineHeight: 24, color: fbColors.inkSoft },
  title: { fontFamily: fbFonts.sansSemi, fontSize: fbType.h2, color: fbColors.ink },
  number: { fontFamily: fbFonts.sansSemi, fontSize: 22, lineHeight: 29, color: fbColors.ink },
  body: { fontFamily: fbFonts.sansRegular, fontSize: fbType.body, lineHeight: 21, color: fbColors.inkMute },
  source: { fontFamily: fbFonts.sansRegular, fontSize: fbType.body, lineHeight: 21, color: fbColors.inkMute },
  error: { fontFamily: fbFonts.sansRegular, fontSize: fbType.body, lineHeight: 21, color: fbColors.oxDeep },
});
