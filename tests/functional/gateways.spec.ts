import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { createUser, createGateways, loginAs } from '#tests/helpers/factories'

test.group('Gateways – gerenciamento', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  test('GET /gateways retorna lista ordenada por prioridade para ADMIN', async ({ client }) => {
    const admin = await createUser('ADMIN')
    const token = await loginAs(client, admin)
    await createGateways()

    const res = await client.get('/gateways').header('Authorization', `Bearer ${token}`)

    res.assertStatus(200)
    const [first, second] = res.body() as any[]
    first.priority < second.priority
  })

  test('GET /gateways retorna 403 para MANAGER', async ({ client }) => {
    const manager = await createUser('MANAGER')
    const token = await loginAs(client, manager)

    const res = await client.get('/gateways').header('Authorization', `Bearer ${token}`)

    res.assertStatus(403)
  })

  test('PATCH /gateways/:id/toggle inverte o estado isActive', async ({ client }) => {
    const admin = await createUser('ADMIN')
    const token = await loginAs(client, admin)
    await createGateways()

    // Lista para pegar o id do Gateway 1
    const list = await client.get('/gateways').header('Authorization', `Bearer ${token}`)
    const gw1 = (list.body() as any[]).find((g: any) => g.name === 'Gateway 1')

    // Toggle desativa
    const res = await client
      .patch(`/gateways/${gw1.id}/toggle`)
      .header('Authorization', `Bearer ${token}`)

    res.assertStatus(200)
    res.assertBodyContains({ isActive: false })

    // Toggle novamente reativa
    const res2 = await client
      .patch(`/gateways/${gw1.id}/toggle`)
      .header('Authorization', `Bearer ${token}`)

    res2.assertBodyContains({ isActive: true })
  })

  test('PATCH /gateways/:id/priority atualiza a prioridade', async ({ client }) => {
    const admin = await createUser('ADMIN')
    const token = await loginAs(client, admin)
    await createGateways()

    const list = await client.get('/gateways').header('Authorization', `Bearer ${token}`)
    const gw2 = (list.body() as any[]).find((g: any) => g.name === 'Gateway 2')

    const res = await client
      .patch(`/gateways/${gw2.id}/priority`)
      .header('Authorization', `Bearer ${token}`)
      .json({ priority: 1 })

    res.assertStatus(200)
    res.assertBodyContains({ priority: 1 })
  })

  test('PATCH /gateways/:id/toggle retorna 403 para FINANCE', async ({ client }) => {
    const finance = await createUser('FINANCE')
    const token = await loginAs(client, finance)
    await createGateways()

    const res = await client
      .patch('/gateways/1/toggle')
      .header('Authorization', `Bearer ${token}`)

    res.assertStatus(403)
  })
})
