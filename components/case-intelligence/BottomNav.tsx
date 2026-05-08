import { router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Icon,
  fbAlpha,
  fbColors,
  fbFonts,
  fbSpacing,
  fbTouch,
  fbWeights,
  type IconName,
} from '@/components/ui/fb';

const NAV_ITEMS = [
  { href: '/', icon: 'home', label: 'Home' },
  { href: '/capture', icon: 'plus', label: 'Capture' },
  { href: '/timeline', icon: 'clock', label: 'Timeline' },
  { href: '/evidence', icon: 'folder', label: 'Evidence' },
  { href: '/reports', icon: 'doc', label: 'Reports' },
  { href: '/case-map', icon: 'scales', label: 'Case Map' },
] as const;

function isActive(pathname: string, href: string) {
  if (href === '/capture' && pathname === '/voice-capture') return true;
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <View style={styles.nav}>
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);

        return (
          <Pressable
            key={item.href}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={item.label}
            onPress={() => {
              if (!active) router.push(item.href as never);
            }}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}
          >
            <Icon
              name={item.icon as IconName}
              size={18}
              color={active ? fbColors.ink : fbColors.inkMute}
            />
            <Text style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    height: fbTouch.bottomNavHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  item: {
    flex: 1,
    minWidth: 0,
    minHeight: fbTouch.min,
    alignItems: 'center',
    justifyContent: 'center',
    gap: fbSpacing.x1,
  },
  pressed: {
    opacity: fbAlpha.pressed,
  },
  label: {
    color: fbColors.inkMute,
    fontSize: 10,
    lineHeight: 12,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  labelActive: {
    color: fbColors.ink,
  },
});
