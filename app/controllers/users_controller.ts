import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { createUserValidator, getUpdateUserValidator } from '#validators/user'

export default class UsersController {
  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = Math.min(request.input('perPage', 20), 100)
    const users = await User.query().orderBy('full_name', 'asc').paginate(page, perPage)
    return response.ok(users)
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createUserValidator)
    const user = await User.create(payload)
    return response.created(user)
  }

  async show({ params, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    return response.ok(user)
  }

  async update({ params, request, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    const updateValidator = getUpdateUserValidator(user.id)
    const payload = await request.validateUsing(updateValidator)
    user.merge(payload)
    await user.save()
    return response.ok(user)
  }

  async destroy({ params, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    await user.delete()
    return response.noContent()
  }
}
