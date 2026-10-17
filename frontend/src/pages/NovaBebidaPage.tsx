// cadastro de bebida pelo usuário (RF10): campos mudam conforme o tipo
import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../components/ui';
import { api, mensagemDeErro } from '../lib/api';
import { DIMENSOES } from '../lib/sabor';
import type { Bebida, Sabor, TipoBebida } from '../lib/types';

const TIPOS_VINHO = ['tinto', 'branco', 'rosé', 'espumante'];

export default function NovaBebidaPage() {
  const navigate = useNavigate();
  const [tipo, setTipo] = useState<TipoBebida>('drink');
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [baseAlcoolica, setBaseAlcoolica] = useState('');
  const [ingredientes, setIngredientes] = useState('');
  const [tipoVinho, setTipoVinho] = useState('tinto');
  const [uva, setUva] = useState('');
  const [paisOrigem, setPaisOrigem] = useState('');
  const [sabor, setSabor] = useState<Sabor>({ doce: 0.5, seco: 0.5, citrico: 0.5, encorpado: 0.5 });
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

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

    try {
      const bebida = await api<Bebida>('/bebidas', {
        method: 'POST',
        body: {
          nome: nome.trim(),
          tipo,
          descricao: descricao.trim() || null,
          atributoDoce: sabor.doce,
          atributoSeco: sabor.seco,
          atributoCitrico: sabor.citrico,
          atributoEncorpado: sabor.encorpado,
          ...especificos,
        },
      });
      navigate(`/bebidas/${bebida.id}`, { replace: true });
    } catch (err) {
      setErro(mensagemDeErro(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 md:px-10 xl:px-margin-desktop">
      <Link to="/bebidas" className="mb-8 inline-flex items-center gap-2 text-on-surface-variant hover:text-primary">
        <Icon name="arrow_back" /> Catálogo
      </Link>
      <span className="eyebrow block">Nova bebida</span>
      <h1 className="mt-3 font-display-lg text-headline-lg-mobile md:text-display-lg">Não encontrou? Cadastre.</h1>
      <p className="mt-4 text-on-surface-variant">
        A bebida fica disponível para toda a comunidade e entra no cálculo de recomendações.
      </p>

      <form onSubmit={salvar} className="glass-panel mt-10 space-y-8 rounded-2xl p-6 md:p-10" noValidate>
        <div className="flex gap-3">
          {(['drink', 'vinho'] as TipoBebida[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              aria-pressed={tipo === t}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-4 font-label-md text-label-md uppercase tracking-widest transition-all ${
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

        {tipo === 'drink' ? (
          <div className="grid gap-8 md:grid-cols-2">
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
          <div className="grid gap-8 md:grid-cols-3">
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

        <fieldset className="space-y-6">
          <legend className="mb-2 font-headline-md text-headline-md text-primary">Perfil de sabor</legend>
          <p className="-mt-2 text-sm text-on-surface-variant">De 0 (nada) a 10 (muito). É isso que o algoritmo compara com o paladar dos usuários.</p>
          {DIMENSOES.map((d) => (
            <label key={d.chave} className="block">
              <div className="mb-2 flex justify-between font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
                <span>{d.rotulo}</span>
                <span className="text-primary">{Math.round(sabor[d.chave] * 10)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={sabor[d.chave]}
                onChange={(e) => setSabor((s) => ({ ...s, [d.chave]: Number(e.target.value) }))}
                className="w-full accent-[#ffb876]"
              />
            </label>
          ))}
        </fieldset>

        {erro && (
          <p className="flex items-center gap-2 text-sm text-error" role="alert">
            <Icon name="error" /> {erro}
          </p>
        )}

        <button type="submit" disabled={enviando} className="btn-primary w-full">
          {enviando ? <Icon name="progress_activity" className="animate-spin" /> : 'Cadastrar bebida'}
        </button>
      </form>
    </div>
  );
}
