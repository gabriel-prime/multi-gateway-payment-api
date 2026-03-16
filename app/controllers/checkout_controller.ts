import type { HttpContext } from '@adonisjs/core/http'
import Client from '#models/client'
import Product from '#models/product'
import Transaction from '#models/transaction'
import PaymentService from '#services/payment_service'
import { checkoutValidator } from '#validators/checkout'

export default class CheckoutController {
  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(checkoutValidator)

    // 1. Upsert do cliente (cria se não existir, atualiza o nome se já existir)
    const client = await Client.updateOrCreate(
      { email: payload.email },
      { name: payload.name, email: payload.email }
    )

    // 2. Busca os produtos (existência já validada pelo checkoutValidator) e calcula o total
    const productIds = payload.products.map((p) => p.id)
    const products = await Product.findMany(productIds)

    let totalAmount = 0
    for (const item of payload.products) {
      const product = products.find((p) => p.id === item.id)!
      totalAmount += product.amount * item.quantity
    }

    // 3. Tenta a cobrança com fallback automático entre gateways
    const paymentService = new PaymentService()
    let chargeResult

    try {
      chargeResult = await paymentService.charge({
        amount: totalAmount,
        name: client.name,
        email: client.email,
        cardNumber: payload.cardNumber,
        cvv: payload.cvv,
      })
    } catch {
      return response.serviceUnavailable({
        message: 'Todos os gateways de pagamento falharam. Tente novamente mais tarde.',
      })
    }

    // 4. Persiste a transação
    const transaction = await Transaction.create({
      clientId: client.id,
      gatewayId: chargeResult.gatewayId,
      externalId: chargeResult.externalId,
      status: chargeResult.status,
      amount: totalAmount,
      cardLastNumbers: payload.cardNumber.slice(-4),
    })

    // 5. Vincula produtos na tabela pivot com a quantidade
    const pivotData = payload.products.reduce(
      (acc, item) => {
        acc[item.id] = { quantity: item.quantity }
        return acc
      },
      {} as Record<number, { quantity: number }>
    )
    await transaction.related('products').attach(pivotData)

    // 6. Carrega as relações para resposta completa
    await transaction.load('client')
    await transaction.load('gateway')
    await transaction.load('products')

    return response.created({
      transaction: transaction.serialize(),
    })
  }
}
