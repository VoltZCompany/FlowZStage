import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, Modal, KeyboardAvoidingView, Platform, ActivityIndicator, Switch,
  Animated, PanResponder,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { RootStackParamList } from '../navigation/AppNavigator';
import {
  IOSNavBar, IOSNavButton, SectionHeader, ListGroup, ListRowLast, ListRow,
} from '../components/ios';
import { Icon } from '../components/icons';
import { Spacing, Radius, FontSize } from '../constants/theme';
import {
  loadTeamMembers, createTeamMember, updateTeamMember, deleteTeamMember,
} from '../store/teamStore';
import { loadPairings, savePairings } from '../store/pairingStore';
import { TeamMember } from '../types/team';

type Nav = NativeStackNavigationProp<RootStackParamList, 'TeamSettings'>;

const ROLE_PRESETS = [
  'Músico', 'Roadie', 'Técnico de Som', 'Produtor', 'Iluminação', 'Fotógrafo', 'Assessor', 'Motorista', 'Outro',
];

const DEL_W = 80;

interface SwipeRowProps {
  member: TeamMember;
  isDeleting: boolean;
  isOpen: boolean;
  separator: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onOpen: () => void;
  onClose: () => void;
  colors: any;
}

function SwipeRow({ member, isDeleting, isOpen, separator, onEdit, onDelete, onOpen, onClose, colors }: SwipeRowProps) {
  const tx = useRef(new Animated.Value(0)).current;
  const isOpenRef = useRef(false);

  useEffect(() => {
    isOpenRef.current = isOpen;
    Animated.spring(tx, { toValue: isOpen ? -DEL_W : 0, useNativeDriver: true, damping: 20, stiffness: 240 } as any).start();
  }, [isOpen]);

  const pr = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2,
    onPanResponderMove: (_, g) => {
      const base = isOpenRef.current ? -DEL_W : 0;
      tx.setValue(Math.max(-DEL_W, Math.min(0, base + g.dx)));
    },
    onPanResponderRelease: (_, g) => {
      const base = isOpenRef.current ? -DEL_W : 0;
      const final = Math.max(-DEL_W, Math.min(0, base + g.dx));
      if (final < -DEL_W / 2 || g.vx < -0.4) { onOpen(); } else { onClose(); }
    },
  })).current;

  return (
    <View style={[{ overflow: 'hidden' }, separator && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
      {/* Red delete button behind */}
      <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: DEL_W, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' }}>
        {isDeleting
          ? <ActivityIndicator color="#fff" size="small" />
          : (
            <TouchableOpacity onPress={onDelete} style={{ alignItems: 'center', gap: 3 }}>
              <Icon name="close" color="#fff" size={18} />
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Remover</Text>
            </TouchableOpacity>
          )}
      </View>
      {/* Swipeable row */}
      <Animated.View style={{ transform: [{ translateX: tx }], backgroundColor: colors.surface }} {...pr.panHandlers}>
        <TouchableOpacity
          style={swipeRowS.row}
          onPress={() => isOpenRef.current ? onClose() : onEdit()}
          activeOpacity={0.7}
        >
          <View style={swipeRowS.info}>
            <Text style={[swipeRowS.name, { color: colors.text }]}>{member.name}</Text>
            {!!member.role && <Text style={[swipeRowS.role, { color: colors.textMuted }]}>{member.role}</Text>}
          </View>
          <View style={{ marginRight: 12 }}><Icon name="chevronRight" color={colors.textMuted} size={18} /></View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const swipeRowS = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 52 },
  info: { flex: 1, minWidth: 0, paddingHorizontal: Spacing.md, paddingVertical: 12 },
  name: { fontSize: FontSize.md, fontWeight: '600' },
  role: { fontSize: FontSize.sm, marginTop: 2 },
});

export default function TeamSettingsScreen({ navigation }: { navigation: Nav }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [isArtist, setIsArtist] = useState(false);
  const [saving, setSaving] = useState(false);
  // Pairings
  const [pairings, setPairings] = useState<string[][]>([]);
  const [pairingPickerVisible, setPairingPickerVisible] = useState(false);
  const [pairingSelection, setPairingSelection] = useState<Set<string>>(new Set());
  const [editingPairingIdx, setEditingPairingIdx] = useState<number | null>(null);

  const nameRef = useRef<TextInput>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [m, p] = await Promise.all([loadTeamMembers(), loadPairings()]);
      setMembers(m);
      setPairings(p);
    } catch (e: any) {
      Alert.alert('Erro ao carregar equipe', e?.message ?? 'Verifique a conexão.');
    } finally {
      setLoading(false);
    }
  }

  async function removePairing(idx: number) {
    const updated = pairings.filter((_, i) => i !== idx);
    setPairings(updated);
    await savePairings(updated);
  }

  async function savePairing() {
    if (pairingSelection.size < 2) return;
    const newPairing = Array.from(pairingSelection);
    const updated = editingPairingIdx !== null
      ? pairings.map((p, i) => i === editingPairingIdx ? newPairing : p)
      : [...pairings, newPairing];
    setPairings(updated);
    await savePairings(updated);
    setPairingPickerVisible(false);
    setEditingPairingIdx(null);
    setPairingSelection(new Set());
  }

  function openEditPairing(idx: number) {
    setEditingPairingIdx(idx);
    setPairingSelection(new Set(pairings[idx]));
    setPairingPickerVisible(true);
  }

  function openAdd() {
    setEditingId(null);
    setName('');
    setRole('');
    setIsArtist(false);
    setModalKey((k) => k + 1);
    setModalVisible(true);
    setTimeout(() => nameRef.current?.focus(), 150);
  }

  function openEdit(member: TeamMember) {
    setEditingId(member.id);
    setName(member.name);
    setRole(member.role);
    setIsArtist(member.isArtist ?? false);
    setModalKey((k) => k + 1);
    setModalVisible(true);
    setTimeout(() => nameRef.current?.focus(), 150);
  }

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateTeamMember(editingId, { name, role, isArtist });
      } else {
        await createTeamMember({ name, role, isArtist });
      }
      setModalVisible(false);
      setEditingId(null);
      setName('');
      setRole('');
      setIsArtist(false);
      await load();
    } catch (e: any) {
      Alert.alert('Erro ao salvar', e?.message ?? 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  }

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);

  async function doDelete(member: TeamMember) {
    setDeletingId(member.id);
    try {
      await deleteTeamMember(member.id);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      setOpenSwipeId(null);
    } catch (e: any) {
      Alert.alert('Erro ao remover', e?.message ?? 'Não foi possível remover o membro.');
      setOpenSwipeId(null);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <IOSNavBar
        title="Equipe"
        left={<IOSNavButton onPress={() => navigation.goBack()}>Voltar</IOSNavButton>}
        right={<IOSNavButton onPress={openAdd}>Adicionar</IOSNavButton>}
      />

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + Spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <SectionHeader>MEMBROS DA EQUIPE</SectionHeader>

        {loading ? (
          <ActivityIndicator style={{ marginTop: Spacing.xl }} color={colors.primary} />
        ) : members.length === 0 ? (
          <View style={[s.empty, { backgroundColor: colors.surface }]}>
            <Icon name="people" color={colors.textMuted} size={40} />
            <Text style={[s.emptyTitle, { color: colors.text }]}>Nenhum membro cadastrado</Text>
            <Text style={[s.emptySubtitle, { color: colors.textMuted }]}>
              Adicione os integrantes da equipe para usar nos quartos de hotel e voos.
            </Text>
            <TouchableOpacity
              style={[s.addBtn, { backgroundColor: colors.primary }]}
              onPress={openAdd}
            >
              <Text style={s.addBtnText}>+ Adicionar membro</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[s.listGroup, { backgroundColor: colors.surface }]}>
            {members.map((member, idx) => (
              <SwipeRow
                key={member.id}
                member={member}
                isDeleting={deletingId === member.id}
                isOpen={openSwipeId === member.id}
                separator={idx < members.length - 1}
                onEdit={() => openEdit(member)}
                onDelete={() => doDelete(member)}
                onOpen={() => setOpenSwipeId(member.id)}
                onClose={() => setOpenSwipeId(null)}
                colors={colors}
              />
            ))}
          </View>
        )}

        <Text style={[s.hint, { color: colors.textMuted }]}>
          Os membros cadastrados aparecem como atalho ao distribuir quartos de hotel e passageiros de voo nos shows.
        </Text>

        {/* ── PARES DE QUARTO ── */}
        <SectionHeader>PARES DE QUARTO</SectionHeader>
        {pairings.length > 0 && (
          <ListGroup>
            {pairings.map((pair, idx) => (
              <ListRow
                key={idx}
                title={pair.join(' + ')}
                subtitle={`${pair.length} pessoas • toque para editar`}
                separator={idx < pairings.length - 1}
                onPress={() => openEditPairing(idx)}
                trailing={
                  <TouchableOpacity
                    onPress={() => removePairing(idx)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={s.deleteBtn}
                  >
                    <Icon name="close" color={colors.danger} size={20} />
                  </TouchableOpacity>
                }
              />
            ))}
          </ListGroup>
        )}
        <TouchableOpacity
          style={[s.addPairingBtn, { borderColor: colors.primary }]}
          onPress={() => { setEditingPairingIdx(null); setPairingSelection(new Set()); setPairingPickerVisible(true); }}
        >
          <Icon name="plus" color={colors.primary} size={16} />
          <Text style={[s.addPairingText, { color: colors.primary }]}>Adicionar par</Text>
        </TouchableOpacity>
        <Text style={[s.hint, { color: colors.textMuted }]}>
          Pessoas vinculadas sempre ficam no mesmo quarto ao usar "Alocar equipe".
        </Text>
      </ScrollView>

      {/* Modal de pares de quarto */}
      <Modal
        visible={pairingPickerVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPairingPickerVisible(false)}
      >
        <View style={[s.modal, { backgroundColor: colors.background, paddingTop: insets.top + Spacing.md }]}>
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={() => { setPairingPickerVisible(false); setEditingPairingIdx(null); setPairingSelection(new Set()); }}>
              <Text style={[s.modalCancel, { color: colors.primary }]}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={[s.modalTitle, { color: colors.text }]}>{editingPairingIdx !== null ? 'Editar par' : 'Novo par'}</Text>
            <TouchableOpacity onPress={savePairing} disabled={pairingSelection.size < 2}>
              <Text style={[s.modalSave, { color: pairingSelection.size >= 2 ? colors.primary : colors.textMuted }]}>
                Salvar
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={[s.hint, { color: colors.textMuted, marginBottom: Spacing.sm }]}>
            Selecione 2 ou mais pessoas que sempre compartilham quarto:
          </Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            <ListGroup>
              {(() => {
                const takenByOthers = new Set(pairings.flatMap((p, i) => i !== editingPairingIdx ? p : []));
                const pickable = members.filter(m => !takenByOthers.has(m.name));
                return pickable.map((m, idx) => {
                  const selected = pairingSelection.has(m.name);
                  return (
                    <ListRow
                      key={m.id}
                      title={m.name}
                      subtitle={m.role || undefined}
                      separator={idx < pickable.length - 1}
                      onPress={() => {
                        setPairingSelection((prev) => {
                          const next = new Set(prev);
                          if (next.has(m.name)) next.delete(m.name); else next.add(m.name);
                          return next;
                        });
                      }}
                      trailing={selected ? <Icon name="check" color={colors.primary} size={20} /> : undefined}
                    />
                  );
                });
              })()}
            </ListGroup>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal de adicionar/editar */}
      <Modal
        key={modalKey}
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[s.modal, { backgroundColor: colors.background, paddingTop: insets.top + Spacing.md }]}>
            {/* Header modal */}
            <View style={s.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={[s.modalCancel, { color: colors.primary }]}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={[s.modalTitle, { color: colors.text }]}>
                {editingId ? 'Editar membro' : 'Novo membro'}
              </Text>
              <TouchableOpacity onPress={save} disabled={!name.trim() || saving}>
                <Text style={[s.modalSave, { color: name.trim() && !saving ? colors.primary : colors.textMuted }]}>
                  {saving ? 'Salvando…' : 'Salvar'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 80 }}
            >
              <SectionHeader>NOME</SectionHeader>
              <ListGroup>
                <TextInput
                  ref={nameRef}
                  style={[s.input, { color: colors.text, borderBottomColor: colors.border }]}
                  placeholder="Ex: LUKE, CAIO, ALICE…"
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="characters"
                  returnKeyType="next"
                  onSubmitEditing={() => {}}
                />
              </ListGroup>

              <SectionHeader>FUNÇÃO</SectionHeader>
              <ListGroup>
                <TextInput
                  style={[s.input, { color: colors.text, borderBottomColor: 'transparent' }]}
                  placeholder="Ex: Músico, Roadie, Técnico…"
                  placeholderTextColor={colors.textMuted}
                  value={role}
                  onChangeText={setRole}
                  returnKeyType="done"
                  onSubmitEditing={save}
                />
              </ListGroup>

              {/* Presets de função */}
              <SectionHeader>FUNÇÕES RÁPIDAS</SectionHeader>
              <View style={s.presets}>
                {ROLE_PRESETS.map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    style={[
                      s.preset,
                      {
                        backgroundColor: role === preset ? colors.primary : colors.surface,
                        borderColor: role === preset ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setRole(preset)}
                  >
                    <Text style={[s.presetText, { color: role === preset ? '#fff' : colors.text }]}>
                      {preset}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <SectionHeader>TIPO</SectionHeader>
              <View style={[s.artistRow, { backgroundColor: colors.surface }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.artistLabel, { color: colors.text }]}>Artista</Text>
                  <Text style={[s.artistSub, { color: colors.textMuted }]}>Integrante do elenco principal</Text>
                </View>
                <Switch value={isArtist} onValueChange={setIsArtist} trackColor={{ true: colors.primary }} />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingTop: Spacing.sm },
  empty: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: FontSize.md, fontWeight: '600' },
  emptySubtitle: { fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20 },
  hint: {
    fontSize: FontSize.xs,
    marginHorizontal: Spacing.md + Spacing.sm,
    marginTop: Spacing.sm,
    lineHeight: 18,
  },
  addBtn: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  addBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '600' },
  listGroup: { borderRadius: Radius.lg, overflow: 'hidden', marginHorizontal: Spacing.md },
  deleteBtn: { padding: Spacing.sm },
  deleteIcon: { fontSize: 16 },
  addPairingBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: Spacing.md, marginTop: Spacing.sm, paddingVertical: Spacing.sm, borderRadius: Radius.full, borderWidth: 1.5, justifyContent: 'center' },
  addPairingText: { fontSize: FontSize.sm, fontWeight: '700' },
  modal: { flex: 1, paddingHorizontal: Spacing.md },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.md,
    marginBottom: Spacing.sm,
  },
  modalTitle: { fontSize: FontSize.md, fontWeight: '600' },
  modalCancel: { fontSize: FontSize.md },
  modalSave: { fontSize: FontSize.md, fontWeight: '600' },
  input: {
    fontSize: FontSize.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
  },
  preset: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm - 2,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  presetText: { fontSize: FontSize.sm, fontWeight: '600' },
  artistRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.md, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, marginBottom: Spacing.md },
  artistLabel: { fontSize: FontSize.md, fontWeight: '600' },
  artistSub: { fontSize: FontSize.xs, marginTop: 2 },
});
