// chips de filtro por tipo de bebida, compartilhados entre catálogo e recomendações
export type FiltroTipo = '' | 'drink' | 'vinho';

export function filtrosDeTipo(rotuloTodos: string): { valor: FiltroTipo; rotulo: string }[] {
  return [
    { valor: '', rotulo: rotuloTodos },
    { valor: 'drink', rotulo: 'Drinks' },
    { valor: 'vinho', rotulo: 'Vinhos' },
  ];
}
