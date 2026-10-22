// manutenção dos locais (B13): cadastro, edição, exclusão e bebidas servidas
import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pagina } from '../../components/Pagina';
import { ErroBox, Icon, Spinner, TipoTag } from '../../components/ui';
import { useFetch } from '../../hooks/useFetch';
import { api, mensagemDeErro } from '../../lib/api';
import { formatarPreco } from '../../lib/sabor';
import type { Bebida, LocalComBebidas } from '../../lib/types';

const TIPOS = ['bar', 'restaurante', 'adega'];

type Formulario = {
  nome: string;
  tipo: string;
  endereco: string;
  descricao: string;
  imagemUrl: string;
  latitude: string;
  longitude: string;
  faixaPreco: string;
};

const VAZIO: Formulario = { nome: '', tipo: 'bar', endereco: '', descricao: '', imagemUrl: '', latitude: '', longitude: '', faixaPreco: '' };

const paraFormulario = (l: LocalComBebidas): Formulario => ({
  nome: l.nome,
  tipo: l.tipo ?? 'bar',
  endereco: l.endereco ?? '',
  descricao: l.descricao ?? '',
  imagemUrl: l.imagemUrl ?? '',
  latitude: l.latitude?.toString() ?? '',
  longitude: l.longitude?.toString() ?? '',
  faixaPreco: l.faixaPreco?.toString() ?? '',
});

const numeroOuNull = (texto: string) => (texto.trim() === '' ? null : Number(texto.replace(',', '.')));

export default function AdminLocaisPage() {
  const { dados: locais, carregando, erro, recarregar } = useFetch((signal) => api<LocalComBebidas[]>('/locais', { signal }), []);
  const { dados: bebidas } = useFetch((signal) => api<Bebida[]>('/bebidas', { signal }), []);
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [form, setForm] = useState<Formulario | null>(null);
  const [novaBebida, setNovaBebida] = useState('');
  const [erroAcao, setErroAcao] = useState('');
  const [salvando, setSalvando] = useState(false);

  const selecionado = locais?.find((l) => l.id === selecionadoId) ?? null;

  function abrir(local: LocalComBebidas | null) {
    setErroAcao('');
    setSelecionadoId(local?.id ?? null);
    setForm(local ? paraFormulario(local) : { ...VAZIO });
  }

  const campo = (chave: keyof Formulario) => ({
    value: form?.[chave] ?? '',
    onChange: (e: { target: { value: string } }) => setForm((f) => f && { ...f, [chave]: e.target.value }),
  });

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSalvando(true);
    setErroAcao('');
    const corpo = {
      nome: form.nome,
      tipo: form.tipo,
      endereco: form.endereco || null,
      descricao: form.descricao || null,
      imagemUrl: form.imagemUrl || null,
      latitude: numeroOuNull(form.latitude),
      longitude: numeroOuNull(form.longitude),
      faixaPreco: numeroOuNull(form.faixaPreco),
    };
    try {
      const salvo = selecionadoId
        ? await api<LocalComBebidas>(`/locais/${selecionadoId}`, { method: 'PUT', body: corpo })
        : await api<LocalComBebidas>('/locais', { method: 'POST', body: corpo });
      setSelecionadoId(salvo.id);
      recarregar();
    } catch (err) {
      setErroAcao(mensagemDeErro(err));
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!selecionado || !window.confirm(`Excluir "${selecionado.nome}"?`)) return;
    try {
      await api(`/locais/${selecionado.id}`, { method: 'DELETE' });
      setSelecionadoId(null);
      setForm(null);
      recarregar();
    } catch (err) {
      setErroAcao(mensagemDeErro(err));
    }
  }

  async function associar() {
    if (!selecionado || !novaBebida) return;
    try {
      await api(`/locais/${selecionado.id}/bebidas`, { method: 'POST', body: { bebidaId: novaBebida } });
      setNovaBebida('');
      recarregar();
    } catch (err) {
      setErroAcao(mensagemDeErro(err));
    }
  }

  async function desassociar(bebidaId: string) {
    if (!selecionado) return;
    try {
      await api(`/locais/${selecionado.id}/bebidas/${bebidaId}`, { method: 'DELETE' });
      recarregar();
    } catch (err) {
      setErroAcao(mensagemDeErro(err));
    }
  }

  const disponiveis = (bebidas ?? []).filter((b) => !selecionado?.bebidas.some((sb) => sb.id === b.id));

  return (
    <Pagina>
      <span className="eyebrow">Administração</span>
      <div className="mt-3 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <h1 className="font-display-lg text-headline-lg-mobile md:text-display-lg">Locais</h1>
        <button onClick={() => abrir(null)} className="btn-primary self-start">
          <Icon name="add" /> Novo local
        </button>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-12">
        <div className="xl:col-span-5">
          {carregando && !locais ? (
            <Spinner />
          ) : erro ? (
            <ErroBox mensagem={erro.message} onTentar={recarregar} />
          ) : (
            <ul className="divide-y divide-surface-variant/20 rounded-2xl border border-surface-variant/20">
              {(locais ?? []).map((l) => (
                <li key={l.id}>
                  <button
                    onClick={() => abrir(l)}
                    aria-current={l.id === selecionadoId}
                    className={`flex w-full items-center gap-3 p-4 text-left ${l.id === selecionadoId ? 'bg-surface-container-high' : 'hover:bg-surface-container-low'}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-headline-md text-lg">{l.nome}</p>
                      <p className="truncate text-xs text-outline">{l.endereco ?? 'sem endereço'}</p>
                    </div>
                    {l.tipo && <TipoTag>{l.tipo}</TipoTag>}
                    <span className="text-xs text-outline">{l.bebidas.length} beb.</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="xl:col-span-7">
          {!form ? (
            <p className="text-on-surface-variant">Selecione um local para editar ou crie um novo.</p>
          ) : (
            <div className="space-y-8">
              <form onSubmit={salvar} className="glass-panel space-y-6 rounded-2xl p-6" noValidate>
                <h2 className="font-headline-md text-headline-md">{selecionado ? `Editar ${selecionado.nome}` : 'Novo local'}</h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="group md:col-span-2">
                    <label className="field-label" htmlFor="nome">Nome *</label>
                    <input id="nome" className="input-line" {...campo('nome')} />
                  </div>
                  <div className="group">
                    <label className="field-label" htmlFor="tipo">Tipo</label>
                    <select id="tipo" className="input-line" {...campo('tipo')}>
                      {TIPOS.map((t) => (
                        <option key={t} value={t} className="bg-surface-container">{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="group">
                    <label className="field-label" htmlFor="faixaPreco">Faixa de preço</label>
                    <select id="faixaPreco" className="input-line" {...campo('faixaPreco')}>
                      <option value="" className="bg-surface-container">não informada</option>
                      {[1, 2, 3, 4].map((p) => (
                        <option key={p} value={p} className="bg-surface-container">{formatarPreco(p)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="group md:col-span-2">
                    <label className="field-label" htmlFor="endereco">Endereço</label>
                    <input id="endereco" className="input-line" {...campo('endereco')} />
                  </div>
                  <div className="group">
                    <label className="field-label" htmlFor="latitude">Latitude</label>
                    <input id="latitude" inputMode="decimal" className="input-line" {...campo('latitude')} placeholder="-22.90" />
                  </div>
                  <div className="group">
                    <label className="field-label" htmlFor="longitude">Longitude</label>
                    <input id="longitude" inputMode="decimal" className="input-line" {...campo('longitude')} placeholder="-47.06" />
                  </div>
                  <div className="group md:col-span-2">
                    <label className="field-label" htmlFor="descricao">Descrição</label>
                    <textarea id="descricao" rows={2} className="input-line resize-none" {...campo('descricao')} />
                  </div>
                  <div className="group md:col-span-2">
                    <label className="field-label" htmlFor="imagemUrl">Imagem (/img/... ou https://...)</label>
                    <input id="imagemUrl" className="input-line" {...campo('imagemUrl')} />
                  </div>
                </div>
                {erroAcao && <p className="text-sm text-error" role="alert">{erroAcao}</p>}
                <div className="flex flex-wrap gap-3">
                  <button type="submit" disabled={salvando} className="btn-primary">
                    {salvando ? <Icon name="progress_activity" className="animate-spin" /> : 'Salvar'}
                  </button>
                  {selecionado && (
                    <>
                      <Link to={`/locais/${selecionado.id}`} className="btn-ghost">Ver página</Link>
                      <button type="button" onClick={excluir} className="flex min-h-11 items-center gap-2 px-3 text-sm font-bold text-error">
                        <Icon name="delete_forever" /> Excluir
                      </button>
                    </>
                  )}
                </div>
              </form>

              {selecionado && (
                <section className="glass-panel space-y-4 rounded-2xl p-6">
                  <h2 className="font-headline-md text-headline-md">Bebidas servidas</h2>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <select value={novaBebida} onChange={(e) => setNovaBebida(e.target.value)} className="input-line flex-1" aria-label="Bebida para associar">
                      <option value="" className="bg-surface-container">Adicionar bebida...</option>
                      {disponiveis.map((b) => (
                        <option key={b.id} value={b.id} className="bg-surface-container">{b.nome}</option>
                      ))}
                    </select>
                    <button onClick={associar} disabled={!novaBebida} className="btn-ghost">
                      <Icon name="add" /> Associar
                    </button>
                  </div>
                  <ul className="flex flex-wrap gap-2">
                    {selecionado.bebidas.map((b) => (
                      <li key={b.id} className="glass-card flex items-center gap-1 rounded-full py-1 pl-4 pr-1">
                        {b.nome}
                        <button onClick={() => desassociar(b.id)} className="flex h-11 w-11 items-center justify-center rounded-full text-outline hover:text-error" aria-label={`Remover ${b.nome}`}>
                          <Icon name="close" />
                        </button>
                      </li>
                    ))}
                    {selecionado.bebidas.length === 0 && <li className="text-sm text-outline">Nenhuma bebida associada.</li>}
                  </ul>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </Pagina>
  );
}
