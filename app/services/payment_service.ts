import logger from '@adonisjs/core/services/logger'
import Gateway from '#models/gateway'
import Transaction from '#models/transaction'
import Gateway1Adapter from './gateways/gateway1_adapter.js'
import Gateway2Adapter from './gateways/gateway2_adapter.js'
import type { PaymentGateway } from './gateways/gateway_interface.js'
import type { ChargeDTO, ChargeResult } from './gateways/types.js'

/** Mapeamento nome do gateway (DB) → adapter. Fallback: tenta gateways ativos por prioridade; lança se todos falharem. */
const ADAPTERS: Record<string, new () => PaymentGateway> = {
  'Gateway 1': Gateway1Adapter,
  'Gateway 2': Gateway2Adapter,
}

export default class PaymentService {
  async charge(data: ChargeDTO): Promise<ChargeResult> {
    const gateways = await Gateway.query().where('is_active', true).orderBy('priority', 'asc')

    if (gateways.length === 0) {
      throw new Error('Nenhum gateway de pagamento ativo encontrado.')
    }

    for (const gateway of gateways) {
      const AdapterClass = ADAPTERS[gateway.name]

      if (!AdapterClass) {
        logger.warn(
          `PaymentService: adapter não encontrado para gateway "${gateway.name}" – pulando.`
        )
        continue
      }

      try {
        logger.info(
          `PaymentService: tentando gateway "${gateway.name}" (prioridade ${gateway.priority})`
        )
        const result = await new AdapterClass().charge(data)

        logger.info(
          `PaymentService: cobrança aprovada pelo gateway "${gateway.name}" (id externo: ${result.externalId})`
        )

        return { ...result, gatewayId: gateway.id, gatewayName: gateway.name }
      } catch (error) {
        logger.error(
          `PaymentService: gateway "${gateway.name}" falhou – ${error instanceof Error ? error.message : String(error)}. Tentando próximo...`
        )
      }
    }

    throw new Error('Todos os gateways de pagamento falharam. Tente novamente mais tarde.')
  }

  async refund(transaction: Transaction): Promise<void> {
    if (!transaction.externalId) {
      throw new Error('Transação sem ID externo — não é possível fazer reembolso.')
    }

    await transaction.load('gateway')
    const gatewayName = transaction.gateway.name
    const AdapterClass = ADAPTERS[gatewayName]

    if (!AdapterClass) {
      throw new Error(`Adapter não encontrado para o gateway "${gatewayName}".`)
    }

    await new AdapterClass().refund(transaction.externalId)

    transaction.status = 'refunded'
    await transaction.save()
  }
}
