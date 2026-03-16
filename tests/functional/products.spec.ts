import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { createUser, createProduct, loginAs } from '#tests/helpers/factories'

test.group('Products – CRUD com roles', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  test('GET /products retorna lista paginada para qualquer autenticado', async ({ client }) => {
    const user = await createUser('USER')
    const token = await loginAs(client, user)
    await createProduct({ name: 'Produto A' })
    await createProduct({ name: 'Produto B' })

    const res = await client.get('/products').header('Authorization', `Bearer ${token}`)

    res.assertStatus(200)
    res.assertBodyContains({ meta: { total: 2 } })
  })

  test('GET /products retorna 401 sem autenticação', async ({ client }) => {
    const res = await client.get('/products')
    res.assertStatus(401)
  })

  test('POST /products com ADMIN cria produto (201)', async ({ client }) => {
    const admin = await createUser('ADMIN')
    const token = await loginAs(client, admin)

    const res = await client
      .post('/products')
      .header('Authorization', `Bearer ${token}`)
      .json({ name: 'Camiseta', amount: 4990 })

    res.assertStatus(201)
    res.assertBodyContains({ name: 'Camiseta', amount: 4990 })
  })

  test('POST /products com FINANCE cria produto (201)', async ({ client }) => {
    const finance = await createUser('FINANCE')
    const token = await loginAs(client, finance)

    const res = await client
      .post('/products')
      .header('Authorization', `Bearer ${token}`)
      .json({ name: 'Caneca', amount: 2990 })

    res.assertStatus(201)
  })

  test('POST /products com USER retorna 403', async ({ client }) => {
    const user = await createUser('USER')
    const token = await loginAs(client, user)

    const res = await client
      .post('/products')
      .header('Authorization', `Bearer ${token}`)
      .json({ name: 'Produto Proibido', amount: 100 })

    res.assertStatus(403)
  })

  test('PUT /products/:id com MANAGER atualiza produto', async ({ client }) => {
    const manager = await createUser('MANAGER')
    const token = await loginAs(client, manager)
    const product = await createProduct({ name: 'Original', amount: 1000 })

    const res = await client
      .put(`/products/${product.id}`)
      .header('Authorization', `Bearer ${token}`)
      .json({ name: 'Atualizado', amount: 1500 })

    res.assertStatus(200)
    res.assertBodyContains({ name: 'Atualizado', amount: 1500 })
  })

  test('DELETE /products/:id com ADMIN remove produto (204)', async ({ client }) => {
    const admin = await createUser('ADMIN')
    const token = await loginAs(client, admin)
    const product = await createProduct()

    const res = await client
      .delete(`/products/${product.id}`)
      .header('Authorization', `Bearer ${token}`)

    res.assertStatus(204)
  })

  test('DELETE /products/:id com USER retorna 403', async ({ client }) => {
    const user = await createUser('USER')
    const token = await loginAs(client, user)
    const product = await createProduct()

    const res = await client
      .delete(`/products/${product.id}`)
      .header('Authorization', `Bearer ${token}`)

    res.assertStatus(403)
  })
})
