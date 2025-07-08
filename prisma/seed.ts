import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // デフォルトユーザー作成
  const defaultUser = await prisma.user.upsert({
    where: { id: 'default-user' },
    update: {},
    create: {
      id: 'default-user',
      name: 'Default User',
      email: 'user@example.com',
    },
  })

  // コーヒータイプのマスタデータ
  const coffeeTypes = [
    { name: 'ドリップコーヒー', caffeine: 95, description: '一般的なドリップコーヒー' },
    { name: 'エスプレッソ', caffeine: 64, description: '濃縮されたコーヒー' },
    { name: 'アメリカーノ', caffeine: 77, description: 'エスプレッソ+お湯' },
    { name: 'カフェラテ', caffeine: 77, description: 'エスプレッソ+ミルク' },
    { name: 'カプチーノ', caffeine: 77, description: 'エスプレッソ+フォームミルク' },
    { name: 'インスタントコーヒー', caffeine: 62, description: '手軽なインスタント' },
    { name: 'カフェオレ', caffeine: 50, description: 'コーヒー+ミルク' },
    { name: 'アイスコーヒー', caffeine: 95, description: '冷たいコーヒー' },
  ]

  for (const type of coffeeTypes) {
    await prisma.coffeeType.upsert({
      where: { name: type.name },
      update: type,
      create: type,
    })
  }

  // デフォルト設定
  await prisma.coffeeSettings.upsert({
    where: { userId: defaultUser.id },
    update: {},
    create: {
      userId: defaultUser.id,
      dailyLimit: 4,
      warningThreshold: 3,
      minInterval: 240, // 4時間
      cutoffTime: '18:00',
      enableNotifications: true,
      enableWarnings: true,
      defaultView: 'calendar',
      weekStartsOn: 0,
    },
  })

  // サンプルのコーヒー記録（過去30日分）
  const today = new Date()
  const sampleRecords = []

  for (let i = 0; i < 30; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    // ランダムで1-5杯
    const cups = Math.floor(Math.random() * 5) + 1

    for (let j = 0; j < cups; j++) {
      const hour = 8 + j * 3 + Math.floor(Math.random() * 2) // 8時〜20時の間
      const minute = Math.floor(Math.random() * 60)

      const timestamp = new Date(date)
      timestamp.setHours(hour, minute, 0, 0)

      sampleRecords.push({
        userId: defaultUser.id,
        date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        cups: 1,
        timestamp,
        coffeeType: coffeeTypes[Math.floor(Math.random() * coffeeTypes.length)].name,
        size: ['S', 'M', 'L'][Math.floor(Math.random() * 3)],
        location: ['自宅', 'オフィス', 'カフェ'][Math.floor(Math.random() * 3)],
      })
    }
  }

  // バッチ挿入
  for (const record of sampleRecords) {
    await prisma.coffeeRecord.create({
      data: record,
    })
  }

  // サンプル目標
  await prisma.coffeeGoal.create({
    data: {
      userId: defaultUser.id,
      type: 'reduce',
      targetCups: 3,
      startDate: new Date(),
      title: '1日3杯以下に抑える',
      description: '健康のために1日のコーヒー摂取量を3杯以下に抑える目標',
    },
  })

  console.log('✅ Seeding completed!')
  console.log(`👤 Created user: ${defaultUser.name}`)
  console.log(`☕ Created ${coffeeTypes.length} coffee types`)
  console.log(`📊 Created ${sampleRecords.length} sample records`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

// package.json に追加するスクリプト
/*
{
"prisma": {
"seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
},
"scripts": {
"db:seed": "prisma db seed"
}
}
 */

// 必要な依存関係
/*
npm install -D ts-node @types/node
 */
