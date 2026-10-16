// helpers de validação reutilizados pelos controllers

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// atributos de sabor sempre entre 0 e 1 (usados no cálculo de similaridade)
export function atributoValido(valor: unknown): boolean {
  return typeof valor === 'number' && Number.isFinite(valor) && valor >= 0 && valor <= 1;
}

// copia apenas os campos permitidos do body (evita mass assignment)
export function selecionarCampos<T extends string>(
  body: Record<string, unknown>,
  campos: readonly T[]
): Partial<Record<T, unknown>> {
  const resultado: Partial<Record<T, unknown>> = {};
  for (const campo of campos) {
    if (body[campo] !== undefined) resultado[campo] = body[campo];
  }
  return resultado;
}
