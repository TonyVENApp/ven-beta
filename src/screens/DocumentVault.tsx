import React, { useState } from 'react';
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
} from 'react-native';
import { Colors, Spacing, Radius, Shadow, Font } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type DocCategory = 'all' | 'claims' | 'medical' | 'military' | 'education' | 'housing';
type DocStatus = 'uploaded' | 'pending' | 'shared';

interface VaultDocument {
  id: string;
  name: string;
  category: DocCategory;
  status: DocStatus;
  date: string;
  size: string;
  icon: string;
  sharedWith?: string;
}

interface TrustedPerson {
  name: string;
  relation: string;
  email: string;
  access: 'full';
  lastActive: string;
}

interface DocumentVaultProps {
  onBack?: () => void;
}

const MOCK_DOCUMENTS: VaultDocument[] = [
  { id: '1', name: 'DD-214 (Certificate of Release)', category: 'military', status: 'uploaded', date: 'Mar 10, 2026', size: '2.4 MB', icon: '🎖️' },
  { id: '2', name: 'VA Medical Records — 2024', category: 'medical', status: 'uploaded', date: 'Mar 8, 2026', size: '5.1 MB', icon: '🏥' },
  { id: '3', name: 'PTSD Nexus Letter — Dr. Rivera', category: 'claims', status: 'uploaded', date: 'Mar 5, 2026', size: '1.2 MB', icon: '📋', sharedWith: 'VSO - James Carter' },
  { id: '4', name: 'C&P Exam Results', category: 'claims', status: 'pending', date: 'Mar 1, 2026', size: '800 KB', icon: '📄' },
  { id: '5', name: 'Service Treatment Records', category: 'military', status: 'uploaded', date: 'Feb 28, 2026', size: '12.3 MB', icon: '📁' },
  { id: '6', name: 'VA Decision Letter', category: 'claims', status: 'shared', date: 'Feb 20, 2026', size: '1.8 MB', icon: '⚖️', sharedWith: 'Maria Webb (Spouse)' },
];

const MOCK_TRUSTED: TrustedPerson = {
  name: 'Maria Webb',
  relation: 'Spouse',
  email: 'maria.webb@email.com',
  access: 'full',
  lastActive: 'Today, 8:14 AM',
};

const CATEGORIES: { id: DocCategory; label: string; icon: string }[] = [
  { id: 'all', label: 'All Files', icon: '📂' },
  { id: 'claims', label: 'Claims', icon: '📋' },
  { id: 'medical', label: 'Medical', icon: '🏥' },
  { id: 'military', label: 'Military', icon: '🎖️' },
  { id: 'education', label: 'Education', icon: '🎓' },
  { id: 'housing', label: 'Housing', icon: '🏠' },
];

const AddDocumentModal: React.FC<{ visible: boolean; onClose: () => void; onAdd: (doc: VaultDocument) => void }> = ({ visible, onClose, onAdd }) => {
  const options = [
    { icon: '📸', title: 'Take a Photo', subtitle: 'Point your camera at any document and capture it instantly', action: 'camera' },
    { icon: '📁', title: 'Upload From Phone', subtitle: 'Select any PDF, image, or file already saved on your phone', action: 'upload' },
    { icon: '📄', title: 'Scan Multiple Pages', subtitle: 'Scan a multi-page document one page at a time into one file', action: 'scan' },
  ];

  const handleOption = (action: string) => {
    Alert.alert(
      action === 'camera' ? '📸 Camera' : action === 'upload' ? '📁 Upload' : '📄 Scanner',
      'In the full version this opens your ' + (action === 'camera' ? 'camera to capture the document.' : action === 'upload' ? 'phone storage to select a file.' : 'scanner to capture multiple pages.') + '\n\nFor beta testing, a sample document will be added to your vault.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Add Sample Doc', onPress: () => {
          onAdd({ id: Date.now().toString(), name: action === 'camera' ? 'Photo Capture — ' + new Date().toLocaleDateString() : action === 'upload' ? 'Uploaded Document — ' + new Date().toLocaleDateString() : 'Scanned Document — ' + new Date().toLocaleDateString(), category: 'claims', status: 'uploaded', date: 'Today', size: '1.0 MB', icon: action === 'camera' ? '📸' : '📁' });
          onClose();
        }},
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Add Document</Text>
          <Text style={styles.modalSubtitle}>Every document is stored securely on your device.</Text>
          {options.map((opt) => (
            <TouchableOpacity key={opt.action} style={styles.addOption} onPress={() => handleOption(opt.action)} activeOpacity={0.85}>
              <Text style={styles.addOptionIcon}>{opt.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.addOptionTitle}>{opt.title}</Text>
                <Text style={styles.addOptionSubtitle}>{opt.subtitle}</Text>
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

const ShareModal: React.FC<{ visible: boolean; doc: VaultDocument | null; trustedPerson: TrustedPerson; onClose: () => void }> = ({ visible, doc, trustedPerson, onClose }) => {
  if (!doc) return null;
  const shareOptions = [
    { icon: '👤', label: trustedPerson.name, sublabel: trustedPerson.relation + ' — Full Access' },
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

export const DocumentVault: React.FC<DocumentVaultProps> = ({ onBack }) => {
  const [activeCategory, setActiveCategory] = useState<DocCategory>('all');
  const [documents, setDocuments] = useState<VaultDocument[]>(MOCK_DOCUMENTS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<VaultDocument | null>(null);
  const [activeTab, setActiveTab] = useState<'files' | 'trusted'>('files');

  const filteredDocs = activeCategory === 'all' ? documents : documents.filter((d) => d.category === activeCategory);

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.topBarTitle}>Document Vault</Text>
          <Text style={styles.topBarSub}>{documents.length} documents · Secured on device</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.securityBanner}>
        <Text style={styles.securityIcon}>🔒</Text>
        <Text style={styles.securityText}>All documents are encrypted and stored only on your device. Only you and your trusted person can access them.</Text>
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
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity key={cat.id} style={[styles.categoryPill, activeCategory === cat.id && styles.categoryPillActive]} onPress={() => setActiveCategory(cat.id)}>
                <Text style={styles.categoryPillIcon}>{cat.icon}</Text>
                <Text style={[styles.categoryPillText, activeCategory === cat.id && styles.categoryPillTextActive]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <ScrollView style={styles.docList} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
            {filteredDocs.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📂</Text>
                <Text style={styles.emptyTitle}>No documents yet</Text>
                <Text style={styles.emptySubtitle}>Tap "+ Add" to upload your first document</Text>
              </View>
            ) : (
              filteredDocs.map((doc) => (
                <View key={doc.id} style={styles.docCard}>
                  <View style={styles.docCardLeft}>
                    <Text style={styles.docIcon}>{doc.icon}</Text>
                  </View>
                  <View style={styles.docCardCenter}>
                    <Text style={styles.docName} numberOfLines={1}>{doc.name}</Text>
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
                    <TouchableOpacity style={styles.docActionBtn} onPress={() => Alert.alert('Delete Document', 'Are you sure you want to delete "' + doc.name + '"?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => setDocuments(prev => prev.filter(d => d.id !== doc.id)) }])}>
                      <Text style={styles.docActionIcon}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        </>
      ) : (
        <ScrollView style={styles.docList} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
          <View style={styles.trustedCard}>
            <View style={styles.trustedHeader}>
              <Text style={styles.trustedIconLarge}>👤</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.trustedName}>{MOCK_TRUSTED.name}</Text>
                <Text style={styles.trustedRelation}>{MOCK_TRUSTED.relation}</Text>
              </View>
              <View style={styles.trustedActiveBadge}>
                <View style={styles.trustedActiveDot} />
                <Text style={styles.trustedActiveText}>Active</Text>
              </View>
            </View>
            <View style={styles.trustedDivider} />
            <View style={styles.trustedRow}><Text style={styles.trustedLabel}>Email</Text><Text style={styles.trustedValue}>{MOCK_TRUSTED.email}</Text></View>
            <View style={styles.trustedRow}><Text style={styles.trustedLabel}>Access Level</Text><Text style={[styles.trustedValue, { color: '#1ABC9C' }]}>🔓 Full Access</Text></View>
            <View style={styles.trustedRow}><Text style={styles.trustedLabel}>Last Active</Text><Text style={styles.trustedValue}>{MOCK_TRUSTED.lastActive}</Text></View>
          </View>
          <Text style={styles.sectionLabel}>WHAT FULL ACCESS ALLOWS</Text>
          {[
            { icon: '👁️', text: 'View all documents in your vault' },
            { icon: '📸', text: 'Take photos and upload documents on your behalf' },
            { icon: '📁', text: 'Upload files from their phone to your vault' },
            { icon: '📤', text: 'Send your documents to your VSO, doctor, or lawyer' },
            { icon: '🗑️', text: 'Delete documents from your vault' },
          ].map((item, i) => (
            <View key={i} style={styles.accessRow}>
              <Text style={styles.accessIcon}>{item.icon}</Text>
              <Text style={styles.accessText}>{item.text}</Text>
            </View>
          ))}
          <View style={styles.trustedActions}>
            <TouchableOpacity style={styles.trustedActionBtn} onPress={() => Alert.alert('Change Trusted Person', 'In the full version you can change your trusted person at any time.')}>
              <Text style={styles.trustedActionText}>Change Person</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.trustedActionBtn, styles.trustedActionBtnDanger]} onPress={() => Alert.alert('Remove Access', 'Are you sure you want to remove ' + MOCK_TRUSTED.name + "'s access?", [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive' }])}>
              <Text style={[styles.trustedActionText, { color: '#E74C3C' }]}>Remove Access</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      <AddDocumentModal visible={showAddModal} onClose={() => setShowAddModal(false)} onAdd={(doc) => setDocuments(prev => [doc, ...prev])} />
      <ShareModal visible={showShareModal} doc={selectedDoc} trustedPerson={MOCK_TRUSTED} onClose={() => setShowShareModal(false)} />
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
  categoryScroll: { maxHeight: 48, marginBottom: 4 },
  categoryPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0D1F3C', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#1E3A5F', gap: 4 },
  categoryPillActive: { backgroundColor: 'rgba(201,168,76,0.15)', borderColor: '#C9A84C' },
  categoryPillIcon: { fontSize: 13 },
  categoryPillText: { color: '#607D8B', fontSize: 12, fontWeight: '600' },
  categoryPillTextActive: { color: '#C9A84C' },
  docList: { flex: 1 },
  docCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0D1F3C', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#1E3A5F' },
  docCardLeft: { width: 44, height: 44, backgroundColor: '#1E3A5F', borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  docIcon: { fontSize: 22 },
  docCardCenter: { flex: 1 },
  docName: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', marginBottom: 3 },
  docMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  docMetaText: { color: '#607D8B', fontSize: 11 },
  docMetaDot: { color: '#607D8B', fontSize: 11 },
  docSharedWith: { color: '#1ABC9C', fontSize: 10, marginBottom: 4 },
  docStatusPill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  docStatusText: { fontSize: 10, fontWeight: '700' },
  docCardActions: { flexDirection: 'row', gap: 6, marginLeft: 8 },
  docActionBtn: { width: 34, height: 34, backgroundColor: '#1E3A5F', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  docActionIcon: { fontSize: 15 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptySubtitle: { color: '#607D8B', fontSize: 13, textAlign: 'center' },
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
  sectionLabel: { color: '#607D8B', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 },
  accessRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#0D1F3C', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#1E3A5F' },
  accessIcon: { fontSize: 18 },
  accessText: { color: '#B0BEC5', fontSize: 13, flex: 1 },
  trustedActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  trustedActionBtn: { flex: 1, backgroundColor: '#0D1F3C', borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#1E3A5F' },
  trustedActionBtnDanger: { borderColor: '#E74C3C' },
  trustedActionText: { color: '#B0BEC5', fontWeight: '700', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#0D1F3C', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 20 },
  modalHandle: { width: 36, height: 4, backgroundColor: '#1E3A5F', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginBottom: 4 },
  modalSubtitle: { color: '#607D8B', fontSize: 13, marginBottom: 16 },
  addOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E3A5F', borderRadius: 12, padding: 14, marginBottom: 10, gap: 12 },
  addOptionIcon: { fontSize: 26 },
  addOptionTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', marginBottom: 2 },
  addOptionSubtitle: { color: '#607D8B', fontSize: 12, lineHeight: 17 },
  addOptionArrow: { color: '#607D8B', fontSize: 22, fontWeight: '700' },
  modalCancelBtn: { padding: 14, alignItems: 'center', marginTop: 4 },
  modalCancelText: { color: '#607D8B', fontSize: 15, fontWeight: '600' },
});

export default DocumentVault;
