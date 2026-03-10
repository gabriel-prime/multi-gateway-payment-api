import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'

export default class extends BaseSeeder {
  async run() {
    await User.updateOrCreate(
      { email: 'admin@betalent.tech' },
      {
        email: 'admin@betalent.tech',
        password: 'password123',
        role: 'ADMIN',
        fullName: 'Admin BeTalent',
      }
    )
  }
}
