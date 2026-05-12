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
  Icon,
  Label,
  Mono,
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
  const showContextRail = showDesktopShell && width >= 1180 && rightRail !== false;

  if (showDesktopShell) {
    return (
      <View style={styles.screen}>
        <StatusBar style="dark" />
        <View style={styles.desktopShell}>
          <DesktopSidebar />
          <View style={styles.desktopWorkspace}>
            <DesktopWorkspaceBar />
            <ScrollView
              style={styles.desktopMain}
              contentContainerStyle={[
                styles.desktopContent,
                {
                  maxWidth: desktopMaxWidth,
                  paddingTop: fbSpacing.x6,
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
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + fbSpacing.x4,
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
        <Icon name="search" size={14} color={fbColors.inkMute} />
        <Text style={styles.workspaceTitle}>Family Bench workspace</Text>
      </View>
      <View style={styles.workspaceMetaGroup}>
        <Mono dim size={10}>
          LOCAL-FIRST
        </Mono>
        <View style={styles.workspaceDivider} />
        <Mono dim size={10}>
          NO REMOTE WRITES
        </Mono>
      </View>
    </View>
  );
}

function DefaultContextRail() {
  return (
    <View style={styles.contextRail}>
      <Label color={fbColors.ox}>Desktop Context</Label>
      <Text style={styles.railTitle}>Case context</Text>
      <Text style={styles.railBody}>
        Current case status, key dates, linked records, and review notes can be surfaced here as
        desktop workflows mature.
      </Text>
      <View style={styles.railRule} />
      <Text style={styles.railStatusTitle}>Shared platform</Text>
      <Text style={styles.railStatusBody}>
        Mobile and desktop use the same local-first case-intelligence store.
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
  workspaceMetaGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: fbSpacing.x3,
  },
  workspaceDivider: {
    width: fbBorder.hairline,
    height: 16,
    backgroundColor: fbColors.rule,
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
