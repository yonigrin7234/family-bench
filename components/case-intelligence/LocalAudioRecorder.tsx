import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Audio, type AVPlaybackStatus } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import {
  Chip,
  Icon,
  PillButton,
  fbBorder,
  fbColors,
  fbFonts,
  fbRadii,
  fbSpacing,
  fbTouch,
  fbType,
  fbWeights,
} from '@/components/ui/fb';

const WAVEFORM_BARS = [20, 34, 18, 42, 28, 52, 24, 40, 32, 22, 46, 26];

export type RecordedAudioMemo = {
  uri: string;
  filename: string;
  mimeType: string;
  durationMs: number | null;
  fileSizeBytes: number | null;
  localReference: string;
  capturedAt: string;
};

function formatDuration(ms?: number | null) {
  const totalSeconds = Math.max(0, Math.floor((ms ?? 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function compactTimestamp(value: string) {
  return value.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z').replace('T', '-');
}

function audioExtension() {
  return Platform.OS === 'web' ? 'webm' : 'm4a';
}

function audioMimeType() {
  return Platform.OS === 'web' ? 'audio/webm' : 'audio/m4a';
}

async function getFileSize(uri: string) {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists && typeof info.size === 'number' ? info.size : null;
  } catch {
    return null;
  }
}

function Waveform({ active }: { active: boolean }) {
  return (
    <View style={styles.waveform}>
      {WAVEFORM_BARS.map((height, index) => (
        <View
          key={`${height}-${index}`}
          style={[
            styles.waveformBar,
            {
              height: active && index % 3 === 0 ? height + 6 : height,
              backgroundColor: active ? fbColors.ox : fbColors.inkFaint,
            },
          ]}
        />
      ))}
    </View>
  );
}

export function LocalAudioRecorder({
  title = 'Voice memo',
  body,
  saveLabel = 'Save voice memo attachment',
  savedLabel = 'Voice memo ready',
  onSave,
}: {
  title?: string;
  body: string;
  saveLabel?: string;
  savedLabel?: string;
  onSave: (memo: RecordedAudioMemo) => Promise<void> | void;
}) {
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const [memo, setMemo] = useState<RecordedAudioMemo | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      void recordingRef.current?.stopAndUnloadAsync().catch(() => undefined);
      void soundRef.current?.unloadAsync().catch(() => undefined);
    };
  }, []);

  async function startRecording() {
    if (isRecording) return;
    setNotice(null);

    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setNotice('Microphone permission is required to record a local voice memo.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      recording.setProgressUpdateInterval(250);
      recording.setOnRecordingStatusUpdate((status) => {
        setIsRecording(status.isRecording);
        setDurationMs(status.durationMillis);
      });
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
      setMemo(null);
      setIsRecording(true);
      setDurationMs(0);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Unable to start local audio recording.');
      setIsRecording(false);
      recordingRef.current = null;
    }
  }

  async function stopRecording() {
    const recording = recordingRef.current;
    if (!recording) return;

    try {
      const status = await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recordingRef.current = null;
      setIsRecording(false);
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      if (!uri) {
        setNotice('Recording stopped, but no local audio URI was returned.');
        return;
      }

      const capturedAt = new Date().toISOString();
      const fileSizeBytes = await getFileSize(uri);
      const nextMemo: RecordedAudioMemo = {
        uri,
        filename: `${compactTimestamp(capturedAt)}-voice-memo.${audioExtension()}`,
        mimeType: audioMimeType(),
        durationMs: status.durationMillis ?? durationMs,
        fileSizeBytes,
        localReference: `local-audio:${uri}`,
        capturedAt,
      };

      setDurationMs(nextMemo.durationMs ?? 0);
      setMemo(nextMemo);
      setNotice('Local voice memo recorded. Transcription is not generated.');
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Unable to stop local audio recording.');
    }
  }

  async function playMemo() {
    if (!memo?.uri || isPlaying) return;
    setNotice(null);

    try {
      await soundRef.current?.unloadAsync();
      const { sound } = await Audio.Sound.createAsync(
        { uri: memo.uri },
        { shouldPlay: true },
        (status: AVPlaybackStatus) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
          }
        },
      );
      soundRef.current = sound;
      setIsPlaying(true);
    } catch (err) {
      setIsPlaying(false);
      setNotice(err instanceof Error ? err.message : 'Unable to play this local voice memo.');
    }
  }

  async function saveMemo() {
    if (!memo || saving) return;
    setSaving(true);
    setNotice(null);

    try {
      await onSave(memo);
      setNotice(savedLabel);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Unable to save local voice memo metadata.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Icon name="mic" size={16} color={fbColors.ink} />
          <Text style={styles.title}>{title}</Text>
        </View>
        <Chip tone={isRecording ? 'ox' : memo ? 'forest' : 'mute'} outline={false}>
          {isRecording ? 'Recording' : memo ? 'Recorded' : 'Local'}
        </Chip>
      </View>

      <View style={styles.timerRow}>
        <Text style={styles.timer}>{formatDuration(isRecording ? durationMs : memo?.durationMs ?? durationMs)}</Text>
        <Text style={styles.timerMeta}>No upload · no transcription</Text>
      </View>

      <Waveform active={isRecording} />
      <Text style={styles.body}>{body}</Text>

      <View style={styles.actions}>
        <PillButton
          tone={isRecording ? 'accentSoft' : 'primary'}
          size="md"
          icon={isRecording ? 'x' : 'mic'}
          full
          onPress={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? 'Stop recording' : 'Start recording'}
        </PillButton>
        <PillButton tone="soft" size="md" icon="clock" full disabled={!memo || isPlaying} onPress={playMemo}>
          {isPlaying ? 'Playing' : 'Play back'}
        </PillButton>
        <PillButton tone="soft" size="md" icon="check" full disabled={!memo || saving} onPress={saveMemo}>
          {saving ? 'Saving metadata' : saveLabel}
        </PillButton>
      </View>

      {memo ? (
        <View style={styles.metaBox}>
          <Text style={styles.metaLabel}>LOCAL AUDIO SOURCE</Text>
          <Text style={styles.metaValue}>{memo.filename}</Text>
          <Text style={styles.metaText}>
            {memo.mimeType} · {formatDuration(memo.durationMs)} · Source audio remains local.
          </Text>
        </View>
      ) : null}

      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: fbSpacing.x4,
  },
  header: {
    minHeight: fbTouch.min,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: fbSpacing.x3,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: fbSpacing.x2,
  },
  title: {
    color: fbColors.ink,
    fontSize: fbType.h2,
    lineHeight: 23,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: fbSpacing.x3,
  },
  timer: {
    color: fbColors.ink,
    fontSize: 28,
    lineHeight: 34,
    fontFamily: fbFonts.monoMedium,
    fontWeight: fbWeights.medium,
  },
  timerMeta: {
    flex: 1,
    textAlign: 'right',
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  waveform: {
    minHeight: 78,
    borderRadius: fbRadii.md,
    borderWidth: fbBorder.hairline,
    borderColor: fbColors.ruleSoft,
    backgroundColor: fbColors.paperDeep,
    paddingHorizontal: fbSpacing.x3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  waveformBar: {
    flex: 1,
    maxWidth: 12,
    borderRadius: fbRadii.pill,
  },
  body: {
    color: fbColors.inkSoft,
    fontSize: fbType.body,
    lineHeight: 21,
    fontFamily: fbFonts.sansRegular,
  },
  actions: {
    gap: fbSpacing.x2,
  },
  metaBox: {
    gap: fbSpacing.x1,
    padding: fbSpacing.x3,
    borderRadius: fbRadii.md,
    backgroundColor: fbColors.paperDeep,
  },
  metaLabel: {
    color: fbColors.inkMute,
    fontSize: fbType.micro,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
    letterSpacing: 0.84,
  },
  metaValue: {
    color: fbColors.ink,
    fontSize: fbType.body,
    lineHeight: 21,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  metaText: {
    color: fbColors.inkSoft,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  notice: {
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
});
