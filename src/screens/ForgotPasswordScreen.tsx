import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { RootStackParamList } from '../navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: { navigation: Nav }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSend() {
    setError('');
    if (!email.trim()) {
      setError('Digite seu e-mail.');
      return;
    }
    setLoading(true);
    const redirectTo = Platform.OS === 'web'
      ? `${window.location.origin}/?type=recovery`
      : 'flowz://reset-password';
    const { error: err } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo },
    );
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      setSent(true);
    }
  }

  const s = styles(colors);

  if (sent) {
    return (
      <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={[s.backText, { color: colors.primary }]}>← Voltar</Text>
        </TouchableOpacity>
        <View style={s.sentWrap}>
          <Text style={s.sentEmoji}>📧</Text>
          <Text style={[s.sentTitle, { color: colors.text }]}>E-mail enviado</Text>
          <Text style={[s.sentDesc, { color: colors.textSecondary }]}>
            Verifique sua caixa de entrada e clique no link para redefinir sua senha.
          </Text>
          <TouchableOpacity
            style={[s.loginBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={s.loginBtnText}>Voltar ao login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
        <Text style={[s.backText, { color: colors.primary }]}>← Voltar</Text>
      </TouchableOpacity>

      <View style={s.inner}>
        <Text style={[s.title, { color: colors.text }]}>Esqueci minha senha</Text>
        <Text style={[s.subtitle, { color: colors.textSecondary }]}>
          Informe seu e-mail e enviaremos um link para redefinir sua senha.
        </Text>

        <View style={s.form}>
          <TextInput
            style={[s.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
            placeholder="E-mail"
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            editable={!loading}
          />

          {error ? <Text style={s.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[s.loginBtn, { backgroundColor: colors.primary }, loading && s.btnDisabled]}
            onPress={handleSend}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.loginBtnText}>Enviar link</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function styles(colors: any) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    backBtn: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 8,
    },
    backText: {
      fontSize: 16,
      fontWeight: '600',
    },
    inner: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 32,
      marginTop: -60,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      letterSpacing: -0.8,
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 15,
      lineHeight: 22,
      marginBottom: 32,
    },
    form: {
      gap: 12,
    },
    input: {
      height: 52,
      borderRadius: 14,
      paddingHorizontal: 16,
      fontSize: 16,
      borderWidth: 1,
    },
    errorText: {
      color: '#FF3B30',
      fontSize: 13,
      textAlign: 'center',
    },
    loginBtn: {
      height: 52,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },
    btnDisabled: {
      opacity: 0.6,
    },
    loginBtnText: {
      color: '#fff',
      fontSize: 17,
      fontWeight: '700',
      letterSpacing: -0.3,
    },
    sentWrap: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      marginTop: -60,
    },
    sentEmoji: {
      fontSize: 64,
      marginBottom: 24,
    },
    sentTitle: {
      fontSize: 26,
      fontWeight: '800',
      letterSpacing: -0.8,
      marginBottom: 12,
      textAlign: 'center',
    },
    sentDesc: {
      fontSize: 15,
      lineHeight: 22,
      textAlign: 'center',
      marginBottom: 40,
    },
  });
}
