import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Colors, Font, Radius, Spacing } from '../theme';

interface StateBenefitsScreenProps {
  onBack: () => void;
}

export function StateBenefitsScreen({ onBack }: StateBenefitsScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>State Benefits</Text>
        <View style={styles.topBarSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.title}>State Benefits</Text>
          <Text style={styles.subtitle}>
            This area will help Veterans and family members see what their state offers.
          </Text>
        </View>
      </View>
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
    fontWeight: '700',
  },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Font.display,
  },
  topBarSpacer: {
    minWidth: 90,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  heroCard: {
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.navyLight,
  },
  title: {
    color: Colors.white,
    fontSize: 28,
    fontWeight: '800',
    fontFamily: Font.display,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    color: Colors.gray300,
    fontSize: 15,
    lineHeight: 22,
  },
});
