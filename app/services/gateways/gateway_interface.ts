import type { ChargeDTO, GatewayChargeResult } from './types.js'

export interface PaymentGateway {
  charge(data: ChargeDTO): Promise<GatewayChargeResult>
  refund(externalId: string): Promise<void>
}
