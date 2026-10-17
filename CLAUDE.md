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

**Por ser um TCC, as decisões precisam ser academicamente justificáveis e explicáveis.** Prefira soluções simples e transparentes a soluções "mágicas". A escolha por content-based filtering com cosseno é intencional: é explicável, não depende de dados de outros usuários e controla o cold start.

## Idioma e estilo

- Responda ao usuário em **português (pt-BR)**.
- O código está em português: nomes de funções, variáveis, mensagens de erro, comentários e rotas (`/locais`, `/avaliacoes`, `listar`, `buscarPorId`). Siga isso.
- Os comentários são curtos, em minúsculas e explicam o **porquê**. Não encha o código de comentários.
- Mensagens de erro da API são em pt-BR, voltadas ao usuário final.

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | Node 20+, Express 5, TypeScript, Prisma 6, PostgreSQL 16, JWT + bcrypt |
| Frontend | React 18 + TS, Vite 5, React Router 6, Tailwind 3, Leaflet / react-leaflet 4 (tiles OpenStreetMap) |
| Infra | Docker Compose (db + backend + frontend servido por nginx na porta 8080) |

Não há biblioteca de validação (zod etc.), de estado global (redux etc.) nem de fetch (axios, react-query). Tudo é feito à mão com helpers próprios. **Não adicione dependências sem necessidade clara.** Se adicionar uma que roda script de instalação, aprove-a em `allowScripts` no `package.json`, porque o npm 11+ exige.

## Comandos

```bash
# backend/
npm run dev          # API em :3000 (nodemon + tsx)
npm run typecheck    # tsc --noEmit
npm run migrate      # prisma migrate dev
npm run seed         # idempotente
npm run db:reset     # apaga, migra e roda o seed

# frontend/
npm run dev          # Vite em :5173
npm run build        # tsc --noEmit && vite build (use para validar)
```

**Validação mínima antes de commitar:** `npm run typecheck` no backend e `npm run build` no frontend. **Não existem testes automatizados** (nenhum `*.test.*` ou `*.spec.*`).

Health check: `GET http://localhost:3000/health`. Usuário demo do seed: `demo@godrinking.com` / `demo12345` (onboarding concluído e algumas avaliações).

### Ambiente da máquina do Augusto (Windows 11)

- **Docker não está instalado.** Usa-se o **Postgres local** em `localhost:5432` (banco, usuário e senha `godrinking`).
- **Python não está instalado.** O alias do `python` aponta para a Microsoft Store. Para scripts auxiliares, use **Node**.
- Terminais disponíveis: PowerShell 5.1 e Git Bash.
- Normalmente a API (:3000) e o Vite (:5173) já estão rodando. Antes de subir outra instância, verifique as portas (`netstat -an | grep -E ':3000 |:5173 '`).

## Arquitetura do backend

Camadas: **routes → controller → service → prisma → banco**. Cada módulo tem um arquivo em cada camada: `auth`, `bebida`, `avaliacao`, `local`, `recomendacao`, `usuario`. Existe também o `preferenciaService`, só de serviço.

- **`routes/xRoutes.ts`:** rotas GET públicas primeiro e depois as protegidas com `authMiddleware`. Os comentários separam os dois blocos.
- **`controllers/xController.ts`:** exporta um objeto `xController = { async listar(req: AuthRequest, res) {...} }`. Responsável por:
  - filtrar o body com `selecionarCampos(req.body ?? {}, CAMPOS_X)`, uma whitelist contra mass assignment;
  - validar a entrada e responder `400 { error }` direto;
  - chamar o service dentro de `try/catch` e usar `responderErro(res, error)` no catch.
  - Status usados: 200, 201 (criação) e 204 (delete, sem body).
- **`services/xService.ts`:** exporta `xService = {...}` com as regras de negócio e o Prisma. **Nunca recebe `req`/`res`.** Para sinalizar erros de negócio, use `throw erros.validacao(msg)` (400), `erros.naoEncontrado` (404), `erros.proibido` (403) ou `erros.conflito` (409), definidos em [utils/erros.ts](backend/src/utils/erros.ts). O `statusDoErro` traduz o prefixo da mensagem no status HTTP. Qualquer outro erro vira 500 e é logado.
- **Formato de erro da API:** sempre `{ "error": "mensagem" }`. Exceção: o onboarding pendente responde `409` com `code: "ONBOARDING_PENDENTE"`.
- **Prisma:** use sempre o client compartilhado de [lib/prisma.ts](backend/src/lib/prisma.ts). Os nomes das tabelas ficam em português via `@@map`.
- **[server.ts](backend/src/server.ts):** `import 'dotenv/config'` precisa ser o **primeiro import**, porque as rotas leem `process.env`. Novos módulos são registrados em `/api/<recurso>`. O JWT secret é lido sob demanda por `getJwtSecret()`, nunca no topo do módulo.
- `CORS_ORIGIN` aceita uma lista separada por vírgula.

### Modelo de dados ([schema.prisma](backend/prisma/schema.prisma))

- `User` 1–1 `UserPreference`. Este último guarda o vetor atual (`peso*`), o vetor do onboarding (`base*`) e `onboardingConcluido`.
- `Bebida` tem `tipo` = `drink` | `vinho`, os atributos `atributoDoce/Seco/Citrico/Encorpado` (sempre entre **0 e 1**) e `notaMedia`. Campos exclusivos de vinho: `tipoVinho`, `uva`, `paisOrigem`. Exclusivos de drink: `ingredientes`, `baseAlcoolica`. Os campos do outro tipo ficam `null`.
- `Avaliacao` tem `nota` de 1 a 5 e `@@unique([userId, bebidaId])`: uma avaliação por usuário e bebida, editável.
- `Local` tem `tipo` (bar, restaurante, adega...) e `latitude/longitude` opcionais. A relação N–N com bebidas é feita por `BebidaLocal` (`bebidas_locais`).
- Todas as FKs usam `onDelete: Cascade`. `DELETE /usuarios/me` apaga tudo do usuário (LGPD).
- Para mudar o schema, crie uma **nova migration** com `npm run migrate -- --name descricao`. Nunca edite migrations já aplicadas.

### Algoritmo de recomendação (núcleo do TCC)

Fica em [recomendacaoService.ts](backend/src/services/recomendacaoService.ts) e [preferenciaService.ts](backend/src/services/preferenciaService.ts).

1. **Vetores:** usuário `[pesoDoce, pesoSeco, pesoCitrico, pesoEncorpado]` e bebida `[atributoDoce, ...]`, sempre na mesma ordem (`DIMENSOES`).
2. **Score:** `similaridadeCosseno(a, b) = (a·b) / (‖a‖‖b‖)`. Retorna 0 se algum dos vetores for nulo.
3. **Candidatas:** só bebidas que o usuário ainda **não avaliou**, com filtro opcional por `tipo`, ordenadas por score, `limite` padrão 10. Cada uma traz os `locais` onde está disponível.
4. **Cold start:** se o vetor for todo zero, o service lança `conflito(ONBOARDING_PENDENTE)`. O front redireciona para `/onboarding`.
5. **Explicação (`motivo`, RF26):** as duas dimensões com maior contribuição `u[i]·b[i]` acima de 0,05 geram a frase "Porque você gosta de bebidas X e Y".
6. **Aprendizado (RF24):** o `preferenciaService.recalcular` refaz o vetor **do zero** como média ponderada entre o vetor base (peso 1, se o onboarding foi feito) e cada avaliação (`atributos × nota/5`). Deve ser chamado sempre que uma avaliação for criada, editada ou excluída, dentro da mesma transação, e a `notaMedia` da bebida também é atualizada.
7. Também existe `GET /recomendacoes/locais`, que traz os locais mais compatíveis com o perfil.

Ao mexer aqui, preserve a explicabilidade e a fórmula documentada no README, que é usada no texto do TCC.

### Seed ([prisma/seed.ts](backend/prisma/seed.ts))

12 drinks, 12 vinhos, 8 locais fictícios em bairros de Campinas/SP (com coordenadas) e o usuário demo. Ele é **idempotente**: pode rodar várias vezes sem duplicar. Atributos de sabor novos precisam ter valores coerentes entre 0 e 1, porque alimentam o algoritmo direto.

## Arquitetura do frontend

- **[App.tsx](frontend/src/App.tsx), rotas:**
  - públicas (somente deslogado, via `PublicOnlyRoute`): `/login` e `/cadastro`;
  - `/onboarding`: exige login, mas não exige onboarding;
  - dentro de `PrivateRoute` + `AppLayout`: `/` (recomendações), `/bebidas`, `/bebidas/nova`, `/bebidas/:id`, `/mapa`, `/locais/:id`, `/meu-bar` e `/minhas-avaliacoes`.
- **[lib/api.ts](frontend/src/lib/api.ts):** a função `api<T>(caminho, { method, body, query, signal })` é **o único ponto de acesso HTTP**. Ela injeta o `Bearer` token, lança `ApiError(message, status, code)`, faz logout automático em 401 e trata erro de conexão. Para mostrar erros na tela, use `mensagemDeErro(e)`.
- **Autenticação:** [context/AuthContext.tsx](frontend/src/context/AuthContext.tsx) expõe `useAuth()` com `token`, `usuario`, `perfil`, `login`, `register`, `logout` e `refreshMe`. As chaves no localStorage são `godrinking:token` e `godrinking:user`.
- **Hooks:** `useFetch` e `useDebounce`, ambos em [hooks/useFetch.ts](frontend/src/hooks/useFetch.ts).
- **Tipos** compartilhados em `lib/types.ts`.
- **`lib/sabor.ts`:** `DIMENSOES`, `saborDaBebida`, `subtituloBebida` e formatadores (`formatarNota`, `formatarData`, `capitalizar`).
- **`components/ui.tsx`:** `Icon` (Material Symbols), `Spinner`, `ErroBox`, `EstadoVazio`, `BebidaImagem`, `Estrelas`, `BarraSabor` e `TipoTag`. Reaproveite esses componentes antes de criar novos.
- **Visual:** tema escuro "Obsidian & Amber", com os tokens do Stitch em [tailwind.config.js](frontend/tailwind.config.js). Use os tokens (`bg-surface-container`, `text-on-surface`, `text-primary`, `font-headline-md`, `text-label-sm`...) e **não cores hex soltas**. Fontes: Bodoni Moda nos títulos e Manrope no texto.
- `VITE_API_URL` tem o padrão `http://localhost:3000/api`.

## Git

- Branch principal: `main`. O MVP está em **`feat/mvp`**, ainda não mergeado.
- O padrão é **Conventional Commits em português**: `tipo(escopo): descrição`. Exemplos: `feat(locais): CRUD de locais e associação com bebidas`, `fix(frontend): ...`, `docs: ...`, `chore(docker): ...`.
- Faça commits pequenos, um por módulo ou funcionalidade. Só commite ou faça push quando o usuário pedir.
- O `.gitignore` ignora `.env`, `dist`, `node_modules` e `.claude/`.

## Estado atual (2026-10-16)

O backlog do MVP foi todo implementado na `feat/mvp` e validado: builds limpos, API e front rodando, login, recomendações e as respostas 401 conferidos.

- ✅ Auth, CRUD de bebidas, avaliações com recálculo de preferências, recomendações (bebidas e locais, com motivo), CRUD de locais com associação de bebidas, onboarding de paladar, perfil/LGPD, seed, docker-compose e README.
- ✅ Telas: login, cadastro, onboarding, recomendações, catálogo com filtros, detalhe de bebida com avaliações, nova bebida, mapa Leaflet com geolocalização, detalhe do local, Meu Bar e minhas avaliações.

**Próximos passos prováveis:**
1. Abrir o PR `feat/mvp` → `main`.
2. Criar testes automatizados. Prioridade: `similaridadeCosseno`, `explicar` e `preferenciaService.recalcular` (funções puras ou quase), depois os endpoints principais. Ainda não há framework de testes instalado; o Vitest é a escolha natural com Vite/tsx.
3. Material para o texto do TCC: justificativa do algoritmo e exemplos numéricos.
4. Para produção: trocar o `JWT_SECRET` e restringir quem pode fazer CRUD de bebidas e locais (hoje basta estar logado; não existe papel de admin).
