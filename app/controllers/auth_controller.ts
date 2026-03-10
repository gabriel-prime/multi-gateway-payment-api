import type { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'
import User from '#models/user'

export default class AuthController {
  async login(ctx: HttpContext) {
    const { email, password } = ctx.request.only(['email', 'password'])

    const user = await User.findBy('email', email)
    if (!user) {
      return ctx.response.unauthorized({ message: 'Credenciais inválidas' })
    }

    const isValid = await hash.verify(user.password, password)
    if (!isValid) {
      return ctx.response.unauthorized({ message: 'Credenciais inválidas' })
    }

    const token = await User.accessTokens.create(user)

    return ctx.response.ok({
      user: user.serialize(),
      token: token.toJSON(),
    })
  }
}
