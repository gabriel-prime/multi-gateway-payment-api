export interface ChargeDTO {
  /** Total em centavos (ex: R$ 10,00 = 1000) */
  amount: number
  name: string
  email: string
  cardNumber: string
  cvv: string
}

export interface GatewayChargeResult {
  externalId: string
  status: 'paid' | 'failed' | 'pending'
}

export interface ChargeResult extends GatewayChargeResult {
  gatewayId: number
  gatewayName: string
}
