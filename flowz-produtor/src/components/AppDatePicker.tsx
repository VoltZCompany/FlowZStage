import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Spacing, FontSize, Radius } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  label?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  mode: 'date' | 'time';
  minimumDate?: Date;
  /** Quando true, mostra um pílula "A definir" do lado pra limpar o valor. */
  clearable?: boolean;
  /** Texto do botão de limpar (default: "A definir"). */
  clearLabel?: string;
  /** Texto exibido quando value é null (default: "A definir"). */
  emptyText?: string;
}

export default function AppDatePicker({
  label, value, onChange, mode, minimumDate,
  clearable, clearLabel = 'A definir', emptyText,
}: Props) {
  const { colors, isDark } = useTheme();
  const [show, setShow] = useState(false);

  const placeholder = emptyText ?? (mode === 'date' ? 'dd/mm/aaaa' : '--:--');
  const displayText = value
    ? mode === 'date'
      ? format(value, 'dd/MM/yyyy')
      : format(value, 'HH:mm')
    : placeholder;

  const handleChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShow(false);
    if (selected) onChange(selected);
  };

  if (Platform.OS === 'web') {
    const webValue = value
      ? mode === 'date'
        ? format(value, 'yyyy-MM-dd')
        : format(value, 'HH:mm')
      : '';

    return (
      <View style={styles.wrap}>
        {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
        <View style={styles.webRow}>
          <input
            type={mode === 'date' ? 'date' : 'time'}
            value={webValue}
            placeholder={emptyText}
            onChange={(e) => {
              if (!e.target.value) { onChange(null); return; }
              if (mode === 'date') {
                onChange(new Date(e.target.value + 'T00:00:00'));
              } else {
                // IMPORTANTE: cópia fresh pra não mutar `value` em place
                // (mutar o mesmo objeto faz React não detectar mudança de
                // estado em alguns cenários).
                const [h, m] = e.target.value.split(':');
                const d = value ? new Date(value.getTime()) : new Date();
                d.setHours(parseInt(h), parseInt(m), 0, 0);
                onChange(d);
              }
            }}
            style={{
              flex: 1,
              backgroundColor: colors.background,
              color: value ? colors.text : (colors.textMuted ?? colors.text),
              border: `1.5px solid ${colors.border}`,
              borderRadius: 10,
              padding: '5px 10px',
              fontSize: 13,
              boxSizing: 'border-box',
              height: 36,
            } as React.CSSProperties}
          />
          {clearable && value && (
            <TouchableOpacity
              onPress={() => onChange(null)}
              style={[styles.clearBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
            >
              <Text style={[styles.clearBtnText, { color: colors.textMuted ?? colors.text }]}>
                {clearLabel}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
      <View style={styles.webRow}>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.background, borderColor: colors.border, flex: 1 }]}
          onPress={() => setShow(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.icon}>{mode === 'date' ? '📅' : '🕐'}</Text>
          <Text style={[styles.btnText, { color: value ? colors.text : colors.textMuted }]}>
            {displayText}
          </Text>
        </TouchableOpacity>
        {clearable && value && (
          <TouchableOpacity
            onPress={() => onChange(null)}
            style={[styles.clearBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
          >
            <Text style={[styles.clearBtnText, { color: colors.textMuted ?? colors.text }]}>
              {clearLabel}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {show && (
        <DateTimePicker
          value={value ?? new Date()}
          mode={mode}
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={handleChange}
          minimumDate={minimumDate}
          themeVariant={isDark ? 'dark' : 'light'}
          locale="pt-BR"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: Spacing.xs },
  label: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    letterSpacing: 0.1,
    marginBottom: 6,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
  },
  icon: { fontSize: 13 },
  btnText: { fontSize: FontSize.sm, fontWeight: '600' },
  webRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  clearBtn: {
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: Radius.sm, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
    minHeight: 36,
  },
  clearBtnText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
});
