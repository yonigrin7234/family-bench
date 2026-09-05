import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { CaseScreen } from '@/components/case-intelligence/CaseScreen';
import { Chip, Display, Icon, PillButton, SoftCard, fbColors, fbFonts, fbSpacing, fbType, type IconName } from '@/components/ui/fb';
import { useCaseIntelligenceHome } from '@/lib/case-intelligence';
import { firstTaskDestination, type WelcomeTask } from '@/lib/welcome/firstTask';

const firstTasks: Array<{ id: WelcomeTask; title: string; body: string; icon: IconName }> = [
  { id: 'case', title: 'Organize my case', body: 'Add case details, people, children, and dates, or choose an existing case.', icon: 'folder' },
  { id: 'capture', title: 'Record something that happened', body: 'Write the facts, add original files, and review the record before sharing.', icon: 'plus' },
  { id: 'briefcase', title: 'Prepare for a hearing', body: 'Find an order and related records, check the originals, and choose what to export.', icon: 'gavel' },
];

export default function Welcome() {
  const { home } = useCaseIntelligenceHome();
  const hasCase = Boolean(home.activeCase);
  return <CaseScreen desktopMaxWidth={1000} rightRail={false}>
    <View style={styles.page}>
      <View style={styles.header}>
        <Chip tone="forest">Start here</Chip>
        <Display size={34} accessibilityRole="header">A clearer record, one step at a time.</Display>
        <Text style={styles.intro}>Family Bench helps you keep a factual timeline, preserve original files, and prepare the records you choose to share. Start with what you need today.</Text>
        <View style={styles.row}>
          <PillButton tone="ghost" onPress={() => router.replace('/')}>Skip to my workspace</PillButton>
          <PillButton tone="soft" icon="shield" onPress={() => router.push('/safety')}>Safety and support resources</PillButton>
        </View>
        <Text style={styles.body}>This introduction is optional. You can leave it at any time.</Text>
      </View>

      <SoftCard p={18} style={styles.card}>
        <Text accessibilityRole="header" style={styles.title}>Keep the original. Review the record.</Text>
        <Text style={styles.body}>Attach the file you received or captured. Family Bench preserves its bytes and records a SHA-256 fingerprint so a later file check can detect changes. Your factual entry text is reviewed separately.</Text>
        <Text style={styles.body}>A matching file fingerprint confirms the saved bytes. You still need to check the facts, dates, and source before relying on a record.</Text>
      </SoftCard>

      <SoftCard p={18} style={styles.card}>
        <Text accessibilityRole="header" style={styles.title}>Choose what you share</Text>
        <Text style={styles.body}>Factual reports exclude private notes and entries marked private. You review the included entries before downloading a PDF or evidence ZIP. Attached original files retain their own content and metadata, so review those too.</Text>
        <Text style={styles.body}>Local records and files are encrypted on the device. The cloud service can access server records; this is not end-to-end encryption. Downloaded reports are outside the app’s encrypted storage.</Text>
        <PillButton tone="ghost" onPress={() => router.push('/trust-center' as never)}>See storage, sync, and sharing controls</PillButton>
      </SoftCard>

      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.title}>What would help today?</Text>
        {!hasCase && <Text style={styles.body}>You’ll set up a case before your first capture or hearing preparation. Trust Center and Safety are available now.</Text>}
        {firstTasks.map((task) => <SoftCard key={task.id} p={16} style={styles.card}>
          <View style={styles.row}><Icon name={task.icon} size={20} /><Text accessibilityRole="header" style={styles.taskTitle}>{task.title}</Text></View>
          <Text style={styles.body}>{task.body}</Text>
          <PillButton tone={task.id === 'capture' ? 'primary' : 'ghost'} onPress={() => router.push(firstTaskDestination(task.id, hasCase) as never)}>
            {task.id === 'case' ? hasCase ? 'Choose or add a case' : 'Set up my case' : task.id === 'capture' ? hasCase ? 'Start a record' : 'Set up, then start a record' : hasCase ? 'Open hearing Briefcase' : 'Set up, then prepare for a hearing'}
          </PillButton>
        </SoftCard>)}
      </View>
      <Text style={styles.body}>Family Bench organizes the information you enter. For legal decisions, use qualified advice and your court’s current requirements.</Text>
    </View>
  </CaseScreen>;
}

const styles = StyleSheet.create({
  page: { gap: fbSpacing.x5 }, header: { gap: fbSpacing.x3 }, card: { gap: fbSpacing.x3 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: fbSpacing.x2 },
  intro: { fontFamily: fbFonts.sansRegular, fontSize: 16, lineHeight: 24, color: fbColors.inkSoft },
  title: { fontFamily: fbFonts.sansSemi, fontSize: fbType.h2, color: fbColors.ink },
  taskTitle: { flex: 1, minWidth: 0, fontFamily: fbFonts.sansSemi, fontSize: fbType.body, lineHeight: 21, color: fbColors.ink },
  body: { fontFamily: fbFonts.sansRegular, fontSize: fbType.body, lineHeight: 21, color: fbColors.inkMute },
});
