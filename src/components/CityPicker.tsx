import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, Modal, FlatList,
  TextInput, StyleSheet, SafeAreaView,
} from 'react-native';
import { Spacing, FontSize, Radius } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { BRAZILIAN_CITIES, searchCities } from '../data/brazilianCities';

interface Props {
  label?: string;
  value: string;
  onChange: (city: string, stateCode: string) => void;
}

export default function CityPicker({ label, value, onChange }: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const results = useMemo(() => searchCities(query), [query]);

  const handleSelect = (city: string, stateCode: string) => {
    onChange(city, stateCode);
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
        <Text style={styles.icon}>🏙️</Text>
        <Text style={[styles.btnText, { color: value ? colors.text : colors.textMuted }]} numberOfLines={1}>
          {value || 'Selecionar cidade'}
        </Text>
        <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>🏙️ Cidade</Text>
            <TouchableOpacity onPress={() => { setOpen(false); setQuery(''); }}>
              <Text style={[styles.closeBtn, { color: colors.primary }]}>Fechar</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.searchWrap, { borderBottomColor: colors.border }]}>
            <TextInput
              style={[styles.search, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="Buscar cidade..."
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              autoFocus
              autoCapitalize="characters"
            />
          </View>

          <FlatList
            data={results}
            keyExtractor={(item) => `${item.city}-${item.stateCode}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.cityRow, { borderBottomColor: colors.border }]}
                onPress={() => handleSelect(`${item.city} - ${item.stateCode}`, item.stateCode)}
              >
                <View>
                  <Text style={[styles.cityName, { color: colors.text }]}>{item.city}</Text>
                  <Text style={[styles.stateName, { color: colors.textSecondary }]}>{item.state}</Text>
                </View>
                <Text style={[styles.stateCode, { color: colors.primary }]}>{item.stateCode}</Text>
              </TouchableOpacity>
            )}
            ListFooterComponent={
              <TouchableOpacity
                style={[styles.customRow, { borderTopColor: colors.border }]}
                onPress={() => { if (query.trim()) handleSelect(query.trim().toUpperCase(), ''); }}
              >
                <Text style={[styles.customText, { color: colors.primary }]}>
                  {query.trim() ? `+ Usar "${query.trim().toUpperCase()}"` : 'Digite para buscar ou adicionar'}
                </Text>
              </TouchableOpacity>
            }
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: Spacing.md },
  label: { fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.1, marginBottom: 6 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: Radius.md, borderWidth: 1.5, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  icon: { fontSize: 18 },
  btnText: { flex: 1, fontSize: FontSize.md, fontWeight: '600' },
  chevron: { fontSize: 22 },
  modal: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, borderBottomWidth: 1 },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '800' },
  closeBtn: { fontSize: FontSize.md, fontWeight: '700' },
  searchWrap: { padding: Spacing.md, borderBottomWidth: 1 },
  search: { borderRadius: Radius.md, borderWidth: 1.5, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: FontSize.md },
  cityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 14, borderBottomWidth: 1 },
  cityName: { fontSize: FontSize.md, fontWeight: '700' },
  stateName: { fontSize: FontSize.xs, marginTop: 2 },
  stateCode: { fontSize: FontSize.sm, fontWeight: '800' },
  customRow: { padding: Spacing.md, borderTopWidth: 1, marginTop: Spacing.xs },
  customText: { fontSize: FontSize.sm, fontWeight: '700' },
});
