import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Gateway from '#models/gateway'

export default class extends BaseSeeder {
  async run() {
    await Gateway.updateOrCreate(
      { name: 'Gateway 1' },
      { name: 'Gateway 1', priority: 1, isActive: true }
    )
    await Gateway.updateOrCreate(
      { name: 'Gateway 2' },
      { name: 'Gateway 2', priority: 2, isActive: true }
    )
  }
}
