/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'
const AuthController = () => import('#controllers/auth_controller')
const UsersController = () => import('#controllers/users_controller')
const ProductsController = () => import('#controllers/products_controller')

router.get('/', () => {
  return { hello: 'world' }
})

// Login (BeTalent – Dia 2)
router.post('/login', [AuthController, 'login'])

// Rotas protegidas por autenticação
router
  .group(() => {
    router.get('/me', (ctx) => ctx.response.ok(ctx.auth.user?.serialize()))
    router
      .get('/admin-only', (ctx) => ctx.response.ok({ message: 'Acesso admin autorizado' }))
      .use(middleware.role({ guards: ['ADMIN'] }))
  })
  .use(middleware.auth())

// CRUD Usuários – apenas ADMIN e MANAGER
router
  .resource('users', UsersController)
  .apiOnly()
  .use('*', middleware.auth())
  .use('*', middleware.role({ guards: ['ADMIN', 'MANAGER'] }))

// CRUD Produtos – listar/ver para todos autenticados; criar/editar/remover para ADMIN, MANAGER, FINANCE
router
  .resource('products', ProductsController)
  .apiOnly()
  .use('*', middleware.auth())
  .use(['store', 'update', 'destroy'], middleware.role({ guards: ['ADMIN', 'MANAGER', 'FINANCE'] }))

router
  .group(() => {
    router
      .group(() => {
        router.post('signup', [controllers.NewAccount, 'store'])
        router.post('login', [controllers.AccessToken, 'store'])
        router.post('logout', [controllers.AccessToken, 'destroy']).use(middleware.auth())
      })
      .prefix('auth')
      .as('auth')

    router
      .group(() => {
        router.get('/profile', [controllers.Profile, 'show'])
      })
      .prefix('account')
      .as('profile')
      .use(middleware.auth())
  })
  .prefix('/api/v1')
