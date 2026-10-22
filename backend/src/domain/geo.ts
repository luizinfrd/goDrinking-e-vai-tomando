// distância e proximidade para recomendar locais perto do usuário
const RAIO_DA_TERRA_KM = 6371;

const radianos = (graus: number) => (graus * Math.PI) / 180;

// fórmula de haversine: distância em linha reta sobre a superfície da terra
export function distanciaKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = radianos(lat2 - lat1);
  const dLng = radianos(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radianos(lat1)) * Math.cos(radianos(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * RAIO_DA_TERRA_KM * Math.asin(Math.sqrt(a));
}

// 1 no ponto do usuário, cai linearmente até 0 na borda do raio
export function proximidade(distancia: number, raioKm: number): number {
  return Math.max(0, 1 - distancia / raioKm);
}

export const PESO_PROXIMIDADE = 0.3;

export function scoreComProximidade(scoreSabor: number, prox: number): number {
  return (1 - PESO_PROXIMIDADE) * scoreSabor + PESO_PROXIMIDADE * prox;
}
