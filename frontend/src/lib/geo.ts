// distância em linha reta (haversine), igual ao cálculo do backend
const RAIO_DA_TERRA_KM = 6371;
const radianos = (graus: number) => (graus * Math.PI) / 180;

export function distanciaKm(a: [number, number], b: [number, number]) {
  const dLat = radianos(b[0] - a[0]);
  const dLng = radianos(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(radianos(a[0])) * Math.cos(radianos(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * RAIO_DA_TERRA_KM * Math.asin(Math.sqrt(h));
}
