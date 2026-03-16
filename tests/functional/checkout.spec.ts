import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import {
  mockBothGatewaysSuccess,
  mockGateway1FailsGateway2Succeeds,
  mockAllGatewaysFail,
  restoreGatewayFetch,
} from '#tests/helpers/mock_gateway'
import { createGateways, createProduct } from '#tests/helpers/factories'

test.group('Checkout – POST /checkout', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.teardown(() => restoreGatewayFetch())

  test('realiza compra com sucesso via Gateway 1', async ({ client }) => {
    await createGateways()
    const product = await createProduct({ amount: 5000 })
    mockBothGatewaysSuccess()

    const res = await client.post('/checkout').json({
      name: 'João Silva',
      email: 'joao@test.com',
      products: [{ id: product.id, quantity: 2 }],
      cardNumber: '5569000000006063',
      cvv: '010',
    })

    res.assertStatus(201)
    res.assertBodyContains({
      transaction: {
        status: 'paid',
        amount: 10000,
        cardLastNumbers: '6063',
        externalId: 'mock-external-id-001',
      },
    })
  })

  test('usa fallback para Gateway 2 quando Gateway 1 falha', async ({ client }) => {
    await createGateways()
    const product = await createProduct({ amount: 3000 })
    mockGateway1FailsGateway2Succeeds()

    const res = await client.post('/checkout').json({
      name: 'Maria Souza',
      email: 'maria@test.com',
      products: [{ id: product.id, quantity: 1 }],
      cardNumber: '5569000000006063',
      cvv: '010',
    })

    res.assertStatus(201)
    res.assertBodyContains({
      transaction: {
        status: 'paid',
        externalId: 'gw2-fallback-id-002',
      },
    })
  })

  test('retorna 503 quando todos os gateways falham', async ({ client }) => {
    await createGateways()
    const product = await createProduct()
    mockAllGatewaysFail()

    const res = await client.post('/checkout').json({
      name: 'Carlos Lima',
      email: 'carlos@test.com',
      products: [{ id: product.id, quantity: 1 }],
      cardNumber: '5569000000006063',
      cvv: '010',
    })

    res.assertStatus(503)
  })

  test('retorna 422 quando produto não existe', async ({ client }) => {
    await createGateways()

    const res = await client.post('/checkout').json({
      name: 'Teste User',
      email: 'teste@test.com',
      products: [{ id: 99999, quantity: 1 }],
      cardNumber: '5569000000006063',
      cvv: '010',
    })

    res.assertStatus(422)
  })

  test('retorna 422 com body inválido (sem produtos)', async ({ client }) => {
    const res = await client.post('/checkout').json({
      name: 'Teste',
      email: 'teste@test.com',
      products: [],
      cardNumber: '5569000000006063',
      cvv: '010',
    })

    res.assertStatus(422)
  })

  test('cria client automaticamente se não existir', async ({ client }) => {
    await createGateways()
    const product = await createProduct()
    mockBothGatewaysSuccess()

    const res = await client.post('/checkout').json({
      name: 'Novo Cliente',
      email: 'novocliente@test.com',
      products: [{ id: product.id, quantity: 1 }],
      cardNumber: '5569000000006063',
      cvv: '010',
    })

    res.assertStatus(201)
    res.assertBodyContains({
      transaction: { client: { email: 'novocliente@test.com' } },
    })
  })

  test('calcula o total corretamente com múltiplos produtos e quantidades', async ({ client }) => {
    await createGateways()
    const p1 = await createProduct({ amount: 2000 })
    const p2 = await createProduct({ amount: 3000 })
    mockBothGatewaysSuccess()

    // total = 2000*2 + 3000*3 = 4000 + 9000 = 13000
    const res = await client.post('/checkout').json({
      name: 'Multi Produto',
      email: 'multi@test.com',
      products: [
        { id: p1.id, quantity: 2 },
        { id: p2.id, quantity: 3 },
      ],
      cardNumber: '5569000000006063',
      cvv: '010',
    })

    res.assertStatus(201)
    res.assertBodyContains({ transaction: { amount: 13000 } })
  })
})
