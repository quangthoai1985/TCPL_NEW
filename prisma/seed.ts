
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // Seed Province
    const province = await prisma.unit.upsert({
        where: { id: 'tinh_angiang' },
        update: {},
        create: {
            id: 'tinh_angiang',
            name: 'Tỉnh An Giang',
            type: 'province',
        },
    })
    console.log({ province })

    // Seed District
    const district = await prisma.unit.upsert({
        where: { id: 'huyen_chaudoc' },
        update: {},
        create: {
            id: 'huyen_chaudoc',
            name: 'Thành phố Châu Đốc',
            type: 'district',
            parentId: 'tinh_angiang',
        },
    })
    console.log({ district })

    // Seed Communes
    const communes = ['Xã Vĩnh Tế', 'Phường Châu Phú A', 'Phường Vĩnh Mỹ']
    for (let i = 0; i < communes.length; i++) {
        const commune = await prisma.unit.upsert({
            where: { id: `xa_${i + 1}` },
            update: {},
            create: {
                id: `xa_${i + 1}`,
                name: communes[i],
                type: 'commune',
                parentId: 'huyen_chaudoc',
            },
        })
        console.log({ commune })
    }

    // Seed Assessment Period
    const period = await prisma.assessmentPeriod.upsert({
        where: { id: 'period_2024' },
        update: {},
        create: {
            id: 'period_2024',
            name: 'Đợt đánh giá năm 2024',
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-12-31'),
            isActive: true,
            registrationDeadline: new Date('2024-03-31'),
        },
    })
    console.log({ period })

    // Seed Admin User
    const admin = await prisma.user.upsert({
        where: { username: 'admin_angiang' },
        update: {},
        create: {
            username: 'admin_angiang',
            password: 'password123', // In real app, this should be hashed
            displayName: 'Quản trị viên An Giang',
            role: 'admin',
        },
    })
    console.log({ admin })

    // Seed Commune Staff
    const staff = await prisma.user.upsert({
        where: { username: 'canbo_vinh_te' },
        update: {},
        create: {
            username: 'canbo_vinh_te',
            password: 'password123',
            displayName: 'Cán bộ Xã Vĩnh Tế',
            role: 'commune_staff',
            communeId: 'xa_1',
        },
    })
    console.log({ staff })
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
