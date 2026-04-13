import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  TextInput,
} from 'react-native';
import { Colors, Spacing, Radius, Font } from '../theme';
import {
  FormDraft,
  FormField,
  statusLabel,
  statusColor,
  saveDraft,
  computeCompletion,
} from '../lib/formWorkspace';

interface ReviewUserField {
  label: string;
  value: string;
  required: boolean;
  filled: boolean;
}

interface FormWorkspaceCardProps {
  draft: FormDraft;
  onDraftChange: (updated: FormDraft) => void;
  onReview?: (params: {
    formId: string;
    formTitle: string;
    prefillFields: { label: string; value: string }[];
    userFields: ReviewUserField[];
  }) => void;
}

export function FormWorkspaceCard({ draft, onDraftChange, onReview }: FormWorkspaceCardProps) {
  const [expanded, setExpanded] = useState(false);

  const prefillKeys = Object.keys(draft.prefillData);
  const fieldDefs = (draft.fieldDefinitions ?? []).filter(
    (f) => !draft.prefillData[f.key]
  );
  const hasFields = fieldDefs.length > 0;

  const handleFieldChange = async (key: string, value: string) => {
    const updatedFields = { ...draft.userFields, [key]: value };
    const updatedDraft: FormDraft = {
      ...draft,
      userFields: updatedFields,
      status: 'in_progress',
      completionPercent: computeCompletion({ ...draft, userFields: updatedFields }),
    };
    onDraftChange(updatedDraft);
    await saveDraft(updatedDraft);
  };

  const handleSaveDraft = async () => {
    const updated: FormDraft = {
      ...draft,
      status: draft.status === 'not_started' ? 'in_progress' : draft.status,
      completionPercent: computeCompletion(draft),
    };
    await saveDraft(updated);
    onDraftChange(updated);
  };

  const handleToggleReminder = async () => {
    const updated: FormDraft = {
      ...draft,
      reminderEnabled: !draft.reminderEnabled,
    };
    await saveDraft(updated);
    onDraftChange(updated);
  };

  const handleContinue = () => {
    if (onReview) {
      const prefillFields = Object.keys(draft.prefillData).map((key) => ({
        label: key,
        value: draft.prefillData[key],
      }));
      const userFields: ReviewUserField[] = (draft.fieldDefinitions ?? [])
        .filter((f) => !draft.prefillData[f.key])
        .map((f) => ({
          label: f.label,
          value: draft.userFields[f.key] ?? '',
          required: f.required,
          filled: Boolean(draft.userFields[f.key]?.trim()),
        }));
      onReview({
        formId: draft.id,
        formTitle: draft.title,
        prefillFields,
        userFields,
      });
    } else {
      Linking.openURL(draft.officialUrl).catch((e) =>
        console.error('[FormWorkspaceCard] openURL error:', e)
      );
    }
  };

  const sColor = statusColor(draft.status);
  const sLabel = statusLabel(draft.status);
  const completion = computeCompletion(draft);

  return (
    <View style={styles.container}>

      <View style={styles.headerRow}>
        <View style={[styles.statusBadge, { backgroundColor: sColor }]}>
          <Text style={styles.statusText}>{sLabel}</Text>
        </View>
      </View>

      <Text style={styles.title}>{draft.title}</Text>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${completion}%` as any }]} />
      </View>
      <Text style={styles.progressLabel}>{completion}% complete</Text>

      {prefillKeys.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>✅ We filled this for you</Text>
          {prefillKeys.map((key) => (
            <View key={key} style={styles.fieldRow}>
              <Text style={styles.fieldKey}>{key}</Text>
              <Text style={styles.fieldValue}>{draft.prefillData[key]}</Text>
            </View>
          ))}
        </View>
      )}

      {hasFields && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.fieldsHeader}
            onPress={() => setExpanded(!expanded)}
            activeOpacity={0.8}
          >
            <Text style={styles.sectionLabelNeeded}>📝 Fill in your information</Text>
            <Text style={styles.fieldsToggle}>{expanded ? '−' : '+'}</Text>
          </TouchableOpacity>

          {expanded && (
            <View style={styles.fieldsWrapper}>
              {fieldDefs.map((field: FormField) => (
                <View key={field.key} style={styles.fieldEntry}>
                  <Text style={styles.fieldEntryLabel}>
                    {field.label}{field.required ? ' *' : ''}
                  </Text>
                  {field.hint ? (
                    <Text style={styles.fieldHint}>{field.hint}</Text>
                  ) : null}
                  {field.inputType === 'select' && field.options ? (
                    <View style={styles.optionsRow}>
                      {field.options.map((opt) => (
                        <TouchableOpacity
                          key={opt}
                          style={[
                            styles.optionChip,
                            draft.userFields[field.key] === opt && styles.optionChipSelected,
                          ]}
                          onPress={() => handleFieldChange(field.key, opt)}
                          activeOpacity={0.8}
                        >
                          <Text style={[
                            styles.optionChipText,
                            draft.userFields[field.key] === opt && styles.optionChipTextSelected,
                          ]}>
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <TextInput
                      style={styles.textInput}
                      value={draft.userFields[field.key] || ''}
                      onChangeText={(val) => handleFieldChange(field.key, val)}
                      placeholder={field.placeholder}
                      placeholderTextColor={Colors.gray700}
                    />
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      <TouchableOpacity
        style={styles.reminderRow}
        onPress={handleToggleReminder}
        activeOpacity={0.8}
      >
        <Text style={styles.reminderLabel}>
          {draft.reminderEnabled ? '🔔 Daily reminder on' : '🔕 Daily reminder off'}
        </Text>
        <View style={[styles.toggle, draft.reminderEnabled && styles.toggleOn]}>
          <Text style={styles.toggleText}>{draft.reminderEnabled ? 'ON' : 'OFF'}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.saveDraftBtn} onPress={handleSaveDraft} activeOpacity={0.85}>
        <Text style={styles.saveDraftText}>Save Draft</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} activeOpacity={0.85}>
        <Text style={styles.continueBtnText}>Continue on VA.gov →</Text>
      </TouchableOpacity>

      {draft.lastEditedAt && (
        <Text style={styles.lastEdited}>
          Last saved: {new Date(draft.lastEditedAt).toLocaleDateString()}
        </Text>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.navyLight,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  statusBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  title: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Font.display,
    marginBottom: Spacing.sm,
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.navyLight,
    borderRadius: Radius.full,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: Colors.gold,
    borderRadius: Radius.full,
  },
  progressLabel: {
    color: Colors.gray500,
    fontSize: 11,
    marginBottom: Spacing.sm,
  },
  section: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionLabel: {
    color: Colors.gold,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  sectionLabelNeeded: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  fieldsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.navyLight,
  },
  fieldsToggle: {
    color: Colors.gold,
    fontSize: 20,
    fontWeight: '300',
    lineHeight: 24,
  },
  fieldsWrapper: {
    marginTop: 8,
  },
  fieldEntry: {
    marginBottom: 14,
  },
  fieldEntryLabel: {
    color: Colors.gray300,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  fieldHint: {
    color: Colors.gray500,
    fontSize: 11,
    marginBottom: 4,
    lineHeight: 16,
  },
  textInput: {
    backgroundColor: Colors.navy,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.navyLight,
    color: Colors.white,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  optionChip: {
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.navyLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.navy,
    marginRight: 8,
    marginBottom: 8,
  },
  optionChipSelected: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  optionChipText: {
    color: Colors.gray300,
    fontSize: 12,
    fontWeight: '600',
  },
  optionChipTextSelected: {
    color: Colors.navy,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.navyLight,
  },
  fieldKey: {
    color: Colors.gray500,
    fontSize: 12,
    flex: 1,
  },
  fieldValue: {
    color: Colors.white,
    fontSize: 12,
    flex: 1,
    textAlign: 'right',
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.navyLight,
  },
  reminderLabel: {
    color: Colors.gray300,
    fontSize: 13,
  },
  toggle: {
    backgroundColor: Colors.navyLight,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  toggleOn: {
    backgroundColor: Colors.gold,
  },
  toggleText: {
    color: Colors.navy,
    fontSize: 11,
    fontWeight: '800',
  },
  saveDraftBtn: {
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: Radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  saveDraftText: {
    color: Colors.gold,
    fontSize: 14,
    fontWeight: '700',
  },
  continueBtn: {
    backgroundColor: Colors.gold,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  continueBtnText: {
    color: Colors.navy,
    fontSize: 15,
    fontWeight: '800',
    fontFamily: Font.display,
  },
  lastEdited: {
    color: Colors.gray700,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
});
