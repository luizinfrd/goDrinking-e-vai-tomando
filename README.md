# goDrinking 🍷🍸

Sistema inteligente de **recomendação personalizada de bebidas e estabelecimentos**.
O usuário informa seu paladar (doce, seco, cítrico, encorpado), avalia o que prova e recebe sugestões do tipo
**"Beba X no Local Y"**, calculadas por **similaridade cosseno**.

> Trabalho de Graduação — Análise e Desenvolvimento de Sistemas · Fatec Campinas · 2026
> Augusto Aristides Deolindo · Luis Felipe Rodrigues Dias · Nicole da Silva Muchon
> Orientador: Prof. Dr. Thiago Salhab Alves

---

## Sumário

- [Stack](#stack)
- [Requisitos](#requisitos)
- [Rodando em desenvolvimento](#rodando-em-desenvolvimento)
- [Rodando tudo com Docker](#rodando-tudo-com-docker)
- [Scripts disponíveis](#scripts-disponíveis)
- [Usuário de demonstração](#usuário-de-demonstração)
- [Endpoints da API](#endpoints-da-api)
- [Como funciona a recomendação](#como-funciona-a-recomendação)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Problemas comuns](#problemas-comuns)

## Stack

| Camada | Tecnologias |
|---|---|
| Frontend | React 18 + TypeScript, Vite, React Router, Tailwind CSS, Leaflet (OpenStreetMap) |
| Backend | Node.js, Express 5, TypeScript, Prisma ORM |
| Banco | PostgreSQL 16 |
| Validação | zod (schemas por recurso) |
| Segurança | JWT (jsonwebtoken), bcrypt, papel de admin |
| Testes | Vitest + Supertest (domínio e integração) |
| Infra | Docker / Docker Compose |

## Requisitos

- **Node.js 20+** e **npm** (`node -v`, `npm -v`)
- **PostgreSQL 16**: via **Docker** (recomendado) ou instalado localmente
- Git

## Rodando em desenvolvimento

### 1. Banco de dados

Com Docker, na raiz do projeto:

```bash
docker compose up -d db
```

Isso sobe um Postgres em `localhost:5432` com usuário, senha e banco `godrinking`.
Se preferir um Postgres local, crie um banco e ajuste a `DATABASE_URL` no passo seguinte.

### 2. Backend (API em http://localhost:3000)

```bash
cd backend
cp .env.example .env        # Windows (PowerShell): Copy-Item .env.example .env
npm install
npm run migrate             # aplica as migrations (cria as tabelas)
npm run seed                # popula catálogo, locais, demo, admin e a comunidade fictícia
npm run dev                 # sobe a API com hot reload
```

Teste: http://localhost:3000/health deve responder `{"status":"ok"}` (o health confere também o banco).

A API valida o `.env` ao subir: sem `DATABASE_URL` ou `JWT_SECRET` ela encerra com a mensagem do que falta.

### 3. Frontend (http://localhost:5173)

Em outro terminal:

```bash
cd frontend
cp .env.example .env        # VITE_API_URL=http://localhost:3000/api
npm install
npm run dev
```

Abra http://localhost:5173 e entre com o [usuário demo](#usuário-de-demonstração) ou crie uma conta.

## Rodando tudo com Docker

Sobe banco, API e frontend com um comando. As migrations rodam automaticamente ao subir a API; o seed é manual,
para não sobrescrever dados a cada reinício:

```bash
docker compose up --build -d                      # sobe tudo em segundo plano
docker compose --profile seed run --rm seed       # popula o banco (idempotente; rode na primeira vez)
```

| Serviço | URL |
|---|---|
| Frontend | http://localhost:8080 |
| API | http://localhost:3000/api |
| Postgres | localhost:5432 |

Para derrubar:

```bash
docker compose down              # para os containers (mantém os dados)
docker compose down -v           # para e APAGA o volume do banco
```

> Em produção, defina `JWT_SECRET` no ambiente antes de subir (`JWT_SECRET=... docker compose up`).

## Scripts disponíveis

### Backend (`backend/`)

| Script | O que faz |
|---|---|
| `npm run dev` | API em modo desenvolvimento (nodemon + tsx) |
| `npm run build` | Compila TypeScript para `dist/` |
| `npm start` | Roda a versão compilada |
| `npm run typecheck` | Checa os tipos sem gerar arquivos |
| `npm run migrate` | `prisma migrate dev`: aplica e cria migrations em dev |
| `npm run migrate:deploy` | `prisma migrate deploy`: aplica migrations (CI/produção) |
| `npm run seed` | Popula o banco (idempotente, pode rodar várias vezes) |
| `npm run db:reset` | Apaga o banco, reaplica as migrations e roda o seed |
| `npm run generate` | Regera o Prisma Client |
| `npm run studio` | Abre o Prisma Studio (visualizar dados) |
| `npm test` | Roda os testes (Vitest). Os de integração usam o schema `test` do Postgres em `localhost:5432` (`TEST_DATABASE_URL` sobrescreve) |

### Frontend (`frontend/`)

| Script | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento Vite |
| `npm run build` | Checa os tipos e gera o build de produção em `dist/` |
| `npm run preview` | Serve o build localmente |
| `npm run typecheck` | Checa os tipos |

### Variáveis de ambiente

`backend/.env`

| Variável | Exemplo | Descrição |
|---|---|---|
| `DATABASE_URL` | `postgresql://godrinking:godrinking@localhost:5432/godrinking?schema=public` | Conexão com o Postgres |
| `JWT_SECRET` | string longa aleatória | Chave de assinatura dos tokens |
| `JWT_EXPIRES_IN` | `7d` | Validade do token |
| `PORT` | `3000` | Porta da API |
| `CORS_ORIGIN` | `http://localhost:5173,http://localhost:8080` | Origens do front permitidas |

`frontend/.env`

| Variável | Exemplo |
|---|---|
| `VITE_API_URL` | `http://localhost:3000/api` |

## Usuário de demonstração

Criados pelo seed (rodar o seed de novo não troca as senhas):

| Perfil | E-mail | Senha |
|---|---|---|
| Usuário com onboarding, avaliações e favoritos | `demo@godrinking.com` | `demo12345` |
| Administrador (telas de locais, bebidas e métricas) | `admin@godrinking.com` | `admin12345` |
| Comunidade fictícia (15 pessoas) | `ana.ribeiro@demo.godrinking`, `bruno.carvalho@demo.godrinking`... | `demo12345` |

O seed cadastra **24 drinks**, **20 vinhos**, **8 locais fictícios** e **12 estabelecimentos reais** de Campinas/SP,
com coordenadas, faixa de preço e harmonizações. A comunidade fictícia é gerada de forma determinística (sempre os mesmos dados) e
tem avaliações com percepção dos atributos e local onde bebeu; toda bebida recebe pelo menos 6 percepções, então a comparação
declarado × percebido aparece em todo o catálogo. Ela existe para a demo da percepção, da recomendação colaborativa e
das métricas: algumas bebidas foram propositalmente "percebidas" diferente do catálogo (ex.: Cosmopolitan mais doce).

> **Estabelecimentos reais:** nome, endereço e coordenadas foram conferidos em fontes públicas em outubro de 2026 (lista abaixo).
> As fotos são genéricas, de bancos de imagens livres (não são dos estabelecimentos), e **o cardápio associado a cada local é
> ilustrativo**: as bebidas foram atribuídas pelo estilo da casa (coquetelaria, boteco, vinhos), não pelo menu real.

<details>
<summary>Estabelecimentos reais e fontes consultadas</summary>

| Local | Endereço | Fontes |
|---|---|---|
| Banana Café Bar | Rua General Osório, 2090 — Cambuí, Campinas/SP | [bananacafebar.com.br](https://bananacafebar.com.br/) · [baressp.com.br](https://baressp.com.br/restaurantes/brasileiros/banana-cafe-campinas) · [diariocampineiro.com.br](https://diariocampineiro.com.br/com-16-participantes-5a-edicao-do-festival-bar-em-bar-comeca-nesta-quinta/) · [quintoandar.com.br](https://www.quintoandar.com.br/guias/cidades/bares-em-campinas/) |
| Memória Bar | Rua Quirino do Amaral Campos, 21 — Cambuí, Campinas/SP | [entresabores.com.br](https://entresabores.com.br/campinas-ganha-bar-dedicado-a-alta-coquetelaria/) · [restaurantguru.com.br](https://restaurantguru.com.br/Memoria-Bar-Campinas) · [duogourmet.com.br](https://www.duogourmet.com.br/restaurantes/campinas/memoria-club) |
| SeoRosa Cambuí | Rua Doutor Emílio Ribas, 567 — Cambuí, Campinas/SP | [yelp.com](https://www.yelp.com/biz/seo-rosa-campinas) · [tripadvisor.com](https://www.tripadvisor.com/Restaurant_Review-g303605-d939649-Reviews-SeoRosa-Campinas_State_of_Sao_Paulo.html) · [quintoandar.com.br](https://www.quintoandar.com.br/guias/?p=2463182) |
| Grainne's Irish Pub | Rua Padre Almeida, 170 — Cambuí, Campinas/SP | [baressp.com.br](https://baressp.com.br/bares/grainnes-irish-pub) · [wanderlog.com](https://wanderlog.com/list/geoCategory/154562/best-nightlife-in-campinas) · [quintoandar.com.br](https://www.quintoandar.com.br/guias/cidades/bares-em-campinas/) |
| Bar Santa Genebra | Rua Ângelo Vicentim, 736 — Barão Geraldo, Campinas/SP | [baressp.com.br](https://www.baressp.com.br/bares/bar-santa-genebra) · [diariocampineiro.com.br](https://diariocampineiro.com.br/com-16-participantes-5a-edicao-do-festival-bar-em-bar-comeca-nesta-quinta/) |
| Bar Candreva Barão Geraldo | Avenida Albino José Barbosa de Oliveira, 1240 — Barão Geraldo, Campinas/SP | [sbcm2025.nics.unicamp.br](https://sbcm2025.nics.unicamp.br/wp-content/uploads/2025/07/guide-barao-geraldo-campinas_SBCMv2f-2.pdf) · [diariocampineiro.com.br](https://diariocampineiro.com.br/com-16-participantes-5a-edicao-do-festival-bar-em-bar-comeca-nesta-quinta/) |
| Buteco Seu Rufino | Rua Padre Almeida, 167 — Cambuí, Campinas/SP (posição aproximada) | [campinas.com.br](https://campinas.com.br/gastronomia/2026/01/buteco-seu-rufino-inaugura-unidade-no-cambui-com-foco-na-gastronomia-raiz-e-afetiva/) |
| Giovannetti Rosário | Rua General Osório, 1059 — Centro, Campinas/SP | [quintoandar.com.br](https://www.quintoandar.com.br/guias/cidades/bares-em-campinas/) · [gazetasp.com.br](https://www.gazetasp.com.br/gazeta-mais/11-botecos-tradicionais-campinas/) · [wanderlog.com](https://wanderlog.com/list/geoCategory/154562/best-nightlife-in-campinas) |
| Dom Brejas | Avenida Barão de Itapura, 2947 — Taquaral, Campinas/SP | [quintoandar.com.br](https://www.quintoandar.com.br/guias/cidades/bares-em-campinas/) · [diariocampineiro.com.br](https://diariocampineiro.com.br/com-16-participantes-5a-edicao-do-festival-bar-em-bar-comeca-nesta-quinta/) · [wanderlog.com](https://wanderlog.com/list/geoCategory/154562/best-nightlife-in-campinas) |
| Entre Taças Restaurante e Wine Bar | Rua Doutor Emílio Ribas, 1151 — Cambuí, Campinas/SP (posição aproximada) | [entretacas.com.br](https://www.entretacas.com.br/) · [entretacas.com.br](https://www.entretacas.com.br/reveillon-2026) · [tripadvisor.com](https://www.tripadvisor.com/Restaurant_Review-g303605-d14160000-Reviews-Entre_Tacas-Campinas_State_of_Sao_Paulo.html) |
| Olivetto Restaurante e Enoteca | Avenida Coronel Silva Telles, 843 — Cambuí, Campinas/SP (posição aproximada) | [olivettorestaurante.com.br](https://olivettorestaurante.com.br/campinas/cardapio/sugestaodochef/) · [tripadvisor.com](https://www.tripadvisor.com/Restaurant_Review-g303605-d2365383-Reviews-Olivetto_Restaurante_e_Enoteca-Campinas_State_of_Sao_Paulo.html) · [quintoandar.com.br](https://www.quintoandar.com.br/guias/?p=2463182) |
| Ramalho Experience | Avenida Lafayete Arruda Camargo, 38 — Parque São Quirino, Campinas/SP (posição aproximada) | [ramalhoexperience.com.br](https://ramalhoexperience.com.br/wine-bar-campinas/) |

</details>

## Endpoints da API

Base: `http://localhost:3000/api`. 🔒 = exige `Authorization: Bearer <token>`.

| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/register` | Cadastro `{nome, email, senha}` (senha ≥ 8) |
| POST | `/auth/login` | Login `{email, senha}` → `{token, user}` |
| GET 🔒 | `/usuarios/me` | Perfil, `papel`, vetor de preferências, `onboardingConcluido`, estatísticas e `conquistas` |
| PUT 🔒 | `/usuarios/me` | Atualiza o nome |
| PUT 🔒 | `/usuarios/me/preferencias` | Onboarding `{doce, seco, citrico, encorpado}` (0..1) |
| DELETE 🔒 | `/usuarios/me` | Exclui a conta e todos os dados (LGPD) |
| GET | `/bebidas?nome=&tipo=&harmoniza=` | Catálogo (busca parcial por nome, `tipo=drink\|vinho`, `harmoniza=queijos`...) com `percepcao: {total, assertividade}` |
| GET | `/bebidas/:id` | Detalhe + últimas 10 avaliações + locais + `percepcao` (média percebida, assertividade, peso no algoritmo) |
| POST 🔒 | `/bebidas` | Sugere uma bebida (usuário comum: marcada como da comunidade) |
| PUT/DELETE 🔒 | `/bebidas/:id` | Só o autor da sugestão ou um admin |
| GET | `/avaliacoes/bebida/:id` | Avaliações de uma bebida |
| GET 🔒 | `/avaliacoes/minhas?bebidaId=` | Diário do usuário (com local), opcionalmente de uma bebida |
| POST 🔒 | `/avaliacoes` | Avalia `{bebidaId, nota 1-5, comentario?, percepcao?: {doce, seco, citrico, encorpado}, localId?, fotoUrl?}` |
| PUT 🔒 | `/avaliacoes/:id` | Edita (só o autor) |
| DELETE 🔒 | `/avaliacoes/:id` | Remove (autor ou admin, para moderação) |
| GET 🔒 | `/recomendacoes?tipo=&harmoniza=&limite=` | Top-N com `score`, `scoreConteudo`, `scoreColaborativo`, `motivo`, `contribuicoes` e `locais` |
| GET 🔒 | `/recomendacoes/locais?limite=&lat=&lng=&raioKm=&faixaPrecoMax=` | Locais compatíveis; com `lat/lng` a distância entra no score e volta em `distanciaKm` |
| GET 🔒 | `/favoritos` | Lista "Quero provar" |
| POST/DELETE 🔒 | `/favoritos/:bebidaId` | Adiciona (idempotente) / remove |
| GET | `/locais?tipo=&nome=&faixaPrecoMax=` | Locais com suas bebidas |
| GET | `/locais/:id` | Local + bebidas disponíveis |
| POST/PUT/DELETE 🔒👑 | `/locais[/:id]` | CRUD de locais (lat/lng e `faixaPreco` 1–4 validadas) |
| POST 🔒👑 | `/locais/:id/bebidas` | Associa bebida `{bebidaId}` ao local |
| DELETE 🔒👑 | `/locais/:id/bebidas/:bebidaId` | Desassocia a bebida |
| GET 🔒👑 | `/admin/metricas?k=` | Avaliação offline do algoritmo (acerto@k, precisão@k, cobertura) |

👑 = exige papel `admin` (lido do banco a cada requisição).

Erros seguem o formato `{ "error": "mensagem" }` com status 400, 401, 403, 404, 409 ou 500. Erros de validação trazem também
`detalhes: { campo: mensagem }`.
Se o usuário ainda não fez o onboarding, `/recomendacoes` responde **409** com `code: "ONBOARDING_PENDENTE"`.

## Como funciona a recomendação

O núcleo fica em `backend/src/domain/` (funções puras, sem banco, cobertas por testes).

1. **Onboarding:** 4 perguntas geram o vetor inicial do usuário `[doce, seco, cítrico, encorpado]`, com valores de 0 a 1.
2. **Bebidas:** cada bebida tem o mesmo vetor de atributos, declarado no cadastro.
3. **Percepção dos usuários:** ao avaliar, o usuário pode dizer como sentiu a bebida (os mesmos 4 eixos). A média percebida
   vira o **vetor efetivo** da bebida, misturado com o declarado:
   `efetivo = declarado × (1 − p) + percebido × p`, com `p = n / (n + 5)` (n = respostas).
   Com poucas respostas vale o catálogo; com muitas, a opinião de quem provou. A **assertividade** exibida no detalhe é
   `1 − média(|declarado − percebido|)`, mostrada a partir de 3 respostas.
4. **Similaridade cosseno:** `sim(A, B) = (A · B) / (‖A‖ × ‖B‖)` entre o vetor do usuário e o vetor efetivo de cada bebida ainda
   não avaliada. Cada bebida é cruzada com `bebidas_locais` para gerar o "Beba X no Local Y".
5. **Componente colaborativo (leve):** os 10 usuários de paladar mais parecido (cosseno entre vetores de preferência) contribuem
   com a nota que deram: `score = 0,8 × cosseno + 0,2 × (nota ponderada − 1) / 4`. Bebidas que os vizinhos não avaliaram ficam só com o cosseno.
6. **Aprendizado:** a cada avaliação o vetor é recalculado por média ponderada:
   `novo_score = (score_atual × n + atributo × nota/5) / (n + 1)`.
   O cálculo é refeito a partir do vetor do onboarding e de todas as avaliações, então editar ou excluir uma avaliação também
   atualiza o perfil corretamente. Quando o usuário informou a percepção, o "atributo" é o que **ele** percebeu, e não o do catálogo.
   "Não é pra mim" é uma avaliação nota 1.
7. **Explicação:** o campo `motivo` mostra as duas dimensões que mais contribuíram para o score (ex.: *"Porque você gosta de bebidas
   secas e encorpadas"*) ou, quando os vizinhos aprovaram (≥ 2 deles, média ≥ 4), *"Pessoas com paladar parecido com o seu deram 4,6"*.
   `contribuicoes` traz o peso de cada eixo em % (`u[i]·b[i] / Σ u·b`).
8. **Locais:** média do score das bebidas recomendadas que o local serve, + 0,05 por favorita (até 0,15). Com a posição do
   usuário: `0,7 × sabor + 0,3 × proximidade`, onde proximidade cai linearmente de 1 (no ponto) a 0 (no raio, padrão 10 km; distância por haversine).
9. **Métricas (admin):** avaliação offline *leave-one-out*. Para cada avaliação com nota ≥ 4 de usuários com ≥ 3 avaliações,
   esconde a avaliação, recalcula o vetor sem ela e mede se a bebida volta no top-k. Compara "só conteúdo", "com percepção" e
   "híbrido" (acerto@k, precisão@k e cobertura do catálogo).

## Estrutura de pastas

```
goDrinking-e-vai-tomando/
├── docker-compose.yml             # db, backend, frontend e seed (profile)
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # modelos (users, bebidas, avaliacoes, locais, favoritos...)
│   │   ├── migrations/            # histórico de migrations
│   │   ├── seed.ts                # script do seed
│   │   └── seed/                  # dados: bebidas, locais, usuários e comunidade fictícia
│   ├── test/                      # vitest: unit/ (domínio) e integracao/ (API + banco)
│   └── src/
│       ├── server.ts              # sobe o servidor e faz o encerramento gracioso
│       ├── app.ts                 # monta o express (usado também pelos testes)
│       ├── config/env.ts          # variáveis de ambiente validadas no boot
│       ├── routes/                # definição dos endpoints
│       ├── controllers/           # valida a entrada (schemas) e responde
│       ├── schemas/               # schemas zod por recurso
│       ├── services/              # regras de negócio e transações
│       ├── repositories/          # queries do prisma por entidade
│       ├── domain/                # algoritmo puro: cosseno, percepção, colaborativo, geo, conquistas, métricas
│       ├── errors/AppError.ts     # erros de negócio com status http
│       ├── middlewares/           # JWT, admin e tratamento único de erros
│       └── lib/prisma.ts          # PrismaClient compartilhado
└── frontend/
    └── src/
        ├── App.tsx                # rotas (inclui /admin/*)
        ├── context/               # AuthContext (useAuth) e FavoritosContext
        ├── components/            # layout, cards, AvaliacaoForm, radar, sliders...
        ├── pages/                 # telas (login, onboarding, recomendações, mapa, admin/...)
        ├── hooks/                 # useFetch, useDebounce, useGeolocalizacao
        └── lib/                   # cliente da API, tipos e helpers
```

## Problemas comuns

- **`P1001: Can't reach database server`**: o Postgres não está rodando. Rode `docker compose up -d db` e confira a `DATABASE_URL`.
- **Front mostra "Não foi possível conectar ao servidor"**: a API não está no ar, ou a `VITE_API_URL` está errada.
- **Erro de CORS no navegador**: inclua a URL do front em `CORS_ORIGIN` no `backend/.env`.
- **npm 11+ avisa sobre `install-scripts`**: os pacotes que precisam de script de instalação (prisma, bcrypt, esbuild) já estão aprovados em `allowScripts` no `package.json`. Se aparecer algum novo, revise e aprove com `npm install-scripts approve <pacote>`.
- **`npm test` falha com `P1001`**: os testes de integração precisam do Postgres em `localhost:5432` (`docker compose up -d db`).
- **Porta 5432 ocupada**: já existe um Postgres local. Pare-o ou mude a porta no `docker-compose.yml` e na `DATABASE_URL`.
