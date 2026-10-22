// cadastro de bebida pelo usuário (RF10) e edição pelo autor ou admin: campos mudam conforme o tipo
import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { SlidersSabor } from '../components/SlidersSabor';
import { ErroBox, Icon, Spinner } from '../components/ui';
import { api, mensagemDeErro } from '../lib/api';
import { HARMONIZACOES, saborDaBebida } from '../lib/sabor';
import type { Bebida, Harmonizacao, Sabor, TipoBebida } from '../lib/types';

const TIPOS_VINHO = ['tinto', 'branco', 'rosé', 'espumante', 'fortificado'];

export default function NovaBebidaPage() {
  const { id } = useParams<{ id: string }>();
  const editando = !!id;
  const navigate = useNavigate();
  const [tipo, setTipo] = useState<TipoBebida>('drink');
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [imagemUrl, setImagemUrl] = useState('');
  const [baseAlcoolica, setBaseAlcoolica] = useState('');
  const [ingredientes, setIngredientes] = useState('');
  const [tipoVinho, setTipoVinho] = useState('tinto');
  const [uva, setUva] = useState('');
  const [paisOrigem, setPaisOrigem] = useState('');
  const [harmonizaCom, setHarmonizaCom] = useState<Harmonizacao[]>([]);
  const [sabor, setSabor] = useState<Sabor>({ doce: 0.5, seco: 0.5, citrico: 0.5, encorpado: 0.5 });
  const [carregando, setCarregando] = useState(editando);
  const [erroCarga, setErroCarga] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  // edição: preenche o form com a bebida atual
  useEffect(() => {
    if (!id) return;
    const controle = new AbortController();
    api<Bebida>(`/bebidas/${id}`, { signal: controle.signal })
      .then((b) => {
        setTipo(b.tipo);
        setNome(b.nome);
        setDescricao(b.descricao ?? '');
        setImagemUrl(b.imagemUrl ?? '');
        setBaseAlcoolica(b.baseAlcoolica ?? '');
        setIngredientes(b.ingredientes ?? '');
        setTipoVinho(b.tipoVinho ?? 'tinto');
        setUva(b.uva ?? '');
        setPaisOrigem(b.paisOrigem ?? '');
        setHarmonizaCom(b.harmonizaCom);
        setSabor(saborDaBebida(b));
        setCarregando(false);
      })
      .catch((e) => {
        if (e?.name !== 'AbortError') {
          setErroCarga(mensagemDeErro(e));
          setCarregando(false);
        }
      });
    return () => controle.abort();
  }, [id]);

  function alternarHarmonizacao(valor: Harmonizacao) {
    setHarmonizaCom((lista) => (lista.includes(valor) ? lista.filter((h) => h !== valor) : [...lista, valor]));
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return setErro('Informe o nome da bebida.');
    if (tipo === 'drink' && !baseAlcoolica.trim()) return setErro('Informe a base alcoólica do drink.');
    setErro('');
    setEnviando(true);

    const especificos =
      tipo === 'drink'
        ? { baseAlcoolica: baseAlcoolica.trim(), ingredientes: ingredientes.trim() || null }
        : { tipoVinho, uva: uva.trim() || null, paisOrigem: paisOrigem.trim() || null };
    const corpo = {
      nome: nome.trim(),
      descricao: descricao.trim() || null,
      imagemUrl: imagemUrl.trim() || null,
      atributoDoce: sabor.doce,
      atributoSeco: sabor.seco,
      atributoCitrico: sabor.citrico,
      atributoEncorpado: sabor.encorpado,
      harmonizaCom,
      ...especificos,
    };

    try {
      // o tipo não muda depois de criado, então só vai no cadastro
      const bebida = editando
        ? await api<Bebida>(`/bebidas/${id}`, { method: 'PUT', body: corpo })
        : await api<Bebida>('/bebidas', { method: 'POST', body: { ...corpo, tipo } });
      navigate(`/bebidas/${bebida.id}`, { replace: true });
    } catch (err) {
      setErro(mensagemDeErro(err));
    } finally {
      setEnviando(false);
    }
  }

  async function excluir() {
    if (!window.confirm(`Excluir "${nome}"? As avaliações dela também serão apagadas e os perfis de quem avaliou, recalculados.`)) return;
    try {
      await api(`/bebidas/${id}`, { method: 'DELETE' });
      navigate('/bebidas', { replace: true });
    } catch (err) {
      setErro(mensagemDeErro(err));
    }
  }

  if (carregando) return <Spinner />;
  if (erroCarga) {
    return (
      <div className="p-10">
        <ErroBox mensagem={erroCarga} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 md:px-10 md:py-12 xl:px-margin-desktop">
      <Link to={editando ? `/bebidas/${id}` : '/bebidas'} className="mb-4 inline-flex min-h-11 items-center gap-2 md:mb-6 text-on-surface-variant hover:text-primary">
        <Icon name="arrow_back" /> {editando ? 'Voltar' : 'Catálogo'}
      </Link>
      <span className="eyebrow block">{editando ? 'Editar bebida' : 'Nova bebida'}</span>
      <h1 className="mt-3 font-display-lg text-headline-lg-mobile md:text-display-lg">
        {editando ? nome || 'Editar bebida' : 'Não encontrou? Cadastre.'}
      </h1>
      <p className="mt-4 text-on-surface-variant">
        {editando
          ? 'Alterar o perfil de sabor recalcula o paladar de quem já avaliou esta bebida.'
          : 'A bebida fica disponível para toda a comunidade e entra no cálculo de recomendações.'}
      </p>

      <form onSubmit={salvar} className="glass-panel mt-10 space-y-8 rounded-2xl p-6 md:p-10" noValidate>
        <div className="flex gap-3">
          {(['drink', 'vinho'] as TipoBebida[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              disabled={editando && tipo !== t}
              aria-pressed={tipo === t}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-4 font-label-md text-label-md uppercase tracking-widest transition-all disabled:opacity-30 ${
                tipo === t ? 'border-primary bg-primary/10 text-primary' : 'border-surface-variant/40 text-on-surface-variant'
              }`}
            >
              <Icon name={t === 'drink' ? 'local_bar' : 'wine_bar'} /> {t === 'drink' ? 'Drink' : 'Vinho'}
            </button>
          ))}
        </div>

        <div className="group">
          <label className="field-label" htmlFor="nome">Nome</label>
          <input id="nome" className="input-line" value={nome} onChange={(e) => setNome(e.target.value)} placeholder={tipo === 'drink' ? 'Ex.: Clover Club' : 'Ex.: Syrah Reserva'} />
        </div>

        <div className="group">
          <label className="field-label" htmlFor="descricao">Descrição</label>
          <textarea id="descricao" rows={2} className="input-line resize-none" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Como você descreveria essa bebida?" />
        </div>

        <div className="group">
          <label className="field-label" htmlFor="imagemUrl">Link da imagem (opcional)</label>
          <input id="imagemUrl" type="url" inputMode="url" className="input-line" value={imagemUrl} onChange={(e) => setImagemUrl(e.target.value)} placeholder="https://..." />
        </div>

        {tipo === 'drink' ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="group">
              <label className="field-label" htmlFor="base">Base alcoólica *</label>
              <input id="base" className="input-line" value={baseAlcoolica} onChange={(e) => setBaseAlcoolica(e.target.value)} placeholder="Gin, Rum, Cachaça..." />
            </div>
            <div className="group">
              <label className="field-label" htmlFor="ingredientes">Ingredientes</label>
              <input id="ingredientes" className="input-line" value={ingredientes} onChange={(e) => setIngredientes(e.target.value)} placeholder="Separados por vírgula" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="group">
              <label className="field-label" htmlFor="tipoVinho">Estilo *</label>
              <select id="tipoVinho" className="input-line" value={tipoVinho} onChange={(e) => setTipoVinho(e.target.value)}>
                {TIPOS_VINHO.map((t) => (
                  <option key={t} value={t} className="bg-surface-container">{t}</option>
                ))}
              </select>
            </div>
            <div className="group">
              <label className="field-label" htmlFor="uva">Uva</label>
              <input id="uva" className="input-line" value={uva} onChange={(e) => setUva(e.target.value)} placeholder="Ex.: Syrah" />
            </div>
            <div className="group">
              <label className="field-label" htmlFor="pais">País</label>
              <input id="pais" className="input-line" value={paisOrigem} onChange={(e) => setPaisOrigem(e.target.value)} placeholder="Ex.: Brasil" />
            </div>
          </div>
        )}

        <fieldset>
          <legend className="mb-3 font-headline-md text-headline-md text-primary">Harmoniza com</legend>
          <div className="flex flex-wrap gap-2">
            {HARMONIZACOES.map((h) => (
              <button
                key={h.valor}
                type="button"
                onClick={() => alternarHarmonizacao(h.valor)}
                aria-pressed={harmonizaCom.includes(h.valor)}
                className={`chip ${harmonizaCom.includes(h.valor) ? 'chip-active' : ''}`}
              >
                {h.rotulo}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-6">
          <legend className="mb-2 font-headline-md text-headline-md text-primary">Perfil de sabor</legend>
          <p className="-mt-2 text-sm text-on-surface-variant">De 0 (nada) a 10 (muito). É isso que o algoritmo compara com o paladar dos usuários.</p>
          <SlidersSabor valor={sabor} onChange={setSabor} />
        </fieldset>

        {erro && (
          <p className="flex items-center gap-2 text-sm text-error" role="alert">
            <Icon name="error" /> {erro}
          </p>
        )}

        <button type="submit" disabled={enviando} className="btn-primary w-full">
          {enviando ? <Icon name="progress_activity" className="animate-spin" /> : editando ? 'Salvar alterações' : 'Cadastrar bebida'}
        </button>
        {editando && (
          <button type="button" onClick={excluir} className="mx-auto flex min-h-11 items-center gap-2 text-sm font-bold text-error hover:underline">
            <Icon name="delete_forever" /> Excluir bebida
          </button>
        )}
      </form>
    </div>
  );
}
