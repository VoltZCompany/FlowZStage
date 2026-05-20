import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, Modal, FlatList,
  TextInput, StyleSheet, SafeAreaView,
} from 'react-native';
import { Spacing, FontSize, Radius } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { Show } from '../types/show';

interface Props {
  label?: string;
  value?: string;
  onChange: (showId: string | undefined) => void;
  shows: Show[];
  excludeId?: string;
  placeholder?: string;
}

export default function ShowPicker({ label, value, onChange, shows, excludeId, placeholder }: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const available = useMemo(
    () => shows.filter((s) => s.id !== excludeId).sort((a, b) => (a.date > b.date ? -1 : 1)),
    [shows, excludeId],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return available;
    return available.filter((s) =>
      s.name.toLowerCase().includes(q) ||
      (s.city ?? '').toLowerCase().includes(q) ||
      (s.venue ?? '').toLowerCase().includes(q) ||
      (s.date ?? '').includes(q),
    );
  }, [available, query]);

  const selected = value ? shows.find((s) => s.id === value) : null;

  const handleSelect = (s: Show) => {
    onChange(s.id);
    setOpen(false);
    setQuery('');
  };

  const handleClear = () => {
    onChange(undefined);
    setOpen(false);
  };

  return (
    <View style={styles.wrap}>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: colors.background, borderColor: colors.border }]}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.icon}>🔗</Text>
        <View style={{ flex: 1, minWidth: 0 }}>
          {selected ? (
            <>
              <Text style={[styles.selectedName, { color: colors.text }]} numberOfLines={1}>{selected.name}</Text>
              <Text style={[styles.selectedMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                {selected.date}{selected.city ? ` · ${selected.city}` : ''}
              </Text>
            </>
          ) : (
            <Text style={[styles.btnText, { color: colors.textMuted }]} numberOfLines={1}>
              {placeholder || 'Selecionar outro show'}
            </Text>
          )}
        </View>
        {selected && (
          <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[styles.clearX, { color: colors.danger }]}>✕</Text>
          </TouchableOpacity>
        )}
        <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>🔗 Vincular show</Text>
            <TouchableOpacity onPress={() => { setOpen(false); setQuery(''); }}>
              <Text style={[styles.closeBtn, { color: colors.primary }]}>Fechar</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.searchWrap, { borderBottomColor: colors.border }]}>
            <TextInput
              style={[styles.search, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="Buscar por nome, cidade, local ou data..."
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
          </View>

          {results.length === 0 ? (
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                {available.length === 0 ? 'Nenhum outro show cadastrado' : 'Nenhum show corresponde à busca'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.row,
                    { borderBottomColor: colors.border },
                    item.id === value && { backgroundColor: colors.primaryLight },
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.rowName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                    <Text style={[styles.rowMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                      {item.date}{item.time ? ` · ${item.time}` : ''}{item.city ? ` · ${item.city}` : ''}{item.venue ? ` · ${item.venue}` : ''}
                    </Text>
                  </View>
                  {item.hasAirplane ? <Text style={styles.airplaneIcon}>✈️</Text> : null}
                </TouchableOpacity>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: Spacing.md },
  label: {
    fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.1, marginBottom: 6,
  },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderRadius: Radius.md, borderWidth: 1.5,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  icon: { fontSize: 18 },
  btnText: { fontSize: FontSize.md, fontWeight: '600' },
  selectedName: { fontSize: FontSize.md, fontWeight: '700' },
  selectedMeta: { fontSize: FontSize.xs, fontWeight: '500', marginTop: 2 },
  chevron: { fontSize: 22 },
  clearX: { fontSize: 14, fontWeight: '800', paddingHorizontal: 6 },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.md, borderBottomWidth: 1,
  },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '800' },
  closeBtn: { fontSize: FontSize.md, fontWeight: '700' },
  searchWrap: { padding: Spacing.md, borderBottomWidth: 1 },
  search: {
    borderRadius: Radius.md, borderWidth: 1.5,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: FontSize.md,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: 14,
    borderBottomWidth: 1,
  },
  rowName: { fontSize: FontSize.md, fontWeight: '700' },
  rowMeta: { fontSize: FontSize.xs, marginTop: 3 },
  airplaneIcon: { fontSize: 18 },
  empty: { padding: Spacing.xl, alignItems: 'center' },
  emptyText: { fontSize: FontSize.sm, fontWeight: '500' },
});
