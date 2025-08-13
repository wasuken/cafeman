import { prisma } from './prisma'
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
} from 'date-fns'

const DEFAULT_USER_ID = 'default-user'

export class CoffeeService {
  // 今日のコーヒー記録を取得
  static async getTodayRecords(userId: string = DEFAULT_USER_ID) {
    const today = new Date()
    return await prisma.coffeeRecord.findMany({
      where: {
        userId,
        date: {
          gte: startOfDay(today),
          lte: endOfDay(today),
        },
      },
      include: {
        user: true,
      },
      orderBy: { timestamp: 'desc' }, // 表示順序は実際の記録時刻順
    })
  }

  // 今日の合計杯数
  static async getTodayTotal(userId: string = DEFAULT_USER_ID) {
    const today = new Date()
    const result = await prisma.coffeeRecord.aggregate({
      where: {
        userId,
        date: {
          gte: startOfDay(today),
          lte: endOfDay(today),
        },
      },
      _sum: { cups: true },
    })
    return result._sum.cups || 0
  }

  // 月次データ取得（カレンダー表示用）
  static async getMonthlyRecords(year: number, month: number, userId: string = DEFAULT_USER_ID) {
    const startDate = startOfMonth(new Date(year, month - 1))
    const endDate = endOfMonth(new Date(year, month - 1))

    return await prisma.coffeeRecord.groupBy({
      by: ['date'],
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: { cups: true },
      _count: { cups: true },
      orderBy: { date: 'asc' },
    })
  }

  // 週間統計 (dateフィールドベースで集計)
  static async getWeeklyStats(userId: string = DEFAULT_USER_ID) {
    const startDate = startOfWeek(new Date())
    const endDate = endOfWeek(new Date())

    const records = await prisma.coffeeRecord.findMany({
      where: {
        userId,
        date: {
          // dateフィールドで期間フィルタリング
          gte: startDate,
          lte: endDate,
        },
      },
    })

    const totalCups = records.reduce((sum, record) => sum + record.cups, 0)
    const avgPerDay = totalCups / 7

    // 日別の合計を計算（dateフィールドベース）
    const dailyTotals = records.reduce(
      (acc, record) => {
        const day = record.date.toISOString().split('T')[0]
        acc[day] = (acc[day] || 0) + record.cups
        return acc
      },
      {} as Record<string, number>
    )

    const maxInDay = Math.max(...Object.values(dailyTotals), 0)

    return {
      totalCups,
      avgPerDay: Math.round(avgPerDay * 10) / 10,
      maxInDay,
      activeDays: Object.keys(dailyTotals).length,
    }
  }

  // 時間別の摂取パターン分析 (timestampを使用 - 実際の記録時刻が重要)
  static async getHourlyPattern(userId: string = DEFAULT_USER_ID, days: number = 30) {
    const since = subDays(new Date(), days)

    const records = await prisma.coffeeRecord.findMany({
      where: {
        userId,
        date: {
          // 期間フィルタリングはdateフィールド
          gte: since,
        },
      },
    })

    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: 0,
      percentage: 0,
    }))

    records.forEach(record => {
      const hour = record.timestamp.getHours() // 時間別分析はtimestamp使用
      hourlyData[hour].count += record.cups
    })

    const total = records.reduce((sum, record) => sum + record.cups, 0)
    hourlyData.forEach(data => {
      data.percentage = total > 0 ? Math.round((data.count / total) * 100) : 0
    })

    return hourlyData
  }

  // コーヒー記録追加
  static async addCoffeeRecord({
    userId = DEFAULT_USER_ID,
    cups = 1,
    date, // 記録対象日
    timestamp = new Date(), // 実際の記録時刻
    coffeeType,
    size,
    location,
    notes,
  }: {
    userId?: string
    cups?: number
    date: Date // 必須：記録対象日
    timestamp?: Date // オプション：実際の記録時刻
    coffeeType?: string
    size?: string
    location?: string
    notes?: string
  }) {
    return await prisma.coffeeRecord.create({
      data: {
        userId,
        date, // 記録対象日
        cups,
        timestamp, // 実際の記録時刻
        coffeeType,
        size,
        location,
        notes,
      },
    })
  }

  // コーヒー記録削除
  static async deleteCoffeeRecord(id: number, userId: string = DEFAULT_USER_ID) {
    // 削除しようとしている記録が本当にそのユーザーのものか確認
    const record = await prisma.coffeeRecord.findUnique({
      where: { id },
    })

    if (!record || record.userId !== userId) {
      throw new Error('Record not found or user not authorized')
    }

    return await prisma.coffeeRecord.delete({
      where: { id },
    })
  }

  // 飲みすぎチェック（指定日の合計をチェック）
  static async checkOverConsumption(
    userId: string = DEFAULT_USER_ID,
    targetDate: Date = new Date()
  ) {
    const settings = await prisma.coffeeSettings.findUnique({
      where: { userId },
    })

    const dayTotal = await prisma.coffeeRecord.aggregate({
      where: {
        userId,
        date: {
          gte: startOfDay(targetDate),
          lte: endOfDay(targetDate),
        },
      },
      _sum: { cups: true },
    })

    const totalCups = dayTotal._sum.cups || 0
    const dailyLimit = settings?.dailyLimit || 4
    const warningThreshold = settings?.warningThreshold || 3

    return {
      totalCups,
      dailyLimit,
      warningThreshold,
      isOverLimit: totalCups >= dailyLimit,
      shouldWarn: totalCups >= warningThreshold,
      remainingCups: Math.max(0, dailyLimit - totalCups),
    }
  }

  // 最後に飲んだ時間からの経過時間チェック (timestampを使用 - 実際の記録時刻が重要)
  static async checkTimeSinceLastCoffee(userId: string = DEFAULT_USER_ID) {
    const lastRecord = await prisma.coffeeRecord.findFirst({
      where: { userId },
      orderBy: { timestamp: 'desc' }, // 実際の記録時刻順
    })

    if (!lastRecord) return { timeSinceLastCoffee: null, canDrink: true }

    const now = new Date()
    const timeSinceLastCoffee = now.getTime() - lastRecord.timestamp.getTime()
    const hoursSince = timeSinceLastCoffee / (1000 * 60 * 60)

    const settings = await prisma.coffeeSettings.findUnique({
      where: { userId },
    })
    const minInterval = (settings?.minInterval || 240) / 60 // 分を時間に変換

    return {
      timeSinceLastCoffee,
      hoursSince: Math.round(hoursSince * 10) / 10,
      canDrink: hoursSince >= minInterval,
      nextAllowedTime: minInterval - hoursSince > 0 ? minInterval - hoursSince : 0,
    }
  }

  // 設定取得
  static async getUserSettings(userId: string = DEFAULT_USER_ID) {
    return await prisma.coffeeSettings.findUnique({
      where: { userId },
    })
  }

  // 目標の進捗確認（指定日ベース）
  static async getGoalProgress(userId: string = DEFAULT_USER_ID, targetDate: Date = new Date()) {
    const activeGoals = await prisma.coffeeGoal.findMany({
      where: {
        userId,
        isActive: true,
      },
    })

    const dayTotal = await prisma.coffeeRecord.aggregate({
      where: {
        userId,
        date: {
          gte: startOfDay(targetDate),
          lte: endOfDay(targetDate),
        },
      },
      _sum: { cups: true },
    })

    const totalCups = dayTotal._sum.cups || 0

    return activeGoals.map(goal => ({
      ...goal,
      currentProgress: totalCups,
      isOnTrack: goal.targetCups ? totalCups <= goal.targetCups : true,
      progressPercentage: goal.targetCups ? Math.min((totalCups / goal.targetCups) * 100, 100) : 0,
    }))
  }
}
