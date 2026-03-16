# BeTalent – Teste Técnico Back-end

## 1. Visão Geral

API RESTful de **pagamentos multi-gateway** construída com **AdonisJS 6**, **TypeScript**, **MySQL 8** e **Lucid ORM**. O sistema processa cobranças tentando um gateway por vez, em ordem de prioridade; em caso de falha (timeout, erro 5xx), faz **fallback automático** para o próximo da lista, garantindo uma arquitetura resiliente.

A integração com cada provedor de pagamento é feita via **Padrão Strategy**: adapters implementam a interface `PaymentGateway` (`charge` e `refund`), permitindo adicionar novos gateways sem alterar o núcleo da aplicação. Inclui autenticação por token, controle de acesso por roles (RBAC) e validação com VineJS.

---

## 2. Pré-requisitos

| Ferramenta | Versão |
|------------|--------|
| **Node.js** | 24+ |
| **Docker** | 24+ |
| **Docker Compose** | V2 |

Verifique na sua máquina:

```bash
node -v    # v24.x ou superior
docker -v
docker compose version
```

---

## 3. Instalação Inicial

Clone o repositório, instale as dependências e prepare o ambiente:

```bash
git clone <url-do-repositorio>
cd <pasta-do-projeto>
npm install
cp .env.example .env
```

> **Importante:** O arquivo `.env` contém credenciais dos gateways e do banco. Ajuste-o conforme a forma de execução (Modo Docker ou Modo Híbrido), conforme a seção abaixo.

---

## 4. Como Rodar o Projeto

Há duas formas de executar a aplicação. Escolha conforme o objetivo: testes rápidos (tudo no Docker) ou desenvolvimento com a API na máquina local.

---

### Abordagem A: Modo 100% Docker *(ideal para testes rápidos)*

Toda a stack sobe nos containers: API, MySQL, mocks dos gateways e phpMyAdmin.

1. Suba todos os serviços:

```bash
docker compose up -d
```

2. O servidor da API estará disponível em **http://localhost:3333**.

O `docker-compose.yml` **injeta as variáveis de ambiente** necessárias no container da API (por exemplo `DB_HOST=mysql`, `GATEWAY1_URL=http://gateways-mock:3001`, `GATEWAY2_URL=http://gateways-mock:3002`). Nesse modo, o container **não depende** do conteúdo do `.env` da sua máquina para conectar ao banco e aos gateways — os valores do Compose têm precedência.

| Serviço        | Porta   | Descrição                          |
|----------------|---------|------------------------------------|
| **api**        | `3333`  | AdonisJS 6 (hot-reload)            |
| **mysql**      | `3306`  | MySQL 8.0                          |
| **gateways-mock** | `3001`, `3002` | Mocks Gateway 1 e 2        |
| **phpmyadmin** | `8080`  | Interface web do banco             |

---

### Abordagem B: Modo Híbrido *(recomendado para desenvolvimento)*

A **API roda na sua máquina** (terminal com `npm run dev`); apenas MySQL e mocks rodam no Docker. Útil para debug, logs e hot-reload sem depender do container da API.

**Passo 1 – Subir só a infraestrutura (sem o serviço `api`):**

```bash
docker compose up -d mysql gateways-mock phpmyadmin
```

Aguarde o MySQL ficar saudável (healthcheck). MySQL em `localhost:3306`, Gateway 1 em `localhost:3001`, Gateway 2 em `localhost:3002`.

**Passo 2 – Ajustar o arquivo `.env` na raiz do projeto:**

É **obrigatório** apontar o banco e os gateways para `127.0.0.1`, pois agora a API roda fora do Docker:

```env
DB_HOST=127.0.0.1
GATEWAY1_URL=http://127.0.0.1:3001
GATEWAY2_URL=http://127.0.0.1:3002
```

Mantenha as demais variáveis (credenciais dos gateways, `DB_USER`, `DB_PASSWORD`, etc.) como no `.env.example`.

> **Aviso:** Se deixar `DB_HOST=mysql` ou as URLs dos gateways com o hostname do Docker (`gateways-mock`), a API na máquina física não conseguirá conectar. Sempre use `127.0.0.1` no Modo Híbrido.

**Passo 3 – Iniciar o servidor de desenvolvimento:**

```bash
npm run dev
```

A API estará em **http://localhost:3333**.

---

## 5. Banco de Dados e Seeders

As tabelas são criadas pelas **migrations** do Lucid; os **seeders** populam gateways e um usuário admin.

**Se estiver no Modo A (100% Docker):** rode os comandos **dentro** do container da API:

```bash
# Criar tabelas e popular (apaga dados existentes)
docker compose exec api node ace migration:fresh --seed

# Ou apenas rodar migrations (sem apagar)
docker compose exec api node ace migration:run

# Apenas seeders (tabelas já existem)
docker compose exec api node ace db:seed
```

**Se estiver no Modo B (Híbrido):** use o terminal **local** (com o mesmo `.env` já ajustado):

```bash
node ace migration:fresh --seed
# ou
node ace migration:run
node ace db:seed
```

Após o seed, existem:

- **2 gateways:** "Gateway 1" (prioridade 1) e "Gateway 2" (prioridade 2), ativos.
- **1 usuário admin:** `admin@betalent.tech` / `password123`.

---

## Estrutura do Banco de Dados

| Tabela | Colunas principais |
|--------|--------------------|
| `users` | `email`, `password`, `role` (ADMIN / MANAGER / FINANCE / USER) |
| `auth_access_tokens` | Tokens de autenticação (Adonis Auth) |
| `gateways` | `name`, `is_active`, `priority` |
| `clients` | `name`, `email` |
| `products` | `name`, `amount` (centavos) |
| `transactions` | `client_id`, `gateway_id`, `external_id`, `status`, `amount`, `card_last_numbers` |
| `transaction_products` | `transaction_id`, `product_id`, `quantity` |

---

## Roles e Permissões

| Role | Descrição |
|------|------------|
| **ADMIN** | Acesso total (gateways, usuários, produtos, transações, reembolso) |
| **MANAGER** | CRUD usuários e produtos |
| **FINANCE** | CRUD produtos e reembolso de transações |
| **USER** | Leitura (listagens e detalhes) |

---

## Rotas da API

> **Coleção de cURLs:** todos os exemplos em formato `curl` estão em **[CURLS.md](./CURLS.md)**.

- **Públicas:** `POST /login`, `POST /checkout`
- **Privadas (Bearer token):** `/me`, `/gateways` (ADMIN), `/users` (ADMIN/MANAGER), `/products`, `/clients`, `/transactions`, `POST /transactions/:id/refund` (ADMIN/FINANCE)

Listagens (`/users`, `/products`, `/clients`, `/transactions`) aceitam paginação: `?page=1&perPage=20` (máximo 100 por página).

---

## Lógica Multi-Gateway (Fallback)

1. Busca no banco os gateways com `is_active = true`, ordenados por `priority` (menor = maior prioridade).
2. Tenta cobrança no primeiro; em falha (rede, timeout, 4xx/5xx), loga e tenta o próximo.
3. Retorna sucesso no primeiro `200`; se todos falharem, retorna `503`.

Novos gateways: criar adapter em `app/services/gateways/` implementando `PaymentGateway`, registrar em `PaymentService` e inserir em `gateways` (seeder/migration).

---

## Rodando os Testes Automatizados

Os testes são **funcionais** (Japa), contra o servidor HTTP, usando **SQLite in-memory** — não precisam de MySQL nem dos gateways mock rodando.

### Comando principal

**Se a API está rodando no Docker (Modo A):**

```bash
docker compose exec api node ace test
```

**Se a API roda na sua máquina (Modo B):**

```bash
npm run dev
# Em outro terminal:
node ace test
```

Ou apenas:

```bash
node ace test
```

> **Dica:** O `package.json` tem o script `"test": "node ace test"`. Você também pode usar `npm test` em vez de `node ace test`.

### Se der erro de permissão (Modo B)

Se o projeto já tiver sido rodado no Docker, a pasta `.adonisjs/` pode pertencer ao root. Ajuste e rode de novo:

```bash
sudo chown -R $USER .adonisjs/
node ace test
```

### Rodar só alguns testes

```bash
# Um arquivo
node ace test --files="tests/functional/checkout.spec.ts"

# Por nome do teste
node ace test --grep="fallback"
node ace test --grep="403"
```

No Docker, use o mesmo comando com o prefixo:

```bash
docker compose exec api node ace test --grep="fallback"
```

### O que é testado

**35 testes** no total: autenticação, checkout (incluindo fallback G1→G2), gateways, CRUD de produtos/usuários, transações e reembolso. As chamadas aos gateways são mockadas nos testes — não é preciso ter os mocks rodando.

---

## Documentos Relacionados

- **[CURLS.md](./CURLS.md)** – Todos os exemplos de requisição com `curl` por rota.
