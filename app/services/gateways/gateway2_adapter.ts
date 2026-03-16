import env from '#start/env'
import { postJson } from './http.js'
import type { PaymentGateway } from './gateway_interface.js'
import type { ChargeDTO, GatewayChargeResult } from './types.js'

/** Gateway 2: headers fixos (Gateway-Auth-Token, Gateway-Auth-Secret). Reembolso: POST /transacoes/reembolso { id } */
export default class Gateway2Adapter implements PaymentGateway {
  private readonly baseUrl: string
  private readonly authHeaders: Record<string, string>

  constructor() {
    this.baseUrl = env.get('GATEWAY2_URL') ?? 'http://gateways-mock:3002'
    this.authHeaders = {
      'Gateway-Auth-Token': env.get('GATEWAY2_AUTH_TOKEN') ?? '',
      'Gateway-Auth-Secret': env.get('GATEWAY2_AUTH_SECRET') ?? '',
    }
  }

  async charge(data: ChargeDTO): Promise<GatewayChargeResult> {
    const txData = await postJson<{ id: string }>(
      `${this.baseUrl}/transacoes`,
      {
        valor: data.amount,
        nome: data.name,
        email: data.email,
        numeroCartao: data.cardNumber,
        cvv: data.cvv,
      },
      { headers: this.authHeaders }
    )

    return { externalId: String(txData.id), status: 'paid' }
  }

  async refund(externalId: string): Promise<void> {
    await postJson<unknown>(
      `${this.baseUrl}/transacoes/reembolso`,
      { id: externalId },
      { headers: this.authHeaders }
    )
  }
}
