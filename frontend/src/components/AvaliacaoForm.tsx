// modal/form de avaliação: nota 1–5 obrigatória e comentário opcional (RF13, RF14, RF16)
import { FormEvent, useState } from 'react';
import { api, mensagemDeErro } from '../lib/api';
import type { Avaliacao } from '../lib/types';
import { Estrelas, Icon } from './ui';

const ROTULOS_NOTA = ['', 'Não gostei', 'Razoável', 'Boa', 'Muito boa', 'Excelente'];
const MAX_COMENTARIO = 500;

type Props = {
  bebidaId: string;
  existente?: Avaliacao | null;
  onSalvo: (avaliacao: Avaliacao) => void;
  onCancelar?: () => void;
};

export function AvaliacaoForm({ bebidaId, existente, onSalvo, onCancelar }: Props) {
  const [nota, setNota] = useState(existente?.nota ?? 0);
  const [comentario, setComentario] = useState(existente?.comentario ?? '');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (nota < 1) {
      setErro('Selecione uma nota de 1 a 5 estrelas.');
      return;
    }
    setErro('');
    setEnviando(true);
    try {
      const salvo = existente
        ? await api<Avaliacao>(`/avaliacoes/${existente.id}`, { method: 'PUT', body: { nota, comentario } })
        : await api<Avaliacao>('/avaliacoes', { method: 'POST', body: { bebidaId, nota, comentario } });
      onSalvo(salvo);
    } catch (err) {
      setErro(mensagemDeErro(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="glass-card shine-border space-y-5 rounded-2xl p-6">
      <div>
        <p className="font-label-sm text-label-sm uppercase tracking-widest text-outline">Sua nota</p>
        <div className="mt-2 flex items-center gap-4">
          <Estrelas nota={nota} onChange={setNota} tamanho="text-3xl" />
          <span className="text-sm text-primary">{ROTULOS_NOTA[nota]}</span>
        </div>
      </div>

      <div className="group">
        <label htmlFor="comentario" className="field-label">
          Comentário (opcional)
        </label>
        <textarea
          id="comentario"
          rows={3}
          maxLength={MAX_COMENTARIO}
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder="Como foi a experiência? Onde você bebeu?"
          className="input-line resize-none"
        />
        <p className="mt-1 text-right text-xs text-outline">
          {comentario.length}/{MAX_COMENTARIO}
        </p>
      </div>

      {erro && (
        <p className="flex items-center gap-2 text-sm text-error" role="alert">
          <Icon name="error" /> {erro}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-3">
        {onCancelar && (
          <button type="button" onClick={onCancelar} className="btn-ghost">
            Cancelar
          </button>
        )}
        <button type="submit" disabled={enviando} className="btn-primary px-6 py-3">
          {enviando ? <Icon name="progress_activity" className="animate-spin" /> : existente ? 'Salvar alteração' : 'Enviar avaliação'}
        </button>
      </div>
    </form>
  );
}
