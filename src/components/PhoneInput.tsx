import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native';
import { Spacing, FontSize, Radius } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

interface Props {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  label?: string;
}

function formatPhone(raw: string): string {
  // Strip tudo que não é dígito e limita a 13 (55 + DDD 2 + número 9 dígitos)
  return raw.replace(/\D/g, '').slice(0, 13);
}

function buildWhatsAppUrl(digits: string): string {
  const clean = digits.replace(/\D/g, '');
  // Se começar com 0 (ex: 014...) descarta o zero
  const withoutLeadingZero = clean.replace(/^0+/, '');
  // Garante prefixo 55
  const number = withoutLeadingZero.startsWith('55') ? withoutLeadingZero : `55${withoutLeadingZero}`;
  return `https://wa.me/${number}`;
}

function displayPhone(digits: string): string {
  // Exibe o número normalizado de forma legível para o usuário confirmar
  const d = digits.replace(/\D/g, '');
  const n = d.startsWith('55') ? d.slice(2) : d;
  if (n.length === 11) return `+55 (${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
  if (n.length === 10) return `+55 (${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  if (d.length > 0) return `+55 ${n}`;
  return '';
}

export default function PhoneInput({ value, onChangeText, placeholder = '+55 (11) 98765-4321', label }: Props) {
  const { colors } = useTheme();

  const handleChange = (raw: string) => {
    onChangeText(formatPhone(raw));
  };

  const openWhatsApp = () => {
    if (value.length < 8) return;
    const url = buildWhatsAppUrl(value);
    if (Platform.OS === 'web') {
      window.open(url, '_blank', 'noopener');
    } else {
      Linking.openURL(url);
    }
  };

  const hasNumber = value.length >= 8;
  const preview = hasNumber ? displayPhone(value) : '';

  return (
    <View>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
      <View style={[styles.row, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={handleChange}
          keyboardType="phone-pad"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={[styles.waBtn, { backgroundColor: hasNumber ? '#25D366' : colors.border }]}
          onPress={openWhatsApp}
          disabled={!hasNumber}
        >
          <Text style={styles.waIcon}>💬</Text>
        </TouchableOpacity>
      </View>
      {preview ? (
        <Text style={[styles.preview, { color: colors.textSecondary }]}>💬 WhatsApp: {preview}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    letterSpacing: 0.1,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  prefix: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRightWidth: 1.5,
    justifyContent: 'center',
  },
  prefixText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.md,
  },
  waBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 42,
  },
  waIcon: {
    fontSize: 20,
  },
  preview: {
    fontSize: 12,
    marginTop: 5,
    fontWeight: '500',
  },
});
