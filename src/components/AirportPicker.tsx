import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, Modal, FlatList,
  TextInput, StyleSheet, SafeAreaView,
} from 'react-native';
import { Spacing, FontSize, Radius } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { searchAirports, findAirport, Airport } from '../data/brazilianAirports';

interface Props {
  label?: string;
  value: string;
  onChange: (iata: string) => void;
  placeholder?: string;
}

export default function AirportPicker({ label, value, onChange, placeholder }: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const results = useMemo(() => searchAirports(query), [query]);
  const selected = value ? findAirport(value) : null;
  const displayValue = selected
    ? `${selected.iata} — ${selected.city}`
    : value || '';

  const handleSelect = (airport: Airport) => {
    onChange(airport.iata);
    setOpen(false);
    setQuery('');
  };

  return (
    <View style={styles.wrap}>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: colors.background, borderColor: colors.border }]}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.icon}>✈️</Text>
        <Text
          style={[styles.btnText, { color: displayValue ? colors.text : colors.textMuted }]}
          numberOfLines={1}
        >
          {displayValue || placeholder || 'Selecionar aeroporto'}
        </Text>
        <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>✈️ Aeroporto</Text>
            <TouchableOpacity onPress={() => { setOpen(false); setQuery(''); }}>
              <Text style={[styles.closeBtn, { color: colors.primary }]}>Fechar</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.searchWrap, { borderBottomColor: colors.border }]}>
            <TextInput
              style={[styles.search, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="Ex: GRU, Campinas, BH, São Paulo..."
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              autoFocus
              autoCapitalize="none"
            />
          </View>

          <FlatList
            data={results}
            keyExtractor={(item) => item.iata}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.airportRow,
                  { borderBottomColor: colors.border },
                  item.iata === value && { backgroundColor: colors.primaryLight },
                ]}
                onPress={() => handleSelect(item)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.airportCity, { color: colors.text }]}>{item.city}</Text>
                  <Text style={[styles.airportName, { color: colors.textSecondary }]}>
                    {item.name} • {item.state}
                  </Text>
                </View>
                <Text style={[styles.iataCode, { color: colors.primary }]}>{item.iata}</Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: Spacing.md },
  label: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    letterSpacing: 0.1,
    marginBottom: 6,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  icon: { fontSize: 18 },
  btnText: { flex: 1, fontSize: FontSize.md, fontWeight: '600' },
  chevron: { fontSize: 22 },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '800' },
  closeBtn: { fontSize: FontSize.md, fontWeight: '700' },
  searchWrap: { padding: Spacing.md, borderBottomWidth: 1 },
  search: {
    borderRadius: Radius.md,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.md,
  },
  airportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  airportCity: { fontSize: FontSize.md, fontWeight: '700' },
  airportName: { fontSize: FontSize.xs, marginTop: 2 },
  iataCode: { fontSize: FontSize.xl, fontWeight: '900', letterSpacing: 1 },
});
