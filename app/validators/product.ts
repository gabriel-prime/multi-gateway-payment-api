import vine from '@vinejs/vine'

export const createProductValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1),
    amount: vine.number().min(1),
  })
)

export const updateProductValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).optional(),
    amount: vine.number().min(1).optional(),
  })
)
