import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Colors, Spacing, Radius, Font } from '../theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PrefillField {
  label: string;
  value: string;
}

interface UserField {
  label: string;
  value: string;
  required: boolean;
  filled: boolean;
}

interface FormReviewScreenProps {
  formId: string;
  formTitle: string;
  prefillFields: PrefillField[];
  userFields: UserField[];
  onBack: () => void;
}

// ─── Label formatter ─────────────────────────────────────────────────────────

function formatLabel(raw: string): string {
  const map: Record<string, string> = {
    full_name: 'Full Name',
    branch_of_service: 'Branch of Service',
    date_of_birth: 'Date of Birth',
    service_date_from: 'Service Start Date',
    service_date_to: 'Service End Date',
    discharge_character: 'Discharge Character',
    preferred_cemetery: 'Preferred Cemetery',
    ssn: 'Social Security Number',
    address_line1: 'Address',
    city: 'City',
    state: 'State',
    zip_code: 'ZIP Code',
    phone_number: 'Phone Number',
  };
  return map[raw] ?? raw.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FormReviewScreen({
  formId,
  formTitle,
  prefillFields,
  userFields,
  onBack,
}: FormReviewScreenProps) {

  const missingCount = userFields.filter((f) => f.required && !f.filled).length;

  return (
    <View style={styles.container}>

      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>{formTitle}</Text>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Notice Box ── */}
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            We prefilled what we could from your profile. Please review before submitting.
          </Text>
        </View>

        {/* ── Missing fields warning ── */}
        {missingCount > 0 && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              ⚠️ {missingCount} required {missingCount === 1 ? 'field is' : 'fields are'} missing. Fill them in before going to VA.gov.
            </Text>
          </View>
        )}

        {/* ── Prefilled from profile ── */}
        {prefillFields.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Prefilled from your profile</Text>
            <View style={styles.card}>
              {prefillFields.map((field, index) => (
                <View
                  key={field.label}
                  style={[
                    styles.fieldRow,
                    index < prefillFields.length - 1 && styles.fieldRowBorder,
                  ]}
                >
                  <Text style={styles.fieldLabel}>{formatLabel(field.label)}</Text>
                  <Text style={styles.fieldValue}>{field.value || '—'}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Your information ── */}
        {userFields.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Your information</Text>
            <View style={styles.card}>
              {userFields.map((field, index) => {
                const isMissing = field.required && !field.filled;
                return (
                  <View
                    key={field.label}
                    style={[
                      styles.fieldRow,
                      index < userFields.length - 1 && styles.fieldRowBorder,
                      isMissing && styles.fieldRowMissing,
                    ]}
                  >
                    <View style={styles.fieldLabelGroup}>
                      <Text style={styles.fieldLabel}>{formatLabel(field.label)}</Text>
                      {isMissing && (
                        <Text style={styles.missingText}>Required — missing</Text>
                      )}
                    </View>
                    <Text style={[styles.fieldValue, isMissing && styles.fieldValueMissing]}>
                      {field.value || '—'}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Action Buttons ── */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Open VA.gov to complete →</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.85}>
            <Text style={styles.secondaryBtnText}>Save & Come Back Later</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const TEAL = '#00897B';

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
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Font.display,
    textAlign: 'center',
  },
  topBarSpacer: {
    minWidth: 70,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    padding: Spacing.md,
  },

  // Notice box
  noticeBox: {
    backgroundColor: '#004D40',
    borderRadius: Radius.md,
    borderLeftWidth: 4,
    borderLeftColor: TEAL,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  noticeText: {
    color: '#B2DFDB',
    fontSize: 13,
    lineHeight: 20,
  },

  // Warning box
  warningBox: {
    backgroundColor: '#3B1A1A',
    borderRadius: Radius.md,
    borderLeftWidth: 4,
    borderLeftColor: '#E53935',
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  warningText: {
    color: '#FFCDD2',
    fontSize: 13,
    lineHeight: 20,
  },

  // Sections
  section: {
    marginBottom: Spacing.md,
  },
  sectionHeading: {
    color: TEAL,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },

  // Card
  card: {
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.navyLight,
    overflow: 'hidden',
  },

  // Field rows
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  fieldRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.navyLight,
  },
  fieldRowMissing: {
    borderLeftWidth: 3,
    borderLeftColor: '#E53935',
    paddingLeft: Spacing.md - 3,
  },
  fieldLabelGroup: {
    flex: 1,
    marginRight: 12,
  },
  fieldLabel: {
    color: Colors.gray500,
    fontSize: 12,
    fontWeight: '600',
  },
  fieldValue: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'right',
    flexShrink: 1,
    maxWidth: '55%',
  },
  fieldValueMissing: {
    color: Colors.gray700,
  },
  missingText: {
    color: '#E53935',
    fontSize: 11,
    marginTop: 3,
  },

  // Action buttons
  actions: {
    marginTop: Spacing.md,
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: TEAL,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '800',
    fontFamily: Font.display,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: Colors.navyLight,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: Colors.gray300,
    fontSize: 14,
    fontWeight: '600',
  },
});
