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

interface ForgotPasswordScreenProps {
  onGoToLogin: () => void;
}

export function ForgotPasswordScreen({ onGoToLogin }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSendReset() {
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError('');

    const { error: authError } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase()
    );

    setLoading(false);
    if (authError) {
      setError(authError.message);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.dark} />
        <View style={styles.sentBox}>
          <Text style={styles.sentIcon}>✉</Text>
          <Text style={styles.sentTitle}>Reset link sent</Text>
          <Text style={styles.sentText}>
            We sent a password reset link to:{'\n'}
            <Text style={styles.emailHighlight}>{email.trim().toLowerCase()}</Text>
            {'\n\n'}
            Check your inbox and follow the link to set a new password.
          </Text>
          <TouchableOpacity style={styles.button} onPress={onGoToLogin}>
            <Text style={styles.buttonText}>Back to Login</Text>
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

      <View style={styles.inner}>
        {/* Back button */}
        <TouchableOpacity style={styles.backButton} onPress={onGoToLogin}>
          <Text style={styles.backText}>← Back to Login</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            Enter the email on your account and we'll send you a link to reset your password.
          </Text>
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

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSendReset}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.dark} />
            ) : (
              <Text style={styles.buttonText}>Send Reset Link</Text>
            )}
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
    paddingTop: Spacing.xxl,
  },
  backButton: {
    marginBottom: Spacing.xl,
  },
  backText: {
    color: Colors.gold,
    fontSize: 14,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontFamily: Font.display,
    fontSize: 28,
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.gray300,
    lineHeight: 20,
  },
  form: {
    backgroundColor: Colors.navyMid,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  label: {
    fontSize: 13,
    color: Colors.gray300,
    marginBottom: Spacing.xs,
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
  sentBox: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sentIcon: {
    fontSize: 56,
    color: Colors.gold,
    marginBottom: Spacing.lg,
  },
  sentTitle: {
    fontFamily: Font.display,
    fontSize: 26,
    color: Colors.white,
    marginBottom: Spacing.md,
  },
  sentText: {
    fontSize: 15,
    color: Colors.gray300,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  emailHighlight: {
    color: Colors.gold,
    fontWeight: 'bold',
  },
});
