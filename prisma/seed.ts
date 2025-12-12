import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const email = 'admin@example.com'
    const password = await bcrypt.hash('admin123', 10)

    const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            password,
            role: 'ADMIN',
        },
    })

    // Also create a default template
    await prisma.template.create({
        data: {
            name: 'Default Template',
            content: '🔥 <b>{name}</b>\n\n💰 Fiyat: {price}\n🏷 İndirim: {discountRate}\n\n👉 <a href="{url}">Ürüne Git</a>',
            isActive: true
        }
    });

    // Also create default bot settings
    await prisma.botSettings.create({
        data: {
            botToken: '',
            channelUsername: '',
            isActive: true,
            cronSecret: 'secret123'
        }
    });

    console.log({ user })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
