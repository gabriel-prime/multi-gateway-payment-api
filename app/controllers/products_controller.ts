import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product'
import { createProductValidator, updateProductValidator } from '#validators/product'

export default class ProductsController {
  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = Math.min(request.input('perPage', 20), 100)
    const products = await Product.query().orderBy('name', 'asc').paginate(page, perPage)
    return response.ok(products)
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createProductValidator)
    const product = await Product.create(payload)
    return response.created(product)
  }

  async show({ params, response }: HttpContext) {
    const product = await Product.findOrFail(params.id)
    return response.ok(product)
  }

  async update({ params, request, response }: HttpContext) {
    const product = await Product.findOrFail(params.id)
    const payload = await request.validateUsing(updateProductValidator)
    product.merge(payload)
    await product.save()
    return response.ok(product)
  }

  async destroy({ params, response }: HttpContext) {
    const product = await Product.findOrFail(params.id)
    await product.delete()
    return response.noContent()
  }
}
