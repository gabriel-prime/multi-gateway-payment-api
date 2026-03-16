import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Client from '#models/client'
import Gateway from '#models/gateway'
import Transaction from '#models/transaction'
import { createUser, createGateways, loginAs } from '#tests/helpers/factories'
import {
  mockBothGatewaysSuccess,
  restoreGatewayFetch,
} from '#tests/helpers/mock_gateway'

async function createPaidTransaction() {
  await createGateways()
  const gw = await Gateway.findByOrFail('name', 'Gateway 1')
  const client = await Client.create({ name: 'Cliente Teste', email: 'ct@test.com' })
  return Transaction.create({
    clientId: client.id,
    gatewayId: gw.id,
    externalId: 'ext-abc-123',
    status: 'paid',
    amount: 5000,
    cardLastNumbers: '6063',
  })
}

test.group('Transactions', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.teardown(() => restoreGatewayFetch())

  test('GET /transactions retorna lista paginada para qualquer autenticado', async ({ client }) => {
    const user = await createUser('USER')
    const token = await loginAs(client, user)
    await createPaidTransaction()

    const res = await client.get('/transactions').header('Authorization', `Bearer ${token}`)

    res.assertStatus(200)
    res.assertBodyContains({ meta: { total: 1 } })
  })

  test('GET /transactions/:id retorna detalhe com relações', async ({ client }) => {
    const user = await createUser('USER')
    const token = await loginAs(client, user)
    const tx = await createPaidTransaction()

    const res = await client
      .get(`/transactions/${tx.id}`)
      .header('Authorization', `Bearer ${token}`)

    res.assertStatus(200)
    res.assertBodyContains({
      id: tx.id,
      status: 'paid',
      client: { email: 'ct@test.com' },
      gateway: { name: 'Gateway 1' },
    })
  })

  test('POST /transactions/:id/refund com ADMIN realiza reembolso (200)', async ({ client }) => {
    const admin = await createUser('ADMIN')
    const token = await loginAs(client, admin)
    const tx = await createPaidTransaction()
    mockBothGatewaysSuccess()

    const res = await client
      .post(`/transactions/${tx.id}/refund`)
      .header('Authorization', `Bearer ${token}`)

    res.assertStatus(200)
    res.assertBodyContains({
      message: 'Reembolso realizado com sucesso.',
      transaction: { status: 'refunded' },
    })
  })

  test('POST /transactions/:id/refund com FINANCE realiza reembolso (200)', async ({ client }) => {
    const finance = await createUser('FINANCE')
    const token = await loginAs(client, finance)
    const tx = await createPaidTransaction()
    mockBothGatewaysSuccess()

    const res = await client
      .post(`/transactions/${tx.id}/refund`)
      .header('Authorization', `Bearer ${token}`)

    res.assertStatus(200)
  })

  test('POST /transactions/:id/refund com USER retorna 403', async ({ client }) => {
    const user = await createUser('USER')
    const token = await loginAs(client, user)
    const tx = await createPaidTransaction()

    const res = await client
      .post(`/transactions/${tx.id}/refund`)
      .header('Authorization', `Bearer ${token}`)

    res.assertStatus(403)
  })

  test('reembolso duplicado retorna 400', async ({ client }) => {
    const admin = await createUser('ADMIN')
    const token = await loginAs(client, admin)
    const tx = await createPaidTransaction()
    mockBothGatewaysSuccess()

    // Primeiro reembolso
    await client
      .post(`/transactions/${tx.id}/refund`)
      .header('Authorization', `Bearer ${token}`)

    // Segundo reembolso deve falhar
    const res = await client
      .post(`/transactions/${tx.id}/refund`)
      .header('Authorization', `Bearer ${token}`)

    res.assertStatus(400)
    res.assertBodyContains({ message: 'Esta transação já foi reembolsada.' })
  })
})
