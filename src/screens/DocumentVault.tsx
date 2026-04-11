import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Alert,
  Modal,
  Image,
  Linking,
  InteractionManager,
  TextInput,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '../lib/supabase';
import { Colors, Spacing, Radius, Shadow, Font } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type DocCategory = 'all' | 'claims' | 'medical' | 'military' | 'education' | 'housing' | 'future' | 'personal';
type DocStatus = 'uploaded' | 'pending' | 'shared';
type FutureHelperTopic = 'DIC' | 'Preparing a Will' | 'Burial Preparation';
type FutureTopicKey = 'dic' | 'preparing-a-will' | 'burial-preparation';

interface VaultDocument {
  id: string;
  name: string;
  category: DocCategory;
  storedCategory: string;
  displayCategoryLabel: string;
  futureTopicKey?: FutureTopicKey;
  status: DocStatus;
  date: string;
  size: string;
  icon: string;
  filePath?: string;
  sharedWith?: string;
}

interface TrustedPerson {
  id: string;
  name: string;
  relation: string;
  email: string;
  phoneNumber?: string;
  access: 'full';
  lastActive: string;
}

interface TrustedPersonFormValues {
  fullName: string;
  relationship: string;
  email: string;
  phoneNumber: string;
}

interface DocumentVaultProps {
  onBack?: () => void;
  onDocumentCountChange?: (count: number) => void;
}

type AddAction = 'camera' | 'upload' | 'scan';
type FolderAccessCategory = 'claims' | 'medical' | 'military' | 'education' | 'housing' | 'personal' | 'future';

interface TrustedPersonFolderAccess {
  allowed: boolean;
  folders: FolderAccessCategory[];
}

const FUTURE_HELPER_GUIDANCE: Record<
  FutureHelperTopic,
  {
    title: string;
    items: string[];
  }
> = {
  DIC: {
    title: 'What to upload for DIC',
    items: [
      'Veteran identifying and service records',
      'Marriage or child relationship records',
      'Important survivor-related VA records',
      'Any records the family may need later for a DIC application',
    ],
  },
  'Preparing a Will': {
    title: 'What to upload for Preparing a Will',
    items: [
      'A copy of the current will',
      'Contact information for the person handling the estate',
      'A simple list showing where original documents are kept',
      'Any planning notes the Veteran wants the family to find later',
    ],
  },
  'Burial Preparation': {
    title: 'What to upload for Burial Preparation',
    items: [
      'DD214 or discharge records',
      'Burial wishes or planning notes',
      'Cemetery or funeral planning paperwork',
      'Any records the family may need quickly after a death',
    ],
  },
};

interface SupabaseDocumentRow {
  id: string;
  user_id: string;
  file_path: string;
  file_name: string;
  category: string;
  uploaded_at: string;
}

const UPLOAD_CATEGORY_OPTIONS: { id: Exclude<DocCategory, 'all'>; label: string }[] = [
  { id: 'claims', label: 'Claims' },
  { id: 'medical', label: 'Medical' },
  { id: 'military', label: 'Military' },
  { id: 'education', label: 'Education' },
  { id: 'housing', label: 'Housing' },
  { id: 'future', label: 'Prepare for the Future' },
  { id: 'personal', label: 'Personal / Other' },
];

const TRUSTED_FOLDER_ACCESS_OPTIONS: { id: FolderAccessCategory; label: string }[] = [
  { id: 'claims', label: 'Claims' },
  { id: 'medical', label: 'Medical' },
  { id: 'military', label: 'Military' },
  { id: 'education', label: 'Education' },
  { id: 'housing', label: 'Housing' },
  { id: 'personal', label: 'Personal' },
  { id: 'future', label: 'Prepare for the Future' },
];

function getTrustedFolderLabel(folderId: FolderAccessCategory): string {
  return TRUSTED_FOLDER_ACCESS_OPTIONS.find((folder) => folder.id === folderId)?.label ?? folderId;
}

function getTrustedPersonAccessPreview(access: TrustedPersonFolderAccess): {
  message?: string;
  folders: string[];
  includesFutureTopics: boolean;
} {
  if (!access.allowed) {
    return {
      message: 'This person does not currently have folder access.',
      folders: [],
      includesFutureTopics: false,
    };
  }

  if (access.folders.length === 0) {
    return {
      message: 'No folders selected yet.',
      folders: [],
      includesFutureTopics: false,
    };
  }

  return {
    folders: access.folders.map(getTrustedFolderLabel),
    includesFutureTopics: access.folders.includes('future'),
  };
}

export const MOCK_DOCUMENTS: VaultDocument[] = [
  { id: '1', name: 'DD-214 (Certificate of Release)', category: 'military', storedCategory: 'military', displayCategoryLabel: 'Military Service Records', status: 'uploaded', date: 'Mar 10, 2026', size: '2.4 MB', icon: '🎖️' },
  { id: '2', name: 'VA Medical Records — 2024', category: 'medical', storedCategory: 'medical', displayCategoryLabel: 'Medical Records', status: 'uploaded', date: 'Mar 8, 2026', size: '5.1 MB', icon: '🏥' },
  { id: '3', name: 'PTSD Nexus Letter — Dr. Rivera', category: 'claims', storedCategory: 'nexus', displayCategoryLabel: 'Nexus Letters', status: 'uploaded', date: 'Mar 5, 2026', size: '1.2 MB', icon: '📋', sharedWith: 'VSO - James Carter' },
  { id: '4', name: 'C&P Exam Results', category: 'claims', storedCategory: 'cp-exam', displayCategoryLabel: 'C&P Exams', status: 'pending', date: 'Mar 1, 2026', size: '800 KB', icon: '📄' },
  { id: '5', name: 'Service Treatment Records', category: 'military', storedCategory: 'military', displayCategoryLabel: 'Military Service Records', status: 'uploaded', date: 'Feb 28, 2026', size: '12.3 MB', icon: '📁' },
  { id: '6', name: 'VA Decision Letter', category: 'claims', storedCategory: 'decision-letter', displayCategoryLabel: 'Decision Letters', status: 'shared', date: 'Feb 20, 2026', size: '1.8 MB', icon: '⚖️', sharedWith: 'Maria Webb (Spouse)' },
];

const MOCK_TRUSTED: TrustedPerson = {
  id: 'trusted-maria-webb',
  name: 'Maria Webb',
  relation: 'Spouse',
  email: 'maria.webb@email.com',
  phoneNumber: '',
  access: 'full',
  lastActive: 'Today, 8:14 AM',
};

const MAX_TRUSTED_PEOPLE = 3;

const MOCK_TRUSTED_PEOPLE: TrustedPerson[] = [
  MOCK_TRUSTED,
  {
    id: 'trusted-james-webb',
    name: 'James Webb',
    relation: 'Son',
    email: 'james.webb@email.com',
    phoneNumber: '',
    access: 'full',
    lastActive: 'Yesterday, 6:42 PM',
  },
  {
    id: 'trusted-angela-morris',
    name: 'Angela Morris',
    relation: 'Sister',
    email: 'angela.morris@email.com',
    phoneNumber: '',
    access: 'full',
    lastActive: 'Apr 7, 2026',
  },
];

const CATEGORIES: { id: DocCategory; label: string; icon: string }[] = [
  { id: 'all', label: 'All Files', icon: '📂' },
  { id: 'claims', label: 'Claims', icon: '📋' },
  { id: 'medical', label: 'Medical Records', icon: '🏥' },
  { id: 'military', label: 'Military Service Records', icon: '🎖️' },
  { id: 'education', label: 'Education / GI Bill / VR&E', icon: '🎓' },
  { id: 'housing', label: 'VA Loan / Housing', icon: '🏠' },
  { id: 'future', label: 'Prepare for the Future', icon: '🛡️' },
  { id: 'personal', label: 'Personal / Other', icon: '🗂️' },
];

const FUTURE_TOPIC_LABEL_TO_KEY: Record<FutureHelperTopic, FutureTopicKey> = {
  DIC: 'dic',
  'Preparing a Will': 'preparing-a-will',
  'Burial Preparation': 'burial-preparation',
};

const FUTURE_TOPIC_KEY_TO_LABEL: Record<FutureTopicKey, FutureHelperTopic> = {
  dic: 'DIC',
  'preparing-a-will': 'Preparing a Will',
  'burial-preparation': 'Burial Preparation',
};

function getDocumentIcon(category: DocCategory): string {
  switch (category) {
    case 'claims':
      return '📋';
    case 'medical':
      return '🏥';
    case 'military':
      return '🎖️';
    case 'education':
      return '🎓';
    case 'housing':
      return '🏠';
    case 'future':
      return '🛡️';
    case 'personal':
      return '🗂️';
    default:
      return '📄';
  }
}

function getStoredCategoryForFilter(category: string): DocCategory {
  switch (category) {
    case 'claims':
    case 'cp-exam':
    case 'nexus':
    case 'decision-letter':
      return 'claims';
    case 'medical':
    case 'community-care':
    case 'champva':
      return 'medical';
    case 'military':
      return 'military';
    case 'education':
    case 'dependents':
      return 'education';
    case 'housing':
      return 'housing';
    case 'future':
    case 'prepare-future':
    case 'future-dic':
    case 'future-preparing-a-will':
    case 'future-burial-preparation':
      return 'future';
    case 'personal-other':
      return 'personal';
    default:
      return 'personal';
  }
}

function getCategoryDisplayLabel(category: string): string {
  switch (category) {
    case 'claims':
      return 'Claims';
    case 'medical':
      return 'Medical Records';
    case 'cp-exam':
      return 'C&P Exams';
    case 'nexus':
      return 'Nexus Letters';
    case 'decision-letter':
      return 'Decision Letters';
    case 'community-care':
      return 'Community Care';
    case 'champva':
      return 'CHAMPVA';
    case 'housing':
      return 'VA Loan / Housing';
    case 'future':
    case 'prepare-future':
    case 'future-dic':
    case 'future-preparing-a-will':
    case 'future-burial-preparation':
      return 'Prepare for the Future';
    case 'education':
      return 'Education / GI Bill / VR&E';
    case 'dependents':
      return 'Dependents / Family';
    case 'military':
      return 'Military Service Records';
    case 'personal-other':
      return 'Personal / Other';
    default:
      return 'Personal / Other';
  }
}

function getStoredCategoryForUpload(category: Exclude<DocCategory, 'all'>): string {
  if (category === 'personal') {
    return 'personal-other';
  }

  return category;
}

function getStoredCategoryForFutureUpload(topic: FutureHelperTopic): string {
  return `future-${FUTURE_TOPIC_LABEL_TO_KEY[topic]}`;
}

function getFutureTopicKeyForStoredCategory(category: string): FutureTopicKey | undefined {
  switch (category) {
    case 'future':
    case 'prepare-future':
    case 'future-dic':
      return 'dic';
    case 'future-preparing-a-will':
      return 'preparing-a-will';
    case 'future-burial-preparation':
      return 'burial-preparation';
    default:
      return undefined;
  }
}

function getFutureTopicLabelForStoredCategory(category: string): FutureHelperTopic | undefined {
  const topicKey = getFutureTopicKeyForStoredCategory(category);

  if (!topicKey) {
    return undefined;
  }

  return FUTURE_TOPIC_KEY_TO_LABEL[topicKey];
}

function formatUploadedDate(value?: string | null): string {
  if (!value) return 'Recently added';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Recently added';
  }

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function isImageFile(fileName: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|bmp|heic)$/i.test(fileName);
}

function isPdfFile(fileName: string): boolean {
  return /\.pdf$/i.test(fileName);
}

function showVaultStepError(step: string, message: string) {
  Alert.alert('Document Vault Error', `Step failed: ${step}\n\n${message}`);
}

const AddDocumentModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  busy: boolean;
  selectedCategory: Exclude<DocCategory, 'all'>;
  onSelectCategory: (category: Exclude<DocCategory, 'all'>) => void;
  onAdd: (action: AddAction) => Promise<void>;
}> = ({ visible, onClose, busy, selectedCategory, onSelectCategory, onAdd }) => {
  const options = [
    {
      icon: '📸',
      title: 'Take Photo',
      subtitle: 'Capture a document with your camera. Coming soon.',
      action: 'camera' as const,
      available: false,
      badge: 'Coming soon',
    },
    {
      icon: '📁',
      title: 'Upload File',
      subtitle: 'Select a PDF, photo, or file already saved on your device',
      action: 'upload' as const,
      available: true,
    },
    {
      icon: '📄',
      title: 'Scan Document',
      subtitle: 'Create a clean multi-page scan in one file. Coming soon.',
      action: 'scan' as const,
      available: false,
      badge: 'Coming soon',
    },
  ];

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Text style={styles.modalTitle}>Add Document</Text>
            <Text style={styles.modalSubtitle}>Choose how you want to add a document to your Vault.</Text>
            <View style={styles.uploadCategorySection}>
              <Text style={styles.uploadCategoryLabel}>Save to folder</Text>
              <View style={styles.uploadCategoryRow}>
                {UPLOAD_CATEGORY_OPTIONS.map((category) => {
                  const isSelected = selectedCategory === category.id;

                  return (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.uploadCategoryChip,
                        isSelected && styles.uploadCategoryChipActive,
                      ]}
                      onPress={() => onSelectCategory(category.id)}
                      disabled={busy}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.uploadCategoryChipText,
                          isSelected && styles.uploadCategoryChipTextActive,
                        ]}
                      >
                        {category.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt.action}
                style={[
                  styles.addOption,
                  !opt.available && styles.addOptionDisabled,
                ]}
                onPress={() => {
                  if (busy || !opt.available) return;
                  void onAdd(opt.action);
                }}
                activeOpacity={busy || !opt.available ? 1 : 0.85}
                disabled={busy || !opt.available}
              >
                <Text style={styles.addOptionIcon}>{opt.icon}</Text>
                <View style={{ flex: 1 }}>
                  <View style={styles.addOptionHeader}>
                    <Text style={styles.addOptionTitle}>{opt.title}</Text>
                    {opt.badge ? (
                      <View style={styles.addOptionBadge}>
                        <Text style={styles.addOptionBadgeText}>{opt.badge}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.addOptionSubtitle}>
                    {opt.action === 'upload'
                      ? `${opt.subtitle}. New files will go to ${UPLOAD_CATEGORY_OPTIONS.find((category) => category.id === selectedCategory)?.label ?? 'Claims'}`
                      : opt.subtitle}
                  </Text>
                </View>
                <Text style={[styles.addOptionArrow, !opt.available && styles.addOptionArrowDisabled]}>›</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCancelBtn} onPress={handleClose}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const ShareModal: React.FC<{ visible: boolean; doc: VaultDocument | null; trustedPeople: TrustedPerson[]; onClose: () => void }> = ({ visible, doc, trustedPeople, onClose }) => {
  if (!doc) return null;
  const shareOptions = [
    ...trustedPeople.map((trustedPerson) => ({
      icon: '👤',
      label: trustedPerson.name,
      sublabel: trustedPerson.relation + ' — Full access to this file only',
    })),
    { icon: '⚖️', label: 'My VSO', sublabel: 'Veterans Service Officer' },
    { icon: '🏥', label: 'My Doctor', sublabel: 'Private physician for Nexus Letter' },
    { icon: '📧', label: 'Send via Email', sublabel: 'Send to any email address' },
  ];
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Send Document</Text>
          <Text style={styles.modalSubtitle} numberOfLines={1}>{doc.icon} {doc.name}</Text>
          <View style={styles.shareModalNoteBox}>
            <Text style={styles.shareModalNoteText}>
              This permission only applies to the selected file. It does not give access to the whole folder.
            </Text>
          </View>
          {shareOptions.map((opt, i) => (
            <TouchableOpacity key={i} style={styles.addOption} onPress={() => Alert.alert('✅ Sent', '"' + doc.name + '" has been sent to ' + opt.label + '.', [{ text: 'OK', onPress: onClose }])} activeOpacity={0.85}>
              <Text style={styles.addOptionIcon}>{opt.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.addOptionTitle}>{opt.label}</Text>
                <Text style={styles.addOptionSubtitle}>{opt.sublabel}</Text>
              </View>
              <Text style={styles.addOptionArrow}>›</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export const DocumentVault: React.FC<DocumentVaultProps> = ({ onBack, onDocumentCountChange }) => {
  const [activeCategory, setActiveCategory] = useState<DocCategory>('all');
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<VaultDocument | null>(null);
  const [activeTab, setActiveTab] = useState<'files' | 'trusted'>('files');
  const [uploading, setUploading] = useState(false);
  const [isPicking, setIsPicking] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<VaultDocument | null>(null);
  const [selectedUploadCategory, setSelectedUploadCategory] = useState<Exclude<DocCategory, 'all'>>('claims');
  const [selectedFutureTopic, setSelectedFutureTopic] = useState<FutureHelperTopic>('DIC');
  const [trustedPeople, setTrustedPeople] = useState<TrustedPerson[]>(() => MOCK_TRUSTED_PEOPLE.slice(0, 1));
  const [folderAccessByPersonId, setFolderAccessByPersonId] = useState<Record<string, TrustedPersonFolderAccess>>({});
  const [showTrustedPersonForm, setShowTrustedPersonForm] = useState(false);
  const [editingTrustedPersonId, setEditingTrustedPersonId] = useState<string | null>(null);
  const [trustedPersonForm, setTrustedPersonForm] = useState<TrustedPersonFormValues>({
    fullName: '',
    relationship: '',
    email: '',
    phoneNumber: '',
  });
  const [trustedPersonErrors, setTrustedPersonErrors] = useState<Partial<Record<keyof TrustedPersonFormValues, string>>>({});

  const filteredDocs = documents.filter((doc) => {
    if (activeCategory === 'all') {
      return true;
    }

    if (doc.category !== activeCategory) {
      return false;
    }

    if (activeCategory !== 'future') {
      return true;
    }

    return doc.futureTopicKey === FUTURE_TOPIC_LABEL_TO_KEY[selectedFutureTopic];
  });
  const activeFolderLabel = CATEGORIES.find((category) => category.id === activeCategory)?.label ?? 'All Files';
  const selectedFutureGuidance = FUTURE_HELPER_GUIDANCE[selectedFutureTopic];
  const canAddTrustedPerson = trustedPeople.length < MAX_TRUSTED_PEOPLE;
  const selectedFolderAccessCategory = activeCategory === 'all' ? null : activeCategory;
  const trustedPeopleWithSelectedFolderAccess = selectedFolderAccessCategory
    ? trustedPeople.filter((person) => {
        const access = folderAccessByPersonId[person.id];
        return access?.allowed && access.folders.includes(selectedFolderAccessCategory);
      })
    : [];

  const openAddFlow = () => {
    setSelectedUploadCategory(activeCategory === 'all' ? 'claims' : activeCategory);
    setShowAddModal(true);
  };

  const openFutureUploadFlow = () => {
    setSelectedUploadCategory('future');
    setShowAddModal(true);
  };

  const openTrustedPersonTab = () => {
    setActiveTab('trusted');
  };

  const handleAddTrustedPerson = () => {
    if (!canAddTrustedPerson) {
      return;
    }
    setEditingTrustedPersonId(null);
    setTrustedPersonForm({
      fullName: '',
      relationship: '',
      email: '',
      phoneNumber: '',
    });
    setTrustedPersonErrors({});
    setShowTrustedPersonForm(true);
  };

  const handleEditTrustedPerson = (person: TrustedPerson) => {
    setEditingTrustedPersonId(person.id);
    setTrustedPersonForm({
      fullName: person.name,
      relationship: person.relation,
      email: person.email,
      phoneNumber: person.phoneNumber ?? '',
    });
    setTrustedPersonErrors({});
    setShowTrustedPersonForm(true);
  };

  const handleRemoveTrustedPerson = (person: TrustedPerson) => {
    Alert.alert(
      'Remove Access',
      `Are you sure you want to remove ${person.name}'s access?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setTrustedPeople((currentPeople) =>
              currentPeople.filter((currentPerson) => currentPerson.id !== person.id)
            );
            setFolderAccessByPersonId((currentAccess) => {
              const nextAccess = { ...currentAccess };
              delete nextAccess[person.id];
              return nextAccess;
            });
          },
        },
      ]
    );
  };

  const handleTrustedPersonFormChange = (field: keyof TrustedPersonFormValues, value: string) => {
    setTrustedPersonForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));

    setTrustedPersonErrors((currentErrors) => {
      if (!currentErrors[field]) {
        return currentErrors;
      }

      return {
        ...currentErrors,
        [field]: undefined,
      };
    });
  };

  const handleTrustedPersonAllowedChange = (personId: string, allowed: boolean) => {
    setFolderAccessByPersonId((currentAccess) => ({
      ...currentAccess,
      [personId]: {
        allowed,
        folders: currentAccess[personId]?.folders ?? [],
      },
    }));
  };

  const handleTrustedPersonFolderToggle = (personId: string, folderId: FolderAccessCategory) => {
    setFolderAccessByPersonId((currentAccess) => {
      const currentPersonAccess = currentAccess[personId] ?? { allowed: false, folders: [] };

      if (!currentPersonAccess.allowed) {
        return currentAccess;
      }

      const hasFolder = currentPersonAccess.folders.includes(folderId);
      const nextFolders = hasFolder
        ? currentPersonAccess.folders.filter((folder) => folder !== folderId)
        : [...currentPersonAccess.folders, folderId];

      return {
        ...currentAccess,
        [personId]: {
          ...currentPersonAccess,
          folders: nextFolders,
        },
      };
    });
  };

  const handleCancelTrustedPersonForm = () => {
    setShowTrustedPersonForm(false);
    setEditingTrustedPersonId(null);
    setTrustedPersonForm({
      fullName: '',
      relationship: '',
      email: '',
      phoneNumber: '',
    });
    setTrustedPersonErrors({});
  };

  const handleSaveTrustedPerson = () => {
    const isEditingTrustedPerson = editingTrustedPersonId !== null;

    if (!isEditingTrustedPerson && !canAddTrustedPerson) {
      Alert.alert('Trusted Person', 'You can add up to 3 trusted people.');
      return;
    }

    const trimmedFullName = trustedPersonForm.fullName.trim();
    const trimmedRelationship = trustedPersonForm.relationship.trim();
    const trimmedEmail = trustedPersonForm.email.trim();
    const trimmedPhoneNumber = trustedPersonForm.phoneNumber.trim();

    const nextErrors: Partial<Record<keyof TrustedPersonFormValues, string>> = {};

    if (!trimmedFullName) {
      nextErrors.fullName = 'Full Name is required.';
    }

    if (!trimmedRelationship) {
      nextErrors.relationship = 'Relationship is required.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setTrustedPersonErrors(nextErrors);
      return;
    }

    if (editingTrustedPersonId) {
      setTrustedPeople((currentPeople) =>
        currentPeople.map((currentPerson) =>
          currentPerson.id === editingTrustedPersonId
            ? {
                ...currentPerson,
                name: trimmedFullName,
                relation: trimmedRelationship,
                email: trimmedEmail,
                phoneNumber: trimmedPhoneNumber,
              }
            : currentPerson
        )
      );
    } else {
      setTrustedPeople((currentPeople) => [
        ...currentPeople,
        {
          id: `trusted-${Date.now()}`,
          name: trimmedFullName,
          relation: trimmedRelationship,
          email: trimmedEmail,
          phoneNumber: trimmedPhoneNumber,
          access: 'full',
          lastActive: 'Just added',
        },
      ]);
    }

    handleCancelTrustedPersonForm();
  };

  const loadDocuments = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setDocuments([]);
      return;
    }

    const { data, error } = await supabase
      .from('documents')
      .select('id, user_id, file_path, file_name, category, uploaded_at')
      .eq('user_id', user.id)
      .order('uploaded_at', { ascending: false });

    if (error || !data) {
      setDocuments([]);
      return;
    }

    const mappedDocuments = (data as SupabaseDocumentRow[]).map((doc) => {
        const category = getStoredCategoryForFilter(doc.category);
        const displayCategoryLabel = getCategoryDisplayLabel(doc.category);
        const futureTopicKey = getFutureTopicKeyForStoredCategory(doc.category);

        return {
          id: doc.id,
          name: doc.file_name,
          category,
          storedCategory: doc.category,
          displayCategoryLabel,
          futureTopicKey,
          status: 'uploaded' as const,
          date: formatUploadedDate(doc.uploaded_at),
          size: 'Stored in Vault',
          icon: getDocumentIcon(category),
          filePath: doc.file_path,
        };
      });
    setDocuments(mappedDocuments);
  };

  useEffect(() => {
    void loadDocuments();
  }, []);

  useEffect(() => {
    onDocumentCountChange?.(documents.length);
  }, [documents.length, onDocumentCountChange]);

  const handleOpenDocument = async (doc: VaultDocument) => {
    if (!doc.filePath) {
      Alert.alert('Preview unavailable', 'This file does not have a storage path yet.');
      return;
    }

    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(doc.filePath, 60);

    if (error || !data?.signedUrl) {
      Alert.alert('Could not open file', error?.message ?? 'Preview is not available right now.');
      return;
    }

    if (isImageFile(doc.name)) {
      setPreviewDoc(doc);
      setPreviewUrl(data.signedUrl);
      return;
    }

    if (isPdfFile(doc.name)) {
      const supported = await Linking.canOpenURL(data.signedUrl);
      if (!supported) {
        Alert.alert('Preview not supported', 'PDF preview is not available on this device in Expo Go yet.');
        return;
      }
      await Linking.openURL(data.signedUrl);
      return;
    }

    Alert.alert(
      'Preview not supported',
      'This file type does not have an in-app preview yet. PDFs can open in your device browser or viewer, and support for more file types is coming soon.'
    );
  };

  const uploadTestDocument = async (
    uri: string,
    fileName: string,
    category: Exclude<DocCategory, 'all'>,
    mimeType?: string | null
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showVaultStepError('upload auth', 'Please sign in again before uploading a file.');
      return;
    }

    setUploading(true);

    try {
      const cleanedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
      const filePath = `${user.id}/${Date.now()}-${cleanedFileName}`;

      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, arrayBuffer, {
          contentType: mimeType ?? 'application/octet-stream',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { error: insertError } = await supabase.from('documents').insert({
        user_id: user.id,
        file_path: filePath,
        file_name: fileName,
        category: category === 'future'
          ? getStoredCategoryForFutureUpload(selectedFutureTopic)
          : getStoredCategoryForUpload(category),
      });

      if (insertError) {
        await supabase.storage.from('documents').remove([filePath]);
        throw insertError;
      }

      await loadDocuments();
      Alert.alert('Upload complete', 'File added to your Vault.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not upload file.';
      showVaultStepError('upload', message);
    } finally {
      setUploading(false);
    }
  };

  const handleAddDocument = async (action: AddAction) => {
    if (isPicking) {
      return;
    }

    if (uploading) {
      return;
    }

    setIsPicking(true);
    setShowAddModal(false);

    try {
      await new Promise<void>((resolve) => {
        InteractionManager.runAfterInteractions(() => resolve());
      });
      await new Promise((resolve) => setTimeout(resolve, 800));

      if (action === 'camera') {
        showVaultStepError('camera upload', 'Take Photo is not available yet. Please use Upload File for now.');
        return;
      }

      if (action === 'scan') {
        showVaultStepError('document scan', 'Scan Document is not available yet. Please use Upload File for now.');
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        multiple: false,
        copyToCacheDirectory: true,
        type: '*/*',
      });

      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      await uploadTestDocument(
        asset.uri,
        asset.name ?? `test-file-${Date.now()}`,
        selectedUploadCategory,
        asset.mimeType ?? 'application/octet-stream'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not launch the selected add method.';
      showVaultStepError(action, message);
    } finally {
      setIsPicking(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.topBarTitle}>Document Vault</Text>
          <Text style={styles.topBarSub}>{documents.length} documents · Securely stored in your Vault</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAddFlow} disabled={uploading || isPicking}>
          <Text style={styles.addBtnText}>{uploading ? 'Uploading...' : '+ Add'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.securityBanner}>
        <Text style={styles.securityIcon}>🔒</Text>
        <Text style={styles.securityText}>Your documents are encrypted and securely stored in your Vault. Trusted person access controls are still being finalized.</Text>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, activeTab === 'files' && styles.tabActive]} onPress={() => setActiveTab('files')}>
          <Text style={[styles.tabText, activeTab === 'files' && styles.tabTextActive]}>📁 My Files</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'trusted' && styles.tabActive]} onPress={() => setActiveTab('trusted')}>
          <Text style={[styles.tabText, activeTab === 'trusted' && styles.tabTextActive]}>👤 Trusted Person</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'files' ? (
        <ScrollView
          style={styles.docList}
          contentContainerStyle={styles.filesScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.folderHeader}>
            <Text style={styles.folderHeaderEyebrow}>VAULT FOLDERS</Text>
            <Text style={styles.folderHeaderTitle}>Browse by folder</Text>
            <Text style={styles.folderHeaderSubtitle}>
              Select a folder to show only that document category.
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity key={cat.id} style={[styles.categoryPill, activeCategory === cat.id && styles.categoryPillActive]} onPress={() => setActiveCategory(cat.id)}>
                <Text style={styles.categoryPillIcon}>{cat.icon}</Text>
                <Text style={[styles.categoryPillText, activeCategory === cat.id && styles.categoryPillTextActive]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.folderSelectionBar}>
            <Text style={styles.folderSelectionText}>{activeFolderLabel}</Text>
            <Text style={styles.folderSelectionCount}>
              {filteredDocs.length} {filteredDocs.length === 1 ? 'file' : 'files'}
            </Text>
          </View>
          {selectedFolderAccessCategory ? (
            <View style={styles.folderAccessSummaryCard}>
              <Text style={styles.folderAccessSummaryTitle}>Who has access</Text>
              {trustedPeopleWithSelectedFolderAccess.length === 0 ? (
                <Text style={styles.folderAccessSummaryEmpty}>
                  No trusted person has access to this folder yet.
                </Text>
              ) : (
                <>
                  {trustedPeopleWithSelectedFolderAccess.map((person) => (
                    <Text key={person.id} style={styles.folderAccessSummaryName}>
                      {person.name}
                    </Text>
                  ))}
                  {selectedFolderAccessCategory === 'future' ? (
                    <Text style={styles.folderAccessSummaryHelper}>
                      Allowed people can access all current and future files in this folder.
                    </Text>
                  ) : null}
                </>
              )}
            </View>
          ) : null}
          {activeCategory === 'future' ? (
            <View style={styles.futureHelperCard}>
              <Text style={styles.futureHelperTitle}>Prepare for the Future</Text>
              <Text style={styles.futureHelperIntro}>
                Upload important records here so the Veteran or CoSponsor can keep them organized before they are needed.
              </Text>
              <View style={styles.futureHelperChipRow}>
                {(['DIC', 'Preparing a Will', 'Burial Preparation'] as FutureHelperTopic[]).map((topic) => {
                  const isSelected = selectedFutureTopic === topic;

                  return (
                    <TouchableOpacity
                      key={topic}
                      style={[styles.futureHelperChip, isSelected && styles.futureHelperChipActive]}
                      onPress={() => setSelectedFutureTopic(topic)}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.futureHelperChipText, isSelected && styles.futureHelperChipTextActive]}>
                        {topic}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={styles.futureHelperGuidanceCard}>
                <Text style={styles.futureHelperGuidanceTitle}>{selectedFutureGuidance.title}</Text>
                {selectedFutureGuidance.items.map((item) => (
                  <View key={item} style={styles.futureHelperGuidanceItem}>
                    <Text style={styles.futureHelperGuidanceBullet}>•</Text>
                    <Text style={styles.futureHelperGuidanceText}>{item}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                style={[
                  styles.futureHelperActionButton,
                  (uploading || isPicking) && styles.futureHelperActionButtonDisabled,
                ]}
                onPress={openFutureUploadFlow}
                activeOpacity={uploading || isPicking ? 1 : 0.85}
                disabled={uploading || isPicking}
              >
                <Text style={styles.futureHelperActionButtonText}>Upload to Prepare for the Future</Text>
              </TouchableOpacity>
              <View style={styles.futureHelperNoteBox}>
                <Text style={styles.futureHelperNoteText}>
                  Upload records here early so they are easier to find later.
                </Text>
              </View>
              <View style={styles.futureHelperFamilyPlanBox}>
                <Text style={styles.futureHelperFamilyPlanTitle}>Family access plan</Text>
                <Text style={styles.futureHelperFamilyPlanText}>
                  Set up trusted access early so an allowed person can access the whole Prepare for the Future folder, including the files already here and future uploads added later.
                </Text>
                <TouchableOpacity
                  style={styles.futureHelperFamilyPlanButton}
                  onPress={openTrustedPersonTab}
                  activeOpacity={0.85}
                >
                  <Text style={styles.futureHelperFamilyPlanButtonText}>Set up Trusted Person access</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
          <View style={styles.filesListContent}>
            {filteredDocs.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📂</Text>
                <Text style={styles.emptyTitle}>No files in {activeFolderLabel}</Text>
                <Text style={styles.emptySubtitle}>Choose another folder or tap "+ Add" to add your first document</Text>
              </View>
            ) : (
              filteredDocs.map((doc) => (
                <TouchableOpacity key={doc.id} style={styles.docCard} activeOpacity={0.85} onPress={() => void handleOpenDocument(doc)}>
                  <View style={styles.docCardLeft}>
                    <Text style={styles.docIcon}>{doc.icon}</Text>
                  </View>
                  <View style={styles.docCardCenter}>
                    <Text style={styles.docName} numberOfLines={1}>{doc.name}</Text>
                    <View style={styles.docCategoryRow}>
                      <View style={styles.docCategoryPill}>
                        <Text style={styles.docCategoryText}>{doc.displayCategoryLabel}</Text>
                      </View>
                      {activeCategory === 'future' ? (
                        <View style={styles.docFutureTopicPill}>
                          <Text style={styles.docFutureTopicText}>
                            {getFutureTopicLabelForStoredCategory(doc.storedCategory) ?? 'DIC'}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.docMeta}>
                      <Text style={styles.docMetaText}>{doc.date}</Text>
                      <Text style={styles.docMetaDot}>·</Text>
                      <Text style={styles.docMetaText}>{doc.size}</Text>
                    </View>
                    {doc.sharedWith && <Text style={styles.docSharedWith}>📤 Shared with {doc.sharedWith}</Text>}
                    <View style={[styles.docStatusPill, { backgroundColor: doc.status === 'uploaded' ? 'rgba(39,174,96,0.15)' : doc.status === 'pending' ? 'rgba(243,156,18,0.15)' : 'rgba(26,188,156,0.15)' }]}>
                      <Text style={[styles.docStatusText, { color: doc.status === 'uploaded' ? '#27AE60' : doc.status === 'pending' ? '#F39C12' : '#1ABC9C' }]}>{doc.status === 'uploaded' ? '✅ Uploaded' : doc.status === 'pending' ? '⏳ Pending' : '📤 Shared'}</Text>
                    </View>
                  </View>
                  <View style={styles.docCardActions}>
                    <TouchableOpacity style={styles.docActionBtn} onPress={() => { setSelectedDoc(doc); setShowShareModal(true); }}>
                      <Text style={styles.docActionIcon}>📤</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))
            )}
            <View style={{ height: 40 }} />
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={styles.docList} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
          <View style={styles.trustedListHeader}>
            <TouchableOpacity
              style={[styles.addTrustedBtn, !canAddTrustedPerson && styles.addTrustedBtnDisabled]}
              onPress={handleAddTrustedPerson}
              activeOpacity={canAddTrustedPerson ? 0.85 : 1}
              disabled={!canAddTrustedPerson}
            >
              <Text style={styles.addTrustedBtnText}>Add Trusted Person</Text>
            </TouchableOpacity>
            {!canAddTrustedPerson ? (
              <Text style={styles.trustedLimitNote}>You can add up to 3 trusted people.</Text>
            ) : null}
          </View>
          {showTrustedPersonForm ? (
            <View style={styles.trustedFormCard}>
              <Text style={styles.trustedFormTitle}>
                {editingTrustedPersonId ? 'Change Trusted Person' : 'Add a Trusted Person'}
              </Text>
              <Text style={styles.trustedFormIntro}>
                {editingTrustedPersonId
                  ? 'Update this trusted person in the local list. Existing folder access and preview settings will stay the same.'
                  : 'Add someone you trust to this local list. Sharing and saved access settings will come later.'}
              </Text>

              <View style={styles.trustedFormField}>
                <Text style={styles.trustedFormLabel}>Full Name</Text>
                <TextInput
                  value={trustedPersonForm.fullName}
                  onChangeText={(value) => handleTrustedPersonFormChange('fullName', value)}
                  placeholder="Enter full name"
                  placeholderTextColor="#607D8B"
                  style={[styles.trustedFormInput, trustedPersonErrors.fullName && styles.trustedFormInputError]}
                />
                {trustedPersonErrors.fullName ? (
                  <Text style={styles.trustedFormErrorText}>{trustedPersonErrors.fullName}</Text>
                ) : null}
              </View>

              <View style={styles.trustedFormField}>
                <Text style={styles.trustedFormLabel}>Relationship</Text>
                <TextInput
                  value={trustedPersonForm.relationship}
                  onChangeText={(value) => handleTrustedPersonFormChange('relationship', value)}
                  placeholder="Enter relationship"
                  placeholderTextColor="#607D8B"
                  style={[styles.trustedFormInput, trustedPersonErrors.relationship && styles.trustedFormInputError]}
                />
                {trustedPersonErrors.relationship ? (
                  <Text style={styles.trustedFormErrorText}>{trustedPersonErrors.relationship}</Text>
                ) : null}
              </View>

              <View style={styles.trustedFormField}>
                <Text style={styles.trustedFormLabel}>Email</Text>
                <TextInput
                  value={trustedPersonForm.email}
                  onChangeText={(value) => handleTrustedPersonFormChange('email', value)}
                  placeholder="Enter email address"
                  placeholderTextColor="#607D8B"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.trustedFormInput}
                />
              </View>

              <View style={styles.trustedFormField}>
                <Text style={styles.trustedFormLabel}>Phone Number</Text>
                <TextInput
                  value={trustedPersonForm.phoneNumber}
                  onChangeText={(value) => handleTrustedPersonFormChange('phoneNumber', value)}
                  placeholder="Enter phone number"
                  placeholderTextColor="#607D8B"
                  keyboardType="phone-pad"
                  style={styles.trustedFormInput}
                />
              </View>

              <View style={styles.trustedFormActions}>
                <TouchableOpacity style={styles.trustedFormPrimaryButton} onPress={handleSaveTrustedPerson}>
                  <Text style={styles.trustedFormPrimaryButtonText}>
                    {editingTrustedPersonId ? 'Update Trusted Person' : 'Save Trusted Person'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.trustedFormSecondaryButton} onPress={handleCancelTrustedPersonForm}>
                  <Text style={styles.trustedFormSecondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
          {trustedPeople.map((person) => (
            <View key={person.id} style={styles.trustedCard}>
              <View style={styles.trustedHeader}>
                <Text style={styles.trustedIconLarge}>👤</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.trustedName}>{person.name}</Text>
                  <Text style={styles.trustedRelation}>{person.relation}</Text>
                </View>
                <View style={styles.trustedActiveBadge}>
                  <View style={styles.trustedActiveDot} />
                  <Text style={styles.trustedActiveText}>Active</Text>
                </View>
              </View>
              <View style={styles.trustedDivider} />
              <View style={styles.trustedRow}><Text style={styles.trustedLabel}>Email</Text><Text style={styles.trustedValue}>{person.email || 'Not provided'}</Text></View>
              {person.phoneNumber ? (
                <View style={styles.trustedRow}><Text style={styles.trustedLabel}>Phone Number</Text><Text style={styles.trustedValue}>{person.phoneNumber}</Text></View>
              ) : null}
              {(() => {
                const personFolderAccess = folderAccessByPersonId[person.id] ?? { allowed: false, folders: [] };
                const accessPreview = getTrustedPersonAccessPreview(personFolderAccess);

                return (
                  <View style={styles.trustedAccessSection}>
                    <Text style={styles.trustedAccessSectionLabel}>Folder access</Text>
                    <View style={styles.trustedRow}>
                      <Text style={styles.trustedLabel}>Status</Text>
                      <Text style={[styles.trustedValue, personFolderAccess.allowed ? styles.trustedAllowedValue : styles.trustedNotAllowedValue]}>
                        {personFolderAccess.allowed ? 'Allowed' : 'Not Allowed'}
                      </Text>
                    </View>
                    <View style={styles.trustedAccessToggleRow}>
                      {[
                        { label: 'Allowed', value: true },
                        { label: 'Not Allowed', value: false },
                      ].map((option) => {
                        const isSelected = personFolderAccess.allowed === option.value;

                        return (
                          <TouchableOpacity
                            key={option.label}
                            style={[styles.trustedAccessToggle, isSelected && styles.trustedAccessToggleActive]}
                            onPress={() => handleTrustedPersonAllowedChange(person.id, option.value)}
                            activeOpacity={0.85}
                          >
                            <Text style={[styles.trustedAccessToggleText, isSelected && styles.trustedAccessToggleTextActive]}>
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    <View style={[styles.trustedFolderChecklist, !personFolderAccess.allowed && styles.trustedFolderChecklistDisabled]}>
                      {TRUSTED_FOLDER_ACCESS_OPTIONS.map((folder) => {
                        const isSelected = personFolderAccess.folders.includes(folder.id);

                        return (
                          <TouchableOpacity
                            key={folder.id}
                            style={[
                              styles.trustedFolderOption,
                              isSelected && personFolderAccess.allowed && styles.trustedFolderOptionSelected,
                              !personFolderAccess.allowed && styles.trustedFolderOptionDisabled,
                            ]}
                            onPress={() => handleTrustedPersonFolderToggle(person.id, folder.id)}
                            activeOpacity={personFolderAccess.allowed ? 0.85 : 1}
                            disabled={!personFolderAccess.allowed}
                          >
                            <View style={[
                              styles.trustedFolderCheckbox,
                              isSelected && personFolderAccess.allowed && styles.trustedFolderCheckboxSelected,
                              !personFolderAccess.allowed && styles.trustedFolderCheckboxDisabled,
                            ]}>
                              <Text style={[
                                styles.trustedFolderCheckboxText,
                                isSelected && personFolderAccess.allowed && styles.trustedFolderCheckboxTextSelected,
                              ]}>
                                {isSelected ? '✓' : ''}
                              </Text>
                            </View>
                            <View style={styles.trustedFolderOptionContent}>
                              <Text style={[
                                styles.trustedFolderOptionText,
                                !personFolderAccess.allowed && styles.trustedFolderOptionTextDisabled,
                              ]}>
                                {folder.label}
                              </Text>
                              {folder.id === 'future' ? (
                                <Text style={[
                                  styles.trustedFolderOptionNote,
                                  !personFolderAccess.allowed && styles.trustedFolderOptionNoteDisabled,
                                ]}>
                                  Gives access to all current and future files in this folder.
                                </Text>
                              ) : null}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    <View style={styles.trustedAccessPreviewSection}>
                      <Text style={styles.trustedAccessSectionLabel}>Access preview</Text>
                      {accessPreview.message ? (
                        <Text style={styles.trustedAccessPreviewText}>{accessPreview.message}</Text>
                      ) : (
                        <>
                          <Text style={styles.trustedAccessPreviewText}>This person can access:</Text>
                          <View style={styles.trustedAccessPreviewList}>
                            {accessPreview.folders.map((folderName) => (
                              <Text key={folderName} style={styles.trustedAccessPreviewItem}>
                                • {folderName}
                              </Text>
                            ))}
                          </View>
                          {accessPreview.includesFutureTopics ? (
                            <Text style={styles.trustedAccessPreviewHelper}>
                              This includes all current and future files in Prepare for the Future.
                            </Text>
                          ) : null}
                        </>
                      )}
                    </View>
                  </View>
                );
              })()}
              <View style={styles.trustedActions}>
                <TouchableOpacity
                  style={styles.trustedActionBtn}
                  onPress={() => handleEditTrustedPerson(person)}
                >
                  <Text style={styles.trustedActionText}>Change Person</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.trustedActionBtn, styles.trustedActionBtnDanger]}
                  onPress={() => handleRemoveTrustedPerson(person)}
                >
                  <Text style={[styles.trustedActionText, { color: '#E74C3C' }]}>Remove Access</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <Text style={styles.sectionLabel}>TRUSTED ACCESS PREVIEW</Text>
          <Text style={styles.sectionIntro}>
            The items below show the kinds of actions a trusted person may be able to use for folders you allow.
          </Text>
          {[
            { icon: '👁️', text: 'Open files inside folders you allow' },
            { icon: '📁', text: 'Find records by folder when access is allowed' },
            { icon: '📸', text: 'Take Photo support is planned' },
            { icon: '📄', text: 'Scan Document support is planned' },
            { icon: '📤', text: 'More trusted-person tools are still in progress' },
            { icon: '🗑️', text: 'Folder access can be updated or removed at any time' },
          ].map((item, i) => (
            <View key={i} style={styles.accessRow}>
              <Text style={styles.accessIcon}>{item.icon}</Text>
              <Text style={styles.accessText}>{item.text}</Text>
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      <AddDocumentModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        busy={uploading || isPicking}
        selectedCategory={selectedUploadCategory}
        onSelectCategory={setSelectedUploadCategory}
        onAdd={handleAddDocument}
      />
      <ShareModal visible={showShareModal} doc={selectedDoc} trustedPeople={trustedPeople} onClose={() => setShowShareModal(false)} />
      <Modal visible={!!previewUrl} transparent animationType="fade" onRequestClose={() => { setPreviewUrl(null); setPreviewDoc(null); }}>
        <View style={styles.previewOverlay}>
          <TouchableOpacity style={styles.previewClose} onPress={() => { setPreviewUrl(null); setPreviewDoc(null); }}>
            <Text style={styles.previewCloseText}>Close</Text>
          </TouchableOpacity>
          {previewUrl ? (
            <View style={styles.previewCard}>
              <Text style={styles.previewTitle} numberOfLines={1}>{previewDoc?.name ?? 'Image preview'}</Text>
              <Image source={{ uri: previewUrl }} style={styles.previewImage} resizeMode="contain" />
            </View>
          ) : null}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1628' },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 54 : 44, paddingBottom: 12, paddingHorizontal: 16, backgroundColor: '#0D1F3C', borderBottomWidth: 1, borderBottomColor: '#1E3A5F' },
  backBtn: { marginRight: 12, padding: 4 },
  backBtnText: { color: '#B0BEC5', fontSize: 24 },
  topBarTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  topBarSub: { color: '#B0BEC5', fontSize: 11, marginTop: 1 },
  addBtn: { backgroundColor: '#C9A84C', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: '#0A1628', fontWeight: '800', fontSize: 13 },
  securityBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(26,188,156,0.08)', borderBottomWidth: 1, borderBottomColor: 'rgba(26,188,156,0.2)', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  securityIcon: { fontSize: 16 },
  securityText: { color: '#1ABC9C', fontSize: 11, flex: 1, lineHeight: 16 },
  tabRow: { flexDirection: 'row', backgroundColor: '#0D1F3C', padding: 4, marginHorizontal: 16, marginVertical: 10, borderRadius: 10 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#1E3A5F' },
  tabText: { color: '#607D8B', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#FFFFFF' },
  folderHeader: { paddingHorizontal: 16, marginTop: 4, marginBottom: 10 },
  folderHeaderEyebrow: { color: '#607D8B', fontSize: 10, fontWeight: '800', letterSpacing: 1.4, marginBottom: 4 },
  folderHeaderTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginBottom: 2 },
  folderHeaderSubtitle: { color: '#8CA0B3', fontSize: 12, lineHeight: 18 },
  categoryScroll: { maxHeight: 52, marginBottom: 8 },
  categoryPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0D1F3C', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#1E3A5F', gap: 6 },
  categoryPillActive: { backgroundColor: 'rgba(201,168,76,0.15)', borderColor: '#C9A84C' },
  categoryPillIcon: { fontSize: 13 },
  categoryPillText: { color: '#607D8B', fontSize: 12, fontWeight: '600' },
  categoryPillTextActive: { color: '#C9A84C' },
  folderSelectionBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8 },
  folderSelectionText: { color: '#E2C56B', fontSize: 13, fontWeight: '700' },
  folderSelectionCount: { color: '#8CA0B3', fontSize: 12, fontWeight: '600' },
  futureHelperCard: { backgroundColor: '#0D1F3C', borderRadius: 12, borderWidth: 1, borderColor: '#1E3A5F', marginHorizontal: 16, marginBottom: 12, padding: 14 },
  futureHelperTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginBottom: 6 },
  futureHelperIntro: { color: '#8CA0B3', fontSize: 12, lineHeight: 18, marginBottom: 12 },
  futureHelperChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  futureHelperChip: { backgroundColor: '#112746', borderRadius: 999, borderWidth: 1, borderColor: '#1E3A5F', paddingHorizontal: 12, paddingVertical: 8 },
  futureHelperChipActive: { backgroundColor: 'rgba(201,168,76,0.14)', borderColor: '#C9A84C' },
  futureHelperChipText: { color: '#B0BEC5', fontSize: 12, fontWeight: '700' },
  futureHelperChipTextActive: { color: '#E2C56B' },
  futureHelperGuidanceCard: { backgroundColor: '#112746', borderRadius: 10, borderWidth: 1, borderColor: '#1E3A5F', paddingHorizontal: 12, paddingVertical: 12, marginBottom: 12 },
  futureHelperGuidanceTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', marginBottom: 8 },
  futureHelperGuidanceItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6, paddingRight: 8 },
  futureHelperGuidanceBullet: { color: '#E2C56B', fontSize: 12, lineHeight: 18, marginRight: 8 },
  futureHelperGuidanceText: { flex: 1, color: '#B0BEC5', fontSize: 12, lineHeight: 18 },
  futureHelperActionButton: { backgroundColor: '#1E3A5F', borderRadius: 10, borderWidth: 1, borderColor: '#C9A84C', paddingHorizontal: 14, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  futureHelperActionButtonDisabled: { opacity: 0.72 },
  futureHelperActionButtonText: { color: '#E2C56B', fontSize: 13, fontWeight: '700' },
  futureHelperNoteBox: { backgroundColor: 'rgba(26,188,156,0.08)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(26,188,156,0.22)', paddingHorizontal: 12, paddingVertical: 10 },
  futureHelperNoteText: { color: '#B0BEC5', fontSize: 12, lineHeight: 17 },
  futureHelperFamilyPlanBox: { backgroundColor: '#112746', borderRadius: 10, borderWidth: 1, borderColor: '#1E3A5F', paddingHorizontal: 12, paddingVertical: 12, marginTop: 12 },
  futureHelperFamilyPlanTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', marginBottom: 6 },
  futureHelperFamilyPlanText: { color: '#B0BEC5', fontSize: 12, lineHeight: 18, marginBottom: 12 },
  folderAccessSummaryCard: { backgroundColor: '#112746', borderRadius: 10, borderWidth: 1, borderColor: '#1E3A5F', paddingHorizontal: 16, paddingVertical: 12, marginHorizontal: 16, marginTop: 12 },
  folderAccessSummaryTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', marginBottom: 6 },
  folderAccessSummaryEmpty: { color: '#8CA0B3', fontSize: 12, lineHeight: 18 },
  folderAccessSummaryName: { color: '#B0BEC5', fontSize: 12, lineHeight: 18 },
  folderAccessSummaryHelper: { color: '#8CA0B3', fontSize: 11, lineHeight: 16, marginTop: 8 },
  futureHelperFamilyPlanButton: { backgroundColor: '#1E3A5F', borderRadius: 10, borderWidth: 1, borderColor: '#1ABC9C', paddingHorizontal: 14, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  futureHelperFamilyPlanButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  docList: { flex: 1 },
  filesScrollContent: { paddingBottom: 32 },
  filesListContent: { padding: 16 },
  docCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0D1F3C', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#1E3A5F' },
  docCardLeft: { width: 44, height: 44, backgroundColor: '#1E3A5F', borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  docIcon: { fontSize: 22 },
  docCardCenter: { flex: 1 },
  docName: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', marginBottom: 3 },
  docCategoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  docCategoryPill: { alignSelf: 'flex-start', backgroundColor: 'rgba(201,168,76,0.12)', borderRadius: 999, borderWidth: 1, borderColor: 'rgba(201,168,76,0.4)', paddingHorizontal: 9, paddingVertical: 3 },
  docCategoryText: { color: '#E2C56B', fontSize: 10, fontWeight: '700' },
  docFutureTopicPill: { alignSelf: 'flex-start', backgroundColor: '#112746', borderRadius: 999, borderWidth: 1, borderColor: '#1E3A5F', paddingHorizontal: 9, paddingVertical: 3 },
  docFutureTopicText: { color: '#B0BEC5', fontSize: 10, fontWeight: '700' },
  docMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  docMetaText: { color: '#607D8B', fontSize: 11 },
  docMetaDot: { color: '#607D8B', fontSize: 11 },
  docSharedWith: { color: '#1ABC9C', fontSize: 10, marginBottom: 4 },
  docStatusPill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  docStatusText: { fontSize: 10, fontWeight: '700' },
  docCardActions: { flexDirection: 'row', gap: 6, marginLeft: 8 },
  docActionBtn: { width: 34, height: 34, backgroundColor: '#1E3A5F', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  docActionIcon: { fontSize: 15 },
  previewOverlay: { flex: 1, backgroundColor: 'rgba(6,15,30,0.92)', paddingTop: Platform.OS === 'ios' ? 54 : 32, paddingHorizontal: 16, paddingBottom: 24 },
  previewClose: { alignSelf: 'flex-end', paddingVertical: 8, paddingHorizontal: 12, marginBottom: 8 },
  previewCloseText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  previewCard: { flex: 1, backgroundColor: '#0D1F3C', borderRadius: 16, borderWidth: 1, borderColor: '#1E3A5F', padding: 12 },
  previewTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', marginBottom: 12 },
  previewImage: { flex: 1, width: '100%' },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptySubtitle: { color: '#607D8B', fontSize: 13, textAlign: 'center' },
  trustedListHeader: { marginBottom: 14 },
  addTrustedBtn: { backgroundColor: '#1E3A5F', borderRadius: 10, borderWidth: 1, borderColor: '#1ABC9C', paddingHorizontal: 14, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  addTrustedBtnDisabled: { opacity: 0.55 },
  addTrustedBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  trustedLimitNote: { color: '#8CA0B3', fontSize: 12, lineHeight: 18, marginTop: 8 },
  trustedFormCard: { backgroundColor: '#0D1F3C', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#1E3A5F', marginBottom: 16 },
  trustedFormTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginBottom: 6 },
  trustedFormIntro: { color: '#8CA0B3', fontSize: 12, lineHeight: 18, marginBottom: 16 },
  trustedFormField: { marginBottom: 14 },
  trustedFormLabel: { color: '#B0BEC5', fontSize: 12, fontWeight: '700', marginBottom: 8 },
  trustedFormInput: { backgroundColor: '#112746', borderRadius: 10, borderWidth: 1, borderColor: '#1E3A5F', color: '#FFFFFF', fontSize: 13, paddingHorizontal: 12, paddingVertical: 12 },
  trustedFormInputError: { borderColor: '#E74C3C' },
  trustedFormErrorText: { color: '#FF8A80', fontSize: 11, marginTop: 6 },
  trustedFormActions: { gap: 10, marginTop: 4 },
  trustedFormPrimaryButton: { backgroundColor: '#1E3A5F', borderRadius: 10, borderWidth: 1, borderColor: '#1ABC9C', paddingHorizontal: 14, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  trustedFormPrimaryButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  trustedFormSecondaryButton: { backgroundColor: '#0D1F3C', borderRadius: 10, borderWidth: 1, borderColor: '#1E3A5F', paddingHorizontal: 14, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  trustedFormSecondaryButtonText: { color: '#B0BEC5', fontSize: 13, fontWeight: '700' },
  trustedCard: { backgroundColor: '#0D1F3C', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#1ABC9C', marginBottom: 20 },
  trustedHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  trustedIconLarge: { fontSize: 32 },
  trustedName: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  trustedRelation: { color: '#607D8B', fontSize: 12, marginTop: 2 },
  trustedActiveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(39,174,96,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  trustedActiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#27AE60' },
  trustedActiveText: { color: '#27AE60', fontSize: 11, fontWeight: '700' },
  trustedDivider: { height: 1, backgroundColor: '#1E3A5F', marginBottom: 14 },
  trustedRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  trustedLabel: { color: '#607D8B', fontSize: 13 },
  trustedValue: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  trustedAccessSection: { paddingVertical: 6 },
  trustedAccessSectionLabel: { color: '#607D8B', fontSize: 13, marginBottom: 8 },
  trustedAllowedValue: { color: '#1ABC9C' },
  trustedNotAllowedValue: { color: '#8CA0B3' },
  trustedAccessToggleRow: { flexDirection: 'row', gap: 8 },
  trustedAccessToggle: { flex: 1, backgroundColor: '#112746', borderRadius: 10, borderWidth: 1, borderColor: '#1E3A5F', paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  trustedAccessToggleActive: { backgroundColor: 'rgba(201,168,76,0.14)', borderColor: '#C9A84C' },
  trustedAccessToggleText: { color: '#B0BEC5', fontSize: 12, fontWeight: '700' },
  trustedAccessToggleTextActive: { color: '#E2C56B' },
  trustedFolderChecklist: { marginTop: 10, gap: 8 },
  trustedFolderChecklistDisabled: { opacity: 0.5 },
  trustedFolderOption: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#112746', borderRadius: 10, borderWidth: 1, borderColor: '#1E3A5F', paddingHorizontal: 12, paddingVertical: 10 },
  trustedFolderOptionSelected: { borderColor: '#C9A84C', backgroundColor: 'rgba(201,168,76,0.14)' },
  trustedFolderOptionDisabled: { backgroundColor: '#10213A' },
  trustedFolderCheckbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1, borderColor: '#607D8B', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0D1F3C' },
  trustedFolderCheckboxSelected: { borderColor: '#C9A84C', backgroundColor: '#C9A84C' },
  trustedFolderCheckboxDisabled: { borderColor: '#48607F', backgroundColor: '#0D1F3C' },
  trustedFolderCheckboxText: { color: 'transparent', fontSize: 12, fontWeight: '800' },
  trustedFolderCheckboxTextSelected: { color: '#0A1628' },
  trustedFolderOptionContent: { flex: 1 },
  trustedFolderOptionText: { color: '#B0BEC5', fontSize: 12, fontWeight: '700', flex: 1 },
  trustedFolderOptionTextDisabled: { color: '#607D8B' },
  trustedFolderOptionNote: { color: '#8CA0B3', fontSize: 11, lineHeight: 16, marginTop: 4 },
  trustedFolderOptionNoteDisabled: { color: '#607D8B' },
  trustedAccessPreviewSection: { marginTop: 12, backgroundColor: '#112746', borderRadius: 10, borderWidth: 1, borderColor: '#1E3A5F', paddingHorizontal: 12, paddingVertical: 10 },
  trustedAccessPreviewText: { color: '#B0BEC5', fontSize: 12, lineHeight: 18 },
  trustedAccessPreviewList: { marginTop: 6, gap: 4 },
  trustedAccessPreviewItem: { color: '#B0BEC5', fontSize: 12, lineHeight: 18 },
  trustedAccessPreviewHelper: { color: '#8CA0B3', fontSize: 11, lineHeight: 16, marginTop: 8 },
  sectionLabel: { color: '#607D8B', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 },
  accessRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#0D1F3C', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#1E3A5F' },
  accessIcon: { fontSize: 18 },
  accessText: { color: '#B0BEC5', fontSize: 13, flex: 1 },
  trustedActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  trustedActionBtn: { flex: 1, backgroundColor: '#0D1F3C', borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#1E3A5F' },
  trustedActionBtnDanger: { borderColor: '#E74C3C' },
  trustedActionText: { color: '#B0BEC5', fontWeight: '700', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#0D1F3C', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 16, paddingHorizontal: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 20, maxHeight: '85%' },
  modalHandle: { width: 36, height: 4, backgroundColor: '#1E3A5F', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalScroll: { flexGrow: 0 },
  modalScrollContent: { paddingBottom: 8 },
  modalTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginBottom: 4 },
  modalSubtitle: { color: '#607D8B', fontSize: 13, marginBottom: 16 },
  shareModalNoteBox: { backgroundColor: 'rgba(26,188,156,0.08)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(26,188,156,0.22)', paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  shareModalNoteText: { color: '#B0BEC5', fontSize: 12, lineHeight: 17 },
  uploadCategorySection: { marginBottom: 16 },
  uploadCategoryLabel: { color: '#8CA0B3', fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginBottom: 10, textTransform: 'uppercase' },
  uploadCategoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  uploadCategoryChip: { backgroundColor: '#112746', borderRadius: 999, borderWidth: 1, borderColor: '#1E3A5F', paddingHorizontal: 12, paddingVertical: 8 },
  uploadCategoryChipActive: { backgroundColor: 'rgba(201,168,76,0.14)', borderColor: '#C9A84C' },
  uploadCategoryChipText: { color: '#B0BEC5', fontSize: 12, fontWeight: '700' },
  uploadCategoryChipTextActive: { color: '#E2C56B' },
  addOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E3A5F', borderRadius: 12, padding: 14, marginBottom: 10, gap: 12 },
  addOptionDisabled: { opacity: 0.72 },
  addOptionIcon: { fontSize: 26 },
  addOptionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 2 },
  addOptionTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', marginBottom: 2 },
  addOptionSubtitle: { color: '#607D8B', fontSize: 12, lineHeight: 17 },
  addOptionBadge: { backgroundColor: 'rgba(201,168,76,0.14)', borderWidth: 1, borderColor: 'rgba(201,168,76,0.45)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  addOptionBadgeText: { color: '#E2C56B', fontSize: 10, fontWeight: '700' },
  addOptionArrow: { color: '#607D8B', fontSize: 22, fontWeight: '700' },
  addOptionArrowDisabled: { color: '#48607F' },
  modalBackBtn: { paddingVertical: 10, alignItems: 'center' },
  modalBackText: { color: '#C9A84C', fontSize: 14, fontWeight: '700' },
  modalCancelBtn: { padding: 14, alignItems: 'center', marginTop: 4 },
  modalCancelText: { color: '#607D8B', fontSize: 15, fontWeight: '600' },
  sectionIntro: { color: '#8CA0B3', fontSize: 12, lineHeight: 18, marginBottom: 12 },
});

export default DocumentVault;
