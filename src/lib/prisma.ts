import { PrismaClient } from '@prisma/client'

// グローバル型定義でPrismaClientを追加
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Prismaクライアントのインスタンスを作成
// 開発環境では接続を再利用してホットリロード時の警告を防ぐ
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query', 'error', 'warn'], // 開発時にクエリログを表示
  })

// 開発環境でのみグローバルに保存
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// 型安全なPrismaクライアントの型をエクスポート
export type PrismaClientType = typeof prisma

// 便利なヘルパー関数をエクスポート
export async function connectDatabase() {
  try {
    await prisma.$connect()
    console.log('✅ Database connected successfully')
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    throw error
  }
}

export async function disconnectDatabase() {
  try {
    await prisma.$disconnect()
    console.log('✅ Database disconnected successfully')
  } catch (error) {
    console.error('❌ Database disconnection failed:', error)
    throw error
  }
}

// ヘルスチェック用関数
export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'healthy', timestamp: new Date().toISOString() }
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// デフォルトエクスポート（後方互換性のため）
export default prisma
