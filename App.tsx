import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { VeteranDashboard } from './src/screens/VeteranDashboard';
import { WalkthroughEngine } from './src/screens/WalkthroughEngine';

export default function App() {
  const [screen, setScreen] = useState<'dashboard' | 'walkthrough'>('dashboard');

  if (screen === 'walkthrough') {
    return (
      <>
        <StatusBar style="light" />
        <WalkthroughEngine onBack={() => setScreen('dashboard')} />
      </>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <VeteranDashboard onOpenWalkthrough={() => setScreen('walkthrough')} />
    </>
  );
}
