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
  const assessment = useMemo(() => getChapter35Assessment(veteranProfile), [veteranProfile]);
  const statusMeta = STATUS_COPY[assessment.status];
  const champvaAssessment = useMemo(() => getChampvaAssessment(veteranProfile), [veteranProfile]);
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
                <View style={styles.card}>
                  <Text style={styles.bodyText}>We will build this section next.</Text>
                </View>
              )}

              {selectedPrepareFutureTab === 'burial' && (
                <View style={styles.card}>
                  <Text style={styles.bodyText}>We will build this section next.</Text>
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
