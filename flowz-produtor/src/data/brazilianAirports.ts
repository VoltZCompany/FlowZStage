export interface Airport {
  iata: string;
  name: string;
  city: string;
  state: string;
}

export const BRAZILIAN_AIRPORTS: Airport[] = [
  // Sudeste
  { iata: 'GRU', name: 'Int. de Guarulhos', city: 'São Paulo', state: 'SP' },
  { iata: 'CGH', name: 'Congonhas', city: 'São Paulo', state: 'SP' },
  { iata: 'VCP', name: 'Int. de Viracopos', city: 'Campinas', state: 'SP' },
  { iata: 'GIG', name: 'Int. do Galeão', city: 'Rio de Janeiro', state: 'RJ' },
  { iata: 'SDU', name: 'Santos Dumont', city: 'Rio de Janeiro', state: 'RJ' },
  { iata: 'CNF', name: 'Int. Tancredo Neves', city: 'Belo Horizonte', state: 'MG' },
  { iata: 'PLU', name: 'Carlos Drummond de Andrade', city: 'Belo Horizonte', state: 'MG' },
  { iata: 'VIX', name: 'Eurico de Aguiar Salles', city: 'Vitória', state: 'ES' },
  { iata: 'UDI', name: 'Ten. Cel. César Bombonato', city: 'Uberlândia', state: 'MG' },
  { iata: 'CGB', name: 'Int. Marechal Rondon', city: 'Cuiabá', state: 'MT' },
  // Sul
  { iata: 'CWB', name: 'Int. Afonso Pena', city: 'Curitiba', state: 'PR' },
  { iata: 'POA', name: 'Int. Salgado Filho', city: 'Porto Alegre', state: 'RS' },
  { iata: 'FLN', name: 'Int. Hercílio Luz', city: 'Florianópolis', state: 'SC' },
  { iata: 'IGU', name: 'Int. de Foz do Iguaçu', city: 'Foz do Iguaçu', state: 'PR' },
  { iata: 'NVT', name: 'Int. Min. Victor Konder', city: 'Navegantes', state: 'SC' },
  { iata: 'JOI', name: 'Lauro Carneiro de Loyola', city: 'Joinville', state: 'SC' },
  { iata: 'LDB', name: 'Gov. José Richa', city: 'Londrina', state: 'PR' },
  // Centro-Oeste
  { iata: 'BSB', name: 'Int. de Brasília', city: 'Brasília', state: 'DF' },
  { iata: 'GYN', name: 'Santa Genoveva', city: 'Goiânia', state: 'GO' },
  { iata: 'CGR', name: 'Int. de Campo Grande', city: 'Campo Grande', state: 'MS' },
  // Nordeste
  { iata: 'SSA', name: 'Dep. Luís Eduardo Magalhães', city: 'Salvador', state: 'BA' },
  { iata: 'FOR', name: 'Int. Pinto Martins', city: 'Fortaleza', state: 'CE' },
  { iata: 'REC', name: 'Int. dos Guararapes', city: 'Recife', state: 'PE' },
  { iata: 'NAT', name: 'Int. Aluízio Alves', city: 'Natal', state: 'RN' },
  { iata: 'MCZ', name: 'Int. Zumbi dos Palmares', city: 'Maceió', state: 'AL' },
  { iata: 'AJU', name: 'Santa Maria', city: 'Aracaju', state: 'SE' },
  { iata: 'JPA', name: 'Pres. Castro Pinto', city: 'João Pessoa', state: 'PB' },
  { iata: 'THE', name: 'Sen. Petrônio Portella', city: 'Teresina', state: 'PI' },
  { iata: 'SLZ', name: 'Int. Cunha Machado', city: 'São Luís', state: 'MA' },
  { iata: 'IMP', name: 'Prefeito Renato Moreira', city: 'Imperatriz', state: 'MA' },
  { iata: 'BPS', name: 'Porto Seguro', city: 'Porto Seguro', state: 'BA' },
  // Norte
  { iata: 'MAO', name: 'Int. Eduardo Gomes', city: 'Manaus', state: 'AM' },
  { iata: 'BEL', name: 'Int. Val de Cans', city: 'Belém', state: 'PA' },
  { iata: 'MCP', name: 'Int. de Macapá', city: 'Macapá', state: 'AP' },
  { iata: 'BVB', name: 'Int. Atlas Brasil Cantanhede', city: 'Boa Vista', state: 'RR' },
  { iata: 'PVH', name: 'Gov. Jorge Teixeira', city: 'Porto Velho', state: 'RO' },
  { iata: 'RBR', name: 'Int. Plácido de Castro', city: 'Rio Branco', state: 'AC' },
  { iata: 'PMW', name: 'Int. de Palmas', city: 'Palmas', state: 'TO' },
];

function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function searchAirports(query: string): Airport[] {
  if (!query.trim()) return BRAZILIAN_AIRPORTS.slice(0, 15);
  const q = norm(query.trim());
  return BRAZILIAN_AIRPORTS.filter((a) =>
    norm(a.iata).includes(q) ||
    norm(a.city).includes(q) ||
    norm(a.name).includes(q) ||
    norm(a.state).includes(q),
  );
}

export function findAirport(iata: string): Airport | undefined {
  return BRAZILIAN_AIRPORTS.find((a) => a.iata === iata.toUpperCase());
}
