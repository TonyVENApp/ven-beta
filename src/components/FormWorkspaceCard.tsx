import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { Colors, Spacing, Radius, Font } from '../theme';
import {
  FormDraft,
  statusLabel,
  statusColor,
  saveDraft,
} from '../lib/formWorkspace';

// ─── Props ────────────────────────────────────────────────────────────────────

interface FormWorkspaceCardProps {
  draft: FormDraft;
  onDraftChange: (updated: FormDraft) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FormWorkspaceCard({ draft, onDraftChange }: FormWorkspaceCardProps) {

  const prefillKeys = Object.keys(draft.prefillData);
  const userFieldKeys = Object.keys(draft.userFields);

  const handleSaveDraft = async () => {
    const updated: FormDraft = {
      ...draft,
      status: draft.status === 'not_started' ? 'in_progress' : draft.status,
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
    Linking.openURL(draft.officialUrl).catch((e) =>
      console.error('[FormWorkspaceCard] openURL error:', e)
    );
  };

  const sColor = statusColor(draft.status);
  const sLabel = statusLabel(draft.status);

  return (
    <View style={styles.container}>

      {/* ── Status + Title ── */}
      <View style={styles.headerRow}>
        <View style={[styles.statusBadge, { backgroundColor: sColor }]}>
          <Text style={styles.statusText}>{sLabel}</Text>
        </View>
      </View>
      <Text style={styles.title}>{draft.title}</Text>

      {/* ── Progress bar ── */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${draft.completionPercent}%` }]} />
      </View>
      <Text style={styles.progressLabel}>{draft.completionPercent}% complete</Text>

      {/* ── Prefilled by app ── */}
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

      {/* ── Still needed ── */}
      {userFieldKeys.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabelNeeded}>📝 Still needed from you</Text>
          {userFieldKeys.map((key) => (
            <View key={key} style={styles.fieldRow}>
              <Text style={styles.fieldKey}>{key}</Text>
              <Text style={[styles.fieldValue, { color: Colors.gray500 }]}>
                {draft.userFields[key] || '—'}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* ── Reminder toggle ── */}
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

      {/* ── Action buttons ── */}
      <TouchableOpacity style={styles.saveDraftBtn} onPress={handleSaveDraft} activeOpacity={0.85}>
        <Text style={styles.saveDraftText}>Save Draft</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} activeOpacity={0.85}>
        <Text style={styles.continueBtnText}>Continue on VA.gov →</Text>
      </TouchableOpacity>

      {/* ── Last edited ── */}
      {draft.lastEditedAt && (
        <Text style={styles.lastEdited}>
          Last saved: {new Date(draft.lastEditedAt).toLocaleDateString()}
        </Text>
      )}

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
    marginBottom: 6,
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
