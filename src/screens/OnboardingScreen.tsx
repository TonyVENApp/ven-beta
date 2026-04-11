import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Colors, Spacing, Radius, Font } from '../theme';

// ─── Props ────────────────────────────────────────────────────────────────────

interface OnboardingScreenProps {
  onComplete: () => void;
}

// ─── Options (same as UserProfile) ───────────────────────────────────────────

const SERVICE_BRANCHES = [
  'Army',
  'Navy',
  'Air Force',
  'Marine Corps',
  'Coast Guard',
  'Space Force',
  'Army National Guard',
  'Air National Guard',
];

const CLAIM_STATUSES = [
  'Never filed',
  'Currently filing',
  'Claim pending decision',
  'Rated — filing supplemental',
  'Rated — no active claim',
];

// ─── Branch Picker ────────────────────────────────────────────────────────────

const BranchPicker: React.FC<{
  selected: string;
  onSelect: (branch: string) => void;
  onClose: () => void;
}> = ({ selected, onSelect, onClose }) => (
  <View style={styles.pickerOverlay}>
    <View style={styles.pickerCard}>
      <Text style={styles.pickerTitle}>Branch of Service</Text>
      {SERVICE_BRANCHES.map((b) => (
        <TouchableOpacity
          key={b}
          style={[styles.pickerOption, selected === b && styles.pickerOptionActive]}
          onPress={() => { onSelect(b); onClose(); }}
        >
          <Text style={[styles.pickerOptionText, selected === b && { color: Colors.navy }]}>{b}</Text>
          {selected === b && <Text style={{ color: Colors.navy, fontWeight: '900' }}>✓</Text>}
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={styles.pickerCancel} onPress={onClose}>
        <Text style={styles.pickerCancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// ─── Claim Status Picker ──────────────────────────────────────────────────────

const ClaimStatusPicker: React.FC<{
  selected: string;
  onSelect: (status: string) => void;
  onClose: () => void;
}> = ({ selected, onSelect, onClose }) => (
  <View style={styles.pickerOverlay}>
    <View style={styles.pickerCard}>
      <Text style={styles.pickerTitle}>Where are you in the claims process?</Text>
      {CLAIM_STATUSES.map((s) => (
        <TouchableOpacity
          key={s}
          style={[styles.pickerOption, selected === s && styles.pickerOptionActive]}
          onPress={() => { onSelect(s); onClose(); }}
        >
          <Text style={[styles.pickerOptionText, selected === s && { color: Colors.navy }]}>{s}</Text>
          {selected === s && <Text style={{ color: Colors.navy, fontWeight: '900' }}>✓</Text>}
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={styles.pickerCancel} onPress={onClose}>
        <Text style={styles.pickerCancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [displayName, setDisplayName] = useState('');
  const [branch, setBranch] = useState('');
  const [separationYear, setSeparationYear] = useState('');
  const [state, setState] = useState('');
  const [claimStatus, setClaimStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [showBranchPicker, setShowBranchPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  const handleGetStarted = async () => {
    if (!displayName.trim()) {
      Alert.alert('Almost there', 'Please enter your preferred name.');
      return;
    }

    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      Alert.alert('Error', 'Could not get your account. Please try again.');
      return;
    }

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: displayName.trim(),
      branch: branch || null,
      separation_year: separationYear.trim() || null,
      state: state.trim() || null,
      va_rating_level: null,
      va_is_pt: null,
      va_is_tdiu: null,
      // TEMPORARY: keep writing legacy claim_status until remaining profile flows move off it.
      claim_status: claimStatus || null,
    });

    setSaving(false);

    if (error) {
      Alert.alert('Could not save', error.message);
    } else {
      onComplete();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.logo}>VEN</Text>
          <Text style={styles.welcomeTitle}>Welcome, Veteran.</Text>
          <Text style={styles.welcomeSub}>
            Tell us a little about yourself so we can personalize your experience.
            You can update this anytime.
          </Text>
        </View>

        {/* ── Form ── */}
        <View style={styles.card}>

          <Text style={styles.fieldLabel}>PREFERRED NAME</Text>
          <TextInput
            style={styles.fieldInput}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="e.g. Sergeant Webb"
            placeholderTextColor={Colors.gray500}
            autoCapitalize="words"
            autoFocus
          />

          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>BRANCH OF SERVICE</Text>
          <TouchableOpacity
            style={styles.fieldSelect}
            onPress={() => setShowBranchPicker(true)}
          >
            <Text style={branch ? styles.fieldSelectValue : styles.fieldSelectPlaceholder}>
              {branch || 'Select branch...'}
            </Text>
            <Text style={styles.fieldSelectChevron}>›</Text>
          </TouchableOpacity>

          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>YEAR OF SEPARATION</Text>
          <TextInput
            style={styles.fieldInput}
            value={separationYear}
            onChangeText={setSeparationYear}
            placeholder="e.g. 2018"
            placeholderTextColor={Colors.gray500}
            keyboardType="numeric"
            maxLength={4}
          />

          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>STATE OF RESIDENCE</Text>
          <TextInput
            style={styles.fieldInput}
            value={state}
            onChangeText={setState}
            placeholder="e.g. Texas"
            placeholderTextColor={Colors.gray500}
            autoCapitalize="words"
          />

          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>WHERE ARE YOU IN THE CLAIMS PROCESS?</Text>
          <TouchableOpacity
            style={styles.fieldSelect}
            onPress={() => setShowStatusPicker(true)}
          >
            <Text style={claimStatus ? styles.fieldSelectValue : styles.fieldSelectPlaceholder}>
              {claimStatus || 'Select status...'}
            </Text>
            <Text style={styles.fieldSelectChevron}>›</Text>
          </TouchableOpacity>

        </View>

        {/* ── Get Started Button ── */}
        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleGetStarted}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator color={Colors.navy} />
            : <Text style={styles.buttonText}>Get Started</Text>
          }
        </TouchableOpacity>

        <Text style={styles.legalNote}>
          VEN is not affiliated with the Department of Veterans Affairs.
          This app provides educational guidance only — not legal advice.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Pickers ── */}
      {showBranchPicker && (
        <BranchPicker
          selected={branch}
          onSelect={setBranch}
          onClose={() => setShowBranchPicker(false)}
        />
      )}
      {showStatusPicker && (
        <ClaimStatusPicker
          selected={claimStatus}
          onSelect={setClaimStatus}
          onClose={() => setShowStatusPicker(false)}
        />
      )}
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: Spacing.lg,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logo: {
    fontFamily: Font.display,
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.gold,
    letterSpacing: 6,
    marginBottom: Spacing.md,
  },
  welcomeTitle: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: '800',
    fontFamily: Font.display,
    marginBottom: Spacing.sm,
  },
  welcomeSub: {
    color: Colors.gray300,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },

  // Card
  card: {
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.navyLight,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },

  // Fields
  fieldLabel: {
    color: Colors.gray500,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: Colors.dark,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.navyLight,
    color: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    marginBottom: Spacing.sm,
  },
  fieldSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.navyLight,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: Spacing.sm,
  },
  fieldSelectValue: { flex: 1, color: Colors.white, fontSize: 15 },
  fieldSelectPlaceholder: { flex: 1, color: Colors.gray500, fontSize: 15 },
  fieldSelectChevron: { color: Colors.gray500, fontSize: 20 },

  // Button
  button: {
    backgroundColor: Colors.gold,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.navy,
    fontSize: 17,
    fontWeight: '800',
    fontFamily: Font.display,
    letterSpacing: 0.5,
  },

  // Legal
  legalNote: {
    color: Colors.gray700,
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },

  // Pickers
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(6,15,30,0.88)',
    justifyContent: 'flex-end',
  },
  pickerCard: {
    backgroundColor: Colors.navyMid,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.navyLight,
    padding: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 36 : Spacing.md,
  },
  pickerTitle: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Font.display,
    marginBottom: 12,
    textAlign: 'center',
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    marginBottom: 4,
  },
  pickerOptionActive: { backgroundColor: Colors.gold },
  pickerOptionText: { color: Colors.gray300, fontSize: 15, fontWeight: '600' },
  pickerCancel: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.navyLight,
    alignItems: 'center',
  },
  pickerCancelText: { color: Colors.gray300, fontWeight: '700', fontSize: 15 },
});
