import type { HttpContext } from '@adonisjs/core/http'
import Gateway from '#models/gateway'

export default class GatewaysController {
  async index({ response }: HttpContext) {
    const gateways = await Gateway.query().orderBy('priority', 'asc')
    return response.ok(gateways)
  }

  /** Ativa ou desativa um gateway */
  async toggle({ params, response }: HttpContext) {
    const gateway = await Gateway.findOrFail(params.id)
    gateway.isActive = !gateway.isActive
    await gateway.save()
    return response.ok(gateway)
  }

  /** Atualiza a prioridade de um gateway */
  async updatePriority({ params, request, response }: HttpContext) {
    const gateway = await Gateway.findOrFail(params.id)
    const { priority } = request.only(['priority'])

    if (typeof priority !== 'number' || priority < 1) {
      return response.unprocessableEntity({ message: 'priority deve ser um número inteiro >= 1' })
    }

    gateway.priority = priority
    await gateway.save()
    return response.ok(gateway)
  }
}
