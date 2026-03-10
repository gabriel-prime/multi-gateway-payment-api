import { BaseSeeder } from '@adonisjs/lucid/seeders'
import hash from '@adonisjs/core/services/hash'
import User from '#models/user'

export default class extends BaseSeeder {
  async run() {
    await User.updateOrCreate(
      { email: 'admin@betalent.tech' },
      {
        email: 'admin@betalent.tech',
        password: await hash.make('password123'),
        role: 'ADMIN',
        fullName: 'Admin BeTalent',
      }
    )
  }
}
