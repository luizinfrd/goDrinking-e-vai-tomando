// métricas offline do algoritmo (B11): leave-one-out sobre as avaliações existentes
import { useState } from 'react';
import { Pagina } from '../../components/Pagina';
import { ErroBox, Icon, Spinner } from '../../components/ui';
import { useFetch } from '../../hooks/useFetch';
import { api } from '../../lib/api';
import type { Metricas, ResultadoMetricas } from '../../lib/types';

const MODOS: Record<ResultadoMetricas['modo'], { titulo: string; descricao: string }> = {
  conteudo: { titulo: 'Só conteúdo', descricao: 'Cosseno com os atributos declarados no catálogo (algoritmo do MVP).' },
  percepcao: { titulo: 'Com percepção', descricao: 'Atributos misturados com a percepção dos usuários, peso n/(n+5).' },
  hibrido: { titulo: 'Híbrido', descricao: 'Com percepção + 20% das notas dos 10 vizinhos de paladar mais parecido.' },
};

const pct = (v: number) => `${(v * 100).toFixed(1).replace('.', ',')}%`;

export default function AdminMetricasPage() {
  const [k, setK] = useState(5);
  const { dados, carregando, erro, recarregar } = useFetch(
    (signal) => api<Metricas>('/admin/metricas', { query: { k }, signal }),
    [k]
  );
  const melhor = dados ? Math.max(...dados.resultados.map((r) => r.acertoNoTopK)) : 0;

  return (
    <Pagina>
      <span className="eyebrow">Administração</span>
      <h1 className="mt-3 font-display-lg text-headline-lg-mobile md:text-display-lg">Métricas do algoritmo</h1>
      <p className="mt-3 max-w-3xl text-on-surface-variant">
        Para cada avaliação aprovada (nota ≥ 4) de usuários com pelo menos 3 avaliações, a bebida é escondida, o vetor do usuário é
        recalculado sem ela e verificamos se ela volta entre as <strong>k</strong> primeiras recomendações.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2" role="group" aria-label="Tamanho do top-k">
        <span className="mr-2 font-label-sm text-label-sm uppercase tracking-widest text-outline">Top-k:</span>
        {[3, 5, 10].map((valor) => (
          <button key={valor} onClick={() => setK(valor)} aria-pressed={k === valor} className={`chip ${k === valor ? 'chip-active' : ''}`}>
            {valor}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {carregando && !dados ? (
          <Spinner texto="Calculando métricas..." />
        ) : erro ? (
          <ErroBox mensagem={erro.message} onTentar={recarregar} />
        ) : dados ? (
          <div className={`space-y-8 ${carregando ? 'opacity-60' : ''}`}>
            <p className="text-sm text-on-surface-variant">
              Base: {dados.totais.bebidas} bebidas, {dados.totais.usuarios} usuários e {dados.totais.avaliacoes} avaliações.
            </p>
            <div className="overflow-x-auto rounded-2xl border border-surface-variant/20">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-surface-container-high font-label-sm text-label-sm uppercase tracking-widest text-outline">
                  <tr>
                    <th className="p-4">Modo</th>
                    <th className="p-4">Casos</th>
                    <th className="p-4">Acerto@{dados.k}</th>
                    <th className="p-4">Precisão@{dados.k}</th>
                    <th className="p-4">Cobertura</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.resultados.map((r) => (
                    <tr key={r.modo} className="border-t border-surface-variant/20">
                      <td className="p-4">
                        <p className="font-bold text-on-surface">{MODOS[r.modo].titulo}</p>
                        <p className="text-xs text-on-surface-variant">{MODOS[r.modo].descricao}</p>
                      </td>
                      <td className="p-4">{r.casos}</td>
                      <td className={`p-4 font-bold ${r.acertoNoTopK === melhor && melhor > 0 ? 'text-primary' : ''}`}>
                        {pct(r.acertoNoTopK)}
                        {r.acertoNoTopK === melhor && melhor > 0 && <Icon name="emoji_events" fill className="ml-1 align-middle text-base" />}
                      </td>
                      <td className="p-4">{pct(r.precisaoNoTopK)}</td>
                      <td className="p-4">{pct(r.cobertura)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="grid gap-4 text-sm text-on-surface-variant md:grid-cols-3">
              <div className="glass-card rounded-2xl p-5">
                <dt className="font-bold text-on-surface">Acerto@k (recall@k)</dt>
                <dd className="mt-1">Fração dos casos em que a bebida escondida apareceu no top-k.</dd>
              </div>
              <div className="glass-card rounded-2xl p-5">
                <dt className="font-bold text-on-surface">Precisão@k</dt>
                <dd className="mt-1">Acertos ÷ k. Como só uma bebida relevante é escondida por caso, o teto é 1/k.</dd>
              </div>
              <div className="glass-card rounded-2xl p-5">
                <dt className="font-bold text-on-surface">Cobertura</dt>
                <dd className="mt-1">Fração do catálogo que apareceu em algum top-k: mede se o algoritmo diversifica.</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </div>
    </Pagina>
  );
}
