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
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Colors, Spacing, Radius, Font } from '../theme';

interface LoginScreenProps {
  onGoToSignup: () => void;
  onGoToForgotPassword: () => void;
}

export function LoginScreen({ onGoToSignup, onGoToForgotPassword }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    setLoading(false);
    if (authError) {
      setError(authError.message);
    }
    // On success, App.tsx's onAuthStateChange fires and routes to main app automatically
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.dark} />

      <View style={styles.inner}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>VEN</Text>
          <Text style={styles.tagline}>Veteran Education Network</Text>
          <Text style={styles.subtitle}>Your VA benefits, in plain English.</Text>
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
            placeholder="Your password"
            placeholderTextColor={Colors.gray500}
            secureTextEntry
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.dark} />
            ) : (
              <Text style={styles.buttonText}>Log In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onGoToForgotPassword} style={styles.linkRow}>
            <Text style={styles.linkText}>Forgot your password?</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={onGoToSignup}>
            <Text style={styles.footerLink}>Sign up free</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark,
  },
  inner: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
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
  subtitle: {
    fontSize: 13,
    color: Colors.gray500,
    marginTop: Spacing.xs,
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
  linkRow: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  linkText: {
    color: Colors.gray300,
    fontSize: 13,
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
});
