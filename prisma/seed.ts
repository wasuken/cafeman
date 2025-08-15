import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

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
      password: await hash('password123', 12),
    },
  })

  // 🆕 テストユーザー2を作成
  const testUser2 = await prisma.user.upsert({
    where: { email: 'test2@example.com' },
    update: {},
    create: {
      name: 'Test User 2',
      email: 'test2@example.com',
      password: await hash('password123', 12),
    },
  })

  // 🆕 デフォルトユーザーのプロフィールを作成
  await prisma.userProfile.upsert({
    where: { userId: defaultUser.id },
    update: {},
    create: {
      userId: defaultUser.id,
      bio: 'コーヒーラバー☕ 毎日のコーヒーライフを記録中！',
      location: '東京',
      isPublic: true,
    },
  })

  // 🆕 テストユーザー2のプロフィールを作成
  await prisma.userProfile.upsert({
    where: { userId: testUser2.id },
    update: {},
    create: {
      userId: testUser2.id,
      bio: 'カフェ巡りが趣味です🏪',
      location: '大阪',
      isPublic: true,
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
      minInterval: 240,
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

    const cups = Math.floor(Math.random() * 5) + 1

    for (let j = 0; j < cups; j++) {
      const hour = 8 + j * 3 + Math.floor(Math.random() * 2)
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

  for (const record of sampleRecords) {
    await prisma.coffeeRecord.create({
      data: record,
    })
  }

  // 🆕 サンプル投稿を作成
  const samplePosts = [
    {
      userId: defaultUser.id,
      content:
        '今日は新しいカフェでエスプレッソを飲みました！香りが素晴らしかった☕️ #コーヒー #エスプレッソ',
      hashtags: ['コーヒー', 'エスプレッソ'],
    },
    {
      userId: defaultUser.id,
      content: '朝のルーティン：ドリップコーヒーでスタート。今日も一日頑張ろう！',
      hashtags: ['朝コーヒー', 'ルーティン'],
    },
    {
      userId: testUser2.id,
      content: '大阪の素敵なカフェを発見！内装がおしゃれでコーヒーも美味しい😊',
      hashtags: ['大阪', 'カフェ巡り'],
    },
  ]

  for (const post of samplePosts) {
    await prisma.post.create({
      data: post,
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
  console.log(`👤 Created users: ${defaultUser.name}, ${testUser2.name}`)
  console.log(`☕ Created ${coffeeTypes.length} coffee types`)
  console.log(`📊 Created ${sampleRecords.length} sample records`)
  console.log(`📝 Created ${samplePosts.length} sample posts`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
