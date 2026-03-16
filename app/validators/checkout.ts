import vine from '@vinejs/vine'
import type { FieldContext } from '@vinejs/vine/types'
import db from '@adonisjs/lucid/services/db'

const productExistsRule = vine.createRule(
  async (value: unknown, _: undefined, field: FieldContext) => {
    if (typeof value !== 'number') return

    const row = await db.from('products').where('id', value).select('id').first()
    if (!row) {
      field.report('O produto com id {{ value }} não existe', 'productExists', field)
    }
  }
)

export const checkoutValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2),
    email: vine.string().email().normalizeEmail(),
    products: vine
      .array(
        vine.object({
          id: vine
            .number()
            .min(1)
            .withoutDecimals()
            .use(productExistsRule()),
          quantity: vine.number().min(1).withoutDecimals(),
        })
      )
      .minLength(1),
    cardNumber: vine.string().trim().minLength(13).maxLength(19),
    cvv: vine.string().trim().minLength(3).maxLength(4),
  })
)
