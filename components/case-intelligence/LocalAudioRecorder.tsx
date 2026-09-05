import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Audio, type AVPlaybackStatus } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { discardTemporarySource, registerTemporarySource } from '@/lib/evidence/sourceCleanup';
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
  disabled = false,
  onRecordingChange,
  clearAfterSave = false,
  onRecorded,
}: {
  title?: string;
  body: string;
  saveLabel?: string;
  savedLabel?: string;
  onSave: (memo: RecordedAudioMemo) => Promise<void> | void;
  disabled?: boolean;
  onRecordingChange?: (recording: boolean) => void;
  clearAfterSave?: boolean;
  onRecorded?: (memo: RecordedAudioMemo) => void;
}) {
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const mountedRef = useRef(true);
  const startingRef = useRef(false);
  const capturedAtRef = useRef<string | null>(null);
  const sourcesRef = useRef(new Set<string>());
  const [starting, setStarting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const [memo, setMemo] = useState<RecordedAudioMemo | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => { onRecordingChange?.(isRecording || starting); }, [isRecording, starting, onRecordingChange]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      void soundRef.current?.unloadAsync().catch(() => undefined);
      const recording = recordingRef.current;
      void (async () => {
        await recording?.stopAndUnloadAsync().catch(() => undefined);
        const uri = recording?.getURI();
        if (uri) sourcesRef.current.add(uri);
        for (const source of sourcesRef.current) {
          await discardTemporarySource({ localUri: source }).catch(() => { /* Global cleanup notice keeps failed paths retryable. */ });
        }
      })();
    };
  }, []);

  async function registerSource(uri: string) {
    sourcesRef.current.add(uri);
    await registerTemporarySource({ localUri: uri });
    if (!mountedRef.current) { await discardTemporarySource({ localUri: uri }); return false; }
    return true;
  }

  async function stopAbandoned(recording: Audio.Recording) {
    await recording.stopAndUnloadAsync().catch(() => undefined);
    const uri = recording.getURI();
    if (uri) await discardTemporarySource({ localUri: uri });
  }

  async function startRecording() {
    if (isRecording || disabled || saving || startingRef.current) return;
    startingRef.current = true;
    setStarting(true);
    setNotice(null);

    try {
      await soundRef.current?.unloadAsync();
      soundRef.current = null;
      if (!mountedRef.current) return;
      setIsPlaying(false);
      const permission = await Audio.requestPermissionsAsync();
      if (!mountedRef.current) return;
      if (!permission.granted) {
        setNotice('Microphone permission is required to record a local voice memo.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      if (!mountedRef.current) return;

      const recording = new Audio.Recording();
      recordingRef.current = recording;
      recording.setProgressUpdateInterval(250);
      recording.setOnRecordingStatusUpdate((status) => {
        if (!mountedRef.current) return;
        setIsRecording(status.isRecording);
        setDurationMs(status.durationMillis);
      });
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      if (!mountedRef.current) { await stopAbandoned(recording); return; }
      const sourceUri = recording.getURI();
      if (sourceUri && !await registerSource(sourceUri)) { await stopAbandoned(recording); return; }
      capturedAtRef.current = new Date().toISOString();
      await recording.startAsync();
      if (!mountedRef.current) { await stopAbandoned(recording); return; }
      setMemo(null);
      setIsRecording(true);
      setDurationMs(0);
    } catch (err) {
      if (recordingRef.current) await stopAbandoned(recordingRef.current).catch(() => { /* Global notice exposes cleanup failure. */ });
      if (mountedRef.current) {
        setNotice(err instanceof Error ? err.message : 'Unable to start local audio recording.');
        setIsRecording(false);
      }
      recordingRef.current = null;
    } finally {
      startingRef.current = false;
      if (mountedRef.current) setStarting(false);
    }
  }

  async function stopRecording() {
    const recording = recordingRef.current;
    if (!recording) return;

    try {
      const status = await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recordingRef.current = null;
      if (mountedRef.current) setIsRecording(false);
      if (uri && !await registerSource(uri)) return;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      if (!mountedRef.current) { if (uri) await discardTemporarySource({ localUri: uri }); return; }

      if (!uri) {
        setNotice('Recording stopped, but no local audio URI was returned.');
        return;
      }

      const capturedAt = capturedAtRef.current ?? new Date().toISOString();
      const fileSizeBytes = await getFileSize(uri);
      if (!mountedRef.current) { await discardTemporarySource({ localUri: uri }); return; }
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
      onRecorded?.(nextMemo);
      setNotice('Local voice memo recorded. Transcription is not generated.');
    } catch (err) {
      if (mountedRef.current) setNotice(err instanceof Error ? err.message : 'Unable to stop local audio recording.');
    }
  }

  async function playMemo() {
    if (!memo?.uri || isPlaying || disabled || saving || starting) return;
    setNotice(null);

    try {
      await soundRef.current?.unloadAsync();
      if (!mountedRef.current) return;
      const { sound } = await Audio.Sound.createAsync(
        { uri: memo.uri },
        { shouldPlay: false },
        (status: AVPlaybackStatus) => {
          if (mountedRef.current && status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
          }
        },
      );
      if (!mountedRef.current) { await sound.unloadAsync(); return; }
      soundRef.current = sound;
      await sound.playAsync();
      if (!mountedRef.current) { await sound.unloadAsync(); return; }
      setIsPlaying(true);
    } catch (err) {
      if (mountedRef.current) { setIsPlaying(false); setNotice(err instanceof Error ? err.message : 'Unable to play this local voice memo.'); }
    }
  }

  async function saveMemo() {
    if (!memo || saving || disabled || isRecording || starting) return;
    setSaving(true);
    setNotice(null);

    try {
      await soundRef.current?.unloadAsync();
      if (!mountedRef.current) return;
      soundRef.current = null;
      setIsPlaying(false);
      await onSave(memo);
      if (clearAfterSave) {
        await discardTemporarySource({ localUri: memo.uri });
        sourcesRef.current.delete(memo.uri);
        if (!mountedRef.current) return;
        setMemo(null);
        setDurationMs(0);
      }
      if (mountedRef.current) setNotice(savedLabel);
    } catch (err) {
      if (mountedRef.current) setNotice(err instanceof Error ? err.message : 'Unable to preserve the original voice memo.');
    } finally {
      if (mountedRef.current) setSaving(false);
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
        <Text style={styles.timerMeta}>Original audio · no transcription</Text>
      </View>

      <Waveform active={isRecording} />
      <Text style={styles.body}>{body}</Text>

      <View style={styles.actions}>
        <PillButton
          tone={isRecording ? 'accentSoft' : 'primary'}
          size="md"
          icon={isRecording ? 'x' : 'mic'}
          full
          disabled={starting || ((disabled || saving) && !isRecording)}
          onPress={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? 'Stop recording' : starting ? 'Starting recording' : 'Start recording'}
        </PillButton>
        <PillButton tone="soft" size="md" icon="clock" full disabled={!memo || isPlaying || saving || disabled || starting || isRecording} onPress={playMemo}>
          {isPlaying ? 'Playing' : 'Play back'}
        </PillButton>
        <PillButton tone="soft" size="md" icon="check" full disabled={!memo || saving || disabled || isRecording || starting} onPress={saveMemo}>
          {saving ? 'Saving voice memo' : saveLabel}
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
