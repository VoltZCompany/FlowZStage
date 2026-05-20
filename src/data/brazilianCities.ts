export interface BrazilianCity {
  city: string;
  state: string;
  stateCode: string;
}

export const BRAZILIAN_CITIES: BrazilianCity[] = [
  // São Paulo
  { city: 'SÃO PAULO', state: 'São Paulo', stateCode: 'SP' },
  { city: 'CAMPINAS', state: 'São Paulo', stateCode: 'SP' },
  { city: 'GUARULHOS', state: 'São Paulo', stateCode: 'SP' },
  { city: 'SÃO BERNARDO DO CAMPO', state: 'São Paulo', stateCode: 'SP' },
  { city: 'SANTO ANDRÉ', state: 'São Paulo', stateCode: 'SP' },
  { city: 'OSASCO', state: 'São Paulo', stateCode: 'SP' },
  { city: 'RIBEIRÃO PRETO', state: 'São Paulo', stateCode: 'SP' },
  { city: 'SOROCABA', state: 'São Paulo', stateCode: 'SP' },
  { city: 'MAUÁ', state: 'São Paulo', stateCode: 'SP' },
  { city: 'SÃO JOSÉ DOS CAMPOS', state: 'São Paulo', stateCode: 'SP' },
  { city: 'SANTOS', state: 'São Paulo', stateCode: 'SP' },
  { city: 'MOGI DAS CRUZES', state: 'São Paulo', stateCode: 'SP' },
  { city: 'JUNDIAÍ', state: 'São Paulo', stateCode: 'SP' },
  { city: 'PIRACICABA', state: 'São Paulo', stateCode: 'SP' },
  { city: 'CARAPICUÍBA', state: 'São Paulo', stateCode: 'SP' },
  { city: 'BAURU', state: 'São Paulo', stateCode: 'SP' },
  { city: 'ITAQUAQUECETUBA', state: 'São Paulo', stateCode: 'SP' },
  { city: 'SÃO VICENTE', state: 'São Paulo', stateCode: 'SP' },
  { city: 'FRANCA', state: 'São Paulo', stateCode: 'SP' },
  { city: 'LIMEIRA', state: 'São Paulo', stateCode: 'SP' },
  // Rio de Janeiro
  { city: 'RIO DE JANEIRO', state: 'Rio de Janeiro', stateCode: 'RJ' },
  { city: 'NITERÓI', state: 'Rio de Janeiro', stateCode: 'RJ' },
  { city: 'NOVA IGUAÇU', state: 'Rio de Janeiro', stateCode: 'RJ' },
  { city: 'DUQUE DE CAXIAS', state: 'Rio de Janeiro', stateCode: 'RJ' },
  { city: 'SÃO GONÇALO', state: 'Rio de Janeiro', stateCode: 'RJ' },
  { city: 'CAMPOS DOS GOYTACAZES', state: 'Rio de Janeiro', stateCode: 'RJ' },
  { city: 'BELFORD ROXO', state: 'Rio de Janeiro', stateCode: 'RJ' },
  { city: 'PETRÓPOLIS', state: 'Rio de Janeiro', stateCode: 'RJ' },
  { city: 'VOLTA REDONDA', state: 'Rio de Janeiro', stateCode: 'RJ' },
  { city: 'ANGRA DOS REIS', state: 'Rio de Janeiro', stateCode: 'RJ' },
  // Minas Gerais
  { city: 'BELO HORIZONTE', state: 'Minas Gerais', stateCode: 'MG' },
  { city: 'UBERLÂNDIA', state: 'Minas Gerais', stateCode: 'MG' },
  { city: 'CONTAGEM', state: 'Minas Gerais', stateCode: 'MG' },
  { city: 'JUIZ DE FORA', state: 'Minas Gerais', stateCode: 'MG' },
  { city: 'BETIM', state: 'Minas Gerais', stateCode: 'MG' },
  { city: 'MONTES CLAROS', state: 'Minas Gerais', stateCode: 'MG' },
  { city: 'UBERABA', state: 'Minas Gerais', stateCode: 'MG' },
  { city: 'RIBEIRÃO DAS NEVES', state: 'Minas Gerais', stateCode: 'MG' },
  { city: 'GOVERNADOR VALADARES', state: 'Minas Gerais', stateCode: 'MG' },
  { city: 'IPATINGA', state: 'Minas Gerais', stateCode: 'MG' },
  // Bahia
  { city: 'SALVADOR', state: 'Bahia', stateCode: 'BA' },
  { city: 'FEIRA DE SANTANA', state: 'Bahia', stateCode: 'BA' },
  { city: 'VITÓRIA DA CONQUISTA', state: 'Bahia', stateCode: 'BA' },
  { city: 'CAMAÇARI', state: 'Bahia', stateCode: 'BA' },
  { city: 'ITABUNA', state: 'Bahia', stateCode: 'BA' },
  { city: 'JUAZEIRO', state: 'Bahia', stateCode: 'BA' },
  { city: 'ILHÉUS', state: 'Bahia', stateCode: 'BA' },
  { city: 'PORTO SEGURO', state: 'Bahia', stateCode: 'BA' },
  // Paraná
  { city: 'CURITIBA', state: 'Paraná', stateCode: 'PR' },
  { city: 'LONDRINA', state: 'Paraná', stateCode: 'PR' },
  { city: 'MARINGÁ', state: 'Paraná', stateCode: 'PR' },
  { city: 'PONTA GROSSA', state: 'Paraná', stateCode: 'PR' },
  { city: 'CASCAVEL', state: 'Paraná', stateCode: 'PR' },
  { city: 'FOZ DO IGUAÇU', state: 'Paraná', stateCode: 'PR' },
  // Rio Grande do Sul
  { city: 'PORTO ALEGRE', state: 'Rio Grande do Sul', stateCode: 'RS' },
  { city: 'CAXIAS DO SUL', state: 'Rio Grande do Sul', stateCode: 'RS' },
  { city: 'PELOTAS', state: 'Rio Grande do Sul', stateCode: 'RS' },
  { city: 'CANOAS', state: 'Rio Grande do Sul', stateCode: 'RS' },
  { city: 'SANTA MARIA', state: 'Rio Grande do Sul', stateCode: 'RS' },
  { city: 'GRAVATAÍ', state: 'Rio Grande do Sul', stateCode: 'RS' },
  // Pernambuco
  { city: 'RECIFE', state: 'Pernambuco', stateCode: 'PE' },
  { city: 'CARUARU', state: 'Pernambuco', stateCode: 'PE' },
  { city: 'OLINDA', state: 'Pernambuco', stateCode: 'PE' },
  { city: 'PETROLINA', state: 'Pernambuco', stateCode: 'PE' },
  { city: 'JABOATÃO DOS GUARARAPES', state: 'Pernambuco', stateCode: 'PE' },
  // Ceará
  { city: 'FORTALEZA', state: 'Ceará', stateCode: 'CE' },
  { city: 'CAUCAIA', state: 'Ceará', stateCode: 'CE' },
  { city: 'JUAZEIRO DO NORTE', state: 'Ceará', stateCode: 'CE' },
  { city: 'MARACANAÚ', state: 'Ceará', stateCode: 'CE' },
  { city: 'SOBRAL', state: 'Ceará', stateCode: 'CE' },
  // Amazonas
  { city: 'MANAUS', state: 'Amazonas', stateCode: 'AM' },
  { city: 'PARINTINS', state: 'Amazonas', stateCode: 'AM' },
  // Pará
  { city: 'BELÉM', state: 'Pará', stateCode: 'PA' },
  { city: 'ANANINDEUA', state: 'Pará', stateCode: 'PA' },
  { city: 'SANTARÉM', state: 'Pará', stateCode: 'PA' },
  { city: 'MARABÁ', state: 'Pará', stateCode: 'PA' },
  // Goiás
  { city: 'GOIÂNIA', state: 'Goiás', stateCode: 'GO' },
  { city: 'APARECIDA DE GOIÂNIA', state: 'Goiás', stateCode: 'GO' },
  { city: 'ANÁPOLIS', state: 'Goiás', stateCode: 'GO' },
  { city: 'RIO VERDE', state: 'Goiás', stateCode: 'GO' },
  // Maranhão
  { city: 'SÃO LUÍS', state: 'Maranhão', stateCode: 'MA' },
  { city: 'IMPERATRIZ', state: 'Maranhão', stateCode: 'MA' },
  { city: 'SÃO JOSÉ DE RIBAMAR', state: 'Maranhão', stateCode: 'MA' },
  // Espírito Santo
  { city: 'VITÓRIA', state: 'Espírito Santo', stateCode: 'ES' },
  { city: 'SERRA', state: 'Espírito Santo', stateCode: 'ES' },
  { city: 'VILA VELHA', state: 'Espírito Santo', stateCode: 'ES' },
  { city: 'CARIACICA', state: 'Espírito Santo', stateCode: 'ES' },
  // Mato Grosso do Sul
  { city: 'CAMPO GRANDE', state: 'Mato Grosso do Sul', stateCode: 'MS' },
  { city: 'DOURADOS', state: 'Mato Grosso do Sul', stateCode: 'MS' },
  // Mato Grosso
  { city: 'CUIABÁ', state: 'Mato Grosso', stateCode: 'MT' },
  { city: 'VÁRZEA GRANDE', state: 'Mato Grosso', stateCode: 'MT' },
  // Rio Grande do Norte
  { city: 'NATAL', state: 'Rio Grande do Norte', stateCode: 'RN' },
  { city: 'MOSSORÓ', state: 'Rio Grande do Norte', stateCode: 'RN' },
  // Alagoas
  { city: 'MACEIÓ', state: 'Alagoas', stateCode: 'AL' },
  { city: 'ARAPIRACA', state: 'Alagoas', stateCode: 'AL' },
  // Piauí
  { city: 'TERESINA', state: 'Piauí', stateCode: 'PI' },
  { city: 'PARNAÍBA', state: 'Piauí', stateCode: 'PI' },
  // Sergipe
  { city: 'ARACAJU', state: 'Sergipe', stateCode: 'SE' },
  // Paraíba
  { city: 'JOÃO PESSOA', state: 'Paraíba', stateCode: 'PB' },
  { city: 'CAMPINA GRANDE', state: 'Paraíba', stateCode: 'PB' },
  // Santa Catarina
  { city: 'FLORIANÓPOLIS', state: 'Santa Catarina', stateCode: 'SC' },
  { city: 'JOINVILLE', state: 'Santa Catarina', stateCode: 'SC' },
  { city: 'BLUMENAU', state: 'Santa Catarina', stateCode: 'SC' },
  { city: 'SÃO JOSÉ', state: 'Santa Catarina', stateCode: 'SC' },
  { city: 'CRICIÚMA', state: 'Santa Catarina', stateCode: 'SC' },
  { city: 'CHAPECÓ', state: 'Santa Catarina', stateCode: 'SC' },
  // Rondônia
  { city: 'PORTO VELHO', state: 'Rondônia', stateCode: 'RO' },
  // Tocantins
  { city: 'PALMAS', state: 'Tocantins', stateCode: 'TO' },
  // Acre
  { city: 'RIO BRANCO', state: 'Acre', stateCode: 'AC' },
  // Roraima
  { city: 'BOA VISTA', state: 'Roraima', stateCode: 'RR' },
  // Amapá
  { city: 'MACAPÁ', state: 'Amapá', stateCode: 'AP' },
  // DF
  { city: 'BRASÍLIA', state: 'Distrito Federal', stateCode: 'DF' },
  { city: 'TAGUATINGA', state: 'Distrito Federal', stateCode: 'DF' },
  { city: 'CEILÂNDIA', state: 'Distrito Federal', stateCode: 'DF' },
  { city: 'GAMA', state: 'Distrito Federal', stateCode: 'DF' },
];

export function searchCities(query: string): BrazilianCity[] {
  if (!query.trim()) return BRAZILIAN_CITIES.slice(0, 30);
  const q = query.toUpperCase().trim();
  return BRAZILIAN_CITIES.filter(
    (c) => c.city.includes(q) || c.stateCode.includes(q) || c.state.toUpperCase().includes(q)
  ).slice(0, 40);
}
