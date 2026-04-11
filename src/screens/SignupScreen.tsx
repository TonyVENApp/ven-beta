import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  ScrollView,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Colors, Spacing, Radius, Font } from '../theme';

interface SignupScreenProps {
  onGoToLogin: () => void;
}

export function SignupScreen({ onGoToLogin }: SignupScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSignup() {
    if (!email.trim() || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');

    const { error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    });

    setLoading(false);
    if (authError) {
      setError(authError.message);
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.dark} />
        <View style={styles.successBox}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.successTitle}>Check your email</Text>
          <Text style={styles.successText}>
            We sent a confirmation link to {email.trim().toLowerCase()}.
            {'\n\n'}
            Tap the link in that email, then come back here and log in.
          </Text>
          <TouchableOpacity style={styles.button} onPress={onGoToLogin}>
            <Text style={styles.buttonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.dark} />

      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>VEN</Text>
          <Text style={styles.tagline}>Create your free account</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@email.com"
            placeholderTextColor={Colors.gray500}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="At least 6 characters"
            placeholderTextColor={Colors.gray500}
            secureTextEntry
          />

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Repeat your password"
            placeholderTextColor={Colors.gray500}
            secureTextEntry
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.dark} />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={onGoToLogin}>
            <Text style={styles.footerLink}>Log in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark,
  },
  inner: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  logo: {
    fontFamily: Font.display,
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.gold,
    letterSpacing: 6,
  },
  tagline: {
    fontSize: 14,
    color: Colors.gray300,
    marginTop: Spacing.xs,
    letterSpacing: 1,
  },
  form: {
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 13,
    color: Colors.gray300,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.navyLight,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.white,
    borderWidth: 1,
    borderColor: Colors.navyLight,
  },
  errorText: {
    color: Colors.crimsonLight,
    fontSize: 13,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  button: {
    backgroundColor: Colors.gold,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.dark,
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: Colors.gray500,
    fontSize: 14,
  },
  footerLink: {
    color: Colors.gold,
    fontSize: 14,
    fontWeight: 'bold',
  },
  successBox: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 56,
    color: Colors.teal,
    marginBottom: Spacing.lg,
  },
  successTitle: {
    fontFamily: Font.display,
    fontSize: 26,
    color: Colors.white,
    marginBottom: Spacing.md,
  },
  successText: {
    fontSize: 15,
    color: Colors.gray300,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
});
