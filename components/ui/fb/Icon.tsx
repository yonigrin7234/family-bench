import type { ReactNode } from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
import { fbColors } from './tokens';

const ICONS: Record<string, () => ReactNode> = {
  mic:       () => <Path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3ZM5 11a7 7 0 0 0 14 0M12 18v3" />,
  plus:      () => <Path d="M12 5v14M5 12h14" />,
  home:      () => <Path d="M4 11 12 4l8 7v9a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1v-9Z" />,
  folder:    () => <Path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z" />,
  scales:    () => <Path d="M12 3v18M5 21h14M5 7h14M5 7l-3 7a4 4 0 0 0 6 0L5 7Zm14 0-3 7a4 4 0 0 0 6 0l-3-7Z" />,
  chat:      () => <Path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.5A8 8 0 1 1 21 12Z" />,
  flag:      () => <Path d="M4 21V4m0 0h11l-2 4 2 4H4" />,
  gavel:     () => <Path d="m14 14-8 8-4-4 8-8m0 0 4-4 4 4m-8 0 6-6m2 2 6-6-4-4-6 6" />,
  caret:     () => <Path d="m9 6 6 6-6 6" />,
  caretDown: () => <Path d="m6 9 6 6 6-6" />,
  shield:    () => <Path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6l-8-3Z" />,
  check:     () => <Path d="m5 12 5 5L20 7" />,
  x:         () => <Path d="M6 6l12 12M18 6 6 18" />,
  upload:    () => <Path d="M12 16V4m0 0-5 5m5-5 5 5M4 20h16" />,
  paperclip: () => <Path d="M21 11 12 20a5 5 0 0 1-7-7l9-9a3 3 0 0 1 4 4l-9 9a1 1 0 0 1-1.5-1.5l8-8" />,
  sparkle:   () => <Path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />,
  chevR:     () => <Path d="m9 6 6 6-6 6" />,
  filter:    () => <Path d="M4 5h16M7 12h10M10 19h4" />,
  pin:       () => <Path d="M12 2v8m0 0-4 4h8l-4-4Zm0 8v12" />,
  link:      () => <Path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.5 1.5m-2 6a4 4 0 0 1-5.7 0 4 4 0 0 1 0-5.7l3-3a4 4 0 0 1 5.7 0" />,
  wave:      () => <Path d="M3 12h2l2-7 3 14 3-10 2 6 2-4 2 2h2" />,
  spark:     () => <Path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6Z" />,
  receipt:   () => <Path d="M5 3h14v18l-3-2-3 2-3-2-3 2-2-2V3Zm4 6h10M9 13h10M9 17h6" />,
  search:    () => (
    <>
      <Circle cx={11} cy={11} r={7} />
      <Path d="m20 20-3.5-3.5" />
    </>
  ),
  clock:     () => (
    <>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 7v5l3 2" />
    </>
  ),
  dot:       () => <Circle cx={12} cy={12} r={3} />,
  grip:      () => (
    <>
      <Circle cx={9} cy={6} r={1} />
      <Circle cx={15} cy={6} r={1} />
      <Circle cx={9} cy={12} r={1} />
      <Circle cx={15} cy={12} r={1} />
      <Circle cx={9} cy={18} r={1} />
      <Circle cx={15} cy={18} r={1} />
    </>
  ),
  doc:       () => (
    <>
      <Path d="M7 3h8l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <Path d="M14 3v6h6" />
    </>
  ),
  camera:    () => (
    <>
      <Path d="M4 7h3l2-2h6l2 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z" />
      <Circle cx={12} cy={13} r={4} />
    </>
  ),
  eye:       () => (
    <>
      <Path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <Circle cx={12} cy={12} r={3} />
    </>
  ),
};

export type IconName = keyof typeof ICONS;

export function Icon({
  name,
  size = 16,
  color = fbColors.ink,
  strokeWidth = 1.6,
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const render = ICONS[name];
  if (!render) return null;
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {render()}
    </Svg>
  );
}
