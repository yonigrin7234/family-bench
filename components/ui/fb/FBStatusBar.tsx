import { Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

export function FBStatusBar({
  dark = false,
  time = '9:41',
}: {
  dark?: boolean;
  time?: string;
}) {
  const c = dark ? '#FFFFFF' : '#14181F';
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 44,
        paddingTop: 14,
        paddingHorizontal: 26,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        zIndex: 10,
      }}
    >
      <Text
        className="font-sans"
        style={{
          fontSize: 15,
          fontWeight: '600',
          color: c,
          letterSpacing: -0.15,
        }}
      >
        {time}
      </Text>
      <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
        <Svg width={17} height={10} viewBox="0 0 17 11" fill="none">
          {[3, 5, 7, 9].map((h, i) => (
            <Rect key={i} x={1 + i * 4} y={10 - h} width={3} height={h} rx={0.5} fill={c} />
          ))}
        </Svg>
        <Svg width={15} height={10} viewBox="0 0 16 11" fill="none">
          <Path
            d="M8 10.5a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zM2.2 4.2A8.2 8.2 0 0 1 8 2a8.2 8.2 0 0 1 5.8 2.2M4.6 6.6A4.8 4.8 0 0 1 8 5a4.8 4.8 0 0 1 3.4 1.6"
            stroke={c}
            strokeWidth={1.2}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
        <Svg width={26} height={12} viewBox="0 0 26 12" fill="none">
          <Rect
            x={0.5}
            y={0.5}
            width={22}
            height={11}
            rx={2.5}
            stroke={c}
            strokeOpacity={0.35}
            fill="none"
          />
          <Rect x={2} y={2} width={19} height={8} rx={1.5} fill={c} />
          <Rect x={23} y={4} width={1.5} height={4} rx={0.75} fill={c} fillOpacity={0.4} />
        </Svg>
      </View>
    </View>
  );
}
