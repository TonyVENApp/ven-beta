import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { VeteranDashboard } from './src/screens/VeteranDashboard';
import { WalkthroughEngine } from './src/screens/WalkthroughEngine';
import { DocumentVault } from './src/screens/DocumentVault';
import { CPExamPrep } from './src/screens/CPExamPrep';

export default function App() {
  const [screen, setScreen] = useState<'dashboard' | 'walkthrough' | 'vault' | 'cpprep'>('dashboard');

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

  return (
    <>
      <StatusBar style="light" />
      <VeteranDashboard
        onOpenWalkthrough={() => setScreen('walkthrough')}
        onOpenVault={() => setScreen('vault')}
        onOpenCPPrep={() => setScreen('cpprep')}
      />
    </>
  );
}
