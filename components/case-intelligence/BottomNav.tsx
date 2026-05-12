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
            {active ? <View style={styles.mobileActiveRule} /> : null}
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

      <View style={styles.caseSpine}>
        <Text style={styles.caseSpineLabel}>ACTIVE CASE</Text>
        <Text style={styles.caseSpineTitle}>Local case workspace</Text>
        <Text style={styles.caseSpineMeta}>Shared store · offline first</Text>
      </View>

      <View style={styles.sidebarNav}>
        <Text style={styles.navSectionLabel}>WORKSPACE</Text>
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
    position: 'relative',
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
  mobileActiveRule: {
    position: 'absolute',
    top: 0,
    width: 18,
    height: 2,
    backgroundColor: fbColors.ox,
  },
  sidebar: {
    width: 276,
    minHeight: '100%',
    borderRightWidth: fbBorder.hairline,
    borderRightColor: fbColors.rule,
    backgroundColor: fbColors.paperDeep,
  },
  sidebarBrand: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: fbSpacing.x3,
    paddingHorizontal: fbSpacing.x5,
    borderBottomWidth: fbBorder.hairline,
    borderBottomColor: fbColors.rule,
  },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: fbRadii.sm,
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
  caseSpine: {
    paddingHorizontal: fbSpacing.x5,
    paddingVertical: fbSpacing.x4,
    borderBottomWidth: fbBorder.hairline,
    borderBottomColor: fbColors.rule,
    gap: fbSpacing.x1,
  },
  caseSpineLabel: {
    color: fbColors.ox,
    fontSize: 10,
    lineHeight: 14,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
    letterSpacing: 1,
  },
  caseSpineTitle: {
    color: fbColors.ink,
    fontSize: 14,
    lineHeight: 19,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  caseSpineMeta: {
    color: fbColors.inkMute,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: fbFonts.sansRegular,
  },
  sidebarNav: {
    flex: 1,
    paddingHorizontal: fbSpacing.x3,
    paddingTop: fbSpacing.x4,
    gap: fbSpacing.x1,
  },
  navSectionLabel: {
    paddingHorizontal: fbSpacing.x3,
    paddingBottom: fbSpacing.x2,
    color: fbColors.inkMute,
    fontSize: 10,
    lineHeight: 14,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
    letterSpacing: 1,
  },
  sidebarItem: {
    minHeight: 38,
    borderRadius: fbRadii.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: fbSpacing.x3,
    paddingHorizontal: fbSpacing.x3,
    borderLeftWidth: 2,
    borderLeftColor: 'transparent',
  },
  sidebarItemActive: {
    backgroundColor: fbColors.surface,
    borderWidth: fbBorder.hairline,
    borderColor: fbColors.rule,
    borderLeftWidth: 2,
    borderLeftColor: fbColors.ox,
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
    margin: fbSpacing.x3,
    padding: fbSpacing.x3,
    borderRadius: fbRadii.sm,
    backgroundColor: fbColors.surface,
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
