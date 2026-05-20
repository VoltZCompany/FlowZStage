// Mock data for Tesla iOS refresh prototype
window.TESLA_DATA = {
  tasks: [
    { id: 't1', title: 'Enviar rider técnico para o Espaço das Américas', priority: 'urgent', category: 'work', deadline: '2026-04-25T14:00', done: false, notes: 'Incluir requerimentos de backline e fichas técnicas dos músicos.' },
    { id: 't2', title: 'Confirmar cachê com contratante do show de Ribeirão', priority: 'high', category: 'finance', deadline: '2026-04-25T18:00', done: false },
    { id: 't3', title: 'Pagar adiantamento da van — Lalaia Logística', priority: 'high', category: 'finance', deadline: '2026-04-26T12:00', done: false },
    { id: 't4', title: 'Revisar contrato Festival de Inverno Campos do Jordão', priority: 'medium', category: 'work', deadline: '2026-04-27T17:00', done: false },
    { id: 't5', title: 'Agendar ensaio com banda completa', priority: 'medium', category: 'work', done: false },
    { id: 't6', title: 'Renovar seguro dos equipamentos', priority: 'low', category: 'finance', deadline: '2026-05-02T12:00', done: false },
    { id: 't7', title: 'Postar aftermovie do último show', priority: 'low', category: 'personal', done: true },
    { id: 't8', title: 'Reunião com empresário — 14h', priority: 'high', category: 'work', done: true },
  ],
  shows: [
    {
      id: 's1', name: 'Festival Alta Voltagem', contratante: 'GR6 Produções', date: '2026-04-26', time: '22:00',
      venue: 'Espaço das Américas', city: 'São Paulo, SP', hasHotel: true, hotelName: 'Hotel Maksoud Plaza',
      hasAirplane: true, airportName: 'GRU → CGH', flightTime: '18:30', hasVan: true,
      remindersDone: 6, remindersTotal: 9,
      countdown: 'AMANHÃ · 22:00', urgent: true
    },
    {
      id: 's2', name: 'Show Beneficente Casa da Música', contratante: 'P´layce Eventos', date: '2026-04-30', time: '21:00',
      venue: 'Teatro Municipal', city: 'Ribeirão Preto, SP', hasHotel: true, hotelName: 'Hotel Nacional Inn',
      hasAirplane: false, hasVan: true,
      remindersDone: 3, remindersTotal: 7,
      countdown: 'EM 5 DIAS', urgent: false
    },
    {
      id: 's3', name: 'Arena Indie Sessions', contratante: 'Lalaia Live', date: '2026-05-05', time: '20:30',
      venue: 'Audio Club', city: 'São Paulo, SP', hasHotel: false,
      hasAirplane: false, hasVan: true,
      remindersDone: 1, remindersTotal: 6,
      countdown: 'EM 11 DIAS', urgent: false
    },
    {
      id: 's4', name: 'Festival de Inverno', contratante: 'Produtora do Vale', date: '2026-06-12', time: '19:00',
      venue: 'Parque Capivari', city: 'Campos do Jordão, SP', hasHotel: true, hotelName: 'Toriba Resort',
      hasAirplane: true, airportName: 'GRU → JDO', flightTime: '14:00', hasVan: true,
      remindersDone: 0, remindersTotal: 8,
      countdown: 'EM 49 DIAS', urgent: false
    },
    {
      id: 's5', name: 'Workshop Produção Musical', contratante: 'Conservatório', date: '2026-04-15', time: '16:00',
      venue: 'Conservatório Souza Lima', city: 'São Paulo, SP', hasHotel: false, hasAirplane: false, hasVan: false,
      remindersDone: 5, remindersTotal: 5,
      countdown: 'CONCLUÍDO', urgent: false, past: true
    },
  ],
  // Show detail
  showDetail: {
    id: 's1',
    name: 'Festival Alta Voltagem',
    contratante: 'GR6 Produções',
    contratantePhone: '(11) 98765-4321',
    date: '2026-04-26', time: '22:00', stageReadyTime: '20:30',
    venue: 'Espaço das Américas',
    venueAddress: 'R. Tagipuru, 795 — Barra Funda',
    city: 'São Paulo, SP',
    hotel: { name: 'Hotel Maksoud Plaza', address: 'Al. Campinas, 150 — Jardins' },
    flight: { airline: 'LATAM', number: 'LA3442', airport: 'GRU → CGH', time: '18:30', date: '2026-04-26' },
    van: { driver: 'Carlos Lalaia', phone: '(11) 97654-3210', color: 'PRETA', plate: 'FBM-2025' },
    contacts: [
      { name: 'Lucas Prod.', role: 'Produtor local', phone: '(11) 91111-2222' },
      { name: 'Dj Beto', role: 'Técnico de som', phone: '(11) 93333-4444' },
    ],
    reminders: [
      { id: 'r1', text: 'Enviar rider técnico', done: true },
      { id: 'r2', text: 'Confirmar backline com casa', done: true },
      { id: 'r3', text: 'Check-in online do voo (24h antes)', done: true },
      { id: 'r4', text: 'Confirmar van com motorista', done: true },
      { id: 'r5', text: 'Enviar lista de hóspedes para o hotel', done: true },
      { id: 'r6', text: 'Fechar cachê e adiantamento', done: true },
      { id: 'r7', text: 'Passagem de som — 17h', done: false, time: '17:00' },
      { id: 'r8', text: 'Reunião pré-show com banda', done: false, time: '19:30' },
      { id: 'r9', text: 'Conferir camarim', done: false, time: '20:00' },
    ],
  },
};
