// iOS Refresh primitives — shared building blocks used across every screen.

import React, { ReactNode, useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle, TextStyle, Pressable, Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { Radius, Spacing, FontSize } from '../../constants/theme';

// ── SVG tab icons (web) / emoji fallback (native) ────────────────────────────

function TabSvgIcon({ name, color, size = 24 }: { name: 'home' | 'mic' | 'calendar' | 'lock' | 'briefcase'; color: string; size?: number }) {
  if (Platform.OS !== 'web') {
    const map = { home: '🏠', mic: '🎤', calendar: '📅', lock: '🔒', briefcase: '💼' };
    return <Text style={{ fontSize: size - 2, lineHeight: size + 2 }}>{map[name]}</Text>;
  }
  const stroke = color;
  const w = 2.2;
  const paths: Record<string, React.ReactElement> = {
    home: React.createElement('svg', { key: 'svg', width: size, height: size, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' } as any,
      React.createElement('path', { key: 'p1', d: 'M3 12L12 3l9 9', stroke, strokeWidth: w, strokeLinecap: 'round', strokeLinejoin: 'round' }),
      React.createElement('path', { key: 'p2', d: 'M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9', stroke, strokeWidth: w, strokeLinecap: 'round', strokeLinejoin: 'round' }),
    ),
    mic: React.createElement('svg', { key: 'svg', width: size, height: size, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' } as any,
      React.createElement('rect', { key: 'r1', x: 9, y: 2, width: 6, height: 12, rx: 3, stroke, strokeWidth: w }),
      React.createElement('path', { key: 'p1', d: 'M5 10a7 7 0 0014 0', stroke, strokeWidth: w, strokeLinecap: 'round' }),
      React.createElement('line', { key: 'l1', x1: 12, y1: 17, x2: 12, y2: 21, stroke, strokeWidth: w, strokeLinecap: 'round' }),
      React.createElement('line', { key: 'l2', x1: 9, y1: 21, x2: 15, y2: 21, stroke, strokeWidth: w, strokeLinecap: 'round' }),
    ),
    calendar: React.createElement('svg', { key: 'svg', width: size, height: size, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' } as any,
      React.createElement('rect', { key: 'r1', x: 3, y: 4, width: 18, height: 18, rx: 3, stroke, strokeWidth: w }),
      React.createElement('line', { key: 'l1', x1: 16, y1: 2, x2: 16, y2: 6, stroke, strokeWidth: w, strokeLinecap: 'round' }),
      React.createElement('line', { key: 'l2', x1: 8, y1: 2, x2: 8, y2: 6, stroke, strokeWidth: w, strokeLinecap: 'round' }),
      React.createElement('line', { key: 'l3', x1: 3, y1: 9, x2: 21, y2: 9, stroke, strokeWidth: w }),
    ),
    lock: React.createElement('svg', { key: 'svg', width: size, height: size, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' } as any,
      React.createElement('rect', { key: 'r1', x: 5, y: 11, width: 14, height: 11, rx: 2, stroke, strokeWidth: w }),
      React.createElement('path', { key: 'p1', d: 'M8 11V7a4 4 0 018 0v4', stroke, strokeWidth: w, strokeLinecap: 'round' }),
      React.createElement('circle', { key: 'c1', cx: 12, cy: 16.5, r: 1.5, fill: color }),
    ),
    briefcase: React.createElement('svg', { key: 'svg', width: size, height: size, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' } as any,
      React.createElement('rect', { key: 'r1', x: 2, y: 8, width: 20, height: 14, rx: 2, stroke, strokeWidth: w }),
      React.createElement('path', { key: 'p1', d: 'M8 8V6a4 4 0 018 0v2', stroke, strokeWidth: w, strokeLinecap: 'round' }),
      React.createElement('line', { key: 'l1', x1: 2, y1: 14, x2: 22, y2: 14, stroke, strokeWidth: w }),
    ),
  };
  return paths[name];
}

// ── Large title + navigation bar (iOS) ────────────────────────────────────────

export function IOSNavBar({
  left, right, title, compactTitle,
}: {
  left?: ReactNode;
  right?: ReactNode;
  title?: string;
  /** Title shown once the user scrolls past the large title. Defaults to title. */
  compactTitle?: string;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[
      navStyles.bar,
      { paddingTop: insets.top + 4, backgroundColor: colors.bg },
    ]}>
      <View style={navStyles.row}>
        <View style={navStyles.side}>{left}</View>
        <Text numberOfLines={1} style={[navStyles.title, { color: colors.label }]}>
          {compactTitle ?? title ?? ''}
        </Text>
        <View style={[navStyles.side, navStyles.sideRight]}>{right}</View>
      </View>
    </View>
  );
}

export function IOSNavButton({
  children, onPress, bold, disabled,
}: {
  children: ReactNode;
  onPress?: () => void;
  bold?: boolean;
  disabled?: boolean;
}) {
  const { colors, isDark } = useTheme();
  // No modo dark os botões da nav bar usam branco puro pra máximo contraste
  // sobre o fundo preto. No light mode, mantém a cor de marca (azul/roxo).
  const tintColor = disabled ? colors.label3 : (isDark ? '#FFFFFF' : colors.brand);
  return (
    <TouchableOpacity
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      onPress={onPress}
      disabled={disabled}
      style={navStyles.btn}
      activeOpacity={0.5}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
    >
      <Text style={[
        navStyles.btnText,
        { color: tintColor, fontWeight: bold ? '700' : '600' },
      ]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}

const navStyles = StyleSheet.create({
  bar: { paddingHorizontal: Spacing.md, paddingBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 52 },
  side: { minWidth: 72, flexDirection: 'row', alignItems: 'center' },
  sideRight: { justifyContent: 'flex-end' },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', fontFamily: 'CabinetGrotesk-Bold', letterSpacing: -0.3, marginHorizontal: Spacing.sm },
  btn: { paddingVertical: 10, paddingHorizontal: 10 },
  btnText: { fontSize: 22, letterSpacing: -0.4, lineHeight: 26 },
});

export function LargeTitle({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const { colors } = useTheme();
  return (
    <Text style={[largeTitleStyle, { color: colors.label }, style]}>{children}</Text>
  );
}

const largeTitleStyle: TextStyle = {
  paddingHorizontal: 20,
  paddingTop: 8,
  paddingBottom: 3,
  fontSize: 36,
  fontFamily: 'ClashDisplay-Bold',
  fontWeight: '700',
  letterSpacing: -1,
  lineHeight: 42,
};

// ── Segmented control ─────────────────────────────────────────────────────────

export function Segmented<T extends string>({
  value, onChange, options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { key: T; label: string }[];
}) {
  const { colors } = useTheme();
  return (
    <View style={segStyles.wrap}>
      {options.map((opt) => {
        const active = value === opt.key;
        return (
          <TouchableOpacity
            key={opt.key}
            activeOpacity={0.75}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={opt.label}
            style={[
              segStyles.item,
              { backgroundColor: active ? colors.primary : colors.surface },
            ]}
            onPress={() => onChange(opt.key)}
          >
            <Text style={[
              segStyles.text,
              { color: active ? '#FFFFFF' : colors.label2, fontWeight: active ? '700' : '500' },
            ]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const segStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 12, gap: 8, justifyContent: 'center' },
  item: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 13, letterSpacing: -0.1 },
});

// ── List group (iOS grouped rows) ─────────────────────────────────────────────

export function ListGroup({
  children, style,
}: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return (
    <View style={[listStyles.group, { backgroundColor: colors.surface }, style]}>
      {children}
    </View>
  );
}

export function ListRow({
  icon,
  iconBg,
  title,
  subtitle,
  value,
  chevron,
  onPress,
  trailing,
  titleStyle,
  separator = true,
}: {
  icon?: ReactNode;
  iconBg?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  value?: ReactNode;
  chevron?: boolean;
  onPress?: () => void;
  trailing?: ReactNode;
  titleStyle?: StyleProp<TextStyle>;
  separator?: boolean;
}) {
  const { colors } = useTheme();
  const Wrap: any = onPress ? TouchableOpacity : View;
  return (
    <Wrap
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        listStyles.row,
        { backgroundColor: colors.surface },
        separator && { borderBottomColor: colors.separatorOp, borderBottomWidth: StyleSheet.hairlineWidth },
      ]}
    >
      {icon && (
        <View style={[listStyles.icon, { backgroundColor: iconBg ?? colors.brand }]}>
          {icon}
        </View>
      )}
      <View style={listStyles.content}>
        {typeof title === 'string' ? (
          <Text style={[listStyles.title, { color: colors.label }, titleStyle]}>{title}</Text>
        ) : title}
        {subtitle !== undefined && subtitle !== null && subtitle !== '' && (
          typeof subtitle === 'string'
            ? <Text style={[listStyles.subtitle, { color: colors.label2 }]}>{subtitle}</Text>
            : subtitle
        )}
      </View>
      {value !== undefined && value !== null && value !== '' && (
        typeof value === 'string' || typeof value === 'number'
          ? <Text style={[listStyles.value, { color: colors.label2 }]}>{value}</Text>
          : value
      )}
      {trailing}
      {chevron && <Text style={[listStyles.chev, { color: colors.label3 }]}>›</Text>}
    </Wrap>
  );
}

// Marks the last row as having no bottom separator.
// Use on the child you want to render without a border.
export function ListRowLast(props: React.ComponentProps<typeof ListRow>) {
  return <ListRow {...props} separator={false} />;
}

const listStyles = StyleSheet.create({
  group: { borderRadius: Radius.lg, overflow: 'hidden', marginHorizontal: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 10, minHeight: 44 },
  icon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, minWidth: 0 },
  title: { fontSize: 17, letterSpacing: -0.4 },
  subtitle: { fontSize: 13, marginTop: 1, letterSpacing: -0.1 },
  value: { fontSize: 17, letterSpacing: -0.4 },
  chev: { fontSize: 20, fontWeight: '300', marginLeft: 6 },
});

// ── Section header ────────────────────────────────────────────────────────────

export function SectionHeader({
  children, style,
}: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const { colors } = useTheme();
  return (
    <Text style={[sectionStyle, { color: colors.label2 }, style]}>{children}</Text>
  );
}

const sectionStyle: TextStyle = {
  paddingHorizontal: 36,
  paddingTop: 20,
  paddingBottom: 6,
  fontSize: 13,
  fontWeight: '400',
  textTransform: 'uppercase',
  letterSpacing: -0.1,
};

// ── Chip / Pill ───────────────────────────────────────────────────────────────

export function Chip({
  children, color, bg, style,
}: {
  children: ReactNode;
  color?: string;
  bg?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <View style={[chipStyles.chip, { backgroundColor: bg ?? colors.fill2 }, style]}>
      {typeof children === 'string' ? (
        <Text style={[chipStyles.text, { color: color ?? colors.label2 }]}>{children}</Text>
      ) : children}
    </View>
  );
}

const chipStyles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999, alignSelf: 'flex-start' },
  text: { fontSize: 12, fontWeight: '600', letterSpacing: -0.1 },
});

// ── iOS Switch (51×31) ───────────────────────────────────────────────────────

export function IOSSwitch({
  value, onValueChange,
}: { value: boolean; onValueChange: (v: boolean) => void }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onValueChange(!value)}
      style={[
        switchStyles.track,
        { backgroundColor: value ? '#34C759' : colors.surface3 },
      ]}
    >
      <View style={[
        switchStyles.knob,
        value && { transform: [{ translateX: 20 }] },
      ]} />
    </TouchableOpacity>
  );
}

const switchStyles = StyleSheet.create({
  track: { width: 51, height: 31, borderRadius: 999, justifyContent: 'center' },
  knob: {
    width: 27,
    height: 27,
    borderRadius: 999,
    backgroundColor: '#fff',
    marginLeft: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
});

// ── iOS bottom tab bar (3 tabs: Hoje, Shows, Calendário) ─────────────────────
//
// The stack navigator is kept — this is a pure-visual bar rendered on the three
// root screens. Tapping a tab navigates to the matching screen by replacing
// the stack root, so back nav still works inside each tab.

import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation/AppNavigator';

type TabKey = 'ShowList' | 'Calendar';

function TabItem({
  tab, active, isDark, colors, onPress,
}: {
  tab: { key: TabKey; label: string; icon: 'home' | 'mic' | 'calendar' | 'lock' | 'briefcase' };
  active: boolean;
  isDark: boolean;
  colors: any;
  onPress: () => void;
}) {
  const anim = useRef(new Animated.Value(active ? 1 : 0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: active ? 1 : 0,
      useNativeDriver: true,
      damping: 18,
      stiffness: 280,
      mass: 0.7,
    }).start();
  }, [active, anim]);

  const handlePressIn = () => {
    Animated.spring(pressAnim, { toValue: 0.88, useNativeDriver: true, damping: 15, stiffness: 400 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(pressAnim, { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 350 }).start();
  };

  const iconScale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const bgOpacity = anim;
  const iconColor = active ? (isDark ? '#fff' : colors.brand) : colors.label2;

  return (
    <TouchableOpacity
      style={tabStyles.item}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={tab.label}
    >
      <Animated.View style={{ transform: [{ scale: pressAnim }], flex: 1, alignItems: 'center', gap: 3 }}>
        {/* Ícone com scale spring */}
        <Animated.View style={{ transform: [{ scale: iconScale }] }}>
          <TabSvgIcon name={tab.icon} color={iconColor} size={22} />
        </Animated.View>
        <Text style={[
          tabStyles.label,
          { color: active ? colors.brand : colors.label2 },
          active && { fontWeight: '700' },
        ]}>
          {tab.label}
        </Text>
        {/* Dot indicator */}
        <Animated.View style={[tabStyles.dot, { opacity: bgOpacity, backgroundColor: colors.brand }]} />
      </Animated.View>
    </TouchableOpacity>
  );
}

export function IOSTabBar({
  current, navigation,
}: {
  current: TabKey;
  navigation: NavigationProp<RootStackParamList>;
}) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const tabs: { key: TabKey; label: string; icon: 'mic' | 'calendar' }[] = [
    { key: 'ShowList', label: 'Shows',      icon: 'mic' },
    { key: 'Calendar', label: 'Calendário', icon: 'calendar' },
  ];

  const nav = (key: TabKey) => {
    if (key === current) return;
    navigation.reset({ index: 0, routes: [{ name: key }] });
  };

  const bottomOffset = Math.max(insets.bottom + 8, 22);

  return (
    <View
      style={[
        tabStyles.bar,
        {
          bottom: bottomOffset,
          backgroundColor: isDark ? 'rgba(20,18,32,0.82)' : 'rgba(255,255,255,0.82)',
          borderColor: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.95)',
          shadowColor: '#000',
        },
        Platform.OS === 'web' && ({
          backdropFilter: 'blur(18px) saturate(150%)',
          WebkitBackdropFilter: 'blur(18px) saturate(150%)',
          background: isDark
            ? 'linear-gradient(180deg, rgba(255,255,255,.07) 0%, rgba(255,255,255,.03) 100%)'
            : 'rgba(255,255,255,.82)',
          boxShadow: isDark
            ? '0 1px 0 rgba(255,255,255,.15) inset, 0 14px 36px rgba(0,0,0,.4)'
            : '0 1px 0 rgba(255,255,255,1) inset, 0 8px 24px rgba(79,70,229,.08)',
        } as any),
      ]}
    >
      {tabs.map((t) => (
        <TabItem
          key={t.key}
          tab={t}
          active={t.key === current}
          isDark={isDark}
          colors={colors}
          onPress={() => nav(t.key)}
        />
      ))}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    borderRadius: 26,
    padding: 6,
    gap: 2,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.4,
    shadowRadius: 36,
    elevation: 12,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 6,
    paddingHorizontal: 4,
    borderRadius: 20,
  },
  pillBg: { borderRadius: 20 },
  label: { fontSize: 10, letterSpacing: 0, fontFamily: 'CabinetGrotesk-Medium' },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: -2 },
});

// ── FAB (floating action button) ──────────────────────────────────────────────

export function FAB({ onPress, glyph = '+', bottom = 100, label }: { onPress: () => void; glyph?: string; bottom?: number; label?: string }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label ?? 'Adicionar'}
      style={({ pressed }) => [
        fabStyles.btn,
        {
          backgroundColor: colors.brand,
          bottom,
          transform: [{ scale: pressed ? 0.94 : 1 }],
        },
      ]}
    >
      <Text style={fabStyles.glyph} accessibilityElementsHidden={true} importantForAccessibility="no">{glyph}</Text>
    </Pressable>
  );
}

const fabStyles = StyleSheet.create({
  btn: {
    position: 'absolute',
    right: 18,
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3395FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 10,
  },
  glyph: { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 32 },
});

// ── Card with press feedback ──────────────────────────────────────────────────

export const Card = React.forwardRef<any, {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
}>(function Card({ children, onPress, onLongPress, style }, ref) {
  const { colors } = useTheme();
  const [pressed, setPressed] = useState(false);
  const Wrap: any = (onPress || onLongPress) ? Pressable : View;
  return (
    <Wrap
      ref={ref}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 8 },
        pressed && { transform: [{ scale: 0.985 }] },
        style,
      ]}
    >
      {children}
    </Wrap>
  );
});

// ── Full-width primary / destructive button (iOS rounded 14px) ────────────────

export function PrimaryButton({
  children, onPress, disabled, style,
}: {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      style={[
        buttonStyles.primary,
        { backgroundColor: colors.brand, opacity: disabled ? 0.5 : 1 },
        style,
      ]}
    >
      <Text style={buttonStyles.primaryText}>{children}</Text>
    </TouchableOpacity>
  );
}

export function DestructiveButton({
  children, onPress, style,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[buttonStyles.destructive, { backgroundColor: colors.fill2 }, style]}
    >
      <Text style={[buttonStyles.destructiveText, { color: colors.danger }]}>{children}</Text>
    </TouchableOpacity>
  );
}

const buttonStyles = StyleSheet.create({
  primary: {
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  primaryText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: -0.4 },
  destructive: { paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  destructiveText: { fontSize: 17, fontWeight: '500', letterSpacing: -0.4 },
});

// ── Progress ring ─────────────────────────────────────────────────────────────

export function ProgressRing({
  percent, size = 56, strokeWidth = 4,
}: { percent: number; size?: number; strokeWidth?: number }) {
  const { colors } = useTheme();
  const radius = size / 2 - strokeWidth / 2;
  // On web we can emit a real SVG. On native we fall back to a numeric label
  // inside a filled circle — same data, no extra dep.
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{
        width: size, height: size, borderRadius: size / 2,
        borderWidth: strokeWidth, borderColor: colors.fill2,
        position: 'absolute',
      }} />
      <View style={{
        width: size, height: size, borderRadius: size / 2,
        borderWidth: strokeWidth, borderColor: colors.brand,
        borderLeftColor: percent < 75 ? colors.fill2 : colors.brand,
        borderBottomColor: percent < 50 ? colors.fill2 : colors.brand,
        borderRightColor: percent < 25 ? colors.fill2 : colors.brand,
        transform: [{ rotate: '-45deg' }],
        position: 'absolute',
      }} />
      <Text style={{
        color: colors.label,
        fontSize: size >= 56 ? 13 : 11,
        fontWeight: '800',
        letterSpacing: -0.3,
      }}>{percent}%</Text>
    </View>
  );
}

// ── Icon-wrap (colored rounded square holding a glyph) ───────────────────────

export function IconWrap({
  color, size = 32, children,
}: { color: string; size?: number; children: ReactNode }) {
  return (
    <View style={{
      width: size,
      height: size,
      borderRadius: size <= 32 ? 8 : 11,
      backgroundColor: color,
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {typeof children === 'string' ? (
        <Text style={{ color: '#fff', fontSize: size >= 40 ? 20 : 16 }}>{children}</Text>
      ) : children}
    </View>
  );
}

// ── Section container — groups SectionHeader + ListGroup with vertical gap ──
//
// Kept as a helper to avoid repeating <View style={{ marginBottom: 24 }}/>
// throughout every screen.

export function Section({
  header, children, style,
}: {
  header?: string;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ marginBottom: 24 }, style]}>
      {header ? <SectionHeader>{header}</SectionHeader> : null}
      {children}
    </View>
  );
}
