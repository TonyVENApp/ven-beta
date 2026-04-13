import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ────────────────────────────────────────────────────────────────────

export type FormMode = 'online' | 'pdf' | 'hybrid';

export type FormStatus =
  | 'not_started'
  | 'in_progress'
  | 'ready_to_review'
  | 'submitted';

export interface FormField {
  key: string;
  label: string;
  placeholder: string;
  inputType: 'text' | 'date' | 'select';
  options?: string[];
  required: boolean;
  hint?: string;
}

export interface FormDraft {
  id: string;
  title: string;
  mode: FormMode;
  officialUrl: string;
  status: FormStatus;
  completionPercent: number;
  prefillData: Record<string, string>;
  userFields: Record<string, string>;
  fieldDefinitions: FormField[];
  lastEditedAt: string | null;
  reminderEnabled: boolean;
  printEnabled: boolean;
  shareEnabled: boolean;
  submissionMethod: 'online' | 'mail' | 'fax' | 'in_person';
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

const DRAFT_KEY_PREFIX = 'form_draft_';

// ─── Save draft ───────────────────────────────────────────────────────────────

export async function saveDraft(draft: FormDraft): Promise<void> {
  try {
    const key = `${DRAFT_KEY_PREFIX}${draft.id}`;
    const updated: FormDraft = {
      ...draft,
      lastEditedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(updated));
  } catch (e) {
    console.error('[formWorkspace] saveDraft error:', e);
  }
}

// ─── Load draft ───────────────────────────────────────────────────────────────

export async function loadDraft(formId: string): Promise<FormDraft | null> {
  try {
    const key = `${DRAFT_KEY_PREFIX}${formId}`;
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as FormDraft;
  } catch (e) {
    console.error('[formWorkspace] loadDraft error:', e);
    return null;
  }
}

// ─── Delete draft ─────────────────────────────────────────────────────────────

export async function deleteDraft(formId: string): Promise<void> {
  try {
    const key = `${DRAFT_KEY_PREFIX}${formId}`;
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.error('[formWorkspace] deleteDraft error:', e);
  }
}

// ─── Default draft factory ────────────────────────────────────────────────────

export function makeDefaultDraft(
  id: string,
  title: string,
  mode: FormMode,
  officialUrl: string,
  submissionMethod: FormDraft['submissionMethod'],
  prefillData: Record<string, string> = {},
  printEnabled = true,
  shareEnabled = true,
  fieldDefinitions: FormField[] = [],
): FormDraft {
  return {
    id,
    title,
    mode,
    officialUrl,
    status: 'not_started',
    completionPercent: 0,
    prefillData,
    userFields: {},
    fieldDefinitions,
    lastEditedAt: null,
    reminderEnabled: false,
    printEnabled,
    shareEnabled,
    submissionMethod,
  };
}

export function computeCompletion(draft: FormDraft): number {
  const defs = draft.fieldDefinitions ?? [];
  const required = defs.filter((f) => f.required);
  if (required.length === 0) return draft.completionPercent;
  const filled = required.filter((f) => {
    const val = draft.userFields[f.key];
    return val !== undefined && val.trim() !== '';
  });
  return Math.round((filled.length / required.length) * 100);
}

// ─── Status label helper ──────────────────────────────────────────────────────

export function statusLabel(status: FormStatus): string {
  switch (status) {
    case 'not_started': return 'Not Started';
    case 'in_progress': return 'In Progress';
    case 'ready_to_review': return 'Ready to Review';
    case 'submitted': return 'Submitted';
  }
}

// ─── Status color helper ──────────────────────────────────────────────────────

export function statusColor(status: FormStatus): string {
  switch (status) {
    case 'not_started': return '#888888';
    case 'in_progress': return '#3A7DFF';
    case 'ready_to_review': return '#D4AF37';
    case 'submitted': return '#2ECC71';
  }
}
