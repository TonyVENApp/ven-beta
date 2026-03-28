import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  Switch,
} from 'react-native';
import { Colors, Spacing, Radius, Shadow, Font } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────

type StepStatus = 'complete' | 'current' | 'locked';

interface WalkthroughStep {
  id: string;
  stepNumber: number;
  title: string;
  subtitle: string;
  category: 'setup' | 'conditions' | 'evidence' | 'nexus' | 'review';
  component: React.ReactNode;
  videoGuide?: string;
  warningTip?: string;
  successTip?: string;
}

interface Condition {
  id: string;
  name: string;
  selected: boolean;
  isSecondary?: boolean;
  primaryLink?: string;
  ratingTarget?: string;
}

interface WalkthroughProps {
  onComplete?: (data: any) => void;
  onBack?: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  setup: Colors.gold,
  conditions: Colors.teal,
  evidence: '#A78BFA',
  nexus: '#F472B6',
  review: Colors.success,
};

const CATEGORY_LABELS: Record<string, string> = {
  setup: 'SETUP',
  conditions: 'CONDITIONS',
  evidence: 'EVIDENCE',
  nexus: 'NEXUS LINK',
  review: 'REVIEW',
};

// ─── Step Sub-Components ──────────────────────────────────────────────────────

const VideoGuideButton: React.FC<{ title: string; duration?: string }> = ({
  title,
  duration = '3 min',
}) => (
  <TouchableOpacity style={walkthroughStyles.videoButton} activeOpacity={0.85}>
    <View style={walkthroughStyles.videoButtonPlay}>
      <Text style={{ color: Colors.navy, fontSize: 12, fontWeight: '900' }}>▶</Text>
    </View>
    <View style={{ flex: 1 }}>
      <Text style={walkthroughStyles.videoButtonTitle}>{title}</Text>
      <Text style={walkthroughStyles.videoButtonDuration}>Watch · {duration}</Text>
    </View>
  </TouchableOpacity>
);

const TipBox: React.FC<{
  type: 'warning' | 'success' | 'info';
  text: string;
}> = ({ type, text }) => {
  const config = {
    warning: { color: Colors.warning, icon: '⚠️', bg: 'rgba(243,156,18,0.1)' },
    success: { color: Colors.teal, icon: '💡', bg: 'rgba(26,188,156,0.1)' },
    info: { color: Colors.gold, icon: '🛡️', bg: 'rgba(201,168,76,0.1)' },
  }[type];
  return (
    <View style={[walkthroughStyles.tipBox, { backgroundColor: config.bg, borderColor: config.color }]}>
      <Text style={{ fontSize: 16, marginRight: 8 }}>{config.icon}</Text>
      <Text style={[walkthroughStyles.tipText, { color: config.color }]}>{text}</Text>
    </View>
  );
};

const RealExampleBox: React.FC<{ name: string; story: string; outcome: string }> = ({
  name,
  story,
  outcome,
}) => (
  <View style={walkthroughStyles.exampleBox}>
    <View style={walkthroughStyles.exampleHeader}>
      <Text style={walkthroughStyles.exampleIcon}>👤</Text>
      <Text style={walkthroughStyles.exampleLabel}>REAL VETERAN STORY</Text>
    </View>
    <Text style={walkthroughStyles.exampleName}>{name}</Text>
    <Text style={walkthroughStyles.exampleStory}>{story}</Text>
    <View style={walkthroughStyles.exampleOutcome}>
      <Text style={walkthroughStyles.exampleOutcomeLabel}>OUTCOME: </Text>
      <Text style={walkthroughStyles.exampleOutcomeText}>{outcome}</Text>
    </View>
  </View>
);

// ─── Step 1: ITF Setup ────────────────────────────────────────────────────────

const ITFStep: React.FC = () => {
  const [itfFiled, setItfFiled] = useState(false);

  return (
    <View>
      <Text style={walkthroughStyles.stepHeadline}>Lock in your effective date -- today.</Text>
      <Text style={walkthroughStyles.stepBody}>
        Before anything else, we need to file your Intent to File (ITF). This is a single form that
        protects your effective date -- meaning VA will owe you back pay from today, not from when
        you finish your claim (which can take months).
      </Text>

      <TipBox
        type="info"
        text="Missing the ITF is the single most common way veterans lose thousands in back pay. It takes 60 seconds. Do it now."
      />

      <VideoGuideButton title="Intent to File: Why You Must Do This TODAY" duration="2 min" />

      <View style={walkthroughStyles.itfCard}>
        <View style={walkthroughStyles.itfCardHeader}>
          <Text style={walkthroughStyles.itfCardTitle}>VA Form 21-0966</Text>
          <Text style={walkthroughStyles.itfCardSub}>Intent to File -- Takes 60 seconds</Text>
        </View>
        <View style={walkthroughStyles.itfCardRow}>
          <View>
            <Text style={walkthroughStyles.itfProtectLabel}>PROTECTS YOUR DATE</Text>
            <Text style={walkthroughStyles.itfProtectDate}>Today -- March 10, 2026</Text>
          </View>
          <TouchableOpacity
            style={[walkthroughStyles.itfButton, itfFiled && walkthroughStyles.itfButtonFiled]}
            onPress={() => setItfFiled(true)}
          >
            {itfFiled ? (
              <Text style={walkthroughStyles.itfButtonTextFiled}>✓ ITF Filed</Text>
            ) : (
              <Text style={walkthroughStyles.itfButtonText}>File ITF Now</Text>
            )}
          </TouchableOpacity>
        </View>
        {itfFiled && (
          <TipBox
            type="success"
            text="Done. Your effective date is now protected for 1 year. You have until March 10, 2027 to complete your claim."
          />
        )}
      </View>

      <RealExampleBox
        name="James P., Army Veteran -- Georgia"
        story="James waited 3 months before filing his claim because he wanted everything 'perfect.' He didn't know about the ITF."
        outcome="Lost $7,800 in back pay that would have been owed from his original decision date. Filing ITF first would have taken 2 minutes."
      />
    </View>
  );
};

// ─── Step 2: Condition Selection ─────────────────────────────────────────────

const ConditionStep: React.FC = () => {
  const [conditions, setConditions] = useState<Condition[]>([
    { id: '1', name: 'PTSD / Mental Health', selected: true, ratingTarget: '50–70%' },
    { id: '2', name: 'TBI (Traumatic Brain Injury)', selected: false, ratingTarget: '10–40%' },
    { id: '3', name: 'Knee / Joint (Right Knee)', selected: true, ratingTarget: '10–20%' },
    { id: '4', name: 'Sleep Apnea', selected: false, isSecondary: true, primaryLink: 'PTSD', ratingTarget: '50%' },
    { id: '5', name: 'Hypertension', selected: false, isSecondary: true, primaryLink: 'PTSD', ratingTarget: '10–20%' },
    { id: '6', name: 'Lumbar Strain (Back)', selected: true, ratingTarget: '10–20%' },
    { id: '7', name: 'Tinnitus', selected: false, ratingTarget: '10%' },
    { id: '8', name: 'Hearing Loss', selected: false, ratingTarget: '0–10%' },
  ]);

  const [customCondition, setCustomCondition] = useState('');

  const toggleCondition = useCallback((id: string) => {
    setConditions(prev => prev.map(c => c.id === id ? { ...c, selected: !c.selected } : c));
  }, []);

  const primaryConditions = conditions.filter(c => !c.isSecondary);
  const secondaryConditions = conditions.filter(c => c.isSecondary);

  return (
    <View>
      <Text style={walkthroughStyles.stepHeadline}>What conditions are you claiming?</Text>
      <Text style={walkthroughStyles.stepBody}>
        Select every condition you want to claim. Don't hold back -- the VA won't penalize you for
        claiming more. Secondary conditions (caused or worsened by a primary condition) are often the
        most valuable ratings veterans leave unclaimed.
      </Text>

      <TipBox
        type="success"
        text="AI detected 2 secondary conditions likely linked to your PTSD. Sleep Apnea alone could add 50% to your rating."
      />

      <Text style={walkthroughStyles.conditionGroupLabel}>PRIMARY CONDITIONS</Text>
      {primaryConditions.map(condition => (
        <TouchableOpacity
          key={condition.id}
          style={[
            walkthroughStyles.conditionRow,
            condition.selected && walkthroughStyles.conditionRowSelected,
          ]}
          onPress={() => toggleCondition(condition.id)}
          activeOpacity={0.85}
        >
          <View style={[
            walkthroughStyles.conditionCheck,
            condition.selected && walkthroughStyles.conditionCheckSelected,
          ]}>
            {condition.selected && <Text style={{ color: Colors.navy, fontSize: 12, fontWeight: '900' }}>✓</Text>}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[
              walkthroughStyles.conditionName,
              condition.selected && { color: Colors.white },
            ]}>
              {condition.name}
            </Text>
          </View>
          {condition.ratingTarget && (
            <Text style={walkthroughStyles.conditionRating}>{condition.ratingTarget}</Text>
          )}
        </TouchableOpacity>
      ))}

      <View style={walkthroughStyles.secondaryDivider}>
        <View style={walkthroughStyles.secondaryDividerLine} />
        <Text style={walkthroughStyles.secondaryDividerLabel}>⚡ SECONDARY CONDITIONS (AI Identified)</Text>
        <View style={walkthroughStyles.secondaryDividerLine} />
      </View>

      {secondaryConditions.map(condition => (
        <TouchableOpacity
          key={condition.id}
          style={[
            walkthroughStyles.conditionRow,
            walkthroughStyles.conditionRowSecondary,
            condition.selected && walkthroughStyles.conditionRowSelected,
          ]}
          onPress={() => toggleCondition(condition.id)}
          activeOpacity={0.85}
        >
          <View style={[
            walkthroughStyles.conditionCheck,
            condition.selected && walkthroughStyles.conditionCheckSelected,
          ]}>
            {condition.selected && <Text style={{ color: Colors.navy, fontSize: 12, fontWeight: '900' }}>✓</Text>}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[
              walkthroughStyles.conditionName,
              condition.selected && { color: Colors.white },
            ]}>
              {condition.name}
            </Text>
            {condition.primaryLink && (
              <Text style={walkthroughStyles.conditionSecondaryLink}>
                Secondary to: {condition.primaryLink}
              </Text>
            )}
          </View>
          {condition.ratingTarget && (
            <Text style={walkthroughStyles.conditionRating}>{condition.ratingTarget}</Text>
          )}
        </TouchableOpacity>
      ))}

      <View style={walkthroughStyles.addConditionRow}>
        <TextInput
          style={walkthroughStyles.addConditionInput}
          placeholder="Add another condition..."
          placeholderTextColor={Colors.gray500}
          value={customCondition}
          onChangeText={setCustomCondition}
        />
        <TouchableOpacity style={walkthroughStyles.addConditionBtn}>
          <Text style={{ color: Colors.gold, fontWeight: '700', fontSize: 20 }}>+</Text>
        </TouchableOpacity>
      </View>

      <VideoGuideButton title="Secondary Conditions: How to Connect the Dots" duration="4 min" />
    </View>
  );
};

// ─── Step 3: Evidence ─────────────────────────────────────────────────────────

const EvidenceStep: React.FC = () => {
  const [checklist, setChecklist] = useState([
    { id: '1', label: 'Service Treatment Records (STRs)', status: 'complete', required: true },
    { id: '2', label: 'DD-214 uploaded', status: 'complete', required: true },
    { id: '3', label: 'VA Medical Records', status: 'pending', required: true },
    { id: '4', label: 'Private Doctor Records', status: 'missing', required: false },
    { id: '5', label: 'Buddy Statement (Corroboration)', status: 'missing', required: false },
    { id: '6', label: 'Nexus Letter from Doctor', status: 'missing', required: false },
    { id: '7', label: 'C&P Exam DBQ', status: 'pending', required: false },
  ]);

  const statusConfig: Record<string, { color: string; icon: string; label: string }> = {
    complete: { color: Colors.success, icon: '✅', label: 'Uploaded' },
    pending: { color: Colors.warning, icon: '⏳', label: 'Pending' },
    missing: { color: Colors.gray500, icon: '○', label: 'Not uploaded' },
  };

  return (
    <View>
      <Text style={walkthroughStyles.stepHeadline}>Build your evidence package.</Text>
      <Text style={walkthroughStyles.stepBody}>
        VA adjudicators make their decision based on evidence. Your job is to make it impossible to
        deny. Think of this as building your court case before it ever goes before a rater.
      </Text>

      <TipBox
        type="warning"
        text="The #1 reason claims get denied: insufficient nexus evidence. A Nexus Letter from your private doctor changes everything."
      />

      {checklist.map(item => {
        const cfg = statusConfig[item.status];
        return (
          <View key={item.id} style={[
            walkthroughStyles.evidenceRow,
            item.status === 'missing' && walkthroughStyles.evidenceRowMissing,
          ]}>
            <Text style={{ fontSize: 16, marginRight: 10 }}>{cfg.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[walkthroughStyles.evidenceLabel, item.status === 'complete' && { opacity: 0.7 }]}>
                {item.label}
              </Text>
              {item.required && item.status !== 'complete' && (
                <Text style={{ color: Colors.crimsonLight, fontSize: 10, fontWeight: '700', marginTop: 2 }}>
                  REQUIRED
                </Text>
              )}
            </View>
            <TouchableOpacity style={[walkthroughStyles.evidenceAction, { borderColor: cfg.color }]}>
              <Text style={[walkthroughStyles.evidenceActionText, { color: cfg.color }]}>
                {item.status === 'complete' ? 'View' : item.status === 'pending' ? 'Check' : 'Upload'}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}

      <RealExampleBox
        name="Maria T., Marine Veteran -- Florida"
        story="Maria's initial claim for PTSD was denied because she only submitted VA records. Her private therapist had 4 years of notes documenting her symptoms."
        outcome="After uploading private records + Nexus Letter: 70% rating approved. $28,000 in back pay."
      />

      <VideoGuideButton title="Building an Undeniable Evidence Package" duration="5 min" />
    </View>
  );
};

// ─── Step 4: Nexus Navigator ──────────────────────────────────────────────────

const NexusStep: React.FC = () => {
  const [selectedCondition, setSelectedCondition] = useState('PTSD');
  const conditions = ['PTSD', 'Sleep Apnea', 'Lumbar Strain'];

  return (
    <View>
      <Text style={walkthroughStyles.stepHeadline}>Connect the dots for VA.</Text>
      <Text style={walkthroughStyles.stepBody}>
        The Nexus is the legal link between your in-service event and your current disability. VA
        doesn't assume the link -- you have to prove it. The magic phrase is "at least as likely as
        not" -- a 51% standard, not certainty.
      </Text>

      <TipBox
        type="info"
        text="The legal standard is at least as likely as not. Your doctor needs only 51% confidence, not certainty."
      />

      <Text style={walkthroughStyles.conditionGroupLabel}>SELECT CONDITION</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        {conditions.map(c => (
          <TouchableOpacity
            key={c}
            style={[
              walkthroughStyles.conditionPill,
              selectedCondition === c && walkthroughStyles.conditionPillActive,
            ]}
            onPress={() => setSelectedCondition(c)}
          >
            <Text style={[
              walkthroughStyles.conditionPillText,
              selectedCondition === c && { color: Colors.navy },
            ]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={walkthroughStyles.nexusCard}>
        <Text style={walkthroughStyles.nexusCardTitle}>Nexus Template for {selectedCondition}</Text>
        <View style={walkthroughStyles.nexusTemplate}>
          <Text style={walkthroughStyles.nexusTemplateText}>
            "It is my medical opinion that the veteran's{' '}
            <Text style={{ color: Colors.gold, fontWeight: '700' }}>{selectedCondition}</Text> is{' '}
        text="The legal standard is at least as likely as not. Your doctor needs only 51% confidence, not certainty."
            caused by or a result of their military service, specifically [describe in-service event].
            This opinion is based on [medical rationale]."
          </Text>
        </View>
        <TouchableOpacity style={walkthroughStyles.nexusCopyBtn}>
          <Text style={walkthroughStyles.nexusCopyBtnText}>📋 Copy Template</Text>
        </TouchableOpacity>
      </View>

      <View style={walkthroughStyles.nexusSteps}>
        <Text style={walkthroughStyles.nexusStepsTitle}>HOW TO GET YOUR NEXUS LETTER</Text>
        {[
          { step: '1', text: 'Book appointment with your private doctor (NOT VA)', icon: '📅' },
          { step: '2', text: 'Bring this template and your service records', icon: '📂' },
          { step: '3', text: 'Ask doctor to sign on clinic letterhead', icon: '✍️' },
          { step: '4', text: 'Upload to your Document Vault', icon: '🗄️' },
        ].map(item => (
          <View key={item.step} style={walkthroughStyles.nexusStepRow}>
            <Text style={{ fontSize: 18, marginRight: 10 }}>{item.icon}</Text>
            <Text style={walkthroughStyles.nexusStepText}>{item.text}</Text>
          </View>
        ))}
      </View>

      <VideoGuideButton title="How to Explain Secondary Conditions to Your Doctor" duration="4 min" />
    </View>
  );
};

// ─── Step 5: Review ───────────────────────────────────────────────────────────

const ReviewStep: React.FC<{ onSubmit: () => void }> = ({ onSubmit }) => {
  const [agreed, setAgreed] = useState(false);

  return (
    <View>
      <Text style={walkthroughStyles.stepHeadline}>Review your claim package.</Text>
      <Text style={walkthroughStyles.stepBody}>
        Before we submit, let's confirm everything is in order. VA raters see hundreds of claims
        a week. Your package should leave zero ambiguity.
      </Text>

      <View style={walkthroughStyles.reviewSection}>
        <Text style={walkthroughStyles.reviewSectionTitle}>CLAIM SUMMARY</Text>
        {[
          { label: 'Form', value: 'VA 21-526EZ' },
          { label: 'Veteran', value: 'SGT Marcus Webb' },
          { label: 'Conditions Filed', value: '4 (2 primary, 2 secondary)' },
          { label: 'Evidence Items', value: '5 of 7 uploaded' },
          { label: 'Nexus Letter', value: '⚠️ Pending upload' },
          { label: 'ITF Date Protected', value: '✅ March 10, 2026' },
        ].map(item => (
          <View key={item.label} style={walkthroughStyles.reviewRow}>
            <Text style={walkthroughStyles.reviewLabel}>{item.label}</Text>
            <Text style={walkthroughStyles.reviewValue}>{item.value}</Text>
          </View>
        ))}
      </View>

      <TipBox
        type="warning"
        text="Your Nexus Letter is still pending. You can submit now and add it as supplemental evidence within 1 year without losing your effective date."
      />

      <View style={walkthroughStyles.agreementRow}>
        <Switch
          value={agreed}
          onValueChange={setAgreed}
          trackColor={{ false: Colors.navyLight, true: Colors.teal }}
          thumbColor={agreed ? Colors.white : Colors.gray300}
        />
        <Text style={walkthroughStyles.agreementText}>
          I certify the information in this claim is true and complete to the best of my knowledge.
        </Text>
      </View>

      <TouchableOpacity
        style={[walkthroughStyles.submitButton, !agreed && walkthroughStyles.submitButtonDisabled]}
        onPress={agreed ? onSubmit : undefined}
        activeOpacity={agreed ? 0.85 : 1}
      >
        <Text style={walkthroughStyles.submitButtonText}>🛡️ Submit Claim to VA</Text>
      </TouchableOpacity>

      <Text style={walkthroughStyles.submitDisclaimer}>
        Submitting via VA Benefits Intake API. You'll receive confirmation within 2–3 business days.
      </Text>
    </View>
  );
};

// ─── Main Walkthrough ─────────────────────────────────────────────────────────

export const WalkthroughEngine: React.FC<WalkthroughProps> = ({ onBack, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const steps: Omit<WalkthroughStep, 'component'>[] & { component: React.ReactNode }[] = [
    {
      id: 'itf',
      stepNumber: 1,
      title: 'Intent to File',
      subtitle: 'Protect your effective date',
      category: 'setup',
      component: <ITFStep />,
    },
    {
      id: 'conditions',
      stepNumber: 2,
      title: 'Select Conditions',
      subtitle: 'What are you claiming?',
      category: 'conditions',
      component: <ConditionStep />,
    },
    {
      id: 'evidence',
      stepNumber: 3,
      title: 'Build Evidence',
      subtitle: 'Make it undeniable',
      category: 'evidence',
      component: <EvidenceStep />,
    },
    {
      id: 'nexus',
      stepNumber: 4,
      title: 'Nexus Navigator',
      subtitle: 'Connect service to disability',
      category: 'nexus',
      component: <NexusStep />,
    },
    {
      id: 'review',
      stepNumber: 5,
      title: 'Review & Submit',
      subtitle: 'Final check before VA',
      category: 'review',
      component: <ReviewStep onSubmit={() => setSubmitted(true)} />,
    },
  ];

  const totalSteps = steps.length;
  const progressPct = ((currentStep + 1) / totalSteps) * 100;

  const goNext = () => {
    if (currentStep < totalSteps - 1) {
      Animated.spring(progressAnim, {
        toValue: (currentStep + 2) / totalSteps,
        useNativeDriver: false,
      }).start();
      setCurrentStep(s => s + 1);
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      setCurrentStep(s => s - 1);
    } else {
      onBack?.();
    }
  };

  const step = steps[currentStep];
  const catColor = CATEGORY_COLORS[step.category];

  if (submitted) {
    return (
      <View style={walkthroughStyles.successScreen}>
        <Text style={walkthroughStyles.successIcon}>🎖️</Text>
        <Text style={walkthroughStyles.successTitle}>Claim Submitted</Text>
        <Text style={walkthroughStyles.successSub}>
          Your VA 21-526EZ has been transmitted to the VA Benefits Intake API.
        </Text>
        <View style={walkthroughStyles.successDetails}>
          {[
            ['Submission Date', 'March 10, 2026'],
            ['Tracking #', 'VEN-2026-0310-4821'],
            ['Expected Decision', 'May–August 2026'],
            ['ITF Protected', '✅ Active'],
          ].map(([label, value]) => (
            <View key={label} style={walkthroughStyles.reviewRow}>
              <Text style={walkthroughStyles.reviewLabel}>{label}</Text>
              <Text style={walkthroughStyles.reviewValue}>{value}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={walkthroughStyles.submitButton} onPress={onComplete}>
          <Text style={walkthroughStyles.submitButtonText}>View Dashboard →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={walkthroughStyles.container}>
      {/* ── Header ── */}
      <View style={walkthroughStyles.header}>
        <TouchableOpacity onPress={goPrev} style={walkthroughStyles.backBtn}>
          <Text style={walkthroughStyles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <Text style={walkthroughStyles.headerTitle}>VA 21-526EZ Walkthrough</Text>
          <Text style={walkthroughStyles.headerSub}>Step {currentStep + 1} of {totalSteps}</Text>
        </View>
        <View style={[walkthroughStyles.categoryBadge, { backgroundColor: catColor + '20', borderColor: catColor }]}>
          <Text style={[walkthroughStyles.categoryBadgeText, { color: catColor }]}>
            {CATEGORY_LABELS[step.category]}
          </Text>
        </View>
      </View>

      {/* ── Progress Bar ── */}
      <View style={walkthroughStyles.progressContainer}>
        <View style={walkthroughStyles.progressBg}>
          <View style={[walkthroughStyles.progressFill, { width: `${progressPct}%`, backgroundColor: catColor }]} />
        </View>
        <View style={walkthroughStyles.stepDots}>
          {steps.map((s, i) => (
            <View
              key={s.id}
              style={[
                walkthroughStyles.stepDot,
                i <= currentStep && { backgroundColor: CATEGORY_COLORS[s.category] },
                i === currentStep && walkthroughStyles.stepDotActive,
              ]}
            />
          ))}
        </View>
      </View>

      {/* ── Step TOC (horizontal scroll) ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={walkthroughStyles.tocScroll}
        contentContainerStyle={{ paddingHorizontal: Spacing.md, gap: 8 }}
      >
        {steps.map((s, i) => (
          <TouchableOpacity
            key={s.id}
            style={[
              walkthroughStyles.tocItem,
              i === currentStep && walkthroughStyles.tocItemActive,
              i < currentStep && walkthroughStyles.tocItemComplete,
            ]}
            onPress={() => i <= currentStep && setCurrentStep(i)}
          >
            <Text style={[
              walkthroughStyles.tocItemText,
              i === currentStep && { color: catColor },
              i < currentStep && { color: Colors.success },
            ]}>
              {i < currentStep ? '✓ ' : ''}{s.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Step Content ── */}
      <ScrollView
        style={walkthroughStyles.stepScroll}
        contentContainerStyle={walkthroughStyles.stepScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[walkthroughStyles.stepTitle, { color: catColor }]}>{step.title}</Text>
        <Text style={walkthroughStyles.stepSubtitle}>{step.subtitle}</Text>
        {step.component}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Footer Navigation ── */}
      <View style={walkthroughStyles.footer}>
        <TouchableOpacity style={walkthroughStyles.footerBack} onPress={goPrev}>
          <Text style={walkthroughStyles.footerBackText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[walkthroughStyles.footerNext, { backgroundColor: catColor }]}
          onPress={goNext}
        >
          <Text style={walkthroughStyles.footerNextText}>
            {currentStep === totalSteps - 1 ? 'Submit' : 'Continue →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const walkthroughStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark,
  },
  header: {
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.navyLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Font.display,
  },
  headerSub: {
    color: Colors.gray500,
    fontSize: 12,
    marginTop: 2,
  },
  categoryBadge: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  // Progress
  progressContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.navyMid,
  },
  progressBg: {
    height: 3,
    backgroundColor: Colors.navyLight,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
  },
  stepDots: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.navyLight,
  },
  stepDotActive: {
    width: 20,
    borderRadius: 4,
  },

  // TOC
  tocScroll: {
    backgroundColor: Colors.navyMid,
    borderBottomWidth: 1,
    borderBottomColor: Colors.navyLight,
    maxHeight: 40,
  },
  tocItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  tocItemActive: {
    backgroundColor: Colors.navyLight,
  },
  tocItemComplete: {
    opacity: 0.7,
  },
  tocItemText: {
    color: Colors.gray500,
    fontSize: 12,
    fontWeight: '600',
  },

  // Step content
  stepScroll: {
    flex: 1,
  },
  stepScrollContent: {
    padding: Spacing.md,
  },
  stepTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4,
  },
  stepSubtitle: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: '900',
    fontFamily: Font.display,
    marginBottom: Spacing.md,
    lineHeight: 28,
  },
  stepHeadline: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 24,
  },
  stepBody: {
    color: Colors.gray300,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },

  // Video Guide
  videoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(201,168,76,0.12)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.gold,
    padding: 12,
    marginBottom: Spacing.md,
    gap: 10,
  },
  videoButtonPlay: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoButtonTitle: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  videoButtonDuration: {
    color: Colors.gold,
    fontSize: 11,
    marginTop: 2,
  },

  // Tip Box
  tipBox: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'flex-start',
  },
  tipText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    lineHeight: 20,
  },

  // Real Example
  exampleBox: {
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.navyLight,
    borderLeftWidth: 3,
    borderLeftColor: Colors.teal,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  exampleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  exampleIcon: {
    fontSize: 14,
  },
  exampleLabel: {
    color: Colors.teal,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  exampleName: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  exampleStory: {
    color: Colors.gray300,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 8,
  },
  exampleOutcome: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  exampleOutcomeLabel: {
    color: Colors.success,
    fontSize: 12,
    fontWeight: '800',
  },
  exampleOutcomeText: {
    color: Colors.success,
    fontSize: 12,
  },

  // ITF Step
  itfCard: {
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.gold,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.glow,
  },
  itfCardHeader: {
    marginBottom: 12,
  },
  itfCardTitle: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  itfCardSub: {
    color: Colors.gray500,
    fontSize: 12,
    marginTop: 2,
  },
  itfCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  itfProtectLabel: {
    color: Colors.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  itfProtectDate: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  itfButton: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.md,
    ...Shadow.glow,
  },
  itfButtonFiled: {
    backgroundColor: Colors.success,
  },
  itfButtonText: {
    color: Colors.navy,
    fontWeight: '800',
    fontSize: 14,
  },
  itfButtonTextFiled: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 14,
  },

  // Condition Step
  conditionGroupLabel: {
    color: Colors.gray500,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 8,
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.navyLight,
    padding: 12,
    marginBottom: 8,
  },
  conditionRowSelected: {
    borderColor: Colors.gold,
    backgroundColor: 'rgba(201,168,76,0.08)',
  },
  conditionRowSecondary: {
    borderColor: Colors.navyLight,
    borderStyle: 'dashed',
  },
  conditionCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.gray500,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conditionCheckSelected: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  conditionName: {
    color: Colors.gray300,
    fontSize: 14,
    fontWeight: '600',
  },
  conditionRating: {
    color: Colors.teal,
    fontSize: 11,
    fontWeight: '700',
  },
  conditionSecondaryLink: {
    color: Colors.gray500,
    fontSize: 11,
    marginTop: 2,
  },
  secondaryDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  secondaryDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.navyLight,
  },
  secondaryDividerLabel: {
    color: Colors.teal,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginHorizontal: 8,
  },
  conditionPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.navyLight,
    backgroundColor: Colors.navyMid,
    marginRight: 8,
  },
  conditionPillActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  conditionPillText: {
    color: Colors.gray300,
    fontSize: 13,
    fontWeight: '600',
  },
  addConditionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    marginBottom: 16,
  },
  addConditionInput: {
    flex: 1,
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.navyLight,
    color: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  addConditionBtn: {
    width: 44,
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Evidence Step
  evidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.navyLight,
    padding: 12,
    marginBottom: 8,
  },
  evidenceRowMissing: {
    opacity: 0.75,
  },
  evidenceLabel: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  evidenceAction: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  evidenceActionText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Nexus Step
  nexusCard: {
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#F472B6',
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  nexusCardTitle: {
    color: '#F472B6',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  nexusTemplate: {
    backgroundColor: Colors.dark,
    borderRadius: Radius.sm,
    padding: 12,
    marginBottom: 10,
  },
  nexusTemplateText: {
    color: Colors.gray300,
    fontSize: 13,
    lineHeight: 22,
    fontFamily: Font.mono,
  },
  nexusCopyBtn: {
    borderWidth: 1,
    borderColor: '#F472B6',
    borderRadius: Radius.sm,
    padding: 10,
    alignItems: 'center',
  },
  nexusCopyBtnText: {
    color: '#F472B6',
    fontWeight: '700',
    fontSize: 13,
  },
  nexusSteps: {
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.navyLight,
  },
  nexusStepsTitle: {
    color: Colors.gray500,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 12,
  },
  nexusStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  nexusStepText: {
    color: Colors.gray300,
    fontSize: 13,
    flex: 1,
  },

  // Review Step
  reviewSection: {
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.navyLight,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  reviewSectionTitle: {
    color: Colors.gray500,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 12,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.navyLight,
  },
  reviewLabel: {
    color: Colors.gray500,
    fontSize: 13,
  },
  reviewValue: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: Spacing.md,
  },
  agreementText: {
    color: Colors.gray300,
    fontSize: 13,
    flex: 1,
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: Colors.teal,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: 8,
    ...Shadow.card,
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  submitDisclaimer: {
    color: Colors.gray500,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.md,
  },

  // Footer nav
  footer: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: 12,
    backgroundColor: Colors.navyMid,
    borderTopWidth: 1,
    borderTopColor: Colors.navyLight,
    paddingBottom: Platform.OS === 'ios' ? 30 : Spacing.md,
  },
  footerBack: {
    flex: 1,
    backgroundColor: Colors.navyLight,
    borderRadius: Radius.md,
    padding: 14,
    alignItems: 'center',
  },
  footerBackText: {
    color: Colors.gray300,
    fontWeight: '700',
    fontSize: 15,
  },
  footerNext: {
    flex: 2,
    borderRadius: Radius.md,
    padding: 14,
    alignItems: 'center',
    ...Shadow.card,
  },
  footerNextText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 15,
  },

  // Success screen
  successScreen: {
    flex: 1,
    backgroundColor: Colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  successTitle: {
    color: Colors.white,
    fontSize: 28,
    fontWeight: '900',
    fontFamily: Font.display,
    marginBottom: 8,
    textAlign: 'center',
  },
  successSub: {
    color: Colors.gray300,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  successDetails: {
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.success,
    padding: Spacing.md,
    width: '100%',
    marginBottom: Spacing.lg,
  },
});

export default WalkthroughEngine;
