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

interface CPExamPrepProps {
  onBack?: () => void;
  daysUntilExam?: number;
}

type ActiveTab = 'overview' | 'conditions' | 'practice';
type Condition = 'ptsd' | 'back' | 'tinnitus' | 'sleep';

// ─── Data ─────────────────────────────────────────────────────────────────────

const EXAM_STEPS = [
  {
    number: '1',
    title: 'Check In',
    body: 'Arrive 15 minutes early. Bring your appointment letter and a photo ID. You do NOT need to bring your medical records — the examiner already has them.',
  },
  {
    number: '2',
    title: 'The Examiner Introduces Themselves',
    body: 'This is usually a doctor, nurse practitioner, or physician assistant contracted by the VA. They are NOT a VA employee deciding your claim — they only write an opinion.',
  },
  {
    number: '3',
    title: 'They Review Your History',
    body: 'They will ask about your service, your condition, and how it affects your daily life. This is your chance to paint a clear picture. Do not downplay anything.',
  },
  {
    number: '4',
    title: 'Physical Examination',
    body: 'For physical conditions, they will examine range of motion, strength, and pain. Do NOT perform at your best. Show how you are on a bad day — not how you are right now in a clinical setting.',
  },
  {
    number: '5',
    title: 'They Write the Nexus Opinion',
    body: 'After the exam, they write a DBQ (Disability Benefits Questionnaire). This document is critical — it directly influences your rating. You can request a copy.',
  },
];

const URGENT_TIPS = [
  { icon: '📋', tip: 'Write down all your symptoms TODAY — don\'t wait until exam day.' },
  { icon: '📅', tip: 'Track your bad days in a journal. Dates and specific events matter.' },
  { icon: '👥', tip: 'Ask a buddy, spouse, or family member to write a buddy statement about how they\'ve seen your condition affect you.' },
  { icon: '🚫', tip: 'Do NOT go to the exam alone if you can help it. Bring a VSO or trusted person.' },
  { icon: '🔄', tip: 'Practice describing your worst day — not your average day, not your best day.' },
];

const HOW_TO_ANSWER = [
  {
    rule: 'Describe your WORST day, not your best.',
    detail: 'The VA rater reads the DBQ and rates you. If you say "I manage okay most days," that\'s what gets written down. Describe the days you can\'t function.',
  },
  {
    rule: 'Never say "I\'m fine" or "It\'s not that bad."',
    detail: 'Veterans are trained to push through. That training will hurt your claim. Be honest about how bad it gets.',
  },
  {
    rule: 'Use the phrase: "at least as likely as not."',
    detail: 'This is the legal standard the VA uses for service connection. If an examiner asks if your condition is related to your service, say: "I believe my condition is at least as likely as not caused by my military service." This phrase carries legal weight.',
  },
  {
    rule: 'Mention every symptom — even the embarrassing ones.',
    detail: 'Incontinence, sexual dysfunction, nightmares, rage episodes, panic attacks. If you don\'t say it, the examiner can\'t document it. What\'s not documented doesn\'t exist.',
  },
  {
    rule: 'Connect your condition to a specific in-service event.',
    detail: 'The examiner needs to see a line from your military service to your current condition. Know your nexus: what happened in service, and how it connects to today.',
  },
];

const COMMON_MISTAKES = [
  {
    icon: '❌',
    mistake: 'Acting stoic and minimizing symptoms',
    fix: 'You trained to push through pain. The exam is not the time. Be specific and honest about impact on daily life.',
  },
  {
    icon: '❌',
    mistake: 'Not mentioning secondary conditions',
    fix: 'If your PTSD causes insomnia, say so. If your back pain causes depression, say so. Secondary conditions can be rated separately.',
  },
  {
    icon: '❌',
    mistake: 'Only talking about physical symptoms',
    fix: 'Mental health impact, relationship problems, lost jobs, and inability to do daily tasks all affect your rating. Say it all.',
  },
  {
    icon: '❌',
    mistake: 'Forgetting to mention frequency',
    fix: 'Don\'t just say "I have nightmares." Say "I have nightmares 4-5 nights per week and wake up drenched in sweat, unable to go back to sleep."',
  },
  {
    icon: '❌',
    mistake: 'Leaving before asking about the DBQ',
    fix: 'You are entitled to request a copy of the DBQ the examiner completes. Ask for it. If it doesn\'t reflect what you said, you can dispute it.',
  },
];

const CONDITIONS: Record<Condition, {
  label: string;
  icon: string;
  keyPoints: string[];
  watchOut: string[];
  keyPhrase: string;
}> = {
  ptsd: {
    label: 'PTSD',
    icon: '🧠',
    keyPoints: [
      'Describe your triggers specifically — sounds, smells, crowds, certain situations.',
      'Mention hypervigilance: always scanning a room, sitting with your back to the wall, avoiding public places.',
      'Nightmares and sleep disruption are heavily weighted. Give specifics — frequency, content if you can, how long you\'re awake after.',
      'Talk about avoidance: things you no longer do that you used to do before service.',
      'Relationships: isolation, anger episodes, estrangement from family. This matters.',
      'Occupational impact: jobs lost, conflicts at work, inability to maintain employment.',
    ],
    watchOut: [
      'Don\'t say you manage well with therapy — say how bad it gets without it and even with it.',
      'Don\'t minimize flashbacks as "just memories." Describe the physical response: heart racing, sweating, tunnel vision.',
    ],
    keyPhrase: '"On my worst days, I cannot leave the house / I cannot be around people / I relive the event as if it is happening again right now."',
  },
  back: {
    label: 'Back Pain',
    icon: '🦴',
    keyPoints: [
      'Range of motion is tested — move only as far as you can without sharp pain. Do NOT push through to demonstrate toughness.',
      'Describe what activities you can no longer do: bending, lifting, standing for more than 10 minutes, sitting for long periods.',
      'Mention flare-ups: how often, how long they last, what brings them on, what incapacitates you.',
      'Radiculopathy matters: if pain, numbness, or tingling radiates down your leg, say so clearly.',
      'Mention secondary conditions: if back pain causes depression, sleep loss, or limited mobility, connect those dots.',
    ],
    watchOut: [
      'Don\'t demonstrate your best range of motion. The examiner measures what you show them.',
      'Don\'t say you manage with ibuprofen and rest. Say it disrupts your sleep, your work, and your daily life.',
    ],
    keyPhrase: '"My back limits my ability to [sit, stand, walk, lift] for more than [X minutes]. On bad days I cannot [activity]."',
  },
  tinnitus: {
    label: 'Tinnitus',
    icon: '👂',
    keyPoints: [
      'Tinnitus is usually rated at 10% — but that 10% matters and it stacks.',
      'Describe the sound: constant ringing, buzzing, or hissing. Constant is rated higher than intermittent.',
      'Mention the impact on sleep, concentration, and mental health.',
      'If it causes anxiety or irritability, say so — that\'s a secondary condition pathway.',
      'Bilateral tinnitus (both ears) versus unilateral (one ear) — know which applies to you.',
    ],
    watchOut: [
      'Don\'t just say "I have ringing in my ears." Say "The ringing is constant, I hear it 24 hours a day, it disrupts my sleep and I struggle to concentrate."',
      'Don\'t forget to connect it to noise exposure in service: weapons fire, aircraft, machinery, explosions.',
    ],
    keyPhrase: '"The tinnitus is constant — I hear it right now, in this room. It has been this way since [event/time period in service]."',
  },
  sleep: {
    label: 'Sleep Apnea',
    icon: '😴',
    keyPoints: [
      'Sleep apnea rated at 50% with CPAP requirement — one of the highest-value secondary conditions.',
      'Most sleep apnea claims are filed as secondary to PTSD or obesity secondary to a service-connected condition.',
      'If you use a CPAP, bring it to the exam or mention it explicitly. CPAP use = 50% rating.',
      'Describe daytime symptoms: fatigue, inability to concentrate, falling asleep at work or while driving.',
      'If you have a sleep study, the examiner will have it. Know your AHI (apnea-hypopnea index) score.',
      'Connect to service: PTSD disrupts sleep architecture. Traumatic brain injury can cause sleep apnea. Weight gain in service secondary to injury is a valid nexus.',
    ],
    watchOut: [
      'Don\'t say you sleep fine with the CPAP — say how bad it is without it, and how the CPAP doesn\'t fix daytime fatigue completely.',
      'If you don\'t have a sleep study yet, request one through VA healthcare before your exam.',
    ],
    keyPhrase: '"My sleep apnea is at least as likely as not related to my service-connected PTSD, which disrupts my sleep and breathing patterns."',
  },
};

const MOCK_QA: {
  question: string;
  badAnswer: string;
  goodAnswer: string;
  why: string;
}[] = [
  {
    question: '"How would you describe your pain level on a scale of 1 to 10?"',
    badAnswer: '"About a 4 or 5 most days. I push through it."',
    goodAnswer: '"On an average day it\'s a 5 or 6. On a bad day — which I have at least once or twice a week — it\'s an 8 or 9. On those days I cannot [specific activity]."',
    why: 'Always anchor your answer to your worst days. Give frequency. Give a specific functional impact.',
  },
  {
    question: '"How is your sleep?"',
    badAnswer: '"Not great, but I manage."',
    goodAnswer: '"I have significant sleep disruption. I wake up 3–4 times a night, I have nightmares [X] nights per week, and I wake up exhausted. I have not slept through the night without incident in [timeframe]."',
    why: '"I manage" kills claims. Quantify the disruption. Describe the impact on the next day.',
  },
  {
    question: '"Are you working?"',
    badAnswer: '"Yes, I have a job."',
    goodAnswer: '"I am currently working, but my condition has caused [missed days / conflicts / inability to advance / job losses in the past]. There are days I cannot go in because of [symptom]."',
    why: 'Being employed does not disqualify you. But you need to show the occupational impact of your condition.',
  },
  {
    question: '"Do you think your condition is related to your military service?"',
    badAnswer: '"I think so, yeah."',
    goodAnswer: '"Yes. I believe my condition is at least as likely as not caused by my military service. Specifically, [the event / the exposure / the injury] that occurred during [time/place] directly contributed to this condition."',
    why: '"At least as likely as not" is the legal standard. Use those exact words. Then name the in-service event.',
  },
  {
    question: '"How does this condition affect your daily life?"',
    badAnswer: '"It\'s rough, but I get by."',
    goodAnswer: '"It affects my ability to [list: drive, shop, socialize, work, sleep, exercise, maintain relationships]. I can no longer [thing you used to do]. On bad days I [specific functional limitation]. My family has noticed [change in behavior]."',
    why: 'Be specific. List activities. Name things you\'ve stopped doing. The more concrete, the stronger the DBQ.',
  },
  {
    question: '"Are you receiving any treatment?"',
    badAnswer: '"I go to therapy sometimes."',
    goodAnswer: '"I am currently receiving [therapy / medication / CPAP / injections]. Despite treatment, I still experience [symptoms]. My treatment helps me function but does not eliminate [specific ongoing problem]."',
    why: 'Treatment is not evidence you\'re fine — show what persists despite treatment.',
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const CountdownBanner: React.FC<{ days: number }> = ({ days }) => {
  const isUrgent = days <= 14;
  const color = days <= 7 ? Colors.crimsonLight : days <= 14 ? Colors.warning : Colors.teal;
  const bg = days <= 7 ? 'rgba(231,76,60,0.12)' : days <= 14 ? 'rgba(243,156,18,0.12)' : 'rgba(26,188,156,0.12)';

  return (
    <View style={[styles.countdownBanner, { backgroundColor: bg, borderColor: color }]}>
      <View style={styles.countdownLeft}>
        <Text style={styles.countdownIcon}>{days <= 7 ? '🚨' : days <= 14 ? '⚠️' : '📅'}</Text>
        <View>
          <Text style={[styles.countdownDays, { color }]}>{days} DAYS UNTIL YOUR C&P EXAM</Text>
          <Text style={styles.countdownSub}>
            {isUrgent ? 'This is urgent. Read every section below before your exam.' : 'Use this time to prepare thoroughly.'}
          </Text>
        </View>
      </View>
      <View style={[styles.countdownBadge, { backgroundColor: color }]}>
        <Text style={styles.countdownBadgeText}>{days}d</Text>
      </View>
    </View>
  );
};

const SectionHeader: React.FC<{ icon: string; title: string; subtitle?: string }> = ({ icon, title, subtitle }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionHeaderIcon}>{icon}</Text>
    <View>
      <Text style={styles.sectionHeaderTitle}>{title}</Text>
      {subtitle && <Text style={styles.sectionHeaderSub}>{subtitle}</Text>}
    </View>
  </View>
);

const StepCard: React.FC<{ step: typeof EXAM_STEPS[0] }> = ({ step }) => (
  <View style={styles.stepCard}>
    <View style={styles.stepNumberBadge}>
      <Text style={styles.stepNumber}>{step.number}</Text>
    </View>
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{step.title}</Text>
      <Text style={styles.stepBody}>{step.body}</Text>
    </View>
  </View>
);

const RuleCard: React.FC<{ item: typeof HOW_TO_ANSWER[0]; highlight?: boolean }> = ({ item, highlight }) => (
  <View style={[styles.ruleCard, highlight && styles.ruleCardHighlight]}>
    {highlight && (
      <View style={styles.ruleHighlightBadge}>
        <Text style={styles.ruleHighlightText}>KEY PHRASE</Text>
      </View>
    )}
    <Text style={[styles.ruleTitle, highlight && { color: Colors.gold }]}>{item.rule}</Text>
    <Text style={styles.ruleDetail}>{item.detail}</Text>
  </View>
);

const MistakeCard: React.FC<{ item: typeof COMMON_MISTAKES[0] }> = ({ item }) => (
  <View style={styles.mistakeCard}>
    <View style={styles.mistakeHeader}>
      <Text style={styles.mistakeIcon}>{item.icon}</Text>
      <Text style={styles.mistakeName}>{item.mistake}</Text>
    </View>
    <View style={styles.mistakeFix}>
      <Text style={styles.mistakeFixLabel}>✅ INSTEAD:</Text>
      <Text style={styles.mistakeFixText}>{item.fix}</Text>
    </View>
  </View>
);

const ConditionTab: React.FC<{ active: Condition; onSelect: (c: Condition) => void }> = ({ active, onSelect }) => {
  const items: { id: Condition; icon: string; label: string }[] = [
    { id: 'ptsd', icon: '🧠', label: 'PTSD' },
    { id: 'back', icon: '🦴', label: 'Back' },
    { id: 'tinnitus', icon: '👂', label: 'Tinnitus' },
    { id: 'sleep', icon: '😴', label: 'Sleep Apnea' },
  ];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.conditionTabScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
      {items.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[styles.conditionPill, active === item.id && styles.conditionPillActive]}
          onPress={() => onSelect(item.id)}
          activeOpacity={0.8}
        >
          <Text style={styles.conditionPillIcon}>{item.icon}</Text>
          <Text style={[styles.conditionPillLabel, active === item.id && styles.conditionPillLabelActive]}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const MockQACard: React.FC<{ item: typeof MOCK_QA[0]; index: number; expanded: boolean; onToggle: () => void }> = ({ item, index, expanded, onToggle }) => (
  <View style={styles.qaCard}>
    <TouchableOpacity style={styles.qaQuestion} onPress={onToggle} activeOpacity={0.85}>
      <View style={styles.qaQuestionLeft}>
        <View style={styles.qaExaminerBadge}>
          <Text style={styles.qaExaminerText}>EXAMINER</Text>
        </View>
        <Text style={styles.qaQuestionText}>{item.question}</Text>
      </View>
      <Text style={styles.qaChevron}>{expanded ? '▲' : '▼'}</Text>
    </TouchableOpacity>

    {expanded && (
      <View style={styles.qaAnswers}>
        <View style={styles.qaBadAnswer}>
          <Text style={styles.qaBadLabel}>❌ WEAK ANSWER</Text>
          <Text style={styles.qaBadText}>{item.badAnswer}</Text>
        </View>
        <View style={styles.qaGoodAnswer}>
          <Text style={styles.qaGoodLabel}>✅ STRONG ANSWER</Text>
          <Text style={styles.qaGoodText}>{item.goodAnswer}</Text>
        </View>
        <View style={styles.qaWhy}>
          <Text style={styles.qaWhyLabel}>WHY THIS WORKS</Text>
          <Text style={styles.qaWhyText}>{item.why}</Text>
        </View>
      </View>
    )}
  </View>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const CPExamPrep: React.FC<CPExamPrepProps> = ({ onBack, daysUntilExam = 14 }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [activeCondition, setActiveCondition] = useState<Condition>('ptsd');
  const [expandedQA, setExpandedQA] = useState<number | null>(0);

  const cond = CONDITIONS[activeCondition];

  return (
    <View style={styles.container}>
      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.topBarTitle}>C&P Exam Prep</Text>
          <Text style={styles.topBarSub}>Compensation & Pension — Know Before You Go</Text>
        </View>
      </View>

      {/* ── Main Tab Row ── */}
      <View style={styles.mainTabRow}>
        {(['overview', 'conditions', 'practice'] as ActiveTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.mainTab, activeTab === tab && styles.mainTabActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.8}
          >
            <Text style={[styles.mainTabText, activeTab === tab && styles.mainTabTextActive]}>
              {tab === 'overview' ? 'Overview' : tab === 'conditions' ? 'By Condition' : 'Practice'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ══════════════ OVERVIEW TAB ══════════════ */}
        {activeTab === 'overview' && (
          <>
            <CountdownBanner days={daysUntilExam} />

            {/* Urgent Tips */}
            <View style={styles.section}>
              <SectionHeader icon="⚡" title="Do These NOW" subtitle={`You have ${daysUntilExam} days — start today`} />
              {URGENT_TIPS.map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <Text style={styles.tipIcon}>{tip.icon}</Text>
                  <Text style={styles.tipText}>{tip.tip}</Text>
                </View>
              ))}
            </View>

            {/* What to Expect */}
            <View style={styles.section}>
              <SectionHeader icon="🗺️" title="What Happens at the Exam" subtitle="Step by step" />
              {EXAM_STEPS.map((step) => (
                <StepCard key={step.number} step={step} />
              ))}
            </View>

            {/* How to Answer */}
            <View style={styles.section}>
              <SectionHeader icon="🎯" title="How to Answer the Examiner" subtitle="These rules protect your claim" />
              {HOW_TO_ANSWER.map((item, i) => (
                <RuleCard key={i} item={item} highlight={item.rule.includes('at least as likely')} />
              ))}
            </View>

            {/* Common Mistakes */}
            <View style={styles.section}>
              <SectionHeader icon="🚫" title="Common Mistakes That Hurt Claims" subtitle="Veterans make these every day" />
              {COMMON_MISTAKES.map((item, i) => (
                <MistakeCard key={i} item={item} />
              ))}
            </View>
          </>
        )}

        {/* ══════════════ CONDITIONS TAB ══════════════ */}
        {activeTab === 'conditions' && (
          <>
            <View style={styles.conditionIntro}>
              <Text style={styles.conditionIntroText}>
                Select your condition below for specific prep guidance.
              </Text>
            </View>
            <ConditionTab active={activeCondition} onSelect={setActiveCondition} />

            <View style={styles.section}>
              <View style={styles.conditionTitleRow}>
                <Text style={styles.conditionIcon}>{cond.icon}</Text>
                <Text style={styles.conditionTitle}>{cond.label} — Exam Prep</Text>
              </View>

              <Text style={styles.conditionSectionLabel}>WHAT TO COVER WITH THE EXAMINER</Text>
              {cond.keyPoints.map((point, i) => (
                <View key={i} style={styles.conditionPointRow}>
                  <View style={styles.conditionBullet} />
                  <Text style={styles.conditionPointText}>{point}</Text>
                </View>
              ))}

              <Text style={[styles.conditionSectionLabel, { marginTop: Spacing.lg }]}>WATCH OUT FOR</Text>
              {cond.watchOut.map((w, i) => (
                <View key={i} style={styles.watchOutRow}>
                  <Text style={styles.watchOutIcon}>⚠️</Text>
                  <Text style={styles.watchOutText}>{w}</Text>
                </View>
              ))}

              <View style={styles.keyPhraseCard}>
                <Text style={styles.keyPhraseLabel}>YOUR KEY PHRASE</Text>
                <Text style={styles.keyPhraseText}>{cond.keyPhrase}</Text>
              </View>
            </View>
          </>
        )}

        {/* ══════════════ PRACTICE TAB ══════════════ */}
        {activeTab === 'practice' && (
          <>
            <View style={styles.practiceIntro}>
              <Text style={styles.practiceIntroTitle}>Mock Q&A Session</Text>
              <Text style={styles.practiceIntroSub}>
                These are questions examiners commonly ask. Tap each one to see a weak answer, a strong answer, and why it matters.
              </Text>
            </View>
            <View style={styles.section}>
              {MOCK_QA.map((item, i) => (
                <MockQACard
                  key={i}
                  item={item}
                  index={i}
                  expanded={expandedQA === i}
                  onToggle={() => setExpandedQA(expandedQA === i ? null : i)}
                />
              ))}
            </View>

            <View style={styles.practiceFooter}>
              <Text style={styles.practiceFooterIcon}>🛡️</Text>
              <Text style={styles.practiceFooterText}>
                The C&P exam is not a test of toughness. It is a documentation session. Your job is to give the examiner everything they need to write an accurate opinion. Accurate means honest about how bad it gets.
              </Text>
            </View>
          </>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 54 : 44,
    paddingBottom: 12,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.navy,
    borderBottomWidth: 1,
    borderBottomColor: Colors.navyLight,
  },
  backBtn: { marginRight: 12, padding: 4 },
  backBtnText: { color: Colors.gray300, fontSize: 24 },
  topBarTitle: { color: Colors.white, fontSize: 18, fontWeight: '800', fontFamily: Font.display },
  topBarSub: { color: Colors.gray300, fontSize: 11, marginTop: 1 },

  mainTabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.navy,
    paddingHorizontal: Spacing.md,
    paddingBottom: 12,
    gap: 8,
  },
  mainTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.navyLight,
  },
  mainTabActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  mainTabText: { color: Colors.gray300, fontSize: 12, fontWeight: '700' },
  mainTabTextActive: { color: Colors.navy },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  // Countdown
  countdownBanner: {
    margin: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countdownLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  countdownIcon: { fontSize: 24 },
  countdownDays: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  countdownSub: { color: Colors.gray300, fontSize: 11, marginTop: 2 },
  countdownBadge: { width: 40, height: 40, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  countdownBadgeText: { color: Colors.white, fontWeight: '900', fontSize: 13 },

  // Section
  section: { paddingHorizontal: Spacing.md, marginBottom: Spacing.md },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.navyLight,
  },
  sectionHeaderIcon: { fontSize: 20 },
  sectionHeaderTitle: { color: Colors.white, fontSize: 15, fontWeight: '800', fontFamily: Font.display },
  sectionHeaderSub: { color: Colors.gray500, fontSize: 11, marginTop: 2 },

  // Urgent Tips
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.navyLight,
    gap: 10,
  },
  tipIcon: { fontSize: 18 },
  tipText: { color: Colors.gray300, fontSize: 13, lineHeight: 19, flex: 1 },

  // Steps
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.navyLight,
    gap: 12,
  },
  stepNumberBadge: {
    width: 30,
    height: 30,
    borderRadius: Radius.full,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNumber: { color: Colors.navy, fontWeight: '900', fontSize: 14 },
  stepContent: { flex: 1 },
  stepTitle: { color: Colors.white, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  stepBody: { color: Colors.gray300, fontSize: 12, lineHeight: 18 },

  // Rules
  ruleCard: {
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.navyLight,
  },
  ruleCardHighlight: {
    borderColor: Colors.gold,
    backgroundColor: 'rgba(201,168,76,0.08)',
  },
  ruleHighlightBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.gold,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 6,
  },
  ruleHighlightText: { color: Colors.navy, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  ruleTitle: { color: Colors.white, fontSize: 13, fontWeight: '700', marginBottom: 6 },
  ruleDetail: { color: Colors.gray300, fontSize: 12, lineHeight: 18 },

  // Mistakes
  mistakeCard: {
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(231,76,60,0.3)',
  },
  mistakeHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
  mistakeIcon: { fontSize: 16 },
  mistakeName: { color: Colors.crimsonLight, fontSize: 13, fontWeight: '700', flex: 1, lineHeight: 18 },
  mistakeFix: { backgroundColor: 'rgba(39,174,96,0.1)', borderRadius: Radius.sm, padding: 10, borderWidth: 1, borderColor: 'rgba(39,174,96,0.3)' },
  mistakeFixLabel: { color: Colors.success, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  mistakeFixText: { color: Colors.gray300, fontSize: 12, lineHeight: 17 },

  // Condition tabs
  conditionIntro: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  conditionIntroText: { color: Colors.gray500, fontSize: 12 },
  conditionTabScroll: { maxHeight: 52, marginBottom: Spacing.md },
  conditionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.navyLight,
    gap: 6,
  },
  conditionPillActive: { backgroundColor: 'rgba(201,168,76,0.15)', borderColor: Colors.gold },
  conditionPillIcon: { fontSize: 14 },
  conditionPillLabel: { color: Colors.gray500, fontSize: 12, fontWeight: '700' },
  conditionPillLabelActive: { color: Colors.gold },

  conditionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: Spacing.md },
  conditionIcon: { fontSize: 28 },
  conditionTitle: { color: Colors.white, fontSize: 16, fontWeight: '800', fontFamily: Font.display },
  conditionSectionLabel: {
    color: Colors.gray500,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 10,
  },
  conditionPointRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  conditionBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.gold, marginTop: 6, flexShrink: 0 },
  conditionPointText: { color: Colors.gray300, fontSize: 13, lineHeight: 19, flex: 1 },
  watchOutRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(243,156,18,0.08)',
    borderRadius: Radius.sm,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(243,156,18,0.25)',
  },
  watchOutIcon: { fontSize: 14 },
  watchOutText: { color: Colors.gray300, fontSize: 12, lineHeight: 17, flex: 1 },
  keyPhraseCard: {
    marginTop: Spacing.md,
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  keyPhraseLabel: { color: Colors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 8 },
  keyPhraseText: { color: Colors.white, fontSize: 13, lineHeight: 20, fontStyle: 'italic' },

  // Practice
  practiceIntro: {
    margin: Spacing.md,
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.navyLight,
  },
  practiceIntroTitle: { color: Colors.white, fontSize: 15, fontWeight: '800', marginBottom: 6, fontFamily: Font.display },
  practiceIntroSub: { color: Colors.gray300, fontSize: 12, lineHeight: 18 },

  qaCard: {
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.navyLight,
    overflow: 'hidden',
  },
  qaQuestion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    gap: 10,
    justifyContent: 'space-between',
  },
  qaQuestionLeft: { flex: 1, gap: 6 },
  qaExaminerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.navyLight,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  qaExaminerText: { color: Colors.gray500, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  qaQuestionText: { color: Colors.white, fontSize: 13, fontWeight: '600', lineHeight: 19 },
  qaChevron: { color: Colors.gray500, fontSize: 12, paddingTop: 2 },

  qaAnswers: { borderTopWidth: 1, borderTopColor: Colors.navyLight },
  qaBadAnswer: {
    padding: Spacing.md,
    backgroundColor: 'rgba(231,76,60,0.07)',
    borderBottomWidth: 1,
    borderBottomColor: Colors.navyLight,
  },
  qaBadLabel: { color: Colors.crimsonLight, fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginBottom: 6 },
  qaBadText: { color: Colors.gray300, fontSize: 12, lineHeight: 17, fontStyle: 'italic' },
  qaGoodAnswer: {
    padding: Spacing.md,
    backgroundColor: 'rgba(39,174,96,0.07)',
    borderBottomWidth: 1,
    borderBottomColor: Colors.navyLight,
  },
  qaGoodLabel: { color: Colors.success, fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginBottom: 6 },
  qaGoodText: { color: Colors.white, fontSize: 12, lineHeight: 17, fontStyle: 'italic' },
  qaWhy: { padding: Spacing.md },
  qaWhyLabel: { color: Colors.gold, fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginBottom: 6 },
  qaWhyText: { color: Colors.gray300, fontSize: 12, lineHeight: 17 },

  practiceFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    backgroundColor: 'rgba(26,188,156,0.08)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(26,188,156,0.3)',
  },
  practiceFooterIcon: { fontSize: 20 },
  practiceFooterText: { color: Colors.gray300, fontSize: 12, lineHeight: 18, flex: 1 },
});

export default CPExamPrep;
