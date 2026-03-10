import { ProductSchema } from '#database/schema'
import { manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import Transaction from '#models/transaction'

export default class Product extends ProductSchema {
  @manyToMany(() => Transaction, {
    pivotTable: 'transaction_products',
  })
  declare transactions: ManyToMany<typeof Transaction>
}
