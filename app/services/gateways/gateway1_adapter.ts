import env from '#start/env'
import { postJson } from './http.js'
import type { PaymentGateway } from './gateway_interface.js'
import type { ChargeDTO, GatewayChargeResult } from './types.js'

/** Gateway 1: login para Bearer token, depois POST /transactions. Reembolso: POST /transactions/:id/charge_back */
export default class Gateway1Adapter implements PaymentGateway {
  private readonly baseUrl: string

  constructor() {
    this.baseUrl = env.get('GATEWAY1_URL') ?? 'http://gateways-mock:3001'
  }

  private async getToken(): Promise<string> {
    const { token } = await postJson<{ token: string }>(`${this.baseUrl}/login`, {
      email: env.get('GATEWAY1_EMAIL'),
      token: env.get('GATEWAY1_TOKEN'),
    })
    return token
  }

  async charge(data: ChargeDTO): Promise<GatewayChargeResult> {
    const token = await this.getToken()

    const txData = await postJson<{ id: string }>(
      `${this.baseUrl}/transactions`,
      {
        amount: data.amount,
        name: data.name,
        email: data.email,
        cardNumber: data.cardNumber,
        cvv: data.cvv,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    )

    return { externalId: String(txData.id), status: 'paid' }
  }

  async refund(externalId: string): Promise<void> {
    const token = await this.getToken()

    await postJson<unknown>(
      `${this.baseUrl}/transactions/${externalId}/charge_back`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    )
  }
}
