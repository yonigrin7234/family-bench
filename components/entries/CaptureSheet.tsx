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
  const snapPoints = useMemo(() => ['42%'], []);
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
        backgroundColor: '#E5E5E0',
        width: 40,
        height: 4,
        marginTop: 8,
        marginBottom: 20,
      }}
    >
      <BottomSheetView style={{ paddingHorizontal: 20, paddingBottom: 32 }}>
        {captureOptions.map((option, index) => {
          const Icon = option.icon;
          const isLast = index === captureOptions.length - 1;
          return (
            <Pressable
              key={option.key}
              onPress={() => {
                actions[option.action]();
                onDismiss();
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                paddingVertical: 16,
                borderBottomWidth: isLast ? 0 : 1,
                borderBottomColor: 'rgba(0,0,0,0.06)',
              }}
              accessibilityRole="button"
              accessibilityLabel={option.label}
            >
              <Icon size={20} strokeWidth={1.75} color="#6B6A68" style={{ marginRight: 16, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'System', fontSize: 15, fontWeight: '500', color: '#1A1A18' }}>
                  {option.label}
                </Text>
                <Text style={{ fontFamily: 'System', fontSize: 13, color: '#9A9893', marginTop: 4 }}>
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
