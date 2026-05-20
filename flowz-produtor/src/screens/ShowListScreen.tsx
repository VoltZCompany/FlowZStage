// Show list screen — redesigned UI: ticket-stub cards, urgency accent, compact logistics
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, Platform, TouchableOpacity, Animated, AccessibilityInfo,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { Show } from '../types/show';
import { loadShows, deleteShow } from '../store/showStore';
import { RootStackParamList } from '../navigation/AppNavigator';
import {
  IOSNavBar, IOSNavButton, IOSTabBar, LargeTitle, Segmented, FAB,
} from '../components/ios';
import {
  format, isAfter, isBefore, differenceInCalendarDays, parseISO,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Icon } from '../components/icons';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ShowList'>;
type SegKey = 'upcoming' | 'past';

const SEG: { key: SegKey; label: string }[] = [
  { key: 'upcoming', label: 'Próximos' },
  { key: 'past',     label: 'Realizados' },
];

// ── Status helpers ─────────────────────────────────────────────────────────────

type ShowStatus = { color: string; bg: string; label: string; past: boolean; urgent: boolean };

function getStatus(show: Show): ShowStatus {
  if (!show.date || !show.time) {
    return { color: '#8E8E93', bg: 'rgba(142,142,147,0.12)', label: 'A DEFINIR', past: false, urgent: false };
  }
  const dt = parseISO(`${show.date}T${show.time}`);
  if (isNaN(dt.getTime())) {
    return { color: '#8E8E93', bg: 'rgba(142,142,147,0.12)', label: 'A DEFINIR', past: false, urgent: false };
  }
  const now = new Date();
  if (isBefore(dt, now)) {
    return { color: '#8E8E93', bg: 'rgba(142,142,147,0.10)', label: 'CONCLUÍDO', past: true, urgent: false };
  }
  const days = differenceInCalendarDays(dt, now);
  if (days === 0) return { color: '#FF3B30', bg: 'rgba(255,59,48,0.10)',  label: `HOJE · ${show.time}`,    past: false, urgent: true };
  if (days === 1) return { color: '#FF9500', bg: 'rgba(255,149,0,0.10)',  label: `AMANHÃ · ${show.time}`,  past: false, urgent: true };
  if (days <= 4) return { color: '#FF9500', bg: 'rgba(255,149,0,0.10)',  label: `EM ${days} DIAS`,          past: false, urgent: true };
  return       { color: '#007AFF', bg: 'rgba(0,122,255,0.08)', label: `EM ${days} DIAS`,          past: false, urgent: false };
}

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function ShowListScreen({ navigation }: { navigation: Nav }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [shows, setShows] = useState<Show[]>([]);
  const [seg, setSeg] = useState<SegKey>('upcoming');

  const refresh = useCallback(async () => setShows(await loadShows()), []);
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const handleDelete = (show: Show) => {
    if (Platform.OS === 'web') {
      if ((window as any).confirm(`Excluir "${show.name}"?`)) deleteShow(show.id).then(refresh).catch(console.error);
      return;
    }
    Alert.alert('Excluir show', `Excluir "${show.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => deleteShow(show.id).then(refresh) },
    ]);
  };

  const now = new Date();
  const showTime = (s: typeof shows[number]): number => {
    if (!s.date) return Number.POSITIVE_INFINITY;
    const d = parseISO(`${s.date}T${s.time || '00:00'}`);
    return isNaN(d.getTime()) ? Number.POSITIVE_INFINITY : d.getTime();
  };
  const filtered = shows
    .filter((s) => {
      if (!s.date || !s.time) return seg === 'upcoming';
      const d = parseISO(`${s.date}T${s.time}`);
      if (isNaN(d.getTime())) return seg === 'upcoming';
      return seg === 'upcoming' ? isAfter(d, now) : isBefore(d, now);
    })
    .sort((a, b) => {
      const ta = showTime(a);
      const tb = showTime(b);
      return seg === 'upcoming' ? ta - tb : tb - ta;
    });

  return (
    <View style={[s.container, { backgroundColor: colors.bg }]}>
      <IOSNavBar
        left={<IOSNavButton onPress={() => navigation.navigate('Settings')}>⚙</IOSNavButton>}
        right={<IOSNavButton bold onPress={() => navigation.navigate('CreateShow')}>＋</IOSNavButton>}
        compactTitle="Shows"
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <LargeTitle>Shows</LargeTitle>

        <Segmented value={seg} onChange={setSeg} options={SEG} />

        {filtered.length > 0 && (
          <Text style={[s.countLabel, { color: colors.label2 }]}>
            {filtered.length} {seg === 'upcoming' ? 'agendados' : 'realizados'}
          </Text>
        )}

        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          {filtered.length === 0 ? (
            <EmptyState
              title={seg === 'upcoming' ? 'Nenhum show agendado' : 'Nenhum show realizado'}
              subtitle={seg === 'upcoming' ? 'Toque em ＋ para criar o próximo.' : 'Shows concluídos aparecem aqui.'}
            />
          ) : filtered.map((show) => (
            <ShowCard
              key={show.id}
              show={show}
              onPress={() => navigation.navigate('ShowDetail', { showId: show.id })}
              onLongPress={() => handleDelete(show)}
            />
          ))}
        </View>
      </ScrollView>

      <FAB onPress={() => navigation.navigate('CreateShow')} bottom={100 + insets.bottom} label="Criar novo show" />
      <IOSTabBar current="ShowList" navigation={navigation} />
    </View>
  );
}

// ── VerifiedBadge — starburst azul animado ─────────────────────────────────────
function VerifiedBadge({ size = 22 }: { size?: number }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (reduceMotion) { pulse.setValue(1); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.2, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion]);
  const sq = size * 0.7;
  const r = size * 0.13;
  const off = (size - sq) / 2;
  return (
    <Animated.View style={{ width: size, height: size, transform: [{ scale: pulse }] }}>
      {([0, 22.5, 45, 67.5] as number[]).map((deg) => (
        <View key={deg} style={{
          position: 'absolute', top: off, left: off, width: sq, height: sq,
          borderRadius: r, backgroundColor: '#007AFF',
          transform: [{ rotate: `${deg}deg` }],
        }} />
      ))}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="check" color="#fff" size={Math.round(size * 0.42)} />
      </View>
    </Animated.View>
  );
}

// ── ShowCard ───────────────────────────────────────────────────────────────────

function ShowCard({
  show, onPress, onLongPress,
}: { show: Show; onPress: () => void; onLongPress?: () => void }) {
  const { colors } = useTheme();
  const status = getStatus(show);

  const showDate = show.date ? parseISO(`${show.date}T${show.time || '00:00'}`) : null;
  const isValidDate = showDate && !isNaN(showDate.getTime());

  const dayNum   = isValidDate ? format(showDate!, 'd') : '—';
  const monthStr = isValidDate ? format(showDate!, 'MMM', { locale: ptBR }).replace('.', '').toUpperCase() : '';
  const weekStr  = isValidDate ? format(showDate!, 'EEE', { locale: ptBR }).replace('.', '').toUpperCase() : '';

  const hasLogistics = !!(show.hasHotel || show.hasAirplane || show.hasVan);

  const remDone = (show.reminders ?? []).filter((r) => r.done).length;
  const matDone = (show.materials ?? []).filter((m) => m.checked).length;
  const done  = remDone + matDone;
  const total = (show.reminders ?? []).length + (show.materials ?? []).length;
  const progress = total > 0 ? done / total : 0;

  const badgeLabel = status.label;

  const a11yLabel = [show.name, show.city, dayNum && monthStr ? `${dayNum} de ${monthStr}` : null, show.time ? `às ${show.time}` : null].filter(Boolean).join(', ');

  return (
    <TouchableOpacity
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      activeOpacity={0.82}
      onPress={onPress}
      onLongPress={onLongPress}
      style={[card.shadow, { shadowColor: status.color, opacity: status.past ? 0.6 : 1 }]}
    >
      <View style={[card.inner, { backgroundColor: colors.surface }]}>
        {/* Colored left stripe */}
        <View style={[card.stripe, { backgroundColor: status.color }]} />

        <View style={card.content}>

          {/* ── Top row: date stamp | info | time ── */}
          <View style={card.topRow}>

            {/* Date stamp */}
            <View style={[card.dateStamp, { borderRightColor: colors.border }]}>
              <Text style={[card.dayNum, { color: status.color }]}>{dayNum}</Text>
              {monthStr ? <Text style={[card.monthStr, { color: colors.label2 }]}>{monthStr}</Text> : null}
              {weekStr  ? <Text style={[card.weekStr,  { color: colors.label3 }]}>{weekStr}</Text>  : null}
            </View>

            {/* Show name + venue + contratante */}
            <View style={card.info}>
              <Text numberOfLines={2} style={[card.title, { color: colors.label }]}>
                {show.name}
              </Text>
              {(show.venue || show.city) ? (
                <Text numberOfLines={1} style={[card.venueLine, { color: colors.label2 }]}>
                  {[show.venue?.trim() !== show.name?.trim() ? show.venue : null, show.city].filter(Boolean).join(' · ')}
                </Text>
              ) : null}
              {show.contratante ? (
                <Text numberOfLines={1} style={[card.contratante, { color: colors.label3 }]}>
                  {show.contratante}
                </Text>
              ) : null}
            </View>

            {/* Time */}
            {show.time ? (
              <View style={card.timeBlock}>
                <Text style={[card.time, { color: colors.label }]}>{show.time}</Text>
              </View>
            ) : null}
          </View>

          {/* ── Divider ── */}
          <View style={[card.divider, { backgroundColor: colors.border }]} />

          {/* ── Bottom row: status badge + meeting point + verified badge | logistics ── */}
          <View style={card.bottomRow}>
            <View style={card.bottomLeft}>
              <View style={[card.badge, { backgroundColor: status.bg }]}>
                <Text style={[card.badgeText, { color: status.color }]}>{badgeLabel}</Text>
              </View>
              {show.departureTimeMeetingShow && !status.past ? (
                <View style={card.meetingBadge}>
                  <View style={[card.meetingDot, { backgroundColor: status.color }]} />
                  <Text style={[card.meetingBadgeText, { color: colors.label2 }]}>
                    Ponto de encontro {show.departureTimeMeetingShow}
                  </Text>
                </View>
              ) : null}
              {hasLogistics && show.logisticsFinalized ? (
                <VerifiedBadge size={20} />
              ) : null}
            </View>
            {/* Logistics icons — right side */}
            {hasLogistics && (
              <View style={card.logisticsIcons} accessibilityElementsHidden={true} importantForAccessibility="no-hide-descendants">
                {show.hasAirplane ? <Text style={card.logisticIcon}>✈</Text> : null}
                {show.hasHotel    ? <Text style={card.logisticIcon}>🏨</Text> : null}
                {show.hasVan      ? <Text style={card.logisticIcon}>🚐</Text> : null}
              </View>
            )}
          </View>

          {/* ── Progress ── */}
          {total > 0 && (
            <View style={card.progressRow}>
              <View style={[card.progressTrack, { backgroundColor: colors.fill2 }]}>
                <View style={[
                  card.progressFill,
                  { width: `${progress * 100}%` as any, backgroundColor: progress === 1 ? '#34C759' : status.color },
                ]} />
              </View>
              <Text style={[card.progressCount, { color: colors.label3 }]}>{done}/{total}</Text>
            </View>
          )}

        </View>
      </View>
    </TouchableOpacity>
  );
}

const card = StyleSheet.create({
  shadow: {
    marginBottom: 14,
    borderRadius: 18,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.13,
    shadowRadius: 18,
    elevation: 5,
  },
  inner: {
    borderRadius: 18,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  stripe: {
    width: 5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  dateStamp: {
    alignItems: 'center',
    width: 44,
    paddingRight: 10,
    borderRightWidth: StyleSheet.hairlineWidth,
    paddingTop: 2,
  },
  dayNum: {
    fontSize: 30,
    fontFamily: 'ClashDisplay-Bold',
    fontWeight: '700',
    lineHeight: 32,
    letterSpacing: -1.5,
  },
  monthStr: {
    fontSize: 11,
    fontFamily: 'CabinetGrotesk-Bold',
    fontWeight: '800',
    letterSpacing: 1.0,
    marginTop: 2,
  },
  weekStr: {
    fontSize: 10,
    fontFamily: 'CabinetGrotesk-Medium',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  title: {
    fontSize: 17,
    fontFamily: 'ClashDisplay-Bold',
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  venueLine: {
    fontSize: 13,
    fontFamily: 'CabinetGrotesk-Regular',
    letterSpacing: -0.1,
  },
  contratante: {
    fontSize: 12,
    fontFamily: 'CabinetGrotesk-Regular',
    letterSpacing: -0.1,
  },
  timeBlock: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  time: {
    fontSize: 22,
    fontFamily: 'SpaceGrotesk-Bold',
    fontWeight: '700',
    letterSpacing: -1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  bottomLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    flexShrink: 0,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'CabinetGrotesk-Bold',
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  meetingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
    minWidth: 0,
  },
  meetingDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    flexShrink: 0,
  },
  meetingBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#007AFF44',
    backgroundColor: '#007AFF12',
    flexShrink: 0,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#007AFF',
    letterSpacing: -0.1,
    fontFamily: 'CabinetGrotesk-Bold',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logisticsIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexShrink: 0,
  },
  logisticIcon: {
    fontSize: 13,
    lineHeight: 16,
  },
  progressTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%' as any,
    borderRadius: 2,
  },
  progressCount: {
    fontSize: 11,
    fontWeight: '700',
    flexShrink: 0,
  },
});

// ── EmptyState ─────────────────────────────────────────────────────────────────

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  const { colors } = useTheme();
  return (
    <View style={empty.wrap}>
      <View style={[empty.iconWrap, { backgroundColor: colors.fill2 }]}>
        <Icon name="mic" color={colors.label3} size={32} />
      </View>
      <Text style={[empty.title, { color: colors.label }]}>{title}</Text>
      <Text style={[empty.subtitle, { color: colors.label2 }]}>{subtitle}</Text>
    </View>
  );
}

const empty = StyleSheet.create({
  wrap:     { alignItems: 'center', paddingVertical: 64 },
  iconWrap: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title:    { fontSize: 19, fontWeight: '700', letterSpacing: -0.4 },
  subtitle: { fontSize: 14, marginTop: 6, letterSpacing: -0.1, textAlign: 'center', opacity: 0.7 },
});

// ── Screen styles ──────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container:  { flex: 1 },
  countLabel: { paddingHorizontal: 20, paddingBottom: 4, fontSize: 13, fontWeight: '600', letterSpacing: 0.2 },
});
