import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Role middleware checks if the authenticated user's role is allowed.
 * ADMIN always has access. Otherwise the user.role must be in options.guards.
 */
export default class RoleMiddleware {
  async handle(ctx: HttpContext, next: NextFn, options: { guards: string[] } = { guards: [] }) {
    const user = ctx.auth.user
    if (!user) {
      return ctx.response.unauthorized({ message: 'Não autenticado' })
    }

    const role = (user as { role?: string }).role
    const allowedRoles = options.guards ?? []

    const hasAccess =
      role === 'ADMIN' || (role && allowedRoles.length > 0 && allowedRoles.includes(role))

    if (!hasAccess) {
      return ctx.response.forbidden({ message: 'Acesso negado: permissão insuficiente' })
    }

    return next()
  }
}
