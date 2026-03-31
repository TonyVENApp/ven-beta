import React, { useState, useMemo } from 'react';
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

interface VARatingCalculatorProps {
  onBack?: () => void;
}

type ActiveTab = 'calculator' | 'examples' | 'strategy';

interface Condition {
  id: string;
  label: string;
  rating: number;
}

interface CalcStep {
  label: string;
  rating: number;
  disabledThisStep: number;
  totalDisabled: number;
  remaining: number;
}

interface CalcResult {
  steps: CalcStep[];
  raw: number;
  rounded: number;
  remaining: number;
}

// ─── VA Math Engine ───────────────────────────────────────────────────────────

function calcVA(conditions: Condition[]): CalcResult {
  const active = conditions.filter((c) => c.rating > 0);
  const sorted = [...active].sort((a, b) => b.rating - a.rating);

  let remaining = 100;
  const steps: CalcStep[] = [];

  for (const cond of sorted) {
    const disabledThisStep = remaining * (cond.rating / 100);
    remaining -= disabledThisStep;
    steps.push({
      label: cond.label,
      rating: cond.rating,
      disabledThisStep,
      totalDisabled: 100 - remaining,
      remaining,
    });
  }

  const raw = 100 - remaining;
  const rounded = Math.round(raw / 10) * 10;
  return { steps, raw, rounded, remaining };
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const VA_RATINGS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

const CONDITION_NAMES = [
  'PTSD', 'Sleep Apnea', 'Back Pain', 'Tinnitus', 'Hearing Loss',
  'Knee (L)', 'Knee (R)', 'Shoulder', 'Hypertension', 'Depression',
  'Anxiety', 'Migraines', 'Radiculopathy', 'TBI', 'Hip',
];

const PRESET_EXAMPLES: {
  title: string;
  story: string;
  branch: string;
  conditions: Condition[];
}[] = [
  {
    title: 'PTSD + Sleep Apnea → 90%',
    story: 'Army Infantry veteran, two combat deployments. PTSD from direct combat exposure. Sleep apnea diagnosed post-service, rated secondary to PTSD.',
    branch: 'Army',
    conditions: [
      { id: '1', label: 'PTSD', rating: 70 },
      { id: '2', label: 'Sleep Apnea (secondary)', rating: 50 },
    ],
  },
  {
    title: 'PTSD + Back + Tinnitus → 70%',
    story: 'Marine veteran, 8 years service. Back injured during training exercise. Tinnitus from weapons range exposure. PTSD from a traumatic in-service event.',
    branch: 'Marines',
    conditions: [
      { id: '1', label: 'PTSD', rating: 50 },
      { id: '2', label: 'Lumbar Strain', rating: 40 },
      { id: '3', label: 'Tinnitus', rating: 10 },
    ],
  },
  {
    title: 'PTSD 90% + Sleep Apnea → 100%',
    story: 'Navy veteran with severe service-connected PTSD. Sleep apnea rated secondary to PTSD. Two conditions reach the maximum combined rating.',
    branch: 'Navy',
    conditions: [
      { id: '1', label: 'PTSD', rating: 90 },
      { id: '2', label: 'Sleep Apnea (secondary)', rating: 50 },
    ],
  },
];

const PATHS_TO_90 = [
  { a: 'PTSD 70%', b: 'Sleep Apnea 50%', raw: 85 },
  { a: 'PTSD 70%', b: 'Back Pain 60%', raw: 88 },
  { a: 'Back Pain 80%', b: 'Tinnitus 30%', raw: 86 },
  { a: 'Back Pain 80%', b: 'Sleep Apnea 40%', raw: 88 },
  { a: 'PTSD 90%', b: 'Tinnitus 10%', raw: 91 },
];

const PATHS_TO_100 = [
  { a: 'PTSD 90%', b: 'Sleep Apnea 50%', raw: 95 },
  { a: 'PTSD 90%', b: 'Back Pain 60%', raw: 96 },
  { a: 'Back Pain 80%', b: 'Sleep Apnea 80%', raw: 96 },
  { a: 'PTSD 70%', b: 'Back Pain 90%', raw: 97 },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const RatingResultBadge: React.FC<{ rounded: number; raw: number }> = ({ rounded, raw }) => {
  const isMax = rounded >= 100;
  const color = rounded >= 90 ? Colors.teal : rounded >= 70 ? Colors.gold : Colors.gray300;
  return (
    <View style={[styles.resultBadge, { borderColor: color }]}>
      <Text style={[styles.resultNumber, { color }]}>{rounded}<Text style={styles.resultPct}>%</Text></Text>
      <Text style={styles.resultLabel}>COMBINED RATING</Text>
      <Text style={styles.resultRaw}>Raw: {raw.toFixed(1)}% → rounded to nearest 10</Text>
      {isMax && <Text style={styles.resultMax}>Maximum rating reached</Text>}
    </View>
  );
};

const StepBreakdown: React.FC<{ steps: CalcStep[]; raw: number; rounded: number }> = ({ steps, raw, rounded }) => {
  if (steps.length === 0) return null;
  return (
    <View style={styles.stepBreakdown}>
      <Text style={styles.stepBreakdownTitle}>HOW THE MATH WORKS</Text>
      {/* Starting point */}
      <View style={styles.mathRow}>
        <View style={styles.mathRowLeft}>
          <View style={[styles.mathDot, { backgroundColor: Colors.teal }]} />
          <Text style={styles.mathRowLabel}>Start: whole person</Text>
        </View>
        <Text style={styles.mathRowValue}>100%</Text>
      </View>
      {steps.map((step, i) => (
        <View key={i}>
          <View style={styles.mathArrow}>
            <Text style={styles.mathArrowLine}>↓</Text>
            <Text style={styles.mathArrowText}>
              {step.label} at {step.rating}% takes {step.disabledThisStep.toFixed(1)}% of what remains
            </Text>
          </View>
          <View style={styles.mathRow}>
            <View style={styles.mathRowLeft}>
              <View style={[styles.mathDot, { backgroundColor: Colors.gold }]} />
              <Text style={styles.mathRowLabel}>{step.label} ({step.rating}%)</Text>
            </View>
            <View style={styles.mathRowRight}>
              <Text style={[styles.mathRowValue, { color: Colors.crimsonLight }]}>−{step.disabledThisStep.toFixed(1)}%</Text>
              <Text style={styles.mathRowRemaining}>{step.remaining.toFixed(1)}% left</Text>
            </View>
          </View>
        </View>
      ))}
      {/* Final */}
      <View style={styles.mathDivider} />
      <View style={styles.mathRow}>
        <Text style={styles.mathFinalLabel}>Raw combined ({steps.length > 1 ? 'all steps' : ''})</Text>
        <Text style={[styles.mathFinalValue, { color: Colors.white }]}>{raw.toFixed(1)}%</Text>
      </View>
      <View style={styles.mathRow}>
        <Text style={styles.mathFinalLabel}>Rounded to nearest 10%</Text>
        <Text style={[styles.mathFinalValue, { color: Colors.gold, fontWeight: '900' }]}>{rounded}%</Text>
      </View>
    </View>
  );
};

const ConditionRow: React.FC<{
  condition: Condition;
  index: number;
  onChangeRating: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCycleName: (id: string) => void;
}> = ({ condition, index, onChangeRating, onRemove, onCycleName }) => {
  const ratingIndex = VA_RATINGS.indexOf(condition.rating);
  const canIncrease = ratingIndex < VA_RATINGS.length - 1;
  const canDecrease = ratingIndex > 1; // min 10 for active conditions

  return (
    <View style={styles.conditionRow}>
      <TouchableOpacity style={styles.conditionLabelBtn} onPress={() => onCycleName(condition.id)}>
        <Text style={styles.conditionLabelText} numberOfLines={1}>{condition.label}</Text>
        <Text style={styles.conditionLabelHint}>tap to change</Text>
      </TouchableOpacity>
      <View style={styles.ratingControl}>
        <TouchableOpacity
          style={[styles.ratingBtn, !canDecrease && styles.ratingBtnDisabled]}
          onPress={() => canDecrease && onChangeRating(condition.id, -1)}
          activeOpacity={canDecrease ? 0.7 : 1}
        >
          <Text style={[styles.ratingBtnText, !canDecrease && { color: Colors.gray700 }]}>−</Text>
        </TouchableOpacity>
        <View style={styles.ratingDisplay}>
          <Text style={styles.ratingDisplayText}>{condition.rating}<Text style={styles.ratingDisplayPct}>%</Text></Text>
        </View>
        <TouchableOpacity
          style={[styles.ratingBtn, !canIncrease && styles.ratingBtnDisabled]}
          onPress={() => canIncrease && onChangeRating(condition.id, 1)}
          activeOpacity={canIncrease ? 0.7 : 1}
        >
          <Text style={[styles.ratingBtnText, !canIncrease && { color: Colors.gray700 }]}>+</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.removeBtn} onPress={() => onRemove(condition.id)}>
        <Text style={styles.removeBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
};

const ExampleCard: React.FC<{ example: typeof PRESET_EXAMPLES[0] }> = ({ example }) => {
  const result = useMemo(() => calcVA(example.conditions), [example]);
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.exampleCard}>
      <TouchableOpacity style={styles.exampleHeader} onPress={() => setExpanded(!expanded)} activeOpacity={0.85}>
        <View style={{ flex: 1 }}>
          <View style={styles.exampleBranchRow}>
            <View style={styles.exampleBranchBadge}>
              <Text style={styles.exampleBranchText}>{example.branch.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.exampleTitle}>{example.title}</Text>
          <Text style={styles.exampleStory}>{example.story}</Text>
        </View>
        <View style={styles.exampleResultBadge}>
          <Text style={[styles.exampleResultNum, { color: result.rounded >= 90 ? Colors.teal : Colors.gold }]}>{result.rounded}%</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.exampleConditions}>
        {example.conditions.map((c) => (
          <View key={c.id} style={styles.exampleConditionPill}>
            <Text style={styles.exampleConditionText}>{c.label}: <Text style={{ color: Colors.gold, fontWeight: '700' }}>{c.rating}%</Text></Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.exampleExpandBtn} onPress={() => setExpanded(!expanded)}>
        <Text style={styles.exampleExpandText}>{expanded ? '▲ Hide math' : '▼ Show the math'}</Text>
      </TouchableOpacity>

      {expanded && <StepBreakdown steps={result.steps} raw={result.raw} rounded={result.rounded} />}
    </View>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

let nextId = 3;

export const VARatingCalculator: React.FC<VARatingCalculatorProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('calculator');
  const [conditions, setConditions] = useState<Condition[]>([
    { id: '1', label: 'PTSD', rating: 70 },
    { id: '2', label: 'Sleep Apnea', rating: 50 },
  ]);

  const result = useMemo(() => calcVA(conditions), [conditions]);

  const addCondition = () => {
    if (conditions.length >= 10) return;
    const usedNames = new Set(conditions.map((c) => c.label));
    const nextName = CONDITION_NAMES.find((n) => !usedNames.has(n)) ?? `Condition ${conditions.length + 1}`;
    setConditions((prev) => [...prev, { id: String(nextId++), label: nextName, rating: 10 }]);
  };

  const removeCondition = (id: string) => {
    if (conditions.length <= 1) return;
    setConditions((prev) => prev.filter((c) => c.id !== id));
  };

  const changeRating = (id: string, delta: number) => {
    setConditions((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const idx = VA_RATINGS.indexOf(c.rating);
        const newIdx = Math.max(1, Math.min(VA_RATINGS.length - 1, idx + delta));
        return { ...c, rating: VA_RATINGS[newIdx] };
      })
    );
  };

  const cycleName = (id: string) => {
    setConditions((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const usedNames = new Set(prev.filter((x) => x.id !== id).map((x) => x.label));
        const available = CONDITION_NAMES.filter((n) => !usedNames.has(n));
        const currentIdx = CONDITION_NAMES.indexOf(c.label);
        const nextAvailable = available.find((n) => CONDITION_NAMES.indexOf(n) > currentIdx) ?? available[0] ?? c.label;
        return { ...c, label: nextAvailable };
      })
    );
  };

  const roundedColor = result.rounded >= 90 ? Colors.teal : result.rounded >= 70 ? Colors.gold : Colors.gray300;

  return (
    <View style={styles.container}>
      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.topBarTitle}>VA Rating Calculator</Text>
          <Text style={styles.topBarSub}>Real VA Math — No Guessing</Text>
        </View>
      </View>

      {/* ── Main Tab Row ── */}
      <View style={styles.mainTabRow}>
        {(['calculator', 'examples', 'strategy'] as ActiveTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.mainTab, activeTab === tab && styles.mainTabActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.8}
          >
            <Text style={[styles.mainTabText, activeTab === tab && styles.mainTabTextActive]}>
              {tab === 'calculator' ? 'Calculator' : tab === 'examples' ? 'Examples' : 'Strategy'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ══════════════ CALCULATOR TAB ══════════════ */}
        {activeTab === 'calculator' && (
          <>
            {/* Explainer */}
            <View style={styles.explainerCard}>
              <Text style={styles.explainerTitle}>The VA Does NOT Add Percentages</Text>
              <Text style={styles.explainerBody}>
                If you have PTSD at 70% and Sleep Apnea at 50%, your rating is NOT 120%. It is not even 70% + 50% = 120% capped at 100%.
              </Text>
              <Text style={styles.explainerBody}>
                The VA uses "whole person" math. Each disability takes a percentage of what remains of a healthy person — not a percentage of 100%.
              </Text>
              <View style={styles.explainerFormula}>
                <Text style={styles.explainerFormulaText}>
                  Start: 100% whole person{'\n'}
                  PTSD 70% → disables 70 of 100 → 30% remains{'\n'}
                  Sleep Apnea 50% → 50% of remaining 30 = 15 more disabled{'\n'}
                  Combined: 70 + 15 = 85% → rounds to 90%
                </Text>
              </View>
            </View>

            {/* Live Result */}
            <View style={[styles.liveResult, { borderColor: roundedColor }]}>
              <Text style={styles.liveResultLabel}>YOUR COMBINED RATING</Text>
              <Text style={[styles.liveResultNumber, { color: roundedColor }]}>
                {result.rounded}<Text style={styles.liveResultPct}>%</Text>
              </Text>
              <Text style={styles.liveResultRaw}>Raw: {result.raw.toFixed(1)}% → rounded to nearest 10%</Text>
              {result.rounded >= 100 && (
                <Text style={styles.liveResultMax}>Maximum combined rating reached</Text>
              )}
            </View>

            {/* Condition List */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>YOUR CONDITIONS</Text>
              <Text style={styles.sectionSub}>Tap a name to change it. Use − and + to adjust the rating.</Text>
              {conditions.map((cond, i) => (
                <ConditionRow
                  key={cond.id}
                  condition={cond}
                  index={i}
                  onChangeRating={changeRating}
                  onRemove={removeCondition}
                  onCycleName={cycleName}
                />
              ))}
              {conditions.length < 10 && (
                <TouchableOpacity style={styles.addConditionBtn} onPress={addCondition}>
                  <Text style={styles.addConditionText}>+ Add Another Condition</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Step-by-Step Breakdown */}
            {result.steps.length > 0 && (
              <View style={styles.section}>
                <StepBreakdown steps={result.steps} raw={result.raw} rounded={result.rounded} />
              </View>
            )}

            {/* What's next */}
            <View style={styles.nextNote}>
              <Text style={styles.nextNoteIcon}>💡</Text>
              <Text style={styles.nextNoteText}>
                VA ratings are sorted highest first before calculating. Order does not affect the result — the math is the same regardless of sequence.
              </Text>
            </View>
          </>
        )}

        {/* ══════════════ EXAMPLES TAB ══════════════ */}
        {activeTab === 'examples' && (
          <>
            <View style={styles.examplesIntro}>
              <Text style={styles.examplesIntroTitle}>3 Real Veteran Scenarios</Text>
              <Text style={styles.examplesIntroSub}>
                Tap "Show the math" on any example to see the step-by-step VA calculation.
              </Text>
            </View>

            <View style={styles.section}>
              {PRESET_EXAMPLES.map((ex, i) => (
                <ExampleCard key={i} example={ex} />
              ))}
            </View>

            {/* Combinations Guide */}
            <View style={styles.section}>
              <View style={styles.combosHeader}>
                <Text style={styles.combosIcon}>🎯</Text>
                <View>
                  <Text style={styles.combosTitle}>Combinations That Hit 90%</Text>
                  <Text style={styles.combosSub}>Two conditions — before adding any others</Text>
                </View>
              </View>
              {PATHS_TO_90.map((path, i) => (
                <View key={i} style={styles.comboRow}>
                  <Text style={styles.comboConditions}>{path.a} + {path.b}</Text>
                  <View style={styles.comboResult}>
                    <Text style={styles.comboRaw}>{path.raw}%</Text>
                    <Text style={styles.comboArrow}>→</Text>
                    <Text style={styles.comboRounded}>90%</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <View style={styles.combosHeader}>
                <Text style={styles.combosIcon}>⭐</Text>
                <View>
                  <Text style={styles.combosTitle}>Combinations That Hit 100%</Text>
                  <Text style={styles.combosSub}>Two conditions — maximum combined rating</Text>
                </View>
              </View>
              {PATHS_TO_100.map((path, i) => (
                <View key={i} style={styles.comboRow}>
                  <Text style={styles.comboConditions}>{path.a} + {path.b}</Text>
                  <View style={styles.comboResult}>
                    <Text style={styles.comboRaw}>{path.raw}%</Text>
                    <Text style={styles.comboArrow}>→</Text>
                    <Text style={[styles.comboRounded, { color: Colors.teal }]}>100%</Text>
                  </View>
                </View>
              ))}
              <View style={styles.combosNote}>
                <Text style={styles.combosNoteText}>
                  💡 The VA rounds 95% and above to 100%. You do not need a raw score of exactly 100%.
                </Text>
              </View>
            </View>
          </>
        )}

        {/* ══════════════ STRATEGY TAB ══════════════ */}
        {activeTab === 'strategy' && (
          <>
            <View style={styles.strategyIntro}>
              <Text style={styles.strategyIntroTitle}>Why Two Strong Claims Beat Ten Weak Ones</Text>
              <Text style={styles.strategyIntroSub}>
                This is the most important thing most veterans do not understand about VA math.
              </Text>
            </View>

            {/* Visual Comparison */}
            <View style={styles.section}>
              <Text style={styles.comparisonLabel}>SCENARIO COMPARISON</Text>

              {/* Scenario A */}
              <View style={[styles.scenarioCard, styles.scenarioCardLose]}>
                <View style={styles.scenarioHeader}>
                  <Text style={styles.scenarioBadge}>SCENARIO A</Text>
                  <Text style={styles.scenarioResultBad}>→ 70%</Text>
                </View>
                <Text style={styles.scenarioTitle}>10 conditions × 10% each</Text>
                <Text style={styles.scenarioDetail}>
                  Tinnitus 10% + Knee 10% + Shoulder 10% + Ankle 10% + Wrist 10% + Scar 10% + Thumb 10% + Hearing 10% + Pes Planus 10% + Sinusitis 10%
                </Text>
                <View style={styles.scenarioMath}>
                  <Text style={styles.scenarioMathText}>Raw: 65.1% → Rounded: 70%</Text>
                  <Text style={styles.scenarioMathNote}>(0.9)¹⁰ = 34.9% remaining</Text>
                </View>
              </View>

              {/* vs divider */}
              <View style={styles.vsRow}>
                <View style={styles.vsDivider} />
                <Text style={styles.vsText}>VS</Text>
                <View style={styles.vsDivider} />
              </View>

              {/* Scenario B */}
              <View style={[styles.scenarioCard, styles.scenarioCardWin]}>
                <View style={styles.scenarioHeader}>
                  <Text style={[styles.scenarioBadge, { backgroundColor: Colors.teal }]}>SCENARIO B</Text>
                  <Text style={styles.scenarioResultGood}>→ 90%</Text>
                </View>
                <Text style={styles.scenarioTitle}>2 conditions: PTSD 70% + Sleep Apnea 50%</Text>
                <Text style={styles.scenarioDetail}>
                  Just two service-connected conditions — with strong ratings backed by a Nexus Letter and solid C&P exam prep.
                </Text>
                <View style={styles.scenarioMath}>
                  <Text style={styles.scenarioMathText}>Raw: 85% → Rounded: 90%</Text>
                  <Text style={styles.scenarioMathNote}>100% - 30% - 15% = 55% remaining</Text>
                </View>
              </View>

              <View style={styles.winnerCard}>
                <Text style={styles.winnerText}>
                  Scenario B wins by <Text style={{ color: Colors.gold, fontWeight: '900' }}>20 percentage points</Text> — with 8 fewer conditions to maintain, document, and re-evaluate.
                </Text>
              </View>
            </View>

            {/* The 20-condition problem */}
            <View style={styles.section}>
              <View style={styles.insightCard}>
                <Text style={styles.insightTitle}>How many 10% conditions = two strong ones?</Text>
                <View style={styles.insightRow}>
                  <Text style={styles.insightLabel}>10 × 10% conditions</Text>
                  <Text style={styles.insightValue}>→ 70%</Text>
                </View>
                <View style={styles.insightRow}>
                  <Text style={styles.insightLabel}>20 × 10% conditions</Text>
                  <Text style={styles.insightValue}>→ 88% → <Text style={{ color: Colors.gold }}>90%</Text></Text>
                </View>
                <View style={[styles.insightRow, { borderTopWidth: 1, borderTopColor: Colors.navyLight, marginTop: 8, paddingTop: 8 }]}>
                  <Text style={styles.insightLabel}>PTSD 70% + Sleep Apnea 50%</Text>
                  <Text style={[styles.insightValue, { color: Colors.teal }]}>→ 90%</Text>
                </View>
                <Text style={styles.insightConclusion}>
                  You would need 20 separate 10% conditions to match what two well-documented, well-rated primary conditions can do.
                </Text>
              </View>
            </View>

            {/* Key rules */}
            <View style={styles.section}>
              <Text style={styles.rulesTitle}>WHAT THIS MEANS FOR YOUR CLAIM</Text>
              {[
                {
                  icon: '🎯',
                  rule: 'Focus on your strongest conditions first.',
                  detail: 'A single 70% PTSD rating does more work than any number of 10% conditions. Build your claim around your most disabling conditions.',
                },
                {
                  icon: '🔗',
                  rule: 'Secondary conditions stack — but only at their actual level.',
                  detail: 'Sleep Apnea at 50% secondary to PTSD adds 15 points to a 70% primary. At only 10%, it adds just 3 points. The secondary rating matters enormously.',
                },
                {
                  icon: '📋',
                  rule: 'A Nexus Letter that gets you from 50% to 70% on one condition is worth more than five new 10% claims.',
                  detail: 'Going from PTSD 50% to PTSD 70% with proper documentation can be the difference between 70% and 90% combined — a $1,000+ monthly difference in tax-free compensation.',
                },
                {
                  icon: '⚠️',
                  rule: 'Bilateral factor and Special Monthly Compensation (SMC) can push beyond 100%.',
                  detail: 'Veterans with conditions affecting both sides of the body, or with severe single-organ loss, may qualify for ratings that effectively exceed 100% via SMC. This calculator shows standard combined ratings only.',
                },
              ].map((item, i) => (
                <View key={i} style={styles.ruleCard}>
                  <View style={styles.ruleHeader}>
                    <Text style={styles.ruleIcon}>{item.icon}</Text>
                    <Text style={styles.ruleTitle}>{item.rule}</Text>
                  </View>
                  <Text style={styles.ruleDetail}>{item.detail}</Text>
                </View>
              ))}
            </View>

            <View style={styles.bottomNote}>
              <Text style={styles.bottomNoteIcon}>🛡️</Text>
              <Text style={styles.bottomNoteText}>
                This calculator uses the official VA combined ratings formula. Results are for planning and educational purposes. Your actual VA rating is determined by the VA based on medical evidence, C&P exams, and the rating schedule.
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
    gap: 8,
  },
  explainerTitle: { color: Colors.white, fontSize: 15, fontWeight: '800', fontFamily: Font.display },
  explainerBody: { color: Colors.gray300, fontSize: 13, lineHeight: 19 },
  explainerFormula: {
    backgroundColor: Colors.dark,
    borderRadius: Radius.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.navyLight,
    marginTop: 4,
  },
  explainerFormulaText: { color: Colors.teal, fontSize: 12, lineHeight: 20, fontFamily: Font.mono },

  // Live result
  liveResult: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.md,
    borderWidth: 2,
    padding: Spacing.md,
    alignItems: 'center',
  },
  liveResultLabel: { color: Colors.gray500, fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 4 },
  liveResultNumber: { fontSize: 64, fontWeight: '900', fontFamily: Font.display, lineHeight: 68 },
  liveResultPct: { fontSize: 32 },
  liveResultRaw: { color: Colors.gray500, fontSize: 11, marginTop: 4 },
  liveResultMax: { color: Colors.teal, fontSize: 12, fontWeight: '700', marginTop: 4 },

  // Section
  section: { paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
  sectionLabel: { color: Colors.gray500, fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 4 },
  sectionSub: { color: Colors.gray500, fontSize: 11, marginBottom: Spacing.sm },

  // Condition Row
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.md,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.navyLight,
    gap: 8,
  },
  conditionLabelBtn: { flex: 1 },
  conditionLabelText: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  conditionLabelHint: { color: Colors.gray700, fontSize: 9, marginTop: 1 },
  ratingControl: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingBtn: {
    width: 32,
    height: 32,
    backgroundColor: Colors.navyLight,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingBtnDisabled: { backgroundColor: Colors.dark },
  ratingBtnText: { color: Colors.white, fontSize: 18, fontWeight: '700', lineHeight: 22 },
  ratingDisplay: {
    width: 52,
    alignItems: 'center',
    backgroundColor: Colors.dark,
    borderRadius: Radius.sm,
    paddingVertical: 4,
  },
  ratingDisplayText: { color: Colors.gold, fontSize: 16, fontWeight: '800' },
  ratingDisplayPct: { fontSize: 11 },
  removeBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(231,76,60,0.15)',
    borderRadius: Radius.sm,
  },
  removeBtnText: { color: Colors.crimsonLight, fontSize: 12, fontWeight: '700' },

  addConditionBtn: {
    borderWidth: 1,
    borderColor: Colors.navyLight,
    borderStyle: 'dashed',
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: 4,
  },
  addConditionText: { color: Colors.gray300, fontSize: 13, fontWeight: '600' },

  // Step Breakdown
  stepBreakdown: {
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.navyLight,
  },
  stepBreakdownTitle: { color: Colors.gray500, fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: Spacing.sm },
  mathRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  mathRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  mathRowRight: { alignItems: 'flex-end' },
  mathDot: { width: 8, height: 8, borderRadius: 4 },
  mathRowLabel: { color: Colors.gray300, fontSize: 12, flex: 1 },
  mathRowValue: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  mathRowRemaining: { color: Colors.gray500, fontSize: 10, marginTop: 1 },
  mathArrow: { flexDirection: 'row', alignItems: 'flex-start', paddingLeft: 4, paddingVertical: 2, gap: 8 },
  mathArrowLine: { color: Colors.navyLight, fontSize: 16, lineHeight: 20 },
  mathArrowText: { color: Colors.gray500, fontSize: 11, flex: 1, lineHeight: 18 },
  mathDivider: { height: 1, backgroundColor: Colors.navyLight, marginVertical: 8 },
  mathFinalLabel: { color: Colors.gray300, fontSize: 12 },
  mathFinalValue: { fontSize: 14, fontWeight: '700' },

  nextNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: 'rgba(201,168,76,0.08)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
  },
  nextNoteIcon: { fontSize: 16 },
  nextNoteText: { color: Colors.gray300, fontSize: 12, lineHeight: 18, flex: 1 },

  // Result Badge (used in examples)
  resultBadge: {
    alignItems: 'center',
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.md,
    borderWidth: 2,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  resultNumber: { fontSize: 48, fontWeight: '900', fontFamily: Font.display },
  resultPct: { fontSize: 24 },
  resultLabel: { color: Colors.gray500, fontSize: 10, fontWeight: '800', letterSpacing: 2, marginTop: 4 },
  resultRaw: { color: Colors.gray500, fontSize: 11, marginTop: 4 },
  resultMax: { color: Colors.teal, fontSize: 12, fontWeight: '700', marginTop: 4 },

  // Examples tab
  examplesIntro: {
    margin: Spacing.md,
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.navyLight,
  },
  examplesIntroTitle: { color: Colors.white, fontSize: 15, fontWeight: '800', fontFamily: Font.display, marginBottom: 4 },
  examplesIntroSub: { color: Colors.gray300, fontSize: 12, lineHeight: 18 },

  exampleCard: {
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.navyLight,
    overflow: 'hidden',
  },
  exampleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    gap: 12,
  },
  exampleBranchRow: { marginBottom: 4 },
  exampleBranchBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.navyLight,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  exampleBranchText: { color: Colors.gray500, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  exampleTitle: { color: Colors.white, fontSize: 14, fontWeight: '800', marginBottom: 4 },
  exampleStory: { color: Colors.gray300, fontSize: 12, lineHeight: 17 },
  exampleResultBadge: {
    width: 52,
    height: 52,
    borderRadius: Radius.full,
    backgroundColor: Colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  exampleResultNum: { fontSize: 18, fontWeight: '900', fontFamily: Font.display },
  exampleConditions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  exampleConditionPill: {
    backgroundColor: Colors.dark,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.navyLight,
  },
  exampleConditionText: { color: Colors.gray300, fontSize: 11 },
  exampleExpandBtn: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.navyLight,
    alignItems: 'center',
  },
  exampleExpandText: { color: Colors.gold, fontSize: 12, fontWeight: '700' },

  // Combos
  combosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.navyLight,
  },
  combosIcon: { fontSize: 20 },
  combosTitle: { color: Colors.white, fontSize: 14, fontWeight: '800' },
  combosSub: { color: Colors.gray500, fontSize: 11, marginTop: 2 },
  comboRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.sm,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.navyLight,
  },
  comboConditions: { color: Colors.gray300, fontSize: 12, flex: 1 },
  comboResult: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  comboRaw: { color: Colors.gray500, fontSize: 11 },
  comboArrow: { color: Colors.gray500, fontSize: 11 },
  comboRounded: { color: Colors.gold, fontSize: 14, fontWeight: '800' },
  combosNote: {
    backgroundColor: 'rgba(201,168,76,0.08)',
    borderRadius: Radius.sm,
    padding: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
  },
  combosNoteText: { color: Colors.gray300, fontSize: 12, lineHeight: 17 },

  // Strategy tab
  strategyIntro: {
    margin: Spacing.md,
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.navyLight,
  },
  strategyIntroTitle: { color: Colors.white, fontSize: 15, fontWeight: '800', fontFamily: Font.display, marginBottom: 6 },
  strategyIntroSub: { color: Colors.gray300, fontSize: 12, lineHeight: 18 },

  comparisonLabel: { color: Colors.gray500, fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: Spacing.sm },
  scenarioCard: {
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: 8,
    borderWidth: 1,
  },
  scenarioCardLose: {
    backgroundColor: 'rgba(192,57,43,0.06)',
    borderColor: 'rgba(231,76,60,0.3)',
  },
  scenarioCardWin: {
    backgroundColor: 'rgba(26,188,156,0.08)',
    borderColor: 'rgba(26,188,156,0.4)',
  },
  scenarioHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  scenarioBadge: {
    backgroundColor: Colors.crimsonLight,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    color: Colors.white,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  scenarioResultBad: { color: Colors.crimsonLight, fontSize: 20, fontWeight: '900' },
  scenarioResultGood: { color: Colors.teal, fontSize: 20, fontWeight: '900' },
  scenarioTitle: { color: Colors.white, fontSize: 13, fontWeight: '700', marginBottom: 6 },
  scenarioDetail: { color: Colors.gray300, fontSize: 12, lineHeight: 17, marginBottom: 8 },
  scenarioMath: {
    backgroundColor: Colors.dark,
    borderRadius: Radius.sm,
    padding: 8,
  },
  scenarioMathText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  scenarioMathNote: { color: Colors.gray500, fontSize: 10, marginTop: 2, fontFamily: Font.mono },

  vsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
  vsDivider: { flex: 1, height: 1, backgroundColor: Colors.navyLight },
  vsText: { color: Colors.gray500, fontSize: 11, fontWeight: '800', letterSpacing: 2 },

  winnerCard: {
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
    marginTop: 8,
  },
  winnerText: { color: Colors.gray300, fontSize: 13, lineHeight: 19 },

  insightCard: {
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.navyLight,
  },
  insightTitle: { color: Colors.white, fontSize: 14, fontWeight: '800', marginBottom: Spacing.sm },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.navyLight,
  },
  insightLabel: { color: Colors.gray300, fontSize: 12, flex: 1 },
  insightValue: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  insightConclusion: { color: Colors.gray500, fontSize: 12, lineHeight: 17, marginTop: Spacing.sm },

  rulesTitle: { color: Colors.gray500, fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: Spacing.sm },
  ruleCard: {
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.navyLight,
  },
  ruleHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  ruleIcon: { fontSize: 16 },
  ruleTitle: { color: Colors.white, fontSize: 13, fontWeight: '700', flex: 1, lineHeight: 18 },
  ruleDetail: { color: Colors.gray300, fontSize: 12, lineHeight: 17 },

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

export default VARatingCalculator;
