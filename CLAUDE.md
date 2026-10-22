# CLAUDE.md — goDrinking

Contexto e instruções para o Claude trabalhar neste repositório. Leia antes de qualquer tarefa.
Para o passo a passo de setup, a lista completa de endpoints e o troubleshooting, consulte o [README.md](README.md). Este arquivo não repete esse conteúdo.

## O projeto

**goDrinking** é um sistema de recomendação personalizada de bebidas (drinks e vinhos) e estabelecimentos.
O usuário informa o paladar (doce, seco, cítrico, encorpado), avalia o que prova e recebe sugestões do tipo **"Beba X no Local Y"**, calculadas por **similaridade cosseno**.

- **Trabalho de Graduação (TCC):** Análise e Desenvolvimento de Sistemas, Fatec Campinas, 2026.
- **Equipe:** Augusto Aristides Deolindo, Luis Felipe Rodrigues Dias e Nicole da Silva Muchon. Orientador: Prof. Dr. Thiago Salhab Alves.
- **Protótipo de UI (Google Stitch):** https://stitch.withgoogle.com/projects/7469856410279650381. O design system se chama "Obsidian & Amber".
- Os comentários no código citam requisitos do documento do TCC (ex.: `RF24`, `RF26`). Esse documento **não está no repositório**. Mantenha as referências ao alterar o código.

**Por ser um TCC, as decisões precisam ser academicamente justificáveis e explicáveis.** Prefira soluções simples e transparentes a soluções "mágicas". A escolha por content-based filtering com cosseno é intencional: é explicável, não depende de dados de outros usuários e controla o cold start. O componente colaborativo adicionado depois é leve de propósito (20% do score, só nas bebidas que vizinhos de paladar avaliaram): o núcleo continua content-based e funciona sem comunidade.

## Idioma e estilo

- Responda ao usuário em **português (pt-BR)**.
- O código está em português: nomes de funções, variáveis, mensagens de erro, comentários e rotas (`/locais`, `/avaliacoes`, `listar`, `buscarPorId`). Siga isso.
- Os comentários são curtos, em minúsculas e explicam o **porquê**. Não encha o código de comentários.
- Mensagens de erro da API são em pt-BR, voltadas ao usuário final.

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | Node 20+, Express 5, TypeScript, Prisma 6, PostgreSQL 16, JWT + bcrypt, zod, Vitest + Supertest |
| Frontend | React 18 + TS, Vite 5, React Router 6, Tailwind 3, Leaflet / react-leaflet 4 (tiles OpenStreetMap) |
| Infra | Docker Compose (db + backend + frontend servido por nginx na porta 8080) |

No backend, a validação de entrada usa **zod** e os testes, **Vitest + Supertest**. Não há biblioteca de estado global (redux etc.) nem de fetch (axios, react-query): o front usa helpers próprios. **Não adicione dependências sem necessidade clara.** Se adicionar uma que roda script de instalação, aprove-a em `allowScripts` no `package.json`, porque o npm 11+ exige.

## Comandos

```bash
# backend/
npm run dev          # API em :3000 (nodemon + tsx)
npm run typecheck    # tsc --noEmit
npm run migrate      # prisma migrate dev
npm run seed         # idempotente
npm run db:reset     # apaga, migra e roda o seed
npm test             # vitest: unit (domínio) + integração (API com banco no schema "test")

# frontend/
npm run dev          # Vite em :5173
npm run build        # tsc --noEmit && vite build (use para validar)
```

**Validação mínima antes de commitar:** `npm run typecheck` e `npm test` no backend e `npm run build` no frontend. Os testes de integração precisam do Postgres em `localhost:5432` (`docker compose up -d db`); eles recriam o schema `test` a cada execução e não tocam no `public`.

Health check: `GET http://localhost:3000/health` (confere o banco). Usuários do seed: `demo@godrinking.com` / `demo12345` e `admin@godrinking.com` / `admin12345` (papel admin). No Docker, o seed é manual: `docker compose --profile seed run --rm seed`.

Particularidades do ambiente de cada pessoa (SO, Docker ou Postgres local, ferramentas instaladas) ficam no `CLAUDE.local.md` de cada um, que não é versionado.

## Arquitetura do backend

Camadas: **routes → controller → service → repository → prisma**, com o algoritmo isolado em **`domain/`**.

- **`routes/xRoutes.ts`:** rotas GET públicas primeiro e depois as protegidas com `authMiddleware` (e `exigirAdmin` quando for manutenção do catálogo). Os comentários separam os blocos.
- **`controllers/xController.ts`:** objeto `xController = { async listar(req: AuthRequest, res) {...} }`. Só faz `schema.parse(req.body | req.params | req.query)`, chama o service e responde (200, 201 na criação, 204 no delete). **Sem try/catch**: o Express 5 encaminha os erros async para o `errorHandler`. O usuário logado vem de `usuarioLogado(req)`.
- **`schemas/*.ts`:** schemas zod por recurso, montados com os construtores de `schemas/comum.ts` (`texto`, `textoOpcional`, `atributo`, `id`, `urlOpcional`, `vetorSabor`, `harmonizacao`), que já trazem as mensagens em pt-BR. O schema é a whitelist contra mass assignment (campos desconhecidos são descartados). Tipos de entrada saem de `z.infer`.
- **`services/xService.ts`:** regras de negócio e transações (`prisma.$transaction(async (tx) => ...)`, passando `tx` aos repositórios). **Nunca recebe `req`/`res`.** Erros de negócio: `throw new ValidacaoError | NaoAutorizadoError | ProibidoError | NaoEncontradoError | ConflitoError(msg, code?)`, de [errors/AppError.ts](backend/src/errors/AppError.ts).
  - **Unicidade e FK ficam com o banco**, sem consultar antes (check-then-create tem race): envolva o `create` em `seDuplicado(promise, 'mensagem')` (P2002 → 409) e o update/delete em `seInexistente(promise, 'mensagem')` (P2025 → 404). FK inexistente (P2003) vira 404/401 no `errorHandler` pelo nome da constraint.
- **`repositories/xRepository.ts`:** todas as queries do Prisma da entidade. Cada método recebe `db: Db = prisma` por último, para participar de transações.
- **`domain/`:** funções puras, sem banco: `sabor.ts` (vetor e mapeamentos de colunas), `preferencia.ts` (RF24), `recomendacao.ts` (cosseno, explicação, percepção, colaborativo, ranking), `geo.ts`, `conquistas.ts`, `metricas.ts`. É aqui que vão os testes unitários.
- **[middlewares/errorHandler.ts](backend/src/middlewares/errorHandler.ts):** tratamento único. `AppError` → status próprio; `ZodError` → 400 com a primeira mensagem em `error` e `detalhes` por campo; erros conhecidos do Prisma; JSON inválido → 400; resto → 500 logado.
- **Formato de erro da API:** `{ "error": "mensagem" }` (+ `detalhes` na validação). Exceção: o onboarding pendente responde `409` com `code: "ONBOARDING_PENDENTE"`.
- **Admin:** `users.papel` (`usuario` | `admin`), checado no banco por `exigirAdmin` a cada requisição. Locais e métricas são só admin; bebidas sugeridas por usuário comum (`criadoUser`, `criadoPorId`) podem ser editadas pelo autor ou por admin; admin modera (exclui) avaliações de terceiros.
- **Config:** [config/env.ts](backend/src/config/env.ts) valida o `.env` com zod no boot (e importa o `dotenv/config`). Use `env.X`, nunca `process.env` direto. `CORS_ORIGIN` aceita lista separada por vírgula.
- **[app.ts](backend/src/app.ts)** monta o express (os testes usam direto) e **[server.ts](backend/src/server.ts)** sobe e faz o encerramento gracioso. Novos módulos são registrados em `/api/<recurso>` no `app.ts`.

### Modelo de dados ([schema.prisma](backend/prisma/schema.prisma))

- `User` 1–1 `UserPreference`. Este último guarda o vetor atual (`peso*`), o vetor do onboarding (`base*`) e `onboardingConcluido`. `User.papel` define o admin.
- `Bebida` tem `tipo` = `drink` | `vinho`, os atributos `atributoDoce/Seco/Citrico/Encorpado` (sempre entre **0 e 1**), `notaMedia`, `harmonizaCom` (lista fixa em `HARMONIZACOES`) e `criadoUser`/`criadoPorId`. Campos exclusivos de vinho: `tipoVinho`, `uva`, `paisOrigem`. Exclusivos de drink: `ingredientes`, `baseAlcoolica`. Os campos do outro tipo ficam `null`.
- `Avaliacao` tem `nota` de 1 a 5 e `@@unique([userId, bebidaId])`. Opcionais: a percepção `percebidoDoce/Seco/Citrico/Encorpado` (as quatro juntas ou nenhuma; use `colunasPercebidas`/`vetorPercebido` de `domain/sabor.ts`), `localId` (onde bebeu, `SET NULL`) e `fotoUrl` (diário).
- `Local` tem `tipo` (bar, restaurante, adega), `latitude/longitude` e `faixaPreco` (1–4). N–N com bebidas por `BebidaLocal` (`bebidas_locais`).
- `Favorito` (`favoritos`): lista "quero provar", PK `(userId, bebidaId)`.
- CHECKs no banco (papel, faixaPreco, percepção 0..1) ficam na migration `funcionalidades_v2`, porque o Prisma não os modela.
- As FKs de usuário e bebida usam `onDelete: Cascade`. `DELETE /usuarios/me` apaga tudo do usuário (LGPD).
- Para mudar o schema, crie uma **nova migration** com `npm run migrate -- --name descricao`. Nunca edite migrations já aplicadas. Prefira mudanças aditivas.

### Algoritmo de recomendação (núcleo do TCC)

Fica em [domain/recomendacao.ts](backend/src/domain/recomendacao.ts) e [domain/preferencia.ts](backend/src/domain/preferencia.ts); os services só buscam os dados e orquestram.

1. **Vetores:** usuário `[pesoDoce, pesoSeco, pesoCitrico, pesoEncorpado]` e bebida `[atributoDoce, ...]`, sempre na ordem de `DIMENSOES`.
2. **Vetor efetivo da bebida (percepção):** `declarado × (1 − p) + percebido × p`, com `p = n/(n+5)`. A assertividade (`1 − média |declarado − percebido|`) só é exibida com `n ≥ 3`.
3. **Score de conteúdo:** `similaridadeCosseno` entre o usuário e o vetor efetivo. Retorna 0 se algum vetor for nulo.
4. **Colaborativo:** 10 vizinhos por cosseno entre vetores de preferência; `score = 0,8 × conteúdo + 0,2 × (nota ponderada − 1)/4` só nas bebidas que os vizinhos avaliaram.
5. **Candidatas:** só bebidas que o usuário ainda **não avaliou**, com filtros opcionais `tipo` e `harmoniza`, ordenadas por score (empate: `notaMedia`), `limite` padrão 10. Cada uma traz até 3 `locais`.
6. **Cold start:** sem onboarding **e** com vetor zerado, o service lança `ConflitoError(..., 'ONBOARDING_PENDENTE')`. O front redireciona para `/onboarding`.
7. **Explicação (`motivo`, RF26):** a frase colaborativa quando ≥ 2 vizinhos deram média ≥ 4; senão as duas dimensões com maior `u[i]·b[i]` acima de 0,05. `contribuicoes` traz o % de cada eixo.
8. **Aprendizado (RF24):** `preferenciaService.recalcular` refaz o vetor **do zero** (média ponderada entre o vetor base, peso 1 se houve onboarding, e cada avaliação `vetor × nota/5`, onde o vetor é a percepção do próprio usuário quando informada). Deve rodar na mesma transação sempre que uma avaliação for criada, editada ou excluída, quando os atributos de uma bebida mudam e quando uma bebida avaliada é excluída. A `notaMedia` é atualizada por `recalcularNotasMedias`.
9. **Locais (`/recomendacoes/locais`):** média dos scores das bebidas recomendadas servidas + bônus de favoritas; com `lat/lng`, `0,7 × sabor + 0,3 × proximidade` (haversine, raio padrão 10 km).
10. **Métricas (`/admin/metricas`):** leave-one-out em `domain/metricas.ts`.

Ao mexer aqui, preserve a explicabilidade e as fórmulas documentadas no README, que são usadas no texto do TCC. Toda fórmula nova precisa de teste em `test/unit`.

### Seed ([prisma/seed.ts](backend/prisma/seed.ts) + [prisma/seed/](backend/prisma/seed))

Dados separados em `seed/bebidas.ts`, `seed/locais.ts` (8 fictícios + estabelecimentos reais de Campinas, com cardápio ilustrativo) e `seed/usuarios.ts` (demo, admin e 15 usuários fictícios `@demo.godrinking` gerados com PRNG de semente fixa). Ele é **idempotente**: bebidas e locais são atualizados pelo nome; usuários, avaliações e favoritos só são criados se não existirem (rodar de novo não troca senhas).

As fotos ficam em `frontend/public/img/{bebidas,locais}/` e entram pelo campo `imagem` de cada item (`imagemUrl` = `/img/...`, servida pelo front). Elas vêm do Openverse/Wikimedia/rawpixel sob CC BY, CC BY-SA ou CC0. **Toda imagem nova precisa de uma linha em `frontend/public/img/CREDITOS.md`**. Fotos de estabelecimentos reais são sempre genéricas (nunca do próprio local). Atributos de sabor novos precisam ter valores coerentes entre 0 e 1 (critério em `seed/tipos.ts`), porque alimentam o algoritmo direto.

## Arquitetura do frontend

- **[App.tsx](frontend/src/App.tsx), rotas:**
  - públicas (somente deslogado, via `PublicOnlyRoute`): `/login` e `/cadastro`;
  - `/onboarding`: exige login, mas não exige onboarding;
  - dentro de `PrivateRoute` + `AppLayout`: `/` (recomendações), `/bebidas`, `/bebidas/nova`, `/bebidas/:id`, `/bebidas/:id/editar` (autor ou admin), `/mapa`, `/locais/:id`, `/meu-bar` e `/minhas-avaliacoes` (diário de degustação);
  - dentro de `AdminRoute` (só `perfil.papel === 'admin'`): `/admin/locais`, `/admin/bebidas` e `/admin/metricas`.
- **[lib/api.ts](frontend/src/lib/api.ts):** a função `api<T>(caminho, { method, body, query, signal })` é **o único ponto de acesso HTTP**. Ela injeta o `Bearer` token, lança `ApiError(message, status, code)`, faz logout automático em 401 e trata erro de conexão. Para mostrar erros na tela, use `mensagemDeErro(e)`.
- **Autenticação:** [context/AuthContext.tsx](frontend/src/context/AuthContext.tsx) expõe `useAuth()` com `token`, `usuario`, `perfil`, `login`, `register`, `logout` e `refreshMe`. As chaves no localStorage são `godrinking:token` e `godrinking:user`.
- **Favoritos:** [context/FavoritosContext.tsx](frontend/src/context/FavoritosContext.tsx) (`useFavoritos()`), provido pelo `PrivateRoute`; o `BotaoFavorito` faz a atualização otimista.
- **Hooks:** `useFetch` e `useDebounce` em [hooks/useFetch.ts](frontend/src/hooks/useFetch.ts); `useGeolocalizacao` (só pede a posição sozinho se a permissão já foi dada, a menos que `automatico`).
- **Tipos** compartilhados em `lib/types.ts`.
- **`lib/sabor.ts`:** `DIMENSOES`, `HARMONIZACOES`, `saborDaBebida`, `percepcaoDaAvaliacao`, `subtituloBebida`, `evolucaoDoPaladar` e formatadores (`formatarNota`, `formatarData`, `formatarPreco`, `formatarDistancia`, `capitalizar`). `lib/filtros.ts` tem os chips de tipo; `lib/geo.ts`, a distância.
- **`components/ui.tsx`:** `Icon` (Material Symbols), `Spinner`, `ErroBox`, `EstadoVazio`, `BebidaImagem`, `LocalImagem`, `GradeSkeleton`, `Estrelas`, `BarraSabor` (com `percebido` mostra o marcador da percepção) e `TipoTag`. Outros reutilizáveis: `Pagina`/`CONTAINER` (container padrão das páginas), `Logo`, `BebidaCard`, `AvaliacaoForm`, `SlidersSabor`, `RadarSabor`, `ContribuicoesSabor`, `BotaoFavorito` e `BotaoCompartilhar`. Reaproveite antes de criar novos.
- **Visual:** tema escuro "Obsidian & Amber", com os tokens do Stitch em [tailwind.config.js](frontend/tailwind.config.js). Use os tokens (`bg-surface-container`, `text-on-surface`, `text-primary`, `font-headline-md`, `text-label-sm`...) e **não cores hex soltas**. Fontes: Bodoni Moda nos títulos e Manrope no texto.
- **Fontes de texto:** Bodoni Moda e Manrope são **locais** (`public/fonts/*-latin.woff2`, declaradas em `src/index.css`). Não volte a usar o Google Fonts: ele não carrega no Chrome headless dos testes e mascarava a largura real dos textos.
- **Rolagem lateral:** nunca use `overflow-clip`, que o Safari < 16 ignora. Elementos decorativos que vazam (brilhos com blur) ficam numa camada `absolute inset-0 overflow-hidden` própria. Campos de formulário têm no mínimo 16px no celular, senão o iOS dá zoom ao focar. O `body` tem `overflow-x: hidden` só como rede de segurança: o layout precisa caber sem ele.
- **Ícones:** Material Symbols servido como **subset local** (`public/fonts/material-symbols-subset.woff2`, só com os ícones usados). **Ao usar um ícone novo, regenere o subset incluindo o nome**, senão ele aparece como texto. A URL e as instruções estão no topo de `src/index.css`.
- **Responsividade:** a sidebar ocupa 256px a partir de `lg`, então layouts de 3 colunas ou 12 colunas entram só em `xl:`. O padding lateral é `px-5 md:px-10 xl:px-margin-desktop`. Use `min-h-dvh` (não `min-h-screen`) e respeite `env(safe-area-inset-*)` em elementos fixos. Alvos de toque têm no mínimo 44px (`h-11 w-11` ou `min-h-11`), e círculos em flex precisam de `shrink-0`.
  - **Celular é mobile-first:** cards de bebida em 2 colunas (`grid-cols-2 gap-3`), listas em linha horizontal, espaçamentos e títulos menores, e só depois `sm:`/`md:` para telas maiores.
  - **O layout precisa caber a partir de 240px** (Galaxy Fold dobrado, Android com tamanho de exibição ampliado). Fileiras de chips usam `flex-wrap`, grids sem colunas no celular levam `grid-cols-1` (senão a coluna não fica mais estreita que o conteúdo mais largo) e nada de `whitespace-nowrap` ou `shrink-0` em texto que possa crescer.
  - **`xs:`** (360px ou mais) existe porque o screen `raw` desativa as variantes `max-[...]` e `min-[...]` do Tailwind: **não use `max-[...]`**, que não gera CSS. O padrão é o compacto, e `xs:` restaura o tamanho normal (ex.: `sr-only xs:not-sr-only` para rótulos que somem em telas estreitas).
  - **`baixa:`** é um breakpoint customizado (altura de até 500px, celular deitado) que deixa topo, barra inferior e heroes compactos. **`2xl:`** alarga o container para 1560px e usa 4 colunas.
  - **Mudou o `tailwind.config.js`?** Reinicie o `npm run dev`: o Tailwind deixa a config em cache e as variantes novas não aparecem até reiniciar.
- `VITE_API_URL` tem o padrão `http://localhost:3000/api`.

## Git

- Branch principal: `main`. O MVP está em **`feat/mvp`**, ainda não mergeado.
- O padrão é **Conventional Commits em português**: `tipo(escopo): descrição`. Exemplos: `feat(locais): CRUD de locais e associação com bebidas`, `fix(frontend): ...`, `docs: ...`, `chore(docker): ...`.
- Faça commits pequenos, um por módulo ou funcionalidade. Só commite ou faça push quando o usuário pedir.
- O `.gitignore` ignora `.env`, `dist`, `node_modules` e `.claude/`.

## Estado atual (2026-10-22)

O MVP e uma segunda rodada estão na `feat/mvp`, ainda não mergeada:

- ✅ MVP: auth, CRUD de bebidas, avaliações com recálculo de preferências, recomendações com motivo, locais, onboarding, perfil/LGPD, mapa, seed e docker-compose.
- ✅ Arquitetura: erros tipados, zod, repositórios, domínio puro, env validado, graceful shutdown, Docker multi-stage com seed sob demanda e testes (Vitest + Supertest).
- ✅ Funcionalidades: percepção dos atributos × declarado (assertividade e vetor efetivo), "Não é pra mim", recomendação híbrida com vizinhos, explicação por eixo, favoritos, locais por distância e preço, radar do paladar, harmonização, diário de degustação, conquistas, compartilhar, papel admin com telas de manutenção e métricas offline do algoritmo.
- ✅ Catálogo ampliado com bebidas novas e estabelecimentos reais de Campinas.

**Próximos passos prováveis:**
1. Abrir o PR `feat/mvp` → `main`.
2. Testes do front (Vitest + Testing Library).
3. Paginação nas listagens e pré-cálculo/cache da recomendação (hoje carrega todas as candidatas por requisição).
4. Code splitting das rotas e gzip/cache no nginx; rate limit e helmet na API.
5. Upload de imagem (hoje bebida e diário aceitam só URL) e recuperação de senha.
6. Para produção: trocar o `JWT_SECRET`.
