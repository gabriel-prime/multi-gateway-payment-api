import { ClientSchema } from '#database/schema'
import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Transaction from '#models/transaction'

export default class Client extends ClientSchema {
  @hasMany(() => Transaction)
  declare transactions: HasMany<typeof Transaction>
}
