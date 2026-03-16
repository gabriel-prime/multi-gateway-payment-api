import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { createUser, loginAs } from '#tests/helpers/factories'

test.group('Users – CRUD com roles', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  test('GET /users com ADMIN retorna lista paginada', async ({ client }) => {
    const admin = await createUser('ADMIN')
    const token = await loginAs(client, admin)
    await createUser('USER')
    await createUser('MANAGER')

    const res = await client.get('/users').header('Authorization', `Bearer ${token}`)

    res.assertStatus(200)
    res.assertBodyContains({ meta: { total: 3 } })
  })

  test('POST /users com ADMIN cria usuário (201)', async ({ client }) => {
    const admin = await createUser('ADMIN')
    const token = await loginAs(client, admin)

    const res = await client
      .post('/users')
      .header('Authorization', `Bearer ${token}`)
      .json({
        fullName: 'Novo Usuário',
        email: 'novo@users.test',
        password: 'senha1234',
        role: 'FINANCE',
      })

    res.assertStatus(201)
    res.assertBodyContains({ email: 'novo@users.test', role: 'FINANCE' })
  })

  test('POST /users com FINANCE retorna 403', async ({ client }) => {
    const finance = await createUser('FINANCE')
    const token = await loginAs(client, finance)

    const res = await client
      .post('/users')
      .header('Authorization', `Bearer ${token}`)
      .json({ email: 'x@x.com', password: 'senha1234', role: 'USER' })

    res.assertStatus(403)
  })

  test('POST /users com email duplicado retorna 422', async ({ client }) => {
    const admin = await createUser('ADMIN')
    const token = await loginAs(client, admin)
    await createUser('USER', { email: 'duplicado@users.test' })

    const res = await client
      .post('/users')
      .header('Authorization', `Bearer ${token}`)
      .json({ email: 'duplicado@users.test', password: 'senha1234', role: 'USER' })

    res.assertStatus(422)
  })

  test('DELETE /users/:id com MANAGER remove usuário (204)', async ({ client }) => {
    const manager = await createUser('MANAGER')
    const token = await loginAs(client, manager)
    const target = await createUser('USER')

    const res = await client
      .delete(`/users/${target.id}`)
      .header('Authorization', `Bearer ${token}`)

    res.assertStatus(204)
  })
})
