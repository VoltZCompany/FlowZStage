import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Image,
  Animated, Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { RootStackParamList } from '../navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: { navigation: Nav }) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;

  function shake() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true, easing: Easing.linear }),
    ]).start();
  }

  async function handleLogin() {
    setError('');
    if (!email.trim() || !password) {
      setError('Preencha e-mail e senha.');
      shake();
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setLoading(false);
    if (err) {
      setError(err.message === 'Invalid login credentials'
        ? 'E-mail ou senha incorretos.'
        : err.message);
      shake();
    }
    // on success, onAuthStateChange in AppNavigator handles navigation
  }

  const s = styles(colors, isDark);

  return (
    <KeyboardAvoidingView
      style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={s.inner}>
        {/* Logo */}
        <View style={s.logoWrap}>
          <Image source={require('../../assets/icon.png')} style={s.logo} resizeMode="cover" />
          <Text style={s.appName}>FlowZ</Text>
          <Text style={s.subtitle}>Produtor</Text>
          <Text style={s.tagline}>Gestão de shows profissional</Text>
        </View>

        {/* Form */}
        <Animated.View style={[s.form, { transform: [{ translateX: shakeAnim }] }]}>
          <TextInput
            style={[s.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
            placeholder="E-mail"
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            editable={!loading}
          />
          <TextInput
            style={[s.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
            placeholder="Senha"
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="go"
            onSubmitEditing={handleLogin}
            editable={!loading}
          />

          {error ? <Text style={s.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[s.loginBtn, loading && s.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.loginBtnText}>Entrar</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={s.forgotBtn}
            onPress={() => navigation.navigate('ForgotPassword')}
            disabled={loading}
          >
            <Text style={[s.forgotText, { color: colors.primary }]}>Esqueci minha senha</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

function styles(colors: any, isDark: boolean) {
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
    logoWrap: {
      alignItems: 'center',
      marginBottom: 48,
    },
    logo: {
      width: 80,
      height: 80,
      borderRadius: 20,
      marginBottom: 16,
    },
    appName: {
      fontSize: 36,
      fontWeight: '800',
      letterSpacing: -1,
      color: colors.text,
      marginBottom: 0,
    },
    subtitle: {
      fontSize: 18,
      fontWeight: '600',
      letterSpacing: -0.3,
      color: colors.primary,
      marginBottom: 8,
    },
    tagline: {
      fontSize: 14,
      color: colors.textSecondary,
      letterSpacing: -0.2,
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
      marginTop: 4,
    },
    loginBtn: {
      height: 52,
      borderRadius: 14,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },
    loginBtnDisabled: {
      opacity: 0.6,
    },
    loginBtnText: {
      color: '#fff',
      fontSize: 17,
      fontWeight: '700',
      letterSpacing: -0.3,
    },
    forgotBtn: {
      alignItems: 'center',
      paddingVertical: 12,
    },
    forgotText: {
      fontSize: 15,
      fontWeight: '500',
    },
  });
}
