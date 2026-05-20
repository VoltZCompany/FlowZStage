import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Animated, Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { RootStackParamList } from '../navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ResetPassword'>;

export default function ResetPasswordScreen({ navigation }: { navigation: Nav }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // On web the recovery token arrives in the URL hash — Supabase handles it automatically
  // via detectSessionInUrl. On native it arrives via deep link handled in AppNavigator.
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Supabase client auto-processes the hash; wait for session
      supabase.auth.getSession().then(({ data }) => {
        if (!data.session) {
          setError('Link inválido ou expirado. Solicite um novo link.');
        }
      });
    }
  }, []);

  function shake() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true, easing: Easing.linear }),
    ]).start();
  }

  async function handleReset() {
    setError('');
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      shake();
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      shake();
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) {
      setError(err.message);
      shake();
    } else {
      setDone(true);
    }
  }

  const s = styles(colors);

  if (done) {
    return (
      <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={s.doneWrap}>
          <Text style={s.doneEmoji}>✅</Text>
          <Text style={[s.doneTitle, { color: colors.text }]}>Senha redefinida!</Text>
          <Text style={[s.doneDesc, { color: colors.textSecondary }]}>
            Sua senha foi atualizada com sucesso. Você já está logado.
          </Text>
          <TouchableOpacity
            style={[s.btn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
          >
            <Text style={s.btnText}>Ir para o app</Text>
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
      <View style={s.inner}>
        <Text style={[s.title, { color: colors.text }]}>Nova senha</Text>
        <Text style={[s.subtitle, { color: colors.textSecondary }]}>
          Escolha uma nova senha com pelo menos 6 caracteres.
        </Text>

        <Animated.View style={[s.form, { transform: [{ translateX: shakeAnim }] }]}>
          <TextInput
            style={[s.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
            placeholder="Nova senha"
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="next"
            editable={!loading}
          />
          <TextInput
            style={[s.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
            placeholder="Confirmar senha"
            placeholderTextColor={colors.textSecondary}
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            returnKeyType="go"
            onSubmitEditing={handleReset}
            editable={!loading}
          />

          {error ? <Text style={s.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[s.btn, { backgroundColor: colors.primary }, loading && s.btnDisabled]}
            onPress={handleReset}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>Redefinir senha</Text>
            }
          </TouchableOpacity>
        </Animated.View>
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
    inner: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 32,
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
    btn: {
      height: 52,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },
    btnDisabled: {
      opacity: 0.6,
    },
    btnText: {
      color: '#fff',
      fontSize: 17,
      fontWeight: '700',
      letterSpacing: -0.3,
    },
    doneWrap: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    doneEmoji: {
      fontSize: 64,
      marginBottom: 24,
    },
    doneTitle: {
      fontSize: 26,
      fontWeight: '800',
      letterSpacing: -0.8,
      marginBottom: 12,
      textAlign: 'center',
    },
    doneDesc: {
      fontSize: 15,
      lineHeight: 22,
      textAlign: 'center',
      marginBottom: 40,
    },
  });
}
