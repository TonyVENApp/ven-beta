import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  InputAccessoryView,
  Keyboard,
} from 'react-native';
import { Audio } from 'expo-av';
import { supabase } from '../lib/supabase';
import { Colors, Spacing, Radius, Font } from '../theme';

// ─── Types ─────────────────────────────────────────────────────────────────────

type FeedbackView = 'select' | 'written' | 'voice' | 'thanks';

interface FeedbackScreenProps {
  onBack: () => void;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const TASK_OPTIONS = [
  { label: 'View my dashboard', value: 'dashboard' },
  { label: 'Understand benefits', value: 'understand_benefits' },
  { label: 'Use Document Vault', value: 'document_vault' },
  { label: 'Help a family member', value: 'family_member' },
  { label: 'Use a form or guide', value: 'form_or_guide' },
  { label: 'Something else', value: 'other' },
];

const FEELING_OPTIONS = [
  { label: 'Helpful', value: 'helpful' },
  { label: 'Confusing', value: 'confusing' },
  { label: 'Frustrating', value: 'frustrating' },
  { label: 'Easy', value: 'easy' },
  { label: 'Not what I expected', value: 'not_expected' },
];

const PRIVACY_NOTE =
  'Please do not include Social Security numbers, claim numbers, bank information, or detailed medical information.';

const MAX_SECONDS = 60;

// Records M4A (AAC) on both iOS and Android — compatible with the feedback-audio bucket's allowed MIME types.
const M4A_RECORDING_OPTIONS = {
  isMeteringEnabled: false,
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: '.m4a',
    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
    audioQuality: Audio.IOSAudioQuality.MAX,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
};

// ─── Option Picker ─────────────────────────────────────────────────────────────

interface OptionPickerProps {
  options: { label: string; value: string }[];
  selected: string;
  onSelect: (value: string) => void;
}

function OptionPicker({ options, selected, onSelect }: OptionPickerProps) {
  return (
    <View style={styles.optionGroup}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.value}
          style={[styles.optionBtn, selected === opt.value && styles.optionBtnActive]}
          onPress={() => onSelect(opt.value)}
          activeOpacity={0.75}
        >
          <Text style={[styles.optionBtnText, selected === opt.value && styles.optionBtnTextActive]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Privacy Box ───────────────────────────────────────────────────────────────

function PrivacyBox() {
  return (
    <View style={styles.privacyBox}>
      <Text style={styles.privacyText}>{PRIVACY_NOTE}</Text>
    </View>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function FeedbackScreen({ onBack }: FeedbackScreenProps) {
  const [view, setView] = useState<FeedbackView>('select');

  // Written feedback state
  const [taskArea, setTaskArea] = useState('');
  const [messageText, setMessageText] = useState('');
  const [feeling, setFeeling] = useState('');
  const [improvementText, setImprovementText] = useState('');

  // Voice feedback state
  const [voiceTaskArea, setVoiceTaskArea] = useState('');
  const [voiceFeeling, setVoiceFeeling] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Shared
  const [submitting, setSubmitting] = useState(false);

  // Refs — used so timer callbacks and cleanup always see current values
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      void recordingRef.current?.stopAndUnloadAsync().catch(() => {});
      void soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  // Auto-stop when the 60-second limit is reached
  useEffect(() => {
    if (elapsed >= MAX_SECONDS && recordingRef.current) {
      void stopByRef();
    }
    // stopByRef only reads refs, safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed]);

  // ── Recording helpers ───────────────────────────────────────────────────────

  async function stopByRef() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const rec = recordingRef.current;
    if (!rec) return;
    recordingRef.current = null; // guard against double-call
    setIsRecording(false);
    try {
      await rec.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = rec.getURI();
      if (uri) setRecordingUri(uri);
    } catch {
      // Recording may have already been unloaded
    }
  }

  async function startRecording() {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Microphone Access Needed',
        'To leave a voice message, allow VEN to use your microphone in device settings.',
        [{ text: 'OK' }]
      );
      return;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const rec = new Audio.Recording();
    await rec.prepareToRecordAsync(M4A_RECORDING_OPTIONS);
    await rec.startAsync();

    recordingRef.current = rec;
    setIsRecording(true);
    setElapsed(0);

    timerRef.current = setInterval(() => {
      setElapsed((prev) => Math.min(prev + 1, MAX_SECONDS));
    }, 1000);
  }

  async function stopRecording() {
    await stopByRef();
  }

  async function playback() {
    if (!recordingUri) return;
    await soundRef.current?.unloadAsync();
    soundRef.current = null;
    const { sound } = await Audio.Sound.createAsync({ uri: recordingUri }, { shouldPlay: true });
    soundRef.current = sound;
    setIsPlaying(true);
    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) return;
      if (status.didJustFinish) setIsPlaying(false);
    });
  }

  async function deleteRecording() {
    await soundRef.current?.unloadAsync();
    soundRef.current = null;
    setIsPlaying(false);
    setRecordingUri(null);
    setElapsed(0);
  }

  // ── Submit written ──────────────────────────────────────────────────────────

  async function submitWritten() {
    if (!taskArea || !feeling || !messageText.trim()) {
      Alert.alert('Almost there', 'Please fill in what you were trying to do, what happened, and how it felt.');
      return;
    }
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('feedback_submissions').insert({
      user_id: user?.id ?? null,
      submission_type: 'text',
      source_screen: 'user_profile',
      task_area: taskArea,
      feeling,
      message_text: messageText.trim(),
      improvement_text: improvementText.trim() || null,
      platform: Platform.OS,
      app_version: '1.0.0',
    });
    setSubmitting(false);
    if (error) {
      Alert.alert('Could not send', 'Something went wrong. Please try again.');
    } else {
      setView('thanks');
    }
  }

  // ── Submit voice ────────────────────────────────────────────────────────────

  async function submitVoice() {
    console.log('[FIS voice] recordingUri:', recordingUri);
    if (!recordingUri) {
      Alert.alert('No recording', 'Please record your voice message first.');
      return;
    }
    if (!voiceTaskArea || !voiceFeeling) {
      Alert.alert('Almost there', 'Please select what you were trying to do and how it felt.');
      return;
    }
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Not signed in', 'Please sign in to submit feedback.');
      setSubmitting(false);
      return;
    }

    const ext = recordingUri.split('.').pop() ?? 'm4a';
    const mimeType = ext === 'wav' ? 'audio/wav' : 'audio/m4a';
    const path = `${user.id}/${Date.now()}-feedback.${ext}`;

    try {
      const fileResp = await fetch(recordingUri);
      const arrayBuffer = await fileResp.arrayBuffer();
      console.log('[FIS upload] platform:', Platform.OS, '| uri:', recordingUri, '| ext:', ext, '| path:', path, '| byte length:', arrayBuffer.byteLength);
      const { error: uploadError } = await supabase.storage
        .from('feedback-audio')
        .upload(path, arrayBuffer, { contentType: mimeType });
      console.log('[FIS upload] result — error:', uploadError ?? 'none');
      if (uploadError) throw uploadError;
    } catch {
      Alert.alert('Upload failed', 'Could not upload your voice message. Please try again.');
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from('feedback_submissions').insert({
      user_id: user.id,
      submission_type: 'voice',
      source_screen: 'user_profile',
      task_area: voiceTaskArea,
      feeling: voiceFeeling,
      audio_path: path,
      platform: Platform.OS,
      app_version: '1.0.0',
    });
    setSubmitting(false);
    if (error) {
      Alert.alert('Could not send', 'Something went wrong saving your feedback. Please try again.');
    } else {
      setView('thanks');
    }
  }

  // ── Shared layout helpers ───────────────────────────────────────────────────

  const topPad = Platform.OS === 'ios' ? 54 : 40;

  // ── View: Thanks ────────────────────────────────────────────────────────────

  if (view === 'thanks') {
    return (
      <View style={styles.container}>
        <View style={styles.thanksWrap}>
          <Text style={styles.thanksTitle}>Thank You</Text>
          <Text style={styles.thanksMsg}>
            Your feedback helps us make the app clearer and more useful for Veterans and families.
          </Text>
          <TouchableOpacity style={[styles.primaryBtn, styles.dashboardBtn]} onPress={onBack} activeOpacity={0.85}>
            <Text style={[styles.primaryBtnText, styles.dashboardBtnText]}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── View: Written ───────────────────────────────────────────────────────────

  if (view === 'written') {
    const canSubmit = !!taskArea && !!feeling && !!messageText.trim() && !submitting;
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={() => setView('select')} style={[styles.backBtn, { paddingTop: topPad }]}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.screenTitle}>Tell Us in Your Own Words</Text>
            <Text style={styles.screenSupport}>Help us improve the app for Veterans and families.</Text>
            <PrivacyBox />

            <Text style={styles.fieldLabel}>WHAT WERE YOU TRYING TO DO?</Text>
            <OptionPicker options={TASK_OPTIONS} selected={taskArea} onSelect={setTaskArea} />

            <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>WHAT HAPPENED?</Text>
            <TextInput
              style={styles.textArea}
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Tell us what happened..."
              placeholderTextColor={Colors.gray500}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              inputAccessoryViewID="feedback-done-bar"
            />

            <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>HOW DID IT FEEL?</Text>
            <OptionPicker options={FEELING_OPTIONS} selected={feeling} onSelect={setFeeling} />

            <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>WHAT COULD MAKE THIS BETTER? (optional)</Text>
            <TextInput
              style={[styles.textArea, { minHeight: 80 }]}
              value={improvementText}
              onChangeText={setImprovementText}
              placeholder="Any suggestions..."
              placeholderTextColor={Colors.gray500}
              multiline
              textAlignVertical="top"
              inputAccessoryViewID="feedback-done-bar"
            />

            <TouchableOpacity
              style={[styles.primaryBtn, !canSubmit && styles.primaryBtnDisabled]}
              onPress={submitWritten}
              disabled={!canSubmit}
              activeOpacity={0.85}
            >
              {submitting
                ? <ActivityIndicator size="small" color={Colors.navy} />
                : <Text style={styles.primaryBtnText}>Submit Feedback</Text>
              }
            </TouchableOpacity>
            <View style={{ height: 48 }} />
          </ScrollView>
        </KeyboardAvoidingView>
        {Platform.OS === 'ios' && (
          <InputAccessoryView nativeID="feedback-done-bar">
            <View style={styles.accessoryBar}>
              <TouchableOpacity onPress={() => Keyboard.dismiss()} activeOpacity={0.7}>
                <Text style={styles.accessoryDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
          </InputAccessoryView>
        )}
      </View>
    );
  }

  // ── View: Voice ─────────────────────────────────────────────────────────────

  if (view === 'voice') {
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    const timerLabel = `${mins}:${secs.toString().padStart(2, '0')} / 1:00`;
    const canSubmitVoice = !!recordingUri && !isRecording && !!voiceTaskArea && !!voiceFeeling && !submitting;

    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={() => setView('select')} style={[styles.backBtn, { paddingTop: topPad }]}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.screenTitle}>Tell Us in Your Own Words</Text>
          <Text style={styles.screenSupport}>Leave a short voice message — up to 60 seconds.</Text>
          <PrivacyBox />

          <View style={styles.voiceBox}>
            <Text style={styles.timerText}>{timerLabel}</Text>

            {!recordingUri && !isRecording && (
              <TouchableOpacity style={[styles.primaryBtn, styles.voiceFullWidth]} onPress={startRecording} activeOpacity={0.85}>
                <Text style={styles.primaryBtnText}>Start Recording</Text>
              </TouchableOpacity>
            )}

            {isRecording && (
              <>
                <View style={styles.recRow}>
                  <Text style={styles.recDot}>●</Text>
                  <Text style={styles.recLabel}>Recording...</Text>
                </View>
                <TouchableOpacity
                  style={[styles.primaryBtn, styles.voiceFullWidth, { backgroundColor: Colors.crimson }]}
                  onPress={stopRecording}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryBtnText}>Stop</Text>
                </TouchableOpacity>
              </>
            )}

            {recordingUri && !isRecording && (
              <View style={styles.playbackRow}>
                <TouchableOpacity
                  style={[styles.playBtn, isPlaying && { opacity: 0.6 }]}
                  onPress={isPlaying ? undefined : playback}
                  disabled={isPlaying}
                  activeOpacity={0.75}
                >
                  <Text style={styles.playBtnText}>{isPlaying ? '▶ Playing...' : '▶ Play Back'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={deleteRecording} activeOpacity={0.75}>
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {recordingUri && !isRecording && (
            <>
              <Text style={[styles.fieldLabel, { marginTop: Spacing.sm }]}>WHAT WERE YOU TRYING TO DO?</Text>
              <OptionPicker options={TASK_OPTIONS} selected={voiceTaskArea} onSelect={setVoiceTaskArea} />

              <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>HOW DID IT FEEL?</Text>
              <OptionPicker options={FEELING_OPTIONS} selected={voiceFeeling} onSelect={setVoiceFeeling} />

              <TouchableOpacity
                style={[styles.primaryBtn, { marginTop: Spacing.md }, !canSubmitVoice && styles.primaryBtnDisabled]}
                onPress={submitVoice}
                disabled={!canSubmitVoice}
                activeOpacity={0.85}
              >
                {submitting
                  ? <ActivityIndicator size="small" color={Colors.navy} />
                  : <Text style={styles.primaryBtnText}>Submit Voice Feedback</Text>
                }
              </TouchableOpacity>
            </>
          )}
          <View style={{ height: 48 }} />
        </ScrollView>
      </View>
    );
  }

  // ── View: Select (default) ──────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={[styles.backBtn, { paddingTop: topPad }]}>
        <Text style={styles.backBtnText}>← Back to Profile</Text>
      </TouchableOpacity>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Tell Us in Your Own Words</Text>
        <Text style={styles.screenSupport}>
          Help us improve the app for Veterans and families. You can write feedback or leave a short voice message.
        </Text>
        <PrivacyBox />

        <TouchableOpacity style={styles.choiceCard} onPress={() => setView('written')} activeOpacity={0.85}>
          <Text style={styles.choiceIcon}>✏️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.choiceTitle}>Write Feedback</Text>
            <Text style={styles.choiceSub}>Type what you experienced</Text>
          </View>
          <Text style={styles.choiceChevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.choiceCard} onPress={() => setView('voice')} activeOpacity={0.85}>
          <Text style={styles.choiceIcon}>🎙️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.choiceTitle}>Leave a Voice Message</Text>
            <Text style={styles.choiceSub}>Up to 60 seconds</Text>
          </View>
          <Text style={styles.choiceChevron}>›</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark,
  },
  backBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  backBtnText: {
    color: Colors.gold,
    fontSize: 15,
    fontWeight: '600',
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },

  // ── Header
  screenTitle: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: '800',
    fontFamily: Font.display,
    marginBottom: 8,
  },
  screenSupport: {
    color: Colors.gray300,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: Spacing.md,
  },

  // ── Privacy
  privacyBox: {
    backgroundColor: Colors.navyLight,
    borderRadius: Radius.md,
    padding: 12,
    marginBottom: Spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: Colors.gold,
  },
  privacyText: {
    color: Colors.gray300,
    fontSize: 12,
    lineHeight: 18,
  },

  // ── Field label
  fieldLabel: {
    color: Colors.gray500,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 8,
  },

  // ── Option picker
  optionGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  optionBtn: {
    borderWidth: 1,
    borderColor: Colors.navyLight,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.navyMid,
  },
  optionBtnActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  optionBtnText: {
    color: Colors.gray300,
    fontSize: 13,
    fontWeight: '600',
  },
  optionBtnTextActive: {
    color: Colors.navy,
    fontWeight: '800',
  },

  // ── Text area
  textArea: {
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.navyLight,
    color: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 120,
    marginBottom: Spacing.sm,
  },

  // ── Primary button
  primaryBtn: {
    backgroundColor: Colors.gold,
    borderRadius: Radius.full,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  primaryBtnDisabled: {
    opacity: 0.45,
  },
  primaryBtnText: {
    color: Colors.navy,
    fontSize: 15,
    fontWeight: '900',
  },

  // ── Voice box
  voiceBox: {
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.navyLight,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  voiceFullWidth: {
    alignSelf: 'stretch',
    marginTop: 0,
  },
  timerText: {
    color: Colors.gray300,
    fontSize: 22,
    fontWeight: '700',
    fontFamily: Font.mono,
  },
  recRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recDot: {
    color: Colors.crimsonLight,
    fontSize: 16,
  },
  recLabel: {
    color: Colors.crimsonLight,
    fontSize: 14,
    fontWeight: '700',
  },
  playbackRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignSelf: 'stretch',
  },
  playBtn: {
    flex: 1,
    backgroundColor: Colors.teal,
    borderRadius: Radius.full,
    paddingVertical: 12,
    alignItems: 'center',
  },
  playBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  deleteBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.crimsonLight,
    borderRadius: Radius.full,
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: Colors.crimsonLight,
    fontSize: 14,
    fontWeight: '700',
  },

  // ── Choice cards
  choiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.navyLight,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: 12,
  },
  choiceIcon: { fontSize: 28 },
  choiceTitle: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  choiceSub: {
    color: Colors.gray500,
    fontSize: 13,
    marginTop: 2,
  },
  choiceChevron: {
    color: Colors.gray500,
    fontSize: 24,
  },

  // ── Thank you
  thanksWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  thanksTitle: {
    color: Colors.gold,
    fontSize: 36,
    fontWeight: '900',
    fontFamily: Font.display,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  thanksMsg: {
    color: Colors.gray300,
    fontSize: 18,
    lineHeight: 27,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  // ── Keyboard accessory bar (iOS only)
  accessoryBar: {
    backgroundColor: Colors.navyMid,
    borderTopWidth: 1,
    borderTopColor: Colors.navyLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    alignItems: 'flex-end',
  },
  accessoryDoneText: {
    color: Colors.gold,
    fontSize: 16,
    fontWeight: '700',
  },

  // ── Back to Dashboard button overrides
  dashboardBtn: {
    alignSelf: 'stretch',
    paddingVertical: 18,
  },
  dashboardBtnText: {
    fontSize: 18,
  },
});
