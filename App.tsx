import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { VeteranDashboard } from './src/screens/VeteranDashboard';
import { WalkthroughEngine } from './src/screens/WalkthroughEngine';
import { DocumentVault } from './src/screens/DocumentVault';

export default function App() {
  const [screen, setScreen] = useState<'dashboard' | 'walkthrough' | 'vault'>('dashboard');

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

  return (
    <>
      <StatusBar style="light" />
      <VeteranDashboard
        onOpenWalkthrough={() => setScreen('walkthrough')}
        onOpenVault={() => setScreen('vault')}
      />
    </>
  );
}
