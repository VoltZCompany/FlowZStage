import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Switch, Alert, KeyboardAvoidingView, Platform, Share, Linking,
  LayoutAnimation, UIManager,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const sectionAnim = () => LayoutAnimation.configureNext({
  duration: 280,
  create: { type: 'easeInEaseOut', property: 'opacity' },
  update: { type: 'spring', springDamping: 0.9 },
  delete: { type: 'easeInEaseOut', property: 'opacity' },
});
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spacing, FontSize, Radius, Shadow } from '../constants/theme';
import {
  CreateShowInput, VAN_COLORS, Show,
  FlightLocator, FlightLeg, HotelRoom, RoomType, AIRLINES,
} from '../types/show';
import { createShow, loadShows, updateShow } from '../store/showStore';
import { loadTeamMembers } from '../store/teamStore';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../context/ThemeContext';
import { Icon } from '../components/icons';
import PhoneInput from '../components/PhoneInput';
import AppDatePicker from '../components/AppDatePicker';
import CityPicker from '../components/CityPicker';
import AirportPicker from '../components/AirportPicker';
import ShowPicker from '../components/ShowPicker';
import {
  IOSNavBar, IOSNavButton,
} from '../components/ios';

type Nav = NativeStackNavigationProp<RootStackParamList, 'CreateShow'>;
type Route = RouteProp<RootStackParamList, 'CreateShow'>;

function calcStageReady(date: Date): Date {
  return new Date(date.getTime() - 90 * 60 * 1000);
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={fieldS.wrap}>
      <Text style={[fieldS.label, { color: colors.textSecondary }]}>{label}</Text>
      {hint && <Text style={[fieldS.hint, { color: colors.textMuted }]}>{hint}</Text>}
      {children}
    </View>
  );
}
const fieldS = StyleSheet.create({
  wrap: { marginBottom: 20 },
  label: { fontSize: 10, fontWeight: '800', marginBottom: 8, letterSpacing: 1.2, textTransform: 'uppercase' as any },
  hint: { fontSize: 11, marginBottom: 4 },
});

type IconName = 'music' | 'airplane' | 'bed' | 'van' | 'pin' | 'tag';
function SectionHeader({
  iconName, iconColor, title, subtitle, enabled, onToggle, trailing,
}: {
  iconName: IconName;
  iconColor: string;
  title: string;
  subtitle?: string;
  enabled?: boolean;
  onToggle?: (v: boolean) => void;
  trailing?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const subtitleColor = enabled !== false ? iconColor + 'BB' : colors.textMuted;
  return (
    <View style={shS.row}>
      <View style={[shS.iconTile, { backgroundColor: iconColor }, Platform.OS === 'web' && ({ boxShadow: `0 3px 14px ${iconColor}60` } as any)]}>
        <Icon name={iconName as any} color="#fff" size={18} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[shS.title, { color: colors.text }]} numberOfLines={1}>{title}</Text>
        {subtitle ? (
          <Text style={[shS.subtitle, { color: subtitleColor }]} numberOfLines={1}>{subtitle}</Text>
        ) : null}
      </View>
      {trailing}
      {onToggle ? (
        <Switch value={!!enabled} onValueChange={onToggle} trackColor={{ true: iconColor }} accessibilityLabel={`${title}: ${enabled ? 'ativado' : 'desativado'}`} />
      ) : null}
    </View>
  );
}
const shS = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  iconTile: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '800', letterSpacing: -0.4 },
  subtitle: { fontSize: 12, marginTop: 2, fontWeight: '500' },
});

function GroupLabel({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20, marginBottom: 12 }}>
      <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: colors.textMuted }} />
      <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1.6, color: colors.textMuted }}>
        {label}
      </Text>
    </View>
  );
}

function genId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function flightSubtract(hhmm: string, mins: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  let total = h * 60 + m - mins;
  total = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** Diferença entre dois Date (hora:min) em "1h30", "45min", etc. */
function formatLeadTime(departure: Date, show: Date): string {
  const dep = departure.getHours() * 60 + departure.getMinutes();
  const shw = show.getHours() * 60 + show.getMinutes();
  let diff = shw - dep;
  if (diff <= 0) diff += 24 * 60;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  if (h === 0) return `${m} min antes`;
  if (m === 0) return `${h}h antes`;
  return `${h}h${String(m).padStart(2, '0')} antes`;
}

function timeStrToDate(hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

const isPresetAirline = (v?: string): boolean =>
  v === 'AZUL' || v === 'GOL' || v === 'LATAM';

function openWazeAddress(address: string) {
  const url = `https://waze.com/ul?q=${encodeURIComponent(address.trim())}&navigate=yes`;
  if (Platform.OS === 'web') { window.open(url, '_blank', 'noopener'); }
  else { Linking.openURL(url); }
}

function copyAddress(address: string) {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(address).catch(() => {});
  } else if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const ta = document.createElement('textarea');
    ta.value = address;
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.focus(); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
  }
}

const ROOM_LABELS: Record<RoomType, string> = {
  single: 'Single',
  double: 'Duplo',
  triple: 'Triplo',
};




export default function CreateShowScreen({ navigation, route }: { navigation: Nav; route: Route }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const editId = route.params?.editId;
  const scrollTo = (route.params as any)?.scrollTo as string | undefined;
  const scrollViewRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<Record<string, number>>({});

  // "Info incompleta (a definir)" — quando ligado, permite salvar mesmo com
  // campos obrigatórios em branco (contratante, venue, data, horário). Os
  // campos vazios são salvos como "A definir" pra a UI deixar claro o que
  // ainda falta. Útil pra anotar o show rápido e voltar depois.
  const [allowIncomplete, setAllowIncomplete] = useState(false);
  const [name, setName] = useState('');
  const [contratante, setContratante] = useState('');
  const [contratantePhone, setContratantePhone] = useState('');
  const [showDate, setShowDate] = useState<Date | null>(null);
  const [showTime, setShowTime] = useState<Date | null>(null);
  const [venue, setVenue] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');

  // Airplane
  const [hasAirplane, setHasAirplane] = useState(false);
  const [airportName, setAirportName] = useState('');
  const [airportDestination, setAirportDestination] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [flightDate, setFlightDate] = useState<Date | null>(null);
  const [flightTime, setFlightTime] = useState<Date | null>(null);
  const [flightArrivalDate, setFlightArrivalDate] = useState<Date | null>(null);
  const [flightArrivalTime, setFlightArrivalTime] = useState<Date | null>(null);
  const [flightLocators, setFlightLocators] = useState<FlightLocator[]>([]);

  // Escala
  const [hasEscala, setHasEscala] = useState(false);
  const [flightLegs, setFlightLegs] = useState<FlightLeg[]>([]);
  const [returnFlightFromShowId, setReturnFlightFromShowId] = useState<string | undefined>(undefined);
  const [linkedHotelShowId, setLinkedHotelShowId] = useState<string | undefined>(undefined);
  const [linkedVanShowId, setLinkedVanShowId] = useState<string | undefined>(undefined);
  const [allShows, setAllShows] = useState<Show[]>([]);
  const [expandedLegId, setExpandedLegId] = useState<string | null>(null);
  const [legLocSearch, setLegLocSearch] = useState<Record<string, string>>({});

  // Hotel
  const [teamMembers, setTeamMembers] = useState<string[]>([]);

  const [hasHotel, setHasHotel] = useState(false);
  const [hotelName, setHotelName] = useState('');
  const [hotelAddress, setHotelAddress] = useState('');
  const [hotelMalaCuia, setHotelMalaCuia] = useState(false);
  const [hotelRooms, setHotelRooms] = useState<HotelRoom[]>([]);
  const [roomSearch, setRoomSearch] = useState<Record<string, string>>({});
  const [expandedRoomId, setExpandedRoomId] = useState<string | null>(null);

  // Van
  const [hasVan, setHasVan] = useState(false);
  const [vanDriverName, setVanDriverName] = useState('');
  const [vanDriverPhone, setVanDriverPhone] = useState('');
  const [vanColor, setVanColor] = useState('');
  const [vanPlate, setVanPlate] = useState('');

  // Distances (numeric, km appended on save)
  const [distanceAirportHotel, setDistanceAirportHotel] = useState('');
  const [distanceHotelShow, setDistanceHotelShow] = useState('');
  const [distanceAirportShow, setDistanceAirportShow] = useState('');
  const [departureTimeMeetingShow, setDepartureTimeMeetingShow] = useState<Date | null>(null);
  const [departureTimeHotelShow, setDepartureTimeHotelShow] = useState<Date | null>(null);
  const [departureTimeHotelAirport, setDepartureTimeHotelAirport] = useState<Date | null>(null);

  // Artist
  const [hasCamarim, setHasCamarim] = useState<boolean | undefined>(undefined);
  const [showDurationMinutes, setShowDurationMinutes] = useState('');
  const [soundcheckTime, setSoundcheckTime] = useState<Date | null>(null);
  const [stageSetup, setStageSetup] = useState<Show['stageSetup']>(undefined);
  const [outfit, setOutfit] = useState('');
  const [agradecimentos, setAgradecimentos] = useState('');
  const [homeArrivalTime, setHomeArrivalTime] = useState<Date | null>(null);

  // Preserve existing materials / reminders on edit so they don't get wiped
  const [existingMaterials, setExistingMaterials] = useState<Show['materials']>([]);
  const [existingReminders, setExistingReminders] = useState<Show['reminders']>([]);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTeamMembers().then((members) => setTeamMembers(members.map((m) => m.name)));
    loadShows().then(setAllShows);
  }, []);

  useEffect(() => {
    if (!scrollTo) return;
    const timer = setTimeout(() => {
      const y = sectionOffsets.current[scrollTo];
      if (y != null) scrollViewRef.current?.scrollTo({ y, animated: true });
    }, 400);
    return () => clearTimeout(timer);
  }, [scrollTo]);

  useEffect(() => {
    if (!editId) return;
    loadShows().then((shows) => {
      const s = shows.find((x) => x.id === editId);
      if (!s) return;
      setName(s.name);
      setContratante(s.contratante);
      setContratantePhone(s.contratantePhone ?? '');
      if (s.date) setShowDate(new Date(s.date + 'T12:00:00'));
      if (s.time) setShowTime(timeStrToDate(s.time));
      setVenue(s.venue);
      setVenueAddress(s.venueAddress ?? '');
      setCity(s.city ?? '');
      setNotes(s.notes ?? '');
      setHasAirplane(s.hasAirplane);
      setHasEscala(s.hasEscala ?? false);
      setFlightLegs(s.flightLegs ?? []);
      setReturnFlightFromShowId(s.returnFlightFromShowId);
      setLinkedHotelShowId(s.linkedHotelShowId);
      setLinkedVanShowId(s.linkedVanShowId);
      setAirportName(s.airportName ?? '');
      setAirportDestination(s.airportDestination ?? '');
      setFlightNumber(s.flightNumber ?? '');
      if (s.flightDate) setFlightDate(new Date(s.flightDate + 'T12:00:00'));
      if (s.flightTime) setFlightTime(timeStrToDate(s.flightTime));
      if (s.flightArrivalDate) setFlightArrivalDate(new Date(s.flightArrivalDate + 'T12:00:00'));
      if (s.flightArrivalTime) setFlightArrivalTime(timeStrToDate(s.flightArrivalTime));
      setFlightLocators(s.flightLocators ?? []);
      setHasHotel(s.hasHotel);
      setHotelName(s.hotelName ?? '');
      setHotelAddress(s.hotelAddress ?? '');
      setHotelMalaCuia(s.hotelMalaCuia ?? false);
      setHotelRooms(s.hotelRooms ?? []);
      setHasVan(s.hasVan);
      setVanDriverName(s.vanDriverName ?? '');
      setVanDriverPhone(s.vanDriverPhone ?? '');
      setVanColor(s.vanColor ?? '');
      setVanPlate(s.vanPlate ?? '');
      setDistanceAirportHotel(s.distanceAirportHotel ?? '');
      setDistanceHotelShow(s.distanceHotelShow ?? '');
      setDistanceAirportShow(s.distanceAirportShow ?? '');
      if (s.departureTimeMeetingShow) setDepartureTimeMeetingShow(timeStrToDate(s.departureTimeMeetingShow));
      if (s.departureTimeHotelShow) setDepartureTimeHotelShow(timeStrToDate(s.departureTimeHotelShow));
      if (s.departureTimeHotelAirport) setDepartureTimeHotelAirport(timeStrToDate(s.departureTimeHotelAirport));
      setExistingMaterials(s.materials ?? []);
      setExistingReminders(s.reminders ?? []);
      setHasCamarim(s.hasCamarim);
      setShowDurationMinutes(s.showDurationMinutes != null ? String(s.showDurationMinutes) : '');
      if (s.soundcheckTime) setSoundcheckTime(timeStrToDate(s.soundcheckTime));
      setStageSetup(s.stageSetup);
      setOutfit(s.outfit ?? '');
      setAgradecimentos(s.agradecimentos ?? '');
      if (s.homeArrivalTime) setHomeArrivalTime(timeStrToDate(s.homeArrivalTime));
    });
  }, [editId]);

  const stageReadyTime = showTime ? calcStageReady(showTime) : null;
  // Antes forçava CAIXA ALTA em tudo; o usuário preferiu manter a digitação
  // natural. Mantém a função pra não ter que mexer em todos os onChangeText
  // (vira identidade) — autoCapitalize abaixo passa a ser "sentences"/"words".
  const up = (v: string) => v;

  // ── Localizador helpers ──────────────────────────────────────────────
  const addLocalizador = () => {
    setFlightLocators((prev) => [...prev, { id: genId('loc'), code: '', passengers: [] }]);
  };

  const removeLocalizador = (id: string) => {
    setFlightLocators((prev) => prev.filter((l) => l.id !== id));
  };

  const updateLocalizadorCode = (id: string, code: string) => {
    setFlightLocators((prev) => prev.map((l) => (l.id === id ? { ...l, code } : l)));
  };

  const addPassengerToLocalizador = (locId: string) => {
    setFlightLocators((prev) =>
      prev.map((l) => (l.id === locId ? { ...l, passengers: [...l.passengers, ''] } : l)),
    );
  };

  const updateLocalizadorPassenger = (locId: string, idx: number, name: string) => {
    setFlightLocators((prev) =>
      prev.map((l) => {
        if (l.id !== locId) return l;
        const passengers = [...l.passengers];
        passengers[idx] = name;
        return { ...l, passengers };
      }),
    );
  };

  const removeLocalizadorPassenger = (locId: string, idx: number) => {
    setFlightLocators((prev) =>
      prev.map((l) => {
        if (l.id !== locId) return l;
        return { ...l, passengers: l.passengers.filter((_, i) => i !== idx) };
      }),
    );
  };

  const updateLocalizadorField = (id: string, updates: Partial<FlightLocator>) => {
    setFlightLocators((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  };

  // ── Flight leg helpers (escala) ──────────────────────────────────────
  const makeLeg = (origin = '', destination = ''): FlightLeg => ({
    id: genId('leg'), origin, destination, localizadores: [{ id: genId('loc'), code: '', passengers: [] }],
  });

  const addLeg = () => {
    setFlightLegs((prev) => {
      const lastDest = prev.length > 0 ? prev[prev.length - 1].destination : '';
      return [...prev, makeLeg(lastDest, '')];
    });
  };

  const removeLeg = (id: string) => setFlightLegs((prev) => prev.filter((l) => l.id !== id));

  const updateLeg = (id: string, updates: Partial<FlightLeg>) =>
    setFlightLegs((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));

  const addLegLocalizador = (legId: string) =>
    setFlightLegs((prev) => prev.map((l) =>
      l.id !== legId ? l : { ...l, localizadores: [...l.localizadores, { id: genId('loc'), code: '', passengers: [] }] },
    ));

  const removeLegLocalizador = (legId: string, locId: string) =>
    setFlightLegs((prev) => prev.map((l) =>
      l.id !== legId ? l : { ...l, localizadores: l.localizadores.filter((lc) => lc.id !== locId) },
    ));

  const updateLegLocalizador = (legId: string, locId: string, updates: Partial<FlightLocator>) =>
    setFlightLegs((prev) => prev.map((l) =>
      l.id !== legId ? l : { ...l, localizadores: l.localizadores.map((lc) => lc.id !== locId ? lc : { ...lc, ...updates }) },
    ));

  const addLegLocPassenger = (legId: string, locId: string) =>
    setFlightLegs((prev) => prev.map((l) =>
      l.id !== legId ? l : { ...l, localizadores: l.localizadores.map((lc) =>
        lc.id !== locId ? lc : { ...lc, passengers: [...lc.passengers, ''] },
      ) },
    ));

  const removeLegLocPassenger = (legId: string, locId: string, idx: number) =>
    setFlightLegs((prev) => prev.map((l) =>
      l.id !== legId ? l : { ...l, localizadores: l.localizadores.map((lc) =>
        lc.id !== locId ? lc : { ...lc, passengers: lc.passengers.filter((_, i) => i !== idx) },
      ) },
    ));

  const updateLegLocPassenger = (legId: string, locId: string, idx: number, name: string) =>
    setFlightLegs((prev) => prev.map((l) =>
      l.id !== legId ? l : { ...l, localizadores: l.localizadores.map((lc) => {
        if (lc.id !== locId) return lc;
        const passengers = [...lc.passengers];
        passengers[idx] = name;
        return { ...lc, passengers };
      }) },
    ));

  // Calcula tempo de conexão entre chegada de um trecho e partida do próximo.
  // Suporta múltiplos dias (ex: "1d 02h30").
  function calcLayover(arrDate: string | undefined, arrTime: string, depDate: string | undefined, depTime: string): string | null {
    if (!arrTime || !depTime) return null;
    const [ah, am] = arrTime.split(':').map(Number);
    const [dh, dm] = depTime.split(':').map(Number);
    let diff = (dh * 60 + dm) - (ah * 60 + am);
    if (arrDate && depDate) {
      const arrD = new Date(arrDate + 'T00:00:00');
      const depD = new Date(depDate + 'T00:00:00');
      const dayDiff = Math.round((depD.getTime() - arrD.getTime()) / 86400000);
      diff += dayDiff * 24 * 60;
    } else if (diff <= 0) {
      diff += 24 * 60;
    }
    if (diff <= 0) return null;
    const days = Math.floor(diff / (24 * 60));
    const rem = diff % (24 * 60);
    const h = Math.floor(rem / 60);
    const m = rem % 60;
    const hStr = `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`;
    return days > 0 ? `${days}d ${hStr}` : hStr;
  }

  // ── Hotel room helpers ───────────────────────────────────────────────
  const addRoom = () => {
    setHotelRooms((prev) => [...prev, { id: genId('room'), type: 'single', roomNumber: '', passengers: [] }]);
  };

  const removeRoom = (id: string) => {
    setHotelRooms((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRoomType = (id: string, type: RoomType) => {
    setHotelRooms((prev) => prev.map((r) => (r.id === id ? { ...r, type } : r)));
  };

  const addRoomMember = (roomId: string, name: string) => {
    setHotelRooms((prev) => prev.map((r) => {
      if (r.id !== roomId || r.passengers.includes(name)) return r;
      return { ...r, passengers: [...r.passengers, name] };
    }));
    setRoomSearch((prev) => ({ ...prev, [roomId]: '' }));
  };

  const removeRoomMember = (roomId: string, name: string) => {
    setHotelRooms((prev) => prev.map((r) => {
      if (r.id !== roomId) return r;
      return { ...r, passengers: r.passengers.filter((p) => p !== name) };
    }));
  };

  const updateRoomNumber = (id: string, roomNumber: string) => {
    setHotelRooms((prev) => prev.map((r) => (r.id === id ? { ...r, roomNumber } : r)));
  };

  const formatTimeFromDate = (d: Date) =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  const formatKm = (val: string): string | undefined =>
    val.trim() ? `${val.trim()} km` : undefined;

  const handleSave = async () => {
    // Só nome é obrigatório. Tudo o mais salva com placeholder "A definir"
    // se vazio — o usuário marca cada horário como TBD via pílula no picker.
    if (!name.trim()) return Alert.alert('Atenção', 'Nome do show é obrigatório.');

    setSaving(true);
    try {
      // Sentinel: campos vazios viram "" (date/time) ou "A definir" (texto).
      // ShowDetail detecta "" e mostra "A definir" no hero. parseISO usa
      // fallback pra não quebrar.
      const TBD = 'A definir';

      const input: CreateShowInput = {
        name: name.trim(),
        contratante: contratante.trim() || TBD,
        contratantePhone: contratantePhone || undefined,
        date: showDate ? showDate.toISOString().split('T')[0] : '',
        time: showTime ? formatTimeFromDate(showTime) : '',
        stageReadyTime: stageReadyTime ? formatTimeFromDate(stageReadyTime) : undefined,
        venue: venue.trim() || TBD,
        venueAddress: venueAddress.trim() || undefined,
        city: city.trim() || undefined,
        notes: notes.trim() || undefined,
        hasAirplane,
        hasEscala: hasAirplane ? hasEscala : undefined,
        airportName: hasAirplane && !hasEscala ? airportName.trim() || undefined : undefined,
        airportDestination: hasAirplane && !hasEscala ? airportDestination.trim() || undefined : undefined,
        flightNumber: hasAirplane && !hasEscala ? flightNumber.trim() || undefined : undefined,
        flightDate: hasAirplane && !hasEscala && flightDate ? flightDate.toISOString().split('T')[0] : undefined,
        flightTime: hasAirplane && !hasEscala && flightTime ? formatTimeFromDate(flightTime) : undefined,
        flightArrivalDate: hasAirplane && !hasEscala && flightArrivalDate ? flightArrivalDate.toISOString().split('T')[0] : undefined,
        flightArrivalTime: hasAirplane && !hasEscala && flightArrivalTime ? formatTimeFromDate(flightArrivalTime) : undefined,
        flightLocators: hasAirplane && !hasEscala
          ? flightLocators
              .filter((l) => l.code.trim())
              .map((l) => ({
                ...l,
                code: l.code.trim().toUpperCase(),
                passengers: l.passengers.map((p) => p.trim()).filter(Boolean),
                airline: l.isNewFlight ? (l.airline?.trim() || undefined) : undefined,
                flightNumberLocator: l.isNewFlight ? (l.flightNumberLocator?.trim().toUpperCase() || undefined) : undefined,
                origin: l.isNewFlight ? (l.origin || undefined) : undefined,
                destination: l.isNewFlight ? (l.destination || undefined) : undefined,
                flightDate: l.isNewFlight ? (l.flightDate || undefined) : undefined,
                flightTimeLocator: l.isNewFlight ? (l.flightTimeLocator || undefined) : undefined,
              }))
          : undefined,
        flightLegs: hasAirplane && hasEscala
          ? flightLegs.map((leg) => ({
              ...leg,
              localizadores: leg.localizadores
                .filter((lc) => lc.code.trim())
                .map((lc) => ({
                  ...lc,
                  code: lc.code.trim().toUpperCase(),
                  passengers: lc.passengers.map((p) => p.trim()).filter(Boolean),
                })),
            }))
          : undefined,
        hasHotel,
        hotelName: hasHotel ? hotelName.trim() || undefined : undefined,
        hotelAddress: hasHotel ? hotelAddress.trim() || undefined : undefined,
        hotelMalaCuia: hasHotel ? hotelMalaCuia : undefined,
        hotelRooms: hasHotel
          ? hotelRooms.map((r) => ({
              ...r,
              roomNumber: r.roomNumber?.trim() || undefined,
              passengers: r.passengers.map((p) => p.trim()),
            }))
          : undefined,
        hasVan,
        vanDriverName: hasVan ? vanDriverName.trim() || undefined : undefined,
        vanDriverPhone: hasVan ? vanDriverPhone || undefined : undefined,
        vanColor: hasVan ? vanColor || undefined : undefined,
        vanPlate: hasVan ? vanPlate.trim() || undefined : undefined,
        distanceAirportHotel: hasAirplane && hasHotel ? formatKm(distanceAirportHotel) : undefined,
        distanceHotelShow: hasHotel ? formatKm(distanceHotelShow) : undefined,
        distanceAirportShow: hasAirplane && !hasHotel ? formatKm(distanceAirportShow) : undefined,
        distanceMeetingShow: undefined,
        departureTimeMeetingShow: departureTimeMeetingShow ? formatTimeFromDate(departureTimeMeetingShow) : undefined,
        departureTimeHotelShow: hasHotel && departureTimeHotelShow ? formatTimeFromDate(departureTimeHotelShow) : undefined,
        departureTimeHotelAirport: hasHotel && hasAirplane && departureTimeHotelAirport ? formatTimeFromDate(departureTimeHotelAirport) : undefined,
        reminders: existingReminders ?? [],
        materials: existingMaterials ?? [],
        arrivalBufferMinutes: 0,
        returnFlightFromShowId,
        linkedHotelShowId,
        linkedVanShowId,
        hasCamarim: hasCamarim,
        showDurationMinutes: showDurationMinutes.trim() ? (n => isNaN(n) || n <= 0 ? undefined : n)(parseInt(showDurationMinutes, 10)) : undefined,
        soundcheckTime: soundcheckTime ? formatTimeFromDate(soundcheckTime) : undefined,
        stageSetup: stageSetup || undefined,
        outfit: outfit.trim() || undefined,
        agradecimentos: agradecimentos.trim() || undefined,
        homeArrivalTime: homeArrivalTime ? formatTimeFromDate(homeArrivalTime) : undefined,
      };

      if (editId) {
        const updated = await updateShow(editId, input);
        if (!updated) throw new Error('Show não encontrado para salvar.');
        navigation.goBack();
      } else {
        const created = await createShow(input);
        navigation.replace('ShowDetail', { showId: created.id });
      }
    } catch (err: any) {
      console.error('[CreateShow] save failed:', err);
      const msg = err?.message || err?.error?.message || String(err) || 'Erro desconhecido';
      Alert.alert('Erro ao salvar', msg);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = [s.input, { borderBottomColor: colors.border, color: colors.text }];
  const sc = (accent: string, on?: boolean) => [s.section, { backgroundColor: colors.surface, borderLeftWidth: 3, borderLeftColor: on === false ? accent + '44' : accent }];
  const subCardStyle = [s.subCard, { backgroundColor: colors.background, borderColor: colors.border }];

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <IOSNavBar
        left={<IOSNavButton onPress={() => navigation.goBack()}>Cancelar</IOSNavButton>}
        right={<IOSNavButton bold disabled={saving} onPress={handleSave}>{editId ? 'Salvar' : 'Adicionar'}</IOSNavButton>}
        compactTitle={editId ? 'Editar Show' : 'Novo Show'}
      />
      <ScrollView ref={scrollViewRef} style={[s.container, { backgroundColor: colors.background }]} contentContainerStyle={[s.content, { paddingBottom: 40 + insets.bottom }]} keyboardShouldPersistTaps="handled">
        {/* ── Jump bar ── */}
        <View style={s.jumpBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.jumpBarContent} nestedScrollEnabled>
            {([
              { key: 'show',    label: 'SHOW',    emoji: '🎵', color: '#FF453A' },
              { key: 'voo',     label: 'VOO',     emoji: '✈',  color: '#0A84FF', on: hasAirplane },
              { key: 'hotel',   label: 'HOTEL',   emoji: '🛏',  color: '#30D158', on: hasHotel },
              { key: 'van',     label: 'VAN',     emoji: '🚐', color: '#BF5AF2', on: hasVan },
              { key: 'meeting', label: 'SAÍDA',   emoji: '📍', color: '#FF9F0A' },
              { key: 'artist',  label: 'ARTISTA', emoji: '🎤', color: '#FF9F0A' },
              { key: 'notes',   label: 'NOTAS',   emoji: '📝', color: '#8E8E93' },
            ] as { key: string; label: string; emoji: string; color: string; on?: boolean }[]).map(({ key, label, emoji, color, on }) => {
              const dim = on === false;
              return (
                <TouchableOpacity
                  key={key}
                  accessibilityRole="button"
                  style={[s.jumpPill, { backgroundColor: color + (dim ? '12' : '1A'), borderColor: color + (dim ? '38' : '55') }]}
                  onPress={() => { const y = sectionOffsets.current[key]; if (y != null) scrollViewRef.current?.scrollTo({ y: y - 8, animated: true }); }}
                  activeOpacity={0.7}
                >
                  <Text style={[s.jumpPillText, { color: dim ? color + '66' : color }]}>{emoji} {label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Show Info ── */}
        <View style={sc('#FF453A')} onLayout={(e) => { sectionOffsets.current.show = e.nativeEvent.layout.y; }}>
          <SectionHeader
            iconName="music"
            iconColor="#FF453A"
            title="Show"
            subtitle={name.trim() ? `${name.trim()}${city.trim() ? ` · ${city.trim()}` : ''}` : 'Detalhes principais'}
            trailing={
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={allowIncomplete ? 'Modo "a definir" ativado' : 'Ativar modo "a definir"'}
                style={[s.tbdChip, { borderColor: allowIncomplete ? colors.primary : colors.border, backgroundColor: allowIncomplete ? colors.primaryLight : 'transparent' }]}
                onPress={() => setAllowIncomplete((v) => !v)}
                activeOpacity={0.7}
              >
                <Icon name={allowIncomplete ? 'check' : 'plus'} color={allowIncomplete ? colors.primary : colors.textSecondary} size={12} />
                <Text style={[s.tbdChipText, { color: allowIncomplete ? colors.primary : colors.textSecondary }]}>A definir</Text>
              </TouchableOpacity>
            }
          />

          <Field label="Nome do show">
            <TextInput style={inputStyle} placeholder="Ex: Festival de Verão, Show no Beco..." placeholderTextColor={colors.textMuted} value={name} onChangeText={(v) => setName(up(v))} autoFocus autoCapitalize="sentences" />
          </Field>

          <GroupLabel label="CONTRATANTE" />
          <Field label="Nome">
            <TextInput style={inputStyle} placeholder="Nome da pessoa ou empresa" placeholderTextColor={colors.textMuted} value={contratante} onChangeText={(v) => setContratante(up(v))} autoCapitalize="sentences" />
          </Field>
          <View style={{ marginBottom: Spacing.md }}>
            <PhoneInput label="Telefone" value={contratantePhone} onChangeText={setContratantePhone} />
          </View>

          <GroupLabel label="DATA & HORÁRIO" />
          <View style={s.dateTimeRow}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <AppDatePicker label="Data" value={showDate} onChange={setShowDate} mode="date" />
            </View>
            <View style={{ width: 136 }}>
              <AppDatePicker
                label="Hora"
                value={showTime}
                onChange={setShowTime}
                mode="time"
                clearable
                clearLabel="Limpar"
                emptyText="A definir"
              />
            </View>
          </View>
          {stageReadyTime && (
            <View style={[s.infoBanner, { backgroundColor: colors.primaryLight }]}>
              <Text style={[s.infoBannerText, { color: colors.text }]}>
                Palco limpo às <Text style={{ fontWeight: '800', color: colors.primary }}>{formatTimeFromDate(stageReadyTime)}</Text>{'  '}<Text style={{ color: colors.textSecondary, fontWeight: '500' }}>(1h30 antes)</Text>
              </Text>
            </View>
          )}

          <GroupLabel label="LOCAL" />
          <Field label="Local / Palco">
            <TextInput style={inputStyle} placeholder="Nome do local" placeholderTextColor={colors.textMuted} value={venue} onChangeText={(v) => setVenue(up(v))} autoCapitalize="sentences" />
          </Field>
          <Field label="Endereço">
            <TextInput style={inputStyle} placeholder="Rua, número, bairro..." placeholderTextColor={colors.textMuted} value={venueAddress} onChangeText={(v) => setVenueAddress(up(v))} autoCapitalize="sentences" />
            {venueAddress.trim().length > 4 && (
              <View style={s.addrBtnRow}>
                <TouchableOpacity style={[s.addrBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]} onPress={() => copyAddress(venueAddress)}>
                  <Text style={[s.addrBtnText, { color: colors.primary }]}>Copiar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.addrBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => openWazeAddress(venueAddress)}>
                  <Text style={[s.addrBtnText, { color: colors.text }]}>Waze</Text>
                </TouchableOpacity>
              </View>
            )}
          </Field>
          <CityPicker label="Cidade" value={city} onChange={(c) => setCity(c)} />
        </View>

        {/* ── Airplane ── */}
        <View style={sc('#0A84FF', hasAirplane)} onLayout={(e) => { sectionOffsets.current.voo = e.nativeEvent.layout.y; }}>
          <SectionHeader
            iconName="airplane"
            iconColor="#0A84FF"
            title="Voo"
            subtitle={!hasAirplane ? 'Sem voo' : (airportName || flightNumber ? `${airportName ?? ''}${airportName && flightNumber ? ' · ' : ''}${flightNumber ?? ''}` : 'Adicionar detalhes')}
            enabled={hasAirplane}
            onToggle={(val) => {
              sectionAnim();
              setHasAirplane(val);
              if (val && flightLocators.length === 0) {
                setFlightLocators([{ id: genId('loc'), code: '', passengers: [] }]);
              }
            }}
          />
          {hasAirplane && (
            <>
              {/* Direto / Com escala */}
              <View style={[s.flightToggleRow, { marginBottom: Spacing.md }]}>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={{ selected: !hasEscala }}
                  style={[s.flightToggleBtn, { borderColor: !hasEscala ? colors.primary : colors.border }, !hasEscala && { backgroundColor: colors.primaryLight }]}
                  onPress={() => { setHasEscala(false); setFlightLegs([]); }}
                >
                  <Text style={[s.flightToggleBtnText, { color: !hasEscala ? colors.primary : colors.textSecondary }]}>DIRETO</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={{ selected: hasEscala }}
                  style={[s.flightToggleBtn, { borderColor: hasEscala ? colors.primary : colors.border }, hasEscala && { backgroundColor: colors.primaryLight }]}
                  onPress={() => {
                    setHasEscala(true);
                    if (flightLegs.length === 0) setFlightLegs([makeLeg(), makeLeg()]);
                  }}
                >
                  <Text style={[s.flightToggleBtnText, { color: hasEscala ? colors.primary : colors.textSecondary }]}>COM ESCALA</Text>
                </TouchableOpacity>
              </View>

              {/* ── DIRETO ── */}
              {!hasEscala && (
                <>
                  <Field label="Nº do voo">
                    <TextInput style={inputStyle} placeholder="LA3045" placeholderTextColor={colors.textMuted} value={flightNumber} onChangeText={(v) => setFlightNumber(up(v))} autoCapitalize="sentences" />
                  </Field>

                  <Text style={[s.legSubHeader, { color: colors.textSecondary, marginTop: Spacing.sm }]}>PARTIDA</Text>
                  <AirportPicker label="Aeroporto de origem" value={airportName} onChange={setAirportName} placeholder="GRU, SDU, BSB..." />
                  <View style={s.legDateRow}>
                    <View style={{ flex: 1 }}>
                      <AppDatePicker label="Data" value={flightDate} onChange={setFlightDate} mode="date" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppDatePicker label="Horário" value={flightTime} onChange={setFlightTime} mode="time" />
                    </View>
                  </View>
                  {flightTime && (
                    <View style={[s.infoBanner, { backgroundColor: colors.primaryLight, borderLeftColor: colors.primary }]}>
                      <Text style={[s.infoBannerText, { color: colors.text }]}>
                        Embarque <Text style={{ fontWeight: '800', color: colors.primary }}>{flightSubtract(formatTimeFromDate(flightTime), 45)}</Text>{'   ·   '}Despacho <Text style={{ fontWeight: '800', color: colors.primary }}>{flightSubtract(formatTimeFromDate(flightTime), 120)}</Text>
                      </Text>
                    </View>
                  )}

                  <Text style={[s.legSubHeader, { color: colors.textSecondary, marginTop: Spacing.sm }]}>CHEGADA</Text>
                  <AirportPicker label="Aeroporto de destino" value={airportDestination} onChange={setAirportDestination} placeholder="GRU, SDU, BSB..." />
                  <View style={s.legDateRow}>
                    <View style={{ flex: 1 }}>
                      <AppDatePicker label="Data de chegada" value={flightArrivalDate} onChange={setFlightArrivalDate} mode="date" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppDatePicker label="Horário de chegada" value={flightArrivalTime} onChange={setFlightArrivalTime} mode="time" />
                    </View>
                  </View>

                  {flightLocators.map((loc, locIdx) => (
                    <View key={loc.id} style={subCardStyle}>
                      <View style={s.subCardHeader}>
                        <Text style={[s.subCardTitle, { color: colors.text }]}>Localizador {locIdx + 1}</Text>
                        <TouchableOpacity onPress={() => removeLocalizador(loc.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <Text style={[s.removeText, { color: colors.danger }]}>✕</Text>
                        </TouchableOpacity>
                      </View>

                      <View style={[s.flightToggleRow, { marginBottom: Spacing.sm }]}>
                        <TouchableOpacity
                          style={[s.flightToggleBtn, { borderColor: !loc.isNewFlight ? colors.primary : colors.border }, !loc.isNewFlight && { backgroundColor: colors.primaryLight }]}
                          onPress={() => updateLocalizadorField(loc.id, { isNewFlight: false })}
                        >
                          <Text style={[s.flightToggleBtnText, { color: !loc.isNewFlight ? colors.primary : colors.textSecondary }]}>MESMO VOO</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[s.flightToggleBtn, { borderColor: loc.isNewFlight ? colors.primary : colors.border }, loc.isNewFlight && { backgroundColor: colors.primaryLight }]}
                          onPress={() => updateLocalizadorField(loc.id, { isNewFlight: true })}
                        >
                          <Text style={[s.flightToggleBtnText, { color: loc.isNewFlight ? colors.primary : colors.textSecondary }]}>NOVO VOO</Text>
                        </TouchableOpacity>
                      </View>

                      {loc.isNewFlight && (
                        <>
                          <View style={fieldS.wrap}>
                            <Text style={[fieldS.label, { color: colors.textSecondary }]}>Companhia</Text>
                            <View style={s.airlineRow}>
                              {AIRLINES.map((a) => (
                                <TouchableOpacity key={a}
                                  style={[s.airlineChip, { borderColor: loc.airline === a ? colors.primary : colors.border }, loc.airline === a && { backgroundColor: colors.primaryLight }]}
                                  onPress={() => updateLocalizadorField(loc.id, { airline: a })}
                                >
                                  <Text style={[s.airlineChipText, { color: loc.airline === a ? colors.primary : colors.textSecondary }]}>{a}</Text>
                                </TouchableOpacity>
                              ))}
                              <TouchableOpacity
                                style={[s.airlineChip, { borderColor: (loc.airline !== undefined && !isPresetAirline(loc.airline)) ? colors.primary : colors.border }, (loc.airline !== undefined && !isPresetAirline(loc.airline)) && { backgroundColor: colors.primaryLight }]}
                                onPress={() => { if (isPresetAirline(loc.airline) || loc.airline === undefined) updateLocalizadorField(loc.id, { airline: '' }); }}
                              >
                                <Text style={[s.airlineChipText, { color: (loc.airline !== undefined && !isPresetAirline(loc.airline)) ? colors.primary : colors.textSecondary }]}>OUTRA</Text>
                              </TouchableOpacity>
                            </View>
                            {loc.airline !== undefined && !isPresetAirline(loc.airline) && (
                              <TextInput style={[inputStyle, { marginTop: Spacing.xs }]} placeholder="NOME DA COMPANHIA" placeholderTextColor={colors.textMuted} value={loc.airline} onChangeText={(t) => updateLocalizadorField(loc.id, { airline: t.toUpperCase() })} autoCapitalize="sentences" />
                            )}
                          </View>
                          <Field label="Nº do voo">
                            <TextInput style={inputStyle} placeholder="LA3045" placeholderTextColor={colors.textMuted} value={loc.flightNumberLocator ?? ''} onChangeText={(t) => updateLocalizadorField(loc.id, { flightNumberLocator: t.toUpperCase() })} autoCapitalize="sentences" />
                          </Field>
                          <AirportPicker label="Origem" value={loc.origin ?? ''} onChange={(v) => updateLocalizadorField(loc.id, { origin: v })} placeholder="Aeroporto de origem" />
                          <AirportPicker label="Destino" value={loc.destination ?? ''} onChange={(v) => updateLocalizadorField(loc.id, { destination: v })} placeholder="Aeroporto de destino" />
                          <AppDatePicker label="Data do voo" value={loc.flightDate ? new Date(loc.flightDate + 'T12:00:00') : null} onChange={(d) => d && updateLocalizadorField(loc.id, { flightDate: d.toISOString().split('T')[0] })} mode="date" />
                          <AppDatePicker label="Horário do voo" value={loc.flightTimeLocator ? timeStrToDate(loc.flightTimeLocator) : null} onChange={(d) => d && updateLocalizadorField(loc.id, { flightTimeLocator: formatTimeFromDate(d) })} mode="time" />
                          {loc.flightTimeLocator && (
                            <View style={[s.infoBanner, { backgroundColor: colors.primaryLight, borderLeftColor: colors.primary }]}>
                              <Text style={[s.infoBannerText, { color: colors.text }]}>
                                Embarque <Text style={{ fontWeight: '800', color: colors.primary }}>{flightSubtract(loc.flightTimeLocator, 45)}</Text>{'   ·   '}Despacho <Text style={{ fontWeight: '800', color: colors.primary }}>{flightSubtract(loc.flightTimeLocator, 120)}</Text>
                              </Text>
                            </View>
                          )}
                        </>
                      )}

                      <Field label="Código">
                        <View style={s.codeRow}>
                          <TextInput style={[inputStyle, { flex: 1 }]} placeholder="ABC1D2" placeholderTextColor={colors.textMuted} value={loc.code} onChangeText={(t) => updateLocalizadorCode(loc.id, t.toUpperCase())} autoCapitalize="sentences" />
                          {loc.code.trim().length > 0 && (
                            <TouchableOpacity style={[s.copyBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]} onPress={() => Share.share({ message: loc.code.trim().toUpperCase() })} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                              <Text style={[s.copyBtnText, { color: colors.primary }]}>Copiar</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </Field>

                      {loc.passengers.map((p, pIdx) => (
                        <View key={pIdx} style={s.passengerRow}>
                          <TextInput style={[inputStyle, { flex: 1 }]} placeholder={`PASSAGEIRO ${pIdx + 1}`} placeholderTextColor={colors.textMuted} value={p} onChangeText={(t) => updateLocalizadorPassenger(loc.id, pIdx, t)} autoCapitalize="words" />
                          <TouchableOpacity onPress={() => removeLocalizadorPassenger(loc.id, pIdx)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Text style={[s.removeText, { color: colors.danger }]}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                      <TouchableOpacity style={[s.addInlineBtn, { borderColor: colors.primary }]} onPress={() => addPassengerToLocalizador(loc.id)}>
                        <Text style={[s.addInlineBtnText, { color: colors.primary }]}>+ Passageiro</Text>
                      </TouchableOpacity>
                    </View>
                  ))}

                  <TouchableOpacity style={[s.addSectionBtn, { borderColor: colors.primary, backgroundColor: colors.primary + '10' }]} onPress={addLocalizador}>
                    <Text style={[s.addSectionBtnText, { color: colors.primary }]}>+ Outro localizador</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* ── COM ESCALA — timeline ── */}
              {hasEscala && flightLegs.length > 0 && (
                <>
                  <AirportPicker label="○  Partida" value={flightLegs[0].origin} onChange={(v) => updateLeg(flightLegs[0].id, { origin: v })} placeholder="Aeroporto de partida" />

                  {flightLegs.map((leg, legIdx) => {
                    const isLast = legIdx === flightLegs.length - 1;
                    const nextLeg = isLast ? null : flightLegs[legIdx + 1];
                    const layover = !isLast && nextLeg ? calcLayover(leg.arrivalDate, leg.arrivalTime ?? '', nextLeg.date, nextLeg.time ?? '') : null;
                    const isExpanded = expandedLegId === leg.id;
                    const legSummary = [leg.airline, leg.flightNumber, leg.time].filter(Boolean).join(' · ');

                    return (
                      <React.Fragment key={leg.id}>
                        <View style={[s.subCard, { borderColor: isExpanded ? colors.primary : colors.border }]}>
                          <TouchableOpacity style={s.subCardHeader} onPress={() => { sectionAnim(); setExpandedLegId(isExpanded ? null : leg.id); }} activeOpacity={0.7}>
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <Text style={[s.subCardTitle, { color: colors.text }]}>Trecho {legIdx + 1}</Text>
                              {legSummary ? <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>{legSummary}</Text> : null}
                            </View>
                            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                              {flightLegs.length > 2 && (
                                <TouchableOpacity onPress={() => removeLeg(leg.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                  <Text style={[s.removeText, { color: colors.danger }]}>✕</Text>
                                </TouchableOpacity>
                              )}
                              <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '700' }}>{isExpanded ? '▲' : '▼'}</Text>
                            </View>
                          </TouchableOpacity>

                          {isExpanded && (
                            <>
                              <View style={fieldS.wrap}>
                                <Text style={[fieldS.label, { color: colors.textSecondary }]}>Companhia</Text>
                                <View style={s.airlineRow}>
                                  {AIRLINES.map((a) => (
                                    <TouchableOpacity key={a}
                                      style={[s.airlineChip, { borderColor: leg.airline === a ? colors.primary : colors.border }, leg.airline === a && { backgroundColor: colors.primaryLight }]}
                                      onPress={() => updateLeg(leg.id, { airline: a })}
                                    >
                                      <Text style={[s.airlineChipText, { color: leg.airline === a ? colors.primary : colors.textSecondary }]}>{a}</Text>
                                    </TouchableOpacity>
                                  ))}
                                  <TouchableOpacity
                                    style={[s.airlineChip, { borderColor: (leg.airline !== undefined && !isPresetAirline(leg.airline)) ? colors.primary : colors.border }, (leg.airline !== undefined && !isPresetAirline(leg.airline)) && { backgroundColor: colors.primaryLight }]}
                                    onPress={() => { if (isPresetAirline(leg.airline) || leg.airline === undefined) updateLeg(leg.id, { airline: '' }); }}
                                  >
                                    <Text style={[s.airlineChipText, { color: (leg.airline !== undefined && !isPresetAirline(leg.airline)) ? colors.primary : colors.textSecondary }]}>OUTRA</Text>
                                  </TouchableOpacity>
                                </View>
                                {leg.airline !== undefined && !isPresetAirline(leg.airline) && (
                                  <TextInput style={[inputStyle, { marginTop: Spacing.xs }]} placeholder="COMPANHIA" placeholderTextColor={colors.textMuted} value={leg.airline} onChangeText={(t) => updateLeg(leg.id, { airline: t.toUpperCase() })} />
                                )}
                              </View>

                              <Field label="Nº do voo">
                                <TextInput style={inputStyle} placeholder="LA3045" placeholderTextColor={colors.textMuted} value={leg.flightNumber ?? ''} onChangeText={(t) => updateLeg(leg.id, { flightNumber: t.toUpperCase() })} autoCapitalize="sentences" />
                              </Field>
                              <Text style={[s.legSubHeader, { color: colors.textSecondary }]}>PARTIDA</Text>
                              <View style={s.dateTimeRow}>
                                <View style={{ flex: 1, minWidth: 0 }}>
                                  <AppDatePicker label="Data" value={leg.date ? new Date(leg.date + 'T12:00:00') : null} onChange={(d) => updateLeg(leg.id, { date: d ? d.toISOString().split('T')[0] : undefined })} mode="date" />
                                </View>
                                <View style={{ width: 136 }}>
                                  <AppDatePicker label="Hora" value={leg.time ? timeStrToDate(leg.time) : null} onChange={(d) => updateLeg(leg.id, { time: d ? formatTimeFromDate(d) : undefined })} mode="time" />
                                </View>
                              </View>

                              <Text style={[s.legSubHeader, { color: colors.textSecondary }]}>CHEGADA</Text>
                              <View style={s.dateTimeRow}>
                                <View style={{ flex: 1, minWidth: 0 }}>
                                  <AppDatePicker label="Data" value={leg.arrivalDate ? new Date(leg.arrivalDate + 'T12:00:00') : null} onChange={(d) => updateLeg(leg.id, { arrivalDate: d ? d.toISOString().split('T')[0] : undefined })} mode="date" />
                                </View>
                                <View style={{ width: 136 }}>
                                  <AppDatePicker label="Hora" value={leg.arrivalTime ? timeStrToDate(leg.arrivalTime) : null} onChange={(d) => updateLeg(leg.id, { arrivalTime: d ? formatTimeFromDate(d) : undefined })} mode="time" />
                                </View>
                              </View>

                              {leg.time && (
                                <View style={[s.infoBanner, { backgroundColor: colors.primaryLight, borderLeftColor: colors.primary }]}>
                                  <Text style={[s.infoBannerText, { color: colors.text }]}>
                                    Embarque <Text style={{ fontWeight: '800', color: colors.primary }}>{flightSubtract(leg.time, 45)}</Text>{'   ·   '}Despacho <Text style={{ fontWeight: '800', color: colors.primary }}>{flightSubtract(leg.time, 120)}</Text>
                                  </Text>
                                </View>
                              )}

                              {leg.localizadores.map((loc, locIdx) => (
                                <View key={loc.id} style={s.subCard}>
                                  <View style={s.subCardHeader}>
                                    <Text style={[s.subCardTitle, { color: colors.text }]}>Localizador {locIdx + 1}</Text>
                                    {leg.localizadores.length > 1 && (
                                      <TouchableOpacity onPress={() => removeLegLocalizador(leg.id, loc.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                        <Text style={[s.removeText, { color: colors.danger }]}>✕</Text>
                                      </TouchableOpacity>
                                    )}
                                  </View>
                                  <Field label="Código">
                                    <View style={s.codeRow}>
                                      <TextInput style={[inputStyle, { flex: 1 }]} placeholder="ABC1D2" placeholderTextColor={colors.textMuted} value={loc.code} onChangeText={(t) => updateLegLocalizador(leg.id, loc.id, { code: t.toUpperCase() })} autoCapitalize="sentences" />
                                      {loc.code.trim().length > 0 && (
                                        <TouchableOpacity style={[s.copyBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]} onPress={() => Share.share({ message: loc.code.trim() })}>
                                          <Text style={[s.copyBtnText, { color: colors.primary }]}>Copiar</Text>
                                        </TouchableOpacity>
                                      )}
                                    </View>
                                  </Field>
                                  {loc.passengers.map((p, pIdx) => (
                                    <View key={pIdx} style={s.passengerRow}>
                                      <TextInput style={[inputStyle, { flex: 1 }]} placeholder={`PASSAGEIRO ${pIdx + 1}`} placeholderTextColor={colors.textMuted} value={p} onChangeText={(t) => updateLegLocPassenger(leg.id, loc.id, pIdx, t)} autoCapitalize="words" />
                                      <TouchableOpacity onPress={() => removeLegLocPassenger(leg.id, loc.id, pIdx)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                        <Text style={[s.removeText, { color: colors.danger }]}>✕</Text>
                                      </TouchableOpacity>
                                    </View>
                                  ))}
                                  <TouchableOpacity style={[s.addInlineBtn, { borderColor: colors.primary }]} onPress={() => addLegLocPassenger(leg.id, loc.id)}>
                                    <Text style={[s.addInlineBtnText, { color: colors.primary }]}>+ Passageiro</Text>
                                  </TouchableOpacity>
                                </View>
                              ))}
                              <TouchableOpacity style={[s.addInlineBtn, { borderColor: colors.primary }]} onPress={() => addLegLocalizador(leg.id)}>
                                <Text style={[s.addInlineBtnText, { color: colors.primary }]}>+ Outro localizador (código diferente)</Text>
                              </TouchableOpacity>
                            </>
                          )}
                        </View>

                        {isLast ? (
                          <AirportPicker label="●  Destino" value={leg.destination} onChange={(v) => updateLeg(leg.id, { destination: v })} placeholder="Aeroporto de destino" />
                        ) : (
                          <>
                            <AirportPicker
                              label="◈  Conexão"
                              value={leg.destination}
                              onChange={(v) => {
                                updateLeg(leg.id, { destination: v });
                                if (nextLeg) updateLeg(nextLeg.id, { origin: v });
                              }}
                              placeholder="Aeroporto de conexão"
                            />
                            <View style={[s.layoverBanner, { backgroundColor: '#FF9F0A20', borderColor: '#FF9F0A' }]}>
                              <Text style={[s.layoverLabel, { color: '#FF9F0A' }]}>DURAÇÃO DA CONEXÃO</Text>
                              <Text style={[s.layoverValue, { color: colors.text }]}>
                                {layover ?? 'Defina horário de chegada e próxima partida'}
                              </Text>
                            </View>
                          </>
                        )}
                      </React.Fragment>
                    );
                  })}

                  <TouchableOpacity style={[s.addSectionBtn, { borderColor: colors.primary, marginTop: Spacing.xs, backgroundColor: colors.primary + '10' }]} onPress={addLeg}>
                    <Text style={[s.addSectionBtnText, { color: colors.primary }]}>+ Adicionar escala</Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}

          {/* Vínculo: voo de volta deste show está em outro evento */}
          <View style={[s.linkedFlightHint, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[s.linkedFlightHintTitle, { color: colors.text }]}>🔗 Voo de volta deste show</Text>
            <Text style={[s.linkedFlightHintSub, { color: colors.textSecondary }]}>
              Se o voo de volta está cadastrado em outro show (ex: próxima cidade), vincule aqui pra a equipe ver tudo numa tela só.
            </Text>
            <ShowPicker
              value={returnFlightFromShowId}
              onChange={setReturnFlightFromShowId}
              shows={allShows}
              excludeId={editId}
              placeholder="Selecionar show com voo de volta"
            />
          </View>
        </View>

        {/* ── Hotel ── */}
        <View style={sc('#30D158', hasHotel)} onLayout={(e) => { sectionOffsets.current.hotel = e.nativeEvent.layout.y; }}>
          <SectionHeader
            iconName="bed"
            iconColor="#30D158"
            title="Hotel"
            subtitle={!hasHotel ? 'Sem hospedagem' : (hotelName.trim() ? `${hotelName.trim()}${hotelRooms.length ? ` · ${hotelRooms.length} quarto${hotelRooms.length === 1 ? '' : 's'}` : ''}` : 'Adicionar detalhes')}
            enabled={hasHotel}
            onToggle={(val) => { sectionAnim(); setHasHotel(val); }}
          />
          {hasHotel && (
            <>
              <GroupLabel label="HOSPEDAGEM" />
              <Field label="Nome do hotel">
                <TextInput style={inputStyle} placeholder="Ex: Hotel Ibis Centro" placeholderTextColor={colors.textMuted} value={hotelName} onChangeText={(v) => setHotelName(up(v))} autoCapitalize="sentences" />
              </Field>
              <Field label="Endereço do hotel">
                <TextInput style={inputStyle} placeholder="Rua, número, bairro..." placeholderTextColor={colors.textMuted} value={hotelAddress} onChangeText={(v) => setHotelAddress(up(v))} autoCapitalize="sentences" />
                {hotelAddress.trim().length > 4 && (
                  <View style={s.addrBtnRow}>
                    <TouchableOpacity style={[s.addrBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]} onPress={() => copyAddress(hotelAddress)}>
                      <Text style={[s.addrBtnText, { color: colors.primary }]}>Copiar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.addrBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => openWazeAddress(hotelAddress)}>
                      <Text style={[s.addrBtnText, { color: colors.text }]}>Waze</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Field>

              <GroupLabel label="LOGÍSTICA" />
              <AppDatePicker label="Saída do hotel" value={departureTimeHotelShow} onChange={setDepartureTimeHotelShow} mode="time" />
              <View style={s.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.switchLabel, { color: colors.text }]}>Mala e cuia</Text>
                  <Text style={[s.switchSub, { color: colors.textMuted }]}>Equipe viajará com toda a bagagem</Text>
                </View>
                <Switch value={hotelMalaCuia} onValueChange={setHotelMalaCuia} trackColor={{ true: colors.primary }} />
              </View>

              <GroupLabel label="QUARTOS" />
              {/* Quartos — colapsáveis */}
              {hotelRooms.map((room, roomIdx) => {
                const isExp = expandedRoomId === room.id;
                const guests = room.passengers.filter(Boolean);
                const label = room.roomNumber ? `Quarto ${room.roomNumber}` : `Quarto ${roomIdx + 1}`;
                return (
                  <View key={room.id} style={[subCardStyle, { padding: 0, overflow: 'hidden' }]}>
                    {/* Header — sempre visível */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingLeft: 12, paddingRight: 8 }}>
                      <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}
                        onPress={() => { sectionAnim(); setExpandedRoomId(isExp ? null : room.id); }}
                        activeOpacity={0.7}
                      >
                        <Icon name="bed" color={colors.textMuted} size={18} />
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{label}</Text>
                          <Text style={{ fontSize: 12, color: colors.textMuted }} numberOfLines={1}>
                            {guests.length ? guests.join(' · ') : 'Sem hóspedes'}
                          </Text>
                        </View>
                        <View style={{ backgroundColor: colors.primaryLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, flexShrink: 0 }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>{ROOM_LABELS[room.type]}</Text>
                        </View>
                        <Icon name={isExp ? 'chevronUp' : 'chevronDown'} color={colors.textMuted} size={18} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => removeRoom(room.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ paddingLeft: 8 }}>
                        <Icon name="close" color={colors.danger} size={16} />
                      </TouchableOpacity>
                    </View>

                    {/* Form expandido */}
                    {isExp && (
                      <View style={{ borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8, gap: 12 }}>
                        <View style={s.roomTypeRow}>
                          {(['single', 'double', 'triple'] as RoomType[]).map((type) => (
                            <TouchableOpacity
                              key={type}
                              style={[s.roomTypeBtn, { borderColor: room.type === type ? colors.primary : colors.border }, room.type === type && { backgroundColor: colors.primaryLight }]}
                              onPress={() => updateRoomType(room.id, type)}
                            >
                              <Text style={[s.roomTypeBtnText, { color: room.type === type ? colors.primary : colors.textSecondary }]}>{ROOM_LABELS[type]}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        <Field label="Número do quarto">
                          <TextInput
                            style={inputStyle}
                            placeholder="101"
                            placeholderTextColor={colors.textMuted}
                            value={room.roomNumber ?? ''}
                            onChangeText={(t) => updateRoomNumber(room.id, t.replace(/[^0-9]/g, ''))}
                            keyboardType="number-pad"
                          />
                        </Field>

                        {guests.length > 0 && (
                          <View style={s.memberChipRow}>
                            {guests.map((name) => (
                              <TouchableOpacity
                                key={name}
                                style={[s.memberChip, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                                onPress={() => removeRoomMember(room.id, name)}
                                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                              >
                                <Text style={[s.memberChipText, { color: colors.primary }]}>{name}  ✕</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}

                        <Field label="Adicionar membro">
                          <TextInput
                            style={inputStyle}
                            placeholder="Buscar na equipe..."
                            placeholderTextColor={colors.textMuted}
                            value={roomSearch[room.id] ?? ''}
                            onChangeText={(t) => setRoomSearch((prev) => ({ ...prev, [room.id]: t }))}
                            autoCorrect={false}
                            autoCapitalize="characters"
                          />
                        </Field>

                        {(() => {
                          const q = (roomSearch[room.id] ?? '').toLowerCase();
                          const allAllocated = new Set(hotelRooms.flatMap((r) => r.passengers));
                          const filtered = teamMembers.filter((m) => !allAllocated.has(m) && (q === '' || m.toLowerCase().includes(q)));
                          if (!filtered.length) return null;
                          return (
                            <View style={[s.teamDropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                              {filtered.map((name, ni) => (
                                <TouchableOpacity
                                  key={name}
                                  style={[s.teamDropdownItem, ni < filtered.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
                                  onPress={() => addRoomMember(room.id, name)}
                                  activeOpacity={0.7}
                                >
                                  <Text style={[s.teamDropdownText, { color: colors.text }]}>{name}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          );
                        })()}
                      </View>
                    )}
                  </View>
                );
              })}

              <TouchableOpacity style={[s.addSectionBtn, { borderColor: colors.primary, backgroundColor: colors.primary + '10' }]} onPress={addRoom}>
                <Text style={[s.addSectionBtnText, { color: colors.primary }]}>+ Adicionar quarto</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Vínculo: hotel de outro show */}
          <View style={[s.linkedFlightHint, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[s.linkedFlightHintTitle, { color: colors.text }]}>🔗 Vincular hotel de outro show</Text>
            <Text style={[s.linkedFlightHintSub, { color: colors.textSecondary }]}>
              Se o hotel já está cadastrado em outro show, vincule aqui para preencher automaticamente nome, endereço e quartos.
            </Text>
            <ShowPicker
              value={linkedHotelShowId}
              onChange={(id) => {
                setLinkedHotelShowId(id);
                if (id) {
                  const src = allShows.find((sh) => sh.id === id);
                  if (src?.hasHotel) {
                    setHasHotel(true);
                    if (src.hotelName) setHotelName(src.hotelName);
                    if (src.hotelAddress) setHotelAddress(src.hotelAddress);
                    if (src.hotelRooms?.length) setHotelRooms(src.hotelRooms.map((r) => ({ ...r, id: genId('room') })));
                  }
                }
              }}
              shows={allShows.filter((sh) => sh.hasHotel && sh.hotelName)}
              excludeId={editId}
              placeholder="Selecionar show com hotel cadastrado"
            />
          </View>
        </View>

        {/* ── Van ── */}
        <View style={sc('#BF5AF2', hasVan)} onLayout={(e) => { sectionOffsets.current.van = e.nativeEvent.layout.y; }}>
          <SectionHeader
            iconName="van"
            iconColor="#BF5AF2"
            title="Van"
            subtitle={!hasVan ? 'Sem transfer' : (vanDriverName.trim() || vanPlate.trim() ? `${vanDriverName.trim()}${vanDriverName.trim() && vanPlate.trim() ? ' · ' : ''}${vanPlate.trim()}` : 'Adicionar detalhes')}
            enabled={hasVan}
            onToggle={(val) => { sectionAnim(); setHasVan(val); }}
          />
          {hasVan && (
            <>
              <GroupLabel label="MOTORISTA" />
              <Field label="Nome">
                <TextInput style={inputStyle} placeholder="Nome do motorista" placeholderTextColor={colors.textMuted} value={vanDriverName} onChangeText={(v) => setVanDriverName(up(v))} autoCapitalize="sentences" />
              </Field>
              <View style={{ marginBottom: Spacing.md }}>
                <PhoneInput label="Telefone" value={vanDriverPhone} onChangeText={setVanDriverPhone} />
              </View>
              <GroupLabel label="VEÍCULO" />
              <Field label="Cor da van">
                <View style={s.colorRow}>
                  {VAN_COLORS.map((c) => {
                    const swatch: Record<string, string> = { PRETA: '#1C1C1E', BRANCA: '#E5E5EA', PRATA: '#C7C7CC', CINZA: '#6C6C70', VERMELHA: '#FF3B30', AZUL: '#0A84FF', OUTRA: '#FF9F0A' };
                    const dot = swatch[c] ?? '#8E8E93';
                    const active = vanColor === c;
                    return (
                      <TouchableOpacity
                        key={c}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        style={[s.colorChip, { flexDirection: 'row', alignItems: 'center', gap: 5, borderColor: active ? dot : colors.border, backgroundColor: active ? dot + '20' : 'transparent' }]}
                        onPress={() => setVanColor(c)}
                      >
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dot, borderWidth: c === 'BRANCA' ? 0.5 : 0, borderColor: colors.border }} />
                        <Text style={[s.colorText, { color: active ? dot : colors.textSecondary }]}>{c}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Field>
              <Field label="Placa">
                <TextInput style={inputStyle} placeholder="ABC-1D23" placeholderTextColor={colors.textMuted} value={vanPlate} onChangeText={(v) => setVanPlate(up(v))} autoCapitalize="sentences" />
              </Field>
            </>
          )}

          {/* Vínculo: van de outro show */}
          <View style={[s.linkedFlightHint, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[s.linkedFlightHintTitle, { color: colors.text }]}>🔗 Vincular van de outro show</Text>
            <Text style={[s.linkedFlightHintSub, { color: colors.textSecondary }]}>
              Se a van já está cadastrada em outro show, vincule aqui para preencher automaticamente motorista, telefone, cor e placa.
            </Text>
            <ShowPicker
              value={linkedVanShowId}
              onChange={(id) => {
                setLinkedVanShowId(id);
                if (id) {
                  const src = allShows.find((sh) => sh.id === id);
                  if (src?.hasVan) {
                    setHasVan(true);
                    if (src.vanDriverName) setVanDriverName(src.vanDriverName);
                    if (src.vanDriverPhone) setVanDriverPhone(src.vanDriverPhone);
                    if (src.vanColor) setVanColor(src.vanColor);
                    if (src.vanPlate) setVanPlate(src.vanPlate);
                  }
                }
              }}
              shows={allShows.filter((sh) => sh.hasVan && sh.vanDriverName)}
              excludeId={editId}
              placeholder="Selecionar show com van cadastrada"
            />
          </View>
        </View>

        {/* ── Ponto de encontro ── (antes era "Distâncias & Saídas" com várias
            linhas, mas o usuário só usava o ponto de encontro de fato. Saídas
            de hotel e distâncias km saíram pra simplificar.) */}
        <View style={sc('#FF9F0A')} onLayout={(e) => { sectionOffsets.current.meeting = e.nativeEvent.layout.y; }}>
          <SectionHeader
            iconName="pin"
            iconColor="#FF9F0A"
            title="Ponto de encontro"
            subtitle={departureTimeMeetingShow ? formatTimeFromDate(departureTimeMeetingShow) : 'Definir horário'}
          />

          <AppDatePicker
            label="Horário"
            value={departureTimeMeetingShow}
            onChange={setDepartureTimeMeetingShow}
            mode="time"
            clearable
            clearLabel="A definir"
          />
          {showTime && departureTimeMeetingShow && (
            <View style={[s.infoBanner, { backgroundColor: colors.primaryLight }]}>
              <Text style={[s.infoBannerText, { color: colors.text }]}>
                <Text style={{ fontWeight: '800', color: colors.primary }}>{formatLeadTime(departureTimeMeetingShow, showTime)}</Text>
              </Text>
            </View>
          )}
          {showTime && (
            <View style={s.bufferRow}>
              <Text style={[s.bufferHint, { color: colors.textMuted }]}>
                Antecipação a partir do show ({formatTimeFromDate(showTime)}) — cada clique = 30 min.
              </Text>
              <View style={s.bufferBtnsRow}>
                <TouchableOpacity
                  style={[s.bufferBtn, { borderColor: colors.primary, backgroundColor: colors.primaryLight }]}
                  onPress={() => {
                    const base = departureTimeMeetingShow ?? showTime;
                    setDepartureTimeMeetingShow(new Date(base.getTime() - 30 * 60 * 1000));
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[s.bufferBtnText, { color: colors.primary }]}>+30 min antes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.bufferBtn, { borderColor: colors.border }, !departureTimeMeetingShow && { opacity: 0.4 }]}
                  onPress={() => {
                    if (!departureTimeMeetingShow) return;
                    const next = new Date(departureTimeMeetingShow.getTime() + 30 * 60 * 1000);
                    setDepartureTimeMeetingShow(next >= showTime ? null : next);
                  }}
                  disabled={!departureTimeMeetingShow}
                  activeOpacity={0.8}
                >
                  <Text style={[s.bufferBtnText, { color: colors.text }]}>−30 min</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* ── Artista ── */}
        <View style={sc('#FF9F0A')} onLayout={(e) => { sectionOffsets.current.artist = e.nativeEvent.layout.y; }}>
          <SectionHeader
            iconName="music"
            iconColor="#FF9F0A"
            title="Artista"
            subtitle="Camarim, duração, figurino, palco"
          />

          {/* Camarim */}
          <View style={[s.switchRow, { marginBottom: Spacing.md }]}>
            <View style={{ flex: 1 }}>
              <Text style={[s.switchLabel, { color: colors.text }]}>Tem camarim?</Text>
              <Text style={[s.switchSub, { color: colors.textSecondary }]}>
                {hasCamarim === undefined ? 'Não definido' : hasCamarim ? 'Sim' : 'Não'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['Sim', 'Não'] as const).map((opt) => {
                const val = opt === 'Sim';
                const active = hasCamarim === val;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[s.bufferBtn, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primaryLight : 'transparent' }]}
                    onPress={() => setHasCamarim(active ? undefined : val)}
                    activeOpacity={0.8}
                  >
                    <Text style={[s.bufferBtnText, { color: active ? colors.primary : colors.textSecondary }]}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Duração + Soundcheck */}
          <View style={s.row}>
            <Field label="Duração (min)" hint="Ex: 90 = 1h30">
              <TextInput
                style={[inputStyle, { textAlign: 'center' }]}
                placeholder="90"
                placeholderTextColor={colors.textMuted}
                value={showDurationMinutes}
                onChangeText={(t) => setShowDurationMinutes(t.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                maxLength={3}
              />
            </Field>
            <View style={{ flex: 1 }}>
              <AppDatePicker
                label="Soundcheck"
                value={soundcheckTime}
                onChange={setSoundcheckTime}
                mode="time"
                clearable
                clearLabel="Sem soundcheck"
              />
            </View>
          </View>

          {/* Cenário do palco */}
          <Field label="Cenário do palco">
            <View style={s.colorRow}>
              {([
                { key: 'dropdown', label: '🎪 Dropdown' },
                { key: '360', label: '🔄 360°' },
                { key: 'led', label: '💡 Painel LED' },
                { key: 'none', label: '✨ Sem cenário' },
              ] as const).map(({ key, label }) => (
                <TouchableOpacity
                  key={key}
                  style={[s.colorChip, { borderColor: stageSetup === key ? colors.primary : colors.border, backgroundColor: stageSetup === key ? colors.primaryLight : 'transparent' }]}
                  onPress={() => setStageSetup(stageSetup === key ? undefined : key)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.colorText, { color: stageSetup === key ? colors.primary : colors.textSecondary }]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          {/* Figurino */}
          <Field label="Figurino">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {['Social', 'Casual', 'Esportivo', 'Fantasia', 'Executivo', 'Show'].map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[s.colorChip, { borderColor: outfit === preset ? '#FF9F0A' : colors.border, backgroundColor: outfit === preset ? 'rgba(255,159,10,.12)' : 'transparent' }]}
                  onPress={() => setOutfit(outfit === preset ? '' : preset)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.colorText, { color: outfit === preset ? '#FF9F0A' : colors.textSecondary }]}>{preset}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={inputStyle}
              placeholder="Descrever ou personalizar figurino..."
              placeholderTextColor={colors.textMuted}
              value={outfit}
              onChangeText={setOutfit}
              autoCapitalize="sentences"
            />
          </Field>

          {/* Agradecimentos */}
          <Field label="Agradecimentos" hint="Será exibido ao artista no app">
            <TextInput
              style={[inputStyle, s.inputMulti]}
              placeholder="Patrocinadores, parceiros, mensagem especial..."
              placeholderTextColor={colors.textMuted}
              value={agradecimentos}
              onChangeText={setAgradecimentos}
              multiline
              numberOfLines={3}
              autoCapitalize="sentences"
            />
          </Field>

          {/* Chegada em casa */}
          <AppDatePicker
            label="Previsão de chegada em casa"
            value={homeArrivalTime}
            onChange={setHomeArrivalTime}
            mode="time"
            clearable
            clearLabel="Não definida"
          />
        </View>

        {/* ── Notes ── */}
        <View style={sc('#8E8E93')} onLayout={(e) => { sectionOffsets.current.notes = e.nativeEvent.layout.y; }}>
          <SectionHeader
            iconName="tag"
            iconColor="#8E8E93"
            title="Notas"
            subtitle={notes.trim() ? `${notes.trim().length} caractere${notes.trim().length === 1 ? '' : 's'}` : 'Rider, observações...'}
          />
          <Field label="Notas gerais">
            <TextInput style={[inputStyle, s.inputMulti]} placeholder="Rider, observações, contato do produtor..." placeholderTextColor={colors.textMuted} value={notes} onChangeText={setNotes} multiline numberOfLines={4} />
          </Field>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.md },
  jumpBar: { marginHorizontal: -Spacing.md, marginBottom: Spacing.md },
  jumpBarContent: { paddingHorizontal: Spacing.md, gap: 6, flexDirection: 'row', paddingRight: Spacing.xl },
  jumpPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 7, borderRadius: Radius.full, borderWidth: 1 },
  jumpPillText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  section: { borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md, ...Shadow.sm },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.sm, marginBottom: Spacing.sm },
  switchLabel: { fontSize: FontSize.sm, fontWeight: '700' },
  switchSub: { fontSize: FontSize.xs, marginTop: 2 },
  tbdChip: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1, marginBottom: Spacing.sm },
  tbdChipText: { fontSize: 12, fontWeight: '600' },
  sectionHint: { fontSize: FontSize.xs, marginBottom: Spacing.sm, marginTop: -Spacing.xs },
  row: { flexDirection: 'row', gap: Spacing.sm },
  input: { borderBottomWidth: 1.5, paddingHorizontal: 2, paddingVertical: 11, fontSize: 16 },
  inputMulti: { minHeight: 90, textAlignVertical: 'top', borderBottomWidth: 0, borderWidth: 1.5, borderRadius: Radius.md, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, fontSize: FontSize.md },
  infoBanner: { borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 12, marginBottom: Spacing.md },
  infoBannerText: { fontSize: FontSize.sm, fontWeight: '600', letterSpacing: -0.1 },
  subCard: { borderRadius: Radius.sm + 2, borderWidth: 1, padding: Spacing.sm, marginBottom: Spacing.sm },
  subCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  subCardTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' as any },
  removeText: { fontSize: 14, fontWeight: '700' },
  passengerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.xs },
  roomTypeRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.sm },
  roomTypeBtn: { flex: 1, paddingVertical: 10, borderRadius: Radius.full, borderWidth: 1.5, alignItems: 'center' },
  roomTypeBtnText: { fontSize: FontSize.sm, fontWeight: '800' },
  addSectionBtn: { paddingVertical: 11, borderRadius: Radius.md, borderWidth: 1, alignItems: 'center', marginTop: Spacing.sm },
  addSectionBtnText: { fontWeight: '800', fontSize: FontSize.sm },
  addInlineBtn: { paddingVertical: 6, paddingHorizontal: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, alignSelf: 'flex-start', marginTop: Spacing.xs },
  addInlineBtnText: { fontWeight: '600', fontSize: FontSize.xs },
  kmRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  kmInput: { flex: 1 },
  kmLabel: { fontSize: FontSize.md, fontWeight: '700', minWidth: 28 },
  bufferRow: { marginTop: Spacing.xs, marginBottom: Spacing.md },
  bufferHint: { fontSize: FontSize.xs, marginBottom: 6 },
  bufferBtnsRow: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap' },
  bufferBtn: { paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1.5 },
  bufferBtnText: { fontSize: FontSize.xs, fontWeight: '800' },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  colorChip: { paddingHorizontal: Spacing.sm, paddingVertical: 7, borderRadius: Radius.full, borderWidth: 1.5 },
  colorText: { fontSize: FontSize.xs, fontWeight: '700' },
  saveBtn: { borderRadius: Radius.lg, paddingVertical: Spacing.md, alignItems: 'center', ...Shadow.md },
  saveBtnText: { color: '#fff', fontSize: FontSize.lg, fontWeight: '800' },
  dateTimeRow: { flexDirection: 'row', gap: Spacing.sm },
  legSubHeader: { fontSize: 12, fontWeight: '800', letterSpacing: 0.6, marginTop: Spacing.xs, marginBottom: 4 },
  legDateRow: { flexDirection: 'row', gap: Spacing.sm },
  layoverBanner: { borderRadius: Radius.md, borderWidth: 1, paddingHorizontal: Spacing.md, paddingVertical: 12, marginTop: -Spacing.xs, marginBottom: Spacing.md, alignItems: 'center', gap: 2 },
  layoverLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 2.0, marginBottom: 0 },
  layoverValue: { fontSize: 26, fontWeight: '900', letterSpacing: -1.0 },
  linkedFlightHint: { borderRadius: Radius.md, borderWidth: 1.5, padding: Spacing.sm, marginTop: Spacing.md },
  linkedFlightHintTitle: { fontSize: FontSize.sm, fontWeight: '800', marginBottom: 4 },
  linkedFlightHintSub: { fontSize: 11, fontWeight: '500', lineHeight: 16, marginBottom: 10 },
  flightToggleRow: { flexDirection: 'row', gap: Spacing.xs },
  flightToggleBtn: { flex: 1, paddingVertical: 10, borderRadius: Radius.full, borderWidth: 1.5, alignItems: 'center' },
  flightToggleBtnText: { fontSize: FontSize.sm, fontWeight: '800' },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  copyBtn: { paddingHorizontal: Spacing.sm, paddingVertical: 9, borderRadius: Radius.md, borderWidth: 1.5 },
  copyBtnText: { fontSize: FontSize.xs, fontWeight: '700' },
  addrBtnRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  addrBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 7, borderRadius: Radius.full, borderWidth: 1.5 },
  addrBtnText: { fontSize: FontSize.xs, fontWeight: '700' },
  airlineRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.xs },
  airlineChip: { paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1.5 },
  airlineChipText: { fontSize: FontSize.sm, fontWeight: '800' },
  memberChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: Spacing.sm },
  memberChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 1.5 },
  memberChipText: { fontSize: FontSize.xs, fontWeight: '700' },
  teamDropdown: { borderRadius: Radius.md, borderWidth: 1.5, marginTop: 4, marginBottom: Spacing.sm, overflow: 'hidden' },
  teamDropdownItem: { paddingHorizontal: Spacing.sm, paddingVertical: 11 },
  teamDropdownText: { fontSize: FontSize.sm, fontWeight: '600' },
});
