import type { HttpContext } from '@adonisjs/core/http'
import Transaction from '#models/transaction'
import PaymentService from '#services/payment_service'

export default class TransactionsController {
  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = Math.min(request.input('perPage', 20), 100)
    const transactions = await Transaction.query()
      .preload('client')
      .preload('gateway')
      .preload('products')
      .orderBy('created_at', 'desc')
      .paginate(page, perPage)

    return response.ok(transactions)
  }

  async show({ params, response }: HttpContext) {
    const transaction = await Transaction.query()
      .where('id', params.id)
      .preload('client')
      .preload('gateway')
      .preload('products')
      .firstOrFail()

    return response.ok(transaction)
  }

  /** Realiza o reembolso da compra junto ao gateway original */
  async refund({ params, response }: HttpContext) {
    const transaction = await Transaction.findOrFail(params.id)

    if (transaction.status === 'refunded') {
      return response.badRequest({ message: 'Esta transação já foi reembolsada.' })
    }

    if (transaction.status !== 'paid') {
      return response.badRequest({
        message: `Não é possível reembolsar uma transação com status "${transaction.status}".`,
      })
    }

    const paymentService = new PaymentService()
    await paymentService.refund(transaction)

    return response.ok({ message: 'Reembolso realizado com sucesso.', transaction })
  }
}
