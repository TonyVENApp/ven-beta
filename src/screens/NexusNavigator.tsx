import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Share,
  Alert,
} from 'react-native';
import { Colors, Spacing, Radius, Font } from '../theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NexusNavigatorProps {
  onBack?: () => void;
}

type ActiveTab = 'overview' | 'templates' | 'getit';
type ConditionKey = 'ptsd' | 'back' | 'tinnitus' | 'sleep';

// ─── Data ─────────────────────────────────────────────────────────────────────

const CHECKLIST = [
  {
    item: 'Written on the doctor\'s official letterhead',
    why: 'Establishes credentials and verifies the author. A letter without letterhead is immediately suspect.',
  },
  {
    item: 'Doctor\'s full name, title, and medical license number',
    why: 'The VA must be able to verify the doctor is a qualified medical professional.',
  },
  {
    item: 'Date the letter was written',
    why: 'A letter without a date can be rejected as incomplete.',
  },
  {
    item: 'Veteran\'s full name and last 4 of SSN',
    why: 'Ties the letter to your claim file. Without this, it may be filed under the wrong veteran.',
  },
  {
    item: 'Statement that the doctor reviewed your service records and/or medical history',
    why: 'The VA requires the doctor to base the opinion on actual records — not just what you told them.',
  },
  {
    item: 'A clear nexus opinion using the legal standard',
    why: 'Must include the phrase "at least as likely as not" or equivalent language. Anything weaker will not meet the threshold.',
  },
  {
    item: 'A rationale explaining the medical reasoning',
    why: 'The opinion cannot just be a conclusion. The doctor must explain WHY the condition is connected to service. One sentence is not enough.',
  },
  {
    item: 'Doctor\'s original signature',
    why: 'Unsigned letters are rejected. A typed name is not a signature.',
  },
  {
    item: 'Written as a narrative letter — NOT a checkbox form',
    why: 'The VA gives little weight to a checked box. A detailed narrative letter from a credentialed doctor carries significantly more weight.',
  },
];

const DOCTOR_STEPS = [
  {
    number: '1',
    title: 'Choose the Right Doctor',
    body: 'Your private doctor, a specialist, or a psychiatrist you already see. They do NOT need to be a VA provider — in fact, private doctors often write stronger opinions because they are not employed by the VA.',
    tip: 'Doctors who have written Nexus Letters before are ideal. You can also search for "Nexus Letter doctor" or "IMO (Independent Medical Opinion) provider" in your area.',
  },
  {
    number: '2',
    title: 'Gather Your Documents First',
    body: 'Before the appointment, pull together: your DD-214, service treatment records (STRs), any VA medical records, buddy statements, and your personal statement. Give these to the doctor before or at the appointment.',
    tip: 'You can request your STRs through the National Personnel Records Center (NPRC) at archives.gov/veterans — this is free.',
  },
  {
    number: '3',
    title: 'Use These Exact Words With Your Doctor',
    body: '"I am filing a VA disability claim for [condition]. I need an Independent Medical Opinion — a Nexus Letter — that states whether my condition is at least as likely as not caused by or aggravated by my military service. I can provide my service records for your review."',
    tip: 'If the doctor hesitates, explain that this is a standard medical opinion letter used in VA proceedings — not testimony, not a lawsuit.',
  },
  {
    number: '4',
    title: 'Explain Your In-Service Event',
    body: 'Give the doctor the specific event or exposure that caused your condition. Be concrete: dates, location, what happened, what you were exposed to. The doctor needs a clear line from service to today.',
    tip: 'Write it out beforehand and hand it to them. Doctors write better opinions when they have something concrete to reference.',
  },
  {
    number: '5',
    title: 'Ask Them to Use This Standard',
    body: 'Tell your doctor: "The VA\'s legal threshold is \'at least as likely as not\' — which means 50% or greater probability. You do not need to be certain. You just need to believe it is at least as likely as it is not."',
    tip: 'Many doctors don\'t write Nexus Letters because they think they need to be 100% certain. They don\'t. 50/50 is the bar.',
  },
  {
    number: '6',
    title: 'Expect to Pay Out of Pocket',
    body: 'Most Nexus Letters cost $150–$500 from a private doctor. Some telehealth services specialize in Nexus Letters for veterans at lower cost. This is one of the highest-ROI expenses you will ever make.',
    tip: 'A $300 Nexus Letter that results in a 10% rating increase is worth thousands of dollars per year in tax-free compensation.',
  },
  {
    number: '7',
    title: 'Review the Letter Before Submitting',
    body: 'Read every word. Make sure it contains all checklist items (see Overview tab). If it\'s missing the rationale, or only says "possible" instead of "at least as likely as not," send it back and ask for a revision.',
    tip: 'You are the client. You are paying for this. You have every right to ask for corrections.',
  },
];

const WARNINGS = [
  {
    icon: '🚫',
    warning: 'Don\'t say "I\'m doing better" or "I\'m managing fine."',
    detail: 'If your private doctor writes a strong Nexus Letter but you tell the VA examiner you\'re fine, the examiner\'s opinion can override the letter. Your statements must be consistent.',
  },
  {
    icon: '🚫',
    warning: 'Don\'t describe your condition differently to different people.',
    detail: 'The VA will compare what you said to the C&P examiner, what\'s in your medical records, and what\'s in your Nexus Letter. Inconsistencies destroy credibility.',
  },
  {
    icon: '🚫',
    warning: 'Don\'t submit a Nexus Letter without the rationale.',
    detail: 'A letter that just says "I believe this is service connected" without explaining WHY will be given little weight. The VA rater needs the medical reasoning.',
  },
  {
    icon: '🚫',
    warning: 'Don\'t use the words "possibly," "could be," or "might be."',
    detail: 'These phrases do NOT meet the legal threshold. The standard is "at least as likely as not." "Possibly" means less than 50% — the opposite of what you need.',
  },
  {
    icon: '🚫',
    warning: 'Don\'t submit a Nexus Letter from a doctor who only treated you once.',
    detail: 'A treating physician who has a long history with you carries more weight than a one-time examiner. If you can, use a doctor who knows your case.',
  },
  {
    icon: '🚫',
    warning: 'Don\'t wait until the last minute.',
    detail: 'Getting a Nexus Letter can take weeks — scheduling appointments, gathering records, waiting for the letter to be written. File an Intent to File (ITF) NOW to protect your effective date while you get the letter.',
  },
];

type Template = {
  label: string;
  icon: string;
  primary: {
    title: string;
    template: string;
  };
  secondary: {
    condition: string;
    linkedTo: string;
    template: string;
  }[];
};

const TEMPLATES: Record<ConditionKey, Template> = {
  ptsd: {
    label: 'PTSD',
    icon: '🧠',
    primary: {
      title: 'PTSD — Primary Service Connection',
      template: `[DOCTOR LETTERHEAD]
[DATE]

Re: Independent Medical Opinion — [VETERAN FULL NAME], SSN: xxx-xx-[LAST 4]

To Whom It May Concern:

I am [DR. NAME], [TITLE], licensed in the state of [STATE], license number [#]. I have been treating [VETERAN NAME] since [DATE] and have reviewed their service treatment records, DD-214, and medical history in preparing this opinion.

It is my professional medical opinion that [VETERAN NAME]'s diagnosis of Post-Traumatic Stress Disorder (PTSD) is at least as likely as not caused by their military service.

Rationale: [VETERAN NAME] served in the United States [BRANCH] from [DATE] to [DATE]. During their service, they experienced [DESCRIBE SPECIFIC IN-SERVICE EVENT OR STRESSOR — e.g., direct combat exposure, sexual assault, serious accident, witnessing death, etc.]. The symptom profile [VETERAN NAME] presents — including [LIST KEY SYMPTOMS: hypervigilance, intrusive memories, avoidance behavior, sleep disruption, emotional dysregulation, etc.] — is consistent with the diagnostic criteria for PTSD under DSM-5 and is causally linked to the described in-service stressor.

The standard "at least as likely as not" constitutes a 50% or greater probability. Based on my clinical evaluation, the veteran's service records, and the established medical literature connecting combat/traumatic exposure to PTSD, I believe this standard is met.

Sincerely,

[DR. NAME], [CREDENTIALS]
[DATE]
[SIGNATURE]`,
    },
    secondary: [
      {
        condition: 'Sleep Apnea secondary to PTSD',
        linkedTo: 'PTSD',
        template: `[DOCTOR LETTERHEAD]
[DATE]

Re: Secondary Service Connection — Sleep Apnea Secondary to PTSD
Veteran: [VETERAN FULL NAME], SSN: xxx-xx-[LAST 4]

To Whom It May Concern:

I am [DR. NAME], [TITLE], license number [#]. I have reviewed [VETERAN NAME]'s service records, PTSD diagnosis, and sleep study results.

It is my professional medical opinion that [VETERAN NAME]'s Obstructive Sleep Apnea is at least as likely as not proximately due to or the result of their service-connected PTSD.

Rationale: Medical literature establishes a well-documented relationship between PTSD and sleep-disordered breathing. PTSD disrupts normal sleep architecture, increases arousal thresholds, and causes chronic hyperactivation of the autonomic nervous system — all of which contribute to and exacerbate obstructive sleep apnea. [VETERAN NAME]'s sleep study results showing [AHI SCORE] are consistent with this pathway. The veteran's PTSD symptoms, particularly [hypervigilance / nightmares / sleep fragmentation], directly impair normal breathing regulation during sleep.

The "at least as likely as not" standard is met.

Sincerely,

[DR. NAME], [CREDENTIALS]
[DATE]
[SIGNATURE]`,
      },
      {
        condition: 'Hypertension secondary to PTSD',
        linkedTo: 'PTSD',
        template: `[DOCTOR LETTERHEAD]
[DATE]

Re: Secondary Service Connection — Hypertension Secondary to PTSD
Veteran: [VETERAN FULL NAME], SSN: xxx-xx-[LAST 4]

To Whom It May Concern:

I am [DR. NAME], [TITLE], license number [#]. I have reviewed [VETERAN NAME]'s service records, PTSD diagnosis, and cardiovascular history.

It is my professional medical opinion that [VETERAN NAME]'s hypertension is at least as likely as not aggravated by or proximately due to their service-connected PTSD.

Rationale: Chronic PTSD activates the hypothalamic-pituitary-adrenal (HPA) axis and sympathetic nervous system, resulting in persistently elevated cortisol and catecholamine levels. This chronic stress response is a recognized contributor to sustained elevated blood pressure. Peer-reviewed literature, including studies published in the Journal of the American Heart Association and the American Journal of Psychiatry, supports a causal association between PTSD and hypertension. [VETERAN NAME]'s hypertension diagnosis in [YEAR], following their PTSD onset, is consistent with this established pathway.

The "at least as likely as not" standard is met.

Sincerely,

[DR. NAME], [CREDENTIALS]
[DATE]
[SIGNATURE]`,
      },
      {
        condition: 'Major Depressive Disorder secondary to PTSD',
        linkedTo: 'PTSD',
        template: `[DOCTOR LETTERHEAD]
[DATE]

Re: Secondary Service Connection — MDD Secondary to PTSD
Veteran: [VETERAN FULL NAME], SSN: xxx-xx-[LAST 4]

To Whom It May Concern:

I am [DR. NAME], [TITLE], license number [#]. I have reviewed [VETERAN NAME]'s psychiatric history, service records, and PTSD diagnosis.

It is my professional medical opinion that [VETERAN NAME]'s Major Depressive Disorder (MDD) is at least as likely as not proximately due to or aggravated by their service-connected PTSD.

Rationale: PTSD and Major Depressive Disorder are highly comorbid conditions with well-established neurobiological overlap. The dysregulation of serotonin, dopamine, and norepinephrine systems seen in PTSD directly contributes to the development of depressive episodes. [VETERAN NAME] presents with [DESCRIBE KEY SYMPTOMS: persistent low mood, anhedonia, social withdrawal, etc.], which emerged following the onset of PTSD symptoms and are consistent with MDD as a secondary condition. The temporal relationship and shared symptom pathways support this connection.

The "at least as likely as not" standard is met.

Sincerely,

[DR. NAME], [CREDENTIALS]
[DATE]
[SIGNATURE]`,
      },
    ],
  },
  back: {
    label: 'Back Pain',
    icon: '🦴',
    primary: {
      title: 'Lumbar Strain / Back Condition — Primary Service Connection',
      template: `[DOCTOR LETTERHEAD]
[DATE]

Re: Independent Medical Opinion — [VETERAN FULL NAME], SSN: xxx-xx-[LAST 4]

To Whom It May Concern:

I am [DR. NAME], [TITLE], license number [#]. I have been treating [VETERAN NAME] for [CONDITION] since [DATE] and have reviewed their service treatment records, DD-214, and imaging results.

It is my professional medical opinion that [VETERAN NAME]'s [LUMBAR STRAIN / DEGENERATIVE DISC DISEASE / HERNIATED DISC — specify] is at least as likely as not caused by or aggravated by their military service.

Rationale: [VETERAN NAME] served in the United States [BRANCH] from [DATE] to [DATE]. Their service involved [DESCRIBE: heavy lifting, load-bearing equipment, parachute jumps, vehicle operations over rough terrain, etc.]. Medical literature consistently demonstrates that prolonged heavy load bearing and physically demanding military occupational specialties contribute significantly to lumbar degeneration and chronic low back conditions. [VETERAN NAME]'s current findings — [imaging results, range of motion limitations, pain presentation] — are consistent with the type of mechanical stress associated with their described duties. The onset of symptoms during or shortly following service further supports this connection.

The "at least as likely as not" standard is met.

Sincerely,

[DR. NAME], [CREDENTIALS]
[DATE]
[SIGNATURE]`,
    },
    secondary: [
      {
        condition: 'Radiculopathy secondary to back condition',
        linkedTo: 'Lumbar Strain / DDD',
        template: `[DOCTOR LETTERHEAD]
[DATE]

Re: Secondary Service Connection — Radiculopathy Secondary to Service-Connected Back Condition
Veteran: [VETERAN FULL NAME], SSN: xxx-xx-[LAST 4]

To Whom It May Concern:

I am [DR. NAME], [TITLE], license number [#]. I have reviewed [VETERAN NAME]'s service-connected lumbar condition and current neurological presentation.

It is my professional medical opinion that [VETERAN NAME]'s [LEFT/RIGHT/BILATERAL] lower extremity radiculopathy is at least as likely as not proximately due to their service-connected [LUMBAR CONDITION].

Rationale: Radiculopathy of the lower extremities is a direct and well-documented sequela of lumbar disc pathology and degenerative changes. [VETERAN NAME]'s imaging shows [DISC HERNIATION / FORAMINAL STENOSIS / DISC BULGE] at [LEVEL — e.g., L4-L5, L5-S1], which compresses the [NERVE ROOT]. This compression produces the [pain / numbness / tingling / weakness] radiating to the [LEFT/RIGHT] leg that the veteran reports. The radiculopathy is a direct result of the underlying service-connected lumbar condition.

The "at least as likely as not" standard is met.

Sincerely,

[DR. NAME], [CREDENTIALS]
[DATE]
[SIGNATURE]`,
      },
      {
        condition: 'Depression secondary to chronic back pain',
        linkedTo: 'Lumbar Condition',
        template: `[DOCTOR LETTERHEAD]
[DATE]

Re: Secondary Service Connection — Depression Secondary to Chronic Back Pain
Veteran: [VETERAN FULL NAME], SSN: xxx-xx-[LAST 4]

To Whom It May Concern:

I am [DR. NAME], [TITLE], license number [#]. I have reviewed [VETERAN NAME]'s chronic pain history and psychiatric presentation.

It is my professional medical opinion that [VETERAN NAME]'s depressive disorder is at least as likely as not proximately due to or aggravated by their service-connected chronic back condition.

Rationale: Chronic pain and depression are clinically interconnected through shared neurobiological pathways involving serotonin, norepinephrine, and substance P dysregulation. The psychological burden of persistent pain — including loss of function, inability to work, disrupted sleep, and social isolation — is a recognized precipitant of clinical depression. [VETERAN NAME]'s depressive symptoms emerged following the progression of their chronic back condition and are directly attributable to the physical and functional limitations imposed by that condition.

The "at least as likely as not" standard is met.

Sincerely,

[DR. NAME], [CREDENTIALS]
[DATE]
[SIGNATURE]`,
      },
    ],
  },
  tinnitus: {
    label: 'Tinnitus',
    icon: '👂',
    primary: {
      title: 'Tinnitus — Primary Service Connection',
      template: `[DOCTOR LETTERHEAD]
[DATE]

Re: Independent Medical Opinion — [VETERAN FULL NAME], SSN: xxx-xx-[LAST 4]

To Whom It May Concern:

I am [DR. NAME], [TITLE — audiologist or ENT specialist preferred], license number [#]. I have reviewed [VETERAN NAME]'s audiological records, service records, and DD-214.

It is my professional medical opinion that [VETERAN NAME]'s tinnitus is at least as likely as not caused by noise exposure during their military service.

Rationale: [VETERAN NAME] served in the United States [BRANCH] from [DATE] to [DATE] in the capacity of [MOS/RATE/AFSC]. Their service involved regular exposure to [DESCRIBE: weapons fire, aircraft engines, artillery, explosions, heavy machinery, etc.]. The audiological literature is unambiguous that high-intensity noise exposure causes cochlear damage and tinnitus. [VETERAN NAME] reports the onset of persistent [ringing / buzzing / hissing] in [both ears / left ear / right ear] during or shortly following their service, consistent with noise-induced auditory trauma. Audiometric testing reveals [FINDINGS, e.g., high-frequency sensorineural hearing loss pattern consistent with noise exposure].

The "at least as likely as not" standard is met.

Sincerely,

[DR. NAME], [CREDENTIALS]
[DATE]
[SIGNATURE]`,
    },
    secondary: [
      {
        condition: 'Anxiety secondary to tinnitus',
        linkedTo: 'Tinnitus',
        template: `[DOCTOR LETTERHEAD]
[DATE]

Re: Secondary Service Connection — Anxiety Disorder Secondary to Tinnitus
Veteran: [VETERAN FULL NAME], SSN: xxx-xx-[LAST 4]

To Whom It May Concern:

I am [DR. NAME], [TITLE], license number [#]. I have reviewed [VETERAN NAME]'s tinnitus history and current psychiatric presentation.

It is my professional medical opinion that [VETERAN NAME]'s anxiety disorder is at least as likely as not proximately due to their service-connected tinnitus.

Rationale: Chronic tinnitus — particularly constant, bilateral tinnitus — is a recognized psychological stressor with well-documented psychiatric sequelae. The persistent, involuntary auditory stimulus creates chronic cognitive and emotional overload, disrupts sleep, impairs concentration, and contributes directly to anxiety and hyperarousal states. [VETERAN NAME] describes their tinnitus as [CONSTANT / FREQUENCY], which limits their ability to [sleep / concentrate / engage in social situations], and has contributed to the anxiety symptoms they currently experience. The temporal relationship between tinnitus onset and anxiety presentation supports secondary service connection.

The "at least as likely as not" standard is met.

Sincerely,

[DR. NAME], [CREDENTIALS]
[DATE]
[SIGNATURE]`,
      },
    ],
  },
  sleep: {
    label: 'Sleep Apnea',
    icon: '😴',
    primary: {
      title: 'Sleep Apnea — Primary Service Connection',
      template: `[DOCTOR LETTERHEAD]
[DATE]

Re: Independent Medical Opinion — [VETERAN FULL NAME], SSN: xxx-xx-[LAST 4]

To Whom It May Concern:

I am [DR. NAME], [TITLE — sleep medicine specialist or pulmonologist preferred], license number [#]. I have reviewed [VETERAN NAME]'s sleep study results, service records, DD-214, and medical history.

It is my professional medical opinion that [VETERAN NAME]'s Obstructive Sleep Apnea (OSA) is at least as likely as not caused by or aggravated by their military service.

Rationale: [VETERAN NAME] served in the United States [BRANCH] from [DATE] to [DATE]. During their service they experienced [DESCRIBE: sleep deprivation during deployments, exposure to burn pits/environmental toxins, traumatic brain injury, significant weight gain due to service-connected injury limiting physical activity, etc.]. [SELECT APPLICABLE PATHWAY: (1) Chronic sleep deprivation during service is associated with long-term disruption of normal sleep architecture and increased OSA risk. (2) Service-connected weight gain following [INJURY] directly contributes to airway obstruction during sleep. (3) Burn pit / environmental exposure has been associated with upper airway inflammation.] [VETERAN NAME]'s polysomnography showing an AHI of [NUMBER] confirms moderate/severe OSA consistent with these service-related contributing factors.

The "at least as likely as not" standard is met.

Sincerely,

[DR. NAME], [CREDENTIALS]
[DATE]
[SIGNATURE]`,
    },
    secondary: [
      {
        condition: 'Sleep Apnea secondary to PTSD',
        linkedTo: 'PTSD',
        template: `[DOCTOR LETTERHEAD]
[DATE]

Re: Secondary Service Connection — Sleep Apnea Secondary to PTSD
Veteran: [VETERAN FULL NAME], SSN: xxx-xx-[LAST 4]

To Whom It May Concern:

I am [DR. NAME], [TITLE], license number [#]. I have reviewed [VETERAN NAME]'s PTSD diagnosis, psychiatric records, and polysomnography results.

It is my professional medical opinion that [VETERAN NAME]'s Obstructive Sleep Apnea is at least as likely as not proximately due to or aggravated by their service-connected PTSD.

Rationale: The neurobiological relationship between PTSD and obstructive sleep apnea is well-established in the medical literature. PTSD produces chronic hyperactivation of the sympathetic nervous system, dysregulated arousal thresholds, and altered upper airway muscle tone during sleep — all of which are recognized contributors to sleep-disordered breathing. Studies including those published in SLEEP and the Journal of Clinical Sleep Medicine demonstrate significantly elevated rates of OSA among veterans with PTSD compared to the general population. [VETERAN NAME]'s AHI of [NUMBER] and the temporal relationship between PTSD symptom onset and sleep apnea diagnosis support this secondary connection.

The "at least as likely as not" standard is met.

Sincerely,

[DR. NAME], [CREDENTIALS]
[DATE]
[SIGNATURE]`,
      },
      {
        condition: 'Hypertension secondary to sleep apnea',
        linkedTo: 'Sleep Apnea',
        template: `[DOCTOR LETTERHEAD]
[DATE]

Re: Secondary Service Connection — Hypertension Secondary to Sleep Apnea
Veteran: [VETERAN FULL NAME], SSN: xxx-xx-[LAST 4]

To Whom It May Concern:

I am [DR. NAME], [TITLE], license number [#]. I have reviewed [VETERAN NAME]'s sleep apnea history, CPAP compliance records, and cardiovascular findings.

It is my professional medical opinion that [VETERAN NAME]'s hypertension is at least as likely as not proximately due to their service-connected Obstructive Sleep Apnea.

Rationale: Obstructive sleep apnea causes repetitive nocturnal hypoxemia and arousal events, resulting in sustained sympathetic nervous system activation and elevated cortisol secretion. This physiological cascade is a recognized independent risk factor for systemic hypertension, supported by extensive cardiovascular literature including guidelines from the American Heart Association. [VETERAN NAME]'s blood pressure readings of [VALUES] are consistent with OSA-mediated hypertension. The progression of hypertension concurrent with untreated or undertreated sleep apnea further supports this connection.

The "at least as likely as not" standard is met.

Sincerely,

[DR. NAME], [CREDENTIALS]
[DATE]
[SIGNATURE]`,
      },
    ],
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const MagicPhraseBanner: React.FC = () => (
  <View style={styles.magicPhraseCard}>
    <View style={styles.magicPhraseTop}>
      <Text style={styles.magicPhraseLabel}>THE MAGIC PHRASE</Text>
    </View>
    <Text style={styles.magicPhrase}>"at least as likely as not"</Text>
    <Text style={styles.magicPhraseExplain}>
      This is the VA's legal standard for service connection. It means 50% or greater probability — not certainty. Your doctor does NOT need to be 100% sure. They only need to believe it is at least as likely as it is not.
    </Text>
    <View style={styles.magicPhraseWarning}>
      <Text style={styles.magicPhraseWarningText}>
        ⚠️  Words like "possibly," "could be," or "might be" do NOT meet this standard. They imply less than 50%. Make sure your doctor uses the exact phrase.
      </Text>
    </View>
  </View>
);

const ChecklistItem: React.FC<{ item: typeof CHECKLIST[0]; index: number }> = ({ item, index }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <TouchableOpacity style={styles.checklistItem} onPress={() => setExpanded(!expanded)} activeOpacity={0.85}>
      <View style={styles.checklistRow}>
        <View style={styles.checklistBadge}>
          <Text style={styles.checklistBadgeText}>{index + 1}</Text>
        </View>
        <Text style={styles.checklistText}>{item.item}</Text>
        <Text style={styles.checklistChevron}>{expanded ? '▲' : '▼'}</Text>
      </View>
      {expanded && (
        <View style={styles.checklistWhy}>
          <Text style={styles.checklistWhyLabel}>WHY IT MATTERS</Text>
          <Text style={styles.checklistWhyText}>{item.why}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const ConditionPills: React.FC<{ active: ConditionKey; onSelect: (c: ConditionKey) => void }> = ({ active, onSelect }) => {
  const items: { id: ConditionKey; icon: string; label: string }[] = [
    { id: 'ptsd', icon: '🧠', label: 'PTSD' },
    { id: 'back', icon: '🦴', label: 'Back Pain' },
    { id: 'tinnitus', icon: '👂', label: 'Tinnitus' },
    { id: 'sleep', icon: '😴', label: 'Sleep Apnea' },
  ];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
      {items.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[styles.conditionPill, active === item.id && styles.conditionPillActive]}
          onPress={() => onSelect(item.id)}
          activeOpacity={0.8}
        >
          <Text style={styles.pillIcon}>{item.icon}</Text>
          <Text style={[styles.pillLabel, active === item.id && styles.pillLabelActive]}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const TemplateCard: React.FC<{ title: string; templateText: string; tag?: string }> = ({ title, templateText, tag }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      await Share.share({ message: templateText, title });
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      Alert.alert('Share failed', 'Could not open share sheet. Long-press the template text to copy it manually.');
    }
  };

  return (
    <View style={styles.templateCard}>
      <View style={styles.templateCardHeader}>
        <View style={{ flex: 1 }}>
          {tag && (
            <View style={styles.templateTag}>
              <Text style={styles.templateTagText}>{tag}</Text>
            </View>
          )}
          <Text style={styles.templateTitle}>{title}</Text>
        </View>
        <TouchableOpacity style={[styles.copyBtn, copied && styles.copyBtnDone]} onPress={handleShare} activeOpacity={0.8}>
          <Text style={[styles.copyBtnText, copied && styles.copyBtnTextDone]}>
            {copied ? '✓ Copied' : '📋 Copy'}
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.templateText} selectable>{templateText}</Text>
    </View>
  );
};

const StepCard: React.FC<{ step: typeof DOCTOR_STEPS[0] }> = ({ step }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <TouchableOpacity style={styles.stepCard} onPress={() => setExpanded(!expanded)} activeOpacity={0.85}>
      <View style={styles.stepRow}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>{step.number}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.stepTitle}>{step.title}</Text>
          {!expanded && <Text style={styles.stepPreview} numberOfLines={1}>{step.body}</Text>}
        </View>
        <Text style={styles.stepChevron}>{expanded ? '▲' : '▼'}</Text>
      </View>
      {expanded && (
        <View style={styles.stepExpanded}>
          <Text style={styles.stepBody}>{step.body}</Text>
          {step.tip && (
            <View style={styles.stepTip}>
              <Text style={styles.stepTipIcon}>💡</Text>
              <Text style={styles.stepTipText}>{step.tip}</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const WarningCard: React.FC<{ item: typeof WARNINGS[0] }> = ({ item }) => (
  <View style={styles.warningCard}>
    <View style={styles.warningHeader}>
      <Text style={styles.warningIcon}>{item.icon}</Text>
      <Text style={styles.warningText}>{item.warning}</Text>
    </View>
    <Text style={styles.warningDetail}>{item.detail}</Text>
  </View>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const NexusNavigator: React.FC<NexusNavigatorProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [activeCondition, setActiveCondition] = useState<ConditionKey>('ptsd');

  const cond = TEMPLATES[activeCondition];

  return (
    <View style={styles.container}>
      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.topBarTitle}>Nexus Navigator</Text>
          <Text style={styles.topBarSub}>Connect Your Condition to Your Service</Text>
        </View>
      </View>

      {/* ── Main Tab Row ── */}
      <View style={styles.mainTabRow}>
        {(['overview', 'templates', 'getit'] as ActiveTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.mainTab, activeTab === tab && styles.mainTabActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.8}
          >
            <Text style={[styles.mainTabText, activeTab === tab && styles.mainTabTextActive]}>
              {tab === 'overview' ? 'Overview' : tab === 'templates' ? 'Templates' : 'Get It'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ══════════════ OVERVIEW TAB ══════════════ */}
        {activeTab === 'overview' && (
          <>
            {/* What Is a Nexus Letter */}
            <View style={styles.explainerCard}>
              <Text style={styles.explainerTitle}>What is a Nexus Letter?</Text>
              <Text style={styles.explainerBody}>
                A Nexus Letter is a written medical opinion from a doctor that connects your current health condition to something that happened during your military service.
              </Text>
              <Text style={styles.explainerBody}>
                The VA will not automatically assume your condition is service-connected — even if it obviously is. You have to prove it. A Nexus Letter from a qualified doctor is one of the most powerful ways to do that.
              </Text>
              <Text style={styles.explainerBody}>
                Without a Nexus, the VA can — and often will — deny your claim simply because the connection wasn't documented. With a strong Nexus, you force the VA to either accept the connection or explain in writing why they disagree.
              </Text>
            </View>

            <MagicPhraseBanner />

            {/* Checklist */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>✅</Text>
                <View>
                  <Text style={styles.sectionTitle}>What the Letter Must Contain</Text>
                  <Text style={styles.sectionSub}>Tap each item to see why it matters</Text>
                </View>
              </View>
              {CHECKLIST.map((item, i) => (
                <ChecklistItem key={i} item={item} index={i} />
              ))}
            </View>

            <View style={styles.bottomNote}>
              <Text style={styles.bottomNoteIcon}>🛡️</Text>
              <Text style={styles.bottomNoteText}>
                A Nexus Letter is not guaranteed to win your claim — but without one, many claims that should be approved are denied. It is the single most impactful document you can add to your VA file.
              </Text>
            </View>
          </>
        )}

        {/* ══════════════ TEMPLATES TAB ══════════════ */}
        {activeTab === 'templates' && (
          <>
            <View style={styles.templateIntro}>
              <Text style={styles.templateIntroTitle}>Nexus Letter Templates</Text>
              <Text style={styles.templateIntroSub}>
                These are starting-point templates to bring to your doctor. Your doctor must personalize them with your specific records, dates, and rationale — they cannot be submitted as-is.
              </Text>
            </View>

            <ConditionPills active={activeCondition} onSelect={setActiveCondition} />

            <View style={styles.section}>
              {/* Primary template */}
              <TemplateCard
                title={cond.primary.title}
                templateText={cond.primary.template}
                tag="PRIMARY SERVICE CONNECTION"
              />

              {/* Secondary templates */}
              {cond.secondary.length > 0 && (
                <>
                  <View style={styles.secondaryHeader}>
                    <Text style={styles.secondaryHeaderIcon}>🔗</Text>
                    <View>
                      <Text style={styles.secondaryHeaderTitle}>Secondary Conditions</Text>
                      <Text style={styles.secondaryHeaderSub}>Linked to service-connected {cond.label}</Text>
                    </View>
                  </View>
                  {cond.secondary.map((sec, i) => (
                    <TemplateCard
                      key={i}
                      title={sec.condition}
                      templateText={sec.template}
                      tag={`SECONDARY TO ${sec.linkedTo.toUpperCase()}`}
                    />
                  ))}
                </>
              )}
            </View>
          </>
        )}

        {/* ══════════════ GET IT TAB ══════════════ */}
        {activeTab === 'getit' && (
          <>
            <View style={styles.getItIntro}>
              <Text style={styles.getItIntroTitle}>How to Get a Nexus Letter</Text>
              <Text style={styles.getItIntroSub}>
                Most veterans don't know they can get a Nexus Letter from their own private doctor. Here's exactly how to do it — step by step.
              </Text>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>🗺️</Text>
                <View>
                  <Text style={styles.sectionTitle}>Step-by-Step Guide</Text>
                  <Text style={styles.sectionSub}>Tap each step to expand</Text>
                </View>
              </View>
              {DOCTOR_STEPS.map((step) => (
                <StepCard key={step.number} step={step} />
              ))}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>🚫</Text>
                <View>
                  <Text style={styles.sectionTitle}>What NOT to Say</Text>
                  <Text style={styles.sectionSub}>Statements that can undermine your Nexus</Text>
                </View>
              </View>
              {WARNINGS.map((item, i) => (
                <WarningCard key={i} item={item} />
              ))}
            </View>

            <View style={styles.bottomNote}>
              <Text style={styles.bottomNoteIcon}>⚡</Text>
              <Text style={styles.bottomNoteText}>
                File an Intent to File (ITF) with the VA TODAY if you haven't already. This locks in your effective date while you gather your Nexus Letter and other evidence. You have one year from your ITF date to submit your full claim.
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
  mainTabActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  mainTabText: { color: Colors.gray300, fontSize: 12, fontWeight: '700' },
  mainTabTextActive: { color: Colors.navy },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  // Explainer
  explainerCard: {
    margin: Spacing.md,
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.navyLight,
    gap: 10,
  },
  explainerTitle: { color: Colors.white, fontSize: 15, fontWeight: '800', fontFamily: Font.display, marginBottom: 2 },
  explainerBody: { color: Colors.gray300, fontSize: 13, lineHeight: 20 },

  // Magic Phrase
  magicPhraseCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: 'rgba(201,168,76,0.08)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.gold,
    overflow: 'hidden',
  },
  magicPhraseTop: {
    backgroundColor: Colors.gold,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  magicPhraseLabel: { color: Colors.navy, fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  magicPhrase: {
    color: Colors.gold,
    fontSize: 20,
    fontWeight: '900',
    fontFamily: Font.display,
    fontStyle: 'italic',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: 8,
    letterSpacing: 0.5,
  },
  magicPhraseExplain: {
    color: Colors.gray300,
    fontSize: 13,
    lineHeight: 19,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  magicPhraseWarning: {
    backgroundColor: 'rgba(243,156,18,0.12)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(243,156,18,0.3)',
    padding: Spacing.md,
  },
  magicPhraseWarningText: { color: Colors.warning, fontSize: 12, lineHeight: 18 },

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
  sectionIcon: { fontSize: 20 },
  sectionTitle: { color: Colors.white, fontSize: 15, fontWeight: '800', fontFamily: Font.display },
  sectionSub: { color: Colors.gray500, fontSize: 11, marginTop: 2 },

  // Checklist
  checklistItem: {
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.navyLight,
  },
  checklistRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checklistBadge: {
    width: 26,
    height: 26,
    borderRadius: Radius.full,
    backgroundColor: Colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checklistBadgeText: { color: Colors.white, fontWeight: '900', fontSize: 12 },
  checklistText: { color: Colors.white, fontSize: 13, fontWeight: '600', flex: 1, lineHeight: 18 },
  checklistChevron: { color: Colors.gray500, fontSize: 11 },
  checklistWhy: {
    marginTop: 10,
    backgroundColor: 'rgba(26,188,156,0.08)',
    borderRadius: Radius.sm,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(26,188,156,0.25)',
  },
  checklistWhyLabel: { color: Colors.teal, fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginBottom: 4 },
  checklistWhyText: { color: Colors.gray300, fontSize: 12, lineHeight: 17 },

  // Template tab
  templateIntro: {
    margin: Spacing.md,
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.navyLight,
  },
  templateIntroTitle: { color: Colors.white, fontSize: 15, fontWeight: '800', fontFamily: Font.display, marginBottom: 6 },
  templateIntroSub: { color: Colors.gray300, fontSize: 12, lineHeight: 18 },

  pillScroll: { maxHeight: 52, marginBottom: Spacing.md },
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
  pillIcon: { fontSize: 14 },
  pillLabel: { color: Colors.gray500, fontSize: 12, fontWeight: '700' },
  pillLabelActive: { color: Colors.gold },

  templateCard: {
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.navyLight,
    overflow: 'hidden',
  },
  templateCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.navyLight,
    gap: 10,
  },
  templateTag: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.navyLight,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 6,
  },
  templateTagText: { color: Colors.gray500, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  templateTitle: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  copyBtn: {
    backgroundColor: Colors.navyLight,
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexShrink: 0,
  },
  copyBtnDone: { backgroundColor: 'rgba(39,174,96,0.2)', borderWidth: 1, borderColor: Colors.success },
  copyBtnText: { color: Colors.gray300, fontSize: 12, fontWeight: '700' },
  copyBtnTextDone: { color: Colors.success },
  templateText: {
    color: Colors.gray300,
    fontSize: 11,
    lineHeight: 18,
    padding: Spacing.md,
    fontFamily: Font.mono,
  },

  secondaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: Colors.navyLight,
  },
  secondaryHeaderIcon: { fontSize: 18 },
  secondaryHeaderTitle: { color: Colors.white, fontSize: 13, fontWeight: '800' },
  secondaryHeaderSub: { color: Colors.gray500, fontSize: 11, marginTop: 1 },

  // Get It tab
  getItIntro: {
    margin: Spacing.md,
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.navyLight,
  },
  getItIntroTitle: { color: Colors.white, fontSize: 15, fontWeight: '800', fontFamily: Font.display, marginBottom: 6 },
  getItIntroSub: { color: Colors.gray300, fontSize: 12, lineHeight: 18 },

  stepCard: {
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.navyLight,
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepBadgeText: { color: Colors.navy, fontWeight: '900', fontSize: 13 },
  stepTitle: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  stepPreview: { color: Colors.gray500, fontSize: 11, marginTop: 2 },
  stepChevron: { color: Colors.gray500, fontSize: 11, marginLeft: 'auto' },
  stepExpanded: { marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.navyLight },
  stepBody: { color: Colors.gray300, fontSize: 13, lineHeight: 19, marginBottom: 10 },
  stepTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(201,168,76,0.08)',
    borderRadius: Radius.sm,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.25)',
  },
  stepTipIcon: { fontSize: 14 },
  stepTipText: { color: Colors.gray300, fontSize: 12, lineHeight: 17, flex: 1 },

  // Warning cards
  warningCard: {
    backgroundColor: 'rgba(192,57,43,0.08)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(231,76,60,0.3)',
  },
  warningHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  warningIcon: { fontSize: 16 },
  warningText: { color: Colors.crimsonLight, fontSize: 13, fontWeight: '700', flex: 1, lineHeight: 18 },
  warningDetail: { color: Colors.gray300, fontSize: 12, lineHeight: 17 },

  // Bottom note
  bottomNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: 'rgba(26,188,156,0.08)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(26,188,156,0.3)',
  },
  bottomNoteIcon: { fontSize: 20 },
  bottomNoteText: { color: Colors.gray300, fontSize: 12, lineHeight: 18, flex: 1 },
});

export default NexusNavigator;
