import { Text, View, type ViewStyle, type StyleProp } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { fbColors, fbFonts, fbRadii, fbWeights } from './tokens';

export type StepSub = { label: string; done?: boolean };
export type Step = {
  label: string;
  hint?: string;
  badge?: string;
  sub?: StepSub[];
};

export function StepRail({
  steps,
  current,
  style,
}: {
  steps: Step[];
  current: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ gap: 2 }, style]}>
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const upcoming = i > current;
        const showSub = !!s.sub && (active || done);
        return (
          <View key={i}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 12,
                paddingVertical: 10,
                paddingHorizontal: 12,
                backgroundColor: active ? fbColors.paperDeep : 'transparent',
                borderRadius: fbRadii.md - 2,
              }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  marginTop: 1,
                  backgroundColor: done ? fbColors.forest : active ? fbColors.ink : 'transparent',
                  borderWidth: upcoming ? 1 : 0,
                  borderColor: fbColors.rule,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {done ? (
                  <Svg width={11} height={11} viewBox="0 0 11 11">
                    <Path
                      d="M2 5.5l2.2 2L9 2.5"
                      stroke={fbColors.paper}
                      strokeWidth={1.6}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                ) : (
                  <Text
                    className="font-sans"
                    style={{
                      fontSize: 11,
                      fontWeight: fbWeights.semi,
                      fontFamily: fbFonts.sansSemi,
                      color: active ? fbColors.paper : fbColors.inkMute,
                    }}
                  >
                    {i + 1}
                  </Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  className="font-sans"
                  style={{
                    fontSize: 13.5,
                    fontWeight: active ? fbWeights.semi : fbWeights.medium,
                    fontFamily: active ? fbFonts.sansSemi : fbFonts.sansMedium,
                    color: done
                      ? fbColors.inkSoft
                      : active
                      ? fbColors.ink
                      : upcoming
                      ? fbColors.inkMute
                      : fbColors.ink,
                    letterSpacing: -0.135,
                  }}
                >
                  {s.label}
                </Text>
                {s.hint && (
                  <Text
                    className="font-sans"
                    style={{
                      fontSize: 11.5,
                      color: fbColors.inkMute,
                      marginTop: 2,
                    }}
                  >
                    {s.hint}
                  </Text>
                )}
              </View>
              {s.badge && (
                <View
                  style={{
                    backgroundColor: fbColors.oxWash,
                    paddingVertical: 2,
                    paddingHorizontal: 7,
                    borderRadius: fbRadii.pill,
                  }}
                >
                  <Text
                    className="font-sans"
                    style={{
                      fontSize: 10,
                      fontWeight: fbWeights.semi,
                      fontFamily: fbFonts.sansSemi,
                      color: fbColors.ox,
                    }}
                  >
                    {s.badge}
                  </Text>
                </View>
              )}
            </View>
            {showSub && (
              <View style={{ paddingLeft: 45, marginBottom: 4 }}>
                {s.sub!.map((t, j) => (
                  <View
                    key={j}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      paddingVertical: 5,
                    }}
                  >
                    <View
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 4,
                        backgroundColor: t.done ? fbColors.forestWash : fbColors.paperDeep,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {t.done && (
                        <Svg width={8} height={8} viewBox="0 0 8 8">
                          <Path
                            d="M1 4l2 2L7 1.5"
                            stroke={fbColors.forest}
                            strokeWidth={1.5}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </Svg>
                      )}
                    </View>
                    <Text
                      className="font-sans"
                      style={{
                        fontSize: 12.5,
                        color: t.done ? fbColors.inkMute : fbColors.inkSoft,
                        textDecorationLine: t.done ? 'line-through' : 'none',
                      }}
                    >
                      {t.label}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}
