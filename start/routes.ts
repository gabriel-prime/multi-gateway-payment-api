import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const AuthController = () => import('#controllers/auth_controller')
const UsersController = () => import('#controllers/users_controller')
const ProductsController = () => import('#controllers/products_controller')
const CheckoutController = () => import('#controllers/checkout_controller')
const GatewaysController = () => import('#controllers/gateways_controller')
const ClientsController = () => import('#controllers/clients_controller')
const TransactionsController = () => import('#controllers/transactions_controller')

router.post('/login', [AuthController, 'login'])
router.post('/checkout', [CheckoutController, 'store'])

router
  .group(() => {
    router.get('/me', (ctx) => ctx.response.ok(ctx.auth.user?.serialize()))

    router
      .group(() => {
        router.get('/', [GatewaysController, 'index'])
        router.patch('/:id/toggle', [GatewaysController, 'toggle'])
        router.patch('/:id/priority', [GatewaysController, 'updatePriority'])
      })
      .prefix('/gateways')
      .use(middleware.role({ guards: ['ADMIN'] }))

    router
      .resource('users', UsersController)
      .apiOnly()
      .use('*', middleware.role({ guards: ['ADMIN', 'MANAGER'] }))

    router
      .resource('products', ProductsController)
      .apiOnly()
      .use(
        ['store', 'update', 'destroy'],
        middleware.role({ guards: ['ADMIN', 'MANAGER', 'FINANCE'] })
      )

    router.get('/clients', [ClientsController, 'index'])
    router.get('/clients/:id', [ClientsController, 'show'])

    router.get('/transactions', [TransactionsController, 'index'])
    router.get('/transactions/:id', [TransactionsController, 'show'])
    router
      .post('/transactions/:id/refund', [TransactionsController, 'refund'])
      .use(middleware.role({ guards: ['ADMIN', 'FINANCE'] }))
  })
  .use(middleware.auth())
