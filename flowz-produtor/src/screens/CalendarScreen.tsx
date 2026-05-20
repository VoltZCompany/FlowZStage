// Calendar screen — iOS Refresh port.
// Month grid card + selected-day detail (shows as purple hero cards,
// tasks as bordered cards). Mirrors tesla-ios/app.js renderCalendar.

import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { Task } from '../types/task';
import { Show } from '../types/show';
import { loadTasks } from '../store/taskStore';
import { loadShows } from '../store/showStore';
import { Priority as PrioConf } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import {
  IOSNavBar, IOSNavButton, IOSTabBar, LargeTitle, Card, Chip,
} from '../components/ios';
import {
  format, isSameDay, isToday, parseISO,
  startOfMonth, endOfMonth, eachDayOfInterval, getDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Icon } from '../components/icons';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Calendar'>;

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export default function CalendarScreen({ navigation }: { navigation: Nav }) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [shows, setShows] = useState<Show[]>([]);

  const refresh = useCallback(async () => {
    const [t, sh] = await Promise.all([loadTasks(), loadShows()]);
    setTasks(t);
    setShows(sh);
  }, []);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const days = useMemo(() => eachDayOfInterval({
    start: startOfMonth(month),
    end: endOfMonth(month),
  }), [month]);
  const leading = getDay(days[0]);

  const tasksOnSelected = tasks.filter((t) => t.deadline && isSameDay(new Date(t.deadline), selected));
  const showsOnSelected = shows.filter((s) => !!s.date && isSameDay(parseISO(s.date), selected));

  const hasTasks = (d: Date) => tasks.some((t) => t.deadline && isSameDay(new Date(t.deadline), d));
  const hasShows = (d: Date) => shows.some((s) => !!s.date && isSameDay(parseISO(s.date), d));

  const prev = () => {
    const nm = new Date(month.getFullYear(), month.getMonth() - 1, 1);
    setMonth(nm); setSelected(nm);
  };
  const next = () => {
    const nm = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    setMonth(nm); setSelected(nm);
  };

  const monthLabel = format(month, 'MMMM yyyy', { locale: ptBR });

  return (
    <View style={[s.container, { backgroundColor: colors.bg }]}>
      <IOSNavBar
        left={<IOSNavButton onPress={prev}>‹</IOSNavButton>}
        right={<IOSNavButton onPress={next}>›</IOSNavButton>}
        compactTitle={capitalize(monthLabel)}
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <LargeTitle style={{ textTransform: 'capitalize' }}>{monthLabel}</LargeTitle>

        <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
          <Card style={{ padding: 14, marginBottom: 0 }}>
            <View style={s.weekHeader}>
              {WEEKDAYS.map((d, i) => (
                <Text key={i} style={[s.weekDay, { color: colors.label2 }]}>{d}</Text>
              ))}
            </View>
            <View style={s.grid}>
              {Array.from({ length: leading }).map((_, i) => (
                <View key={`e${i}`} style={s.cell} />
              ))}
              {days.map((d) => {
                const isSel = isSameDay(d, selected);
                const today = isToday(d);
                const dots: string[] = [];
                if (hasTasks(d)) dots.push('#FF9500');
                if (hasShows(d)) dots.push(colors.brand);

                return (
                  <Pressable
                    key={d.toISOString()}
                    onPress={() => setSelected(d)}
                    style={[
                      s.cell,
                      s.cellDay,
                      isSel && { backgroundColor: colors.brand },
                    ]}
                  >
                    <Text style={[
                      s.cellNum,
                      {
                        color: isSel ? '#fff' : today ? colors.brand : colors.label,
                        fontWeight: today || isSel ? '700' : '500',
                      },
                    ]}>
                      {format(d, 'd')}
                    </Text>
                    <View style={s.dotsRow}>
                      {dots.map((c, i) => (
                        <View
                          key={i}
                          style={[s.dot, { backgroundColor: isSel ? '#fff' : c }]}
                        />
                      ))}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Card>
        </View>

        <Text style={[s.sectionHeader, { color: colors.label2 }]}>
          {capitalize(format(selected, "EEEE, dd 'de' MMMM", { locale: ptBR }))}
        </Text>

        <View style={{ paddingHorizontal: 20 }}>
          {showsOnSelected.length === 0 && tasksOnSelected.length === 0 && (
            <Card style={{ padding: 30, alignItems: 'center' }}>
              <Text style={{ fontSize: 40, opacity: 0.5, marginBottom: 8 }}>📭</Text>
              <Text style={{ color: colors.label2, fontSize: 15 }}>Nenhum compromisso neste dia</Text>
            </Card>
          )}

          {showsOnSelected.map((show) => (
            <Pressable
              key={show.id}
              onPress={() => navigation.navigate('ShowDetail', { showId: show.id })}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Show: ${show.name}${show.city ? `, ${show.city}` : ''}${show.time ? `, às ${show.time}` : ''}`}
              style={({ pressed }) => [
                s.showItem,
                pressed && { transform: [{ scale: 0.98 }] },
              ]}
            >
              <View style={s.showBadge}>
                <Text style={s.showBadgeText}>🎤 SHOW</Text>
              </View>
              <Text style={s.showName}>{show.name}</Text>
              <Text style={s.showMeta}>{[show.time, show.venue?.trim() !== show.name?.trim() ? show.venue : null, show.city].filter(Boolean).join(' · ')}</Text>
            </Pressable>
          ))}

          {tasksOnSelected.map((task) => {
            const prio = PrioConf[task.priority] ?? PrioConf.medium;
            const dl = new Date(task.deadline!);
            const time = format(dl, 'HH:mm');
            // Dark mode: chip com bg sólido da cor da prioridade + texto branco;
            // Light mode: bg translúcido + texto colorido. Mesma regra do TaskRow.
            const chipBg = isDark ? prio.color : prio.bg;
            const chipFg = isDark ? '#FFFFFF' : prio.color;
            return (
              <Card
                key={task.id}
                onPress={() => navigation.navigate('TaskDetail', { taskId: task.id })}
                style={[s.taskItem, { borderLeftColor: prio.color, backgroundColor: colors.surface }]}
              >
                <View style={{ flex: 1 }}>
                  <Chip color={chipFg} bg={chipBg} style={{ marginBottom: 6 }}>
                    <Icon name={task.priority as any} color={chipFg} size={12} />{'  '}{prio.label.toUpperCase()}
                  </Chip>
                  <Text style={[s.taskTitle, { color: colors.label }]}>{task.title}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <Icon name="clock" color={colors.label2} size={13} />
                    <Text style={[s.taskTime, { color: colors.label2 }]}>{time}</Text>
                  </View>
                </View>
                <Text style={[s.chev, { color: colors.label3 }]}>›</Text>
              </Card>
            );
          })}

          {!isToday(selected) && (
            <TouchableOpacity
              onPress={() => { const n = new Date(); setSelected(n); setMonth(n); }}
              style={[s.todayBtn, { backgroundColor: colors.fill2 }]}
            >
              <Text style={[s.todayBtnText, { color: colors.brand }]}>Ir para hoje</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <IOSTabBar current="Calendar" navigation={navigation} />
    </View>
  );
}

function capitalize(str: string) { return str.charAt(0).toUpperCase() + str.slice(1); }

const s = StyleSheet.create({
  container: { flex: 1 },
  weekHeader: { flexDirection: 'row', marginBottom: 8 },
  weekDay: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, paddingVertical: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 1 },
  cellDay: { alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  cellNum: { fontSize: 15 },
  dotsRow: { flexDirection: 'row', gap: 2, height: 4, marginTop: 3 },
  dot: { width: 4, height: 4, borderRadius: 2 },

  sectionHeader: { paddingHorizontal: 36, paddingTop: 20, paddingBottom: 10, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.4 },

  showItem: {
    backgroundColor: '#007AFF',
    borderRadius: 16, padding: 14, marginBottom: 10,
    shadowColor: '#007AFF', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 6,
  },
  showBadge: { backgroundColor: 'rgba(255,255,255,.2)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9999 },
  showBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  showName: { color: '#fff', fontSize: 17, fontWeight: '700', marginTop: 8, letterSpacing: -0.3 },
  showMeta: { color: 'rgba(255,255,255,.85)', fontSize: 13, marginTop: 2 },

  taskItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderLeftWidth: 4, padding: 14, marginBottom: 10,
  },
  taskTitle: { fontSize: 15, fontWeight: '600', letterSpacing: -0.3, textTransform: 'uppercase' },
  taskTime: { fontSize: 12, marginTop: 2 },
  chev: { fontSize: 20, fontWeight: '300' },

  todayBtn: { borderRadius: 9999, paddingVertical: 10, alignItems: 'center', marginTop: 12 },
  todayBtnText: { fontSize: 14, fontWeight: '600' },
});
