import User from '#models/user'
import Gateway from '#models/gateway'
import Product from '#models/product'

type Role = 'ADMIN' | 'MANAGER' | 'FINANCE' | 'USER'

let counter = 0
const uid = () => ++counter

export async function createUser(role: Role = 'USER', overrides: Partial<{ email: string; fullName: string }> = {}) {
  return User.create({
    email: overrides.email ?? `${role.toLowerCase()}_${uid()}@test.com`,
    password: 'password123',
    role,
    fullName: overrides.fullName ?? `${role} Test User`,
  })
}

export async function createGateways() {
  await Gateway.createMany([
    { name: 'Gateway 1', isActive: true, priority: 1 },
    { name: 'Gateway 2', isActive: true, priority: 2 },
  ])
}

export async function createProduct(overrides: Partial<{ name: string; amount: number }> = {}) {
  return Product.create({
    name: overrides.name ?? `Product ${uid()}`,
    amount: overrides.amount ?? 1000,
  })
}

export async function loginAs(client: any, user: User): Promise<string> {
  const res = await client.post('/login').json({ email: user.email, password: 'password123' })
  return res.body().token.token as string
}
