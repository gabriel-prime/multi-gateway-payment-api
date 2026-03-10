import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export class UserSchema extends BaseModel {
  static table = 'users'
  static $columns = ['id', 'fullName', 'email', 'password', 'role', 'createdAt', 'updatedAt'] as const
  $columns = UserSchema.$columns
  @column({ isPrimary: true })
  declare id: number
  @column()
  declare fullName: string | null
  @column()
  declare email: string
  @column({ serializeAs: null })
  declare password: string
  @column({ defaultValue: 'USER' })
  declare role: string
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}

export class GatewaySchema extends BaseModel {
  static table = 'gateways'
  @column({ isPrimary: true })
  declare id: number
  @column()
  declare name: string
  @column()
  declare isActive: boolean
  @column()
  declare priority: number
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}

export class ClientSchema extends BaseModel {
  static table = 'clients'
  @column({ isPrimary: true })
  declare id: number
  @column()
  declare name: string
  @column()
  declare email: string
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}

export class ProductSchema extends BaseModel {
  static table = 'products'
  @column({ isPrimary: true })
  declare id: number
  @column()
  declare name: string
  @column()
  declare amount: number
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}

export class TransactionSchema extends BaseModel {
  static table = 'transactions'
  @column({ isPrimary: true })
  declare id: number
  @column()
  declare clientId: number
  @column()
  declare gatewayId: number
  @column()
  declare externalId: string | null
  @column()
  declare status: string
  @column()
  declare amount: number
  @column()
  declare cardLastNumbers: string
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
