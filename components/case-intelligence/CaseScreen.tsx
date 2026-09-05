import type { ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Label,
  fbBorder,
  fbColors,
  fbFonts,
  fbRadii,
  fbSpacing,
  fbTouch,
  fbType,
  fbWeights,
} from '@/components/ui/fb';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { BottomNav, DesktopSidebar } from './BottomNav';
import { WorkspaceStatus } from './WorkspaceStatus';
import { AccountMenu } from './AccountMenu';

const centeredMobileWidth = {
  width: '100%' as const,
  maxWidth: 430,
  alignSelf: 'center' as const,
};

export function CaseScreen({
  children,
  footer,
  contentStyle,
  rightRail,
  desktopMaxWidth = 860,
}: {
  children: ReactNode;
  footer?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  rightRail?: ReactNode | false;
  desktopMaxWidth?: number;
}) {
  const insets = useSafeAreaInsets();
  const { isMobile, width } = useResponsive();
  const bottomInset = Math.max(insets.bottom, fbSpacing.x3);
  const footerReserve = footer ? fbTouch.primary + fbSpacing.x8 : 0;
  const showDesktopShell = !isMobile;
  const showContextRail = showDesktopShell && width >= 1440 && rightRail !== false;

  if (showDesktopShell) {
    return (
      <View style={styles.screen}>
        <StatusBar style="dark" />
        <View style={styles.desktopShell}>
          <DesktopSidebar />
          <View style={styles.desktopWorkspace}>
            <DesktopWorkspaceBar />
            <WorkspaceStatus />
            <ScrollView
              style={styles.desktopMain}
              contentContainerStyle={[
                styles.desktopContent,
                {
                  maxWidth: desktopMaxWidth,
                  paddingTop: fbSpacing.x6,
                  paddingHorizontal: width < 1024 ? fbSpacing.x5 : fbSpacing.x8,
                  paddingBottom: bottomInset + fbSpacing.x8,
                },
                contentStyle,
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {children}
              {footer ? <View style={styles.desktopFooter}>{footer}</View> : null}
            </ScrollView>
          </View>
          {showContextRail ? (
            <View
              style={[
                styles.contextRailWrap,
                {
                  paddingTop: Math.max(insets.top, fbSpacing.x5) + fbSpacing.x3,
                  paddingBottom: bottomInset + fbSpacing.x5,
                },
              ]}
            >
              {rightRail === undefined ? <DefaultContextRail /> : rightRail}
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <View style={{ paddingTop: insets.top }}><DesktopWorkspaceBar /><WorkspaceStatus /></View>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
              paddingTop: fbSpacing.x4,
            paddingBottom:
              bottomInset + fbTouch.bottomNavHeight + footerReserve + fbSpacing.x6,
          },
          contentStyle,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>

      {footer ? (
        <View
          pointerEvents="box-none"
          style={[
            styles.footerWrap,
            {
              bottom: bottomInset + fbTouch.bottomNavHeight + fbSpacing.x2,
            },
          ]}
        >
          {footer}
        </View>
      ) : null}

      <View pointerEvents="box-none" style={[styles.bottomWrap, { paddingBottom: bottomInset }]}>
        <View style={styles.bottomBar}>
          <BottomNav />
        </View>
      </View>
    </View>
  );
}

function DesktopWorkspaceBar() {
  return (
    <View style={styles.workspaceBar}>
      <View style={styles.workspaceTitleGroup}>
        <Text style={styles.workspaceTitle}>Your case workspace</Text>
      </View>
      <AccountMenu />
    </View>
  );
}

function DefaultContextRail() {
  return (
    <View style={styles.contextRail}>
      <Label color={fbColors.ox}>CASE RECORDS</Label>
      <Text style={styles.railTitle}>Preparing your records</Text>
      <Text style={styles.railBody}>
        Review an entry’s original text and attachments before including it in a report.
      </Text>
      <View style={styles.railRule} />
      <Text style={styles.railStatusTitle}>Before sharing</Text>
      <Text style={styles.railStatusBody}>
        Private notes are excluded from factual exports. Review original files for sensitive content.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: fbColors.paper,
  },
  desktopShell: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: fbColors.paper,
  },
  desktopWorkspace: {
    flex: 1,
    minWidth: 0,
  },
  workspaceBar: {
    minHeight: 46,
    paddingHorizontal: fbSpacing.x6,
    borderBottomWidth: fbBorder.hairline,
    borderBottomColor: fbColors.rule,
    backgroundColor: fbColors.paper,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: fbSpacing.x4,
  },
  workspaceTitleGroup: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: fbSpacing.x2,
  },
  workspaceTitle: {
    color: fbColors.inkMute,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  desktopMain: {
    flex: 1,
  },
  desktopContent: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: fbSpacing.x8,
  },
  desktopFooter: {
    marginTop: fbSpacing.x6,
    padding: fbSpacing.x4,
    borderRadius: fbRadii.lg,
    borderWidth: fbBorder.hairline,
    borderColor: fbColors.rule,
    backgroundColor: fbColors.surface,
  },
  contextRailWrap: {
    width: 320,
    paddingHorizontal: fbSpacing.x4,
    borderLeftWidth: fbBorder.hairline,
    borderLeftColor: fbColors.rule,
    backgroundColor: fbColors.paper,
  },
  contextRail: {
    gap: fbSpacing.x2,
    padding: fbSpacing.x4,
    borderRadius: fbRadii.md,
    borderWidth: fbBorder.hairline,
    borderColor: fbColors.rule,
    backgroundColor: fbColors.surface,
  },
  railTitle: {
    color: fbColors.ink,
    fontSize: fbType.h2,
    lineHeight: 23,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  railBody: {
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  railRule: {
    height: fbBorder.hairline,
    marginVertical: fbSpacing.x2,
    backgroundColor: fbColors.rule,
  },
  railStatusTitle: {
    color: fbColors.ink,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  railStatusBody: {
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  content: {
    ...centeredMobileWidth,
    paddingHorizontal: fbSpacing.x5,
  },
  footerWrap: {
    position: 'absolute',
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    paddingHorizontal: fbSpacing.x5,
  },
  bottomWrap: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    paddingHorizontal: fbSpacing.x3,
    paddingTop: fbSpacing.x2,
    backgroundColor: fbColors.paper,
  },
  bottomBar: {
    borderRadius: fbRadii.xl,
    backgroundColor: fbColors.surface,
    borderWidth: fbBorder.hairline,
    borderColor: fbColors.rule,
  },
});
