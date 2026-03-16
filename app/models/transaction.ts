import { TransactionSchema } from '#database/schema'
import { belongsTo, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import Client from '#models/client'
import Gateway from '#models/gateway'
import Product from '#models/product'

export default class Transaction extends TransactionSchema {
  @belongsTo(() => Client)
  declare client: BelongsTo<typeof Client>

  @belongsTo(() => Gateway)
  declare gateway: BelongsTo<typeof Gateway>

  @manyToMany(() => Product, {
    pivotTable: 'transaction_products',
    pivotColumns: ['quantity'],
  })
  declare products: ManyToMany<typeof Product>
}
