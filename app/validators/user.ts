import vine from '@vinejs/vine'

const ROLES = ['ADMIN', 'MANAGER', 'FINANCE', 'USER'] as const

const email = () => vine.string().email().maxLength(254)
const password = () => vine.string().minLength(8).maxLength(32)

export const createUserValidator = vine.create({
  fullName: vine.string().optional(),
  email: email().unique({ table: 'users', column: 'email' }),
  password: password(),
  role: vine.enum(ROLES),
})

export function getUpdateUserValidator(excludeId: number) {
  return vine.create({
    fullName: vine.string().optional(),
    email: vine
      .string()
      .email()
      .maxLength(254)
      .unique({
        table: 'users',
        column: 'email',
        filter: (query: any) => {
          query.whereNot('id', excludeId)
        },
      })
      .optional(),
    password: password().optional(),
    role: vine.enum(ROLES).optional(),
  })
}

export const signupValidator = vine.create({
  fullName: vine.string().nullable(),
  email: email().unique({ table: 'users', column: 'email' }),
  password: password(),
  passwordConfirmation: password().sameAs('password'),
})

export const loginValidator = vine.create({
  email: email(),
  password: vine.string(),
})
