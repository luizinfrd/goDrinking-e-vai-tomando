// form de avaliação: nota 1–5 obrigatória; comentário, percepção dos atributos, local e foto opcionais
// (RF13, RF14, RF16; percepção B1; diário de degustação B8)
import { FormEvent, useState } from 'react';
import { api, mensagemDeErro } from '../lib/api';
import { percepcaoDaAvaliacao } from '../lib/sabor';
import type { Avaliacao, LocalResumo, Sabor } from '../lib/types';
import { SlidersSabor } from './SlidersSabor';
import { Estrelas, Icon } from './ui';

const ROTULOS_NOTA = ['', 'Não gostei', 'Razoável', 'Boa', 'Muito boa', 'Excelente'];
const MAX_COMENTARIO = 500;
const NEUTRO: Sabor = { doce: 0.5, seco: 0.5, citrico: 0.5, encorpado: 0.5 };

type Props = {
  bebidaId: string;
  existente?: Avaliacao | null;
  // atributos do catálogo: ponto de partida dos sliders de percepção
  declarado?: Sabor;
  // locais que servem a bebida; sem a lista, o local já gravado é mantido
  locais?: LocalResumo[];
  onSalvo: (avaliacao: Avaliacao) => void;
  onCancelar?: () => void;
};

export function AvaliacaoForm({ bebidaId, existente, declarado, locais, onSalvo, onCancelar }: Props) {
  const percepcaoSalva = existente ? percepcaoDaAvaliacao(existente) : null;
  const [nota, setNota] = useState(existente?.nota ?? 0);
  const [comentario, setComentario] = useState(existente?.comentario ?? '');
  const [informarPercepcao, setInformarPercepcao] = useState(!!percepcaoSalva);
  const [percepcao, setPercepcao] = useState<Sabor>(percepcaoSalva ?? declarado ?? NEUTRO);
  const [localId, setLocalId] = useState(existente?.localId ?? '');
  const [fotoUrl, setFotoUrl] = useState(existente?.fotoUrl ?? '');
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
    const campos = {
      nota,
      comentario,
      percepcao: informarPercepcao ? percepcao : null,
      fotoUrl: fotoUrl.trim() || null,
      ...(locais && { localId: localId || null }),
    };
    try {
      const salvo = existente
        ? await api<Avaliacao>(`/avaliacoes/${existente.id}`, { method: 'PUT', body: campos })
        : await api<Avaliacao>('/avaliacoes', { method: 'POST', body: { bebidaId, ...campos } });
      onSalvo(salvo);
    } catch (err) {
      setErro(mensagemDeErro(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="glass-card shine-border space-y-5 rounded-2xl p-4 xs:p-6">
      <div>
        <p className="font-label-sm text-label-sm uppercase tracking-widest text-outline">Sua nota</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          <Estrelas nota={nota} onChange={setNota} tamanho="text-2xl xs:text-3xl" />
          <span className="text-sm text-primary">{ROTULOS_NOTA[nota]}</span>
        </div>
      </div>

      <div className="group">
        <label htmlFor={`comentario-${bebidaId}`} className="field-label">
          Comentário (opcional)
        </label>
        <textarea
          id={`comentario-${bebidaId}`}
          rows={3}
          maxLength={MAX_COMENTARIO}
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder="Como foi a experiência?"
          className="input-line resize-none"
        />
        <p className="mt-1 text-right text-xs text-outline">
          {comentario.length}/{MAX_COMENTARIO}
        </p>
      </div>

      <fieldset className="space-y-4 rounded-xl border border-surface-variant/30 p-4">
        <legend className="px-1">
          <label className="flex min-h-11 cursor-pointer items-center gap-3 font-label-md text-label-md">
            <input
              type="checkbox"
              checked={informarPercepcao}
              onChange={(e) => setInformarPercepcao(e.target.checked)}
              className="h-5 w-5 accent-primary"
            />
            Como você sentiu esta bebida?
          </label>
        </legend>
        {informarPercepcao ? (
          <>
            <p className="text-sm text-on-surface-variant">
              Ajuste o que você percebeu. Com várias respostas, mostramos se a descrição do catálogo acerta, e o algoritmo passa a
              usar a percepção de quem provou.
            </p>
            <SlidersSabor valor={percepcao} onChange={setPercepcao} referencia={declarado} prefixoId={`percepcao-${bebidaId}`} />
          </>
        ) : (
          <p className="text-sm text-outline">Opcional: doçura, secura, acidez e corpo segundo você.</p>
        )}
      </fieldset>

      <details className="group/diario" open={!!(existente?.localId || existente?.fotoUrl)}>
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 font-label-md text-label-md text-on-surface-variant">
          <Icon name="menu_book" className="text-primary" /> Diário: onde você bebeu e foto (opcional)
        </summary>
        <div className="mt-3 grid grid-cols-1 gap-5">
          {locais && (
            <div className="group">
              <label htmlFor={`local-${bebidaId}`} className="field-label">
                Onde você bebeu?
              </label>
              <select id={`local-${bebidaId}`} className="input-line" value={localId} onChange={(e) => setLocalId(e.target.value)}>
                <option value="" className="bg-surface-container">
                  Não informar
                </option>
                {locais.map((l) => (
                  <option key={l.id} value={l.id} className="bg-surface-container">
                    {l.nome}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="group">
            <label htmlFor={`foto-${bebidaId}`} className="field-label">
              Link da foto
            </label>
            <input
              id={`foto-${bebidaId}`}
              type="url"
              inputMode="url"
              className="input-line"
              value={fotoUrl}
              onChange={(e) => setFotoUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>
      </details>

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
