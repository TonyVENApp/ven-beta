import React, { useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors, Font, Radius, Spacing } from '../theme';
import { FormWorkspaceCard } from '../components/FormWorkspaceCard';
import { FormDraft, loadDraft, makeDefaultDraft } from '../lib/formWorkspace';

interface DependentsFamilyProfile {
  va_rating_level?: string | null;
  va_is_pt?: boolean | null;
  va_is_tdiu?: boolean | null;
}

interface DependentsFamilyScreenProps {
  onBack: () => void;
  veteranProfile?: DependentsFamilyProfile | null;
}

type Chapter35Status = 'likely_eligible' | 'likely_not_eligible' | 'need_more_information';
type PrepareFutureTab = 'dic' | 'will' | 'burial';

interface GuideSection {
  id: string;
  title: string;
  emoji: string;
  helper?: string;
  bullets?: string[];
  note?: string;
  warning?: string;
}

interface PlainQuestionGuideItem {
  id: string;
  title: string;
  helpText: string;
}

function getChapter35Assessment(profile?: DependentsFamilyProfile | null) {
  const ratingLevel = profile?.va_rating_level ?? null;
  const isPt = profile?.va_is_pt ?? null;
  const isTdiu = profile?.va_is_tdiu ?? null;

  let status: Chapter35Status = 'need_more_information';
  let reason = 'We do not have enough Veteran rating details yet to estimate this Chapter 35 path.';
  let missingItems: string[] = [];

  if (ratingLevel === 'one_hundred' && isPt === true) {
    status = 'likely_eligible';
    reason = 'Your stored Veteran profile shows a 100% VA rating with Permanent and Total status marked yes.';
  } else if (ratingLevel === 'below_100') {
    status = 'likely_not_eligible';
    reason = 'Your stored Veteran profile shows a VA rating below 100%, so this living-Veteran Permanent and Total path does not appear to match.';
  } else if (ratingLevel === 'one_hundred' && isPt === false) {
    status = 'likely_not_eligible';
    reason = 'Your stored Veteran profile shows a 100% rating, but it does not show Permanent and Total status.';
  } else if (ratingLevel === 'one_hundred' && isPt == null) {
    status = 'need_more_information';
    reason = 'Your stored Veteran profile shows a 100% rating, but it does not say whether the rating is Permanent and Total.';
    missingItems = ['Whether the Veteran is marked Permanent and Total (P&T)'];
  } else if (ratingLevel == null && isPt == null) {
    status = 'need_more_information';
    reason = 'Your stored Veteran profile does not yet include a VA rating level or Permanent and Total status for this check.';
    missingItems = ['VA rating level', 'Whether the Veteran is marked Permanent and Total (P&T)'];
  } else if (ratingLevel == null) {
    status = 'need_more_information';
    reason = 'Your stored Veteran profile is missing the VA rating level needed for this first Chapter 35 check.';
    missingItems = ['VA rating level'];
  } else if (isPt == null) {
    status = 'need_more_information';
    reason = 'Your stored Veteran profile is missing the Permanent and Total status needed for this first Chapter 35 check.';
    missingItems = ['Whether the Veteran is marked Permanent and Total (P&T)'];
  }

  if (isTdiu === true && !(ratingLevel === 'one_hundred' && isPt === true)) {
    reason += ' TDIU by itself is not treated here as an automatic Chapter 35 approval path without an explicit Permanent and Total signal.';
  }

  return { status, reason, missingItems };
}

const STATUS_COPY: Record<Chapter35Status, { label: string; color: string; bg: string; emoji: string }> = {
  likely_eligible: {
    label: 'Likely eligible',
    color: Colors.success,
    bg: 'rgba(39,174,96,0.12)',
    emoji: '✅',
  },
  likely_not_eligible: {
    label: 'Likely not eligible',
    color: Colors.warning,
    bg: 'rgba(243,156,18,0.12)',
    emoji: '⚠️',
  },
  need_more_information: {
    label: 'Need more information',
    color: Colors.teal,
    bg: 'rgba(26,188,156,0.12)',
    emoji: 'ℹ️',
  },
};

function getChampvaAssessment(profile?: DependentsFamilyProfile | null) {
  if (profile?.va_is_pt === true) {
    return {
      title: 'Likely eligibility',
      body:
        'Based on this Veteran profile, a spouse or child may likely qualify for CHAMPVA.\nFinal eligibility still depends on VA rules and family/member details.',
      color: Colors.success,
      bg: 'rgba(39,174,96,0.12)',
      emoji: '✅',
    };
  }

  return {
    title: 'More information needed',
    body: 'We need more information to tell if a spouse or child may qualify for CHAMPVA.',
    color: Colors.teal,
    bg: 'rgba(26,188,156,0.12)',
    emoji: 'ℹ️',
  };
}

export function DependentsFamilyScreen({
  onBack,
  veteranProfile,
}: DependentsFamilyScreenProps) {
  const shareFamilyHandoff = async () => {
    const message = `Chapter 35 / DEA for Spouse or Child

This application must be completed by the spouse or child applicant.
Payments go to the family member.

Please bring your own information plus the Veteran or service member information needed for the form.

Set up Login.gov or ID.me first.

Apply online:
https://www.va.gov/family-and-caregiver-benefits/education-and-careers/apply-for-dea-fry-form-22-5490/introduction

Download form:
https://www.va.gov/forms/22-5490/

Login.gov:
https://www.login.gov/create-an-account/

ID.me:
https://www.id.me/

Veterans Education Network video walkthrough: coming soon`;

    try {
      await Share.share({ message });
    } catch {
      Alert.alert('Could not share', 'Please try again in a moment.');
    }
  };

  const shareChampvaHandoff = async () => {
    const message = `CHAMPVA for Spouse or Child

CHAMPVA may help cover health care for a spouse or child of a qualifying Veteran.

Set up Login.gov or ID.me before applying online.

Apply online:
https://www.va.gov/family-and-caregiver-benefits/health-and-disability/champva/apply-form-10-10d/introduction

Download form:
https://www.va.gov/forms/10-10d/

Login.gov:
https://www.login.gov/create-an-account/

ID.me:
https://www.id.me/

Veterans Education Network video walkthrough: coming soon`;

    try {
      await Share.share({ message });
    } catch {
      Alert.alert('Could not share', 'Please try again in a moment.');
    }
  };

  const openExternalSite = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        Alert.alert('Could not open link', 'This device cannot open that page right now.');
        return;
      }

      await Linking.openURL(url);
    } catch {
      Alert.alert('Could not open link', 'Please try again in a moment.');
    }
  };

  const openChapter35Link = (url: string) => {
    Alert.alert(
      'Before you open this',
      'The spouse or child is the applicant. This application is completed by the family member, and payments go to the family member.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            try {
              const supported = await Linking.canOpenURL(url);

              if (!supported) {
                Alert.alert('Could not open link', 'This device cannot open that VA page right now.');
                return;
              }

              await Linking.openURL(url);
            } catch {
              Alert.alert('Could not open link', 'Please try again in a moment.');
            }
          },
        },
      ],
    );
  };

  const [showChapter35Card, setShowChapter35Card] = useState(false);
  const [showFormHelp, setShowFormHelp] = useState(false);
  const [showDicFormHelp, setShowDicFormHelp] = useState(false);
  const [showLoginOptions, setShowLoginOptions] = useState(false);
  const [showChampvaCard, setShowChampvaCard] = useState(false);
  const [showPrepareFutureCard, setShowPrepareFutureCard] = useState(false);
  const [selectedPrepareFutureTab, setSelectedPrepareFutureTab] = useState<PrepareFutureTab>('dic');
  const [openGuideSections, setOpenGuideSections] = useState<Record<string, boolean>>({
    before_you_start: true,
  });
  const [openDicGuideSections, setOpenDicGuideSections] = useState<Record<string, boolean>>({
    dic_q1: true,
  });
  const [openWillSections, setOpenWillSections] = useState<Record<string, boolean>>({});
  const toggleWillSection = (id: string) => {
    setOpenWillSections((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };
  const [openBurialSections, setOpenBurialSections] = useState<Record<string, boolean>>({});
  const [form22_5490Draft, setForm22_5490Draft] = React.useState<FormDraft>(
    makeDefaultDraft(
      'va_form_22_5490',
      'VA Form 22-5490 — DEA / Fry Scholarship Application',
      'online',
      'https://www.va.gov/family-and-caregiver-benefits/education-and-careers/apply-for-dea-fry-form-22-5490/introduction',
      'online',
      {},
      true,
      true,
    )
  );

  React.useEffect(() => {
    loadDraft('va_form_22_5490').then((saved) => {
      if (saved) {
        setForm22_5490Draft((current) => ({
          ...saved,
          officialUrl: current.officialUrl,
        }));
      }
    });
  }, []);

  const [form10_0137Draft, setForm10_0137Draft] = React.useState<FormDraft>(
    makeDefaultDraft(
      'va_form_10_0137',
      'VA Form 10-0137 — Health Care / Living Will',
      'pdf',
      'https://www.va.gov/forms/10-0137/',
      'mail',
      {},
      true,
      true,
    )
  );

  React.useEffect(() => {
    loadDraft('va_form_10_0137').then((saved) => {
      if (saved) {
        setForm10_0137Draft((current) => ({
          ...saved,
          officialUrl: current.officialUrl,
        }));
      }
    });
  }, []);

  const [form21p530ezDraft, setForm21p530ezDraft] = React.useState<FormDraft>(
    makeDefaultDraft(
      'va_form_21p_530ez',
      'VA Form 21P-530EZ — Burial Benefits Claim',
      'hybrid',
      'https://www.va.gov/burials-memorials/veterans-burial-allowance/',
      'online',
      {},
      true,
      true,
    )
  );

  React.useEffect(() => {
    loadDraft('va_form_21p_530ez').then((saved) => {
      if (saved) {
        setForm21p530ezDraft((current) => ({
          ...saved,
          officialUrl: current.officialUrl,
        }));
      }
    });
  }, []);

  const [form40_10007Draft, setForm40_10007Draft] = React.useState<FormDraft>(
    makeDefaultDraft(
      'va_form_40_10007',
      'VA Form 40-10007 — Pre-Need Burial Eligibility',
      'hybrid',
      'https://www.va.gov/burials-memorials/pre-need-eligibility/',
      'mail',
      {},
      true,
      true,
    )
  );

  React.useEffect(() => {
    loadDraft('va_form_40_10007').then((saved) => {
      if (saved) {
        setForm40_10007Draft((current) => ({
          ...saved,
          officialUrl: current.officialUrl,
        }));
      }
    });
  }, []);
  const toggleBurialSection = (id: string) => {
    setOpenBurialSections((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };
  const assessment = useMemo(() => getChapter35Assessment(veteranProfile), [veteranProfile]);
  const statusMeta = STATUS_COPY[assessment.status];
  const champvaAssessment = useMemo(() => getChampvaAssessment(veteranProfile), [veteranProfile]);
  const willGuideSections: GuideSection[] = [
    {
      id: 'will_before_start',
      title: 'Before You Start',
      emoji: '📋',
      helper: 'Review these items before you begin preparing your will.',
      bullets: [
        'Check whether you are eligible for the VA online will-preparation benefit',
        'Gather your 8-digit claim number if you are using the VA path',
        'Think through who should receive your property',
        'Decide who should serve as executor or personal representative',
        'Decide who should care for minor children, if applicable',
        'Review your beneficiary designations separately — some assets do not pass through a will',
      ],
    },
    {
      id: 'will_step1',
      title: 'Check Eligibility',
      emoji: '✅',
      helper: 'The VA online will-preparation service is only available to certain beneficiaries.',
      bullets: [
        'SGLI beneficiaries',
        'VGLI beneficiaries',
        'FSGLI beneficiaries',
        'Servicemembers who received TSGLI benefits',
      ],
      note: 'If you are not in one of these groups, you will need to prepare a will through a private attorney or another service.',
    },
    {
      id: 'will_step2',
      title: 'Gather What You Need',
      emoji: '📁',
      helper: 'The key VA requirement is your 8-digit claim number (SGLI, TSGLI, FSGLI, or VGLI).',
      bullets: [
        'Who gets what',
        'Who will handle the estate (executor)',
        'Guardians for minor children',
        'Any special people or charities you want included',
      ],
    },
    {
      id: 'will_step3',
      title: 'Use the VA-Linked Online Will-Preparation Service',
      emoji: '💻',
      helper: 'Go to FinancialPoint through the VA benefit link in the Forms and Links section below.',
      bullets: [
        'Register as a first-time user',
        'Use Organization Web ID: BFCSVA',
        'Enter your claim number when prompted',
        'Select EstateGuidance® to create and print your will',
      ],
    },
    {
      id: 'will_step4',
      title: 'Review What Your Will Does and Does Not Cover',
      emoji: '🔍',
      helper: 'Some assets pass outside your will.',
      bullets: [
        'Life insurance policies go to the named beneficiary, not through your will',
        'Retirement accounts with named beneficiaries pass outside your will',
        'Payable-on-death bank accounts pass outside your will',
        'Some jointly owned property may pass outside your will',
      ],
      note: 'Review your beneficiary designations separately.',
    },
    {
      id: 'will_step5',
      title: 'Sign It Correctly',
      emoji: '✍️',
      helper: 'Your will must be signed under the rules of your state.',
      bullets: [
        'General rule: sign with at least 2 witnesses',
      ],
      note: 'State rules can vary — confirm the requirements where you live.',
    },
    {
      id: 'will_step6',
      title: 'Store It Where Loved Ones Can Find It',
      emoji: '🏠',
      helper: 'Keep your will and other future-planning documents together in one clear location.',
      bullets: [
        'Choose a location your family or trusted person can access when needed',
        'Let your executor or trusted person know where the documents are kept',
      ],
    },
    {
      id: 'will_step7',
      title: 'Complete Medical Decision Planning Too',
      emoji: '🏥',
      helper: 'VA Form 10-0137 is a separate form from your property-distribution will.',
      bullets: [
        'VA Form 10-0137 lets you name a medical decision-maker',
        'It also records your treatment wishes with VA',
        'This is for health care decisions, not property distribution',
      ],
      note: 'Find the link to VA Form 10-0137 in the Forms and Links section below.',
    },
  ];
  const guideSections: GuideSection[] = [
    {
      id: 'before_you_start',
      title: 'Before you start',
      emoji: '📝',
      helper: 'Have these details ready before the spouse or child starts the application.',
      bullets: [
        'Before you tap Apply online, set up and verify your Login.gov or ID.me account first so the process goes more smoothly.',
        'Your full name',
        'Your Social Security number',
        'Your date of birth',
        'Your mailing address',
        'Your phone and email',
        'Your bank account and routing number for direct deposit',
        'The Veteran or service member’s full name',
        'The Veteran or service member’s Social Security number or VA file number',
        'Service branch',
        'Date of birth',
        'Date of death if applicable',
        'Your relationship to the Veteran or service member',
      ],
    },
    {
      id: 'apply_online',
      title: 'Apply online',
      emoji: '💻',
      helper: 'These are the first steps after you tap Apply online.',
      bullets: [
        'After the VA page opens, scroll to the bottom and tap “Sign in to start your application.”',
        'Use the spouse or child applicant’s own sign-in account, because the family member is the applicant.',
      ],
      note: 'Veterans Education Network video walkthrough: coming soon.',
    },
    {
      id: 'about_you',
      title: 'About you',
      emoji: '👤',
      helper: 'The spouse or child fills in their own personal details here.',
      bullets: [
        'Your Social Security number',
        'Your date of birth',
        'Your full name',
        'Your mailing address',
        'Your phone number',
        'Your email address',
      ],
      note: 'This part is about the family member applicant, not the Veteran.',
    },
    {
      id: 'direct_deposit',
      title: 'Direct deposit',
      emoji: '🏦',
      helper: 'Chapter 35 / DEA payments go to the family member applicant.',
      bullets: [
        'Routing number',
        'Account number',
        'Account type',
      ],
      note: 'Use the applicant’s bank account here, not the Veteran’s account.',
    },
    {
      id: 'about_veteran',
      title: 'About the Veteran or service member',
      emoji: '🎖️',
      helper: 'The family member will still need a few Veteran or service details to finish the form.',
      bullets: [
        'Full name',
        'Social Security number or VA file number',
        'Service branch',
        'Date of birth',
        'Date of death if applicable',
      ],
    },
    {
      id: 'relationship',
      title: 'Relationship',
      emoji: '👨‍👩‍👧',
      helper: 'Choose the relationship that matches the applicant.',
      bullets: [
        'Spouse',
        'Biological child',
        'Stepchild',
        'Adopted child',
      ],
    },
    {
      id: 'benefit_type',
      title: 'Which education benefit are you applying for',
      emoji: '🎓',
      helper: 'This guide is focused on Chapter 35 / DEA first.',
      note: 'Some applicants may also see Fry Scholarship questions. This step does not build Fry logic yet, so just read that part carefully if it appears.',
    },
    {
      id: 'school_and_age',
      title: 'School and age questions',
      emoji: '🏫',
      helper: 'The form may ask for a few school and age details before you continue.',
      bullets: [
        'School status',
        'High school graduation or GED information',
        'Age-related information if the applicant is under 18',
      ],
    },
    {
      id: 'prior_benefits',
      title: 'Prior VA education benefits',
      emoji: '📚',
      helper: 'If the applicant used VA education benefits before, answer this part carefully.',
      note: 'Small date or program mistakes can slow things down, so double-check earlier VA education benefit answers.',
    },
    {
      id: 'applicant_service',
      title: 'Applicant military service',
      emoji: '🪖',
      helper: 'This section is only about the family member applicant if they personally served.',
      note: 'If the spouse or child did not serve, answer that section based on their own history only.',
    },
    {
      id: 'signature',
      title: 'Signature',
      emoji: '✍️',
      helper: 'The family member signs their own application.',
      note: 'If the applicant is under 18, a parent, guardian, or custodian may need to complete that part.',
    },
    {
      id: 'important_note',
      title: 'Important note',
      emoji: '⚠️',
      helper: 'Use this guide as simple help while you fill out the form.',
      bullets: [
        'This app gives guidance only',
        'VA makes the final decision',
        'Read each question carefully before submitting',
      ],
      warning: 'Take your time and review each answer before sending the application.',
    },
  ];
  const dicGuideQuestions: PlainQuestionGuideItem[] = [
    {
      id: 'dic_q1',
      title: 'Who is applying?',
      helpText: 'Choose whether the applicant is the surviving spouse or surviving child.',
    },
    {
      id: 'dic_q2',
      title: 'Which benefit path is this form for?',
      helpText: 'Use this form when the survivor is applying after the death of a Veteran.',
    },
    {
      id: 'dic_q3',
      title: 'Who was the Veteran?',
      helpText: 'Enter the Veteran’s identifying details and service information exactly as requested on the form.',
    },
    {
      id: 'dic_q4',
      title: 'What happened to the Veteran?',
      helpText: 'Be ready to provide the date of death and the cause of death information the form asks for.',
    },
    {
      id: 'dic_q5',
      title: 'What is the survivor’s relationship to the Veteran?',
      helpText: 'Be ready to enter the relationship details that apply to the spouse or child.',
    },
    {
      id: 'dic_q6',
      title: 'What supporting records may be needed?',
      helpText: 'Have the records that match the survivor’s situation ready, such as the death certificate and relationship records.',
    },
    {
      id: 'dic_q7',
      title: 'Before submitting',
      helpText: 'Review the form carefully and make sure the survivor information, Veteran information, and supporting records all match.',
    },
  ];

  const toggleGuideSection = (id: string) => {
    setOpenGuideSections((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

  const toggleDicGuideSection = (id: string) => {
    setOpenDicGuideSections((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Dependents & Family</Text>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <TouchableOpacity
            style={styles.benefitCardHeader}
            onPress={() => setShowChapter35Card((current) => !current)}
            activeOpacity={0.85}
          >
            <View style={styles.benefitCardHeaderCopy}>
              <Text style={styles.heroEyebrow}>FIRST FAMILY BENEFIT CARD</Text>
              <Text style={styles.heroTitle}>Chapter 35 / DEA for Spouse or Child</Text>
              <Text style={styles.heroBody}>
                This benefit can help an eligible spouse or child pay for school or training. Payments go to the eligible family member, not to the Veteran.
              </Text>
            </View>
            <Text style={styles.expandIcon}>{showChapter35Card ? '−' : '+'}</Text>
          </TouchableOpacity>
        </View>

        {showChapter35Card && (
          <>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Who applies</Text>
              <Text style={styles.bodyText}>
                The spouse or child must apply for this benefit themselves.
              </Text>
              <Text style={styles.bodyText}>
                This is the family member&apos;s application flow. The Veteran may still need to share rating or service details, but the family member is the applicant.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Eligibility status</Text>
              <View style={[styles.statusBox, { backgroundColor: statusMeta.bg, borderColor: statusMeta.color }]}>
                <Text style={styles.statusEmoji}>{statusMeta.emoji}</Text>
                <View style={styles.statusCopy}>
                  <Text style={[styles.statusLabel, { color: statusMeta.color }]}>{statusMeta.label}</Text>
                  <Text style={styles.statusNote}>This is a likely eligibility guide, not a final VA decision.</Text>
                </View>
              </View>

              <Text style={styles.subsectionTitle}>Why the app thinks that</Text>
              <Text style={styles.bodyText}>{assessment.reason}</Text>
              <Text style={styles.supportNote}>
                Other Chapter 35 paths may exist, including service-connected death or other qualifying situations. This first card does not build those paths yet.
              </Text>

              {assessment.missingItems.length > 0 && (
                <View style={styles.missingInfoBox}>
                  <Text style={styles.missingInfoTitle}>Missing information</Text>
                  <Text style={styles.bodyText}>
                    We need a little more from the Veteran profile before this card can give a stronger guide.
                  </Text>
                  {assessment.missingItems.map((item) => (
                    <Text key={item} style={styles.missingInfoItem}>• {item}</Text>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.card}>
              <TouchableOpacity
                style={styles.expandHeader}
                onPress={() => setShowFormHelp((current) => !current)}
                activeOpacity={0.8}
              >
                <Text style={styles.sectionTitle}>How to fill out VA Form 22-5490</Text>
                <Text style={styles.expandIcon}>{showFormHelp ? '−' : '+'}</Text>
              </TouchableOpacity>
              {showFormHelp && (
                <View style={styles.guideWrapper}>
                  <View style={styles.guideIntroBox}>
                    <Text style={styles.guideIntroTitle}>For the spouse or child applicant</Text>
                    <Text style={styles.bodyText}>
                      The spouse or child completes this application. Payments go to the family member&apos;s account, but the form still asks for some Veteran or service member information.
                    </Text>
                  </View>

                  {guideSections.map((section, index) => {
                    const isOpen = Boolean(openGuideSections[section.id]);

                    return (
                      <View key={section.id} style={styles.guideSectionCard}>
                        <TouchableOpacity
                          style={styles.guideSectionHeader}
                          onPress={() => toggleGuideSection(section.id)}
                          activeOpacity={0.85}
                        >
                          <View style={styles.guideSectionHeaderCopy}>
                            <Text style={styles.guideStepLabel}>Step {index + 1}</Text>
                            <Text style={styles.guideSectionTitle}>
                              {section.emoji} {section.title}
                            </Text>
                          </View>
                          <Text style={styles.guideSectionIcon}>{isOpen ? '−' : '+'}</Text>
                        </TouchableOpacity>

                        {isOpen && (
                          <View style={styles.guideSectionBody}>
                            {section.helper ? <Text style={styles.guideHelper}>{section.helper}</Text> : null}
                            {section.bullets?.map((bullet) => (
                              <Text key={bullet} style={styles.guideBullet}>• {bullet}</Text>
                            ))}
                            {section.note ? <Text style={styles.guideNote}>{section.note}</Text> : null}
                            {section.warning ? (
                              <View style={styles.guideWarningBox}>
                                <Text style={styles.guideWarningText}>{section.warning}</Text>
                              </View>
                            ) : null}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            <View style={styles.card}>
              <TouchableOpacity
                style={styles.expandHeader}
                onPress={() => setShowLoginOptions((current) => !current)}
                activeOpacity={0.8}
              >
                <Text style={styles.sectionTitle}>Login Options</Text>
                <Text style={styles.expandIcon}>{showLoginOptions ? '−' : '+'}</Text>
              </TouchableOpacity>
              {showLoginOptions && (
                <View style={styles.loginOptionsWrapper}>
                  <Text style={styles.bodyText}>
                    Set this up before tapping Apply online so the process goes more smoothly.
                  </Text>
                  <Text style={styles.bodyText}>
                    Use the spouse or child applicant&apos;s own sign-in account.
                  </Text>
                  <Text style={styles.bodyText}>
                    After the VA page opens, scroll to the bottom and tap &ldquo;Sign in to start your application.&rdquo;
                  </Text>

                  <View style={styles.loginOptionCard}>
                    <Text style={styles.loginOptionTitle}>ID.me</Text>
                    <Text style={styles.guideHelper}>
                      The spouse or child applicant should create and verify their own account first.
                    </Text>
                    <TouchableOpacity
                      style={styles.secondaryButtonFull}
                      activeOpacity={0.85}
                      onPress={() => openExternalSite('https://www.id.me/')}
                    >
                      <Text style={styles.secondaryButtonText}>Open ID.me</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.loginOptionCard}>
                    <Text style={styles.loginOptionTitle}>Login.gov</Text>
                    <Text style={styles.guideHelper}>
                      The spouse or child applicant should create and verify their own account first.
                    </Text>
                    <TouchableOpacity
                      style={styles.secondaryButtonFull}
                      activeOpacity={0.85}
                      onPress={() => openExternalSite('https://www.login.gov/create-an-account/')}
                    >
                      <Text style={styles.secondaryButtonText}>Open Login.gov</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Form</Text>
              <Text style={styles.formName}>VA Form 22-5490</Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  activeOpacity={0.85}
                  onPress={() => openChapter35Link('https://www.va.gov/family-and-caregiver-benefits/education-and-careers/apply-for-dea-fry-form-22-5490/introduction')}
                >
                  <Text style={styles.primaryButtonText}>Apply online</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  activeOpacity={0.85}
                  onPress={() => openChapter35Link('https://www.va.gov/forms/22-5490/')}
                >
                  <Text style={styles.secondaryButtonText}>Download form</Text>
                </TouchableOpacity>
              </View>

              {/* Form Workspace — 22-5490 */}
              <FormWorkspaceCard
                draft={form22_5490Draft}
                onDraftChange={setForm22_5490Draft}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Family handoff</Text>
              <Text style={styles.bodyText}>
                The family member must complete the application themselves.
              </Text>
              <TouchableOpacity
                style={styles.secondaryButtonFull}
                activeOpacity={0.85}
                onPress={shareFamilyHandoff}
              >
                <Text style={styles.secondaryButtonText}>Send to spouse or child</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Video help</Text>
              <TouchableOpacity style={styles.linkButton} activeOpacity={0.8}>
                <Text style={styles.linkButtonText}>Watch Veterans Education Network video</Text>
              </TouchableOpacity>
              <Text style={styles.placeholderText}>Placeholder URL</Text>
            </View>

            <View style={styles.noteCard}>
              <Text style={styles.noteTitle}>Important</Text>
              <Text style={styles.noteText}>
                This app gives a likely eligibility guide based on available information. VA makes the final decision.
              </Text>
            </View>
          </>
        )}

        <View style={styles.heroCard}>
          <TouchableOpacity
            style={styles.benefitCardHeader}
            onPress={() => setShowChampvaCard((current) => !current)}
            activeOpacity={0.85}
          >
            <View style={styles.benefitCardHeaderCopy}>
              <Text style={styles.heroEyebrow}>SECOND FAMILY BENEFIT CARD</Text>
              <Text style={styles.heroTitle}>CHAMPVA for Spouse or Child</Text>
            </View>
            <Text style={styles.expandIcon}>{showChampvaCard ? '−' : '+'}</Text>
          </TouchableOpacity>

          {showChampvaCard && (
            <View style={styles.benefitCardBody}>
              <View
                style={[
                  styles.statusBox,
                  styles.champvaStatusBox,
                  { backgroundColor: champvaAssessment.bg, borderColor: champvaAssessment.color },
                ]}
              >
                <Text style={styles.statusEmoji}>{champvaAssessment.emoji}</Text>
                <View style={styles.statusCopy}>
                  <Text style={[styles.statusLabel, { color: champvaAssessment.color }]}>
                    {champvaAssessment.title}
                  </Text>
                  <Text style={styles.statusNote}>{champvaAssessment.body}</Text>
                </View>
              </View>
              <View style={styles.infoNoteBox}>
                <Text style={styles.guideIntroTitle}>Important to know</Text>
                <Text style={styles.infoNoteText}>
                  CHAMPVA is not the same as TRICARE.
                </Text>
                <Text style={styles.infoNoteText}>
                  If the spouse or child qualifies for TRICARE, they usually cannot use CHAMPVA.
                </Text>
              </View>
              <Text style={styles.heroBody}>
                CHAMPVA may help cover health care for a spouse or child of a qualifying Veteran.
              </Text>
              <View style={styles.champvaApplySection}>
                <Text style={styles.sectionTitle}>What you may need</Text>
                <Text style={styles.bodyText}>
                  Before applying, gather the documents that match the family member&apos;s situation.
                </Text>
                <Text style={styles.guideBullet}>• Health insurance card</Text>
                <Text style={styles.guideBullet}>• Medicare card if the applicant has Medicare</Text>
                <Text style={styles.guideBullet}>
                  • School enrollment proof for a child age 18 to 23
                </Text>
                <View style={styles.infoNoteBox}>
                  <Text style={styles.infoNoteText}>
                    If the applicant has Medicare or other health insurance, VA may ask for extra
                    insurance information too.
                  </Text>
                </View>
              </View>
              <View style={styles.champvaApplySection}>
                <Text style={styles.sectionTitle}>Login Options</Text>
                <Text style={styles.bodyText}>
                  Set up Login.gov or ID.me before applying online.
                </Text>
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    activeOpacity={0.85}
                    onPress={() => openExternalSite('https://www.login.gov/create-an-account/')}
                  >
                    <Text style={styles.primaryButtonText}>Login.gov</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    activeOpacity={0.85}
                    onPress={() => openExternalSite('https://www.id.me/')}
                  >
                    <Text style={styles.secondaryButtonText}>ID.me</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.champvaApplySection}>
                <Text style={styles.sectionTitle}>Apply for CHAMPVA</Text>
                <Text style={styles.bodyText}>
                  A spouse or child can apply for CHAMPVA online or download the application form.
                </Text>
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    activeOpacity={0.85}
                    onPress={() => openExternalSite('https://www.va.gov/family-and-caregiver-benefits/health-and-disability/champva/apply-form-10-10d/introduction')}
                  >
                    <Text style={styles.primaryButtonText}>Apply online</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    activeOpacity={0.85}
                    onPress={() => openExternalSite('https://www.va.gov/forms/10-10d/')}
                  >
                    <Text style={styles.secondaryButtonText}>Download form</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.secondaryButtonFull}
                  activeOpacity={0.85}
                  onPress={shareChampvaHandoff}
                >
                  <Text style={styles.secondaryButtonText}>Send to spouse or child</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View style={styles.heroCard}>
          <TouchableOpacity
            style={styles.benefitCardHeader}
            onPress={() => setShowPrepareFutureCard((current) => !current)}
            activeOpacity={0.85}
          >
            <View style={styles.benefitCardHeaderCopy}>
              <Text style={styles.heroEyebrow}>PREPARE FOR THE FUTURE</Text>
              <Text style={styles.heroTitle}>Prepare for the Future</Text>
            </View>
            <Text style={styles.expandIcon}>{showPrepareFutureCard ? '−' : '+'}</Text>
          </TouchableOpacity>

          {showPrepareFutureCard && (
            <View style={styles.benefitCardBody}>
              <View style={styles.segmentedControl}>
                <TouchableOpacity
                  style={[
                    styles.segmentedButton,
                    selectedPrepareFutureTab === 'dic' && styles.segmentedButtonActive,
                  ]}
                  activeOpacity={0.85}
                  onPress={() => setSelectedPrepareFutureTab('dic')}
                >
                  <Text
                    style={[
                      styles.segmentedButtonText,
                      selectedPrepareFutureTab === 'dic' && styles.segmentedButtonTextActive,
                    ]}
                  >
                    DIC
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.segmentedButton,
                    selectedPrepareFutureTab === 'will' && styles.segmentedButtonActive,
                  ]}
                  activeOpacity={0.85}
                  onPress={() => setSelectedPrepareFutureTab('will')}
                >
                  <Text
                    style={[
                      styles.segmentedButtonText,
                      selectedPrepareFutureTab === 'will' && styles.segmentedButtonTextActive,
                    ]}
                  >
                    Preparing a Will
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.segmentedButton,
                    selectedPrepareFutureTab === 'burial' && styles.segmentedButtonActive,
                  ]}
                  activeOpacity={0.85}
                  onPress={() => setSelectedPrepareFutureTab('burial')}
                >
                  <Text
                    style={[
                      styles.segmentedButtonText,
                      selectedPrepareFutureTab === 'burial' && styles.segmentedButtonTextActive,
                    ]}
                  >
                    Burial Preparation
                  </Text>
                </TouchableOpacity>
              </View>

              {selectedPrepareFutureTab === 'dic' && (
                <>
                  <View style={styles.missingInfoBox}>
                    <Text style={styles.missingInfoTitle}>More information needed</Text>
                    <Text style={styles.bodyText}>
                      We need more information to tell if a surviving spouse or child may qualify for DIC.
                      {'\n\n'}
                      This usually depends on the survivor&apos;s relationship to the Veteran or service member and how the Veteran or service member died.
                      {'\n\n'}
                      If the survivor is a parent, they may need a different DIC path.
                    </Text>
                  </View>
                  <Text style={styles.heroBody}>
                    Dependency and Indemnity Compensation (DIC) may help support a surviving spouse or child in some situations.
                  </Text>
                  <View style={styles.dicPathSection}>
                    <Text style={styles.sectionTitle}>Which DIC path fits?</Text>
                    <Text style={styles.bodyText}>
                      The next step depends on whether the person who died was a Veteran or a service member who died on active duty.
                    </Text>
                    <View style={styles.dicPathCard}>
                      <Text style={styles.dicPathTitle}>Veteran death path</Text>
                      <Text style={styles.infoNoteText}>
                        If the survivor is applying after the death of a Veteran, this usually follows the VA Form 21P-534EZ path.
                      </Text>
                    </View>
                    <View style={styles.dicPathCard}>
                      <Text style={styles.dicPathTitle}>In-service death path</Text>
                      <Text style={styles.infoNoteText}>
                        If the survivor is applying after the death of a service member in the line of duty, this usually follows the VA Form 21P-534a path.
                      </Text>
                    </View>
                  </View>
                  <View style={styles.champvaApplySection}>
                    <Text style={styles.sectionTitle}>Get the right DIC form</Text>
                    <Text style={styles.bodyText}>
                      Open the form that matches the survivor&apos;s path.
                    </Text>
                    <View style={styles.buttonRow}>
                      <TouchableOpacity
                        style={styles.primaryButton}
                        activeOpacity={0.85}
                        onPress={() => openExternalSite('https://www.va.gov/forms/21p-534ez/')}
                      >
                        <Text style={styles.primaryButtonText}>Veteran death form</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.secondaryButton}
                        activeOpacity={0.85}
                        onPress={() => openExternalSite('https://www.va.gov/forms/21p-534a/')}
                      >
                        <Text style={styles.secondaryButtonText}>In-service death form</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={[styles.card, styles.dicGuideCard]}>
                    <TouchableOpacity
                      style={styles.expandHeader}
                      onPress={() => setShowDicFormHelp((current) => !current)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.sectionTitle}>How to fill out VA Form 21P-534EZ</Text>
                      <Text style={styles.expandIcon}>{showDicFormHelp ? '−' : '+'}</Text>
                    </TouchableOpacity>
                    {showDicFormHelp && (
                      <View style={styles.guideWrapper}>
                        <View style={styles.guideIntroBox}>
                          <Text style={styles.bodyText}>
                            Use this guide if the survivor is a spouse or child of a Veteran who died.
                          </Text>
                        </View>
                        {dicGuideQuestions.map((question, index) => {
                          const isOpen = Boolean(openDicGuideSections[question.id]);

                          return (
                            <View key={question.id} style={styles.guideSectionCard}>
                              <TouchableOpacity
                                style={styles.guideSectionHeader}
                                onPress={() => toggleDicGuideSection(question.id)}
                                activeOpacity={0.85}
                              >
                                <View style={styles.guideSectionHeaderCopy}>
                                  <Text style={styles.guideStepLabel}>Question {index + 1}</Text>
                                  <Text style={styles.guideSectionTitle}>{question.title}</Text>
                                </View>
                                <Text style={styles.guideSectionIcon}>{isOpen ? '−' : '+'}</Text>
                              </TouchableOpacity>
                              {isOpen && (
                                <View style={styles.guideSectionBody}>
                                  <Text style={styles.guideHelper}>{question.helpText}</Text>
                                </View>
                              )}
                            </View>
                          );
                        })}
                        <View style={styles.guideWarningBox}>
                          <Text style={styles.guideWarningText}>
                            If the person died on active duty, use the separate 21P-534a path shown above instead.
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                  <View style={styles.dicPathSection}>
                    <Text style={styles.sectionTitle}>Prepare now</Text>
                    <Text style={styles.bodyText}>
                      Use this section to help the Veteran prepare family information and important records before they are needed.
                    </Text>
                    <View style={styles.dicPathCard}>
                      <Text style={styles.infoNoteText}>
                        1. Tell family where important VA and service records are kept.
                      </Text>
                    </View>
                    <View style={styles.dicPathCard}>
                      <Text style={styles.infoNoteText}>
                        2. Keep marriage or child relationship records easy to find.
                      </Text>
                    </View>
                    <View style={styles.dicPathCard}>
                      <Text style={styles.infoNoteText}>
                        3. Keep the Veteran&apos;s identifying and service information together.
                      </Text>
                    </View>
                    <View style={styles.dicPathCard}>
                      <Text style={styles.infoNoteText}>
                        4. Make sure the family knows which DIC path may fit their situation.
                      </Text>
                    </View>
                    <View style={styles.noteCard}>
                      <Text style={styles.noteText}>
                        This does not replace VA rules. It helps the family prepare before they need to apply.
                      </Text>
                    </View>
                  </View>
                </>
              )}

              {selectedPrepareFutureTab === 'will' && (
                <View>
                  {/* Intro Box */}
                  <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Preparing a Will</Text>
                    <Text style={styles.bodyText}>
                      VA does not have one general last-will form for every Veteran.{'\n\n'}
                      If you qualify, VA offers a no-cost online will-preparation service through its life-insurance beneficiary program.{'\n\n'}
                      VA also offers a separate health care form for naming a medical decision-maker and recording your treatment wishes.
                    </Text>
                  </View>

                  {/* Before You Start + Step-by-Step Guide — expandable pattern */}
                  <View style={styles.card}>
                    <TouchableOpacity
                      style={styles.expandHeader}
                      onPress={() => toggleWillSection('will_guide_open')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.sectionTitle}>Before You Start & Step-by-Step Guide</Text>
                      <Text style={styles.expandIcon}>{openWillSections['will_guide_open'] ? '−' : '+'}</Text>
                    </TouchableOpacity>
                    {openWillSections['will_guide_open'] && (
                      <View style={styles.guideWrapper}>
                        <View style={styles.guideIntroBox}>
                          <Text style={styles.guideIntroTitle}>Preparing your will</Text>
                          <Text style={styles.bodyText}>
                            Work through each section below. Tap any step to expand it.
                          </Text>
                        </View>
                        {willGuideSections.map((section, index) => {
                          const isOpen = Boolean(openWillSections[section.id]);
                          return (
                            <View key={section.id} style={styles.guideSectionCard}>
                              <TouchableOpacity
                                style={styles.guideSectionHeader}
                                onPress={() => toggleWillSection(section.id)}
                                activeOpacity={0.85}
                              >
                                <View style={styles.guideSectionHeaderCopy}>
                                  <Text style={styles.guideStepLabel}>{index === 0 ? 'Before You Start' : `Step ${index}`}</Text>
                                  <Text style={styles.guideSectionTitle}>
                                    {section.emoji} {section.title}
                                  </Text>
                                </View>
                                <Text style={styles.guideSectionIcon}>{isOpen ? '−' : '+'}</Text>
                              </TouchableOpacity>
                              {isOpen && (
                                <View style={styles.guideSectionBody}>
                                  {section.helper ? <Text style={styles.guideHelper}>{section.helper}</Text> : null}
                                  {section.bullets?.map((bullet) => (
                                    <Text key={bullet} style={styles.guideBullet}>• {bullet}</Text>
                                  ))}
                                  {section.note ? <Text style={styles.guideNote}>{section.note}</Text> : null}
                                  {section.warning ? (
                                    <View style={styles.guideWarningBox}>
                                      <Text style={styles.guideWarningText}>{section.warning}</Text>
                                    </View>
                                  ) : null}
                                </View>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>

                  {/* Forms and Links */}
                  <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Forms and Links</Text>
                    <TouchableOpacity
                      style={styles.primaryButton}
                      activeOpacity={0.85}
                      onPress={() => openExternalSite('https://www.benefits.va.gov/insurance/bfcs.asp')}
                    >
                      <Text style={styles.primaryButtonText}>VA Online Will Preparation</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.secondaryButton, { marginTop: 10 }]}
                      activeOpacity={0.85}
                      onPress={() => openExternalSite('https://www.va.gov/forms/10-0137/')}
                    >
                      <Text style={styles.secondaryButtonText}>VA Form 10-0137 — Health Care / Living Will</Text>
                    </TouchableOpacity>

                    {/* Form Workspace — 10-0137 */}
                    <FormWorkspaceCard
                      draft={form10_0137Draft}
                      onDraftChange={setForm10_0137Draft}
                    />

                    <TouchableOpacity
                      style={[styles.secondaryButton, { marginTop: 10 }]}
                      activeOpacity={0.85}
                      onPress={() => openExternalSite('https://www.va.gov/forms/40-10007/')}
                    >
                      <Text style={styles.secondaryButtonText}>VA Form 40-10007 — Burial Pre-Need Planning</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Important Notes */}
                  <View style={[styles.card, { borderColor: Colors.gold, borderWidth: 1 }]}>
                    <Text style={styles.sectionTitle}>Important Notes</Text>
                    {[
                      'VA does not provide one universal will form for every Veteran',
                      'The VA online will-preparation path is limited to certain insurance beneficiaries and TSGLI recipients',
                      'VA Form 10-0137 is for health care decisions, not property distribution',
                      'A will must be signed under your state\'s law',
                      'Beneficiary designations should be reviewed separately from your will',
                    ].map((note, i) => (
                      <View key={i} style={{ flexDirection: 'row', marginBottom: 6 }}>
                        <Text style={[styles.bodyText, { marginRight: 8, color: Colors.gold }]}>•</Text>
                        <Text style={[styles.bodyText, { flex: 1 }]}>{note}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {selectedPrepareFutureTab === 'burial' && (
                <View>

                  {/* ── SECTION 1: PLAN AHEAD ── */}
                  <View style={styles.card}>
                    <Text style={styles.sectionTitle}>🕊️ Burial Preparation</Text>
                    <Text style={styles.bodyText}>
                      Planning ahead can reduce stress on the family later. A Veteran can apply for pre-need burial eligibility in a VA national cemetery before death using VA Form 40-10007.{'\n\n'}
                      If the Veteran has already passed away, skip this planning section and go directly to the After Death and Reimbursement sections below.
                    </Text>
                  </View>

                  {/* Plan Ahead — expandable guide */}
                  <View style={styles.card}>
                    <TouchableOpacity
                      style={styles.expandHeader}
                      onPress={() => toggleBurialSection('burial_plan_open')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.sectionTitle}>📋 Plan Ahead — Before Death</Text>
                      <Text style={styles.expandIcon}>{openBurialSections['burial_plan_open'] ? '−' : '+'}</Text>
                    </TouchableOpacity>
                    {openBurialSections['burial_plan_open'] && (
                      <View style={styles.guideWrapper}>
                        <View style={styles.guideIntroBox}>
                          <Text style={styles.guideIntroTitle}>What to gather now</Text>
                          <Text style={styles.bodyText}>
                            Having these ready makes the process easier for you and your family.
                          </Text>
                          {[
                            'Full legal name',
                            'Date of birth and Social Security number',
                            'Military service details and dates',
                            'DD214 or discharge/separation papers',
                            'Preferred cemetery if known',
                            'Spouse or dependent information if relevant',
                            'Trusted family contact or Co-Sponsor',
                            'Funeral home preference if known',
                            'Important end-of-life documents saved in the Document Vault',
                          ].map((item) => (
                            <Text key={item} style={styles.guideBullet}>• {item}</Text>
                          ))}
                        </View>

                        {[
                          {
                            id: 'burial_step1',
                            emoji: '🏛️',
                            title: 'Decide on a cemetery type',
                            helper: 'Choose whether you want burial in a VA national cemetery, a state or tribal Veterans cemetery, or a private cemetery. This affects which forms and processes apply.',
                          },
                          {
                            id: 'burial_step2',
                            emoji: '📄',
                            title: 'Gather your discharge documents',
                            helper: 'Your DD214 or other military discharge or separation papers are the most important documents for burial eligibility. Make sure your family knows where these are stored.',
                          },
                          {
                            id: 'burial_step3',
                            emoji: '📋',
                            title: 'Apply for pre-need burial eligibility',
                            helper: 'Use VA Form 40-10007 to apply before death for a pre-need determination of eligibility for burial in a VA national cemetery. This form is only for use before death. Submitting it early gives the family a clear approval letter to use when the time comes.',
                          },
                          {
                            id: 'burial_step4',
                            emoji: '🗄️',
                            title: 'Save your approval letter in the Document Vault',
                            helper: 'Once you receive a pre-need eligibility decision, save that letter and your supporting records in the Document Vault under Burial Preparation. Your family will need this later.',
                          },
                          {
                            id: 'burial_step5',
                            emoji: '👤',
                            title: 'Tell your trusted person where everything is',
                            helper: 'Make sure your family member, Co-Sponsor, or personal representative knows where your burial records are stored. They will need to find them quickly after death.',
                          },
                          {
                            id: 'burial_step6',
                            emoji: '🎖️',
                            title: 'Review optional memorial items',
                            helper: 'The family may want to request a burial flag, Presidential Memorial Certificate, government headstone or marker, or a medallion for a private cemetery marker. These are separate requests and are listed in the Memorial Items section below.',
                          },
                          {
                            id: 'burial_step7',
                            emoji: 'ℹ️',
                            title: 'Understand what happens after death',
                            helper: 'When death occurs, the family or funeral director arranges burial. After burial, the family may be able to file a reimbursement claim for eligible burial costs using VA Form 21P-530EZ. See the Reimbursement section below.',
                          },
                        ].map((section, index) => {
                          const isOpen = Boolean(openBurialSections[section.id]);
                          return (
                            <View key={section.id} style={styles.guideSectionCard}>
                              <TouchableOpacity
                                style={styles.guideSectionHeader}
                                onPress={() => toggleBurialSection(section.id)}
                                activeOpacity={0.85}
                              >
                                <View style={styles.guideSectionHeaderCopy}>
                                  <Text style={styles.guideStepLabel}>Step {index + 1}</Text>
                                  <Text style={styles.guideSectionTitle}>
                                    {section.emoji} {section.title}
                                  </Text>
                                </View>
                                <Text style={styles.guideSectionIcon}>{isOpen ? '−' : '+'}</Text>
                              </TouchableOpacity>
                              {isOpen && (
                                <View style={styles.guideSectionBody}>
                                  <Text style={styles.guideHelper}>{section.helper}</Text>
                                </View>
                              )}
                            </View>
                          );
                        })}

                        <TouchableOpacity
                          style={[styles.primaryButton, { marginTop: 12 }]}
                          activeOpacity={0.85}
                          onPress={() => openExternalSite('https://www.va.gov/burials-memorials/pre-need-eligibility/')}
                        >
                          <Text style={styles.primaryButtonText}>VA Pre-Need Eligibility Info</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.secondaryButton, { marginTop: 10 }]}
                          activeOpacity={0.85}
                          onPress={() => openExternalSite('https://www.va.gov/forms/40-10007/')}
                        >
                          <Text style={styles.secondaryButtonText}>VA Form 40-10007 — Pre-Need Application</Text>
                        </TouchableOpacity>

                        {/* Form Workspace — 40-10007 */}
                        <FormWorkspaceCard
                          draft={form40_10007Draft}
                          onDraftChange={setForm40_10007Draft}
                        />

                      </View>
                    )}
                  </View>

                  {/* ── SECTION 2: WHEN DEATH HAPPENS ── */}
                  <View style={styles.card}>
                    <TouchableOpacity
                      style={styles.expandHeader}
                      onPress={() => toggleBurialSection('burial_after_open')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.sectionTitle}>📞 After Death — What the Family Does Next</Text>
                      <Text style={styles.expandIcon}>{openBurialSections['burial_after_open'] ? '−' : '+'}</Text>
                    </TouchableOpacity>
                    {openBurialSections['burial_after_open'] && (
                      <View style={styles.guideWrapper}>
                        <View style={styles.guideIntroBox}>
                          <Text style={styles.guideIntroTitle}>At time of death</Text>
                          <Text style={styles.bodyText}>
                            If there is a pre-need approval letter, the family or funeral director should use it when arranging burial. If there is no approval letter, the family can still move forward with burial scheduling.
                          </Text>
                        </View>

                        <View style={styles.guideSectionCard}>
                          <Text style={[styles.guideStepLabel, { padding: 12 }]}>What the family may need at this stage</Text>
                          <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
                            {[
                              'Pre-need approval letter if available',
                              'DD214 or discharge paperwork',
                              'Death certificate when available',
                              'Funeral home contact information',
                              'Cemetery preference if known',
                            ].map((item) => (
                              <Text key={item} style={styles.guideBullet}>• {item}</Text>
                            ))}
                          </View>
                        </View>

                        <View style={styles.guideSectionCard}>
                          <Text style={[styles.guideStepLabel, { padding: 12 }]}>Scheduling burial in a VA national cemetery</Text>
                          <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
                            <Text style={styles.guideHelper}>
                              Contact the National Cemetery Scheduling Office to arrange burial in a VA national cemetery. The funeral director often helps with this process.
                            </Text>
                            <Text style={[styles.guideNote, { marginTop: 8 }]}>
                              📞 National Cemetery Scheduling Office{'\n'}
                              800-535-1117 (TTY: 711)
                            </Text>
                          </View>
                        </View>

                        <View style={styles.guideSectionCard}>
                          <Text style={[styles.guideStepLabel, { padding: 12 }]}>Military funeral honors</Text>
                          <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
                            <Text style={styles.guideHelper}>
                              Military funeral honors are usually requested through the funeral director or personal representative. The funeral director can help coordinate this.
                            </Text>
                          </View>
                        </View>

                        <View style={styles.guideSectionCard}>
                          <Text style={[styles.guideStepLabel, { padding: 12 }]}>Spouse or dependent burial eligibility</Text>
                          <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
                            <Text style={styles.guideHelper}>
                              In some cases, a Veteran's spouse or dependent may also be eligible for burial in a VA national cemetery. The funeral director or VA can provide guidance for the specific situation.
                            </Text>
                          </View>
                        </View>

                        <TouchableOpacity
                          style={[styles.primaryButton, { marginTop: 12 }]}
                          activeOpacity={0.85}
                          onPress={() => openExternalSite('https://www.va.gov/burials-memorials/schedule-a-burial/')}
                        >
                          <Text style={styles.primaryButtonText}>Schedule a VA Burial</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.secondaryButton, { marginTop: 10 }]}
                          activeOpacity={0.85}
                          onPress={() => openExternalSite('https://www.cem.va.gov/military_funeral_honors.asp')}
                        >
                          <Text style={styles.secondaryButtonText}>Military Funeral Honors Info</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {/* ── SECTION 3: REIMBURSEMENT ── */}
                  <View style={[styles.card, { borderColor: Colors.gold, borderWidth: 1 }]}>
                    <TouchableOpacity
                      style={styles.expandHeader}
                      onPress={() => toggleBurialSection('burial_reimburse_open')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.sectionTitle}>💰 Family Reimbursement for Burial Costs</Text>
                      <Text style={styles.expandIcon}>{openBurialSections['burial_reimburse_open'] ? '−' : '+'}</Text>
                    </TouchableOpacity>
                    {openBurialSections['burial_reimburse_open'] && (
                      <View style={styles.guideWrapper}>
                        <View style={styles.guideIntroBox}>
                          <Text style={styles.guideIntroTitle}>VA Form 21P-530EZ — Burial Benefits Claim</Text>
                          <Text style={styles.bodyText}>
                            After death, the family may be able to apply for a burial allowance to help with eligible costs. This is not automatic for everyone and is not guaranteed. Eligibility depends on factors like the type of death and who paid the expenses.
                          </Text>
                        </View>

                        <View style={styles.guideSectionCard}>
                          <Text style={[styles.guideStepLabel, { padding: 12 }]}>What this may help cover</Text>
                          <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
                            {[
                              'Burial and funeral expenses (depending on eligibility)',
                              'Plot or interment expenses (depending on eligibility)',
                              'Transportation of the Veteran\'s remains (depending on eligibility)',
                            ].map((item) => (
                              <Text key={item} style={styles.guideBullet}>• {item}</Text>
                            ))}
                          </View>
                        </View>

                        <View style={[styles.guideSectionCard, { borderColor: Colors.gold, borderWidth: 1 }]}>
                          <View style={{ padding: 12 }}>
                            <Text style={[styles.guideStepLabel, { color: Colors.gold }]}>⏰ Important time limit</Text>
                            <Text style={[styles.guideHelper, { marginTop: 6 }]}>
                              For many non-service-connected burial claims, the family may need to file within 2 years after burial. Do not wait too long to look into this.
                            </Text>
                          </View>
                        </View>

                        <View style={styles.guideSectionCard}>
                          <Text style={[styles.guideStepLabel, { padding: 12 }]}>Note on automatic payments</Text>
                          <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
                            <Text style={styles.guideHelper}>
                              Some eligible surviving spouses already on the Veteran's VA record may receive an automatic payment in some cases. If another family member or another person paid the expenses, they should review the claim path carefully.
                            </Text>
                          </View>
                        </View>

                        <View style={styles.guideSectionCard}>
                          <Text style={[styles.guideStepLabel, { padding: 12 }]}>What to gather for the reimbursement claim</Text>
                          <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
                            {[
                              'Death certificate',
                              'Itemized funeral or burial receipts',
                              'Transportation receipts if claiming transportation',
                              'DD214 or discharge papers',
                              'Medical records if claiming service-connected death',
                            ].map((item) => (
                              <Text key={item} style={styles.guideBullet}>• {item}</Text>
                            ))}
                          </View>
                        </View>

                        <TouchableOpacity
                          style={[styles.primaryButton, { marginTop: 12 }]}
                          activeOpacity={0.85}
                          onPress={() => openExternalSite('https://www.va.gov/burials-memorials/veterans-burial-allowance/')}
                        >
                          <Text style={styles.primaryButtonText}>VA Burial Allowance Info</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.secondaryButton, { marginTop: 10 }]}
                          activeOpacity={0.85}
                          onPress={() => openExternalSite('https://www.va.gov/burials-memorials/veterans-burial-allowance/apply-for-allowance-form-21p-530ez/')}
                        >
                          <Text style={styles.secondaryButtonText}>Apply — VA Form 21P-530EZ</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.secondaryButton, { marginTop: 10 }]}
                          activeOpacity={0.85}
                          onPress={() => openExternalSite('https://www.va.gov/forms/21p-530ez/')}
                        >
                          <Text style={styles.secondaryButtonText}>VA Form 21P-530EZ — Direct Form Link</Text>
                        </TouchableOpacity>

                        {/* Form Workspace — 21P-530EZ */}
                        <FormWorkspaceCard
                          draft={form21p530ezDraft}
                          onDraftChange={setForm21p530ezDraft}
                        />

                      </View>
                    )}
                  </View>

                  {/* ── SECTION 4: MEMORIAL ITEMS ── */}
                  <View style={styles.card}>
                    <TouchableOpacity
                      style={styles.expandHeader}
                      onPress={() => toggleBurialSection('burial_memorial_open')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.sectionTitle}>🎖️ Other VA Memorial Items</Text>
                      <Text style={styles.expandIcon}>{openBurialSections['burial_memorial_open'] ? '−' : '+'}</Text>
                    </TouchableOpacity>
                    {openBurialSections['burial_memorial_open'] && (
                      <View style={styles.guideWrapper}>
                        <View style={styles.guideIntroBox}>
                          <Text style={styles.bodyText}>
                            These items are separate requests the family may make to honor the Veteran.
                          </Text>
                        </View>
                        {[
                          {
                            id: 'memorial_flag',
                            emoji: '🚩',
                            title: 'Burial Flag — VA Form 27-2008',
                            helper: 'A United States flag may be provided to drape the casket or accompany the urn of a Veteran who served honorably. The funeral director usually helps request this.',
                          },
                          {
                            id: 'memorial_pmc',
                            emoji: '📜',
                            title: 'Presidential Memorial Certificate — VA Form 40-0247',
                            helper: 'An engraved paper certificate signed by the President of the United States, expressing the nation\'s gratitude for the Veteran\'s service. Family members and loved ones may request this.',
                          },
                          {
                            id: 'memorial_headstone',
                            emoji: '🪨',
                            title: 'Headstone or Marker — VA Form 40-1330',
                            helper: 'The government may provide a headstone or marker for an eligible Veteran\'s grave. This can be for a burial in a national, state Veterans, or private cemetery.',
                          },
                          {
                            id: 'memorial_medallion',
                            emoji: '🏅',
                            title: 'Medallion for Private Cemetery — VA Form 40-1330M',
                            helper: 'Instead of a full headstone, the family may request a government medallion to affix to a privately purchased headstone or marker at a private cemetery.',
                          },
                        ].map((section) => {
                          const isOpen = Boolean(openBurialSections[section.id]);
                          return (
                            <View key={section.id} style={styles.guideSectionCard}>
                              <TouchableOpacity
                                style={styles.guideSectionHeader}
                                onPress={() => toggleBurialSection(section.id)}
                                activeOpacity={0.85}
                              >
                                <View style={styles.guideSectionHeaderCopy}>
                                  <Text style={styles.guideSectionTitle}>
                                    {section.emoji} {section.title}
                                  </Text>
                                </View>
                                <Text style={styles.guideSectionIcon}>{isOpen ? '−' : '+'}</Text>
                              </TouchableOpacity>
                              {isOpen && (
                                <View style={styles.guideSectionBody}>
                                  <Text style={styles.guideHelper}>{section.helper}</Text>
                                </View>
                              )}
                            </View>
                          );
                        })}
                        <TouchableOpacity
                          style={[styles.primaryButton, { marginTop: 12 }]}
                          activeOpacity={0.85}
                          onPress={() => openExternalSite('https://www.cem.va.gov/burial-memorial-benefits/')}
                        >
                          <Text style={styles.primaryButtonText}>VA Burial & Memorial Benefits</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.secondaryButton, { marginTop: 10 }]}
                          activeOpacity={0.85}
                          onPress={() => openExternalSite('https://www.va.gov/burials-memorials/memorial-items/presidential-memorial-certificates/')}
                        >
                          <Text style={styles.secondaryButtonText}>Presidential Memorial Certificate</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.secondaryButton, { marginTop: 10 }]}
                          activeOpacity={0.85}
                          onPress={() => openExternalSite('https://www.cem.va.gov/hmm/order_instructions.asp')}
                        >
                          <Text style={styles.secondaryButtonText}>Headstone / Marker / Medallion Info</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {/* ── DOCUMENT VAULT LINK ── */}
                  <View style={styles.card}>
                    <Text style={styles.sectionTitle}>🗄️ Store Burial Documents in the Vault</Text>
                    <Text style={styles.bodyText}>
                      Keep all burial planning records in one place your family can find quickly. The Document Vault has a Burial Preparation section for storing your DD214, pre-need approval letter, cemetery preferences, funeral home information, and all related paperwork.
                    </Text>
                  </View>

                  {/* ── SECTION 5: NCA ── */}
                  <View style={styles.card}>
                    <TouchableOpacity
                      style={styles.expandHeader}
                      onPress={() => toggleBurialSection('burial_nca_open')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.sectionTitle}>🏛️ National Cemetery Administration (NCA)</Text>
                      <Text style={styles.expandIcon}>{openBurialSections['burial_nca_open'] ? '−' : '+'}</Text>
                    </TouchableOpacity>
                    {openBurialSections['burial_nca_open'] && (
                      <View style={styles.guideWrapper}>

                        {/* Intro */}
                        <View style={styles.guideIntroBox}>
                          <Text style={styles.bodyText}>
                            The National Cemetery Administration helps Veterans and eligible family members with burial in VA national cemeteries, memorial benefits, and planning ahead so families have less stress later.{'\n\n'}
                            This section covers preparation before time of need and explains what the family will need to do when that time comes.{'\n\n'}
                            Burial eligibility is based on factors like service history, discharge conditions, active duty or reserve or guard status in certain cases, and whether the person is an eligible spouse or dependent — not on a disability rating or percentage.
                          </Text>
                          <TouchableOpacity
                            style={[styles.primaryButton, { marginTop: 12 }]}
                            activeOpacity={0.85}
                            onPress={() => openExternalSite('https://www.cem.va.gov/burial-memorial-benefits/')}
                          >
                            <Text style={styles.primaryButtonText}>Open NCA Burial & Memorial Benefits</Text>
                          </TouchableOpacity>
                        </View>

                        {/* What NCA may provide */}
                        <View style={styles.guideSectionCard}>
                          <Text style={[styles.guideStepLabel, { padding: 12 }]}>What NCA may provide</Text>
                          <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
                            {[
                              'A gravesite in a VA national cemetery with available space',
                              'Opening and closing of the grave',
                              'Perpetual care of the gravesite',
                              'A government headstone, marker, or medallion',
                              'A Presidential Memorial Certificate',
                              'A burial flag',
                              'Possible burial allowance reimbursement in eligible cases',
                            ].map((item) => (
                              <Text key={item} style={styles.guideBullet}>• {item}</Text>
                            ))}
                            <Text style={[styles.guideNote, { marginTop: 8 }]}>
                              Cremated remains are buried or inurned in the same manner and with the same honors as casketed remains. Eligible spouses and dependents may also be buried in a VA national cemetery, including in some cases before the Veteran passes away.
                            </Text>
                          </View>
                        </View>

                        {/* Before You Start */}
                        <View style={styles.guideSectionCard}>
                          <Text style={[styles.guideStepLabel, { padding: 12 }]}>Before you start</Text>
                          <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
                            {[
                              'Burial can often be planned in advance through a pre-need determination of eligibility — this is specifically for before death. If the person has already died, the family uses the burial scheduling process instead.',
                              'Gather: full legal name, Social Security number, date of birth, military history, DD214 or discharge papers, and a preferred national cemetery.',
                              'If someone is applying on behalf of the Veteran, extra proof may be needed. VA Form 21-22 or 21-22a may also be required in some cases.',
                              'VA cannot guarantee a specific cemetery or gravesite in advance even if a preferred cemetery is listed.',
                              'The family should know where the DD214, important papers, and any pre-need decision letter are stored.',
                              'Funeral home or cremation provider services are generally not paid by VA/NCA and are usually the family\'s expense. A burial allowance reimbursement may be available in eligible situations.',
                            ].map((item) => (
                              <Text key={item} style={styles.guideBullet}>• {item}</Text>
                            ))}
                          </View>
                        </View>

                        {/* Step by step */}
                        {[
                          {
                            id: 'nca_step1',
                            emoji: '🏛️',
                            title: 'Confirm this is the right burial path',
                            helper: 'This section is for VA national cemetery planning and NCA memorial benefits. Arlington National Cemetery has its own separate eligibility process. State, tribal, or territory Veterans cemeteries may also have their own pre-need rules.',
                          },
                          {
                            id: 'nca_step2',
                            emoji: '📄',
                            title: 'Gather the records now',
                            helper: 'Collect the DD214 or other discharge documents, identifying information, family relationship documents if needed, and the preferred cemetery choice. VA specifically says discharge papers are very important for establishing burial eligibility.',
                          },
                          {
                            id: 'nca_step3',
                            emoji: '📋',
                            title: 'Apply for pre-need eligibility before time of need',
                            helper: 'The main planning form is VA Form 40-10007 — Application for Pre-Need Determination of Eligibility for Burial in a VA National Cemetery. This can be submitted online or by mail or fax. This form is only for use before death.',
                          },
                          {
                            id: 'nca_step4',
                            emoji: '🗄️',
                            title: 'Save the decision and tell the right people',
                            helper: 'Store the decision letter in the Document Vault and make sure the trusted person or family knows where it is. The pre-need letter helps make things easier later, but it does not reserve a specific gravesite.',
                          },
                          {
                            id: 'nca_step5',
                            emoji: '📞',
                            title: 'At time of need — schedule the burial',
                            helper: 'The family or funeral director contacts the National Cemetery Scheduling Office.\n\n📞 800-535-1117 (TTY: 711)\n\nDischarge papers can be faxed to 866-900-6417, or scanned and emailed to NCA.Scheduling@va.gov, then call to confirm. National cemeteries are generally open for burials Monday through Friday.',
                          },
                          {
                            id: 'nca_step6',
                            emoji: '🎖️',
                            title: 'Request military funeral honors and memorial items',
                            helper: 'The family can request military funeral honors through the funeral director, a Veterans Service Organization, or VA national cemetery staff. Military funeral honors include Taps and 2 uniformed service members presenting the burial flag.',
                          },
                          {
                            id: 'nca_step7',
                            emoji: '💰',
                            title: 'Apply for burial reimbursement if eligible',
                            helper: 'Families who paid burial or funeral costs may be able to apply for a burial allowance and transportation reimbursement. The main form is VA Form 21P-530EZ — Application for Burial Benefits. Do not use hardcoded dollar amounts — check the official VA page for current eligibility and rates.',
                          },
                        ].map((section, index) => {
                          const isOpen = Boolean(openBurialSections[section.id]);
                          return (
                            <View key={section.id} style={styles.guideSectionCard}>
                              <TouchableOpacity
                                style={styles.guideSectionHeader}
                                onPress={() => toggleBurialSection(section.id)}
                                activeOpacity={0.85}
                              >
                                <View style={styles.guideSectionHeaderCopy}>
                                  <Text style={styles.guideStepLabel}>Step {index + 1}</Text>
                                  <Text style={styles.guideSectionTitle}>
                                    {section.emoji} {section.title}
                                  </Text>
                                </View>
                                <Text style={styles.guideSectionIcon}>{isOpen ? '−' : '+'}</Text>
                              </TouchableOpacity>
                              {isOpen && (
                                <View style={styles.guideSectionBody}>
                                  <Text style={styles.guideHelper}>{section.helper}</Text>
                                </View>
                              )}
                            </View>
                          );
                        })}

                        {/* Helpful forms and links */}
                        <View style={styles.guideSectionCard}>
                          <Text style={[styles.guideStepLabel, { padding: 12 }]}>Helpful forms and links</Text>
                          <View style={{ padding: 12, gap: 10 }}>
                            <TouchableOpacity
                              style={styles.primaryButton}
                              activeOpacity={0.85}
                              onPress={() => openExternalSite('https://www.cem.va.gov/burial-memorial-benefits/')}
                            >
                              <Text style={styles.primaryButtonText}>NCA Burial & Memorial Benefits</Text>
                            </TouchableOpacity>
                            {[
                              { label: 'Eligibility for Burial in a VA National Cemetery', url: 'https://www.va.gov/burials-memorials/eligibility/' },
                              { label: 'Apply for Pre-Need Eligibility', url: 'https://www.va.gov/burials-memorials/pre-need-eligibility/' },
                              { label: 'Download VA Form 40-10007', url: 'https://www.va.gov/forms/40-10007/' },
                              { label: 'Schedule a Burial', url: 'https://www.va.gov/burials-memorials/schedule-a-burial/' },
                              { label: 'Find a Cemetery', url: 'https://www.cem.va.gov/cems/listcem.asp' },
                              { label: 'Nationwide Gravesite Locator', url: 'https://gravelocator.cem.va.gov/' },
                              { label: 'Veterans Legacy Memorial', url: 'https://www.vlm.cem.va.gov/' },
                              { label: 'Burial Allowance Info', url: 'https://www.va.gov/burials-memorials/veterans-burial-allowance/' },
                              { label: 'Download VA Form 21P-530EZ', url: 'https://www.va.gov/forms/21p-530ez/' },
                              { label: 'Presidential Memorial Certificate', url: 'https://www.va.gov/burials-memorials/memorial-items/presidential-memorial-certificates/' },
                              { label: 'Download VA Form 40-0247', url: 'https://www.va.gov/forms/40-0247/' },
                              { label: 'Burial Flag Info', url: 'https://www.cem.va.gov/burial-memorial-benefits/' },
                              { label: 'Download VA Form 27-2008', url: 'https://www.va.gov/find-forms/about-form-27-2008/' },
                              { label: 'Headstone / Marker / Medallion', url: 'https://www.cem.va.gov/hmm/order_instructions.asp' },
                              { label: 'Download VA Form 40-1330', url: 'https://www.va.gov/find-forms/about-form-40-1330/' },
                              { label: 'Download VA Form 40-1330M', url: 'https://www.va.gov/find-forms/about-form-40-1330m/' },
                            ].map((link) => (
                              <TouchableOpacity
                                key={link.label}
                                style={styles.secondaryButton}
                                activeOpacity={0.85}
                                onPress={() => openExternalSite(link.url)}
                              >
                                <Text style={styles.secondaryButtonText}>{link.label}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>

                        {/* Legacy note */}
                        <View style={[styles.guideSectionCard, { borderColor: Colors.gold, borderWidth: 1 }]}>
                          <View style={{ padding: 12 }}>
                            <Text style={[styles.guideStepLabel, { color: Colors.gold }]}>📖 Veterans Legacy Memorial</Text>
                            <Text style={[styles.guideHelper, { marginTop: 6 }]}>
                              If the Veteran has been approved for pre-need eligibility, they may be able to use the Veterans Legacy Memorial living Veteran feature to privately add images, autobiography details, timelines, and historical documents that can later appear on their memorial page after death.
                            </Text>
                            <TouchableOpacity
                              style={[styles.secondaryButton, { marginTop: 10 }]}
                              activeOpacity={0.85}
                              onPress={() => openExternalSite('https://www.vlm.cem.va.gov/livingveteranhome')}
                            >
                              <Text style={styles.secondaryButtonText}>Open Veterans Legacy Memorial</Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                      </View>
                    )}
                  </View>

                </View>
              )}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark,
  },
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  heroCard: {
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.navyLight,
    marginBottom: Spacing.md,
  },
  heroEyebrow: {
    color: Colors.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  heroTitle: {
    color: Colors.white,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    fontFamily: Font.display,
    marginBottom: 10,
  },
  heroBody: {
    color: Colors.gray300,
    fontSize: 14,
    lineHeight: 22,
  },
  card: {
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.navyLight,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Font.display,
    marginBottom: 10,
  },
  subsectionTitle: {
    color: Colors.offWhite,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 6,
  },
  bodyText: {
    color: Colors.gray300,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
  supportNote: {
    color: Colors.gray500,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 4,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  statusEmoji: {
    fontSize: 18,
    marginRight: 10,
    marginTop: 1,
  },
  statusCopy: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  statusNote: {
    color: Colors.gray300,
    fontSize: 12,
    lineHeight: 18,
  },
  champvaStatusBox: {
    marginBottom: 12,
  },
  champvaApplySection: {
    marginTop: 16,
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    marginBottom: 12,
  },
  segmentedButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.navyLight,
    borderRadius: Radius.md,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    backgroundColor: Colors.dark,
  },
  segmentedButtonActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  segmentedButtonText: {
    color: Colors.offWhite,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  segmentedButtonTextActive: {
    color: Colors.navy,
  },
  missingInfoBox: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: Colors.teal,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(26,188,156,0.08)',
    padding: Spacing.md,
  },
  missingInfoTitle: {
    color: Colors.teal,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
  missingInfoItem: {
    color: Colors.offWhite,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 2,
  },
  formName: {
    color: Colors.gold,
    fontSize: 18,
    fontWeight: '800',
    fontFamily: Font.display,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: Colors.gold,
    borderRadius: Radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.navy,
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.navyLight,
    borderRadius: Radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: Colors.dark,
  },
  secondaryButtonFull: {
    borderWidth: 1,
    borderColor: Colors.navyLight,
    borderRadius: Radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: Colors.dark,
    marginTop: 6,
  },
  secondaryButtonText: {
    color: Colors.offWhite,
    fontSize: 14,
    fontWeight: '700',
  },
  benefitCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  benefitCardHeaderCopy: {
    flex: 1,
  },
  benefitCardBody: {
    marginTop: 8,
  },
  expandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expandIcon: {
    color: Colors.gold,
    fontSize: 22,
    fontWeight: '500',
    marginLeft: 12,
  },
  guideWrapper: {
    marginTop: 8,
  },
  loginOptionsWrapper: {
    marginTop: 8,
    gap: 12,
  },
  guideIntroBox: {
    borderWidth: 1,
    borderColor: Colors.navyLight,
    borderRadius: Radius.md,
    backgroundColor: Colors.dark,
    padding: Spacing.md,
    marginBottom: 12,
  },
  guideIntroTitle: {
    color: Colors.offWhite,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
  guideSectionCard: {
    borderWidth: 1,
    borderColor: Colors.navyLight,
    borderRadius: Radius.md,
    backgroundColor: Colors.dark,
    marginBottom: 10,
    overflow: 'hidden',
  },
  loginOptionCard: {
    borderWidth: 1,
    borderColor: Colors.navyLight,
    borderRadius: Radius.md,
    backgroundColor: Colors.dark,
    padding: Spacing.md,
  },
  guideSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    gap: 12,
  },
  guideSectionHeaderCopy: {
    flex: 1,
  },
  guideStepLabel: {
    color: Colors.gold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  guideSectionTitle: {
    color: Colors.white,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '800',
  },
  guideSectionIcon: {
    color: Colors.gold,
    fontSize: 22,
    fontWeight: '500',
  },
  guideSectionBody: {
    borderTopWidth: 1,
    borderTopColor: Colors.navyLight,
    padding: Spacing.md,
    paddingTop: 12,
  },
  guideHelper: {
    color: Colors.gray300,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 8,
  },
  loginOptionTitle: {
    color: Colors.offWhite,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '800',
    marginBottom: 6,
  },
  guideBullet: {
    color: Colors.offWhite,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 6,
  },
  guideNote: {
    color: Colors.gold,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  guideWarningBox: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(201,168,76,0.12)',
    padding: 10,
  },
  guideWarningText: {
    color: Colors.offWhite,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
  infoNoteBox: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.navyLight,
    borderRadius: Radius.md,
    backgroundColor: Colors.dark,
    padding: Spacing.md,
  },
  infoNoteText: {
    color: Colors.gray300,
    fontSize: 13,
    lineHeight: 20,
  },
  dicPathSection: {
    marginTop: 16,
  },
  dicGuideCard: {
    marginTop: 16,
  },
  dicPathCard: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: Colors.navyLight,
    borderRadius: Radius.md,
    backgroundColor: Colors.dark,
    padding: Spacing.md,
  },
  dicPathTitle: {
    color: Colors.offWhite,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
  linkButton: {
    paddingVertical: 4,
  },
  linkButtonText: {
    color: Colors.gold,
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  placeholderText: {
    color: Colors.gray500,
    fontSize: 12,
    marginTop: 8,
  },
  noteCard: {
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(201,168,76,0.12)',
    padding: Spacing.md,
  },
  noteTitle: {
    color: Colors.gold,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
  noteText: {
    color: Colors.offWhite,
    fontSize: 13,
    lineHeight: 20,
  },
});

export default DependentsFamilyScreen;
