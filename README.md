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
| Segurança | JWT (jsonwebtoken), bcrypt |
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
npm run seed                # popula drinks, vinhos, locais e o usuário demo
npm run dev                 # sobe a API com hot reload
```

Teste: http://localhost:3000/health deve responder `{"status":"ok"}`.

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

Sobe banco, API e frontend com um comando. As migrations e o seed rodam automaticamente:

```bash
docker compose up --build        # sobe tudo (use -d para rodar em segundo plano)
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

Criado pelo seed, já com onboarding concluído e algumas avaliações:

- **E-mail:** `demo@godrinking.com`
- **Senha:** `demo12345`

O seed também cadastra **12 drinks**, **12 vinhos** e **8 locais fictícios** em bairros de Campinas/SP, com coordenadas para o mapa.

## Endpoints da API

Base: `http://localhost:3000/api`. 🔒 = exige `Authorization: Bearer <token>`.

| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/register` | Cadastro `{nome, email, senha}` (senha ≥ 8) |
| POST | `/auth/login` | Login `{email, senha}` → `{token, user}` |
| GET 🔒 | `/usuarios/me` | Perfil, vetor de preferências, `onboardingConcluido` e estatísticas |
| PUT 🔒 | `/usuarios/me` | Atualiza o nome |
| PUT 🔒 | `/usuarios/me/preferencias` | Onboarding `{doce, seco, citrico, encorpado}` (0..1) |
| DELETE 🔒 | `/usuarios/me` | Exclui a conta e todos os dados (LGPD) |
| GET | `/bebidas?nome=&tipo=` | Catálogo (busca parcial por nome, `tipo=drink\|vinho`) |
| GET | `/bebidas/:id` | Detalhe + últimas 10 avaliações + locais |
| POST/PUT/DELETE 🔒 | `/bebidas[/:id]` | Cadastro e manutenção de bebidas |
| GET | `/avaliacoes/bebida/:id` | Avaliações de uma bebida |
| GET 🔒 | `/avaliacoes/minhas` | Histórico do usuário |
| POST 🔒 | `/avaliacoes` | Avalia `{bebidaId, nota 1-5, comentario?}` |
| PUT 🔒 | `/avaliacoes/:id` | Edita nota/comentário |
| DELETE 🔒 | `/avaliacoes/:id` | Remove a avaliação |
| GET 🔒 | `/recomendacoes?tipo=&limite=` | Top-N bebidas com `score`, `motivo` e `locais` |
| GET 🔒 | `/recomendacoes/locais?limite=` | Locais mais compatíveis com o perfil |
| GET | `/locais?tipo=&nome=` | Locais com suas bebidas |
| GET | `/locais/:id` | Local + bebidas disponíveis |
| POST/PUT/DELETE 🔒 | `/locais[/:id]` | CRUD de locais (lat/lng validadas) |
| POST 🔒 | `/locais/:id/bebidas` | Associa bebida `{bebidaId}` ao local |
| DELETE 🔒 | `/locais/:id/bebidas/:bebidaId` | Desassocia a bebida |

Erros seguem o formato `{ "error": "mensagem" }` com status 400, 401, 403, 404, 409 ou 500.
Se o usuário ainda não fez o onboarding, `/recomendacoes` responde **409** com `code: "ONBOARDING_PENDENTE"`.

## Como funciona a recomendação

1. **Onboarding:** 4 perguntas geram o vetor inicial do usuário `[doce, seco, cítrico, encorpado]`, com valores de 0 a 1.
2. **Bebidas:** cada bebida tem o mesmo vetor de atributos, definido no cadastro.
3. **Similaridade cosseno:** `sim(A, B) = (A · B) / (‖A‖ × ‖B‖)`. As bebidas ainda não avaliadas são ordenadas pelo score, e cada uma é cruzada com `bebidas_locais` para gerar o "Beba X no Local Y".
4. **Aprendizado:** a cada avaliação o vetor é recalculado por média ponderada:
   `novo_score = (score_atual × n + atributo × nota/5) / (n + 1)`.
   O cálculo é refeito a partir do vetor do onboarding e de todas as avaliações, então editar ou excluir uma avaliação também atualiza o perfil corretamente.
5. **Explicação:** o campo `motivo` mostra as duas dimensões que mais contribuíram para o score (ex.: *"Porque você gosta de bebidas secas e encorpadas"*).

## Estrutura de pastas

```
goDrinking-e-vai-tomando/
├── docker-compose.yml
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # modelos (users, bebidas, avaliacoes, locais...)
│   │   ├── migrations/            # histórico de migrations
│   │   └── seed.ts                # catálogo base + usuário demo
│   └── src/
│       ├── server.ts              # app express e registro das rotas
│       ├── routes/                # definição dos endpoints
│       ├── controllers/           # validação de entrada e status http
│       ├── services/              # regras de negócio + prisma
│       ├── middlewares/           # autenticação JWT
│       ├── lib/prisma.ts          # PrismaClient compartilhado
│       └── utils/                 # erros, validação, jwt
└── frontend/
    └── src/
        ├── App.tsx                # rotas
        ├── context/AuthContext.tsx # useAuth (token JWT no localStorage)
        ├── components/            # layout, PrivateRoute, cards, AvaliacaoForm...
        ├── pages/                 # telas (login, onboarding, recomendações, mapa...)
        ├── hooks/                 # useFetch, useDebounce
        └── lib/                   # cliente da API, tipos e helpers
```

## Problemas comuns

- **`P1001: Can't reach database server`**: o Postgres não está rodando. Rode `docker compose up -d db` e confira a `DATABASE_URL`.
- **Front mostra "Não foi possível conectar ao servidor"**: a API não está no ar, ou a `VITE_API_URL` está errada.
- **Erro de CORS no navegador**: inclua a URL do front em `CORS_ORIGIN` no `backend/.env`.
- **npm 11+ avisa sobre `install-scripts`**: os pacotes que precisam de script de instalação (prisma, bcrypt, esbuild) já estão aprovados em `allowScripts` no `package.json`. Se aparecer algum novo, revise e aprove com `npm install-scripts approve <pacote>`.
- **Porta 5432 ocupada**: já existe um Postgres local. Pare-o ou mude a porta no `docker-compose.yml` e na `DATABASE_URL`.
