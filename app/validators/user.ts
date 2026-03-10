import vine from '@vinejs/vine'

const ROLES = ['ADMIN', 'MANAGER', 'FINANCE', 'USER'] as const

/**
 * Shared rules for email and password.
 */
const email = () => vine.string().email().maxLength(254)
const password = () => vine.string().minLength(8).maxLength(32)

/**
 * Validator to use when creating a user (admin/manager).
 */
export const createUserValidator = vine.create({
  fullName: vine.string().optional(),
  email: email().unique({ table: 'users', column: 'email' }),
  password: password(),
  role: vine.enum(ROLES),
})

/**
 * Validator to use when updating a user.
 * All fields optional; email must be unique excluding the given user id.
 */
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

/**
 * Validator to use when performing self-signup
 */
export const signupValidator = vine.create({
  fullName: vine.string().nullable(),
  email: email().unique({ table: 'users', column: 'email' }),
  password: password(),
  passwordConfirmation: password().sameAs('password'),
})

/**
 * Validator to use before validating user credentials during login
 */
export const loginValidator = vine.create({
  email: email(),
  password: vine.string(),
})
