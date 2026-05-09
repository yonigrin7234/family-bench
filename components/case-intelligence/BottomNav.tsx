import { router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Icon,
  fbAlpha,
  fbBorder,
  fbColors,
  fbFonts,
  fbRadii,
  fbSpacing,
  fbTouch,
  fbWeights,
} from '@/components/ui/fb';
import { getSurfaceNavRoutes, isSurfaceRouteActive } from '@/lib/surface/surfaceRegistry';

const BOTTOM_NAV_ITEMS = getSurfaceNavRoutes('mobile');
const DESKTOP_NAV_ITEMS = getSurfaceNavRoutes('desktop');

export function BottomNav() {
  const pathname = usePathname();

  return (
    <View style={styles.nav}>
      {BOTTOM_NAV_ITEMS.map((item) => {
        const active = isSurfaceRouteActive(pathname, item, 'mobile');

        return (
          <Pressable
            key={item.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={item.label}
            onPress={() => {
              if (!active) router.push(item.path as never);
            }}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}
          >
            <Icon
              name={item.icon}
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

export function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <View style={styles.sidebar}>
      <View style={styles.sidebarBrand}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>FB</Text>
        </View>
        <View style={styles.brandCopy}>
          <Text style={styles.brandTitle}>Family Bench</Text>
          <Text style={styles.brandSubtitle}>Case War Room</Text>
        </View>
      </View>

      <View style={styles.sidebarNav}>
        {DESKTOP_NAV_ITEMS.map((item) => {
          const active = isSurfaceRouteActive(pathname, item, 'desktop');

          return (
            <Pressable
              key={item.id}
              accessibilityRole="link"
              accessibilityState={{ selected: active }}
              accessibilityLabel={item.label}
              onPress={() => {
                if (!active) router.push(item.path as never);
              }}
              style={({ pressed }) => [
                styles.sidebarItem,
                active && styles.sidebarItemActive,
                pressed && styles.pressed,
              ]}
            >
              <Icon
                name={item.icon}
                size={17}
                color={active ? fbColors.ink : fbColors.inkMute}
              />
              <Text style={[styles.sidebarLabel, active && styles.sidebarLabelActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.sidebarStatus}>
        <Text style={styles.statusLabel}>LOCAL-FIRST</Text>
        <Text style={styles.statusText}>Shared store - no shell-level remote writes</Text>
      </View>
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
  sidebar: {
    width: 252,
    minHeight: '100%',
    paddingHorizontal: fbSpacing.x4,
    paddingTop: fbSpacing.x6,
    paddingBottom: fbSpacing.x5,
    borderRightWidth: fbBorder.hairline,
    borderRightColor: fbColors.rule,
    backgroundColor: fbColors.surface,
  },
  sidebarBrand: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: fbSpacing.x3,
  },
  brandMark: {
    width: 38,
    height: 38,
    borderRadius: fbRadii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: fbColors.ink,
  },
  brandMarkText: {
    color: fbColors.paper,
    fontSize: 12,
    fontFamily: fbFonts.monoSemi,
    fontWeight: fbWeights.semi,
    letterSpacing: 0.6,
  },
  brandCopy: {
    flex: 1,
  },
  brandTitle: {
    color: fbColors.ink,
    fontSize: 14,
    lineHeight: 19,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  brandSubtitle: {
    color: fbColors.inkMute,
    fontSize: 11,
    lineHeight: 15,
    fontFamily: fbFonts.sansRegular,
  },
  sidebarNav: {
    flex: 1,
    marginTop: fbSpacing.x6,
    gap: fbSpacing.x1,
  },
  sidebarItem: {
    minHeight: fbTouch.min,
    borderRadius: fbRadii.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: fbSpacing.x3,
    paddingHorizontal: fbSpacing.x3,
  },
  sidebarItemActive: {
    backgroundColor: fbColors.paperDeep,
    borderWidth: fbBorder.hairline,
    borderColor: fbColors.rule,
  },
  sidebarLabel: {
    flex: 1,
    color: fbColors.inkMute,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fbFonts.sansMedium,
    fontWeight: fbWeights.medium,
  },
  sidebarLabelActive: {
    color: fbColors.ink,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  sidebarStatus: {
    padding: fbSpacing.x3,
    borderRadius: fbRadii.md,
    backgroundColor: fbColors.paperDeep,
    borderWidth: fbBorder.hairline,
    borderColor: fbColors.ruleSoft,
  },
  statusLabel: {
    color: fbColors.ox,
    fontSize: 10,
    lineHeight: 14,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
    letterSpacing: 1,
  },
  statusText: {
    marginTop: fbSpacing.x1,
    color: fbColors.inkMute,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: fbFonts.sansRegular,
  },
});
