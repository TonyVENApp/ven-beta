import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
  Linking,
} from 'react-native';
import { Colors, Spacing, Radius, Shadow, Font } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────

interface Claim {
  id: string;
  condition: string;
  status: 'In Progress' | 'Pending Review' | 'Decision Ready' | 'Action Required';
  rating?: number;
  daysOpen: number;
  progressPct: number;
}

interface BenefitAlert {
  id: string;
  title: string;
  description: string;
  type: 'state' | 'federal' | 'deadline';
  value?: string;
}

interface DashboardProps {
  veteran?: {
    name: string;
    branch: string;
    state: string;
    currentRating: number;
    potentialRating: number;
    effectiveDate: string;
  };
  dashboardMode?: 'below_100' | 'one_hundred_scheduler' | 'one_hundred_pt' | 'tdiu_unemployable';
  onStartClaim?: () => void;
  onOpenVault?: () => void;
  onOpenWalkthrough?: () => void;
  onOpenCPPrep?: () => void;
  onOpenNexus?: () => void;
  onOpenCalculator?: () => void;
  onOpenProfile?: () => void;
  onOpenDependents?: () => void;
  onOpenEducation?: () => void;
  onOpenStateBenefits?: () => void;
  onOpenVeteranNews?: () => void;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_VETERAN = {
  name: 'SGT Marcus Webb',
  branch: 'Army',
  state: 'Texas',
  currentRating: 70,
  potentialRating: 90,
  effectiveDate: 'Mar 12, 2024',
};

const MOCK_CLAIMS: Claim[] = [
  {
    id: '1',
    condition: 'PTSD (Primary)',
    status: 'In Progress',
    rating: 50,
    daysOpen: 47,
    progressPct: 65,
  },
  {
    id: '2',
    condition: 'Sleep Apnea (Secondary)',
    status: 'Action Required',
    daysOpen: 12,
    progressPct: 30,
  },
  {
    id: '3',
    condition: 'Lumbar Strain',
    status: 'Pending Review',
    rating: 20,
    daysOpen: 89,
    progressPct: 85,
  },
];

const MOCK_ALERTS: BenefitAlert[] = [
  {
    id: '1',
    title: 'Hazelwood Act — TX',
    description: '150 credit hours of tuition exemption available to you and your children.',
    type: 'state',
    value: '$18,400 est. value',
  },
  {
    id: '2',
    title: 'Property Tax Exemption',
    description: 'At 70%+ rating, Texas exempts up to $12,000 of your home\'s assessed value.',
    type: 'state',
    value: '$1,200/yr saved',
  },
  {
    id: '3',
    title: 'ITF Reminder',
    description: 'Your Intent to File for Sleep Apnea expires in 8 days. File now to protect your effective date.',
    type: 'deadline',
    value: '8 days left',
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function getDashboardDisplayName(name?: string) {
  const trimmedName = name?.trim();

  if (!trimmedName) {
    return MOCK_VETERAN.name;
  }

  const looksLikeEmailPrefixFallback =
    !trimmedName.includes(' ') && /[._-]/.test(trimmedName);

  if (!looksLikeEmailPrefixFallback) {
    return trimmedName;
  }

  const humanizedName = trimmedName
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');

  return humanizedName || trimmedName;
}

const BranchBadge: React.FC<{ branch: string }> = ({ branch }) => {
  const branchColors: Record<string, string> = {
    Army: '#4A7C59',
    Navy: '#1B3A5C',
    'Air Force': '#4A90D9',
    Marines: '#8B1A1A',
    'Coast Guard': '#E67E22',
    'Space Force': '#2C3E50',
    'National Guard': '#6B7A3A',
  };
  return (
    <View style={[styles.branchBadge, { backgroundColor: branchColors[branch] || Colors.navyLight }]}>
      <Text style={styles.branchBadgeText}>{branch.toUpperCase()}</Text>
    </View>
  );
};

const RatingRing: React.FC<{
  current: number;
  potential: number;
  onLearnMore?: () => void;
  hidePotential?: boolean;
}> = ({ current, potential, onLearnMore, hidePotential }) => {
  const animVal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animVal, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, []);

  const ringSize = 140;
  const stroke = 10;

  return (
    <View style={styles.ratingRingContainer}>
      <View style={[styles.ratingRingOuter, { width: ringSize, height: ringSize }]}>
        {/* Outer potential ring (dim) */}
        <View style={styles.ratingRingBg} />
        {/* Inner content */}
        <View style={styles.ratingRingInner}>
          <Text style={styles.ratingNumber}>{current}<Text style={styles.ratingPct}>%</Text></Text>
          <Text style={styles.ratingLabel}>COMBINED</Text>
          <Text style={styles.ratingLabel}>RATING</Text>
        </View>
      </View>
      <View style={styles.ratingMeta}>
        <View style={styles.ratingMetaRow}>
          <View style={[styles.ratingDot, { backgroundColor: Colors.gold }]} />
          <Text style={styles.ratingMetaText}>Current: <Text style={styles.ratingMetaBold}>{current}%</Text></Text>
        </View>
        {!hidePotential && (
          <View style={styles.ratingMetaRow}>
            <View style={[styles.ratingDot, { backgroundColor: Colors.teal }]} />
            <Text style={styles.ratingMetaText}>Potential: <Text style={[styles.ratingMetaBold, { color: Colors.teal }]}>{potential}%</Text></Text>
          </View>
        )}
        <TouchableOpacity style={styles.mathLink} onPress={onLearnMore}>
          <Text style={styles.mathLinkText}>How is this calculated? →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ClaimCard: React.FC<{ claim: Claim; onPress?: () => void }> = ({ claim, onPress }) => {
  const statusConfig: Record<string, { color: string; bg: string; icon: string }> = {
    'In Progress': { color: Colors.gold, bg: 'rgba(201,168,76,0.15)', icon: '⏳' },
    'Pending Review': { color: Colors.gray300, bg: 'rgba(176,190,197,0.15)', icon: '🔍' },
    'Decision Ready': { color: Colors.success, bg: 'rgba(39,174,96,0.15)', icon: '✅' },
    'Action Required': { color: Colors.crimsonLight, bg: 'rgba(231,76,60,0.15)', icon: '⚠️' },
  };
  const cfg = statusConfig[claim.status];

  return (
    <TouchableOpacity style={styles.claimCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.claimCardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.claimCondition}>{claim.condition}</Text>
          <Text style={styles.claimDays}>{claim.daysOpen} days open</Text>
        </View>
        {claim.rating !== undefined && (
          <View style={styles.claimRatingBadge}>
            <Text style={styles.claimRatingText}>{claim.rating}%</Text>
          </View>
        )}
      </View>
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${claim.progressPct}%` }]} />
      </View>
      <View style={styles.claimCardFooter}>
        <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
          <Text style={{ fontSize: 10, marginRight: 4 }}>{cfg.icon}</Text>
          <Text style={[styles.statusPillText, { color: cfg.color }]}>{claim.status}</Text>
        </View>
        <Text style={styles.claimProgressPct}>{claim.progressPct}% complete</Text>
      </View>
    </TouchableOpacity>
  );
};

const AlertCard: React.FC<{ alert: BenefitAlert }> = ({ alert }) => {
  const typeConfig: Record<string, { color: string; icon: string; label: string }> = {
    state: { color: Colors.teal, icon: '🏛️', label: 'STATE BENEFIT' },
    federal: { color: Colors.gold, icon: '🦅', label: 'FEDERAL BENEFIT' },
    deadline: { color: Colors.crimsonLight, icon: '🚨', label: 'ACTION REQUIRED' },
  };
  const cfg = typeConfig[alert.type];

  return (
    <View style={[styles.alertCard, alert.type === 'deadline' && styles.alertCardUrgent]}>
      <View style={styles.alertHeader}>
        <Text style={{ fontSize: 16 }}>{cfg.icon}</Text>
        <Text style={[styles.alertTypeLabel, { color: cfg.color }]}>{cfg.label}</Text>
        {alert.value && (
          <View style={[styles.alertValueBadge, { borderColor: cfg.color }]}>
            <Text style={[styles.alertValueText, { color: cfg.color }]}>{alert.value}</Text>
          </View>
        )}
      </View>
      <Text style={styles.alertTitle}>{alert.title}</Text>
      <Text style={styles.alertDescription}>{alert.description}</Text>
    </View>
  );
};

const QuickActionButton: React.FC<{
  icon: string;
  label: string;
  sublabel?: string;
  onPress?: () => void;
  highlight?: boolean;
}> = ({ icon, label, sublabel, onPress, highlight }) => (
  <TouchableOpacity
    style={[styles.quickAction, highlight && styles.quickActionHighlight]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Text style={styles.quickActionIcon}>{icon}</Text>
    <Text style={[styles.quickActionLabel, highlight && { color: Colors.navy }]}>{label}</Text>
    {sublabel && <Text style={[styles.quickActionSublabel, highlight && { color: Colors.navyMid }]}>{sublabel}</Text>}
  </TouchableOpacity>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export const VeteranDashboard: React.FC<DashboardProps> = ({
  veteran = MOCK_VETERAN,
  dashboardMode,
  onStartClaim,
  onOpenVault,
  onOpenWalkthrough,
  onOpenCPPrep,
  onOpenNexus,
  onOpenCalculator,
  onOpenProfile,
  onOpenDependents,
  onOpenEducation,
  onOpenStateBenefits,
  onOpenVeteranNews,
}) => {
  const [activeTab, setActiveTab] = useState<'claims' | 'benefits'>('claims');
  const scrollY = useRef(new Animated.Value(0)).current;
  const displayName = getDashboardDisplayName(veteran.name);
  const isOneHundredPt = dashboardMode === 'one_hundred_pt';

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy} />

      {/* ── Fixed Top Bar ── */}
      <View style={styles.topBar}>
        <View style={styles.topBarIdentity}>
          <Text style={styles.topBarGreeting}>Welcome back,</Text>
          <Text style={styles.topBarName} numberOfLines={1}>{displayName}</Text>
        </View>
        <View style={styles.topBarRight}>
          <BranchBadge branch={veteran.branch} />
          <TouchableOpacity style={styles.profileButton} onPress={onOpenProfile} activeOpacity={0.8}>
            <Text style={styles.profileButtonText}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.notifButton}>
            <Text style={{ fontSize: 20 }}>🔔</Text>
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
{/* ── Hero Card ── */}
<Animated.View style={[styles.heroCard, { opacity: headerOpacity }]}> 
  {isOneHundredPt ? (
    <View style={styles.ptHeroContent}>
      <View style={styles.ptHeroTopRow}>
        <View style={styles.ptHeroRatingBlock}>
          <Text style={styles.ptHeroRatingValue}>
            {veteran.currentRating}
            <Text style={styles.ptHeroRatingPct}>%</Text>
          </Text>
          <Text style={styles.ptHeroRatingCaption}>Combined Rating</Text>
        </View>
        <View style={styles.ptHeroStatusBadge}>
          <Text style={styles.ptHeroStatusText}>Permanent &amp; Total</Text>
        </View>
      </View>
      <View style={styles.ptHeroMetaRow}>
        <Text style={styles.ptHeroMetaLabel}>Region</Text>
        <Text style={styles.ptHeroMetaValue}>{veteran.state}</Text>
      </View>
    </View>
  ) : (
    <>
      <View style={styles.heroCardInner}>
        <RatingRing
          current={veteran.currentRating}
          potential={veteran.potentialRating}
          onLearnMore={onOpenCalculator}
          hidePotential={isOneHundredPt}
        />
      </View>
      <View style={styles.heroMeta}>
        <View style={styles.heroMetaItem}>
          <Text style={styles.heroMetaValue}>{veteran.state}</Text>
          <Text style={styles.heroMetaLabel}>Region</Text>
        </View>
        <View style={styles.heroMetaDivider} />
        <View style={styles.heroMetaItem}>
          <Text style={styles.heroMetaValue}>{veteran.effectiveDate}</Text>
          <Text style={styles.heroMetaLabel}>Effective Date</Text>
        </View>
        <View style={styles.heroMetaDivider} />
        <View style={styles.heroMetaItem}>
          <Text style={[styles.heroMetaValue, { color: Colors.teal }]}>+{veteran.potentialRating - veteran.currentRating}%</Text>
          <Text style={styles.heroMetaLabel}>Potential Gain</Text>
        </View>
      </View>
    </>
  )}
</Animated.View>

        {!isOneHundredPt && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
            <View style={styles.quickActionsGrid}>
              {!isOneHundredPt && (
                <QuickActionButton
                  icon="🗺️"
                  label="File a Claim"
                  sublabel="Start walkthrough"
                  onPress={onOpenWalkthrough}
                  highlight
                />
              )}
              <QuickActionButton icon="🗄️" label="Document Vault" sublabel="23 files" onPress={onOpenVault} />
              {!isOneHundredPt && (
                <QuickActionButton icon="📋" label="C&P Prep" sublabel="Exam in 14 days" onPress={onOpenCPPrep} />
              )}
              {!isOneHundredPt && (
                <QuickActionButton icon="🔗" label="Nexus Navigator" sublabel="2 conditions" onPress={onOpenNexus} />
              )}
              <QuickActionButton icon="🎓" label="Education Benefits" sublabel="GI Bill + VR&E" onPress={onOpenEducation} />
              <QuickActionButton icon="👨‍👩‍👧" label="Dependents & Family" sublabel="Chapter 35 + CHAMPVA" onPress={onOpenDependents} />
            </View>
          </View>
        )}

        {isOneHundredPt ? (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.veteranNewsBanner}
              onPress={onOpenVeteranNews}
              activeOpacity={0.9}
            >
              <View style={styles.veteranNewsBannerBadge}>
                <Text style={styles.veteranNewsBannerBadgeText}>NEW</Text>
              </View>
              <Text style={styles.veteranNewsBannerTitle}>Veteran News</Text>
              <Text style={styles.veteranNewsBannerSubtext}>
                News, updates, and our newsletter for Veterans and families
              </Text>
              <Text style={styles.veteranNewsBannerAction}>Open →</Text>
            </TouchableOpacity>
            <Text style={styles.sectionTitle}>KEY AREAS</Text>
            <View style={styles.quickActionsGrid}>
              <QuickActionButton icon="🗄️" label="Document Vault" sublabel="23 files" onPress={onOpenVault} />
              <QuickActionButton icon="👨‍👩‍👧" label="Dependents & Family" sublabel="Chapter 35 + CHAMPVA" onPress={onOpenDependents} />
              <QuickActionButton icon="🎓" label="Education Benefits" sublabel="GI Bill + VR&E" onPress={onOpenEducation} />
              <QuickActionButton icon="🏛️" label="State Benefits" sublabel="What your state offers" onPress={onOpenStateBenefits} />
              <QuickActionButton icon="👤" label="Profile" sublabel="Manage account" onPress={onOpenProfile} />
            </View>
          </View>
        ) : (
          <>
            {/* ── Potential Alert Banner ── */}
            <TouchableOpacity style={styles.potentialBanner} onPress={onOpenWalkthrough} activeOpacity={0.9}>
              <View style={styles.potentialBannerLeft}>
                <Text style={styles.potentialBannerIcon}>⚡</Text>
                <View>
                  <Text style={styles.potentialBannerTitle}>You may be leaving benefits on the table</Text>
                  <Text style={styles.potentialBannerSub}>2 unrated secondary conditions identified</Text>
                </View>
              </View>
              <Text style={styles.potentialBannerArrow}>→</Text>
            </TouchableOpacity>

            {/* ── Claims / Benefits Tab ── */}
            <View style={styles.section}>
              <View style={styles.tabRow}>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'claims' && styles.tabActive]}
                  onPress={() => setActiveTab('claims')}
                >
                  <Text style={[styles.tabText, activeTab === 'claims' && styles.tabTextActive]}>
                    Active Claims ({MOCK_CLAIMS.length})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'benefits' && styles.tabActive]}
                  onPress={() => setActiveTab('benefits')}
                >
                  <Text style={[styles.tabText, activeTab === 'benefits' && styles.tabTextActive]}>
                    Benefits ({MOCK_ALERTS.length})
                  </Text>
                </TouchableOpacity>
              </View>

              {activeTab === 'claims' && (
                <View>
                  {MOCK_CLAIMS.map(claim => (
                    <ClaimCard key={claim.id} claim={claim} />
                  ))}
                  <TouchableOpacity style={styles.newClaimButton} onPress={onOpenWalkthrough}>
                    <Text style={styles.newClaimButtonText}>+ Start New Claim Walkthrough</Text>
                  </TouchableOpacity>
                </View>
              )}

              {activeTab === 'benefits' && (
                <View>
                  {MOCK_ALERTS.map(alert => (
                    <AlertCard key={alert.id} alert={alert} />
                  ))}
                </View>
              )}
            </View>
          </>
        )}

        {!isOneHundredPt && (
          <>
            {/* ── ITF Banner ── */}
            <View style={styles.itfBanner}>
              <Text style={styles.itfBannerIcon}>🛡️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.itfBannerTitle}>Intent to File is ACTIVE</Text>
                <Text style={styles.itfBannerSub}>Your effective date is protected through May 18, 2025</Text>
              </View>
              <View style={styles.itfStatusDot} />
            </View>
          </>
        )}

        {/* ── Co-Sponsor Row ── */}
        <View style={styles.cosponsorRow}>
          <View style={styles.cosponsorInfo}>
            <Text style={styles.cosponsorLabel}>CO-SPONSOR</Text>
            <Text style={styles.cosponsorName}>Sarah Webb (Spouse) · View Only</Text>
          </View>
          <TouchableOpacity style={styles.cosponsorManage}>
            <Text style={styles.cosponsorManageText}>Manage</Text>
          </TouchableOpacity>
        </View>

        {/* ── Beta Feedback ── */}
        <View style={styles.feedbackSection}>
          <TouchableOpacity
            style={styles.feedbackButton}
            activeOpacity={0.85}
            onPress={() => Linking.openURL('https://forms.gle/oCVzwTsmEWDEUUuM8')}
          >
            <Text style={styles.feedbackButtonText}>📝 Give Beta Feedback</Text>
            <Text style={styles.feedbackButtonSub}>Help us build a better app for veterans</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? 54 : 40,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.navy,
    borderBottomWidth: 1,
    borderBottomColor: Colors.navyLight,
  },
  topBarIdentity: {
    flex: 1,
    minWidth: 0,
    marginRight: Spacing.sm,
  },
  topBarGreeting: {
    color: Colors.gray300,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  topBarName: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Font.display,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 8,
  },
  branchBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  branchBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  profileButton: {
    minWidth: 64,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  profileButtonText: {
    color: Colors.gold,
    fontSize: 12,
    fontWeight: '800',
  },
  notifButton: {
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.crimsonLight,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Hero Card
  heroCard: {
    margin: Spacing.md,
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.navyLight,
    ...Shadow.card,
  },
  heroCardInner: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
ptHeroContent: {
  gap: Spacing.lg,
},
ptHeroTopRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: Spacing.md,
},
ptHeroRatingBlock: {
  flex: 1,
},
ptHeroRatingValue: {
  color: Colors.gold,
  fontSize: 52,
  fontWeight: '900',
  fontFamily: Font.display,
  lineHeight: 56,
},
ptHeroRatingPct: {
  fontSize: 24,
},
ptHeroRatingCaption: {
  color: Colors.gray300,
  fontSize: 12,
  fontWeight: '700',
  letterSpacing: 1,
  textTransform: 'uppercase',
  marginTop: 6,
},
ptHeroStatusBadge: {
  borderWidth: 1,
  borderColor: Colors.gold,
  borderRadius: Radius.sm,
  paddingHorizontal: 12,
  paddingVertical: 8,
  backgroundColor: 'rgba(201,168,76,0.12)',
},
ptHeroStatusText: {
  color: Colors.white,
  fontSize: 12,
  fontWeight: '800',
  letterSpacing: 0.4,
},
ptHeroMetaRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderTopWidth: 1,
  borderTopColor: Colors.navyLight,
  paddingTop: Spacing.md,
},
ptHeroMetaValue: {
  color: Colors.white,
  fontSize: 15,
  fontWeight: '700',
},
ptHeroMetaLabel: {
  color: Colors.gray500,
  fontSize: 11,
  fontWeight: '700',
  letterSpacing: 0.5,
  textTransform: 'uppercase',
},
  ratingRingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  ratingRingOuter: {
    borderRadius: 70,
    borderWidth: 8,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.glow,
  },
  ratingRingBg: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 74,
    borderWidth: 2,
    borderColor: Colors.teal,
    opacity: 0.3,
  },
  ratingRingInner: {
    alignItems: 'center',
  },
  ratingNumber: {
    color: Colors.gold,
    fontSize: 40,
    fontWeight: '900',
    fontFamily: Font.display,
    lineHeight: 44,
  },
  ratingPct: {
    fontSize: 20,
  },
  ratingLabel: {
    color: Colors.gray300,
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: '700',
  },
  ratingMeta: {
    flex: 1,
  },
  ratingMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  ratingMetaText: {
    color: Colors.gray300,
    fontSize: 13,
  },
  ratingMetaBold: {
    color: Colors.white,
    fontWeight: '700',
  },
  mathLink: {
    marginTop: 8,
  },
  mathLinkText: {
    color: Colors.gold,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  heroMeta: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: Colors.navyLight,
    paddingTop: Spacing.md,
  },
  heroMetaItem: {
    alignItems: 'center',
    flex: 1,
  },
  heroMetaValue: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  heroMetaLabel: {
    color: Colors.gray500,
    fontSize: 10,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  heroMetaDivider: {
    width: 1,
    backgroundColor: Colors.navyLight,
  },

  // Section
  section: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    color: Colors.gray500,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: Spacing.sm,
  },

  // Quick Actions
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickAction: {
    width: (SCREEN_WIDTH - Spacing.md * 2 - 10) / 2,
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.navyLight,
    alignItems: 'flex-start',
  },
  quickActionHighlight: {
    backgroundColor: Colors.gold,
    borderColor: Colors.goldBright,
    ...Shadow.glow,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  quickActionLabel: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  quickActionSublabel: {
    color: Colors.gray500,
    fontSize: 11,
    marginTop: 2,
  },

  // Potential Banner
  potentialBanner: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: 'rgba(26, 188, 156, 0.12)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.teal,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  potentialBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  potentialBannerIcon: {
    fontSize: 22,
  },
  potentialBannerTitle: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  potentialBannerSub: {
    color: Colors.teal,
    fontSize: 11,
    marginTop: 2,
  },
  potentialBannerArrow: {
    color: Colors.teal,
    fontSize: 20,
    fontWeight: '700',
  },
  veteranNewsBanner: {
    marginBottom: Spacing.md,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.goldBright,
    backgroundColor: 'rgba(201,168,76,0.16)',
    ...Shadow.glow,
  },
  veteranNewsBannerBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.teal,
    marginBottom: Spacing.sm,
  },
  veteranNewsBannerBadgeText: {
    color: Colors.navy,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  veteranNewsBannerTitle: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '800',
    fontFamily: Font.display,
  },
  veteranNewsBannerSubtext: {
    color: Colors.offWhite,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
  veteranNewsBannerAction: {
    color: Colors.goldBright,
    fontSize: 13,
    fontWeight: '800',
    marginTop: Spacing.sm,
  },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.md,
    padding: 4,
    marginBottom: Spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Radius.sm,
  },
  tabActive: {
    backgroundColor: Colors.navyLight,
  },
  tabText: {
    color: Colors.gray500,
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.white,
  },

  // Claim Cards
  claimCard: {
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.navyLight,
  },
  claimCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  claimCondition: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  claimDays: {
    color: Colors.gray500,
    fontSize: 11,
    marginTop: 2,
  },
  claimRatingBadge: {
    backgroundColor: Colors.navyLight,
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  claimRatingText: {
    color: Colors.gold,
    fontWeight: '800',
    fontSize: 14,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: Colors.navyLight,
    borderRadius: 2,
    marginBottom: 10,
  },
  progressBarFill: {
    height: 4,
    backgroundColor: Colors.gold,
    borderRadius: 2,
  },
  claimCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  claimProgressPct: {
    color: Colors.gray500,
    fontSize: 11,
  },
  newClaimButton: {
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderStyle: 'dashed',
    marginTop: 4,
  },
  newClaimButtonText: {
    color: Colors.gold,
    fontSize: 14,
    fontWeight: '700',
  },

  // Alert Cards
  alertCard: {
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.navyLight,
  },
  alertCardUrgent: {
    borderColor: Colors.crimsonLight,
    backgroundColor: 'rgba(192, 57, 43, 0.08)',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  alertTypeLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    flex: 1,
  },
  alertValueBadge: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  alertValueText: {
    fontSize: 11,
    fontWeight: '700',
  },
  alertTitle: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  alertDescription: {
    color: Colors.gray300,
    fontSize: 12,
    lineHeight: 18,
  },

  // ITF Banner
  itfBanner: {
    marginHorizontal: Spacing.md,
    marginBottom: 10,
    backgroundColor: 'rgba(39,174,96,0.1)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.success,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itfBannerIcon: {
    fontSize: 20,
  },
  itfBannerTitle: {
    color: Colors.success,
    fontSize: 13,
    fontWeight: '700',
  },
  itfBannerSub: {
    color: Colors.gray300,
    fontSize: 11,
    marginTop: 2,
  },
  itfStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
  },

  // Co-Sponsor
  cosponsorRow: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.navyLight,
  },
  cosponsorInfo: {
    flex: 1,
  },
  cosponsorLabel: {
    color: Colors.gray500,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  cosponsorName: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  cosponsorManage: {
    borderWidth: 1,
    borderColor: Colors.navyLight,
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cosponsorManageText: {
    color: Colors.gray300,
    fontSize: 12,
    fontWeight: '600',
  },

  // Beta Feedback
  feedbackSection: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  feedbackButton: {
    backgroundColor: Colors.gold,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  feedbackButtonText: {
    color: Colors.navy,
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Font.display,
  },
  feedbackButtonSub: {
    color: Colors.navyMid,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
});

export default VeteranDashboard;
