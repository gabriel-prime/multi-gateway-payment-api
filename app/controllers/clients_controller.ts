import type { HttpContext } from '@adonisjs/core/http'
import Client from '#models/client'

export default class ClientsController {
  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = Math.min(request.input('perPage', 20), 100)
    const clients = await Client.query().orderBy('name', 'asc').paginate(page, perPage)
    return response.ok(clients)
  }

  /** Retorna os dados do cliente com todas as suas compras */
  async show({ params, response }: HttpContext) {
    const client = await Client.query()
      .where('id', params.id)
      .preload('transactions', (q) => {
        q.preload('gateway').preload('products').orderBy('created_at', 'desc')
      })
      .firstOrFail()

    return response.ok(client)
  }
}
