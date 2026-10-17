// onboarding de paladar (RF03): 4 perguntas que inicializam o vetor do usuário
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/AppLayout';
import { Icon } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { api, mensagemDeErro } from '../lib/api';
import type { Sabor } from '../lib/types';

type Opcao = { valor: number; titulo: string; texto: string; icone: string };
type Pergunta = { chave: keyof Sabor; titulo: string; subtitulo: string; opcoes: Opcao[] };

const PERGUNTAS: Pergunta[] = [
  {
    chave: 'doce',
    titulo: 'Quanto você gosta de bebidas doces?',
    subtitulo: 'Pense em licores, drinks com xarope de frutas ou vinhos de sobremesa.',
    opcoes: [
      { valor: 0.1, titulo: 'Pouco açúcar', texto: 'Prefiro quase nada de doçura.', icone: 'block' },
      { valor: 0.5, titulo: 'Na medida', texto: 'Um toque doce equilibrado.', icone: 'balance' },
      { valor: 0.9, titulo: 'Adoro doce', texto: 'Quanto mais frutado e doce, melhor.', icone: 'cake' },
    ],
  },
  {
    chave: 'seco',
    titulo: 'E de bebidas secas ou amargas?',
    subtitulo: 'Amargor de bitters, taninos de vinho tinto, gin tônica, Negroni.',
    opcoes: [
      { valor: 0.1, titulo: 'Evito', texto: 'Amargor e taninos não são para mim.', icone: 'sentiment_dissatisfied' },
      { valor: 0.5, titulo: 'Às vezes', texto: 'Gosto quando está equilibrado.', icone: 'sentiment_neutral' },
      { valor: 0.9, titulo: 'Quanto mais seco, melhor', texto: 'Amo bebidas secas e marcantes.', icone: 'local_fire_department' },
    ],
  },
  {
    chave: 'citrico',
    titulo: 'Como você se sente com acidez e notas cítricas?',
    subtitulo: 'Limão, laranja, maracujá, vinhos brancos frescos.',
    opcoes: [
      { valor: 0.1, titulo: 'Prefiro suave', texto: 'Acidez me incomoda.', icone: 'water_drop' },
      { valor: 0.5, titulo: 'Equilibrado', texto: 'Um frescor leve cai bem.', icone: 'eco' },
      { valor: 0.9, titulo: 'Bem cítrico', texto: 'Adoro bebidas ácidas e vibrantes.', icone: 'nutrition' },
    ],
  },
  {
    chave: 'encorpado',
    titulo: 'Você prefere bebidas leves ou encorpadas?',
    subtitulo: 'Corpo é a sensação de peso e intensidade na boca.',
    opcoes: [
      { valor: 0.1, titulo: 'Leves', texto: 'Refrescantes e fáceis de beber.', icone: 'air' },
      { valor: 0.5, titulo: 'Médias', texto: 'Nem tão leve, nem tão pesada.', icone: 'tune' },
      { valor: 0.9, titulo: 'Encorpadas', texto: 'Intensas, macias e marcantes.', icone: 'liquor' },
    ],
  },
];

// aproxima o valor salvo da opção mais próxima (para refazer o onboarding)
function opcaoMaisProxima(pergunta: Pergunta, valor?: number) {
  if (valor === undefined) return undefined;
  return pergunta.opcoes.reduce((melhor, op) =>
    Math.abs(op.valor - valor) < Math.abs(melhor.valor - valor) ? op : melhor
  ).valor;
}

export default function OnboardingPage() {
  const { perfil, refreshMe, usuario } = useAuth();
  const navigate = useNavigate();
  const refazendo = !!perfil?.onboardingConcluido;

  const [passo, setPasso] = useState(0);
  const [respostas, setRespostas] = useState<Partial<Sabor>>(() => {
    if (!perfil?.preferenciasBase || !refazendo) return {};
    const base = perfil.preferenciasBase;
    return Object.fromEntries(PERGUNTAS.map((p) => [p.chave, opcaoMaisProxima(p, base[p.chave])]));
  });
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const pergunta = PERGUNTAS[passo];
  const ultimo = passo === PERGUNTAS.length - 1;
  const respondida = respostas[pergunta.chave] !== undefined;

  async function avancar() {
    if (!respondida) {
      setErro('Escolha uma opção para continuar.');
      return;
    }
    setErro('');
    if (!ultimo) {
      setPasso((p) => p + 1);
      return;
    }

    setSalvando(true);
    try {
      await api('/usuarios/me/preferencias', { method: 'PUT', body: respostas });
      await refreshMe();
      navigate('/', { replace: true });
    } catch (err) {
      setErro(mensagemDeErro(err));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="relative min-h-dvh bg-obsidian">
      {/* camada própria com overflow-hidden (overflow-clip não existe no Safari < 16); não envolve o rodapé sticky */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -right-40 top-20 h-[520px] w-[520px] rounded-full bg-primary/5 blur-[140px]" />
      </div>

      <header className="flex h-16 items-center justify-between border-b border-surface-variant/10 px-5 pt-[env(safe-area-inset-top)] md:h-20 md:px-margin-desktop">
        <Logo className="text-headline-md md:text-headline-lg" />
        {refazendo && (
          <button onClick={() => navigate(-1)} className="-mr-2 flex min-h-11 items-center gap-2 px-2 text-on-surface-variant hover:text-primary">
            <Icon name="close" /> <span className="sr-only xs:not-sr-only">Cancelar</span>
          </button>
        )}
      </header>

      <main className="relative mx-auto max-w-container-max px-5 pb-0 pt-8 md:px-margin-desktop md:pb-16 md:pt-12">
        {/* stepper */}
        <div className="mb-8 flex flex-col gap-3 md:mb-10 md:gap-4">
          <div className="flex gap-2">
            {PERGUNTAS.map((p, i) => (
              <div
                key={p.chave}
                className={`h-1 flex-1 rounded-full transition-colors md:w-24 md:flex-none ${i <= passo ? 'bg-primary' : 'bg-surface-variant'}`}
              />
            ))}
          </div>
          <span className="eyebrow">
            Passo {passo + 1} de {PERGUNTAS.length} · Seu perfil de sabor
          </span>
        </div>

        {passo === 0 && (
          <div className="mb-8 max-w-3xl md:mb-12">
            <h1 className="font-display-lg text-headline-lg-mobile md:text-display-lg">
              {refazendo ? 'Vamos recalibrar' : `Olá, ${usuario?.nome.split(' ')[0] ?? ''}! Comece sua jornada sensorial no`}{' '}
              <span className="italic text-primary">goDrinking</span>.
            </h1>
            <p className="mt-3 text-on-surface-variant md:mt-4 md:font-body-lg md:text-body-lg">
              Para recomendarmos a bebida perfeita, precisamos entender o seu paladar. Não existe resposta certa — escolha o
              que mais combina com você.
            </p>
          </div>
        )}

        <section key={pergunta.chave} className="animate-[fadeIn_0.4s_ease]">
          <div className="mb-6 flex items-center gap-4 md:mb-8">
            <h2 className="font-headline-md text-headline-md text-primary">{pergunta.titulo}</h2>
            <div className="hidden h-px flex-1 bg-surface-variant/30 md:block" />
          </div>
          <p className="-mt-3 mb-6 text-sm text-on-surface-variant md:-mt-4 md:mb-8 md:text-body-md">{pergunta.subtitulo}</p>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-6">
            {pergunta.opcoes.map((op) => {
              const ativa = respostas[pergunta.chave] === op.valor;
              return (
                <button
                  key={op.valor}
                  type="button"
                  onClick={() => {
                    setRespostas((r) => ({ ...r, [pergunta.chave]: op.valor }));
                    setErro('');
                  }}
                  aria-pressed={ativa}
                  className={`glass-card group relative flex min-h-[84px] items-center gap-4 rounded-2xl p-4 pr-14 text-left transition-all md:h-56 md:flex-col md:items-start md:justify-end md:gap-0 md:p-6 hover:bg-surface-container-high/40 ${
                    ativa ? 'active-ring bg-primary/5 ring-2 ring-primary' : ''
                  }`}
                >
                  <div
                    className={`absolute right-4 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border transition-all md:right-5 md:top-5 md:translate-y-0 ${
                      ativa ? 'border-primary bg-primary text-on-primary' : 'border-outline/40'
                    }`}
                  >
                    {ativa && <Icon name="check" className="text-base" />}
                  </div>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-container-highest/60 md:mb-auto md:h-14 md:w-14">
                    <Icon name={op.icone} className={`text-3xl ${ativa ? 'text-primary' : 'text-on-surface-variant'}`} />
                  </div>
                  <span className="block">
                    <span className="block font-headline-md text-[20px] leading-tight md:text-headline-md">{op.titulo}</span>
                    <span className="block text-sm text-on-surface-variant">{op.texto}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {erro && (
          <p className="mt-6 flex items-center gap-2 text-sm text-error md:mt-8" role="alert">
            <Icon name="error" /> {erro}
          </p>
        )}

        <footer className="sticky bottom-0 -mx-5 mt-8 flex items-center justify-between gap-3 border-t border-surface-variant/20 bg-obsidian/90 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 backdrop-blur-xl md:static md:mx-0 md:mt-14 md:bg-transparent md:px-0 md:pb-0 md:pt-8 md:backdrop-blur-none">
          <button
            type="button"
            onClick={() => setPasso((p) => Math.max(0, p - 1))}
            disabled={passo === 0}
            className="-ml-2 flex min-h-11 items-center gap-2 px-2 font-label-md text-label-md uppercase tracking-widest text-on-surface-variant transition-colors hover:text-primary disabled:opacity-30"
          >
            <Icon name="arrow_back" /> <span className="sr-only xs:not-sr-only">Voltar</span>
          </button>
          <button type="button" onClick={avancar} disabled={salvando} className="btn-primary sm:px-10">
            {salvando ? (
              <Icon name="progress_activity" className="animate-spin" />
            ) : ultimo ? (
              <>
                <span className="sm:hidden">Concluir</span>
                <span className="hidden sm:inline">Ver minhas recomendações</span> <Icon name="auto_awesome" />
              </>
            ) : (
              <>
                Continuar <Icon name="arrow_forward" />
              </>
            )}
          </button>
        </footer>
      </main>
    </div>
  );
}
