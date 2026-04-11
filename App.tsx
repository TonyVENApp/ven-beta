import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { LoginScreen } from './src/screens/LoginScreen';
import { SignupScreen } from './src/screens/SignupScreen';
import { ForgotPasswordScreen } from './src/screens/ForgotPasswordScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { VeteranDashboard } from './src/screens/VeteranDashboard';
import UserProfile from './src/screens/UserProfile';
import { WalkthroughEngine } from './src/screens/WalkthroughEngine';
import { DocumentVault } from './src/screens/DocumentVault';
import { CPExamPrep } from './src/screens/CPExamPrep';
import { NexusNavigator } from './src/screens/NexusNavigator';
import { VARatingCalculator } from './src/screens/VARatingCalculator';
import { DependentsFamilyScreen } from './src/screens/DependentsFamilyScreen';
import { EducationBenefits } from './src/screens/EducationBenefits';
import { EducationApplicationForm } from './src/screens/EducationApplicationForm';
import { getDashboardMode } from './src/lib/dashboardMode';
import { supabase } from './src/lib/supabase';
import { Colors } from './src/theme';

type MainScreen =
  | 'dashboard'
  | 'onboarding'
  | 'profile'
  | 'walkthrough'
  | 'vault'
  | 'cpprep'
  | 'nexus'
  | 'calculator'
  | 'dependents'
  | 'education'
  | 'educationApplication';

type AuthScreen = 'login' | 'signup' | 'forgot';
type EducationBenefit = 'ch33' | 'ch30' | 'vre';

type VeteranProfile = {
  full_name?: string | null;
  branch?: string | null;
  state?: string | null;
  rating?: number | string | null;
  va_rating_level?: string | null;
  va_is_pt?: boolean | null;
  va_is_tdiu?: boolean | null;
};

const DEFAULT_VETERAN = {
  name: 'Veteran',
  branch: 'Army',
  state: 'Texas',
  currentRating: 70,
  potentialRating: 90,
  effectiveDate: 'Mar 12, 2024',
};

function parseSavedRating(rating?: number | string | null) {
  if (rating == null || rating === '') {
    return null;
  }

  const numericRating = typeof rating === 'number' ? rating : Number(rating);
  return Number.isFinite(numericRating) && numericRating >= 0 && numericRating <= 100 ? numericRating : null;
}

function normalizeName(name?: string | null) {
  const trimmedName = name?.trim();
  return trimmedName ? trimmedName : null;
}

function getSessionUserName(session: Session | null) {
  const metadata = session?.user.user_metadata;
  return (
    normalizeName(metadata?.full_name) ??
    normalizeName(metadata?.name) ??
    normalizeName(metadata?.display_name) ??
    normalizeName(session?.user.email?.split("@")[0])
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');
  const [screen, setScreen] = useState<MainScreen>('dashboard');
  const [educationBenefit, setEducationBenefit] = useState<EducationBenefit>('ch33');
  const [profile, setProfile] = useState<VeteranProfile | null>(null);
  const [savedDashboardRating, setSavedDashboardRating] = useState<number | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  async function loadProfile(userId: string) {
    setProfileLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('full_name, branch, state, rating, va_rating_level, va_is_pt, va_is_tdiu, edu_app_draft_started')
      .eq('id', userId)
      .single();

    setProfile((data ?? null) as VeteranProfile | null);
    setSavedDashboardRating(parseSavedRating(data?.rating));
    setProfileLoading(false);
    return data as VeteranProfile | null;
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const currentSession = data.session;
      setSession(currentSession);
      if (currentSession?.user) {
        await loadProfile(currentSession.user.id);
      }
      setInitializing(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        setAuthScreen('login');
        setScreen('dashboard');
        void loadProfile(nextSession.user.id);
      } else {
        setProfile(null);
        setSavedDashboardRating(null);
        setAuthScreen('login');
        setScreen('dashboard');
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function refreshProfile() {
    if (session?.user) {
      await loadProfile(session.user.id);
    }
  }

  if (initializing || profileLoading) {
    return (
      <>
        <StatusBar style="light" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.dark }}>
          <ActivityIndicator color={Colors.gold} />
        </View>
      </>
    );
  }

  if (!session) {
    if (authScreen === 'signup') {
      return (
        <>
          <StatusBar style="light" />
          <SignupScreen onGoToLogin={() => setAuthScreen('login')} />
        </>
      );
    }

    if (authScreen === 'forgot') {
      return (
        <>
          <StatusBar style="light" />
          <ForgotPasswordScreen onGoToLogin={() => setAuthScreen('login')} />
        </>
      );
    }

    return (
      <>
        <StatusBar style="light" />
        <LoginScreen
          onGoToSignup={() => setAuthScreen('signup')}
          onGoToForgotPassword={() => setAuthScreen('forgot')}
        />
      </>
    );
  }

  if (screen === 'onboarding') {
    return (
      <>
        <StatusBar style="light" />
        <OnboardingScreen
          onComplete={async () => {
            await refreshProfile();
            setScreen('dashboard');
          }}
        />
      </>
    );
  }

  const veteran = {
    ...DEFAULT_VETERAN,
    name: normalizeName(profile?.full_name) ?? getSessionUserName(session) ?? DEFAULT_VETERAN.name,
    branch: profile?.branch ?? DEFAULT_VETERAN.branch,
    state: profile?.state ?? DEFAULT_VETERAN.state,
    currentRating:
      getDashboardMode(profile) === 'below_100' && savedDashboardRating !== null
        ? savedDashboardRating
        : DEFAULT_VETERAN.currentRating,
  };

  if (screen === 'walkthrough') {
    return (
      <>
        <StatusBar style="light" />
        <WalkthroughEngine
          onBack={() => setScreen('dashboard')}
          onComplete={() => setScreen('dashboard')}
        />
      </>
    );
  }

  if (screen === 'vault') {
    return (
      <>
        <StatusBar style="light" />
        <DocumentVault onBack={() => setScreen('dashboard')} />
      </>
    );
  }

  if (screen === 'cpprep') {
    return (
      <>
        <StatusBar style="light" />
        <CPExamPrep onBack={() => setScreen('dashboard')} daysUntilExam={14} />
      </>
    );
  }

  if (screen === 'nexus') {
    return (
      <>
        <StatusBar style="light" />
        <NexusNavigator onBack={() => setScreen('dashboard')} />
      </>
    );
  }

  if (screen === 'calculator') {
    return (
      <>
        <StatusBar style="light" />
        <VARatingCalculator onBack={() => setScreen('dashboard')} />
      </>
    );
  }

  if (screen === 'profile') {
    return (
      <>
        <StatusBar style="light" />
        <UserProfile onBack={() => setScreen('dashboard')} onSaveComplete={async () => {
          await refreshProfile();
          setScreen('dashboard');
        }} />
      </>
    );
  }

  if (screen === 'dependents') {
    return (
      <>
        <StatusBar style="light" />
        <DependentsFamilyScreen onBack={() => setScreen('dashboard')} veteranProfile={profile} />
      </>
    );
  }

  if (screen === 'education') {
    return (
      <>
        <StatusBar style="light" />
        <EducationBenefits
          onBack={() => setScreen('dashboard')}
          onApply={(benefit) => {
            setEducationBenefit(benefit);
            setScreen('educationApplication');
          }}
        />
      </>
    );
  }

  if (screen === 'educationApplication') {
    return (
      <>
        <StatusBar style="light" />
        <EducationApplicationForm benefitType={educationBenefit} onBack={() => setScreen('education')} />
      </>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <VeteranDashboard
        veteran={veteran}
        onOpenProfile={() => setScreen('profile')}
        onOpenWalkthrough={() => setScreen('walkthrough')}
        onOpenVault={() => setScreen('vault')}
        onOpenCPPrep={() => setScreen('cpprep')}
        onOpenNexus={() => setScreen('nexus')}
        onOpenCalculator={() => setScreen('calculator')}
        onOpenDependents={() => setScreen('dependents')}
        onOpenEducation={() => setScreen('education')}
      />
    </>
  );
}
