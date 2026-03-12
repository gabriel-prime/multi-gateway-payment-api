import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'

export default class extends BaseSeeder {
  async run() {
    const existing = await User.findBy('email', 'admin@betalent.tech')

    if (existing) {
      // merge + save garante que o @beforeSave seja disparado
      existing.merge({
        password: 'password123',
        role: 'ADMIN',
        fullName: 'Admin BeTalent',
      })
      await existing.save()
    } else {
      await User.create({
        email: 'admin@betalent.tech',
        password: 'password123',
        role: 'ADMIN',
        fullName: 'Admin BeTalent',
      })
    }
  }
}
