import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { DASHBOARD_MODE_LABELS, type DashboardMode } from '../lib/dashboardMode';
import { Colors, Spacing, Radius, Shadow, Font } from '../theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfileProps {
  onBack: () => void;
  onSaveComplete?: () => void | Promise<void>;
}

interface VeteranInfo {
  displayName: string;
  branch: string;
  separationYear: string;
  state: string;
  vaRatingLevel: 'below_100' | 'one_hundred' | null;
  vaIsPt: boolean | null;
  vaIsTdiu: boolean | null;
  addressLine1: string;
  city: string;
  zipCode: string;
  phoneNumber: string;
}

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

const VA_STATUS_OPTIONS: Array<{ value: DashboardMode | null; label: string }> = [
  { value: null, label: 'Unknown / not sure' },
  { value: 'below_100', label: DASHBOARD_MODE_LABELS.below_100 },
  { value: 'one_hundred_scheduler', label: DASHBOARD_MODE_LABELS.one_hundred_scheduler },
  { value: 'one_hundred_pt', label: DASHBOARD_MODE_LABELS.one_hundred_pt },
  { value: 'tdiu_unemployable', label: DASHBOARD_MODE_LABELS.tdiu_unemployable },
];

function getSelectedVaStatus(info: Pick<VeteranInfo, 'vaRatingLevel' | 'vaIsPt' | 'vaIsTdiu'>): DashboardMode | null {
  if (info.vaIsTdiu === true) {
    return 'tdiu_unemployable';
  }

  if (info.vaRatingLevel === 'one_hundred' && info.vaIsPt === true) {
    return 'one_hundred_pt';
  }

  if (info.vaRatingLevel === 'one_hundred') {
    return 'one_hundred_scheduler';
  }

  if (info.vaRatingLevel === 'below_100') {
    return 'below_100';
  }

  return null;
}

function getVaStatusFields(status: DashboardMode | null): Pick<VeteranInfo, 'vaRatingLevel' | 'vaIsPt' | 'vaIsTdiu'> {
  switch (status) {
    case 'below_100':
      return { vaRatingLevel: 'below_100', vaIsPt: null, vaIsTdiu: false };
    case 'one_hundred_scheduler':
      return { vaRatingLevel: 'one_hundred', vaIsPt: false, vaIsTdiu: false };
    case 'one_hundred_pt':
      return { vaRatingLevel: 'one_hundred', vaIsPt: true, vaIsTdiu: false };
    case 'tdiu_unemployable':
      return { vaRatingLevel: null, vaIsPt: null, vaIsTdiu: true };
    default:
      return { vaRatingLevel: null, vaIsPt: null, vaIsTdiu: null };
  }
}

// ─── Section Header ───────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ label: string }> = ({ label }) => (
  <Text style={profileStyles.sectionHeader}>{label}</Text>
);

// ─── Setting Row ──────────────────────────────────────────────────────────────

const SettingRow: React.FC<{
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  rightElement?: React.ReactNode;
}> = ({ icon, label, value, onPress, destructive, rightElement }) => (
  <TouchableOpacity
    style={profileStyles.settingRow}
    onPress={onPress}
    activeOpacity={onPress ? 0.75 : 1}
    disabled={!onPress && !rightElement}
  >
    <Text style={profileStyles.settingIcon}>{icon}</Text>
    <View style={{ flex: 1 }}>
      <Text style={[profileStyles.settingLabel, destructive && { color: Colors.crimsonLight }]}>
        {label}
      </Text>
      {value ? <Text style={profileStyles.settingValue}>{value}</Text> : null}
    </View>
    {rightElement ?? (onPress ? <Text style={profileStyles.settingChevron}>›</Text> : null)}
  </TouchableOpacity>
);

// ─── Branch Picker ────────────────────────────────────────────────────────────

const BranchPicker: React.FC<{
  selected: string;
  onSelect: (branch: string) => void;
  onClose: () => void;
}> = ({ selected, onSelect, onClose }) => (
  <View style={profileStyles.pickerOverlay}>
    <View style={profileStyles.pickerCard}>
      <Text style={profileStyles.pickerTitle}>Branch of Service</Text>
      {SERVICE_BRANCHES.map((b) => (
        <TouchableOpacity
          key={b}
          style={[profileStyles.pickerOption, selected === b && profileStyles.pickerOptionActive]}
          onPress={() => { onSelect(b); onClose(); }}
        >
          <Text style={[profileStyles.pickerOptionText, selected === b && { color: Colors.navy }]}>
            {b}
          </Text>
          {selected === b && <Text style={{ color: Colors.navy, fontWeight: '900' }}>✓</Text>}
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={profileStyles.pickerCancel} onPress={onClose}>
        <Text style={profileStyles.pickerCancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// ─── Claim Status Picker ──────────────────────────────────────────────────────

const ClaimStatusPicker: React.FC<{
  selected: DashboardMode | null;
  onSelect: (status: DashboardMode | null) => void;
  onClose: () => void;
}> = ({ selected, onSelect, onClose }) => (
  <View style={profileStyles.pickerOverlay}>
    <View style={profileStyles.pickerCard}>
      <Text style={profileStyles.pickerTitle}>VA Disability Status</Text>
      {VA_STATUS_OPTIONS.map((option) => (
        <TouchableOpacity
          key={option.label}
          style={[profileStyles.pickerOption, selected === option.value && profileStyles.pickerOptionActive]}
          onPress={() => { onSelect(option.value); onClose(); }}
        >
          <Text style={[profileStyles.pickerOptionText, selected === option.value && { color: Colors.navy }]}>
            {option.label}
          </Text>
          {selected === option.value && <Text style={{ color: Colors.navy, fontWeight: '900' }}>✓</Text>}
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={profileStyles.pickerCancel} onPress={onClose}>
        <Text style={profileStyles.pickerCancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UserProfile({ onBack, onSaveComplete }: UserProfileProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showBranchPicker, setShowBranchPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  const [userId, setUserId] = useState('');

  const [veteranInfo, setVeteranInfo] = useState<VeteranInfo>({
    displayName: '',
    branch: '',
    separationYear: '',
    state: '',
    vaRatingLevel: null,
    vaIsPt: null,
    vaIsTdiu: null,
    addressLine1: '',
    city: '',
    zipCode: '',
    phoneNumber: '',
  });

  // Notification preferences — stored locally, no backend needed yet
  const [notifNewPolicy, setNotifNewPolicy] = useState(true);
  const [notifClaimTips, setNotifClaimTips] = useState(true);
  const [notifItfReminder, setNotifItfReminder] = useState(true);

  // ── Load user from Supabase session + profiles table ──
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      setEmail(user.email ?? '');
      setUserId(user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, address_line1, city, state, zip_code, phone_number, branch, separation_year, va_rating_level, va_is_pt, va_is_tdiu')
        .eq('id', user.id)
        .single();

      if (profile) {
        setVeteranInfo((prev) => ({
          ...prev,
          displayName: profile.full_name ?? '',
          state: profile.state ?? '',
          addressLine1: profile.address_line1 ?? '',
          city: profile.city ?? '',
          zipCode: profile.zip_code ?? '',
          phoneNumber: profile.phone_number ?? '',
          branch: profile.branch ?? '',
          separationYear: profile.separation_year ?? '',
          vaRatingLevel: profile.va_rating_level ?? null,
          vaIsPt: profile.va_is_pt ?? null,
          vaIsTdiu: profile.va_is_tdiu ?? null,
        }));
      }

      setLoading(false);
    };

    loadProfile();
  }, []);

  // ── Save veteran info to Supabase profiles table ──
  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      full_name: veteranInfo.displayName,
      address_line1: veteranInfo.addressLine1,
      city: veteranInfo.city,
      state: veteranInfo.state,
      zip_code: veteranInfo.zipCode,
      phone_number: veteranInfo.phoneNumber,
      branch: veteranInfo.branch,
      separation_year: veteranInfo.separationYear,
      va_rating_level: veteranInfo.vaRatingLevel,
      va_is_pt: veteranInfo.vaIsPt,
      va_is_tdiu: veteranInfo.vaIsTdiu,
    });
    setSaving(false);
    if (error) {
      Alert.alert('Could not save', error.message);
    } else {
      Alert.alert('Saved', 'Your profile has been updated.', [
        {
          text: 'OK',
          onPress: async () => {
            if (onSaveComplete) {
              await onSaveComplete();
            } else {
              onBack();
            }
          },
        },
      ]);
    }
  };

  const selectedVaStatus = getSelectedVaStatus(veteranInfo);

  // ── Sign out ──
  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            // Auth state change listener in App.tsx will redirect to login automatically
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={profileStyles.loadingContainer}>
        <ActivityIndicator color={Colors.gold} size="large" />
      </View>
    );
  }

  return (
    <View style={profileStyles.container}>
      {/* ── Back to Dashboard ── */}
      <TouchableOpacity onPress={onBack} style={profileStyles.backToDashBtn}>
        <Text style={profileStyles.backToDashText}>← Back to Dashboard</Text>
      </TouchableOpacity>

      {/* ── Header ── */}
      <View style={profileStyles.header}>
        <Text style={profileStyles.headerTitle}>Profile</Text>
        <TouchableOpacity
          style={[profileStyles.saveBtn, saving && profileStyles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator size="small" color={Colors.navy} />
            : <Text style={profileStyles.saveBtnText}>Save</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView
        style={profileStyles.scroll}
        contentContainerStyle={profileStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar / Name ── */}
        <View style={profileStyles.avatarSection}>
          <View style={profileStyles.avatar}>
            <Text style={profileStyles.avatarInitial}>
              {veteranInfo.displayName ? veteranInfo.displayName[0].toUpperCase() : '?'}
            </Text>
          </View>
          <Text style={profileStyles.avatarEmail}>{email}</Text>
        </View>

        {/* ── Veteran Info ── */}
        <SectionHeader label="VETERAN INFORMATION" />
        <View style={profileStyles.card}>
          <Text style={profileStyles.fieldLabel}>PREFERRED NAME</Text>
          <TextInput
            style={profileStyles.fieldInput}
            value={veteranInfo.displayName}
            onChangeText={(v) => setVeteranInfo((p) => ({ ...p, displayName: v }))}
            placeholder="e.g. Sergeant Webb"
            placeholderTextColor={Colors.gray500}
            autoCapitalize="words"
          />

          <Text style={[profileStyles.fieldLabel, { marginTop: 14 }]}>BRANCH OF SERVICE</Text>
          <TouchableOpacity
            style={profileStyles.fieldSelect}
            onPress={() => setShowBranchPicker(true)}
          >
            <Text style={veteranInfo.branch ? profileStyles.fieldSelectValue : profileStyles.fieldSelectPlaceholder}>
              {veteranInfo.branch || 'Select branch...'}
            </Text>
            <Text style={profileStyles.fieldSelectChevron}>›</Text>
          </TouchableOpacity>

          <Text style={[profileStyles.fieldLabel, { marginTop: 14 }]}>YEAR OF SEPARATION</Text>
          <TextInput
            style={profileStyles.fieldInput}
            value={veteranInfo.separationYear}
            onChangeText={(v) => setVeteranInfo((p) => ({ ...p, separationYear: v }))}
            placeholder="e.g. 2018"
            placeholderTextColor={Colors.gray500}
            keyboardType="numeric"
            maxLength={4}
          />

          <Text style={[profileStyles.fieldLabel, { marginTop: 14 }]}>STATE OF RESIDENCE</Text>
          <TextInput
            style={profileStyles.fieldInput}
            value={veteranInfo.state}
            onChangeText={(v) => setVeteranInfo((p) => ({ ...p, state: v }))}
            placeholder="e.g. Texas"
            placeholderTextColor={Colors.gray500}
            autoCapitalize="words"
          />

          <Text style={[profileStyles.fieldLabel, { marginTop: 14 }]}>VA DISABILITY STATUS</Text>
          <TouchableOpacity
            style={profileStyles.fieldSelect}
            onPress={() => setShowStatusPicker(true)}
          >
            <Text style={selectedVaStatus ? profileStyles.fieldSelectValue : profileStyles.fieldSelectPlaceholder}>
              {selectedVaStatus ? DASHBOARD_MODE_LABELS[selectedVaStatus] : 'Select status...'}
            </Text>
            <Text style={profileStyles.fieldSelectChevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ── Account ── */}
        <SectionHeader label="ACCOUNT" />
        <View style={profileStyles.card}>
          <SettingRow icon="✉️" label="Email address" value={email} />
          <View style={profileStyles.divider} />
          <SettingRow
            icon="🔑"
            label="Change password"
            onPress={() => Alert.alert('Change Password', 'A password reset link will be sent to ' + email + '.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Send Link', onPress: () => supabase.auth.resetPasswordForEmail(email) },
            ])}
          />
        </View>

        {/* ── Notifications ── */}
        <SectionHeader label="NOTIFICATIONS" />
        <View style={profileStyles.card}>
          <SettingRow
            icon="📢"
            label="Official VA Updates"
            value="Get notified when VA rules change"
            rightElement={
              <Switch
                value={notifNewPolicy}
                onValueChange={setNotifNewPolicy}
                trackColor={{ false: Colors.navyLight, true: Colors.teal }}
                thumbColor={notifNewPolicy ? Colors.white : Colors.gray300}
              />
            }
          />
          <View style={profileStyles.divider} />
          <SettingRow
            icon="💡"
            label="Claim tips"
            value="Weekly tips based on your conditions"
            rightElement={
              <Switch
                value={notifClaimTips}
                onValueChange={setNotifClaimTips}
                trackColor={{ false: Colors.navyLight, true: Colors.teal }}
                thumbColor={notifClaimTips ? Colors.white : Colors.gray300}
              />
            }
          />
          <View style={profileStyles.divider} />
          <SettingRow
            icon="📅"
            label="ITF expiration reminder"
            value="Remind me 60 days before my ITF expires"
            rightElement={
              <Switch
                value={notifItfReminder}
                onValueChange={setNotifItfReminder}
                trackColor={{ false: Colors.navyLight, true: Colors.teal }}
                thumbColor={notifItfReminder ? Colors.white : Colors.gray300}
              />
            }
          />
        </View>

        {/* ── About ── */}
        <SectionHeader label="ABOUT" />
        <View style={profileStyles.card}>
          <SettingRow icon="ℹ️" label="VEN App" value="Beta v0.1 — Veteran Education Network" />
          <View style={profileStyles.divider} />
          <SettingRow
            icon="🛡️"
            label="Privacy Policy"
            value="Your data stays on your device"
            onPress={() => Alert.alert('Privacy', 'VEN does not sell or share your personal information. Veteran profile data is stored in your secure Supabase account only.')}
          />
          <View style={profileStyles.divider} />
          <SettingRow
            icon="📬"
            label="Send feedback"
            value="tony@myven.us"
            onPress={() => Alert.alert('Feedback', 'Email feedback to tony@myven.us')}
          />
        </View>

        {/* ── Sign Out ── */}
        <TouchableOpacity style={profileStyles.signOutBtn} onPress={handleSignOut} activeOpacity={0.85}>
          <Text style={profileStyles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={profileStyles.legalNote}>
          VEN is not affiliated with the Department of Veterans Affairs. This app provides
          educational guidance only — not legal advice.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Pickers ── */}
      {showBranchPicker && (
        <BranchPicker
          selected={veteranInfo.branch}
          onSelect={(b) => setVeteranInfo((p) => ({ ...p, branch: b }))}
          onClose={() => setShowBranchPicker(false)}
        />
      )}
      {showStatusPicker && (
        <ClaimStatusPicker
          selected={selectedVaStatus}
          onSelect={(status) => setVeteranInfo((p) => ({ ...p, ...getVaStatusFields(status) }))}
          onClose={() => setShowStatusPicker(false)}
        />
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const profileStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.navy,
    borderBottomWidth: 1,
    borderBottomColor: Colors.navyLight,
  },
  backToDashBtn: {
    paddingTop: Platform.OS === 'ios' ? 54 : 40,
    paddingVertical: 12,
    marginBottom: 16,
  },
  backToDashText: {
    color: '#D4AF37',
    fontSize: 15,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    color: Colors.white,
    fontSize: 18,
    fontWeight: '800',
    fontFamily: Font.display,
    marginLeft: 12,
  },
  saveBtn: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: Radius.full,
    minWidth: 60,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: Colors.navy, fontWeight: '900', fontSize: 14 },

  // ── Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.md },

  // ── Avatar
  avatarSection: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.navyLight,
    borderWidth: 3,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    ...Shadow.glow,
  },
  avatarInitial: {
    color: Colors.gold,
    fontSize: 32,
    fontWeight: '900',
    fontFamily: Font.display,
  },
  avatarEmail: {
    color: Colors.gray500,
    fontSize: 13,
  },

  // ── Section Header
  sectionHeader: {
    color: Colors.gray500,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: Spacing.md,
    marginBottom: 8,
    marginLeft: 4,
  },

  // ── Card
  card: {
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.navyLight,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.navyLight,
    marginLeft: 48,
  },

  // ── Field inputs
  fieldLabel: {
    color: Colors.gray500,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 6,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
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
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
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
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  fieldSelectValue: { flex: 1, color: Colors.white, fontSize: 15 },
  fieldSelectPlaceholder: { flex: 1, color: Colors.gray500, fontSize: 15 },
  fieldSelectChevron: { color: Colors.gray500, fontSize: 20 },

  // ── Setting Row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    gap: 12,
  },
  settingIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  settingLabel: { color: Colors.white, fontSize: 14, fontWeight: '600' },
  settingValue: { color: Colors.gray500, fontSize: 12, marginTop: 2 },
  settingChevron: { color: Colors.gray500, fontSize: 20 },

  // ── Pickers
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

  // ── Sign Out
  signOutBtn: {
    marginTop: Spacing.md,
    paddingVertical: 15,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.crimsonLight,
    alignItems: 'center',
  },
  signOutText: { color: Colors.crimsonLight, fontWeight: '800', fontSize: 15 },

  // ── Legal
  legalNote: {
    color: Colors.gray700,
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
});
