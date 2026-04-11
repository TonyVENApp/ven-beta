import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  Alert,
  Platform,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Colors, Spacing, Radius, Font } from '../theme';

// ─── Picker options ───────────────────────────────────────────────────────────

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

const DISCHARGE_OPTIONS = [
  'Honorable',
  'General',
  'Other Than Honorable',
  'Bad Conduct',
];

const TRAINING_TYPES = [
  'College or university',
  'Trade or vocational school',
  'Apprenticeship or on-the-job training',
  'Certification or licensing',
  'Flight training',
  'Other',
];

const ATTENDANCE_TYPES = [
  'Full-time',
  'Part-time',
  'Online',
  'Hybrid',
];

const BENEFIT_CHAPTERS = [
  'Post-9/11 GI Bill',
  'Montgomery GI Bill',
  'VR&E',
];

const PRIOR_USE_OPTIONS = ['Yes', 'No'];

const BENEFIT_TYPE_MAP: Record<string, string> = {
  ch33: 'Post-9/11 GI Bill',
  ch30: 'Montgomery GI Bill',
  vre: 'VR&E',
};

// ─── Picker sub-components ────────────────────────────────────────────────────

const OptionPicker: React.FC<{
  title: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}> = ({ title, options, selected, onSelect, onClose }) => (
  <View style={pickerStyles.overlay}>
    <View style={pickerStyles.card}>
      <Text style={pickerStyles.title}>{title}</Text>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[pickerStyles.option, selected === opt && pickerStyles.optionActive]}
          onPress={() => { onSelect(opt); onClose(); }}
        >
          <Text style={[pickerStyles.optionText, selected === opt && { color: Colors.navy }]}>{opt}</Text>
          {selected === opt && <Text style={{ color: Colors.navy, fontWeight: '900' }}>✓</Text>}
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={pickerStyles.cancel} onPress={onClose}>
        <Text style={pickerStyles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const pickerStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(6,15,30,0.88)',
    justifyContent: 'flex-end',
    zIndex: 10,
  },
  card: {
    backgroundColor: Colors.navyMid,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.navyLight,
    padding: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 36 : Spacing.md,
  },
  title: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Font.display,
    marginBottom: 12,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    marginBottom: 4,
  },
  optionActive: { backgroundColor: Colors.gold },
  optionText: { color: Colors.gray300, fontSize: 15, fontWeight: '600' },
  cancel: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.navyLight,
    alignItems: 'center',
  },
  cancelText: { color: Colors.gray300, fontWeight: '700', fontSize: 15 },
});

// ─── Props ────────────────────────────────────────────────────────────────────

interface EducationApplicationFormProps {
  benefitType: 'ch33' | 'ch30' | 'vre';
  onBack: () => void;
}

// ─── Title map ────────────────────────────────────────────────────────────────

const TITLES: Record<EducationApplicationFormProps['benefitType'], string> = {
  ch33: 'Post-9/11 GI Bill Application',
  ch30: 'Montgomery GI Bill Application',
  vre: 'VR&E Application',
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function EducationApplicationForm({ benefitType, onBack }: EducationApplicationFormProps) {
  const title = TITLES[benefitType];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState('');
  const [fullName, setFullName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [branch, setBranch] = useState('');
  const [serviceStartYear, setServiceStartYear] = useState('');
  const [serviceEndYear, setServiceEndYear] = useState('');
  const [dischargeCharacter, setDischargeCharacter] = useState('');
  const [showBranchPicker, setShowBranchPicker] = useState(false);
  const [showDischargePicker, setShowDischargePicker] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [programGoal, setProgramGoal] = useState('');
  const [trainingType, setTrainingType] = useState('');
  const [attendanceType, setAttendanceType] = useState('');
  const [plannedStartDate, setPlannedStartDate] = useState('');
  const [showTrainingTypePicker, setShowTrainingTypePicker] = useState(false);
  const [showAttendanceTypePicker, setShowAttendanceTypePicker] = useState(false);
  const [benefitChapter, setBenefitChapter] = useState(BENEFIT_TYPE_MAP[benefitType] ?? '');
  const [priorUse, setPriorUse] = useState('');
  const [monthsUsed, setMonthsUsed] = useState('');
  const [showBenefitChapterPicker, setShowBenefitChapterPicker] = useState(false);
  const [showPriorUsePicker, setShowPriorUsePicker] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data } = await supabase
          .from('profiles')
          .select('full_name, address_line1, city, state, zip_code, phone_number, branch, service_start_year, service_end_year, character_of_discharge, school_name, program_goal, training_type, attendance_type, planned_start_date, benefit_chapter, prior_benefit_use, months_benefit_used')
          .eq('id', user.id)
          .single();
        if (data) {
          setFullName(data.full_name ?? '');
          setAddressLine1(data.address_line1 ?? '');
          setCity(data.city ?? '');
          setState(data.state ?? '');
          setZipCode(data.zip_code ?? '');
          setPhoneNumber(data.phone_number ?? '');
          setBranch(data.branch ?? '');
          setServiceStartYear(data.service_start_year ?? '');
          setServiceEndYear(data.service_end_year ?? '');
          setDischargeCharacter(data.character_of_discharge ?? '');
          setSchoolName(data.school_name ?? '');
          setProgramGoal(data.program_goal ?? '');
          setTrainingType(data.training_type ?? '');
          setAttendanceType(data.attendance_type ?? '');
          setPlannedStartDate(data.planned_start_date ?? '');
          setBenefitChapter(data.benefit_chapter ?? BENEFIT_TYPE_MAP[benefitType] ?? '');
          setPriorUse(data.prior_benefit_use ?? '');
          setMonthsUsed(data.months_benefit_used ?? '');
        }
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!userId) return;
    Keyboard.dismiss();
    setSaving(true);
    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      full_name: fullName.trim(),
      address_line1: addressLine1.trim(),
      city: city.trim(),
      state: state.trim(),
      zip_code: zipCode.trim(),
      phone_number: phoneNumber.trim(),
      branch: branch || null,
      service_start_year: serviceStartYear.trim() || null,
      service_end_year: serviceEndYear.trim() || null,
      character_of_discharge: dischargeCharacter || null,
      school_name: schoolName.trim() || null,
      program_goal: programGoal.trim() || null,
      training_type: trainingType || null,
      attendance_type: attendanceType || null,
      planned_start_date: plannedStartDate.trim() || null,
      benefit_chapter: benefitChapter || null,
      prior_benefit_use: priorUse || null,
      months_benefit_used: monthsUsed.trim() || null,
      edu_app_draft_started: true,
    });
    setSaving(false);
    if (error) {
      Alert.alert('Could not save', error.message);
    } else {
      Alert.alert('Saved', 'Next step coming next.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { flex: 1 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>{title}</Text>
        <View style={styles.topBarSpacer} />
      </View>

      {/* ── Progress ── */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Application Progress</Text>
          <Text style={styles.progressPercent}>100%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>
        <Text style={styles.progressHelper}>4 sections currently included in this form</Text>
      </View>

      {/* ── Loading ── */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets
        >
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>YOUR INFORMATION</Text>
            <Text style={styles.sectionNote}>
              Pre-filled from your profile. Edit anything that needs updating.
            </Text>

            <Text style={styles.fieldLabel}>FULL NAME</Text>
            <TextInput
              style={styles.fieldInput}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your full legal name"
              placeholderTextColor={Colors.gray500}
              autoCapitalize="words"
            />

            <Text style={styles.fieldLabel}>ADDRESS</Text>
            <TextInput
              style={styles.fieldInput}
              value={addressLine1}
              onChangeText={setAddressLine1}
              placeholder="Street address"
              placeholderTextColor={Colors.gray500}
              autoCapitalize="words"
            />

            <Text style={styles.fieldLabel}>CITY</Text>
            <TextInput
              style={styles.fieldInput}
              value={city}
              onChangeText={setCity}
              placeholder="City"
              placeholderTextColor={Colors.gray500}
              autoCapitalize="words"
            />

            <Text style={styles.fieldLabel}>STATE</Text>
            <TextInput
              style={styles.fieldInput}
              value={state}
              onChangeText={setState}
              placeholder="State"
              placeholderTextColor={Colors.gray500}
              autoCapitalize="words"
            />

            <Text style={styles.fieldLabel}>ZIP CODE</Text>
            <TextInput
              style={styles.fieldInput}
              value={zipCode}
              onChangeText={setZipCode}
              placeholder="ZIP code"
              placeholderTextColor={Colors.gray500}
              keyboardType="numeric"
              maxLength={10}
            />

            <Text style={styles.fieldLabel}>PHONE NUMBER</Text>
            <TextInput
              style={[styles.fieldInput, { marginBottom: 0 }]}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Phone number"
              placeholderTextColor={Colors.gray500}
              keyboardType="phone-pad"
            />
          </View>

          {/* ── Military Service ── */}
          <View style={[styles.card, { marginTop: 12 }]}>
            <Text style={styles.sectionLabel}>MILITARY SERVICE INFORMATION</Text>

            <Text style={styles.fieldLabel}>BRANCH OF SERVICE</Text>
            <TouchableOpacity
              style={styles.fieldSelect}
              onPress={() => setShowBranchPicker(true)}
            >
              <Text style={branch ? styles.fieldSelectValue : styles.fieldSelectPlaceholder}>
                {branch || 'Select branch...'}
              </Text>
              <Text style={styles.fieldSelectChevron}>›</Text>
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>SERVICE START YEAR</Text>
            <TextInput
              style={styles.fieldInput}
              value={serviceStartYear}
              onChangeText={setServiceStartYear}
              placeholder="e.g. 2010"
              placeholderTextColor={Colors.gray500}
              keyboardType="numeric"
              maxLength={4}
            />

            <Text style={styles.fieldLabel}>SERVICE END YEAR</Text>
            <TextInput
              style={styles.fieldInput}
              value={serviceEndYear}
              onChangeText={setServiceEndYear}
              placeholder="e.g. 2014"
              placeholderTextColor={Colors.gray500}
              keyboardType="numeric"
              maxLength={4}
            />

            <Text style={styles.fieldLabel}>CHARACTER OF DISCHARGE</Text>
            <TouchableOpacity
              style={[styles.fieldSelect, { marginBottom: 0 }]}
              onPress={() => setShowDischargePicker(true)}
            >
              <Text style={dischargeCharacter ? styles.fieldSelectValue : styles.fieldSelectPlaceholder}>
                {dischargeCharacter || 'Select discharge character...'}
              </Text>
              <Text style={styles.fieldSelectChevron}>›</Text>
            </TouchableOpacity>
          </View>

          {/* ── Education Program Details ── */}
          <View style={[styles.card, { marginTop: 12 }]}>
            <Text style={styles.sectionLabel}>EDUCATION PROGRAM DETAILS</Text>

            <Text style={styles.fieldLabel}>SCHOOL OR TRAINING FACILITY NAME</Text>
            <TextInput
              style={styles.fieldInput}
              value={schoolName}
              onChangeText={setSchoolName}
              placeholder="e.g. University of Texas"
              placeholderTextColor={Colors.gray500}
              autoCapitalize="words"
            />

            <Text style={styles.fieldLabel}>PROGRAM OR DEGREE GOAL</Text>
            <TextInput
              style={styles.fieldInput}
              value={programGoal}
              onChangeText={setProgramGoal}
              placeholder="e.g. Bachelor of Science in Business"
              placeholderTextColor={Colors.gray500}
              autoCapitalize="sentences"
            />

            <Text style={styles.fieldLabel}>TRAINING TYPE</Text>
            <TouchableOpacity
              style={styles.fieldSelect}
              onPress={() => setShowTrainingTypePicker(true)}
            >
              <Text style={trainingType ? styles.fieldSelectValue : styles.fieldSelectPlaceholder}>
                {trainingType || 'Select training type...'}
              </Text>
              <Text style={styles.fieldSelectChevron}>›</Text>
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>ATTENDANCE TYPE</Text>
            <TouchableOpacity
              style={styles.fieldSelect}
              onPress={() => setShowAttendanceTypePicker(true)}
            >
              <Text style={attendanceType ? styles.fieldSelectValue : styles.fieldSelectPlaceholder}>
                {attendanceType || 'Select attendance type...'}
              </Text>
              <Text style={styles.fieldSelectChevron}>›</Text>
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>PLANNED START DATE</Text>
            <TextInput
              style={[styles.fieldInput, { marginBottom: 0 }]}
              value={plannedStartDate}
              onChangeText={setPlannedStartDate}
              placeholder="e.g. August 2026"
              placeholderTextColor={Colors.gray500}
              autoCapitalize="words"
            />
          </View>

          {/* ── Benefit Election ── */}
          <View style={[styles.card, { marginTop: 12 }]}>
            <Text style={styles.sectionLabel}>BENEFIT ELECTION</Text>

            <Text style={styles.fieldLabel}>BENEFIT CHAPTER TO USE</Text>
            <TouchableOpacity
              style={styles.fieldSelect}
              onPress={() => setShowBenefitChapterPicker(true)}
            >
              <Text style={benefitChapter ? styles.fieldSelectValue : styles.fieldSelectPlaceholder}>
                {benefitChapter || 'Select benefit chapter...'}
              </Text>
              <Text style={styles.fieldSelectChevron}>›</Text>
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>HAVE YOU USED THIS BENEFIT BEFORE?</Text>
            <TouchableOpacity
              style={styles.fieldSelect}
              onPress={() => setShowPriorUsePicker(true)}
            >
              <Text style={priorUse ? styles.fieldSelectValue : styles.fieldSelectPlaceholder}>
                {priorUse || 'Select...'}
              </Text>
              <Text style={styles.fieldSelectChevron}>›</Text>
            </TouchableOpacity>

            {priorUse === 'Yes' && (
              <>
                <Text style={styles.fieldLabel}>MONTHS OF BENEFIT USED (IF YOU KNOW)</Text>
                <TextInput
                  style={[styles.fieldInput, { marginBottom: 4 }]}
                  value={monthsUsed}
                  onChangeText={setMonthsUsed}
                  placeholder="e.g. 12"
                  placeholderTextColor={Colors.gray500}
                  keyboardType="numeric"
                  maxLength={4}
                />
                <Text style={{ fontSize: 13, color: Colors.gray300, lineHeight: 18, marginTop: 8, marginBottom: 0 }}>Leave this blank if you're not sure. You can still continue.</Text>
              </>
            )}
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving
              ? <ActivityIndicator color={Colors.navy} />
              : <Text style={styles.saveBtnText}>Save and Continue</Text>
            }
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
      {showBranchPicker && (
        <OptionPicker
          title="Branch of Service"
          options={SERVICE_BRANCHES}
          selected={branch}
          onSelect={setBranch}
          onClose={() => setShowBranchPicker(false)}
        />
      )}
      {showDischargePicker && (
        <OptionPicker
          title="Character of Discharge"
          options={DISCHARGE_OPTIONS}
          selected={dischargeCharacter}
          onSelect={setDischargeCharacter}
          onClose={() => setShowDischargePicker(false)}
        />
      )}
      {showTrainingTypePicker && (
        <OptionPicker
          title="Training Type"
          options={TRAINING_TYPES}
          selected={trainingType}
          onSelect={setTrainingType}
          onClose={() => setShowTrainingTypePicker(false)}
        />
      )}
      {showAttendanceTypePicker && (
        <OptionPicker
          title="Attendance Type"
          options={ATTENDANCE_TYPES}
          selected={attendanceType}
          onSelect={setAttendanceType}
          onClose={() => setShowAttendanceTypePicker(false)}
        />
      )}
      {showBenefitChapterPicker && (
        <OptionPicker
          title="Benefit Chapter to Use"
          options={BENEFIT_CHAPTERS}
          selected={benefitChapter}
          onSelect={setBenefitChapter}
          onClose={() => setShowBenefitChapterPicker(false)}
        />
      )}
      {showPriorUsePicker && (
        <OptionPicker
          title="Have You Used This Benefit Before?"
          options={PRIOR_USE_OPTIONS}
          selected={priorUse}
          onSelect={setPriorUse}
          onClose={() => setShowPriorUsePicker(false)}
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

  // Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? 54 : 40,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.navy,
    borderBottomWidth: 1,
    borderBottomColor: Colors.navyLight,
  },
  backBtn: {
    minWidth: 70,
  },
  backBtnText: {
    color: Colors.gold,
    fontSize: 14,
    fontWeight: '600',
  },
  topBarTitle: {
    flex: 1,
    color: Colors.white,
    fontSize: 15,
    fontWeight: '800',
    fontFamily: Font.display,
    textAlign: 'center',
  },
  topBarSpacer: {
    minWidth: 70,
  },

  // Progress
  progressContainer: {
    backgroundColor: Colors.navy,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.navyLight,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  progressLabel: {
    color: Colors.gray300,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  progressPercent: {
    color: Colors.gold,
    fontSize: 13,
    fontWeight: '800',
  },
  progressHelper: {
    color: Colors.gray500,
    fontSize: 10,
    marginTop: 6,
  },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.navyLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    width: '100%',
    backgroundColor: Colors.gold,
    borderRadius: 4,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Scroll
  scrollContent: {
    padding: Spacing.md,
  },

  // Card
  card: {
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.navyLight,
    padding: Spacing.lg,
  },
  sectionLabel: {
    color: Colors.gray500,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4,
  },
  sectionNote: {
    color: Colors.gray500,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },

  // Fields
  fieldLabel: {
    color: Colors.gray500,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 6,
    marginTop: 14,
  },
  saveBtn: {
    backgroundColor: Colors.gold,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: Colors.navy,
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Font.display,
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
});
