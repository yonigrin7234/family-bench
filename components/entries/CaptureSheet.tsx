import { View, Text, Pressable } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useCallback, useMemo, useRef } from 'react';
import { Mic, Clock, Camera, PencilLine } from 'lucide-react-native';

interface CaptureSheetProps {
  visible: boolean;
  onDismiss: () => void;
  onVoiceEntry: () => void;
  onExchangeLog: () => void;
  onPhoto: () => void;
  onTextNote: () => void;
}

const captureOptions = [
  {
    key: 'voice',
    icon: Mic,
    label: 'Voice entry',
    description: 'Speak what happened, AI structures it',
    action: 'onVoiceEntry' as const,
  },
  {
    key: 'exchange',
    icon: Clock,
    label: 'Exchange log',
    description: 'Log a pickup or dropoff with timer',
    action: 'onExchangeLog' as const,
  },
  {
    key: 'photo',
    icon: Camera,
    label: 'Photo',
    description: 'Take or attach a photo as evidence',
    action: 'onPhoto' as const,
  },
  {
    key: 'text',
    icon: PencilLine,
    label: 'Text note',
    description: 'Type a journal entry or note',
    action: 'onTextNote' as const,
  },
];

export function CaptureSheet({
  visible,
  onDismiss,
  onVoiceEntry,
  onExchangeLog,
  onPhoto,
  onTextNote,
}: CaptureSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['40%'], []);

  const actions = { onVoiceEntry, onExchangeLog, onPhoto, onTextNote };

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) onDismiss();
    },
    [onDismiss]
  );

  if (!visible) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose
      backgroundStyle={{
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
      }}
      handleIndicatorStyle={{
        backgroundColor: 'rgba(0,0,0,0.08)',
        width: 40,
        height: 4,
      }}
    >
      <BottomSheetView className="p-5">
        {captureOptions.map((option) => {
          const Icon = option.icon;
          return (
            <Pressable
              key={option.key}
              className="flex-row items-center gap-4 py-3 active:opacity-70"
              onPress={() => {
                actions[option.action]();
                onDismiss();
              }}
              accessibilityRole="button"
              accessibilityLabel={option.label}
            >
              <Icon size={20} strokeWidth={1.75} className="text-text-muted" />
              <View className="flex-1">
                <Text className="font-ui text-[15px] text-text-primary">
                  {option.label}
                </Text>
                <Text className="font-ui text-[13px] text-text-muted">
                  {option.description}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </BottomSheetView>
    </BottomSheet>
  );
}
