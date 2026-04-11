import React, { useState } from 'react';
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

interface EducationBenefitsProps {
  onBack: () => void;
  onApply: (benefit: ActiveTab) => void;
  hasDraft?: boolean;
}

type ActiveTab = 'ch33' | 'ch30' | 'vre';

// ─── Content ──────────────────────────────────────────────────────────────────

const CH33 = {
  label: 'Post-9/11 GI Bill',
  chapter: 'Chapter 33',
  tagline: 'The most generous education benefit available to post-9/11 veterans.',
  sections: [
    {
      heading: 'What it pays for',
      body: 'Tuition and fees (paid directly to your school), a monthly housing allowance based on where your school is located, and up to $1,000 per year for books and supplies. If you attend a public in-state school, tuition is covered 100%.',
    },
    {
      heading: 'Who qualifies',
      body: 'You need at least 90 days of active duty service after September 10, 2001, or at least 30 days if you were discharged due to a service-connected disability. Your benefit percentage (40%–100%) is based on how long you served — 36 months gets you 100%.',
    },
    {
      heading: 'How long it lasts',
      body: 'Up to 36 months of education benefits — enough for a standard 4-year degree when combined with Advanced Standing or transfer credits. You have 15 years from your last discharge date to use it.',
    },
    {
      heading: 'How to apply',
      body: 'Apply at VA.gov or call 1-888-GIBILL-1. Processing takes 4–6 weeks. Apply before your semester starts — your housing allowance does not begin until the VA processes your enrollment certification.',
    },
    {
      heading: 'One thing most veterans miss',
      body: 'The Yellow Ribbon Program. If you attend a private school or pay out-of-state tuition, Yellow Ribbon can cover the gap — but only if your school participates and you are at 100% benefit level. Check the VA\'s Yellow Ribbon school list before enrolling.',
    },
  ],
};

const CH30 = {
  label: 'Montgomery GI Bill',
  chapter: 'Chapter 30',
  tagline: 'An older benefit — still useful, but Post-9/11 GI Bill is usually better.',
  sections: [
    {
      heading: 'What it pays for',
      body: 'A flat monthly stipend paid directly to you — not to your school. As of 2024, that is roughly $2,122/month for full-time enrollment. You pay your tuition yourself out of that. It does not cover housing separately.',
    },
    {
      heading: 'Who qualifies',
      body: 'You must have served at least 2 years of active duty and contributed $1,200 to the Montgomery GI Bill fund while on active duty. Most veterans who enlisted before 2009 were automatically enrolled and had $100/month deducted from their pay for 12 months.',
    },
    {
      heading: 'When it makes sense over Post-9/11',
      body: 'If you attend an online-only school, the Post-9/11 housing allowance drops to half the national average — around $1,000/month. Chapter 30\'s flat rate can sometimes be higher for online students. Run the numbers for your situation.',
    },
    {
      heading: 'How long it lasts',
      body: 'Up to 36 months. You have 10 years from your discharge date to use it — shorter than Post-9/11\'s 15-year window.',
    },
    {
      heading: 'How to apply',
      body: 'Apply at VA.gov using VA Form 22-1990. You cannot use both Chapter 33 and Chapter 30 at the same time — you must elect one. Switching is possible but takes time, so choose carefully before enrolling.',
    },
  ],
};

const VRE = {
  label: 'VR&E',
  chapter: 'Chapter 31',
  tagline: 'Career training and rehab for veterans with a service-connected disability.',
  sections: [
    {
      heading: 'What it is',
      body: 'Vocational Rehabilitation and Employment helps veterans with service-connected disabilities prepare for, find, and keep suitable employment. It can cover school, job training, certifications, tools, and even independent living support.',
    },
    {
      heading: 'Who qualifies',
      body: 'You need a service-connected disability rating from the VA. There is no minimum percentage required — even a 0% rating can qualify you if the VA determines you have an employment handicap. You also need an honorable or general discharge.',
    },
    {
      heading: 'What it covers',
      body: 'Tuition and fees, books, supplies, and a monthly subsistence allowance while you are in training. The subsistence allowance is often higher than the Post-9/11 housing allowance. It can also pay for adaptive equipment, resume help, and job placement services.',
    },
    {
      heading: 'The employment handicap test',
      body: 'A VR&E counselor evaluates whether your disability makes it harder for you to prepare for, obtain, or maintain suitable employment. If yes, you are entitled to a full rehabilitation plan — which may include college, vocational training, or self-employment support.',
    },
    {
      heading: 'How to apply',
      body: 'Apply at VA.gov using VA Form 28-1900 or through your eBenefits account. You will be assigned a VR&E counselor. Be specific about how your disability affects your ability to work — this directly shapes what your plan covers.',
    },
    {
      heading: 'VR&E and GI Bill together',
      body: 'You cannot use Chapter 33 and Chapter 31 at the same time for the same program. However, VR&E is often the better choice when you qualify — its subsistence allowance is higher and it covers more types of training. Talk to your counselor before electing a benefit.',
    },
  ],
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const InfoSection: React.FC<{ heading: string; body: string }> = ({ heading, body }) => (
  <View style={styles.infoSection}>
    <Text style={styles.infoHeading}>{heading}</Text>
    <Text style={styles.infoBody}>{body}</Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function EducationBenefits({ onBack, onApply, hasDraft = false }: EducationBenefitsProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('ch33');

  const content = activeTab === 'ch33' ? CH33 : activeTab === 'ch30' ? CH30 : VRE;

  return (
    <View style={styles.container}>

      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Education Benefits</Text>
        <View style={styles.topBarSpacer} />
      </View>

      {/* ── Tab Row ── */}
      <View style={styles.tabRow}>
        {(['ch33', 'ch30', 'vre'] as ActiveTab[]).map((tab) => {
          const labels: Record<ActiveTab, string> = {
            ch33: 'Post-9/11',
            ch30: 'Montgomery',
            vre: 'VR&E',
          };
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {labels[tab]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Content ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        <View style={styles.heroCard}>
          <View style={styles.chapterBadge}>
            <Text style={styles.chapterBadgeText}>{content.chapter}</Text>
          </View>
          <Text style={styles.heroLabel}>{content.label}</Text>
          <Text style={styles.heroTagline}>{content.tagline}</Text>
        </View>

        {/* Info sections */}
        {content.sections.map((s, i) => (
          <InfoSection key={i} heading={s.heading} body={s.body} />
        ))}

        {/* Apply Now */}
        <TouchableOpacity style={styles.applyBtn} onPress={() => onApply(activeTab)} activeOpacity={0.85}>
          <Text style={styles.applyBtnText}>{hasDraft ? 'Continue Application →' : 'Apply Now →'}</Text>
        </TouchableOpacity>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            Benefit rates and eligibility rules change. Always verify current details at VA.gov or call 1-888-GIBILL-1 before making enrollment decisions.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
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
    minWidth: 90,
  },
  backBtnText: {
    color: Colors.gold,
    fontSize: 14,
    fontWeight: '600',
  },
  topBarTitle: {
    flex: 1,
    color: Colors.white,
    fontSize: 17,
    fontWeight: '800',
    fontFamily: Font.display,
    textAlign: 'center',
  },
  topBarSpacer: {
    minWidth: 90,
  },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.navyMid,
    borderBottomWidth: 1,
    borderBottomColor: Colors.navyLight,
    padding: 6,
    gap: 6,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Radius.sm,
  },
  tabActive: {
    backgroundColor: Colors.gold,
  },
  tabText: {
    color: Colors.gray500,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  tabTextActive: {
    color: Colors.navy,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    padding: Spacing.md,
  },

  // Hero card
  heroCard: {
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.navyLight,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  chapterBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.navyLight,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  chapterBadgeText: {
    color: Colors.gold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroLabel: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '900',
    fontFamily: Font.display,
    marginBottom: 6,
  },
  heroTagline: {
    color: Colors.gray300,
    fontSize: 13,
    lineHeight: 19,
  },

  // Info sections
  infoSection: {
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.navyLight,
    padding: Spacing.md,
    marginBottom: 10,
  },
  infoHeading: {
    color: Colors.gold,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  infoBody: {
    color: Colors.gray300,
    fontSize: 14,
    lineHeight: 21,
  },

  // Apply button
  applyBtn: {
    backgroundColor: Colors.gold,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  applyBtnText: {
    color: Colors.navy,
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Font.display,
  },

  // Disclaimer
  disclaimer: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  disclaimerText: {
    color: Colors.gray700,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
  },
});
