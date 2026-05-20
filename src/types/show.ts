export interface ImportantContact {
  id: string;
  name: string;
  phone?: string;
  /** Role/responsibility, e.g. "Produtor", "Técnico de som" */
  role: string;
}

export interface ShowReminder {
  id: string;
  text: string;
  done: boolean;
  notifyAt?: string;
  notificationId?: string;
}

/** Item da lista de check de material do show */
export interface MaterialItem {
  id: string;
  name: string;
  checked: boolean;
}

/** Um localizador de voo com seus passageiros */
export interface FlightLocator {
  id: string;
  /** Código do localizador, ex: "ABC1D2" */
  code: string;
  /** Nomes dos passageiros deste localizador */
  passengers: string[];
  /** false = mesmo voo do original; true = novo voo diferente */
  isNewFlight?: boolean;
  /** Companhia aérea (quando novo voo) */
  airline?: string;
  /** Número do voo deste localizador (quando novo voo) */
  flightNumberLocator?: string;
  /** Origem — código IATA (quando novo voo) */
  origin?: string;
  /** Destino — código IATA (quando novo voo) */
  destination?: string;
  /** Data do voo ISO YYYY-MM-DD (quando novo voo) */
  flightDate?: string;
  /** Horário do voo HH:MM (quando novo voo) */
  flightTimeLocator?: string;
}

/** Um trecho de voo (para voos com escala) */
export interface FlightLeg {
  id: string;
  /** Código IATA do aeroporto de origem */
  origin: string;
  /** Código IATA do aeroporto de destino */
  destination: string;
  airline?: string;
  flightNumber?: string;
  /** Data de partida ISO YYYY-MM-DD */
  date?: string;
  /** Horário de partida HH:MM */
  time?: string;
  /** Data de chegada ISO YYYY-MM-DD */
  arrivalDate?: string;
  /** Horário de chegada HH:MM */
  arrivalTime?: string;
  localizadores: FlightLocator[];
}

export type RoomType = 'single' | 'double' | 'triple';

export const AIRLINES = ['AZUL', 'GOL', 'LATAM'] as const;
export type AirlinePreset = typeof AIRLINES[number];

/** Um quarto de hotel com tipo e hóspedes */
export interface HotelRoom {
  id: string;
  type: RoomType;
  /** Número do quarto, ex: "101", "305" */
  roomNumber?: string;
  /** Nomes dos hóspedes deste quarto */
  passengers: string[];
}

export interface Show {
  id: string;
  name: string;
  contratante: string;
  contratantePhone?: string;
  /** ISO date string (YYYY-MM-DD) */
  date: string;
  /** HH:MM */
  time: string;
  /** HH:MM — auto: time - 90 min */
  stageReadyTime?: string;
  /** Minutos de antecipação extra sobre o horário de chegada (stageReadyTime). Acumulativo em passos de 30. */
  arrivalBufferMinutes?: number;
  venue: string;
  venueAddress?: string;
  city?: string;
  notes?: string;
  completedAt?: string;

  // ---------- Artist / Show production ----------
  hasCamarim?: boolean;
  showDurationMinutes?: number;
  soundcheckTime?: string;
  agradecimentos?: string;
  homeArrivalTime?: string;
  stageSetup?: 'dropdown' | '360' | 'led' | 'none';
  outfit?: string;

  // ---------- Logistics ----------
  hasHotel: boolean;
  hotelName?: string;
  hotelAddress?: string;
  hotelMalaCuia?: boolean;
  /** Quartos do hotel com tipo e hóspedes */
  hotelRooms?: HotelRoom[];

  hasAirplane: boolean;
  /** true = voo com escala (usa flightLegs); false = voo direto (usa flightLocators) */
  hasEscala?: boolean;
  airportName?: string;
  /** Aeroporto de destino (voo direto) */
  airportDestination?: string;
  flightNumber?: string;
  /** Data do voo principal ISO YYYY-MM-DD */
  flightDate?: string;
  flightTime?: string;
  /** Data de chegada do voo direto ISO YYYY-MM-DD */
  flightArrivalDate?: string;
  /** Horário de chegada do voo direto HH:MM */
  flightArrivalTime?: string;
  /** Múltiplos localizadores com passageiros (voo direto) */
  flightLocators?: FlightLocator[];
  /** Trechos do voo com escala */
  flightLegs?: FlightLeg[];

  hasVan: boolean;
  vanDriverName?: string;
  vanDriverPhone?: string;
  vanColor?: string;
  vanPlate?: string;

  // Distances (valor em km, exibido com sufixo "km")
  distanceAirportHotel?: string;
  distanceHotelShow?: string;
  distanceAirportShow?: string;
  distanceMeetingShow?: string;

  // Departure times
  departureTimeMeetingShow?: string;
  departureTimeHotelShow?: string;
  departureTimeHotelAirport?: string;

  importantContacts?: ImportantContact[];
  reminders: ShowReminder[];
  materials?: MaterialItem[];
  /** ID de outro show cujo voo será exibido aqui como "voo de volta" */
  returnFlightFromShowId?: string;
  /** ID de outro show cujas infos de hotel serão usadas aqui */
  linkedHotelShowId?: string;
  /** ID de outro show cujas infos de van serão usadas aqui */
  linkedVanShowId?: string;
  /** Produtor finalizou a logística — equipe vê badge azul verificado */
  logisticsFinalized?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateShowInput = Omit<Show, 'id' | 'createdAt' | 'updatedAt'>;

export const VAN_COLORS = ['PRETA', 'BRANCA', 'PRATA', 'CINZA', 'VERMELHA', 'AZUL', 'OUTRA'] as const;

export const ARRIVAL_BUFFER_STEP_MINUTES = 30;
