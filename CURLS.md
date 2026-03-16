# BeTalent API – Todos os cURLs

Base URL: **http://localhost:3333**

Use o token retornado pelo login no header: `Authorization: Bearer <token>`.

---

## 1. Obter o token (login)

```bash
curl -s -X POST http://localhost:3333/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@betalent.tech","password":"password123"}'
```

Para usar em scripts (salvar o token em variável):

```bash
TOKEN=$(curl -s -X POST http://localhost:3333/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@betalent.tech","password":"password123"}' \
  | jq -r '.token.token')
```

---

## 2. Rotas públicas (sem autenticação)

### POST /checkout – Realizar compra

```bash
curl -s -X POST http://localhost:3333/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "products": [
      {"id": 1, "quantity": 2},
      {"id": 2, "quantity": 1}
    ],
    "cardNumber": "5569000000006063",
    "cvv": "010"
  }'
```

---

## 3. Rotas privadas (exigem Bearer token)

Substitua `$TOKEN` pelo valor retornado em `/login` ou use a variável do script acima.

### GET /me – Dados do usuário logado

```bash
curl -s http://localhost:3333/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## 4. Gateways (apenas role ADMIN)

### GET /gateways – Listar gateways

```bash
curl -s http://localhost:3333/gateways \
  -H "Authorization: Bearer $TOKEN"
```

### PATCH /gateways/:id/toggle – Ativar/desativar gateway

```bash
curl -s -X PATCH http://localhost:3333/gateways/1/toggle \
  -H "Authorization: Bearer $TOKEN"
```

### PATCH /gateways/:id/priority – Alterar prioridade

```bash
curl -s -X PATCH http://localhost:3333/gateways/1/priority \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"priority": 2}'
```

---

## 5. Usuários (roles ADMIN e MANAGER)

### GET /users – Listar usuários (paginado)

```bash
# Padrão: page=1, perPage=20
curl -s "http://localhost:3333/users?page=1&perPage=10" \
  -H "Authorization: Bearer $TOKEN"
```

### GET /users/:id – Detalhe de um usuário

```bash
curl -s http://localhost:3333/users/1 \
  -H "Authorization: Bearer $TOKEN"
```

### POST /users – Criar usuário

```bash
curl -s -X POST http://localhost:3333/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "fullName": "Maria Souza",
    "email": "maria@example.com",
    "password": "senha123",
    "role": "MANAGER"
  }'
```

### PUT /users/:id – Atualizar usuário

```bash
curl -s -X PUT http://localhost:3333/users/2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "fullName": "Maria Souza Atualizada",
    "email": "maria.nova@example.com",
    "password": "nova_senha_123",
    "role": "FINANCE"
  }'
```

### DELETE /users/:id – Remover usuário

```bash
curl -s -X DELETE http://localhost:3333/users/2 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 6. Produtos (leitura: qualquer autenticado; escrita: ADMIN, MANAGER, FINANCE)

### GET /products – Listar produtos (paginado)

```bash
curl -s "http://localhost:3333/products?page=1&perPage=20" \
  -H "Authorization: Bearer $TOKEN"
```

### GET /products/:id – Detalhe de um produto

```bash
curl -s http://localhost:3333/products/1 \
  -H "Authorization: Bearer $TOKEN"
```

### POST /products – Criar produto

```bash
curl -s -X POST http://localhost:3333/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name": "Camiseta BeTalent", "amount": 5990}'
```

### PUT /products/:id – Atualizar produto

```bash
curl -s -X PUT http://localhost:3333/products/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name": "Camiseta BeTalent v2", "amount": 6990}'
```

### DELETE /products/:id – Remover produto

```bash
curl -s -X DELETE http://localhost:3333/products/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 7. Clientes (qualquer usuário autenticado)

### GET /clients – Listar clientes (paginado)

```bash
curl -s "http://localhost:3333/clients?page=1&perPage=20" \
  -H "Authorization: Bearer $TOKEN"
```

### GET /clients/:id – Detalhe do cliente com suas compras

```bash
curl -s http://localhost:3333/clients/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 8. Transações (leitura: qualquer autenticado; reembolso: ADMIN, FINANCE)

### GET /transactions – Listar transações (paginado)

```bash
curl -s "http://localhost:3333/transactions?page=1&perPage=20" \
  -H "Authorization: Bearer $TOKEN"
```

### GET /transactions/:id – Detalhe de uma transação

```bash
curl -s http://localhost:3333/transactions/1 \
  -H "Authorization: Bearer $TOKEN"
```

### POST /transactions/:id/refund – Reembolsar compra

```bash
curl -s -X POST http://localhost:3333/transactions/1/refund \
  -H "Authorization: Bearer $TOKEN"
```

---

## Resumo por método e rota

| Método | Rota | Auth | Role |
|--------|------|------|------|
| POST | `/login` | — | — |
| POST | `/checkout` | — | — |
| GET | `/me` | Bearer | qualquer |
| GET | `/gateways` | Bearer | ADMIN |
| PATCH | `/gateways/:id/toggle` | Bearer | ADMIN |
| PATCH | `/gateways/:id/priority` | Bearer | ADMIN |
| GET | `/users` | Bearer | ADMIN, MANAGER |
| GET | `/users/:id` | Bearer | ADMIN, MANAGER |
| POST | `/users` | Bearer | ADMIN, MANAGER |
| PUT | `/users/:id` | Bearer | ADMIN, MANAGER |
| DELETE | `/users/:id` | Bearer | ADMIN, MANAGER |
| GET | `/products` | Bearer | qualquer |
| GET | `/products/:id` | Bearer | qualquer |
| POST | `/products` | Bearer | ADMIN, MANAGER, FINANCE |
| PUT | `/products/:id` | Bearer | ADMIN, MANAGER, FINANCE |
| DELETE | `/products/:id` | Bearer | ADMIN, MANAGER, FINANCE |
| GET | `/clients` | Bearer | qualquer |
| GET | `/clients/:id` | Bearer | qualquer |
| GET | `/transactions` | Bearer | qualquer |
| GET | `/transactions/:id` | Bearer | qualquer |
| POST | `/transactions/:id/refund` | Bearer | ADMIN, FINANCE |

---

## Paginação

Rotas que retornam listas aceitam:

- `page` (default: 1)
- `perPage` (default: 20, máximo: 100)

Exemplo: `?page=2&perPage=10`
