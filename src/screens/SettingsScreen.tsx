// Settings screen — iOS Refresh port.
// Grouped list with section headers, mirrors tesla-ios/app.js renderSettings.
// Preserves the full functional surface: theme, permissions, daily summary,
// recurring nudge, deadline alert, PWA update, build version.

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image,
  Alert, Platform, Modal, KeyboardAvoidingView, Linking,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useTasks } from '../hooks/useTasks';
import { AppSettings, DEFAULT_SETTINGS } from '../types/task';
import { cancelAllNotifications, requestPermissions, scheduleTestNotification } from '../services/notificationService';
import * as Notifications from 'expo-notifications';
import { RootStackParamList } from '../navigation/AppNavigator';
import {
  IOSNavBar, IOSNavButton, SectionHeader, ListGroup, ListRow, IconWrap, IOSSwitch, Card,
} from '../components/ios';
import { supabase } from '../lib/supabase';
import { useCategories } from '../hooks/useCategories';
import { CategoryInfo } from '../store/categoryStore';
import { Spacing, Radius } from '../constants/theme';
import ScreenConfetti, { ScreenConfettiHandle } from '../components/ScreenConfetti';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

const BUILD_VERSION = '2026-04-24 · ios-refresh';

function formatBuildId(buildId: string | null): string {
  if (!buildId || buildId === '__BUILD_ID__') return BUILD_VERSION;
  const ms = Number(buildId);
  if (!Number.isFinite(ms)) return buildId;
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const PRESET_COLORS = [
  '#4E95DD','#9E60BE','#2DC96B','#C9A20C','#DE7C20','#18B898',
  '#FF4B41','#FF6B9D','#7B73FF','#00C2E0','#7F8F96','#E85D04',
];
const SUGGESTED_EMOJIS = ['💼','🧍','🏃','💰','📚','🏠','📋','🎯','🎵','🎨','✈️','🍎','💻','🔑','⚡'];

function CategorySheet({
  visible, onClose, initial,
}: {
  visible: boolean;
  onClose: (saved?: CategoryInfo) => void;
  initial?: CategoryInfo | null;
}) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [emoji, setEmoji] = useState(initial?.emoji ?? '📋');
  const [label, setLabel] = useState(initial?.label ?? '');
  const [color, setColor] = useState(initial?.color ?? PRESET_COLORS[0]);

  useEffect(() => {
    if (visible) {
      setEmoji(initial?.emoji ?? '📋');
      setLabel(initial?.label ?? '');
      setColor(initial?.color ?? PRESET_COLORS[0]);
    }
  }, [visible, initial]);

  const canSave = label.trim().length > 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => onClose()}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,.5)' }}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => onClose()} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[cs.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 }]}>
            <View style={cs.handle} />
            <View style={cs.sheetHeader}>
              <TouchableOpacity onPress={() => onClose()}>
                <Text style={[cs.sheetBtn, { color: colors.label2 }]}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={[cs.sheetTitle, { color: colors.label }]}>{initial ? 'Editar' : 'Nova'} categoria</Text>
              <TouchableOpacity onPress={() => canSave && onClose({ key: initial?.key ?? label.trim().toLowerCase().replace(/\s+/g, '_'), label: label.trim(), emoji, color, isDefault: initial?.isDefault ?? false })} disabled={!canSave}>
                <Text style={[cs.sheetBtn, { color: canSave ? colors.brand : colors.label3, fontWeight: '700' }]}>Salvar</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: Spacing.md, gap: 20 }} keyboardShouldPersistTaps="handled">
              {/* Emoji */}
              <View>
                <Text style={[cs.fieldLabel, { color: colors.label2 }]}>EMOJI</Text>
                <View style={cs.emojiGrid}>
                  {SUGGESTED_EMOJIS.map((e) => (
                    <TouchableOpacity key={e} onPress={() => setEmoji(e)}
                      style={[cs.emojiBtn, { backgroundColor: emoji === e ? color : (isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.05)') }]}>
                      <Text style={{ fontSize: 22 }}>{e}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Nome */}
              <View>
                <Text style={[cs.fieldLabel, { color: colors.label2 }]}>NOME</Text>
                <TextInput
                  style={[cs.input, { backgroundColor: colors.fill, color: colors.label, borderColor: colors.border }]}
                  value={label} onChangeText={setLabel}
                  placeholder="Ex: Música, Academia…" placeholderTextColor={colors.label3}
                  autoCapitalize="sentences"
                />
              </View>

              {/* Cor */}
              <View>
                <Text style={[cs.fieldLabel, { color: colors.label2 }]}>COR</Text>
                <View style={cs.colorGrid}>
                  {PRESET_COLORS.map((c) => (
                    <TouchableOpacity key={c} onPress={() => setColor(c)}
                      style={[cs.colorDot, { backgroundColor: c, borderWidth: color === c ? 3 : 0, borderColor: '#fff' }]} />
                  ))}
                </View>
              </View>

              {/* Preview */}
              <View style={[cs.preview, { backgroundColor: color + '22', borderColor: color }]}>
                <Text style={{ fontSize: 22 }}>{emoji}</Text>
                <Text style={[cs.previewLabel, { color }]}>{label || 'Nome da categoria'}</Text>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export default function SettingsScreen({ navigation }: { navigation: Nav }) {
  const { colors, preference, setPreference, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, tasks } = useTasks();
  const { categories, add: addCat, update: updateCat, remove: removeCat } = useCategories();
  const [local, setLocal] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [updating, setUpdating] = useState(false);
  const confettiRef = useRef<ScreenConfettiHandle>(null);
  const [buildId, setBuildId] = useState<string | null>(null);
  const [catSheet, setCatSheet] = useState<{ visible: boolean; editing: CategoryInfo | null }>({ visible: false, editing: null });

  useEffect(() => { if (settings) setLocal(settings); }, [settings]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    fetch(`/version.json?ts=${Date.now()}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j && typeof j.buildId === 'string') setBuildId(j.buildId); })
      .catch(() => {});
  }, []);

  const save = async (next: AppSettings) => { setLocal(next); await updateSettings(next); };

  const requestPerms = async () => {
    const granted = await requestPermissions();
    Alert.alert(
      granted ? '✅ Permissão concedida' : '❌ Permissão negada',
      granted ? 'Você vai receber notificações do Tesla.' : 'Ative as notificações nas configurações do sistema.',
    );
  };

  const clearAll = () => {
    const confirm = Platform.OS === 'web'
      ? (window as any).confirm('Cancelar todos os lembretes agendados?')
      : true;
    if (!confirm && Platform.OS === 'web') return;
    if (Platform.OS !== 'web') {
      Alert.alert('Cancelar todos os lembretes?', 'Isso cancela todos os lembretes agendados.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', style: 'destructive', onPress: async () => {
          await cancelAllNotifications();
          Alert.alert('Feito', 'Todos os lembretes foram cancelados.');
        }},
      ]);
      return;
    }
    cancelAllNotifications().then(() => (window as any).alert('Lembretes cancelados.'));
  };

  const testDailySummary = async () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('☀️ Teste · Resumo Diário', {
          body: `Você tem ${tasks.filter((t) => !t.done).length} tarefa(s) pendente(s) hoje.`,
          icon: '/favicon.png',
        });
      } else {
        (window as any).alert('Ative as notificações do navegador primeiro.');
      }
      return;
    }
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '☀️ Teste · Resumo Diário',
          body: `Você tem ${tasks.filter((t) => !t.done).length} tarefa(s) pendente(s) hoje.`,
          sound: 'default',
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3 },
      });
      Alert.alert('✅ Agendado', 'Você vai receber em 3 segundos.');
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar a notificação de teste.');
    }
  };

  const refreshApp = async () => {
    if (Platform.OS !== 'web') return;
    setUpdating(true);
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          if (reg.active) reg.active.postMessage({ type: 'CLEAR_CACHES' });
          await reg.update();
          if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          await reg.unregister().catch(() => {});
        }
      }
    } finally {
      setTimeout(() => window.location.reload(), 400);
    }
  };

  const themeLabel = preference === 'auto' ? 'Automático' : preference === 'dark' ? 'Escuro' : 'Claro';
  const cycleTheme = () => {
    const next = preference === 'auto' ? 'light' : preference === 'light' ? 'dark' : 'auto';
    setPreference(next);
  };

  const pad = (n: number) => String(n).padStart(2, '0');

  const handleCatSave = async (saved?: CategoryInfo) => {
    if (!saved) { setCatSheet({ visible: false, editing: null }); return; }
    if (catSheet.editing) {
      await updateCat(saved.key, { label: saved.label, emoji: saved.emoji, color: saved.color });
    } else {
      await addCat(saved);
    }
    setCatSheet({ visible: false, editing: null });
  };

  const handleCatDelete = (cat: CategoryInfo) => {
    const doDelete = () => removeCat(cat.key);
    if (Platform.OS === 'web') {
      if ((window as any).confirm(`Apagar "${cat.label}"?`)) doDelete();
    } else {
      Alert.alert('Apagar categoria?', `"${cat.label}" será removida.`, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Apagar', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  return (
    <View style={[s.container, { backgroundColor: colors.groupedBg }]}>
      <IOSNavBar
        left={<IOSNavButton onPress={() => navigation.goBack()}>‹ Voltar</IOSNavButton>}
        compactTitle="Configurações"
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[s.largeTitle, { color: colors.label }]}>Configurações</Text>

        {/* Profile pill */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={[s.avatar, { backgroundColor: colors.brand }]}>
              <Image source={require('../../assets/icon.png')} style={s.avatarImg} resizeMode="cover" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.avatarName, { color: colors.label }]}>FlowZ</Text>
              <Text style={[s.avatarMeta, { color: colors.label2 }]}>VoltZ Company</Text>
            </View>
          </Card>
        </View>

        <SectionHeader>Aparência</SectionHeader>
        <ListGroup>
          <ListRow
            icon={<Text style={s.iconGlyph}>🌙</Text>}
            iconBg="#5E5CE6"
            title="Tema"
            value={themeLabel}
            chevron
            onPress={cycleTheme}
          />
          <ListRow
            icon={<Text style={s.iconGlyph}>🎨</Text>}
            iconBg={colors.brand}
            title="Cor de destaque"
            trailing={<View style={[s.colorSwatch, { backgroundColor: colors.brand }]} />}
            separator={false}
          />
        </ListGroup>

        <SectionHeader>Efeitos</SectionHeader>
        <ListGroup>
          <ListRow
            icon={<Text style={s.iconGlyph}>🎉</Text>}
            iconBg="#FF2D55"
            title="Testar partículas"
            subtitle="Dispara o efeito de confetti"
            chevron
            onPress={() => confettiRef.current?.fire()}
            separator={false}
          />
        </ListGroup>

        <SectionHeader>Notificações</SectionHeader>
        <ListGroup>
          <ListRow
            icon={<Text style={s.iconGlyph}>🔔</Text>}
            iconBg="#FF9500"
            title="Permissões"
            subtitle="Pedir ao sistema"
            chevron
            onPress={requestPerms}
          />
          <ListRow
            icon={<Text style={s.iconGlyph}>☀️</Text>}
            iconBg="#30D158"
            title="Resumo diário"
            subtitle={`Às ${pad(local.dailySummary.hour)}:${pad(local.dailySummary.minute)}`}
            trailing={
              <IOSSwitch
                value={local.dailySummary.enabled}
                onValueChange={(v) => save({ ...local, dailySummary: { ...local.dailySummary, enabled: v } })}
              />
            }
          />
          {local.dailySummary.enabled && (
            <ListRow
              title="Horário"
              value={
                <View style={s.timeRow}>
                  <TextInput
                    style={[s.timeInput, { color: colors.label, backgroundColor: colors.fill2 }]}
                    value={pad(local.dailySummary.hour)}
                    onChangeText={(v) => { const h = parseInt(v); if (!isNaN(h) && h >= 0 && h <= 23) save({ ...local, dailySummary: { ...local.dailySummary, hour: h } }); }}
                    keyboardType="numeric" maxLength={2}
                  />
                  <Text style={{ color: colors.label2 }}>:</Text>
                  <TextInput
                    style={[s.timeInput, { color: colors.label, backgroundColor: colors.fill2 }]}
                    value={pad(local.dailySummary.minute)}
                    onChangeText={(v) => { const m = parseInt(v); if (!isNaN(m) && m >= 0 && m <= 59) save({ ...local, dailySummary: { ...local.dailySummary, minute: m } }); }}
                    keyboardType="numeric" maxLength={2}
                  />
                </View>
              }
            />
          )}
          <ListRow
            icon={<Text style={s.iconGlyph}>🔥</Text>}
            iconBg="#FF3B30"
            title="Insistir em urgentes"
            subtitle={local.recurringNudgeEnabled ? `A cada ${local.recurringNudgeIntervalMinutes} min` : 'Desligado'}
            trailing={
              <IOSSwitch
                value={local.recurringNudgeEnabled}
                onValueChange={(v) => save({ ...local, recurringNudgeEnabled: v })}
              />
            }
          />
          <ListRow
            icon={<Text style={s.iconGlyph}>🚨</Text>}
            iconBg="#FF9F0A"
            title="Alerta de prazo"
            subtitle={local.deadlineAlertEnabled ? `${local.deadlineAlertMinutesBefore} min antes` : 'Desligado'}
            trailing={
              <IOSSwitch
                value={local.deadlineAlertEnabled}
                onValueChange={(v) => save({ ...local, deadlineAlertEnabled: v })}
              />
            }
          />
          <ListRow
            icon={<Text style={s.iconGlyph}>▶</Text>}
            iconBg="#34C759"
            title="Testar resumo agora"
            chevron
            onPress={testDailySummary}
          />
          <ListRow
            icon={<Text style={s.iconGlyph}>🔔</Text>}
            iconBg="#007AFF"
            title="Disparar notificação de teste"
            subtitle="Aparece em 5 segundos"
            chevron
            onPress={() => {
              scheduleTestNotification(5);
              if (Platform.OS === 'web') (window as any).alert('Notificação agendada para daqui 5s — aguarde!');
              else Alert.alert('Agendado!', 'A notificação aparece em 5 segundos. Pode minimizar o app.');
            }}
            separator={false}
          />
        </ListGroup>

        <SectionHeader>Categorias</SectionHeader>
        <ListGroup>
          {categories.map((cat, i) => (
            <ListRow
              key={cat.key}
              icon={<Text style={{ fontSize: 15 }}>{cat.emoji}</Text>}
              iconBg={cat.color}
              title={cat.label}
              trailing={
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity onPress={() => setCatSheet({ visible: true, editing: cat })}
                    style={[s.catBtn, { backgroundColor: colors.brand + '20' }]}>
                    <Text style={[s.catBtnText, { color: colors.brand }]}>Editar</Text>
                  </TouchableOpacity>
                  {!cat.isDefault && (
                    <TouchableOpacity onPress={() => handleCatDelete(cat)}
                      style={[s.catBtn, { backgroundColor: '#FF3B3020' }]}>
                      <Text style={[s.catBtnText, { color: '#FF3B30' }]}>Apagar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              }
              separator={i < categories.length - 1}
            />
          ))}
        </ListGroup>
        <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
          <TouchableOpacity
            onPress={() => setCatSheet({ visible: true, editing: null })}
            style={[s.addCatBtn, { borderColor: colors.brand }]}
          >
            <Text style={[s.addCatText, { color: colors.brand }]}>+ Nova categoria</Text>
          </TouchableOpacity>
        </View>

        <SectionHeader>Equipe</SectionHeader>
        <ListGroup>
          <ListRow
            icon={<Text style={s.iconGlyph}>👥</Text>}
            iconBg="#30B0C7"
            title="Membros da equipe"
            subtitle="Nomes e funções para hotel e voo"
            chevron
            onPress={() => navigation.navigate('TeamSettings')}
          />
          <ListRow
            icon={<Text style={s.iconGlyph}>🎵</Text>}
            iconBg="#5E5CE6"
            title="Próximos shows"
            subtitle="Página pública da equipe"
            chevron
            onPress={() => {
              const url = Platform.OS === 'web'
                ? `${window.location.origin}/proximos.html`
                : 'https://flowz.app/proximos.html';
              if (Platform.OS === 'web') {
                window.open(url, '_blank', 'noopener');
              } else {
                Linking.openURL(url);
              }
            }}
          />
          <ListRow
            icon={<Text style={s.iconGlyph}>🔐</Text>}
            iconBg="#30B0C7"
            title="PIN da equipe"
            subtitle="Código de acesso à página da equipe"
            chevron
            onPress={async () => {
              const { data } = await supabase.from('app_config').select('value').eq('key', 'team_pin').single();
              const current = data?.value || '1234';
              if (Platform.OS === 'web') {
                const newPin = (window as any).prompt(`PIN atual: ${current}\n\nDigite o novo PIN (4 dígitos):`, current);
                if (newPin && /^\d{4}$/.test(newPin)) {
                  await supabase.from('app_config').upsert({ key: 'team_pin', value: newPin });
                  (window as any).alert(`PIN atualizado para: ${newPin}`);
                } else if (newPin !== null) {
                  (window as any).alert('PIN inválido. Use exatamente 4 dígitos.');
                }
              } else {
                Alert.prompt(
                  `PIN atual: ${current}`,
                  'Digite o novo PIN (4 dígitos):',
                  async (newPin) => {
                    if (newPin && /^\d{4}$/.test(newPin)) {
                      await supabase.from('app_config').upsert({ key: 'team_pin', value: newPin });
                      Alert.alert('PIN atualizado', `Novo PIN: ${newPin}`);
                    } else {
                      Alert.alert('Inválido', 'Use exatamente 4 dígitos.');
                    }
                  },
                  'plain-text',
                  current,
                  'numeric',
                );
              }
            }}
            separator={false}
          />
        </ListGroup>

        <SectionHeader>Dados</SectionHeader>
        <ListGroup>
          <ListRow
            icon={<Text style={s.iconGlyph}>🔒</Text>}
            iconBg="#BF5AF2"
            title="Pasta Segura"
            subtitle="Notas, arquivos e lembretes privados"
            chevron
            onPress={() => navigation.navigate('Vault')}
          />
          <ListRow
            icon={<Text style={s.iconGlyph}>🗑</Text>}
            iconBg="#FF3B30"
            title="Cancelar todos os lembretes"
            chevron
            onPress={clearAll}
            separator={false}
            titleStyle={{ color: colors.danger }}
          />
        </ListGroup>

        {Platform.OS === 'web' && (
          <>
            <SectionHeader>PWA</SectionHeader>
            <ListGroup>
              <ListRow
                icon={<Text style={s.iconGlyph}>🔄</Text>}
                iconBg="#64D2FF"
                title={updating ? 'Atualizando…' : 'Buscar atualização'}
                subtitle={updating ? 'Limpando cache e recarregando' : 'Forçar download da versão mais recente'}
                chevron
                onPress={refreshApp}
                separator={false}
              />
            </ListGroup>
          </>
        )}

        <SectionHeader>Conta</SectionHeader>
        <ListGroup>
          <ListRow
            icon={<Text style={s.iconGlyph}>🔑</Text>}
            iconBg="#FF9500"
            title="Redefinir senha"
            subtitle="Enviar link para seu e-mail"
            chevron
            onPress={async () => {
              const { data: { session } } = await supabase.auth.getSession();
              const email = session?.user?.email;
              if (!email) return;
              const redirectTo = Platform.OS === 'web'
                ? `${window.location.origin}/?type=recovery`
                : 'flowz://reset-password';
              await supabase.auth.resetPasswordForEmail(email, { redirectTo });
              if (Platform.OS === 'web') {
                (window as any).alert(`Link de redefinição enviado para ${email}`);
              } else {
                Alert.alert('Link enviado', `Verifique ${email}`);
              }
            }}
          />
          <ListRow
            icon={<Text style={s.iconGlyph}>🚪</Text>}
            iconBg="#FF3B30"
            title="Sair"
            subtitle="Encerrar sessão neste dispositivo"
            chevron
            titleStyle={{ color: colors.danger }}
            onPress={() => {
              if (Platform.OS === 'web') {
                if ((window as any).confirm('Tem certeza que deseja sair?')) {
                  supabase.auth.signOut();
                }
              } else {
                Alert.alert('Sair', 'Tem certeza que deseja encerrar a sessão?', [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Sair', style: 'destructive', onPress: () => supabase.auth.signOut() },
                ]);
              }
            }}
            separator={false}
          />
        </ListGroup>

        <SectionHeader>Sobre</SectionHeader>
        <ListGroup>
          <ListRow
            icon={<Text style={s.iconGlyph}>ⓘ</Text>}
            iconBg="#8E8E93"
            title="Versão"
            subtitle={formatBuildId(buildId)}
            separator={false}
          />
        </ListGroup>

        <Text style={[s.footer, { color: colors.label3 }]}>
          ⚡ Arte Profissional
        </Text>
      </ScrollView>
      <CategorySheet
        visible={catSheet.visible}
        initial={catSheet.editing}
        onClose={handleCatSave}
      />
      <ScreenConfetti ref={confettiRef} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  largeTitle: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12, fontSize: 34, fontWeight: '800', letterSpacing: -1, lineHeight: 40 },
  avatar: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 56, height: 56, borderRadius: 16 },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  avatarName: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  avatarMeta: { fontSize: 13, letterSpacing: -0.1 },
  iconGlyph: { fontSize: 16 },
  colorSwatch: { width: 22, height: 22, borderRadius: 11, marginRight: 8 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeInput: { width: 44, borderRadius: 6, paddingVertical: 4, textAlign: 'center', fontSize: 15, fontWeight: '600' },
  footer: { textAlign: 'center', padding: 16, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: '700' },
  catBtn: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  catBtnText: { fontSize: 12, fontWeight: '700' },
  addCatBtn: { borderWidth: 1.5, borderRadius: Radius.full, paddingVertical: 10, alignItems: 'center' },
  addCatText: { fontSize: 15, fontWeight: '600' },
});

const cs = StyleSheet.create({
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '88%' },
  handle: { width: 36, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(120,120,128,.3)', alignSelf: 'center', marginTop: 8 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(120,120,128,.2)' },
  sheetTitle: { fontSize: 17, fontWeight: '700' },
  sheetBtn: { fontSize: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.4, marginBottom: 8 },
  input: { borderRadius: Radius.md, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  preview: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: Radius.md, borderWidth: 1.5, padding: 14 },
  previewLabel: { fontSize: 16, fontWeight: '700' },
});
