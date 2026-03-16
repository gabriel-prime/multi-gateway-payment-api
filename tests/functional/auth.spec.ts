import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { createUser } from '#tests/helpers/factories'

test.group('Auth – POST /login', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  test('retorna token ao fazer login com credenciais válidas', async ({ client }) => {
    await createUser('ADMIN', { email: 'admin@auth.test' })

    const res = await client
      .post('/login')
      .json({ email: 'admin@auth.test', password: 'password123' })

    res.assertStatus(200)
    res.assertBodyContains({ user: { email: 'admin@auth.test' } })
    res.assertBodyContains({ token: { type: 'bearer' } })
  })

  test('retorna 401 com senha incorreta', async ({ client }) => {
    await createUser('USER', { email: 'user@auth.test' })

    const res = await client
      .post('/login')
      .json({ email: 'user@auth.test', password: 'senha_errada' })

    res.assertStatus(401)
  })

  test('retorna 401 com email inexistente', async ({ client }) => {
    const res = await client
      .post('/login')
      .json({ email: 'naoexiste@auth.test', password: 'password123' })

    res.assertStatus(401)
  })

  test('retorna 401 ao acessar rota protegida sem token', async ({ client }) => {
    const res = await client.get('/transactions')
    res.assertStatus(401)
  })
})
