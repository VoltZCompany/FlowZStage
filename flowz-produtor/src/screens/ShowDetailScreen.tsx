import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Linking, Modal, Share, Platform, Animated, PanResponder, ActivityIndicator, AccessibilityInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Spacing, FontSize, Radius, Shadow } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { Show, ImportantContact, HotelRoom, RoomType } from '../types/show';
import { TeamMember } from '../types/team';
import {
  IOSNavBar, IOSNavButton, Segmented, DestructiveButton, Chip,
} from '../components/ios';
import { Icon } from '../components/icons';
import { findAirport } from '../data/brazilianAirports';
import {
  loadShows, updateShow, toggleShowReminder, buildReminder,
  buildMaterialItem, toggleMaterialItem, deleteShow, setReminderNotification,
} from '../store/showStore';
import { scheduleShowReminderNotif, cancelShowReminderNotif } from '../services/notificationService';
import { loadTeamMembers } from '../store/teamStore';
import { loadPairings } from '../store/pairingStore';
import { RootStackParamList } from '../navigation/AppNavigator';
import { format, parseISO, differenceInDays, differenceInHours, differenceInMinutes, isBefore, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

// Inject hero gradient animation keyframe for web
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const s = document.createElement('style');
  s.textContent = '@keyframes heroSlide{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}@media(prefers-reduced-motion:reduce){*{animation-duration:.001ms!important;animation-iteration-count:1!important}}';
  document.head?.appendChild(s);
}

type Nav = NativeStackNavigationProp<RootStackParamList, 'ShowDetail'>;
type Route = RouteProp<RootStackParamList, 'ShowDetail'>;

function flightSubtract(hhmm: string, mins: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  let total = h * 60 + m - mins;
  total = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function airportLabel(iata?: string): string {
  if (!iata) return '';
  const found = findAirport(iata);
  return found ? `${found.iata} — ${found.city}` : iata;
}

function airportCity(iata?: string): string {
  if (!iata) return '';
  const found = findAirport(iata);
  return found?.city ?? iata;
}

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

function getMissingFields(show: Show): string[] {
  const m: string[] = [];

  // Geral
  if (!show.city) m.push('Cidade do show');
  if (!show.venueAddress) m.push('Endereço do local');
  if (!show.contratantePhone) m.push('Telefone do contratante');

  // Voo
  if (show.hasAirplane) {
    if (!show.hasEscala) {
      if (!show.airportName) m.push('Voo · Aeroporto de origem');
      if (!show.airportDestination) m.push('Voo · Aeroporto de destino');
      if (!show.flightNumber) m.push('Voo · Nº do voo');
      if (!show.flightDate) m.push('Voo · Data de partida');
      if (!show.flightTime) m.push('Voo · Horário de partida');
      if (!show.flightArrivalDate) m.push('Voo · Data de chegada');
      if (!show.flightArrivalTime) m.push('Voo · Horário de chegada');
      const locs = show.flightLocators ?? [];
      if (locs.length === 0 || locs.every((l) => !l.code.trim())) {
        m.push('Voo · Localizador');
      } else {
        locs.forEach((loc, i) => {
          if (!loc.code.trim()) m.push(`Voo · Localizador ${i + 1} sem código`);
          if (loc.passengers.length === 0) m.push(`Voo · Localizador ${i + 1} sem passageiros`);
        });
      }
    } else {
      (show.flightLegs ?? []).forEach((leg, i) => {
        const t = `Trecho ${i + 1}`;
        if (!leg.date) m.push(`Voo · ${t} · Data de partida`);
        if (!leg.time) m.push(`Voo · ${t} · Horário de partida`);
        if (!leg.arrivalDate) m.push(`Voo · ${t} · Data de chegada`);
        if (!leg.arrivalTime) m.push(`Voo · ${t} · Horário de chegada`);
        if (leg.localizadores.every((l) => !l.code.trim())) m.push(`Voo · ${t} · Localizador`);
      });
    }
  }

  // Hotel
  if (show.hasHotel) {
    if (!show.hotelName) m.push('Hotel · Nome do hotel');
    if (!show.hotelAddress) m.push('Hotel · Endereço');
    const rooms = show.hotelRooms ?? [];
    if (rooms.length === 0) {
      m.push('Hotel · Quartos não configurados');
    } else {
      rooms.forEach((room, i) => {
        if (!room.roomNumber) m.push(`Hotel · Quarto ${i + 1} sem número`);
        if (room.passengers.length === 0) m.push(`Hotel · Quarto ${i + 1} sem hóspedes`);
      });
    }
  }

  // Van
  if (show.hasVan) {
    if (!show.vanDriverName) m.push('Van · Nome do motorista');
    if (!show.vanDriverPhone) m.push('Van · Telefone do motorista');
    if (!show.vanColor) m.push('Van · Cor da van');
    if (!show.vanPlate) m.push('Van · Placa');
  }

  // Logística — horários de saída
  if (show.hasAirplane || show.hasHotel) {
    if (!show.hasHotel && !show.departureTimeMeetingShow) m.push('Logística · Horário saída do ponto de encontro');
    if (show.hasHotel && !show.departureTimeHotelShow) m.push('Logística · Horário saída hotel → show');
    if (show.hasHotel && show.hasAirplane && !show.departureTimeHotelAirport) m.push('Logística · Horário saída hotel → aeroporto');
  }

  return m;
}

function esc(s?: string): string {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function exportShowPDF(show: Show) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  const fl = (t: string, m: number) => flightSubtract(t, m);
  const al = (iata?: string) => esc(airportLabel(iata));

  const remDone = (show.reminders ?? []).filter((r) => r.done).length;
  const remTotal = (show.reminders ?? []).length;
  const matDone = (show.materials ?? []).filter((m) => m.checked).length;
  const matTotal = (show.materials ?? []).length;

  const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(show.name)} — Backstage</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
html,body{background:#F2F2F7}
body{font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif;color:#1A1A2E;font-size:14px;line-height:1.5;padding:0;padding-top:60px;padding-bottom:84px}
.wrap{max-width:780px;margin:0 auto;padding:24px}

/* Sticky top bar — botão de voltar pro app + título */
.topbar{position:fixed;top:0;left:0;right:0;height:56px;background:rgba(255,255,255,.95);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid #E5E5EA;display:flex;align-items:center;padding:0 16px;gap:12px;z-index:100}
.topbar-back{display:inline-flex;align-items:center;gap:6px;background:#F2F2F7;border:none;color:#007AFF;font-size:15px;font-weight:600;padding:8px 14px;border-radius:9999px;cursor:pointer;font-family:inherit;letter-spacing:-.2px}
.topbar-back:hover{background:#E5E5EA}
.topbar-title{flex:1;text-align:center;font-size:15px;font-weight:700;color:#1A1A2E;letter-spacing:-.3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 12px}
.topbar-print{display:inline-flex;align-items:center;gap:6px;background:#007AFF;border:none;color:#fff;font-size:14px;font-weight:700;padding:8px 14px;border-radius:9999px;cursor:pointer;font-family:inherit}
.topbar-print:hover{background:#0066CC}
@media print{.topbar,.bottombar{display:none!important}body{padding-top:0;padding-bottom:0;background:#fff}.wrap{padding:0}}

/* Hero */
.hero{background:linear-gradient(135deg,#007AFF,#0062D4);color:#fff;border-radius:20px;padding:24px;margin-bottom:20px;position:relative;overflow:hidden}
.hero-badge{display:inline-block;background:rgba(255,255,255,.22);font-size:11px;font-weight:800;letter-spacing:1.5px;padding:4px 10px;border-radius:9999px;margin-bottom:10px}
.hero-name{font-size:26px;font-weight:800;letter-spacing:-.6px;line-height:1.15;margin-bottom:6px}
.hero-meta{font-size:14px;opacity:.92}
.hero-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:18px;padding-top:16px;border-top:1px solid rgba(255,255,255,.22)}
.hero-col-lbl{font-size:10px;font-weight:700;letter-spacing:1px;opacity:.75}
.hero-col-val{font-size:15px;font-weight:700;margin-top:3px}

/* Sections */
.sec{background:#fff;border-radius:14px;padding:16px 18px;margin-bottom:12px;box-shadow:0 1px 2px rgba(0,0,0,.05)}
.sec-title{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#6B7280;margin-bottom:10px}
.row{display:flex;align-items:flex-start;gap:8px;margin-bottom:7px;font-size:13px}
.row:last-child{margin-bottom:0}
.lbl{color:#9CA3AF;min-width:140px;flex-shrink:0;font-size:12px}
.val{font-weight:600;color:#1A1A2E}
.val-accent{color:#FF9500;font-weight:800}

/* Cards (locators, hotel rooms) */
.card{background:#F8F9FF;border:1.5px solid #E5E5EA;border-radius:10px;padding:12px;margin:10px 0}
.card-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:8px}
.card-lbl{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.8px;color:#6B7280}
.code{font-size:18px;font-weight:900;color:#007AFF;letter-spacing:1.5px}
.badge{background:#E5F0FF;color:#007AFF;padding:3px 10px;border-radius:9999px;font-size:11px;font-weight:700}
.boarding{background:#E5F0FF;border-radius:8px;padding:8px 10px;margin:8px 0;font-weight:700;color:#007AFF;font-size:12px}
.pax{font-size:13px;margin-top:5px;color:#1A1A2E}

/* Checklists */
.check-row{display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid #F0F0F0}
.check-row:last-child{border-bottom:none}
.cb{width:16px;height:16px;border-radius:50%;border:2px solid #007AFF;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:900}
.cb-done{background:#007AFF;border-color:#007AFF}
.rt{font-size:13px;flex:1}
.rt-done{text-decoration:line-through;color:#9CA3AF}
.progress-pill{font-size:11px;font-weight:700;color:#007AFF;background:#E5F0FF;padding:2px 8px;border-radius:9999px;margin-left:8px}

/* Bottom action bar (mobile-friendly fallback) */
.bottombar{position:fixed;bottom:0;left:0;right:0;height:64px;background:rgba(255,255,255,.95);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-top:1px solid #E5E5EA;display:flex;align-items:center;justify-content:center;gap:12px;padding:0 16px;z-index:100}
.bb-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;font-size:14px;font-weight:700;padding:10px 18px;border-radius:9999px;cursor:pointer;font-family:inherit;border:none;letter-spacing:-.2px}
.bb-back{background:#F2F2F7;color:#007AFF;flex:1;max-width:180px}
.bb-print{background:#007AFF;color:#fff;flex:1;max-width:200px}
</style></head><body>
<div class="topbar">
  <button class="topbar-back" onclick="window.close()" aria-label="Voltar para o app">‹ Voltar para o app</button>
  <div class="topbar-title">${esc(show.name)}</div>
  <button class="topbar-print" onclick="window.print()" aria-label="Imprimir / Salvar PDF">🖨️ Imprimir</button>
</div>

<div class="wrap">

<div class="hero">
  <div class="hero-badge">⚡ ROTEIRO DO SHOW</div>
  <div class="hero-name">${esc(show.name)}</div>
  <div class="hero-meta">${esc(show.contratante)}${show.contratantePhone ? ` · ${esc(show.contratantePhone)}` : ''}${show.city ? ` · ${esc(show.city)}` : ''}</div>
  <div class="hero-grid">
    <div><div class="hero-col-lbl">DATA</div><div class="hero-col-val">${esc(show.date)}</div></div>
    <div><div class="hero-col-lbl">SHOW</div><div class="hero-col-val">${esc(show.time)}</div></div>
    ${show.departureTimeMeetingShow ? `<div><div class="hero-col-lbl">PONTO</div><div class="hero-col-val">${esc(show.departureTimeMeetingShow)}</div></div>` : '<div></div>'}
  </div>
</div>

<div class="sec">
  <div class="sec-title">📍 Local</div>
  <div class="row"><span class="lbl">Local</span><span class="val">${esc(show.venue)}</span></div>
  ${show.venueAddress ? `<div class="row"><span class="lbl">Endereço</span><span class="val">${esc(show.venueAddress)}</span></div>` : ''}
  ${show.city ? `<div class="row"><span class="lbl">Cidade</span><span class="val">${esc(show.city)}</span></div>` : ''}
</div>

${show.hasAirplane ? `<div class="sec">
  <div class="sec-title">✈️ Voo</div>
  ${show.airportName ? `<div class="row"><span class="lbl">Aeroporto</span><span class="val">${esc(show.airportName)}</span></div>` : ''}
  ${show.flightNumber ? `<div class="row"><span class="lbl">Nº do voo</span><span class="val">${esc(show.flightNumber)}</span></div>` : ''}
  ${show.flightDate ? `<div class="row"><span class="lbl">Data do voo</span><span class="val">${esc(show.flightDate)}</span></div>` : ''}
  ${show.flightTime ? `<div class="row"><span class="lbl">Horário</span><span class="val">${esc(show.flightTime)}</span></div><div class="boarding">🛫 Embarque: ${fl(show.flightTime, 45)} &nbsp;•&nbsp; 🧳 Despacho: ${fl(show.flightTime, 120)}</div>` : ''}
  ${(show.flightLocators ?? []).map((loc, i) => `<div class="card">
    <div class="card-hdr"><span class="card-lbl">Localizador ${i + 1}</span><span class="code">${esc(loc.code)}</span></div>
    ${loc.isNewFlight ? `
      ${loc.airline ? `<div class="row"><span class="lbl">Companhia</span><span class="val">${esc(loc.airline)}${loc.flightNumberLocator ? ` · ${esc(loc.flightNumberLocator)}` : ''}</span></div>` : ''}
      ${(loc.origin || loc.destination) ? `<div class="row"><span class="lbl">Rota</span><span class="val">${al(loc.origin) || '—'} → ${al(loc.destination) || '—'}</span></div>` : ''}
      ${loc.flightDate ? `<div class="row"><span class="lbl">Data</span><span class="val">${esc(loc.flightDate)}</span></div>` : ''}
      ${loc.flightTimeLocator ? `<div class="row"><span class="lbl">Horário</span><span class="val">${esc(loc.flightTimeLocator)}</span></div><div class="boarding">🛫 Embarque: ${fl(loc.flightTimeLocator, 45)} &nbsp;•&nbsp; 🧳 Despacho: ${fl(loc.flightTimeLocator, 120)}</div>` : ''}
    ` : ''}
    ${loc.passengers.filter(Boolean).map(p => `<div class="pax">• ${esc(p)}</div>`).join('')}
  </div>`).join('')}
</div>` : ''}

${show.hasHotel ? `<div class="sec">
  <div class="sec-title">🏨 Hotel</div>
  ${show.hotelName ? `<div class="row"><span class="lbl">Hotel</span><span class="val">${esc(show.hotelName)}</span></div>` : ''}
  ${show.hotelAddress ? `<div class="row"><span class="lbl">Endereço</span><span class="val">${esc(show.hotelAddress)}</span></div>` : ''}
  ${(show.hotelRooms ?? []).map((room, i) => `<div class="card">
    <div class="card-hdr"><span class="card-lbl">🛏️ Quarto ${i + 1}${room.roomNumber ? ` · Nº ${esc(room.roomNumber)}` : ''}</span><span class="badge">${room.type === 'single' ? 'Single' : room.type === 'double' ? 'Duplo' : 'Triplo'}</span></div>
    ${room.passengers.filter(Boolean).map(p => `<div class="pax">• ${esc(p)}</div>`).join('')}
  </div>`).join('')}
</div>` : ''}

${show.hasVan ? `<div class="sec">
  <div class="sec-title">🚐 Van / Transfer</div>
  ${show.vanDriverName ? `<div class="row"><span class="lbl">Motorista</span><span class="val">${esc(show.vanDriverName)}</span></div>` : ''}
  ${show.vanDriverPhone ? `<div class="row"><span class="lbl">Telefone</span><span class="val">${esc(show.vanDriverPhone)}</span></div>` : ''}
  ${show.vanColor ? `<div class="row"><span class="lbl">Cor</span><span class="val">${esc(show.vanColor)}</span></div>` : ''}
  ${show.vanPlate ? `<div class="row"><span class="lbl">Placa</span><span class="val">${esc(show.vanPlate)}</span></div>` : ''}
</div>` : ''}

${(show.departureTimeMeetingShow || show.departureTimeHotelShow || show.departureTimeHotelAirport || show.distanceAirportHotel || show.distanceHotelShow || show.distanceAirportShow) ? `<div class="sec">
  <div class="sec-title">📏 Distâncias &amp; Saídas</div>
  ${show.departureTimeMeetingShow ? `<div class="row"><span class="lbl">📍 Ponto de encontro</span><span class="val val-accent">${esc(show.departureTimeMeetingShow)}</span></div>` : ''}
  ${show.distanceAirportHotel ? `<div class="row"><span class="lbl">Aeroporto → Hotel</span><span class="val">${esc(show.distanceAirportHotel)}</span></div>` : ''}
  ${show.distanceHotelShow ? `<div class="row"><span class="lbl">Hotel → Show</span><span class="val">${esc(show.distanceHotelShow)}</span></div>` : ''}
  ${show.distanceAirportShow ? `<div class="row"><span class="lbl">Aeroporto → Show</span><span class="val">${esc(show.distanceAirportShow)}</span></div>` : ''}
  ${show.departureTimeHotelShow ? `<div class="row"><span class="lbl">Saída do hotel (show)</span><span class="val">${esc(show.departureTimeHotelShow)}</span></div>` : ''}
  ${show.departureTimeHotelAirport ? `<div class="row"><span class="lbl">Saída do hotel (aeroporto)</span><span class="val">${esc(show.departureTimeHotelAirport)}</span></div>` : ''}
</div>` : ''}

${(show.importantContacts && show.importantContacts.length > 0) || show.contratantePhone ? `<div class="sec">
  <div class="sec-title">📞 Contatos</div>
  ${show.contratantePhone ? `<div class="row"><span class="lbl">${esc(show.contratante)} · Contratante</span><span class="val">${esc(show.contratantePhone)}</span></div>` : ''}
  ${(show.importantContacts ?? []).map(c => `<div class="row"><span class="lbl">${esc(c.name)} · ${esc(c.role)}</span><span class="val">${c.phone ? esc(c.phone) : '—'}</span></div>`).join('')}
</div>` : ''}

${remTotal > 0 ? `<div class="sec">
  <div class="sec-title">🔔 Lembretes <span class="progress-pill">${remDone}/${remTotal}</span></div>
  ${(show.reminders ?? []).map(r => `<div class="check-row"><div class="cb ${r.done ? 'cb-done' : ''}">${r.done ? '✓' : ''}</div><span class="rt ${r.done ? 'rt-done' : ''}">${esc(r.text)}</span></div>`).join('')}
</div>` : ''}

${matTotal > 0 ? `<div class="sec">
  <div class="sec-title">🎛️ Check de material <span class="progress-pill">${matDone}/${matTotal}</span></div>
  ${(show.materials ?? []).map(m => `<div class="check-row"><div class="cb ${m.checked ? 'cb-done' : ''}">${m.checked ? '✓' : ''}</div><span class="rt ${m.checked ? 'rt-done' : ''}">${esc(m.name)}</span></div>`).join('')}
</div>` : ''}

${show.notes ? `<div class="sec"><div class="sec-title">📝 Notas</div><p style="font-size:13px;line-height:1.6;color:#1A1A2E">${esc(show.notes)}</p></div>` : ''}

</div>

<div class="bottombar">
  <button class="bb-btn bb-back" onclick="window.close()">‹ Voltar para o app</button>
  <button class="bb-btn bb-print" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
</div>

</body></html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

function buildTeamHTML(show: Show, returnFlightShow: Show | null | undefined, isShare: boolean): string {
  const fl = (t: string, m: number) => flightSubtract(t, m);
  const al = (iata?: string) => esc(airportLabel(iata));
  const city = (iata?: string) => esc(airportCity(iata) || iata || '');

  const withDay = (dateStr?: string): string => {
    if (!dateStr) return '';
    try {
      const d = parseISO(dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00');
      const day = format(d, 'EEEE', { locale: ptBR });
      return `${esc(dateStr)} · ${day.charAt(0).toUpperCase() + day.slice(1)}`;
    } catch { return esc(dateStr); }
  };

  const shortDay = (dateStr?: string): string => {
    if (!dateStr) return '—';
    try {
      const d = parseISO(dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00');
      return format(d, "dd/MM · EEE", { locale: ptBR });
    } catch { return esc(dateStr); }
  };

  const showId = esc(show.id ?? show.name);
  const wazeVenue = show.venueAddress
    ? `https://waze.com/ul?q=${encodeURIComponent(show.venueAddress)}&navigate=yes`
    : show.venue ? `https://waze.com/ul?q=${encodeURIComponent(show.venue + (show.city ? ', ' + show.city : ''))}&navigate=yes` : '';
  const wazeHotel = show.hotelAddress ? `https://waze.com/ul?q=${encodeURIComponent(show.hotelAddress)}&navigate=yes` : '';

  // ── Flight section builder (shared for IDA and VOLTA) ───────────────────
  const buildFlightSection = (s: Show, label: string) => {
    if (!s.hasAirplane) return '';
    if (!s.hasEscala) {
      // Voo Direto
      const hasGrid = s.airportName || s.airportDestination || s.flightDate || s.flightArrivalDate;
      return `
      <div class="sec flight-sec">
        <div class="sec-title">✈️ ${esc(label)}</div>
        ${s.flightNumber ? `<div class="flight-number">VOO <span>${esc(s.flightNumber)}</span></div>` : ''}
        ${hasGrid ? `
        <div class="leg-grid">
          <div class="leg-col">
            <div class="leg-tag">PARTIDA</div>
            <div class="leg-city">${city(s.airportName)}</div>
            ${s.airportName ? `<div class="leg-iata">${esc(s.airportName)}</div>` : ''}
            <div class="leg-date">${shortDay(s.flightDate)}</div>
            <div class="leg-time ${s.flightTime ? '' : 'muted'}">${s.flightTime ? esc(s.flightTime) : '--:--'}</div>
          </div>
          <div class="leg-arrow">→</div>
          <div class="leg-col">
            <div class="leg-tag">CHEGADA</div>
            <div class="leg-city">${city(s.airportDestination)}</div>
            ${s.airportDestination ? `<div class="leg-iata">${esc(s.airportDestination)}</div>` : ''}
            <div class="leg-date">${shortDay(s.flightArrivalDate || s.flightDate)}</div>
            <div class="leg-time arrival ${s.flightArrivalTime ? '' : 'muted'}">${s.flightArrivalTime ? esc(s.flightArrivalTime) : '--:--'}</div>
          </div>
        </div>` : ''}
        ${s.flightTime ? `<div class="boarding-banner">
          <span class="boarding-cell">🛫 Embarque: <strong>${fl(s.flightTime, 45)}</strong></span>
          <span class="boarding-cell">🧳 Despacho: <strong>${fl(s.flightTime, 120)}</strong></span>
        </div>` : ''}
        ${(s.flightLocators ?? []).map((loc, i) => `
        <div class="loc-card">
          <div class="loc-hdr">
            <span class="loc-label">Localizador ${i + 1}</span>
            <span class="loc-code">${esc(loc.code)}</span>
          </div>
          ${loc.isNewFlight ? `<div class="loc-meta">
            ${loc.airline ? `<div class="row"><span class="lbl">Companhia</span><span class="val">${esc(loc.airline)}${loc.flightNumberLocator ? ` · ${esc(loc.flightNumberLocator)}` : ''}</span></div>` : ''}
            ${(loc.origin || loc.destination) ? `<div class="row"><span class="lbl">Rota</span><span class="val">${al(loc.origin) || '—'} → ${al(loc.destination) || '—'}</span></div>` : ''}
            ${loc.flightDate ? `<div class="row"><span class="lbl">Data</span><span class="val">${withDay(loc.flightDate)}</span></div>` : ''}
            ${loc.flightTimeLocator ? `<div class="boarding-banner" style="margin:8px 0 0"><span class="boarding-cell">🛫 Embarque: <strong>${fl(loc.flightTimeLocator, 45)}</strong></span><span class="boarding-cell">🧳 Despacho: <strong>${fl(loc.flightTimeLocator, 120)}</strong></span></div>` : ''}
          </div>` : ''}
          <div class="pax-list">${loc.passengers.filter(Boolean).map(p => `<div class="pax-row">• ${esc(p)}</div>`).join('') || '<div class="pax-row muted">Nenhum passageiro</div>'}</div>
        </div>`).join('')}
      </div>`;
    } else {
      // Voo com Escala — timeline
      const legs = s.flightLegs ?? [];
      if (!legs.length) return '';
      const origin = legs[0]?.origin;
      const dest = legs[legs.length - 1]?.destination;
      return `
      <div class="sec flight-sec">
        <div class="sec-title">✈️ ${esc(label)} <span class="escala-badge">COM ESCALA</span></div>
        <div class="route-header">${al(origin) || '—'} → ${al(dest) || '—'}</div>
        <div class="tl">
          <div class="tl-node origin"><span class="tl-dot">○</span><span class="tl-airport">${esc(origin || '')}</span></div>
          <div class="tl-line"></div>
          ${legs.map((leg, li) => {
            const isLast = li === legs.length - 1;
            const nextLeg = !isLast ? legs[li + 1] : null;
            const layover = nextLeg ? calcLayover(leg.arrivalDate, leg.arrivalTime ?? '', nextLeg.date, nextLeg.time ?? '') : null;
            return `
          <div class="leg-card">
            ${leg.airline || leg.flightNumber ? `<div class="leg-badge">${leg.airline ? esc(leg.airline) : ''}${leg.airline && leg.flightNumber ? ' · ' : ''}${leg.flightNumber ? esc(leg.flightNumber) : ''}</div>` : ''}
            <div class="leg-grid">
              <div class="leg-col">
                <div class="leg-tag">PARTIDA</div>
                <div class="leg-city">${city(leg.origin)}</div>
                ${leg.origin ? `<div class="leg-iata">${esc(leg.origin)}</div>` : ''}
                <div class="leg-date">${shortDay(leg.date)}</div>
                <div class="leg-time ${leg.time ? '' : 'muted'}">${leg.time ? esc(leg.time) : '--:--'}</div>
              </div>
              <div class="leg-arrow">→</div>
              <div class="leg-col">
                <div class="leg-tag">CHEGADA</div>
                <div class="leg-city">${city(leg.destination)}</div>
                ${leg.destination ? `<div class="leg-iata">${esc(leg.destination)}</div>` : ''}
                <div class="leg-date">${shortDay(leg.arrivalDate || leg.date)}</div>
                <div class="leg-time arrival ${leg.arrivalTime ? '' : 'muted'}">${leg.arrivalTime ? esc(leg.arrivalTime) : '--:--'}</div>
              </div>
            </div>
            ${leg.time ? `<div class="boarding-banner"><span class="boarding-cell">🛫 Embarque: <strong>${fl(leg.time, 45)}</strong></span><span class="boarding-cell">🧳 Despacho: <strong>${fl(leg.time, 120)}</strong></span></div>` : ''}
            ${leg.localizadores.map((loc, i) => `
            <div class="loc-card" style="margin-top:10px">
              <div class="loc-hdr"><span class="loc-label">Localizador ${i + 1}</span><span class="loc-code">${esc(loc.code)}</span></div>
              <div class="pax-list">${loc.passengers.filter(Boolean).map(p => `<div class="pax-row">• ${esc(p)}</div>`).join('') || '<div class="pax-row muted">—</div>'}</div>
            </div>`).join('')}
          </div>
          <div class="tl-line"></div>
          ${layover ? `<div class="layover-banner">⏱ CONEXÃO <strong>${layover}</strong> em ${city(leg.destination) || esc(leg.destination)}</div><div class="tl-line"></div>` : ''}
          ${!isLast ? `<div class="tl-node mid"><span class="tl-dot">◈</span><span class="tl-airport">${esc(leg.destination || '')}</span></div><div class="tl-line"></div>` : ''}
          `;
          }).join('')}
          <div class="tl-node dest"><span class="tl-dot">●</span><span class="tl-airport">${esc(dest || '')}</span></div>
        </div>
      </div>`;
    }
  };

  const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(show.name)} — Equipe</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
:root{
  --blue:#0A84FF;--blue-light:#E5F0FF;--blue-dark:#0060CC;
  --ink:#0A0F1A;--ink2:#3C3C50;--ink3:#6E6E82;
  --surface:#FFFFFF;--bg:#F0F2F8;--border:#E4E6EF;
  --green:#30D158;--green-bg:#F0FDF4;--green-border:#BBF7D0;
  --orange:#FF9F0A;--orange-bg:#FFF7E6;
  --purple:#BF5AF2;--purple-bg:#F5EEFF;
}
html,body{background:var(--bg);min-height:100vh}
body{font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif;color:var(--ink);font-size:14px;line-height:1.55;padding-top:64px;padding-bottom:88px}
.wrap{max-width:760px;margin:0 auto;padding:20px 16px 32px}

/* ── Topbar ── */
.topbar{position:fixed;top:0;left:0;right:0;height:56px;background:rgba(255,255,255,.96);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-bottom:1.5px solid var(--border);display:flex;align-items:center;padding:0 16px;gap:10px;z-index:200}
.tb-back{display:inline-flex;align-items:center;gap:5px;background:var(--bg);border:none;color:var(--blue);font-size:14px;font-weight:700;padding:7px 14px;border-radius:99px;cursor:pointer;font-family:inherit;letter-spacing:-.2px}
.tb-back:hover{background:#E2E5EF}
.tb-title{flex:1;text-align:center;font-size:15px;font-weight:800;color:var(--ink);letter-spacing:-.4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 8px}
.tb-print{display:inline-flex;align-items:center;gap:6px;background:var(--blue);border:none;color:#fff;font-size:13px;font-weight:800;padding:7px 16px;border-radius:99px;cursor:pointer;font-family:inherit;letter-spacing:-.1px;white-space:nowrap}
.tb-print:hover{background:var(--blue-dark)}

/* ── Bottombar ── */
.bottombar{position:fixed;bottom:0;left:0;right:0;height:68px;background:rgba(255,255,255,.96);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-top:1.5px solid var(--border);display:flex;align-items:center;justify-content:center;gap:10px;padding:0 16px;z-index:200}
.bb-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;font-size:14px;font-weight:800;padding:11px 22px;border-radius:99px;cursor:pointer;font-family:inherit;border:none;letter-spacing:-.2px}
.bb-back{background:var(--bg);color:var(--blue);flex:1;max-width:180px}
.bb-print{background:var(--blue);color:#fff;flex:1;max-width:220px}

/* ── Print ── */
@media print{
  .topbar,.bottombar,.confirm-sec,.no-print{display:none!important}
  body{padding-top:0;padding-bottom:0;background:#fff}
  .wrap{max-width:100%;padding:0}
  .hero{border-radius:0;margin-bottom:16px}
  .sec,.flight-sec{page-break-inside:avoid;margin-bottom:10px}
  .leg-card{page-break-inside:avoid}
}

/* ── Hero ── */
.hero{background:linear-gradient(140deg,#0A1628 0%,#0D2E5C 55%,#1A1F6E 100%);color:#fff;border-radius:20px;padding:28px 24px 22px;margin-bottom:16px;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;top:-60px;right:-60px;width:220px;height:220px;background:radial-gradient(circle,rgba(10,132,255,.25) 0%,transparent 70%);pointer-events:none;z-index:0}
.hero::after{content:'';position:absolute;bottom:-40px;left:-40px;width:180px;height:180px;background:radial-gradient(circle,rgba(10,132,255,.12) 0%,transparent 70%);pointer-events:none;z-index:0}
.hero-badge{display:inline-flex;align-items:center;gap:6px;background:rgba(10,132,255,.35);border:1px solid rgba(10,132,255,.5);font-size:10px;font-weight:900;letter-spacing:2px;padding:5px 12px;border-radius:99px;margin-bottom:14px;text-transform:uppercase;position:relative;z-index:1}
.hero-name{font-size:28px;font-weight:900;letter-spacing:-.8px;line-height:1.1;text-align:center;margin-bottom:5px;position:relative;z-index:1}
.hero-city{font-size:14px;opacity:.85;text-align:center;font-weight:500;margin-bottom:18px;position:relative;z-index:1}
.hero-divider{height:1px;background:rgba(255,255,255,.15);margin-bottom:16px;position:relative;z-index:1}
.hero-cols{display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;position:relative;z-index:1}
.hero-col{text-align:center;padding:4px 8px;border-right:1px solid rgba(255,255,255,.15)}
.hero-col:last-child{border-right:none}
.hc-lbl{font-size:9px;font-weight:900;letter-spacing:1.8px;opacity:.55;text-transform:uppercase;margin-bottom:5px}
.hc-val{font-size:17px;font-weight:900;letter-spacing:-.5px;line-height:1.1}
.hc-sub{font-size:11px;opacity:.65;margin-top:3px;font-weight:500}

/* ── Section cards ── */
.sec{background:var(--surface);border-radius:16px;padding:18px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,.07),0 1px 8px rgba(0,0,0,.04)}
.sec-title{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:1.4px;color:var(--ink3);margin-bottom:14px;display:flex;align-items:center;gap:6px}
.flight-sec{background:var(--surface);border-radius:16px;padding:18px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,.07),0 1px 8px rgba(0,0,0,.04)}

/* ── Table rows ── */
.row{display:flex;align-items:flex-start;gap:10px;margin-bottom:8px;font-size:13px}
.row:last-child{margin-bottom:0}
.lbl{color:var(--ink3);min-width:120px;flex-shrink:0;font-size:12px;font-weight:500}
.val{font-weight:700;color:var(--ink);flex:1}
.val-accent{color:var(--orange);font-weight:900;font-size:15px}
.val-time{color:var(--blue);font-weight:900;font-size:18px;letter-spacing:-.5px}

/* ── Waze button ── */
.waze-btn{display:inline-flex;align-items:center;gap:5px;background:#00BCD4;color:#fff;text-decoration:none;font-size:12px;font-weight:800;padding:6px 14px;border-radius:99px;margin-top:10px;letter-spacing:-.1px}
.waze-btn:hover{opacity:.85}

/* ── Flight: number ── */
.flight-number{font-size:13px;font-weight:700;color:var(--ink3);letter-spacing:.5px;margin-bottom:10px}
.flight-number span{font-size:20px;font-weight:900;color:var(--blue);letter-spacing:1px;margin-left:4px}
.escala-badge{background:var(--purple-bg);color:var(--purple);font-size:9px;font-weight:900;letter-spacing:1.5px;padding:3px 8px;border-radius:99px;vertical-align:middle}
.route-header{font-size:13px;font-weight:700;color:var(--ink2);margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid var(--border)}

/* ── Leg grid (PARTIDA → CHEGADA) ── */
.leg-grid{display:flex;align-items:flex-start;gap:12px;margin:12px 0 10px}
.leg-col{flex:1;min-width:0}
.leg-tag{font-size:9px;font-weight:900;letter-spacing:2px;text-transform:uppercase;color:var(--ink3);margin-bottom:5px}
.leg-city{font-size:16px;font-weight:900;letter-spacing:-.4px;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.leg-iata{font-size:11px;font-weight:800;letter-spacing:1.5px;color:var(--ink3);margin-top:2px}
.leg-date{font-size:11px;font-weight:600;color:var(--ink3);margin-top:6px}
.leg-time{font-size:24px;font-weight:900;letter-spacing:-.8px;color:var(--blue);margin-top:2px;line-height:1}
.leg-time.arrival{color:var(--ink)}
.leg-time.muted{color:var(--border);font-size:20px}
.leg-arrow{font-size:22px;color:var(--border);align-self:center;flex-shrink:0;margin-top:8px;font-weight:300}

/* ── Leg card (inside timeline) ── */
.leg-card{background:#F7F9FF;border:1.5px solid var(--border);border-radius:12px;padding:14px 14px 12px;margin:6px 0}
.leg-badge{display:inline-block;background:var(--blue-light);color:var(--blue);font-size:11px;font-weight:800;letter-spacing:.5px;padding:3px 10px;border-radius:99px;margin-bottom:10px}

/* ── Boarding banner ── */
.boarding-banner{background:var(--blue-light);border-radius:10px;padding:10px 14px;display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:8px 0 4px}
.boarding-cell{font-size:13px;font-weight:700;color:var(--blue);white-space:nowrap}

/* ── Layover banner ── */
.layover-banner{background:var(--orange-bg);border:1.5px solid var(--orange);border-radius:10px;padding:10px 16px;text-align:center;font-size:13px;font-weight:700;color:var(--orange);margin:8px 0;letter-spacing:-.1px}
.layover-banner strong{font-size:16px;letter-spacing:-.4px}

/* ── Timeline ── */
.tl{position:relative;padding-left:0}
.tl-node{display:flex;align-items:center;gap:10px;padding:6px 0}
.tl-dot{font-size:20px;color:var(--blue);width:24px;text-align:center;flex-shrink:0;line-height:1}
.tl-node.origin .tl-dot{color:var(--green)}
.tl-node.dest .tl-dot{color:var(--orange)}
.tl-node.mid .tl-dot{color:var(--purple)}
.tl-airport{font-size:13px;font-weight:800;color:var(--ink);letter-spacing:.5px}
.tl-line{width:1px;height:20px;background:var(--border);margin-left:11px}

/* ── Localizador card ── */
.loc-card{background:var(--bg);border:1.5px solid var(--border);border-radius:10px;overflow:hidden;margin-top:10px}
.loc-hdr{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--surface);border-bottom:1px solid var(--border)}
.loc-label{font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:1.2px;color:var(--ink3)}
.loc-code{font-size:20px;font-weight:900;color:var(--blue);letter-spacing:2px}
.loc-meta{padding:10px 14px 4px;border-bottom:1px solid var(--border)}
.pax-list{padding:10px 14px}
.pax-row{font-size:13px;font-weight:600;color:var(--ink);padding:3px 0}
.pax-row.muted{color:var(--ink3)}

/* ── Hotel rooms ── */
.rooms-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;margin-top:12px}
.room-card{background:var(--bg);border:1.5px solid var(--border);border-radius:12px;overflow:hidden}
.room-card-hdr{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:var(--surface);border-bottom:1px solid var(--border)}
.room-num{font-size:13px;font-weight:800;color:var(--ink)}
.room-type{font-size:10px;font-weight:900;letter-spacing:.8px;text-transform:uppercase;padding:3px 9px;border-radius:99px}
.room-type.single{background:#FFF4F4;color:#D9534F}
.room-type.double{background:#EEF4FF;color:var(--blue)}
.room-type.triple{background:var(--purple-bg);color:var(--purple)}
.room-pax{padding:10px 12px}
.room-pax-item{font-size:13px;font-weight:600;color:var(--ink);padding:2px 0}
.mala-badge{display:inline-flex;align-items:center;gap:5px;background:var(--green-bg);border:1.5px solid var(--green-border);color:#166534;font-size:11px;font-weight:800;padding:5px 12px;border-radius:99px;margin-bottom:12px}

/* ── Van ── */
.van-plate{font-size:22px;font-weight:900;letter-spacing:2px;color:var(--purple);background:var(--purple-bg);display:inline-block;padding:6px 16px;border-radius:8px;margin:4px 0}
.departure-row{display:flex;align-items:center;gap:12px;background:var(--bg);border-radius:10px;padding:12px 14px;margin-top:8px}
.dep-icon{font-size:20px;flex-shrink:0}
.dep-info{flex:1;min-width:0}
.dep-lbl{font-size:10px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase;color:var(--ink3);margin-bottom:2px}
.dep-time{font-size:20px;font-weight:900;letter-spacing:-.5px;color:var(--orange)}
.dep-dist{font-size:12px;font-weight:600;color:var(--ink3);margin-top:2px}

/* ── Confirm ── */
.confirm-sec{background:var(--surface);border-radius:16px;padding:18px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,.07)}
.confirm-title{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:1.4px;color:var(--ink3);margin-bottom:14px}
.confirm-form{display:flex;gap:8px;margin-bottom:12px}
.confirm-input{flex:1;border:1.5px solid var(--border);border-radius:99px;padding:10px 16px;font-size:14px;font-family:inherit;outline:none;color:var(--ink);background:var(--bg)}
.confirm-input:focus{border-color:var(--blue);background:#fff}
.confirm-btn{background:var(--blue);color:#fff;border:none;border-radius:99px;padding:10px 20px;font-size:14px;font-weight:800;cursor:pointer;font-family:inherit;white-space:nowrap}
.confirm-btn:hover{background:var(--blue-dark)}
.confirm-list{list-style:none;display:flex;flex-direction:column;gap:6px}
.confirm-item{display:flex;align-items:center;gap:8px;background:var(--green-bg);border:1.5px solid var(--green-border);border-radius:10px;padding:9px 14px;font-size:13px;font-weight:700;color:#166534}
.confirm-item-time{font-size:11px;color:#4ADE80;margin-left:auto;font-weight:600}
.confirm-empty{color:var(--ink3);font-size:13px;text-align:center;padding:10px 0}

/* ── Return flight divider ── */
.volta-divider{display:flex;align-items:center;gap:12px;margin:16px 0 12px}
.volta-divider-line{flex:1;height:1px;background:var(--border)}
.volta-divider-label{font-size:10px;font-weight:900;letter-spacing:2px;color:var(--ink3);text-transform:uppercase;white-space:nowrap}
.muted{color:var(--ink3)}
</style></head><body>

<div class="topbar">
  ${!isShare ? `<button class="tb-back" onclick="window.close()">‹ Voltar</button>` : '<div style="width:80px"></div>'}
  <div class="tb-title">${esc(show.name)}</div>
  <button class="tb-print" onclick="window.print()">🖨 Imprimir</button>
</div>

<div class="wrap">

<!-- HERO -->
<div class="hero">
  <div style="text-align:center">
    <div class="hero-badge">👥 ROTEIRO DA EQUIPE</div>
  </div>
  <div class="hero-name">${esc(show.name)}</div>
  ${show.city ? `<div class="hero-city">${esc(show.city)}${show.venue ? ` · ${esc(show.venue)}` : ''}</div>` : show.venue ? `<div class="hero-city">${esc(show.venue)}</div>` : ''}
  <div class="hero-divider"></div>
  <div class="hero-cols">
    <div class="hero-col">
      <div class="hc-lbl">📅 Data</div>
      <div class="hc-val">${show.date ? esc(show.date.split('-').reverse().join('/')) : '—'}</div>
      ${show.date ? `<div class="hc-sub">${(() => { try { return format(parseISO(show.date + 'T12:00:00'), 'EEEE', { locale: ptBR }); } catch { return ''; } })()}</div>` : ''}
    </div>
    <div class="hero-col">
      <div class="hc-lbl">🎤 Show</div>
      <div class="hc-val">${show.time ? esc(show.time) : '—'}</div>
    </div>
    <div class="hero-col">
      <div class="hc-lbl">📍 Encontro</div>
      <div class="hc-val">${show.departureTimeMeetingShow ? esc(show.departureTimeMeetingShow) : show.departureTimeHotelShow ? esc(show.departureTimeHotelShow) : '—'}</div>
      ${show.departureTimeMeetingShow && show.departureTimeHotelShow ? `<div class="hc-sub">Hotel: ${esc(show.departureTimeHotelShow)}</div>` : ''}
    </div>
  </div>
</div>

<!-- LOCAL -->
<div class="sec">
  <div class="sec-title">📍 Local do Show</div>
  <div class="row"><span class="lbl">Local</span><span class="val">${esc(show.venue)}</span></div>
  ${show.venueAddress ? `<div class="row"><span class="lbl">Endereço</span><span class="val">${esc(show.venueAddress)}</span></div>` : ''}
  ${show.city ? `<div class="row"><span class="lbl">Cidade</span><span class="val">${esc(show.city)}</span></div>` : ''}
  ${show.departureTimeMeetingShow ? `<div class="row"><span class="lbl">🏁 Ponto de encontro</span><span class="val val-time">${esc(show.departureTimeMeetingShow)}</span></div>` : ''}
  ${wazeVenue ? `<a href="${wazeVenue}" target="_blank" class="waze-btn">🗺️ Abrir no Waze</a>` : ''}
</div>

${buildFlightSection(show, 'Voo de Ida')}

${returnFlightShow ? `
<div class="volta-divider">
  <div class="volta-divider-line"></div>
  <div class="volta-divider-label">✈️ Voo de Volta — ${esc(returnFlightShow.name)}</div>
  <div class="volta-divider-line"></div>
</div>
${buildFlightSection(returnFlightShow, 'Voo de Volta')}` : ''}

${show.hasHotel ? `<div class="sec">
  <div class="sec-title">🏨 Hotel</div>
  ${show.hotelName ? `<div class="row"><span class="lbl">Hotel</span><span class="val">${esc(show.hotelName)}</span></div>` : ''}
  ${show.hotelAddress ? `<div class="row"><span class="lbl">Endereço</span><span class="val">${esc(show.hotelAddress)}</span></div>` : ''}
  ${show.hotelMalaCuia ? `<div class="mala-badge">🧳 Mala na cuia — levar mala para o show</div>` : ''}
  ${wazeHotel ? `<a href="${wazeHotel}" target="_blank" class="waze-btn">🗺️ Abrir no Waze</a>` : ''}
  ${(show.hotelRooms ?? []).length > 0 ? `<div class="rooms-grid">${(show.hotelRooms ?? []).map((room, i) => `<div class="room-card">
    <div class="room-card-hdr">
      <span class="room-num">🛏 ${room.roomNumber ? `Nº ${esc(room.roomNumber)}` : `Quarto ${i + 1}`}</span>
      <span class="room-type ${room.type}">${room.type === 'single' ? 'Single' : room.type === 'double' ? 'Duplo' : 'Triplo'}</span>
    </div>
    <div class="room-pax">${room.passengers.filter(Boolean).map(p => `<div class="room-pax-item">• ${esc(p)}</div>`).join('') || '<div class="room-pax-item muted">Nenhum hóspede</div>'}</div>
  </div>`).join('')}</div>` : ''}
</div>` : ''}

${show.hasVan ? `<div class="sec">
  <div class="sec-title">🚐 Van / Transfer</div>
  ${show.vanDriverName ? `<div class="row"><span class="lbl">Motorista</span><span class="val">${esc(show.vanDriverName)}</span></div>` : ''}
  ${show.vanDriverPhone ? `<div class="row"><span class="lbl">Telefone</span><span class="val">${esc(show.vanDriverPhone)}</span></div>` : ''}
  ${show.vanColor ? `<div class="row"><span class="lbl">Cor</span><span class="val">${esc(show.vanColor)}</span></div>` : ''}
  ${show.vanPlate ? `<div class="row"><span class="lbl">Placa</span><span class="val van-plate">${esc(show.vanPlate)}</span></div>` : ''}
  ${(show.departureTimeHotelAirport || show.departureTimeHotelShow || show.departureTimeMeetingShow) ? `<div style="margin-top:14px;font-size:11px;font-weight:900;letter-spacing:1.4px;text-transform:uppercase;color:var(--ink3);margin-bottom:8px">HORÁRIOS DE SAÍDA</div>
  ${show.departureTimeMeetingShow ? `<div class="departure-row"><span class="dep-icon">📍</span><div class="dep-info"><div class="dep-lbl">Ponto de encontro → Show</div><div class="dep-time">${esc(show.departureTimeMeetingShow)}</div>${show.distanceMeetingShow ? `<div class="dep-dist">📏 ${esc(show.distanceMeetingShow)}</div>` : ''}</div></div>` : ''}
  ${show.departureTimeHotelShow ? `<div class="departure-row"><span class="dep-icon">🏨</span><div class="dep-info"><div class="dep-lbl">Hotel → Show</div><div class="dep-time">${esc(show.departureTimeHotelShow)}</div>${show.distanceHotelShow ? `<div class="dep-dist">📏 ${esc(show.distanceHotelShow)}</div>` : ''}</div></div>` : ''}
  ${show.departureTimeHotelAirport ? `<div class="departure-row"><span class="dep-icon">✈️</span><div class="dep-info"><div class="dep-lbl">Hotel → Aeroporto</div><div class="dep-time">${esc(show.departureTimeHotelAirport)}</div>${show.distanceAirportHotel ? `<div class="dep-dist">📏 ${esc(show.distanceAirportHotel)}</div>` : ''}</div></div>` : ''}
  ` : ''}
</div>` : ''}

<!-- Confirmação de leitura -->
<div class="confirm-sec no-print">
  <div class="confirm-title">✅ Confirmação de leitura</div>
  <div class="confirm-form">
    <input id="confirm-name" class="confirm-input" type="text" placeholder="Seu nome..." autocomplete="off" />
    <button class="confirm-btn" onclick="confirmRead()">Confirmar ✓</button>
  </div>
  <ul class="confirm-list" id="confirm-list"></ul>
  <p class="confirm-empty" id="confirm-empty">Nenhuma confirmação ainda.</p>
</div>

</div><!-- /wrap -->

<div class="bottombar no-print">
  ${!isShare ? `<button class="bb-btn bb-back" onclick="window.close()">‹ Voltar</button>` : ''}
  <button class="bb-btn bb-print" onclick="window.print()">🖨 Imprimir / Salvar PDF</button>
</div>

<script>
var SHOW_KEY='schedule_read_${showId}';
function loadConfirmed(){try{var s=JSON.parse(localStorage.getItem(SHOW_KEY)||'[]');renderList(s);}catch(e){renderList([]);}}
function confirmRead(){var inp=document.getElementById('confirm-name');var name=inp.value.trim();if(!name){inp.focus();return;}try{var s=JSON.parse(localStorage.getItem(SHOW_KEY)||'[]');if(s.some(function(e){return e.name.toLowerCase()===name.toLowerCase();})){alert(name+' já confirmou! ✓');return;}s.push({name:name,time:new Date().toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})});localStorage.setItem(SHOW_KEY,JSON.stringify(s));renderList(s);inp.value='';inp.focus();}catch(e){}}
function renderList(entries){var list=document.getElementById('confirm-list');var empty=document.getElementById('confirm-empty');list.innerHTML='';if(!entries.length){empty.style.display='block';return;}empty.style.display='none';entries.forEach(function(e){var li=document.createElement('li');li.className='confirm-item';li.innerHTML='<span>✓ '+e.name.replace(/</g,'&lt;')+'</span><span class="confirm-item-time">'+e.time+'</span>';list.appendChild(li);});}
document.getElementById('confirm-name').addEventListener('keydown',function(ev){if(ev.key==='Enter')confirmRead();});
loadConfirmed();
</script>
</body></html>`;

  return html;
}

function exportTeamPDF(show: Show, returnFlightShow?: Show | null) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  const html = buildTeamHTML(show, returnFlightShow, false);
  const win = window.open('', '_blank');
  if (win) { win.document.write(html); win.document.close(); }
}

function generateTeamLink(show: Show): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/equipe.html?id=${encodeURIComponent(show.id)}`;
}

function generateArtistLink(show: Show): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/artista.html?id=${encodeURIComponent(show.id)}`;
}

function openWhatsApp(phone: string) {
  const clean = phone.replace(/\D/g, '');
  const number = clean.startsWith('55') ? clean : `55${clean}`;
  const url = `https://wa.me/${number}`;
  if (Platform.OS === 'web') {
    window.open(url, '_blank', 'noopener');
  } else {
    Linking.openURL(url);
  }
}

/**
 * Abre o endereço no Waze. Usa o universal link `waze.com/ul?q=...&navigate=yes`
 * — no mobile deep-linka direto pro app Waze instalado (cai num install prompt
 * se não tiver), e no desktop abre a versão web. `navigate=yes` já inicia a
 * rota automaticamente, sem o usuário ter que tocar em "Ir".
 */
function openWaze(address: string) {
  const q = encodeURIComponent(address.trim());
  if (!q) return;
  const url = `https://waze.com/ul?q=${q}&navigate=yes`;
  if (Platform.OS === 'web') {
    window.open(url, '_blank', 'noopener');
  } else {
    Linking.openURL(url);
  }
}

function copyTextSync(address: string): boolean {
  if (typeof document === 'undefined') return false;
  try {
    // iOS Safari exige editable + seleção via Range para execCommand('copy')
    // funcionar de fato — readonly e .select() retornam true mas não copiam nada.
    const ta = document.createElement('textarea');
    ta.value = address;
    ta.contentEditable = 'true';
    ta.readOnly = false;
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.left = '0';
    ta.style.width = '1px';
    ta.style.height = '1px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);

    const range = document.createRange();
    range.selectNodeContents(ta);
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
    ta.setSelectionRange(0, address.length);

    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    if (sel) sel.removeAllRanges();
    return ok;
  } catch {
    return false;
  }
}

function isIOSStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as any;
  if (nav.standalone === true) return true;
  try {
    return window.matchMedia('(display-mode: standalone)').matches;
  } catch {
    return false;
  }
}

function CopyAddressButton({ address, colors }: { address: string; colors: any }) {
  const [copied, setCopied] = useState(false);
  const [fallback, setFallback] = useState(false);
  const flashCopied = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // Web: renderizamos <button> DOM puro pra preservar a user-activation
  // que o iOS PWA exige para Clipboard / Web Share APIs.
  if (Platform.OS === 'web') {
    const btnStyle: React.CSSProperties = {
      width: 36,
      height: 36,
      padding: 0,
      marginLeft: 8,
      borderRadius: 8,
      borderWidth: 1.5,
      borderStyle: 'solid',
      borderColor: copied ? colors.success : colors.primary,
      backgroundColor: copied ? colors.successLight : colors.primaryLight,
      color: copied ? colors.success : colors.primary,
      fontSize: 16,
      lineHeight: '1',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxSizing: 'border-box',
      fontFamily: 'inherit',
      userSelect: 'none',
      WebkitTapHighlightColor: 'transparent',
      flexShrink: 0,
    };

    const tryShare = async (): Promise<boolean> => {
      const share = (navigator as any).share;
      if (typeof share !== 'function') return false;
      try {
        await share.call(navigator, { text: address, title: 'Endereço' });
        return true;
      } catch (err: any) {
        return err?.name === 'AbortError';
      }
    };

    const tryClipboard = async (): Promise<boolean> => {
      const writeText = (navigator as any).clipboard?.writeText;
      if (typeof writeText !== 'function') return false;
      try {
        await writeText.call((navigator as any).clipboard, address);
        return true;
      } catch {
        return false;
      }
    };

    const handleCopyDom = async () => {
      if (isIOSStandalone()) {
        if (await tryShare()) { flashCopied(); return; }
        if (await tryClipboard()) { flashCopied(); return; }
      } else {
        if (await tryClipboard()) { flashCopied(); return; }
        if (copyTextSync(address)) { flashCopied(); return; }
        if (await tryShare()) { flashCopied(); return; }
      }
      if (copyTextSync(address)) { flashCopied(); return; }
      setFallback(true);
    };

    const fallbackBtn: React.CSSProperties = {
      padding: '10px 14px',
      borderRadius: 10,
      borderWidth: 1.5,
      borderStyle: 'solid',
      fontSize: 14,
      fontWeight: 700,
      cursor: 'pointer',
      fontFamily: 'inherit',
      boxSizing: 'border-box',
    };

    return React.createElement(
      React.Fragment,
      null,
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: handleCopyDom,
          'aria-label': 'Copiar endereço',
          title: 'Copiar endereço',
          style: btnStyle,
        },
        copied ? '✓' : '📋'
      ),
      fallback && React.createElement(
        'div',
        {
          key: 'fb',
          role: 'dialog',
          'aria-modal': 'true',
          onClick: () => setFallback(false),
          style: {
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            zIndex: 9999,
          },
        },
        React.createElement(
          'div',
          {
            onClick: (e: any) => e.stopPropagation(),
            style: {
              background: colors.surface ?? '#fff',
              color: colors.text,
              borderRadius: 16,
              padding: 20,
              maxWidth: 420,
              width: '100%',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
              fontFamily: 'inherit',
            },
          },
          React.createElement(
            'div',
            { style: { fontSize: 16, fontWeight: 800, marginBottom: 4, color: colors.text } },
            'Copiar endereço'
          ),
          React.createElement(
            'div',
            { style: { fontSize: 13, color: colors.textMuted, marginBottom: 12 } },
            'Toque e segure no endereço abaixo e escolha "Copiar".'
          ),
          React.createElement('input', {
            ref: (el: HTMLInputElement | null) => {
              if (el) {
                el.focus();
                el.setSelectionRange(0, address.length);
              }
            },
            readOnly: true,
            value: address,
            onFocus: (e: any) => e.target.setSelectionRange(0, address.length),
            onClick: (e: any) => e.currentTarget.setSelectionRange(0, address.length),
            style: {
              width: '100%',
              padding: '12px 14px',
              fontSize: 16,
              borderRadius: 10,
              border: `1.5px solid ${colors.primary}`,
              background: colors.background ?? '#f4f4f4',
              color: colors.text,
              marginBottom: 14,
              boxSizing: 'border-box',
              fontFamily: 'inherit',
              userSelect: 'text',
              WebkitUserSelect: 'text',
            },
          }),
          React.createElement(
            'div',
            { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
            (navigator as any).share && React.createElement(
              'button',
              {
                key: 'share',
                type: 'button',
                onClick: async () => { if (await tryShare()) { flashCopied(); setFallback(false); } },
                style: { ...fallbackBtn, flex: 1, minWidth: 120, backgroundColor: colors.primary, borderColor: colors.primary, color: '#fff' },
              },
              '📤 Compartilhar'
            ),
            React.createElement(
              'button',
              {
                key: 'done',
                type: 'button',
                onClick: () => setFallback(false),
                style: { ...fallbackBtn, flex: 1, minWidth: 100, backgroundColor: 'transparent', borderColor: colors.border ?? colors.textMuted, color: colors.text },
              },
              'Fechar'
            ),
          ),
        ),
      ),
    );
  }

  // Nativo (iOS/Android app) — Share abre sheet com "Copiar" como opção
  const handleCopyNative = async () => {
    try { await Share.share({ message: address }); flashCopied(); }
    catch { Alert.alert('Copiar endereço', address); }
  };
  return (
    <TouchableOpacity
      style={[
        styles.copyIconBtn,
        { backgroundColor: copied ? colors.successLight : colors.primaryLight, borderColor: copied ? colors.success : colors.primary },
      ]}
      onPress={handleCopyNative}
      activeOpacity={0.8}
      accessibilityLabel="Copiar endereço"
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <Text style={[styles.copyIconBtnText, { color: copied ? colors.success : colors.primary }]}>
        {copied ? '✓' : '📋'}
      </Text>
    </TouchableOpacity>
  );
}

/** Botão circular azul (cor do Waze) que abre o endereço no Waze já navegando. */
function WazeButton({ address, colors }: { address: string; colors: any }) {
  const WAZE_BLUE = '#33CCFF';
  const WAZE_BG = 'rgba(51,204,255,0.12)';
  return (
    <TouchableOpacity
      style={[styles.copyIconBtn, { backgroundColor: WAZE_BG, borderColor: WAZE_BLUE }]}
      onPress={() => openWaze(address)}
      activeOpacity={0.7}
      accessibilityLabel="Abrir no Waze"
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <Text style={[styles.copyIconBtnText, { color: WAZE_BLUE }]}>🚗</Text>
    </TouchableOpacity>
  );
}

function InfoRow({ icon, label, value, onPress, copyable, colors }: { icon: string; label: string; value?: string; onPress?: () => void; copyable?: boolean; colors: any }) {
  if (!value) return null;
  return (
    <TouchableOpacity style={styles.infoRow} onPress={onPress} disabled={!onPress} activeOpacity={onPress ? 0.7 : 1}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View style={styles.infoContent}>
        {label ? <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{label}</Text> : null}
        <Text style={[styles.infoValue, { color: onPress ? colors.primary : colors.text }]}>{value}</Text>
      </View>
      {copyable && <CopyAddressButton address={value} colors={colors} />}
      {onPress && <Icon name="chevronRight" color={colors.textMuted} size={20} />}
    </TouchableOpacity>
  );
}

type TabKey = 'details' | 'timeline' | 'materials';

// ── Timeline ───────────────────────────────────────────────────────────────────

type TLEvent = {
  id: string;
  time: string | null;
  emoji: string;
  label: string;
  detail?: string;
  color: string;
  isMain?: boolean;
};

function buildTimeline(show: Show): TLEvent[] {
  const ev: TLEvent[] = [];

  if (show.departureTimeMeetingShow) {
    ev.push({ id: 'meeting', time: show.departureTimeMeetingShow, emoji: '📍', label: 'Ponto de encontro',
      detail: show.hasVan && show.vanDriverName ? `Van · ${show.vanDriverName}` : show.hasVan ? 'Van' : undefined,
      color: '#30D158' });
  }

  if (show.hasHotel && show.hasAirplane && show.departureTimeHotelAirport) {
    ev.push({ id: 'hotel-ap', time: show.departureTimeHotelAirport, emoji: '🏨',
      label: 'Saída hotel → aeroporto', detail: show.hotelName || undefined, color: '#FF9F0A' });
  }

  if (show.hasAirplane) {
    if (!show.hasEscala) {
      if (show.flightTime) {
        ev.push({ id: 'boarding', time: flightSubtract(show.flightTime, 45), emoji: '🎫',
          label: 'Embarque', detail: show.airportName || undefined, color: '#5E5CE6' });
        ev.push({ id: 'depart', time: show.flightTime, emoji: '🛫',
          label: show.flightNumber ? `Voo ${show.flightNumber}` : 'Decolagem',
          detail: [show.airportName, show.airportDestination].filter(Boolean).join(' → '), color: '#5E5CE6' });
      }
      if (show.flightArrivalTime) {
        ev.push({ id: 'arrive', time: show.flightArrivalTime, emoji: '🛬',
          label: 'Chegada', detail: show.airportDestination || undefined, color: '#5E5CE6' });
      }
    } else {
      (show.flightLegs ?? []).forEach((leg, i) => {
        const isFirst = i === 0;
        const isLast = i === (show.flightLegs?.length ?? 1) - 1;
        if (leg.time) {
          ev.push({ id: `leg-d${i}`, time: leg.time, emoji: isFirst ? '🛫' : '✈',
            label: leg.flightNumber ? `Voo ${leg.flightNumber}` : isFirst ? 'Decolagem' : `Trecho ${i + 1}`,
            detail: [leg.origin, leg.destination].filter(Boolean).join(' → '), color: '#5E5CE6' });
        }
        if (isLast && leg.arrivalTime) {
          ev.push({ id: `leg-a${i}`, time: leg.arrivalTime, emoji: '🛬',
            label: 'Chegada', detail: leg.destination || undefined, color: '#5E5CE6' });
        }
      });
    }
  }

  if (show.hasHotel && show.departureTimeHotelShow) {
    ev.push({ id: 'hotel-show', time: show.departureTimeHotelShow, emoji: '🚗',
      label: 'Saída para o show', detail: show.hotelName || undefined, color: '#FF9F0A' });
  }

  if (show.soundcheckTime) {
    ev.push({ id: 'soundcheck', time: show.soundcheckTime, emoji: '🎙', label: 'Soundcheck',
      color: '#00C7BE', isMain: true });
  }

  if (show.time) {
    const venueDetail = show.venue?.trim() !== show.name?.trim() ? show.venue : show.city;
    ev.push({ id: 'show', time: show.time, emoji: '🎤', label: show.name,
      detail: venueDetail || undefined, color: '#BF5AF2', isMain: true });
  }

  if (show.homeArrivalTime) {
    ev.push({ id: 'home', time: show.homeArrivalTime, emoji: '🏠',
      label: 'Chegada em casa', color: '#8E8E93' });
  }

  return ev.sort((a, b) => {
    if (!a.time && !b.time) return 0;
    if (!a.time) return 1;
    if (!b.time) return -1;
    return a.time.localeCompare(b.time);
  });
}

function NowMarker({ now }: { now: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4 }}>
      <View style={{ width: 52, paddingRight: 4, alignItems: 'flex-end' }}>
        <Text style={tlS.nowTime}>{now}</Text>
      </View>
      <View style={{ width: 30, alignItems: 'center' }}>
        <View style={tlS.nowDot} />
      </View>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 8 }}>
        <View style={tlS.nowLine} />
        <View style={tlS.nowBadge}>
          <Text style={tlS.nowBadgeText}>AGORA</Text>
        </View>
      </View>
    </View>
  );
}

function TimelineView({ show, colors }: { show: Show; colors: any }) {
  const events = buildTimeline(show);

  const showDate = show.date ? parseISO(show.date) : null;
  const todayShow = !!showDate && isToday(showDate);
  const now = new Date();
  const nowMins = todayShow ? now.getHours() * 60 + now.getMinutes() : -1;
  const nowLabel = todayShow ? `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}` : null;
  const toMins = (hhmm: string | null) => {
    if (!hhmm) return -1;
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  };
  const nextIdx = todayShow
    ? events.findIndex((e) => toMins(e.time) > nowMins)
    : -1;

  if (events.length === 0) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 }}>
        <Text style={{ fontSize: 36, marginBottom: 12 }}>📋</Text>
        <Text style={{ fontSize: FontSize.md, fontWeight: '700', color: colors.text, marginBottom: 6 }}>
          Nenhum horário cadastrado
        </Text>
        <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 }}>
          Complete os horários de logística para ver a timeline do dia do show.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: 48 }}>
      {events.map((event, idx) => {
        const isPast = todayShow && !!event.time && toMins(event.time) < nowMins;
        const isNext = idx === nextIdx;
        const isLast = idx === events.length - 1;
        const dotD = event.isMain ? 18 : 12;
        const dotColor = isPast ? colors.textMuted : event.color;
        const lineColor = colors.border;

        return (
          <React.Fragment key={event.id}>
            {todayShow && isNext && nowLabel && <NowMarker now={nowLabel} />}
            <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
              {/* Time */}
              <View style={{ width: 52, paddingTop: event.isMain ? 1 : 2, alignItems: 'flex-end', paddingRight: 4 }}>
                <Text style={[tlS.time, {
                  color: isPast ? colors.textMuted : event.isMain ? event.color : colors.text,
                  fontSize: event.isMain ? 16 : 13,
                }]}>
                  {event.time ?? '—:—'}
                </Text>
              </View>

              {/* Line + dot column */}
              <View style={{ width: 30, alignItems: 'center' }}>
                {/* Top line */}
                <View style={{ width: 2, height: event.isMain ? 10 : 8, backgroundColor: idx === 0 ? 'transparent' : lineColor }} />
                {/* Dot — hollow ring for past, solid for upcoming, glow for next */}
                <View style={[
                  { width: dotD, height: dotD, borderRadius: dotD / 2 },
                  isPast
                    ? { backgroundColor: 'transparent', borderWidth: 2, borderColor: colors.textMuted }
                    : { backgroundColor: dotColor },
                  isNext && { shadowColor: event.color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 10, elevation: 10 },
                ]} />
                {/* Bottom line — fills remaining height */}
                <View style={{ width: 2, flex: 1, minHeight: 20, backgroundColor: isLast ? 'transparent' : lineColor }} />
              </View>

              {/* Content */}
              <View style={{ flex: 1, minWidth: 0, paddingLeft: 8, paddingBottom: event.isMain ? 28 : 20, paddingTop: event.isMain ? 0 : 1 }}>
                <Text style={[tlS.label, {
                  color: isPast ? colors.textMuted : colors.text,
                  fontSize: event.isMain ? 17 : 14,
                  fontWeight: event.isMain ? '800' : '600',
                }]} numberOfLines={1}>
                  {event.emoji}{'  '}{event.label}
                </Text>
                {event.detail ? (
                  <Text style={[tlS.detail, { color: colors.textSecondary }]} numberOfLines={1}>
                    {event.detail}
                  </Text>
                ) : null}
                {isNext && (
                  <View style={[tlS.nextBadge, { backgroundColor: event.color + '22', borderColor: event.color + '44' }]}>
                    <Text style={[tlS.nextBadgeText, { color: event.color }]}>PRÓXIMO</Text>
                  </View>
                )}
              </View>
            </View>
          </React.Fragment>
        );
      })}
      {todayShow && nextIdx === -1 && nowLabel && <NowMarker now={nowLabel} />}
    </View>
  );
}

const tlS = StyleSheet.create({
  time: { fontFamily: 'SpaceGrotesk-Bold', fontWeight: '700', letterSpacing: -0.5 },
  label: { letterSpacing: -0.2 },
  detail: { fontSize: 12, marginTop: 2, letterSpacing: -0.1 },
  nextBadge: { alignSelf: 'flex-start', marginTop: 6, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, borderWidth: 1 },
  nextBadgeText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  nowTime: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 14, fontWeight: '900', color: '#FF3B30', letterSpacing: -0.5 },
  nowDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF3B30' },
  nowLine: { flex: 1, height: 2, backgroundColor: '#FF3B30', borderRadius: 1 },
  nowBadge: { backgroundColor: '#FF3B30', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  nowBadgeText: { fontSize: 9, fontWeight: '900', color: '#fff', letterSpacing: 1.4 },
});

// ── Hotel Manager Modal ────────────────────────────────────────────────────────

type HotelViewMode = 'rooms' | 'people';

const ROOM_TYPE_OPTIONS: { key: RoomType; label: string }[] = [
  { key: 'single', label: 'Single' },
  { key: 'double', label: 'Duplo' },
  { key: 'triple', label: 'Triplo' },
];

function roomGenId() {
  return `room_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function autoAllocate(
  unassigned: TeamMember[],
  artistsSeparate: boolean,
  maxPerRoom: 1 | 2 | 3,
  pairings: string[][] = [],
): HotelRoom[] {
  const rooms: HotelRoom[] = [];
  const allocated = new Set<string>();

  // 1. Respect saved pairings first
  for (const pair of pairings) {
    const members = pair.filter((n) => unassigned.some((m) => m.name === n && !allocated.has(n)));
    if (members.length < 2) continue;
    const chunks: string[][] = [];
    for (let i = 0; i < members.length; i += maxPerRoom) {
      chunks.push(members.slice(i, i + maxPerRoom));
    }
    for (const chunk of chunks) {
      const type: RoomType = chunk.length >= 3 ? 'triple' : chunk.length === 2 ? 'double' : 'single';
      rooms.push({ id: roomGenId(), type, roomNumber: '', passengers: chunk });
      chunk.forEach((n) => allocated.add(n));
    }
  }

  // 2. Distribute remaining members by role/group
  const remaining = unassigned.filter((m) => !allocated.has(m.name));
  const groups: TeamMember[][] = [];
  if (artistsSeparate) {
    const artists = remaining.filter((m) => m.isArtist);
    const others = remaining.filter((m) => !m.isArtist);
    const byRole: Record<string, TeamMember[]> = {};
    for (const m of others) {
      const k = m.role.trim() || 'Outros';
      byRole[k] = [...(byRole[k] ?? []), m];
    }
    if (artists.length) groups.push(artists);
    groups.push(...Object.values(byRole));
  } else {
    const byRole: Record<string, TeamMember[]> = {};
    for (const m of remaining) {
      const k = m.role.trim() || 'Outros';
      byRole[k] = [...(byRole[k] ?? []), m];
    }
    groups.push(...Object.values(byRole));
  }
  for (const group of groups) {
    let i = 0;
    while (i < group.length) {
      const chunk = group.slice(i, i + maxPerRoom);
      const type: RoomType = chunk.length >= 3 ? 'triple' : chunk.length === 2 ? 'double' : 'single';
      rooms.push({ id: roomGenId(), type, roomNumber: '', passengers: chunk.map((m) => m.name) });
      i += maxPerRoom;
    }
  }
  return rooms;
}

const HOTEL_DEL_W = 80;

function HotelSwipeRoomRow({ label, names, typeLabel, isOpen, separator, onExpand, onDelete, onOpen, onClose, colors }: {
  label: string; names: string; typeLabel: string; isOpen: boolean; separator: boolean;
  onExpand: () => void; onDelete: () => void; onOpen: () => void; onClose: () => void; colors: any;
}) {
  const tx = useRef(new Animated.Value(0)).current;
  const isOpenRef = useRef(false);

  useEffect(() => {
    isOpenRef.current = isOpen;
    Animated.spring(tx, { toValue: isOpen ? -HOTEL_DEL_W : 0, useNativeDriver: true, damping: 20, stiffness: 240 } as any).start();
  }, [isOpen]);

  const pr = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2,
    onPanResponderMove: (_, g) => {
      const base = isOpenRef.current ? -HOTEL_DEL_W : 0;
      tx.setValue(Math.max(-HOTEL_DEL_W, Math.min(0, base + g.dx)));
    },
    onPanResponderRelease: (_, g) => {
      const base = isOpenRef.current ? -HOTEL_DEL_W : 0;
      const final = Math.max(-HOTEL_DEL_W, Math.min(0, base + g.dx));
      if (final < -HOTEL_DEL_W / 2 || g.vx < -0.4) { onOpen(); } else { onClose(); }
    },
  })).current;

  return (
    <View style={[{ overflow: 'hidden' }, separator && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
      <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: HOTEL_DEL_W, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' }}>
        <TouchableOpacity onPress={onDelete} style={{ alignItems: 'center', gap: 3 }}>
          <Icon name="close" color="#fff" size={18} />
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Apagar</Text>
        </TouchableOpacity>
      </View>
      <Animated.View style={{ transform: [{ translateX: tx }], backgroundColor: colors.surface }} {...pr.panHandlers}>
        <TouchableOpacity
          style={hmS.roomRow}
          onPress={() => isOpenRef.current ? onClose() : onExpand()}
          activeOpacity={0.7}
        >
          <Icon name="bed" color={colors.textSecondary} size={22} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[hmS.roomRowTitle, { color: colors.text }]}>{label}</Text>
            <Text style={[hmS.roomRowSub, { color: colors.textMuted }]} numberOfLines={1}>{names}</Text>
          </View>
          <View style={[hmS.typeBadge, { backgroundColor: colors.primaryLight }]}>
            <Text style={[hmS.typeBadgeText, { color: colors.primary }]}>{typeLabel}</Text>
          </View>
          <Icon name="chevronRight" color={colors.textMuted} size={22} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

function SlideBadge({ label, bgColor, textColor }: { label: string; bgColor: string; textColor: string }) {
  const tx = useRef(new Animated.Value(20)).current;
  const op = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(tx, { toValue: 0, useNativeDriver: true, damping: 14, stiffness: 160 } as any),
      Animated.timing(op, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[hmS.typeBadge, { backgroundColor: bgColor, transform: [{ translateX: tx }], opacity: op }]}>
      <Text style={[hmS.typeBadgeText, { color: textColor }]}>{label}</Text>
    </Animated.View>
  );
}

function HotelManagerModal({
  visible, initialRooms, onClose, onSave, colors, teamMembers,
}: {
  visible: boolean;
  initialRooms: HotelRoom[];
  onClose: () => void;
  onSave: (rooms: HotelRoom[]) => void;
  colors: any;
  teamMembers: TeamMember[];
}) {
  const insets = useSafeAreaInsets();
  const [drafts, setDrafts] = useState<HotelRoom[]>([]);
  const [mode, setMode] = useState<HotelViewMode>('rooms');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [openSwipeRoomId, setOpenSwipeRoomId] = useState<string | null>(null);
  const [roomSearch, setRoomSearch] = useState<Record<string, string>>({});
  const [showAllocSheet, setShowAllocSheet] = useState(false);
  const [allocArtistsSep, setAllocArtistsSep] = useState(true);
  const [allocMax, setAllocMax] = useState<1 | 2 | 3>(3);
  const [bulkType, setBulkType] = useState<RoomType>('double');
  const [bulkQty, setBulkQty] = useState(1);
  const [movingMember, setMovingMember] = useState<string | null>(null);
  const [pairings, setPairings] = useState<string[][]>([]);

  useEffect(() => {
    if (visible) {
      setDrafts(initialRooms.map((r) => ({ ...r, passengers: [...r.passengers] })));
      setExpandedId(null);
      setRoomSearch({});
      setShowAllocSheet(false);
      setMovingMember(null);
      setBulkType('double');
      setBulkQty(1);
      setMode('rooms');
      loadPairings().then(setPairings);
    }
  }, [visible]);

  const allAllocated = new Set(drafts.flatMap((r) => r.passengers));
  const unassignedMembers = teamMembers.filter((m) => !allAllocated.has(m.name));

  const ROOM_CAPACITY: Record<RoomType, number> = { single: 1, double: 2, triple: 3 };

  // Room mutations
  const addRoom = () => {
    setDrafts((p) => [...p, { id: roomGenId(), type: 'single', roomNumber: '', passengers: [] }]);
  };

  const addBulkRooms = () => {
    const newRooms = Array.from({ length: bulkQty }, () => ({
      id: roomGenId(), type: bulkType, roomNumber: '', passengers: [],
    }));
    setDrafts((p) => [...p, ...newRooms]);
  };

  const deleteRoom = (id: string) => {
    setDrafts((p) => p.filter((r) => r.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const setRoomType = (id: string, type: RoomType) =>
    setDrafts((p) => p.map((r) => r.id === id ? { ...r, type } : r));

  const setRoomNum = (id: string, num: string) =>
    setDrafts((p) => p.map((r) => r.id === id ? { ...r, roomNumber: num } : r));

  const addPassenger = (roomId: string, name: string) => {
    setDrafts((p) => p.map((r) => {
      if (r.id !== roomId || r.passengers.includes(name)) return r;
      if (r.passengers.filter(Boolean).length >= ROOM_CAPACITY[r.type]) return r;
      return { ...r, passengers: [...r.passengers, name] };
    }));
    setRoomSearch((p) => ({ ...p, [roomId]: '' }));
  };

  const removePassenger = (roomId: string, name: string) =>
    setDrafts((p) => p.map((r) =>
      r.id === roomId ? { ...r, passengers: r.passengers.filter((x) => x !== name) } : r
    ));

  const moveMemberToRoom = (memberName: string, targetRoomId: string | null) => {
    setDrafts((p) => {
      let updated = p.map((r) => ({ ...r, passengers: r.passengers.filter((x) => x !== memberName) }));
      if (targetRoomId) {
        updated = updated.map((r) =>
          r.id === targetRoomId && !r.passengers.includes(memberName)
            ? { ...r, passengers: [...r.passengers, memberName] }
            : r
        );
      }
      return updated;
    });
    setMovingMember(null);
  };

  const handleAllocate = () => {
    setShowAllocSheet(false);
    setDrafts((current) => {
      const already = new Set(current.flatMap((r) => r.passengers));
      const still = teamMembers.filter((m) => !already.has(m.name));
      if (still.length === 0) return current;
      return [...current, ...autoAllocate(still, allocArtistsSep, allocMax, pairings)];
    });
  };

  const sortedDrafts = [...drafts].sort((a, b) => {
    const o: Record<string, number> = { single: 0, double: 1, triple: 2 };
    return (o[a.type] ?? 0) - (o[b.type] ?? 0);
  });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={[hmS.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={[hmS.headerBtn, { color: colors.primary }]}>Cancelar</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="hotel" color={colors.text} size={18} />
            <Text style={[hmS.headerTitle, { color: colors.text }]}>Quartos</Text>
          </View>
          <TouchableOpacity onPress={() => onSave(drafts)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={[hmS.headerBtn, { color: colors.primary, fontWeight: '700' }]}>Salvar</Text>
          </TouchableOpacity>
        </View>

        {/* Segment */}
        <View style={hmS.segWrap}>
          <Segmented<HotelViewMode>
            value={mode}
            onChange={setMode}
            options={[{ key: 'rooms', label: 'Quartos' }, { key: 'people', label: 'Equipe' }]}
          />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 32 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── VISTA QUARTOS ── */}
          {mode === 'rooms' && (
            <>
              {sortedDrafts.length === 0 && (
                <Text style={[hmS.emptyHint, { color: colors.textMuted }]}>
                  Nenhum quarto ainda. Adicione manualmente ou use "Alocar equipe".
                </Text>
              )}
              <View style={[hmS.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {sortedDrafts.map((room, idx) => {
                  const isExpanded = expandedId === room.id;
                  const q = (roomSearch[room.id] ?? '').toLowerCase();
                  const available = teamMembers.filter(
                    (m) => !allAllocated.has(m.name) && (q === '' || m.name.toLowerCase().includes(q))
                  );
                  const label = room.roomNumber ? `Quarto ${room.roomNumber}` : `Quarto ${idx + 1}`;
                  const typeLabel = ROOM_TYPE_OPTIONS.find((o) => o.key === room.type)?.label ?? room.type;
                  const names = room.passengers.filter(Boolean).join(' · ') || 'Sem hóspedes';
                  return (
                    <View key={room.id}>
                      {/* Collapsed row with swipe-to-delete */}
                      {!isExpanded ? (
                        <HotelSwipeRoomRow
                          label={label}
                          names={names}
                          typeLabel={typeLabel}
                          isOpen={openSwipeRoomId === room.id}
                          separator={idx > 0}
                          onExpand={() => setExpandedId(room.id)}
                          onDelete={() => { deleteRoom(room.id); setOpenSwipeRoomId(null); }}
                          onOpen={() => setOpenSwipeRoomId(room.id)}
                          onClose={() => setOpenSwipeRoomId(null)}
                          colors={colors}
                        />
                      ) : (
                        /* Expanded row */
                        <View style={hmS.expanded}>
                          <View style={hmS.expandedHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Icon name="bed" color={colors.text} size={18} />
                              <Text style={[hmS.expandedTitle, { color: colors.text }]}>{label}</Text>
                            </View>
                            <TouchableOpacity
                              onPress={() => deleteRoom(room.id)}
                              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                              <Icon name="close" color={colors.danger} size={22} />
                            </TouchableOpacity>
                          </View>

                          {/* Number + Type */}
                          <View style={hmS.expandedRow}>
                            <TextInput
                              style={[hmS.numInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                              placeholder="Nº quarto"
                              placeholderTextColor={colors.textMuted}
                              value={room.roomNumber ?? ''}
                              onChangeText={(t) => setRoomNum(room.id, t.replace(/[^0-9]/g, ''))}
                              keyboardType="number-pad"
                            />
                            <View style={hmS.typePills}>
                              {ROOM_TYPE_OPTIONS.map((opt) => (
                                <TouchableOpacity
                                  key={opt.key}
                                  style={[
                                    hmS.typePill,
                                    { backgroundColor: room.type === opt.key ? colors.primary : colors.background, borderColor: room.type === opt.key ? colors.primary : colors.border },
                                  ]}
                                  onPress={() => setRoomType(room.id, opt.key)}
                                >
                                  <Text style={{ color: room.type === opt.key ? '#fff' : colors.text, fontSize: 12, fontWeight: '700' }}>{opt.label}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </View>

                          {/* Passengers chips */}
                          {room.passengers.filter(Boolean).length > 0 && (
                            <View style={hmS.chipRow}>
                              {room.passengers.filter(Boolean).map((name) => (
                                <TouchableOpacity
                                  key={name}
                                  style={[hmS.chip, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                                  onPress={() => removePassenger(room.id, name)}
                                >
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <Text style={[hmS.chipText, { color: colors.primary }]}>{name}</Text>
                                    <Icon name="close" color={colors.primary} size={12} />
                                  </View>
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}

                          {/* Search to add — hidden when room is full */}
                          {room.passengers.filter(Boolean).length < ROOM_CAPACITY[room.type] ? (
                            <>
                          <TextInput
                            style={[hmS.searchInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                            placeholder="+ Adicionar hóspede..."
                            placeholderTextColor={colors.textMuted}
                            value={roomSearch[room.id] ?? ''}
                            onChangeText={(t) => setRoomSearch((p) => ({ ...p, [room.id]: t }))}
                            autoCorrect={false}
                            autoCapitalize="characters"
                          />
                          {available.length > 0 && (
                            <View style={[hmS.dropdown, { backgroundColor: colors.background, borderColor: colors.border }]}>
                              {available.map((m, ni) => (
                                <TouchableOpacity
                                  key={m.id}
                                  style={[hmS.dropdownItem, ni < available.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
                                  onPress={() => addPassenger(room.id, m.name)}
                                >
                                  <Text style={[hmS.dropdownName, { color: colors.text }]}>{m.name}</Text>
                                  {m.role ? <Text style={[hmS.dropdownRole, { color: colors.textMuted }]}>{m.role}</Text> : null}
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}
                            </>
                          ) : (
                            <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 6, textAlign: 'center' }}>
                              Quarto cheio ({ROOM_CAPACITY[room.type]}/{ROOM_CAPACITY[room.type]})
                            </Text>
                          )}

                          <TouchableOpacity onPress={() => setExpandedId(null)} style={hmS.collapseBtn}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <Text style={[hmS.collapseBtnText, { color: colors.textMuted }]}>Recolher</Text>
                              <Icon name="chevronUp" color={colors.textMuted} size={16} />
                            </View>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>

              {/* Bulk add row */}
              <View style={[hmS.bulkRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {/* Line 1: type pills */}
                <View style={hmS.bulkTypeRow}>
                  {ROOM_TYPE_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.key}
                      style={[hmS.bulkTypePill, { backgroundColor: bulkType === opt.key ? colors.primary : colors.background, borderColor: bulkType === opt.key ? colors.primary : colors.border }]}
                      onPress={() => setBulkType(opt.key)}
                    >
                      <Text style={{ color: bulkType === opt.key ? '#fff' : colors.text, fontSize: 12, fontWeight: '700' }}>{opt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {/* Line 2: qty stepper + add button */}
                <View style={hmS.bulkBottomRow}>
                  <View style={hmS.bulkQtyRow}>
                    <TouchableOpacity style={hmS.bulkQtyBtn} onPress={() => setBulkQty((q) => Math.max(1, q - 1))}>
                      <Icon name="minus" color={colors.text} size={16} />
                    </TouchableOpacity>
                    <Text style={[hmS.bulkQtyNum, { color: colors.text }]}>{bulkQty}</Text>
                    <TouchableOpacity style={hmS.bulkQtyBtn} onPress={() => setBulkQty((q) => Math.min(10, q + 1))}>
                      <Icon name="plus" color={colors.text} size={16} />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={[hmS.bulkAddBtn, { backgroundColor: colors.primary }]} onPress={addBulkRooms}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Icon name="plus" color="#fff" size={15} />
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Adicionar</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Alloc button */}
              <View style={hmS.actionRow}>
                {unassignedMembers.length > 0 && (
                  <TouchableOpacity
                    style={[hmS.actionBtn, { backgroundColor: colors.primary }]}
                    onPress={() => setShowAllocSheet(true)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Icon name="people" color="#fff" size={18} />
                      <Text style={[hmS.actionBtnText, { color: '#fff' }]}>Alocar equipe ({unassignedMembers.length})</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}

          {/* ── VISTA EQUIPE ── */}
          {mode === 'people' && (
            <>
              {teamMembers.length === 0 && (
                <Text style={[hmS.emptyHint, { color: colors.textMuted }]}>Nenhum membro cadastrado na equipe.</Text>
              )}
              <View style={[hmS.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {teamMembers.map((member, idx) => {
                  const room = drafts.find((r) => r.passengers.includes(member.name));
                  const typeLabel = room ? (ROOM_TYPE_OPTIONS.find((o) => o.key === room.type)?.label ?? '') : '';
                  const roomLabel = room
                    ? (room.roomNumber ? `Quarto ${room.roomNumber}` : `Quarto ${drafts.indexOf(room) + 1}`)
                    : null;
                  const isMoving = movingMember === member.name;
                  return (
                    <View key={member.id}>
                      {idx > 0 && <View style={[hmS.separator, { backgroundColor: colors.border }]} />}
                      <TouchableOpacity
                        style={hmS.personRow}
                        onPress={() => setMovingMember(isMoving ? null : member.name)}
                        activeOpacity={0.7}
                      >
                        <Icon name={member.isArtist ? 'music' : 'personal'} color={colors.textSecondary} size={20} />
                        <View style={{ flex: 1 }}>
                          <Text style={[hmS.personName, { color: colors.text }]}>{member.name}</Text>
                          {member.role ? <Text style={[hmS.personRole, { color: colors.textMuted }]}>{member.role}</Text> : null}
                        </View>
                        {roomLabel ? (
                          <View style={[hmS.roomAssignBadge, { backgroundColor: colors.primaryLight }]}>
                            <Text style={[hmS.roomAssignText, { color: colors.primary }]}>{roomLabel} · {typeLabel}</Text>
                          </View>
                        ) : (
                          <View style={[hmS.noRoomBadge, { backgroundColor: '#FF9F0A22' }]}>
                            <Text style={[hmS.noRoomText, { color: '#FF9F0A' }]}>Sem quarto</Text>
                          </View>
                        )}
                        <Icon name={isMoving ? 'chevronDown' : 'chevronRight'} color={colors.textMuted} size={22} />
                      </TouchableOpacity>

                      {/* Inline room picker */}
                      {isMoving && (
                        <View style={[hmS.pickerSheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
                          <Text style={[hmS.pickerTitle, { color: colors.textMuted }]}>Mover para:</Text>
                          {room && (
                            <TouchableOpacity style={hmS.pickerItem} onPress={() => moveMemberToRoom(member.name, null)}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Icon name="close" color={colors.danger} size={16} />
                                <Text style={{ color: colors.danger, fontWeight: '600', fontSize: 14 }}>Remover do quarto</Text>
                              </View>
                            </TouchableOpacity>
                          )}
                          {drafts.filter((r) => r.id !== room?.id).map((r, ri) => {
                            const rLabel = r.roomNumber ? `Quarto ${r.roomNumber}` : `Quarto ${drafts.indexOf(r) + 1}`;
                            const rType = ROOM_TYPE_OPTIONS.find((o) => o.key === r.type)?.label ?? '';
                            const rNames = r.passengers.filter(Boolean).join(', ') || 'Vazio';
                            return (
                              <TouchableOpacity
                                key={r.id}
                                style={[hmS.pickerItem, ri < drafts.filter((x) => x.id !== room?.id).length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
                                onPress={() => moveMemberToRoom(member.name, r.id)}
                              >
                                <Text style={[{ color: colors.text, fontWeight: '600', fontSize: 14 }]}>{rLabel} · {rType}</Text>
                                <Text style={[{ color: colors.textMuted, fontSize: 12 }]}>{rNames}</Text>
                              </TouchableOpacity>
                            );
                          })}
                          {drafts.length === 0 && (
                            <Text style={[hmS.pickerTitle, { color: colors.textMuted }]}>Crie quartos primeiro na aba Quartos.</Text>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>

              {unassignedMembers.length > 0 && (
                <TouchableOpacity
                  style={[hmS.actionBtn, { backgroundColor: colors.primary, marginTop: 12 }]}
                  onPress={() => setShowAllocSheet(true)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Icon name="people" color="#fff" size={18} />
                    <Text style={[hmS.actionBtnText, { color: '#fff' }]}>Alocar equipe ({unassignedMembers.length})</Text>
                  </View>
                </TouchableOpacity>
              )}
            </>
          )}
        </ScrollView>

        {/* Alloc sheet overlay */}
        {showAllocSheet && (
          <View style={[hmS.allocOverlay, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Icon name="bed" color={colors.text} size={22} />
              <Text style={[hmS.allocTitle, { color: colors.text }]}>Alocar equipe automaticamente</Text>
            </View>
            {pairings.length > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, backgroundColor: colors.primaryLight, borderRadius: 8, padding: 8 }}>
                <Icon name="people" color={colors.primary} size={16} />
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>
                  {pairings.length} {pairings.length === 1 ? 'par vinculado' : 'pares vinculados'} serão respeitados
                </Text>
              </View>
            )}

            <Text style={[hmS.allocQuestion, { color: colors.textSecondary }]}>Artistas em quartos separados?</Text>
            <View style={hmS.allocOptions}>
              {[true, false].map((v) => (
                <TouchableOpacity
                  key={String(v)}
                  style={[hmS.allocOption, { backgroundColor: allocArtistsSep === v ? colors.primary : colors.surface, borderColor: allocArtistsSep === v ? colors.primary : colors.border }]}
                  onPress={() => setAllocArtistsSep(v)}
                >
                  <Text style={{ color: allocArtistsSep === v ? '#fff' : colors.text, fontWeight: '700', fontSize: 14 }}>{v ? 'Sim' : 'Não'}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[hmS.allocQuestion, { color: colors.textSecondary }]}>Máximo por quarto?</Text>
            <View style={hmS.allocOptions}>
              {([1, 2, 3] as const).map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[hmS.allocOption, { backgroundColor: allocMax === n ? colors.primary : colors.surface, borderColor: allocMax === n ? colors.primary : colors.border }]}
                  onPress={() => setAllocMax(n)}
                >
                  <Text style={{ color: allocMax === n ? '#fff' : colors.text, fontWeight: '700', fontSize: 14 }}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={hmS.allocActions}>
              <TouchableOpacity
                style={[hmS.allocCancelBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setShowAllocSheet(false)}
              >
                <Text style={[{ color: colors.text, fontWeight: '600', fontSize: 15 }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[hmS.allocConfirmBtn, { backgroundColor: colors.primary }]}
                onPress={handleAllocate}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Alocar →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const hmS = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  headerBtn: { fontSize: 16 },
  headerTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  segWrap: { paddingHorizontal: 16, paddingVertical: 12 },
  listCard: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', marginBottom: 12 },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 16 },
  emptyHint: { textAlign: 'center', marginVertical: 32, fontSize: 14, lineHeight: 20 },
  // Room rows
  roomRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  roomRowBed: { fontSize: 20 },
  roomRowTitle: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  roomRowSub: { fontSize: 12, marginTop: 2 },
  typeBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99 },
  typeBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.2 },
  chevron: { fontSize: 20, marginLeft: 2 },
  // Expanded room
  expanded: { padding: 14, paddingTop: 12 },
  expandedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  expandedTitle: { fontSize: 15, fontWeight: '800' },
  expandedRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  numInput: { flex: 1, minWidth: 0, borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14 },
  typePills: { flexDirection: 'row', gap: 4, flexShrink: 0 },
  typePill: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 99, borderWidth: 1.5 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, borderWidth: 1.5 },
  chipText: { fontSize: 12, fontWeight: '700' },
  searchInput: { borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, marginBottom: 6 },
  dropdown: { borderRadius: 10, borderWidth: 1.5, overflow: 'hidden', marginBottom: 6 },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 11, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownName: { fontSize: 14, fontWeight: '600' },
  dropdownRole: { fontSize: 12 },
  collapseBtn: { alignItems: 'center', paddingTop: 6 },
  collapseBtnText: { fontSize: 12 },
  // Bulk add row
  bulkRow: { gap: 8, padding: 10, borderRadius: 12, borderWidth: 1.5, marginBottom: 8 },
  bulkTypeRow: { flexDirection: 'row', gap: 5 },
  bulkTypePill: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 99, borderWidth: 1.5 },
  bulkBottomRow: { flexDirection: 'row', alignItems: 'center' },
  bulkQtyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bulkQtyBtn: { width: 28, height: 28, borderRadius: 99, alignItems: 'center', justifyContent: 'center' },
  bulkQtyNum: { fontSize: 14, fontWeight: '700', minWidth: 20, textAlign: 'center' },
  bulkAddBtn: { marginLeft: 'auto' as any, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  // Action row
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center', borderWidth: 1.5 },
  actionBtnText: { fontSize: 14, fontWeight: '700' },
  // People view
  personRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, gap: 10 },
  personIcon: { fontSize: 18 },
  personName: { fontSize: 15, fontWeight: '700' },
  personRole: { fontSize: 12, marginTop: 1 },
  roomAssignBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99 },
  roomAssignText: { fontSize: 11, fontWeight: '700' },
  noRoomBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99 },
  noRoomText: { fontSize: 11, fontWeight: '700' },
  pickerSheet: { marginHorizontal: 16, marginBottom: 10, borderRadius: 12, borderWidth: 1.5, overflow: 'hidden' },
  pickerTitle: { fontSize: 12, fontWeight: '600', paddingHorizontal: 14, paddingTop: 10, paddingBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  pickerItem: { paddingHorizontal: 14, paddingVertical: 11 },
  // Alloc overlay
  allocOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 1.5, borderRadius: 20, padding: 24, paddingBottom: 36 },
  allocTitle: { fontSize: 17, fontWeight: '800', marginBottom: 20, letterSpacing: -0.3 },
  allocQuestion: { fontSize: 13, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  allocOptions: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  allocOption: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 99, borderWidth: 1.5, minWidth: 60, alignItems: 'center' },
  allocActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  allocCancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center', borderWidth: 1.5 },
  allocConfirmBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
});

function buildContact(name: string, phone: string, role: string): ImportantContact {
  return {
    id: `contact_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim(),
    phone: phone.trim() || undefined,
    role: role.trim(),
  };
}

function countdownLabel(showDate: Date, now: Date): string {
  if (isBefore(showDate, now)) return 'Concluído';
  const totalMins = differenceInMinutes(showDate, now);
  const days = differenceInDays(showDate, now);
  if (days >= 2) return `Em ${days} dias`;
  if (days === 1) return 'Em 1 dia';
  if (totalMins >= 60) return `Em ${differenceInHours(showDate, now)}h`;
  if (totalMins > 0) return `Em ${totalMins} min`;
  return 'Agora';
}

function capitalizeFirst(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/** iOS-style grouped row: colored icon tile + title + subtitle + chevron. */
function GroupRow({
  iconNode, iconText, iconColor, title, subtitle, onPress, isLast, colors, trailing,
}: {
  iconNode?: React.ReactNode;
  iconText?: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  isLast?: boolean;
  colors: any;
  trailing?: React.ReactNode;
}) {
  const Container: any = onPress ? TouchableOpacity : View;
  return (
    <Container
      onPress={onPress}
      activeOpacity={onPress ? 0.6 : 1}
      style={[grp.row, !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
    >
      <View style={[grp.iconTile, { backgroundColor: iconColor }]}>
        {iconNode ?? <Text style={grp.iconText}>{iconText}</Text>}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[grp.title, { color: colors.text }]} numberOfLines={2}>{title}</Text>
        {subtitle ? (
          <Text style={[grp.subtitle, { color: colors.textSecondary }]} numberOfLines={2}>{subtitle}</Text>
        ) : null}
      </View>
      {trailing}
      {onPress ? <Icon name="chevronRight" color={colors.textMuted} size={20} /> : null}
    </Container>
  );
}

/** Circular percent ring — SVG on web, fallback ring on native. */
function CircularProgress({ percent, colors }: { percent: number; colors: any }) {
  const size = 56;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.max(0, Math.min(100, percent)) / 100);

  if (Platform.OS === 'web') {
    const svg = `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" style="transform: rotate(-90deg); display: block; position: absolute; top: 0; left: 0;">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${colors.border}" stroke-width="${stroke}"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${colors.primary}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${offset}"/>
    </svg>`;
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {React.createElement('div', {
          style: { position: 'absolute', top: 0, left: 0, width: size, height: size, pointerEvents: 'none' } as any,
          dangerouslySetInnerHTML: { __html: svg },
        })}
        <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }}>{percent}%</Text>
      </View>
    );
  }

  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: stroke, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }}>{percent}%</Text>
    </View>
  );
}

/**
 * Modal full-screen com lembretes + check de material em uma única lista
 * scrollável. Acionado ao tocar no anel circular do checklist.
 */
function AllChecklistsModal({
  show, visible, onClose, colors, onRefresh,
}: {
  show: Show;
  visible: boolean;
  onClose: () => void;
  colors: any;
  onRefresh: () => void;
}) {
  const insets = useSafeAreaInsets();
  const reminders = show.reminders ?? [];
  const materials = show.materials ?? [];
  const remindersDone = reminders.filter((r) => r.done).length;
  const materialsDone = materials.filter((m) => m.checked).length;
  const total = reminders.length + materials.length;
  const done = remindersDone + materialsDone;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="fullScreen" transparent={false}>
      <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
        <View style={[execS.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={onClose}
            style={[execS.closeBtnCircle, { backgroundColor: colors.surface, borderColor: colors.border }]}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            accessibilityLabel="Fechar"
            activeOpacity={0.6}
          >
            <Icon name="close" color={colors.text} size={18} />
          </TouchableOpacity>
          <Text style={[execS.headerTitle, { color: colors.text }]} numberOfLines={1}>Checklists</Text>
          <TouchableOpacity
            onPress={onClose}
            style={execS.doneBtn}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            accessibilityLabel="Concluído"
            activeOpacity={0.6}
          >
            <Text style={[execS.doneBtnText, { color: colors.primary }]}>Concluído</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxl }}>
          {/* Resumo no topo: anel + total */}
          <View style={[progressCardS.card, { backgroundColor: colors.surface, marginHorizontal: 0 }]}>
            <View style={{ flex: 1 }}>
              <Text style={[progressCardS.label, { color: colors.textSecondary }]}>PROGRESSO TOTAL</Text>
              <Text style={[progressCardS.title, { color: colors.text }]}>{done} de {total} concluídos</Text>
            </View>
            <CircularProgress percent={pct} colors={colors} />
          </View>

          {/* Lembretes */}
          {reminders.length > 0 && (
            <>
              <Text style={[grp.header, { color: '#BF5AF2', marginHorizontal: 0 }]}>
                Lembretes · {remindersDone}/{reminders.length}
              </Text>
              <View style={[grp.group, { backgroundColor: colors.surface, marginHorizontal: 0, borderLeftColor: '#BF5AF2' }]}>
                {reminders.map((r, i) => (
                  <View key={r.id} style={[grp.checklistRow, i < reminders.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={async () => { await toggleShowReminder(show.id, r.id); onRefresh(); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <View style={[grp.checkCircle, { borderColor: r.done ? colors.primary : colors.textMuted, backgroundColor: r.done ? colors.primary : 'transparent' }]}>
                        {r.done && <Text style={grp.checkCircleMark}>✓</Text>}
                      </View>
                    </TouchableOpacity>
                    <Text style={[grp.checklistText, { flex: 1, color: colors.text }, r.done && { textDecorationLine: 'line-through', color: colors.textSecondary }]}>{r.text}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Check de material */}
          {materials.length > 0 && (
            <>
              <Text style={[grp.header, { color: '#FF9F0A', marginHorizontal: 0 }]}>
                Check de material · {materialsDone}/{materials.length}
              </Text>
              <View style={[grp.group, { backgroundColor: colors.surface, marginHorizontal: 0, borderLeftColor: '#FF9F0A' }]}>
                {materials.map((m, i) => (
                  <View key={m.id} style={[grp.checklistRow, i < materials.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={async () => { await toggleMaterialItem(show.id, m.id); onRefresh(); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <View style={[grp.checkCircle, { borderColor: m.checked ? colors.primary : colors.textMuted, backgroundColor: m.checked ? colors.primary : 'transparent' }]}>
                        {m.checked && <Text style={grp.checkCircleMark}>✓</Text>}
                      </View>
                    </TouchableOpacity>
                    <Text style={[grp.checklistText, { flex: 1, color: colors.text }, m.checked && { textDecorationLine: 'line-through', color: colors.textSecondary }]}>{m.name}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {total === 0 && (
            <Text style={{ textAlign: 'center', color: colors.textSecondary, marginTop: Spacing.lg, fontSize: FontSize.sm }}>
              Nenhum item ainda. Adicione lembretes ou check de material na tela do show.
            </Text>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

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

function MalaCuiaCard({ isDark }: { isDark: boolean }) {
  const slideY = useRef(new Animated.Value(-20)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(1)).current;
  const swiftX = useRef(new Animated.Value(-200)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideY, { toValue: 0, damping: 16, stiffness: 180, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 300, delay: 80, useNativeDriver: true }),
    ]).start();

    if (reduceMotion) return;

    const breathe = Animated.loop(
      Animated.sequence([
        Animated.delay(600),
        Animated.timing(iconScale, { toValue: 1.18, duration: 700, useNativeDriver: true }),
        Animated.timing(iconScale, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.delay(1200),
      ])
    );
    const swift = Animated.loop(
      Animated.sequence([
        Animated.timing(swiftX, { toValue: 400, duration: 1100, useNativeDriver: true }),
        Animated.delay(2400),
        Animated.timing(swiftX, { toValue: -200, duration: 0, useNativeDriver: true }),
      ])
    );
    const t = setTimeout(() => { breathe.start(); swift.start(); }, 500);
    return () => { clearTimeout(t); breathe.stop(); swift.stop(); };
  }, [reduceMotion]);

  const cardBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const cardBorder = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)';
  const titleColor = isDark ? '#F2F2F7' : '#1A1A2E';
  const subtitleColor = isDark ? 'rgba(242,242,247,0.55)' : 'rgba(26,26,46,0.5)';
  const sweepColor = isDark ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.55)';

  return (
    <Animated.View
      accessible={true}
      accessibilityLabel="Mala e Cuia — não esqueça de levar a mala para o show"
      style={{
        opacity,
        transform: [{ translateY: slideY }],
        marginHorizontal: 16, marginTop: 12, marginBottom: 4,
      }}
    >
      <View style={{
        borderRadius: 16, overflow: 'hidden',
        borderWidth: 1, borderColor: cardBorder,
        backgroundColor: cardBg,
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 13, gap: 12,
      }}>
        {/* Swift white sweep */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute', top: 0, bottom: 0, width: 80,
            backgroundColor: sweepColor,
            transform: [{ translateX: swiftX }, { skewX: '-18deg' }],
          }}
        />

        {/* Pulsing emoji */}
        <Animated.Text style={{ fontSize: 32, transform: [{ scale: iconScale }] }}>🧳</Animated.Text>

        {/* Text block */}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{
            fontSize: 13, fontWeight: '900',
            fontFamily: 'ClashDisplay-Bold',
            letterSpacing: 1.8,
            color: titleColor,
            textTransform: 'uppercase',
            marginBottom: 2,
          }}>
            Mala e Cuia
          </Text>
          <Text style={{ fontSize: 12, color: subtitleColor, fontFamily: 'CabinetGrotesk-Medium' }}>
            Não esqueça de levar a mala para o show
          </Text>
        </View>

      </View>
    </Animated.View>
  );
}

export default function ShowDetailScreen({ navigation, route }: { navigation: Nav; route: Route }) {
  const { colors, isDark } = useTheme();
  const [show, setShow] = useState<Show | null>(null);
  const [returnFlightShow, setReturnFlightShow] = useState<Show | null>(null);
  const [newReminder, setNewReminder] = useState('');
  const [addingReminder, setAddingReminder] = useState(false);
  const [checklistsModalVisible, setChecklistsModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('details');
  const [newMaterial, setNewMaterial] = useState('');
  const [addingMaterial, setAddingMaterial] = useState(false);
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [editingMaterialText, setEditingMaterialText] = useState('');

  const [hotelModalVisible, setHotelModalVisible] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    loadTeamMembers().then(setTeamMembers);
  }, []);

  // Contact form state
  const [addingContact, setAddingContact] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [missingExpanded, setMissingExpanded] = useState(false);
  const [weather, setWeather] = useState<{ rain: number; min: number; max: number } | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [teamLinkUrl, setTeamLinkUrl] = useState<string | null>(null);
  const [teamLinkLoading, setTeamLinkLoading] = useState(false);
  const [teamLinkModalVisible, setTeamLinkModalVisible] = useState(false);
  const [teamLinkError, setTeamLinkError] = useState<string | null>(null);
  const [artistLinkUrl, setArtistLinkUrl] = useState<string | null>(null);
  const [artistLinkModalVisible, setArtistLinkModalVisible] = useState(false);
  const [loadingShow, setLoadingShow] = useState(true);

  const refresh = useCallback(async () => {
    const shows = await loadShows();
    const current = shows.find((s) => s.id === route.params.showId) ?? null;
    setShow(current);
    setReturnFlightShow(current?.returnFlightFromShowId
      ? (shows.find((s) => s.id === current.returnFlightFromShowId) ?? null)
      : null);
    setLoadingShow(false);
  }, [route.params.showId]);

  const saveHotelRooms = async (rooms: HotelRoom[]) => {
    if (!show) return;
    try {
      await updateShow(show.id, { hotelRooms: rooms });
      setHotelModalVisible(false);
      refresh();
    } catch (e: any) {
      Alert.alert('Erro ao salvar', e?.message ?? 'Tente novamente.');
    }
  };

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  useEffect(() => {
    // city from show.city, or 3rd part of "Street, Number, City, ..." address
    const parts = show?.venueAddress?.split(',').map((s: string) => s.trim()) ?? [];
    const addressCity = parts.find((p: string) => p.length > 2 && !/^\d/.test(p) && !/^\d{5}/.test(p));
    const cityRaw = show?.city || addressCity;
    const date = show?.date;
    if (!cityRaw || !date) return;
    const city = cityRaw.split('-')[0].trim();
    let cancelled = false;
    setWeather(null);
    setWeatherLoading(true);
    (async () => {
      try {
        const geo = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=pt&format=json&countryCode=BR`
        );
        const geoData = await geo.json();
        const loc = geoData?.results?.[0];
        if (!loc || cancelled) return;
        const wx = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=America/Sao_Paulo&start_date=${date}&end_date=${date}`
        );
        const wxData = await wx.json();
        if (cancelled) return;
        const d = wxData?.daily;
        const tmax = d?.temperature_2m_max?.[0];
        const tmin = d?.temperature_2m_min?.[0];
        if (tmax == null || tmin == null) return;
        setWeather({
          max: Math.round(tmax),
          min: Math.round(tmin),
          rain: d.precipitation_probability_max?.[0] ?? 0,
        });
      } catch {} finally {
        if (!cancelled) setWeatherLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [show?.city, show?.venueAddress, show?.date]);

  const handleToggleReminderNotif = useCallback(async (show: Show, reminderId: string) => {
    const r = (show.reminders ?? []).find((x) => x.id === reminderId);
    if (!r) return;

    if (r.notificationId) {
      // Já tem notificação — cancela
      await cancelShowReminderNotif(r.notificationId);
      await setReminderNotification(show.id, reminderId, null, null);
    } else {
      // Agenda para 8h do dia do show (ou agora + 5min se show já foi/não tem data)
      const base = show.date ? `${show.date}T08:00:00` : new Date(Date.now() + 5 * 60000).toISOString();
      const notifyAt = new Date(base);
      const notifId = await scheduleShowReminderNotif(show, r, notifyAt);
      if (notifId) {
        await setReminderNotification(show.id, reminderId, notifyAt.toISOString(), notifId);
        Alert.alert('Lembrete agendado', `Você será notificado às 08h do dia do show.`);
      } else {
        Alert.alert('Não foi possível agendar', 'Verifique as permissões de notificação nas configurações do dispositivo.');
      }
    }
    refresh();
  }, [refresh]);

  if (loadingShow) return (
    <View style={[styles.center, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  if (!show) return (
    <View style={[styles.center, { backgroundColor: colors.background }]}>
      <Text style={[styles.notFound, { color: colors.textSecondary }]}>Show não encontrado</Text>
    </View>
  );

  // Se data ou hora estão vazias (TBD), usa fallback só pra parseISO não
  // crashar — o display abaixo detecta os vazios e mostra "A definir".
  const dateTbd = !show.date;
  const timeTbd = !show.time;
  const showDate = parseISO(`${show.date || '2099-01-01'}T${show.time || '00:00'}`);
  const past = isBefore(showDate, new Date());
  const days = differenceInDays(showDate, new Date());
  const hours = differenceInHours(showDate, new Date()) % 24;
  const mins = differenceInMinutes(showDate, new Date()) % 60;
  const urgent = !past && differenceInHours(showDate, new Date()) <= 24;

  const reminders = show.reminders ?? [];
  const remindersDone = reminders.filter((r) => r.done).length;
  const remindersTotal = reminders.length;
  const materials = show.materials ?? [];
  const materialsDone = materials.filter((m) => m.checked).length;
  const importantContacts = show.importantContacts ?? [];

  // Card de progresso unificado: lembretes + materiais.
  const doneCount = remindersDone + materialsDone;
  const totalCount = remindersTotal + materials.length;

  const addMaterial = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    await updateShow(show.id, { materials: [...materials, buildMaterialItem(trimmed)] });
    setNewMaterial('');
    setAddingMaterial(false);
    refresh();
  };

  const removeMaterial = async (itemId: string) => {
    await updateShow(show.id, { materials: materials.filter((m) => m.id !== itemId) });
    refresh();
  };

  const saveMaterialEdit = async () => {
    if (!editingMaterialId) return;
    const trimmed = editingMaterialText.trim();
    if (!trimmed) {
      setEditingMaterialId(null);
      setEditingMaterialText('');
      return;
    }
    await updateShow(show.id, {
      materials: materials.map((m) => (m.id === editingMaterialId ? { ...m, name: trimmed } : m)),
    });
    setEditingMaterialId(null);
    setEditingMaterialText('');
    refresh();
  };

  const sectionStyle = [styles.section, { backgroundColor: colors.surface }];
  const ROOM_LABELS: Record<string, string> = { single: 'Single', double: 'Duplo', triple: 'Triplo' };

  const handleSaveContact = async () => {
    if (!contactName.trim() || !contactRole.trim()) return;
    const newContact = buildContact(contactName, contactPhone, contactRole);
    await updateShow(show.id, { importantContacts: [...importantContacts, newContact] });
    setContactName(''); setContactPhone(''); setContactRole('');
    setAddingContact(false);
    refresh();
  };

  const TAB_OPTIONS: { key: TabKey; label: string }[] = [
    { key: 'details', label: 'Detalhes' },
    { key: 'timeline', label: 'Timeline' },
    { key: 'materials', label: `Check${materials.length > 0 ? ` (${materialsDone}/${materials.length})` : ''}` },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <IOSNavBar
        left={<IOSNavButton onPress={() => navigation.goBack()}>‹ Shows</IOSNavButton>}
        right={<IOSNavButton onPress={() => navigation.navigate('CreateShow', { editId: show.id })}>Editar</IOSNavButton>}
        compactTitle={show.name}
      />
    <ScrollView contentContainerStyle={styles.content}>

      {/* Hero card — mockup-faithful: badge "EM 1 DIA" + nome + contratante + DATA/SHOW/PALCO */}
      <View style={[hero.card, Platform.OS === 'web' ? ({ background: 'linear-gradient(135deg,#0D1528,#1A0A3D,#0D2040,#1A1040)', backgroundSize: '300% 300%', animation: 'heroSlide 12s ease-in-out infinite' } as any) : null]}>
        <View style={[hero.glow1, Platform.OS === 'web' ? ({ filter: 'blur(60px)' } as any) : {}]} pointerEvents="none" />
        <View style={[hero.glow2, Platform.OS === 'web' ? ({ filter: 'blur(60px)' } as any) : {}]} pointerEvents="none" />
        <View style={[hero.glow3, Platform.OS === 'web' ? ({ filter: 'blur(60px)' } as any) : {}]} pointerEvents="none" />
        <View style={[hero.glow4, Platform.OS === 'web' ? ({ filter: 'blur(60px)' } as any) : {}]} pointerEvents="none" />
        <View style={[hero.badgeWrap, { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center' }]}>
          <View style={hero.badgePill}>
            <Icon name="high" color="#fff" size={11} />
            <Text style={hero.badgePillText}>{countdownLabel(showDate, new Date()).toUpperCase()}</Text>
          </View>
          {!!show.logisticsFinalized && <VerifiedBadge size={22} />}
        </View>
        <Text style={hero.name} numberOfLines={3}>{show.name}</Text>
        {(show.city || show.venue) ? (
          <Text style={hero.cityLine} numberOfLines={1}>
            {[show.city, show.venue?.trim() !== show.name?.trim() ? show.venue : null].filter(Boolean).join(' · ')}
          </Text>
        ) : null}
        <View style={hero.divider} />
        <View style={hero.cols}>
          <View style={hero.col}>
            <Text style={hero.colLabel}>📅 DATA</Text>
            <Text style={hero.colValue}>{dateTbd ? '—' : format(showDate, 'dd/MM')}</Text>
            {!dateTbd && (
              <Text style={hero.colSub}>{capitalizeFirst(format(showDate, 'EEEE', { locale: ptBR }))}</Text>
            )}
          </View>
          <View style={[hero.col, hero.colBorder]}>
            <Text style={hero.colLabel}>🎤 SHOW</Text>
            <Text style={hero.colValue}>{timeTbd ? '—' : show.time}</Text>
          </View>
          <View style={[hero.col, hero.colBorder]}>
            <Text style={hero.colLabel}>📍 ENCONTRO</Text>
            <Text style={hero.colValue}>
              {show.departureTimeMeetingShow || show.departureTimeHotelShow || '—'}
            </Text>
            {!!show.departureTimeMeetingShow && !!show.departureTimeHotelShow && (
              <Text style={hero.colSub}>Hotel: {show.departureTimeHotelShow}</Text>
            )}
          </View>
        </View>
        {(!!weather || weatherLoading) && (
          <View style={hero.weatherStrip}>
            {weatherLoading && !weather ? (
              <Text style={hero.weatherLoading}>Carregando previsão…</Text>
            ) : weather ? (
              <>
                <View style={hero.weatherCell}>
                  <Text style={hero.weatherLabel}>TEMPERATURA</Text>
                  <Text style={hero.weatherVal}>🌡 {weather.min}°–{weather.max}°</Text>
                </View>
                <View style={hero.weatherSep} />
                <View style={hero.weatherCell}>
                  <Text style={hero.weatherLabel}>CHUVA</Text>
                  <Text style={[hero.weatherVal, {
                    color: weather.rain >= 60 ? '#7DD3FC' : weather.rain >= 30 ? '#FCD34D' : 'rgba(255,255,255,0.9)',
                  }]}>🌧 {weather.rain}%</Text>
                </View>
              </>
            ) : null}
          </View>
        )}
      </View>

      {/* Bridge gradiente hero→seções (web only) */}
      {Platform.OS === 'web' && (
        <View style={[{ height: 20, marginTop: -6, marginHorizontal: Spacing.md, borderBottomLeftRadius: Radius.xl, borderBottomRightRadius: Radius.xl, zIndex: 0 },
          { background: 'linear-gradient(to bottom, rgba(13,21,40,0.18), transparent)' } as any]}
          pointerEvents="none"
        />
      )}

      {/* Mala e Cuia banner — logo abaixo do hero */}
      {show.hotelMalaCuia && <MalaCuiaCard isDark={isDark} />}

      {/* ── AVISO DE INFORMAÇÕES FALTANTES ── */}
      {(() => {
        const missing = getMissingFields(show);
        if (missing.length === 0) return null;
        const sectionFor = (item: string): string => {
          if (item.startsWith('Voo')) return 'voo';
          if (item.startsWith('Hotel')) return 'hotel';
          if (item.startsWith('Van')) return 'van';
          return 'show';
        };
        return (
          <TouchableOpacity
            style={[styles.missingBanner, { backgroundColor: '#FF9F0A18', borderColor: '#FF9F0A' }]}
            onPress={() => setMissingExpanded((v) => !v)}
            activeOpacity={0.8}
          >
            <View style={styles.missingHeader}>
              <Text style={styles.missingIcon}>⚠️</Text>
              <Text style={[styles.missingTitle, { color: '#FF9F0A' }]}>
                {missing.length} {missing.length === 1 ? 'informação pendente' : 'informações pendentes'}
              </Text>
              <Text style={[styles.missingChevron, { color: '#FF9F0A' }]}>{missingExpanded ? '▲' : '▼'}</Text>
            </View>
            {missingExpanded && (
              <>
                <View style={[styles.missingDivider, { backgroundColor: '#FF9F0A40' }]} />
                {missing.map((item, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.missingItem}
                    onPress={() => navigation.navigate('CreateShow', { editId: show.id, scrollTo: sectionFor(item) } as any)}
                    activeOpacity={0.6}
                  >
                    <Text style={[styles.missingDot, { color: '#FF9F0A' }]}>•</Text>
                    <Text style={[styles.missingItemText, { color: colors.text }]}>{item}</Text>
                    <Text style={[styles.missingChevron, { color: '#FF9F0A', fontSize: 14 }]}>›</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </TouchableOpacity>
        );
      })()}

      {/* CHECKLIST progress card — mockup screen 1: ring + "X de Y concluídos".
          Tocar abre o modal com todos os checklists (lembretes + materiais) numa lista única. */}
      {totalCount > 0 && (
        <TouchableOpacity
          style={[progressCardS.card, { backgroundColor: colors.surface }]}
          onPress={() => setChecklistsModalVisible(true)}
          activeOpacity={0.7}
          accessibilityLabel="Ver todos os checklists"
        >
          <View style={{ flex: 1 }}>
            <Text style={[progressCardS.label, { color: colors.textSecondary }]}>CHECKLIST</Text>
            <Text style={[progressCardS.title, { color: colors.text }]}>{doneCount} de {totalCount} concluídos</Text>
          </View>
          <CircularProgress percent={Math.round((doneCount / totalCount) * 100)} colors={colors} />
          <Icon name="chevronRight" color={colors.textMuted} size={20} />
        </TouchableOpacity>
      )}

      {/* Tabs */}
      <Segmented<TabKey> value={activeTab} onChange={setActiveTab} options={TAB_OPTIONS} />

      {activeTab === 'timeline' && (
        <TimelineView show={show} colors={colors} />
      )}

      {activeTab === 'materials' ? (
        <View style={sectionStyle}>
          <View style={styles.remindersHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>🎛️ CHECK DE MATERIAL</Text>
            {materials.length > 0 && (
              <View style={[styles.progressPill, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.progressPillText, { color: colors.primary }]}>{materialsDone}/{materials.length} OK</Text>
              </View>
            )}
          </View>
          {materials.length > 0 && (
            <View style={[styles.progressBarFull, { backgroundColor: colors.border }]}>
              <View style={[styles.progressFill, { width: `${(materialsDone / materials.length) * 100}%` as any, backgroundColor: colors.success }]} />
            </View>
          )}
          {materials.map((m) => (
            <View key={m.id} style={[styles.reminderRow, { borderBottomColor: colors.border }]}>
              <TouchableOpacity style={styles.reminderCheck} onPress={async () => { await toggleMaterialItem(show.id, m.id); refresh(); }}>
                <View style={[styles.checkBox, { borderColor: colors.primary }, m.checked && { backgroundColor: colors.success, borderColor: colors.success }]}>
                  {m.checked && <Text style={styles.checkMark}>✓</Text>}
                </View>
              </TouchableOpacity>
              {editingMaterialId === m.id ? (
                <TextInput
                  style={[styles.addInput, { flex: 1, backgroundColor: colors.background, borderColor: colors.primary, color: colors.text }]}
                  value={editingMaterialText}
                  onChangeText={setEditingMaterialText}
                  autoFocus
                  autoCapitalize="sentences"
                  returnKeyType="done"
                  onSubmitEditing={saveMaterialEdit}
                  onBlur={saveMaterialEdit}
                />
              ) : (
                <Text
                  style={[styles.reminderText, { color: colors.text }, m.checked && { textDecorationLine: 'line-through', color: colors.textMuted }]}
                  onPress={() => { setEditingMaterialId(m.id); setEditingMaterialText(m.name); }}
                >
                  {m.name}
                </Text>
              )}
              <TouchableOpacity onPress={() => removeMaterial(m.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name="close" color={colors.textMuted} size={18} />
              </TouchableOpacity>
            </View>
          ))}
          {addingMaterial ? (
            <View style={styles.addRow}>
              <TextInput
                style={[styles.addInput, { backgroundColor: colors.background, borderColor: colors.primary, color: colors.text }]}
                placeholder="EX: GUITARRA, PEDALEIRA, CABO P10..."
                placeholderTextColor={colors.textMuted}
                value={newMaterial}
                onChangeText={setNewMaterial}
                autoFocus returnKeyType="done" autoCapitalize="sentences"
                onSubmitEditing={() => addMaterial(newMaterial)}
              />
              <TouchableOpacity style={[styles.addConfirm, { backgroundColor: colors.primary }]} onPress={() => addMaterial(newMaterial)}>
                <Text style={styles.addConfirmText}>+</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setAddingMaterial(false); setNewMaterial(''); }}>
                <Icon name="close" color={colors.textMuted} size={18} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={[styles.addBtn, { borderColor: colors.primary }]} onPress={() => setAddingMaterial(true)}>
              <Text style={[styles.addBtnText, { color: colors.primary }]}>+ Adicionar material</Text>
            </TouchableOpacity>
          )}
          {materials.length === 0 && !addingMaterial && (
            <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
              Monte aqui a lista de materiais do show e marque cada item conforme conferir.
            </Text>
          )}
        </View>
      ) : (
      <>

      {/* Exportar PDF — web only. Mesma largura/inset dos blocos agrupados (LOCAL/LOGÍSTICA…). */}
      {Platform.OS === 'web' && (
        <TouchableOpacity
          style={[styles.pdfBtn, { backgroundColor: colors.surface, borderColor: colors.primary }]}
          onPress={() => exportShowPDF(show)}
          activeOpacity={0.7}
        >
          <Icon name="tag" color={colors.primary} size={22} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.pdfBtnTitle, { color: colors.text }]}>Exportar PDF</Text>
            <Text style={[styles.pdfBtnSubtitle, { color: colors.textSecondary }]}>Resumo completo do show — voo, hotel, contatos e checklist</Text>
          </View>
          <Icon name="chevronRight" color={colors.primary} size={22} />
        </TouchableOpacity>
      )}

      {Platform.OS === 'web' && (
        <TouchableOpacity
          style={[styles.pdfBtn, { backgroundColor: colors.surface, borderColor: colors.primary }]}
          onPress={() => exportTeamPDF(show, returnFlightShow)}
          activeOpacity={0.7}
        >
          <Icon name="people" color={colors.primary} size={22} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.pdfBtnTitle, { color: colors.text }]}>Exportar Equipe</Text>
            <Text style={[styles.pdfBtnSubtitle, { color: colors.textSecondary }]}>Roteiro da equipe — sem contatos</Text>
          </View>
          <Icon name="chevronRight" color={colors.primary} size={22} />
        </TouchableOpacity>
      )}

      {Platform.OS === 'web' && (
        <View style={{ marginHorizontal: Spacing.md, marginBottom: Spacing.md }}>
          <TouchableOpacity
            style={[styles.pdfBtn, { backgroundColor: colors.surface, borderColor: colors.primary, marginHorizontal: 0, marginBottom: Spacing.sm }]}
            onPress={() => {
              const url = generateTeamLink(show);
              setTeamLinkUrl(url);
              if (navigator?.clipboard?.writeText) {
                navigator.clipboard.writeText(url).catch(() => {});
              }
              setTeamLinkModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 20 }}>🔗</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.pdfBtnTitle, { color: colors.text }]}>
                {teamLinkModalVisible ? '✓ Link copiado!' : 'Gerar Link da Equipe'}
              </Text>
              <Text style={[styles.pdfBtnSubtitle, { color: colors.textSecondary }]}>Toque para copiar o link da equipe</Text>
            </View>
            <Icon name="chevronRight" color={colors.primary} size={22} />
          </TouchableOpacity>
          {teamLinkModalVisible && !!teamLinkUrl && (
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <TouchableOpacity
                style={[execS.linkActionBtn, { backgroundColor: colors.surface, borderColor: colors.border, flex: 1 }]}
                onPress={() => window.open(teamLinkUrl, '_blank', 'noopener')}
                activeOpacity={0.7}
              >
                <Text style={[execS.linkActionText, { color: colors.text }]}>🌐 Abrir</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[execS.linkActionBtn, { backgroundColor: '#25D366', borderColor: '#25D366', flex: 1 }]}
                onPress={() => window.open(`https://wa.me/?text=${encodeURIComponent(teamLinkUrl)}`, '_blank', 'noopener')}
                activeOpacity={0.7}
              >
                <Text style={[execS.linkActionText, { color: '#fff' }]}>💬 WhatsApp</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Artist link */}
          <TouchableOpacity
            style={[styles.pdfBtn, { backgroundColor: colors.surface, borderColor: '#FF9F0A', marginHorizontal: 0, marginBottom: artistLinkModalVisible ? Spacing.sm : 0, marginTop: Spacing.sm }]}
            onPress={() => {
              const url = generateArtistLink(show);
              setArtistLinkUrl(url);
              if (navigator?.clipboard?.writeText) {
                navigator.clipboard.writeText(url).catch(() => {});
              }
              setArtistLinkModalVisible(true);
              setTimeout(() => setArtistLinkModalVisible(false), 3000);
            }}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 20 }}>🎤</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.pdfBtnTitle, { color: colors.text }]}>
                {artistLinkModalVisible ? '✓ Link copiado!' : 'Gerar Link do Artista'}
              </Text>
              <Text style={[styles.pdfBtnSubtitle, { color: colors.textSecondary }]}>Toque para copiar o link do artista</Text>
            </View>
            <Icon name="chevronRight" color="#FF9F0A" size={22} />
          </TouchableOpacity>
          {artistLinkModalVisible && !!artistLinkUrl && (
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <TouchableOpacity
                style={[execS.linkActionBtn, { backgroundColor: colors.surface, borderColor: colors.border, flex: 1 }]}
                onPress={() => window.open(artistLinkUrl, '_blank', 'noopener')}
                activeOpacity={0.7}
              >
                <Text style={[execS.linkActionText, { color: colors.text }]}>🌐 Abrir</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[execS.linkActionBtn, { backgroundColor: '#25D366', borderColor: '#25D366', flex: 1 }]}
                onPress={() => window.open(`https://wa.me/?text=${encodeURIComponent(artistLinkUrl)}`, '_blank', 'noopener')}
                activeOpacity={0.7}
              >
                <Text style={[execS.linkActionText, { color: '#fff' }]}>💬 WhatsApp</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* LOCAL — mockup screen 2 */}
      {!!show.venue && (
        <>
          <Text style={[grp.header, { color: colors.textSecondary }]}>Local</Text>
          <View style={[grp.group, { backgroundColor: colors.surface, borderLeftColor: '#FF9F0A' }]}>
            <GroupRow
              iconNode={<Icon name="pin" color="#fff" size={16} />}
              iconColor="#FF9F0A"
              title={show.venue}
              subtitle={[show.venueAddress, show.city].filter(Boolean).join(' · ')}
              colors={colors}
              isLast
              trailing={show.venueAddress ? (
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <WazeButton address={[show.venueAddress, show.city].filter(Boolean).join(', ')} colors={colors} />
                  <CopyAddressButton address={show.venueAddress} colors={colors} />
                </View>
              ) : undefined}
            />
          </View>
        </>
      )}

      {/* VOO */}
      {show.hasAirplane && (
        <>
          <Text style={[grp.header, { color: '#5E5CE6' }]}>Voo</Text>

          {/* Direto */}
          {!show.hasEscala && (
            <>
              <View style={[grp.group, { backgroundColor: colors.surface, borderLeftColor: '#5E5CE6' }]}>
                <GroupRow
                  iconNode={<Icon name="airplane" color="#fff" size={16} />}
                  iconColor="#5E5CE6"
                  title={show.flightNumber ? `Voo ${show.flightNumber}` : 'Voo'}
                  subtitle={[show.airportName, show.flightTime].filter(Boolean).join(' · ')}
                  colors={colors}
                  isLast
                />
              </View>
              {(show.airportName || show.airportDestination || show.flightDate || show.flightArrivalDate) && (
                <View style={[styles.bpCard, { marginHorizontal: Spacing.md, marginBottom: Spacing.sm }]}>
                  <View style={styles.bpStrip}>
                    {/* Departure */}
                    <View style={{ flex: 1, minWidth: 0 }}>
                      {show.flightDate ? <Text style={styles.bpDate}>{show.flightDate}</Text> : null}
                      <Text style={styles.bpIata}>{show.airportName || '—'}</Text>
                      <Text style={styles.bpCity} numberOfLines={1}>{airportCity(show.airportName) || ''}</Text>
                      <Text style={styles.bpTimeDep}>{show.flightTime || '--:--'}</Text>
                    </View>
                    {/* Arrow */}
                    <View style={styles.bpMid}>
                      <View style={styles.bpTrack} />
                      <Text style={styles.bpPlane} accessibilityElementsHidden={true} importantForAccessibility="no">✈</Text>
                    </View>
                    {/* Arrival */}
                    <View style={{ flex: 1, minWidth: 0, alignItems: 'flex-end' }}>
                      {show.flightDate ? <Text style={styles.bpDate}>{show.flightArrivalDate || show.flightDate}</Text> : null}
                      <Text style={styles.bpIata}>{show.airportDestination || '—'}</Text>
                      <Text style={[styles.bpCity, { textAlign: 'right' }]} numberOfLines={1}>{airportCity(show.airportDestination) || ''}</Text>
                      <Text style={styles.bpTimeArr}>{show.flightArrivalTime || '--:--'}</Text>
                    </View>
                  </View>
                </View>
              )}
              {show.flightTime && (
                <View style={[styles.flightBanner, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.flightBannerText, { color: colors.primary }]}>
                    🛫 Embarque: {flightSubtract(show.flightTime, 45)}{'   '}•{'   '}🧳 Despacho: {flightSubtract(show.flightTime, 120)}
                  </Text>
                </View>
              )}
              {show.flightLocators && show.flightLocators.length > 0 && (
                <View style={styles.cardsBlock}>
                  {show.flightLocators.map((loc, idx) => (
                    <View key={loc.id} style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <View style={styles.infoCardHeader}>
                        <Text style={[styles.infoCardLabel, { color: colors.textSecondary }]}>Localizador {idx + 1}</Text>
                        <View style={styles.locatorCodeRow}>
                          <Text style={[styles.locatorCode, { color: colors.primary }]}>{loc.code}</Text>
                          <TouchableOpacity
                            style={[styles.copyBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                            onPress={() => Share.share({ message: loc.code })}
                          >
                            <Text style={[styles.copyBtnText, { color: colors.primary }]}>Copiar</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      {loc.isNewFlight && (
                        <View style={[styles.newFlightBadge, { backgroundColor: colors.warningLight }]}>
                          {loc.airline && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <Icon name="airplane" color={colors.text} size={14} />
                              <Text style={[styles.newFlightText, { color: colors.text }]}>{loc.airline}{loc.flightNumberLocator ? ` • ${loc.flightNumberLocator}` : ''}</Text>
                            </View>
                          )}
                          {(loc.origin || loc.destination) && (
                            <Text style={[styles.newFlightText, { color: colors.textSecondary }]}>
                              {airportLabel(loc.origin) || '—'} → {airportLabel(loc.destination) || '—'}
                            </Text>
                          )}
                          {loc.flightDate && <Text style={[styles.newFlightText, { color: colors.textSecondary }]}>📅 {loc.flightDate}</Text>}
                          {loc.flightTimeLocator && (
                            <>
                              <Text style={[styles.newFlightText, { color: colors.textSecondary }]}>🕐 {loc.flightTimeLocator}</Text>
                              <Text style={[styles.newFlightText, { color: colors.primary, fontWeight: '700' }]}>
                                🛫 Embarque: {flightSubtract(loc.flightTimeLocator, 45)}{'   '}•{'   '}🧳 Despacho: {flightSubtract(loc.flightTimeLocator, 120)}
                              </Text>
                            </>
                          )}
                        </View>
                      )}
                      {loc.passengers.length > 0 && (
                        <View style={styles.passengerList}>
                          {loc.passengers.map((p, pIdx) => (
                            <Text key={pIdx} style={[styles.passengerItem, { color: colors.text }]}>• {p}</Text>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          {/* Com escala — timeline */}
          {show.hasEscala && show.flightLegs && show.flightLegs.length > 0 && (
            <View style={styles.cardsBlock}>
              {/* Origin */}
              <Text style={[styles.tlAirport, { color: colors.text }]}>
                <Text style={{ color: '#30D158' }}>○  </Text>
                {airportLabel(show.flightLegs[0].origin) || show.flightLegs[0].origin || '—'}
              </Text>

              <View style={styles.tlDots}>
                <Text style={[styles.tlDotsText, { color: colors.textMuted }]}>•{'\n'}•{'\n'}•</Text>
              </View>

              {show.flightLegs.map((leg, legIdx) => {
                const isLast = legIdx === show.flightLegs!.length - 1;
                const nextLeg = isLast ? null : show.flightLegs![legIdx + 1];
                const layover = !isLast && nextLeg ? calcLayover(leg.arrivalDate, leg.arrivalTime ?? '', nextLeg.date, nextLeg.time ?? '') : null;

                return (
                  <React.Fragment key={leg.id}>
                    {/* Leg card */}
                    <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <View style={styles.infoCardHeader}>
                        <Text style={[styles.infoCardLabel, { color: colors.textSecondary }]}>Trecho {legIdx + 1}</Text>
                        {(leg.airline || leg.flightNumber) && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Icon name="airplane" color={colors.textSecondary} size={13} />
                            <Text style={[styles.newFlightText, { color: colors.text }]}>
                              {[leg.airline, leg.flightNumber].filter(Boolean).join(' ')}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Partida / Chegada com cidade — boarding pass */}
                      <View style={styles.bpStrip}>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          {leg.date ? <Text style={styles.bpDate}>{leg.date}</Text> : null}
                          <Text style={styles.bpIata}>{leg.origin || '—'}</Text>
                          <Text style={styles.bpCity} numberOfLines={1}>{airportCity(leg.origin) || ''}</Text>
                          <Text style={styles.bpTimeDep}>{leg.time || '--:--'}</Text>
                        </View>
                        <View style={styles.bpMid}>
                          <View style={styles.bpTrack} />
                          <Text style={styles.bpPlane} accessibilityElementsHidden={true} importantForAccessibility="no">✈</Text>
                        </View>
                        <View style={{ flex: 1, minWidth: 0, alignItems: 'flex-end' }}>
                          {leg.date ? <Text style={styles.bpDate}>{leg.arrivalDate || leg.date}</Text> : null}
                          <Text style={styles.bpIata}>{leg.destination || '—'}</Text>
                          <Text style={[styles.bpCity, { textAlign: 'right' }]} numberOfLines={1}>{airportCity(leg.destination) || ''}</Text>
                          <Text style={styles.bpTimeArr}>{leg.arrivalTime || '--:--'}</Text>
                        </View>
                      </View>

                      {leg.time && (
                        <View style={[styles.flightBanner, { backgroundColor: colors.primaryLight, marginTop: Spacing.xs, marginBottom: 0 }]}>
                          <Text style={[styles.flightBannerText, { color: colors.primary }]}>
                            🛫 Embarque: {flightSubtract(leg.time, 45)}{'   '}•{'   '}🧳 Despacho: {flightSubtract(leg.time, 120)}
                          </Text>
                        </View>
                      )}

                      {leg.localizadores.filter((lc) => lc.code).map((loc, locIdx) => (
                        <View key={loc.id} style={[styles.newFlightBadge, { backgroundColor: colors.primaryLight, marginTop: 6 }]}>
                          <View style={styles.locatorCodeRow}>
                            <Text style={[styles.infoCardLabel, { color: colors.textSecondary }]}>Loc {locIdx + 1}</Text>
                            <Text style={[styles.locatorCode, { color: colors.primary }]}>{loc.code}</Text>
                            <TouchableOpacity
                              style={[styles.copyBtn, { backgroundColor: colors.surface, borderColor: colors.primary }]}
                              onPress={() => Share.share({ message: loc.code })}
                            >
                              <Text style={[styles.copyBtnText, { color: colors.primary }]}>Copiar</Text>
                            </TouchableOpacity>
                          </View>
                          {loc.passengers.length > 0 && (
                            <View style={styles.passengerList}>
                              {loc.passengers.map((p, pIdx) => (
                                <Text key={pIdx} style={[styles.passengerItem, { color: colors.text }]}>• {p}</Text>
                              ))}
                            </View>
                          )}
                        </View>
                      ))}
                    </View>

                    <View style={styles.tlDots}>
                      <Text style={[styles.tlDotsText, { color: colors.textMuted }]}>•{'\n'}•{'\n'}•</Text>
                    </View>

                    {/* Connection or destination */}
                    {isLast ? (
                      <Text style={[styles.tlAirport, { color: colors.text }]}>
                        <Text style={{ color: colors.primary }}>●  </Text>
                        {airportLabel(leg.destination) || leg.destination || '—'}
                      </Text>
                    ) : (
                      <>
                        <Text style={[styles.tlAirport, { color: colors.text }]}>
                          <Text style={{ color: '#FF9F0A' }}>◈  </Text>
                          {airportLabel(leg.destination) || leg.destination || '—'}
                        </Text>
                        <View style={[styles.layoverBanner, { backgroundColor: '#FF9F0A20', borderColor: '#FF9F0A' }]}>
                          <Text style={[styles.layoverLabel, { color: '#FF9F0A' }]}>DURAÇÃO DA CONEXÃO</Text>
                          <Text style={[styles.layoverValue, { color: colors.text }]}>{layover ?? '—'}</Text>
                        </View>
                        <View style={styles.tlDots}>
                          <Text style={[styles.tlDotsText, { color: colors.textMuted }]}>•{'\n'}•{'\n'}•</Text>
                        </View>
                      </>
                    )}
                  </React.Fragment>
                );
              })}
            </View>
          )}
        </>
      )}

      {/* VOO DE VOLTA (linked from another show) */}
      {returnFlightShow && returnFlightShow.hasAirplane && (
        <>
          <Text style={[grp.header, { color: '#5E5CE6' }]}>Voo de volta</Text>

          <TouchableOpacity
            style={[styles.linkedShowChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.push('ShowDetail', { showId: returnFlightShow.id })}
            activeOpacity={0.7}
          >
            <Text style={styles.linkedShowChipIcon}>🔗</Text>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.linkedShowChipName, { color: colors.text }]} numberOfLines={1}>{returnFlightShow.name}</Text>
              <Text style={[styles.linkedShowChipMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                Vinculado · {returnFlightShow.date}{returnFlightShow.city ? ` · ${returnFlightShow.city}` : ''}
              </Text>
            </View>
            <Text style={[styles.linkedShowChipChevron, { color: colors.textMuted }]}>›</Text>
          </TouchableOpacity>

          {/* Voo direto */}
          {!returnFlightShow.hasEscala && (
            <>
              <View style={[grp.group, { backgroundColor: colors.surface, borderLeftColor: '#5E5CE6' }]}>
                <GroupRow
                  iconNode={<Icon name="airplane" color="#fff" size={16} />}
                  iconColor="#5E5CE6"
                  title={returnFlightShow.flightNumber ? `Voo ${returnFlightShow.flightNumber}` : 'Voo de volta'}
                  subtitle={[returnFlightShow.airportName, returnFlightShow.flightTime].filter(Boolean).join(' · ')}
                  colors={colors}
                  isLast
                />
              </View>
              {(returnFlightShow.airportName || returnFlightShow.airportDestination || returnFlightShow.flightDate || returnFlightShow.flightArrivalDate) && (
                <View style={[styles.bpCard, { marginHorizontal: Spacing.md, marginBottom: Spacing.sm }]}>
                  <View style={styles.bpStrip}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      {returnFlightShow.flightDate ? <Text style={styles.bpDate}>{returnFlightShow.flightDate}</Text> : null}
                      <Text style={styles.bpIata}>{returnFlightShow.airportName || '—'}</Text>
                      <Text style={styles.bpCity} numberOfLines={1}>{airportCity(returnFlightShow.airportName) || ''}</Text>
                      <Text style={styles.bpTimeDep}>{returnFlightShow.flightTime || '--:--'}</Text>
                    </View>
                    <View style={styles.bpMid}>
                      <View style={styles.bpTrack} />
                      <Text style={styles.bpPlane} accessibilityElementsHidden={true} importantForAccessibility="no">✈</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0, alignItems: 'flex-end' }}>
                      {returnFlightShow.flightDate ? <Text style={styles.bpDate}>{returnFlightShow.flightArrivalDate || returnFlightShow.flightDate}</Text> : null}
                      <Text style={styles.bpIata}>{returnFlightShow.airportDestination || '—'}</Text>
                      <Text style={[styles.bpCity, { textAlign: 'right' }]} numberOfLines={1}>{airportCity(returnFlightShow.airportDestination) || ''}</Text>
                      <Text style={styles.bpTimeArr}>{returnFlightShow.flightArrivalTime || '--:--'}</Text>
                    </View>
                  </View>
                </View>
              )}
              {returnFlightShow.flightTime && (
                <View style={[styles.flightBanner, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.flightBannerText, { color: colors.primary }]}>
                    🛫 Embarque: {flightSubtract(returnFlightShow.flightTime, 45)}{'   '}•{'   '}🧳 Despacho: {flightSubtract(returnFlightShow.flightTime, 120)}
                  </Text>
                </View>
              )}
              {returnFlightShow.flightLocators && returnFlightShow.flightLocators.length > 0 && (
                <View style={styles.cardsBlock}>
                  {returnFlightShow.flightLocators.map((loc, idx) => (
                    <View key={loc.id} style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <View style={styles.infoCardHeader}>
                        <Text style={[styles.infoCardLabel, { color: colors.textSecondary }]}>Localizador {idx + 1}</Text>
                        <View style={styles.locatorCodeRow}>
                          <Text style={[styles.locatorCode, { color: colors.primary }]}>{loc.code}</Text>
                          <TouchableOpacity
                            style={[styles.copyBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                            onPress={() => Share.share({ message: loc.code })}
                          >
                            <Text style={[styles.copyBtnText, { color: colors.primary }]}>Copiar</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      {loc.passengers.length > 0 && (
                        <View style={styles.passengerList}>
                          {loc.passengers.map((p, pIdx) => (
                            <Text key={pIdx} style={[styles.passengerItem, { color: colors.text }]}>• {p}</Text>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          {/* Voo com escala */}
          {returnFlightShow.hasEscala && returnFlightShow.flightLegs && returnFlightShow.flightLegs.length > 0 && (
            <View style={styles.cardsBlock}>
              <Text style={[styles.tlAirport, { color: colors.text }]}>
                <Text style={{ color: '#30D158' }}>○  </Text>
                {airportLabel(returnFlightShow.flightLegs[0].origin) || returnFlightShow.flightLegs[0].origin || '—'}
              </Text>
              <View style={styles.tlDots}>
                <Text style={[styles.tlDotsText, { color: colors.textMuted }]}>•{'\n'}•{'\n'}•</Text>
              </View>

              {returnFlightShow.flightLegs.map((leg, legIdx) => {
                const isLast = legIdx === returnFlightShow.flightLegs!.length - 1;
                const nextLeg = isLast ? null : returnFlightShow.flightLegs![legIdx + 1];
                const layover = !isLast && nextLeg ? calcLayover(leg.arrivalDate, leg.arrivalTime ?? '', nextLeg.date, nextLeg.time ?? '') : null;
                return (
                  <React.Fragment key={leg.id}>
                    <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <View style={styles.infoCardHeader}>
                        <Text style={[styles.infoCardLabel, { color: colors.textSecondary }]}>Trecho {legIdx + 1}</Text>
                        {(leg.airline || leg.flightNumber) && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Icon name="airplane" color={colors.textSecondary} size={13} />
                            <Text style={[styles.newFlightText, { color: colors.text }]}>
                              {[leg.airline, leg.flightNumber].filter(Boolean).join(' ')}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.bpStrip}>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          {leg.date ? <Text style={styles.bpDate}>{leg.date}</Text> : null}
                          <Text style={styles.bpIata}>{leg.origin || '—'}</Text>
                          <Text style={styles.bpCity} numberOfLines={1}>{airportCity(leg.origin) || ''}</Text>
                          <Text style={styles.bpTimeDep}>{leg.time || '--:--'}</Text>
                        </View>
                        <View style={styles.bpMid}>
                          <View style={styles.bpTrack} />
                          <Text style={styles.bpPlane} accessibilityElementsHidden={true} importantForAccessibility="no">✈</Text>
                        </View>
                        <View style={{ flex: 1, minWidth: 0, alignItems: 'flex-end' }}>
                          {leg.date ? <Text style={styles.bpDate}>{leg.arrivalDate || leg.date}</Text> : null}
                          <Text style={styles.bpIata}>{leg.destination || '—'}</Text>
                          <Text style={[styles.bpCity, { textAlign: 'right' }]} numberOfLines={1}>{airportCity(leg.destination) || ''}</Text>
                          <Text style={styles.bpTimeArr}>{leg.arrivalTime || '--:--'}</Text>
                        </View>
                      </View>
                      {leg.time && (
                        <View style={[styles.flightBanner, { backgroundColor: colors.primaryLight, marginTop: Spacing.xs, marginBottom: 0 }]}>
                          <Text style={[styles.flightBannerText, { color: colors.primary }]}>
                            🛫 Embarque: {flightSubtract(leg.time, 45)}{'   '}•{'   '}🧳 Despacho: {flightSubtract(leg.time, 120)}
                          </Text>
                        </View>
                      )}
                      {leg.localizadores.filter((lc) => lc.code).map((loc, locIdx) => (
                        <View key={loc.id} style={[styles.newFlightBadge, { backgroundColor: colors.primaryLight, marginTop: 6 }]}>
                          <View style={styles.locatorCodeRow}>
                            <Text style={[styles.infoCardLabel, { color: colors.textSecondary }]}>Loc {locIdx + 1}</Text>
                            <Text style={[styles.locatorCode, { color: colors.primary }]}>{loc.code}</Text>
                            <TouchableOpacity
                              style={[styles.copyBtn, { backgroundColor: colors.surface, borderColor: colors.primary }]}
                              onPress={() => Share.share({ message: loc.code })}
                            >
                              <Text style={[styles.copyBtnText, { color: colors.primary }]}>Copiar</Text>
                            </TouchableOpacity>
                          </View>
                          {loc.passengers.length > 0 && (
                            <View style={styles.passengerList}>
                              {loc.passengers.map((p, pIdx) => (
                                <Text key={pIdx} style={[styles.passengerItem, { color: colors.text }]}>• {p}</Text>
                              ))}
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                    <View style={styles.tlDots}>
                      <Text style={[styles.tlDotsText, { color: colors.textMuted }]}>•{'\n'}•{'\n'}•</Text>
                    </View>
                    {isLast ? (
                      <Text style={[styles.tlAirport, { color: colors.text }]}>
                        <Text style={{ color: colors.primary }}>●  </Text>
                        {airportLabel(leg.destination) || leg.destination || '—'}
                      </Text>
                    ) : (
                      <>
                        <Text style={[styles.tlAirport, { color: colors.text }]}>
                          <Text style={{ color: '#FF9F0A' }}>◈  </Text>
                          {airportLabel(leg.destination) || leg.destination || '—'}
                        </Text>
                        <View style={[styles.layoverBanner, { backgroundColor: '#FF9F0A20', borderColor: '#FF9F0A' }]}>
                          <Text style={[styles.layoverLabel, { color: '#FF9F0A' }]}>DURAÇÃO DA CONEXÃO</Text>
                          <Text style={[styles.layoverValue, { color: colors.text }]}>{layover ?? '—'}</Text>
                        </View>
                        <View style={styles.tlDots}>
                          <Text style={[styles.tlDotsText, { color: colors.textMuted }]}>•{'\n'}•{'\n'}•</Text>
                        </View>
                      </>
                    )}
                  </React.Fragment>
                );
              })}
            </View>
          )}
        </>
      )}

      {/* VAN */}
      {show.hasVan && (
        <>
          <Text style={[grp.header, { color: '#30D158' }]}>Van</Text>
          <View style={[grp.group, { backgroundColor: colors.surface, borderLeftColor: '#30D158' }]}>
            <GroupRow
              iconNode={<Icon name="van" color="#fff" size={16} />}
              iconColor="#BF5AF2"
              title={show.vanColor ? `Van ${show.vanColor}` : 'Van'}
              subtitle={[show.vanDriverName, show.vanPlate].filter(Boolean).join(' · ')}
              colors={colors}
              isLast
              onPress={show.vanDriverPhone ? () => openWhatsApp(show.vanDriverPhone!) : undefined}
            />
          </View>
        </>
      )}

      {/* HOTEL */}
      {show.hasHotel && (
        <>
          <Text style={[grp.header, { color: '#FF9F0A' }]}>Hotel</Text>
          <View style={[grp.group, { backgroundColor: colors.surface, borderLeftColor: '#FF9F0A' }]}>
            <GroupRow
              iconNode={<Icon name="bed" color="#fff" size={16} />}
              iconColor="#30D158"
              title={show.hotelName || 'Hotel'}
              subtitle={show.hotelAddress || ''}
              colors={colors}
              isLast
              trailing={show.hotelAddress ? (
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <WazeButton address={show.hotelAddress} colors={colors} />
                  <CopyAddressButton address={show.hotelAddress} colors={colors} />
                </View>
              ) : undefined}
            />
          </View>
          {show.departureTimeHotelShow && (
            <View style={styles.hotelMetaRow}>
              <View style={[styles.hotelMetaBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.hotelMetaText, { color: colors.text }]}>🚌 Saída: {show.departureTimeHotelShow}</Text>
              </View>
            </View>
          )}
          {show.hotelRooms && show.hotelRooms.length > 0 && (() => {
            const sorted = [...show.hotelRooms].sort((a, b) => {
              const order: Record<string, number> = { single: 0, double: 1, triple: 2 };
              return (order[a.type] ?? 0) - (order[b.type] ?? 0);
            });
            const pairs: (typeof sorted)[] = [];
            for (let i = 0; i < sorted.length; i += 2) pairs.push(sorted.slice(i, i + 2));
            return (
              <View style={{ marginHorizontal: Spacing.md, gap: 8, marginBottom: Spacing.md }}>
                {pairs.map((pair, pi) => (
                  <View key={pi} style={{ flexDirection: 'row', gap: 8, alignItems: 'stretch' }}>
                    {pair.map((room) => {
                      const guests = room.passengers.filter(Boolean);
                      const hasNum = !!room.roomNumber;
                      return (
                        <View key={room.id} style={{ flex: 1, minWidth: 0, backgroundColor: colors.surface, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: colors.border }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 6 }}>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: hasNum ? colors.text : colors.textSecondary, flex: 1, minWidth: 0 }} numberOfLines={1}>
                              {hasNum ? `Quarto ${room.roomNumber}` : 'Sem nº'}
                            </Text>
                            <View style={{ backgroundColor: colors.primaryLight, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, flexShrink: 0 }}>
                              <Text style={{ fontSize: 10, fontWeight: '800', color: colors.primary, letterSpacing: 0.6, textTransform: 'uppercase' as any }}>{ROOM_LABELS[room.type] ?? room.type}</Text>
                            </View>
                          </View>
                          <Text style={{ fontSize: 12, color: guests.length ? colors.text : colors.textSecondary }} numberOfLines={2}>
                            {guests.length ? guests.join(' · ') : 'Sem hóspedes'}
                          </Text>
                        </View>
                      );
                    })}
                    {pair.length === 1 && <View style={{ flex: 1 }} />}
                  </View>
                ))}
              </View>
            );
          })()}
        </>
      )}

      {/* Botão CHEGUEI NO HOTEL */}
      {show.hasHotel && (
        <TouchableOpacity
          style={[styles.hotelArriveBtn, { backgroundColor: colors.primary }]}
          onPress={() => setHotelModalVisible(true)}
          activeOpacity={0.82}
        >
          <Text style={styles.hotelArriveBtnText}>CHEGUEI NO HOTEL</Text>
        </TouchableOpacity>
      )}

      {show && (
        <HotelManagerModal
          visible={hotelModalVisible}
          initialRooms={show.hotelRooms ?? []}
          onClose={() => setHotelModalVisible(false)}
          onSave={saveHotelRooms}
          colors={colors}
          teamMembers={teamMembers}
        />
      )}

      {/* Ponto de encontro em destaque — única info que aparece nessa seção.
          (Antes tinha "Distâncias & saídas" com várias linhas, mas só ponto
          de encontro era acionável visualmente; o resto sumia.) */}
      {show.departureTimeMeetingShow ? (
        <View style={sectionStyle}>
          <View style={[styles.meetingPointRow, { backgroundColor: isDark ? 'rgba(255,159,10,0.15)' : 'rgba(255,159,10,0.10)' }]}>
            <Icon name="pin" color="#FF9F0A" size={22} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.meetingPointLabel, { color: colors.text }]}>Ponto de encontro</Text>
              <Text style={[styles.meetingPointValue, { color: '#FF9F0A' }]}>{show.departureTimeMeetingShow}</Text>
            </View>
          </View>
        </View>
      ) : null}

      {/* CHECKLIST DO SHOW — mockup screen 3 */}
      <Text style={[grp.header, { color: '#BF5AF2' }]}>Checklist do show</Text>
      <View style={[grp.group, { backgroundColor: colors.surface, borderLeftColor: '#BF5AF2' }]}>
        {reminders.map((r, i) => {
          const isLastReminder = i === reminders.length - 1 && !addingReminder;
          const hasNotif = !!r.notificationId;
          return (
            <View key={r.id} style={[grp.checklistRow, !isLastReminder && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={async () => { await toggleShowReminder(show.id, r.id); refresh(); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <View style={[grp.checkCircle, { borderColor: r.done ? colors.primary : colors.textMuted, backgroundColor: r.done ? colors.primary : 'transparent' }]}>
                  {r.done && <Text style={grp.checkCircleMark}>✓</Text>}
                </View>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={[grp.checklistText, { color: colors.text }, r.done && { textDecorationLine: 'line-through', color: colors.textSecondary }]}>{r.text}</Text>
                {r.notifyAt ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Icon name="bell" color={colors.primary} size={12} />
                    <Text style={[grp.checklistTime, { color: colors.primary }]}>{format(parseISO(r.notifyAt), "dd/MM 'às' HH:mm")}</Text>
                  </View>
                ) : null}
              </View>
              <TouchableOpacity
                onPress={() => handleToggleReminderNotif(show, r.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{ paddingHorizontal: 6 }}
              >
                <Icon name="bell" color={colors.primary} size={18} />
              </TouchableOpacity>
              <TouchableOpacity onPress={async () => {
                if (r.notificationId) await cancelShowReminderNotif(r.notificationId);
                await updateShow(show.id, { reminders: reminders.filter((x) => x.id !== r.id) });
                refresh();
              }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name="close" color={colors.textMuted} size={18} />
              </TouchableOpacity>
            </View>
          );
        })}
        {addingReminder ? (
          <View style={[grp.checklistRow, { gap: Spacing.xs }]}>
            <TextInput
              style={[grp.inlineInput, { color: colors.text, borderColor: colors.primary }]}
              placeholder="NOVO LEMBRETE…"
              placeholderTextColor={colors.textMuted}
              value={newReminder}
              onChangeText={setNewReminder}
              autoFocus returnKeyType="done" autoCapitalize="sentences"
              onSubmitEditing={async () => {
                if (!newReminder.trim()) return;
                await updateShow(show.id, { reminders: [...reminders, buildReminder(newReminder.trim())] });
                setNewReminder(''); setAddingReminder(false); refresh();
              }}
            />
            <TouchableOpacity style={[grp.inlineConfirm, { backgroundColor: colors.primary }]} onPress={async () => {
              if (!newReminder.trim()) return;
              await updateShow(show.id, { reminders: [...reminders, buildReminder(newReminder.trim())] });
              setNewReminder(''); setAddingReminder(false); refresh();
            }}>
              <Text style={grp.inlineConfirmText}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setAddingReminder(false); setNewReminder(''); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="close" color={colors.textMuted} size={18} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={grp.addInRow} onPress={() => setAddingReminder(true)} activeOpacity={0.7}>
            <Text style={[grp.addInRowText, { color: colors.primary }]}>+ Adicionar lembrete</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* CONTATOS — mockup screen 4 */}
      <Text style={[grp.header, { color: '#0A84FF' }]}>Contatos</Text>
      <View style={[grp.group, { backgroundColor: colors.surface, borderLeftColor: '#0A84FF' }]}>
        <GroupRow
          iconNode={<Icon name="phone" color="#fff" size={16} />}
          iconColor={colors.primary}
          title={show.contratante}
          subtitle={`Contratante${show.contratantePhone ? ` · ${show.contratantePhone}` : ''}`}
          colors={colors}
          onPress={show.contratantePhone ? () => openWhatsApp(show.contratantePhone!) : undefined}
          isLast={importantContacts.length === 0 && !addingContact}
        />
        {importantContacts.map((c, i) => {
          const isLastContact = i === importantContacts.length - 1 && !addingContact;
          return (
            <View key={c.id} style={[grp.row, !isLastContact && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
              <View style={[grp.iconTile, { backgroundColor: '#8E8E93' }]}>
                <Icon name="phone" color="#fff" size={16} />
              </View>
              <TouchableOpacity style={{ flex: 1, minWidth: 0 }} onPress={c.phone ? () => openWhatsApp(c.phone!) : undefined} activeOpacity={c.phone ? 0.6 : 1}>
                <Text style={[grp.title, { color: colors.text }]} numberOfLines={1}>{c.name}</Text>
                <Text style={[grp.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>{c.role}{c.phone ? ` · ${c.phone}` : ''}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={async () => { await updateShow(show.id, { importantContacts: importantContacts.filter((x) => x.id !== c.id) }); refresh(); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name="close" color={colors.textMuted} size={18} />
              </TouchableOpacity>
            </View>
          );
        })}
        {addingContact ? (
          <View style={[styles.contactForm, { borderColor: colors.primary }]}>
            <TextInput
              style={[styles.contactFormInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              placeholder="NOME *"
              placeholderTextColor={colors.textMuted}
              value={contactName}
              onChangeText={setContactName}
              autoFocus autoCapitalize="words"
            />
            <TextInput
              style={[styles.contactFormInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              placeholder="RESPONSÁVEL (ex: PRODUTOR, TÉC. DE SOM) *"
              placeholderTextColor={colors.textMuted}
              value={contactRole}
              onChangeText={setContactRole}
              autoCapitalize="words"
            />
            <TextInput
              style={[styles.contactFormInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              placeholder="TELEFONE / WHATSAPP (opcional)"
              placeholderTextColor={colors.textMuted}
              value={contactPhone}
              onChangeText={setContactPhone}
              keyboardType="phone-pad"
            />
            <View style={styles.contactFormBtns}>
              <TouchableOpacity style={[styles.contactSaveBtn, { backgroundColor: colors.primary }]} onPress={handleSaveContact}>
                <Text style={styles.contactSaveBtnText}>Salvar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setAddingContact(false); setContactName(''); setContactPhone(''); setContactRole(''); }}>
                <Text style={[styles.addCancel, { color: colors.textMuted }]}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={grp.addInRow} onPress={() => setAddingContact(true)} activeOpacity={0.7}>
            <Text style={[grp.addInRowText, { color: colors.primary }]}>+ Adicionar contato</Text>
          </TouchableOpacity>
        )}
      </View>

      {show.notes && (
        <View style={sectionStyle}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>📝 NOTAS</Text>
          <Text style={[styles.notesText, { color: colors.text }]}>{show.notes}</Text>
        </View>
      )}
      </>
      )}

      <View style={{ paddingHorizontal: Spacing.md, marginTop: Spacing.sm }}>
        <View style={{ gap: Spacing.sm }}>
          {/* Finalizar Logística — visível quando tem logística e não finalizou */}
          {(show.hasHotel || show.hasAirplane || show.hasVan) && !show.logisticsFinalized && (
            <TouchableOpacity
              style={[styles.concludeBtn, { backgroundColor: '#007AFF' }]}
              activeOpacity={0.82}
              onPress={() => {
                const doFinalize = async () => { const u = await updateShow(show.id, { logisticsFinalized: true }); if (u) setShow(u); else refresh(); };
                if (Platform.OS === 'web') {
                  if ((window as any).confirm('Finalizar logística? A equipe verá um badge de verificado.')) doFinalize();
                } else {
                  Alert.alert('Finalizar logística', 'Marcar a logística deste show como finalizada? A equipe verá um badge de verificado.', [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Finalizar', onPress: doFinalize },
                  ]);
                }
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon name="check" color="#fff" size={18} />
                <Text style={styles.concludeBtnText}>FINALIZAR LOGÍSTICA</Text>
              </View>
            </TouchableOpacity>
          )}
          {/* Desfinalizar — toque longo para reverter */}
          {show.logisticsFinalized && (
            <TouchableOpacity
              style={[styles.concludeBtn, { backgroundColor: '#007AFF44' }]}
              activeOpacity={0.82}
              onLongPress={() => {
                const doUnfinalize = async () => { const u = await updateShow(show.id, { logisticsFinalized: false }); if (u) setShow(u); else refresh(); };
                if (Platform.OS === 'web') {
                  if ((window as any).confirm('Remover o badge de logística finalizada?')) doUnfinalize();
                } else {
                  Alert.alert('Desfinalizar logística', 'Remover o badge de logística finalizada?', [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Desfinalizar', style: 'destructive', onPress: doUnfinalize },
                  ]);
                }
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon name="check" color="#007AFF" size={18} />
                <Text style={[styles.concludeBtnText, { color: '#007AFF' }]}>LOGÍSTICA FINALIZADA</Text>
              </View>
            </TouchableOpacity>
          )}
          {(() => {
            const today = format(new Date(), 'yyyy-MM-dd');
            const isToday = show.date === today;
            if (isToday && !show.completedAt) {
              return (
                <TouchableOpacity
                  style={[styles.concludeBtn, { backgroundColor: colors.success }]}
                  activeOpacity={0.82}
                  onPress={() => {
                    Alert.alert('Concluir show', 'Marcar este show como concluído?', [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Concluir', onPress: async () => { const u = await updateShow(show.id, { completedAt: new Date().toISOString() }); if (u) setShow(u); else refresh(); } },
                    ]);
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Icon name="check" color="#fff" size={18} />
                    <Text style={styles.concludeBtnText}>CONCLUIR SHOW</Text>
                  </View>
                </TouchableOpacity>
              );
            }
            if (past || show.completedAt) {
              return (
                <TouchableOpacity
                  style={[styles.homeBtn, { backgroundColor: colors.primary }]}
                  activeOpacity={0.82}
                  onPress={async () => { await AsyncStorage.setItem('pinnedShowId', show.id); navigation.navigate('Home', { featuredShowId: show.id }); }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Icon name="pin" color="#fff" size={18} />
                    <Text style={styles.homeBtnText}>ATIVAR SHOW PASSADO</Text>
                  </View>
                </TouchableOpacity>
              );
            }
            return null;
          })()}
        </View>

        <View style={{ marginTop: Spacing.md }}>
          <DestructiveButton onPress={() => {
            if (Platform.OS === 'web') {
              if ((window as any).confirm(`Excluir "${show.name}"?`)) {
                deleteShow(show.id).then(() => navigation.goBack()).catch(console.error);
              }
              return;
            }
            Alert.alert('Excluir show', `Excluir "${show.name}"?`, [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Excluir', style: 'destructive', onPress: async () => { await deleteShow(show.id); navigation.goBack(); } },
            ]);
          }}>🗑️ Excluir show</DestructiveButton>
        </View>
      </View>

      <AllChecklistsModal show={show} visible={checklistsModalVisible} onClose={() => setChecklistsModalVisible(false)} colors={colors} onRefresh={refresh} />
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFound: { fontSize: FontSize.lg },
  header: { marginBottom: Spacing.sm },
  showName: { fontSize: FontSize.xxl, fontWeight: '800', lineHeight: 32 },
  contratante: { fontSize: FontSize.sm, marginTop: 2 },
  waRow: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: Radius.md, paddingHorizontal: Spacing.sm, paddingVertical: 7, marginTop: Spacing.xs, alignSelf: 'flex-start' },
  waIcon: { fontSize: 16 },
  waText: { fontSize: FontSize.sm, fontWeight: '700' },
  countdown: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, marginBottom: Spacing.sm },
  countdownEmoji: { fontSize: 22 },
  countdownLabel: { fontSize: FontSize.md, fontWeight: '700', flex: 1 },
  executeBtn: { borderRadius: Radius.lg, paddingVertical: Spacing.md, alignItems: 'center', marginBottom: Spacing.sm, ...Shadow.md },
  executeBtnText: { color: '#fff', fontSize: FontSize.lg, fontWeight: '800', letterSpacing: 0.5 },
  pdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + 2,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    borderWidth: 1.5,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  pdfBtnEmoji: { fontSize: 22, lineHeight: 26 },
  pdfBtnTitle: { fontSize: FontSize.md, fontWeight: '700', letterSpacing: -0.2 },
  pdfBtnSubtitle: { fontSize: 12, marginTop: 2, letterSpacing: -0.1 },
  pdfBtnChevron: { fontSize: 24, fontWeight: '300', marginLeft: 4 },
  pdfBtnText: { fontSize: FontSize.sm, fontWeight: '700' },
  section: { borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, marginHorizontal: Spacing.md, ...Shadow.sm },
  sectionTitle: { fontSize: FontSize.xs, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  infoIcon: { fontSize: 18, width: 28 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: FontSize.xs },
  infoValue: { fontSize: FontSize.sm, fontWeight: '600', marginTop: 1 },
  infoChevron: { fontSize: 20 },
  stageReadyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderRadius: Radius.md, paddingHorizontal: Spacing.xs, marginTop: 4 },
  meetingPointRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: Radius.md, marginBottom: 6 },
  meetingPointIcon: { fontSize: 22, lineHeight: 24 },
  meetingPointLabel: { fontSize: FontSize.md, fontWeight: '800', letterSpacing: -0.2 },
  meetingPointValue: { fontSize: 18, fontWeight: '900', letterSpacing: -0.4, marginTop: 2 },
  stageBadge: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  stageBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  stageOriginalTime: { fontSize: FontSize.xs, fontWeight: '600' },
  bufferRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.xs, paddingHorizontal: Spacing.xs },
  bufferLabel: { fontSize: FontSize.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  bufferBtn: { paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1.5 },
  bufferBtnText: { fontSize: FontSize.xs, fontWeight: '800' },
  bufferCurrent: { fontSize: FontSize.xs, fontWeight: '800', marginLeft: Spacing.xs },
  tabBar: { flexDirection: 'row', borderRadius: Radius.lg, padding: 4, marginBottom: Spacing.sm, borderWidth: 1, gap: 4 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: Radius.md, alignItems: 'center' },
  tabText: { fontSize: FontSize.sm, fontWeight: '800' },
  emptyHint: { fontSize: FontSize.xs, textAlign: 'center', marginTop: Spacing.sm, fontStyle: 'italic' },
  cardsBlock: { marginTop: Spacing.xs, gap: Spacing.xs },
  infoCard: { borderRadius: Radius.md, borderWidth: 1.5, padding: Spacing.sm },
  infoCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  infoCardLabel: { fontSize: FontSize.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  locatorCodeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  locatorCode: { fontSize: FontSize.md, fontWeight: '800', letterSpacing: 1.5 },
  copyBtn: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.md, borderWidth: 1.5 },
  copyBtnText: { fontSize: FontSize.xs, fontWeight: '700' },
  copyIconBtn: { width: 36, height: 36, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginLeft: Spacing.xs },
  copyIconBtnText: { fontSize: 16, lineHeight: 16 },
  addressInline: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  addressInlineText: { flexShrink: 1 },
  newFlightBadge: { borderRadius: Radius.sm, padding: Spacing.sm, marginBottom: Spacing.xs, gap: 4 },
  newFlightText: { fontSize: FontSize.xs, fontWeight: '600' },
  roomNumber: { fontSize: FontSize.sm, fontWeight: '700', marginTop: 2 },
  flightBanner: { borderRadius: Radius.md, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, marginBottom: Spacing.xs },
  flightBannerText: { fontSize: FontSize.sm, fontWeight: '700' },
  tlAirport: { fontSize: FontSize.sm, fontWeight: '700', paddingVertical: 6, paddingHorizontal: 2 },
  legCard: { borderRadius: Radius.md, borderWidth: 1, padding: Spacing.md },
  legGrid: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginTop: 6, marginBottom: 4 },
  legGridLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 2 },
  legGridCity: { fontSize: FontSize.md, fontWeight: '800', letterSpacing: -0.2 },
  legGridIata: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: 1 },
  legGridDate: { fontSize: FontSize.xs, fontWeight: '600', marginTop: 4 },
  legGridTime: { fontSize: FontSize.lg, fontWeight: '800', letterSpacing: -0.3, marginTop: 1 },
  legGridArrow: { fontSize: 22, fontWeight: '300', alignSelf: 'center' },
  // Boarding pass card styles
  bpCard: { backgroundColor: '#0D1526', borderRadius: 18, overflow: 'hidden', padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 8 },
  bpStrip: { flexDirection: 'row', alignItems: 'flex-start', gap: 0 },
  bpDate: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.55)', letterSpacing: 0.5, marginBottom: 4 },
  bpIata: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -2, lineHeight: 38, fontFamily: 'SpaceGrotesk-Bold' },
  bpCity: { fontSize: 12, color: 'rgba(255,255,255,0.62)', marginTop: 3 },
  bpTimeDep: { fontSize: 24, fontWeight: '900', color: '#FF9F0A', letterSpacing: -1, marginTop: 10, fontFamily: 'SpaceGrotesk-Bold' },
  bpTimeArr: { fontSize: 24, fontWeight: '900', color: 'rgba(255,255,255,0.88)', letterSpacing: -1, marginTop: 10, fontFamily: 'SpaceGrotesk-Bold' },
  bpMid: { width: 48, alignItems: 'center', paddingTop: 18, position: 'relative' },
  bpTrack: { width: '100%' as any, height: 1.5, backgroundColor: 'rgba(255,159,10,0.5)', borderRadius: 1 },
  bpPlane: { position: 'absolute', top: 8, fontSize: 13, color: '#FF9F0A' },
  tlDots: { paddingLeft: 4, paddingVertical: 2 },
  tlDotsText: { fontSize: 8, lineHeight: 6, fontWeight: '800' },
  layoverBanner: { borderRadius: Radius.md, borderWidth: 1, paddingHorizontal: Spacing.sm, paddingVertical: 8, marginTop: 2, marginBottom: 2, alignItems: 'center' },
  layoverLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2, marginBottom: 2 },
  layoverValue: { fontSize: FontSize.lg, fontWeight: '800', letterSpacing: -0.3 },
  missingBanner: { borderRadius: Radius.md, borderWidth: 1.5, padding: Spacing.md, marginHorizontal: Spacing.md, marginBottom: Spacing.sm },
  missingHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  missingIcon: { fontSize: 16 },
  missingTitle: { flex: 1, fontSize: FontSize.sm, fontWeight: '800' },
  missingChevron: { fontSize: 13, fontWeight: '700' },
  missingDivider: { height: 1, marginVertical: Spacing.sm },
  missingItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  missingDot: { fontSize: 14, lineHeight: 20, fontWeight: '800' },
  missingItemText: { flex: 1, fontSize: FontSize.sm, fontWeight: '500', lineHeight: 20 },
  missingEditBtn: { borderRadius: Radius.md, paddingVertical: Spacing.sm, alignItems: 'center', marginTop: Spacing.sm },
  missingEditBtnText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '800' },
  linkedShowChip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.sm, borderRadius: Radius.md, borderWidth: 1.5, marginBottom: Spacing.sm },
  linkedShowChipIcon: { fontSize: 18 },
  linkedShowChipName: { fontSize: FontSize.sm, fontWeight: '800' },
  linkedShowChipMeta: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  linkedShowChipChevron: { fontSize: 22 },
  passengerList: { marginTop: 4, gap: 2 },
  passengerItem: { fontSize: FontSize.sm },
  roomBadge: { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  roomBadgeText: { fontSize: FontSize.xs, fontWeight: '700' },
  hotelMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginHorizontal: Spacing.md, marginBottom: Spacing.sm },
  hotelMetaBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full, borderWidth: 1 },
  hotelMetaText: { fontSize: FontSize.sm, fontWeight: '600' },
  hotelArriveBtn: { marginHorizontal: Spacing.md, marginBottom: Spacing.md, paddingVertical: 18, borderRadius: Radius.lg, alignItems: 'center', ...Shadow.sm },
  hotelArriveBtnText: { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 0.5 },
  concludeBtn: { paddingVertical: 18, borderRadius: Radius.lg, alignItems: 'center', ...Shadow.sm },
  concludeBtnText: { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 0.5 },
  homeBtn: { paddingVertical: 18, borderRadius: Radius.lg, alignItems: 'center', ...Shadow.sm },
  homeBtnText: { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 0.5 },
  completedBanner: { paddingVertical: 14, borderRadius: Radius.lg, alignItems: 'center', borderWidth: 1.5 },
  completedBannerText: { fontSize: FontSize.md, fontWeight: '600' },
  remindersHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  progressPill: { borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  progressPillText: { fontSize: FontSize.xs, fontWeight: '800' },
  progressBarFull: { height: 6, borderRadius: Radius.full, marginBottom: Spacing.sm, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: Radius.full },
  reminderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: Spacing.sm, borderBottomWidth: 1 },
  reminderCheck: { padding: 2 },
  checkBox: { width: 22, height: 22, borderRadius: Radius.full, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  checkMark: { color: '#fff', fontSize: 12, fontWeight: '800' },
  reminderText: { flex: 1, fontSize: FontSize.sm, lineHeight: 20 },
  reminderDelete: { fontSize: 13, fontWeight: '700' },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.sm },
  addInput: { flex: 1, borderRadius: Radius.md, borderWidth: 1.5, paddingHorizontal: Spacing.sm, paddingVertical: 8, fontSize: FontSize.sm },
  addConfirm: { width: 36, height: 36, borderRadius: Radius.full, justifyContent: 'center', alignItems: 'center' },
  addConfirmText: { color: '#fff', fontSize: 22, fontWeight: '300' },
  addCancel: { fontSize: 16, paddingHorizontal: 4 },
  addBtn: { marginTop: Spacing.sm, paddingVertical: Spacing.sm, borderRadius: Radius.md, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center' },
  addBtnText: { fontWeight: '700', fontSize: FontSize.sm },
  notesText: { fontSize: FontSize.sm, lineHeight: 22 },
  deleteBtn: { borderRadius: Radius.lg, paddingVertical: Spacing.md, alignItems: 'center', borderWidth: 2, marginTop: Spacing.sm },
  deleteBtnText: { fontSize: FontSize.md, fontWeight: '700' },
  // Contacts
  contactCard: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.md, borderWidth: 1.5, padding: Spacing.sm, marginBottom: Spacing.xs, gap: Spacing.sm },
  contactName: { fontSize: FontSize.sm, fontWeight: '700' },
  contactRoleBadge: { alignSelf: 'flex-start', borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2, marginTop: 3 },
  contactRoleText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  contactPhone: { fontSize: FontSize.xs, marginTop: 2 },
  contactActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  waBtn: { borderRadius: Radius.md, paddingHorizontal: 10, paddingVertical: 6 },
  waBtnText: { fontSize: FontSize.xs, fontWeight: '700' },
  deleteContactBtn: { borderRadius: Radius.md, paddingHorizontal: 10, paddingVertical: 6 },
  deleteContactText: { fontSize: FontSize.xs, fontWeight: '800' },
  contactForm: { borderRadius: Radius.md, borderWidth: 1.5, padding: Spacing.sm, marginTop: Spacing.xs, gap: Spacing.xs },
  contactFormInput: { borderRadius: Radius.sm, borderWidth: 1.5, paddingHorizontal: Spacing.sm, paddingVertical: 8, fontSize: FontSize.sm },
  contactFormBtns: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xs },
  contactSaveBtn: { borderRadius: Radius.md, paddingVertical: 8, paddingHorizontal: Spacing.md },
  contactSaveBtnText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '800' },
});

const hero = StyleSheet.create({
  card: {
    backgroundColor: '#0D1528',
    borderRadius: 20, margin: Spacing.md, padding: 24,
    paddingTop: 28, paddingBottom: 22,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 28, elevation: 10,
  },
  glow1: {
    position: 'absolute',
    top: -70, right: -20,
    width: 240, height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255,159,10,0.18)',
  },
  glow2: {
    position: 'absolute',
    bottom: -60, left: -50,
    width: 200, height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(191,90,242,0.20)',
  },
  glow3: {
    position: 'absolute',
    top: 60, left: -40,
    width: 220, height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,100,150,0.12)',
  },
  glow4: {
    position: 'absolute',
    bottom: -20, right: -20,
    width: 160, height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,159,10,0.15)',
  },
  badgeWrap: { alignItems: 'center', marginBottom: 14 },
  badgePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,159,10,0.25)',
    borderWidth: 1, borderColor: 'rgba(255,159,10,0.45)',
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 9999,
  },
  badgePillText: {
    color: '#FFD60A', fontSize: 10, fontWeight: '900',
    letterSpacing: 2, textTransform: 'uppercase',
  },
  name: {
    color: '#fff', fontSize: 28, fontWeight: '900',
    letterSpacing: -0.8, lineHeight: 31,
    textAlign: 'center', marginBottom: 5,
  },
  cityLine: {
    color: 'rgba(255,255,255,0.85)', fontSize: 14,
    fontWeight: '500', textAlign: 'center', marginBottom: 18,
  },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginBottom: 16 },
  cols: { flexDirection: 'row' },
  col: { flex: 1, minWidth: 0, paddingHorizontal: 8, paddingVertical: 4, alignItems: 'center' },
  colBorder: { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.15)' },
  colLabel: {
    color: 'rgba(255,255,255,0.55)', fontSize: 9, fontWeight: '900',
    letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 5,
  },
  colValue: {
    color: '#fff', fontSize: 17, fontWeight: '900',
    letterSpacing: -0.5, lineHeight: 19,
  },
  colSub: {
    color: 'rgba(255,255,255,0.65)', fontSize: 11,
    fontWeight: '500', marginTop: 3,
  },
  weatherStrip: {
    flexDirection: 'row',
    marginHorizontal: -24,
    marginBottom: -22,
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.20)',
    alignItems: 'center',
  },
  weatherCell: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  weatherSep: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 8,
  },
  weatherLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.55)',
  },
  weatherVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
  },
  weatherLoading: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },
});

// Card de progresso do checklist (mockup screen 1).
const progressCardS = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: 2,
  },
});

// iOS grouped list — usado em LOCAL / LOGÍSTICA / CHECKLIST DO SHOW / CONTATOS.
const grp = StyleSheet.create({
  header: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginTop: Spacing.md,
    marginBottom: 6,
    marginHorizontal: Spacing.md + 4,
    fontFamily: 'CabinetGrotesk-Bold',
  },
  group: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
    borderLeftWidth: 3,
    ...Shadow.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    minHeight: 56,
  },
  iconTile: {
    width: 34, height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconText: { fontSize: 16, lineHeight: 18 },
  title: {
    fontSize: FontSize.md,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  chevron: {
    fontSize: 22,
    fontWeight: '300',
    marginLeft: 4,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    minHeight: 50,
  },
  checkCircle: {
    width: 24, height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleMark: { color: '#fff', fontSize: 12, fontWeight: '900' },
  checklistText: { fontSize: FontSize.md, letterSpacing: -0.1 },
  checklistTime: { fontSize: 12, marginTop: 2, fontVariantNumeric: 'tabular-nums' } as any,
  deleteX: { fontSize: 14, fontWeight: '700', paddingHorizontal: 4 },
  inlineInput: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    fontSize: FontSize.sm,
  },
  inlineConfirm: {
    width: 32, height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineConfirmText: { color: '#fff', fontSize: 20, fontWeight: '300', lineHeight: 22 },
  addInRow: {
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    alignItems: 'flex-start',
  },
  addInRowText: { fontSize: FontSize.md, fontWeight: '600' },
});

const execS = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.md, borderBottomWidth: 1 },
  closeBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  closeBtnText: { fontSize: 22, fontWeight: '700' },
  closeBtnCircle: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    zIndex: 10,
  },
  closeBtnCircleText: { fontSize: 18, fontWeight: '700', lineHeight: 20 },
  doneBtn: {
    paddingHorizontal: Spacing.sm, paddingVertical: 8,
    minWidth: 44, alignItems: 'flex-end', justifyContent: 'center',
    zIndex: 10,
  },
  doneBtnText: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  materialRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 12, gap: Spacing.sm },
  materialCheck: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  materialCheckMark: { color: '#fff', fontSize: 13, fontWeight: '900' },
  headerTitle: { fontSize: FontSize.md, fontWeight: '800', flex: 1, textAlign: 'center' },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  infoBlock: { borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md, gap: 4 },
  showName: { fontSize: FontSize.xl, fontWeight: '800' },
  showMeta: { fontSize: FontSize.sm },
  sectionTitle: { fontSize: FontSize.xs, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.xs, marginTop: Spacing.sm },
  timelineBlock: { borderRadius: Radius.lg, overflow: 'hidden', marginBottom: Spacing.xs },
  timelineRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 14, gap: Spacing.sm },
  timelineTime: { fontSize: FontSize.md, fontWeight: '800', width: 72, textAlign: 'right' },
  timelineIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  timelineLabel: { flex: 1, fontSize: FontSize.sm, fontWeight: '600' },
  block: { borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.xs, gap: 6 },
  blockRow: { fontSize: FontSize.sm, lineHeight: 20 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  linkActionBtn: { borderRadius: Radius.md, borderWidth: 1.5, paddingVertical: 11, alignItems: 'center' },
  linkActionText: { fontSize: FontSize.sm, fontWeight: '800' },
});
