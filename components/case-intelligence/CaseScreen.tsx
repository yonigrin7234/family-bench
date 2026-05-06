import type { ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  fbBorder,
  fbColors,
  fbRadii,
  fbSpacing,
  fbTouch,
} from '@/components/ui/fb';
import { BottomNav } from './BottomNav';

const centeredMobileWidth = {
  width: '100%' as const,
  maxWidth: 430,
  alignSelf: 'center' as const,
};

export function CaseScreen({
  children,
  footer,
  contentStyle,
}: {
  children: ReactNode;
  footer?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, fbSpacing.x3);
  const footerReserve = footer ? fbTouch.primary + fbSpacing.x8 : 0;

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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: fbColors.paper,
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
