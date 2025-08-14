'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { ja } from 'date-fns/locale'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Coffee, TrendingUp, Clock, Calendar, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface CoffeeRecord {
  id: number
  date: string
  cups: number
  timestamp: string
  coffeeType?: string
  notes?: string
}

interface DailyData {
  date: string
  cups: number
  displayDate: string
}

interface HourlyData {
  hour: number
  count: number
  percentage: number
}

interface WeeklyPattern {
  dayOfWeek: string
  avgCups: number
  totalCups: number
}

type TabType = 'daily' | 'hourly' | 'patterns' | 'trends'

export default function ChartsPage() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('daily')
  const [records, setRecords] = useState<CoffeeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/login')
    }
  }, [user, isAuthLoading, router])

  useEffect(() => {
    if (user) {
      fetchRecords()
    }
  }, [user])

  const fetchRecords = async () => {
    try {
      // 過去3ヶ月のデータを取得
      const response = await fetch('/api/coffee')
      if (response.status === 401) {
        router.push('/login')
        return
      }
      const data = await response.json()
      setRecords(data)
    } catch (error) {
      console.error('Failed to fetch records:', error)
    } finally {
      setLoading(false)
    }
  }

  // 日別データの生成
  const getDailyData = (): DailyData[] => {
    const last30Days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date(),
    })

    return last30Days.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd')
      const dailyRecords = records.filter(r => r.date.split('T')[0] === dateStr)
      const totalCups = dailyRecords.reduce((sum, r) => sum + r.cups, 0)

      return {
        date: dateStr,
        cups: totalCups,
        displayDate: format(date, 'M/d'),
      }
    })
  }

  // 時間別データの生成
  const getHourlyData = (): HourlyData[] => {
    const hourlyStats = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: 0,
      percentage: 0,
    }))

    records.forEach(record => {
      const hour = new Date(record.timestamp).getHours()
      hourlyStats[hour].count += record.cups
    })

    const total = records.reduce((sum, record) => sum + record.cups, 0)
    hourlyStats.forEach(data => {
      data.percentage = total > 0 ? Math.round((data.count / total) * 100) : 0
    })

    return hourlyStats
  }

  // 曜日別パターンの生成
  const getWeeklyPattern = (): WeeklyPattern[] => {
    const weekdays = ['日', '月', '火', '水', '木', '金', '土']
    const weeklyStats = Array.from({ length: 7 }, (_, day) => ({
      dayOfWeek: weekdays[day],
      totalCups: 0,
      dayCount: 0,
      avgCups: 0,
    }))

    // 日付ごとにグループ化
    const dailyTotals: Record<string, number> = {}
    records.forEach(record => {
      const dateStr = record.date.split('T')[0]
      dailyTotals[dateStr] = (dailyTotals[dateStr] || 0) + record.cups
    })

    // 曜日別に集計
    Object.entries(dailyTotals).forEach(([dateStr, cups]) => {
      const date = new Date(dateStr)
      const dayOfWeek = date.getDay()
      weeklyStats[dayOfWeek].totalCups += cups
      weeklyStats[dayOfWeek].dayCount += 1
    })

    // 平均を計算
    weeklyStats.forEach(stat => {
      stat.avgCups = stat.dayCount > 0 ? Math.round((stat.totalCups / stat.dayCount) * 10) / 10 : 0
    })

    return weeklyStats
  }

  // 月別トレンドデータの生成
  const getMonthlyTrends = (): DailyData[] => {
    const monthlyData: Record<string, number> = {}

    records.forEach(record => {
      const monthKey = record.date.substring(0, 7) // YYYY-MM
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + record.cups
    })

    return Object.entries(monthlyData)
      .map(([month, cups]) => ({
        date: month,
        cups,
        displayDate: format(new Date(month + '-01'), 'yyyy年M月'),
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-6) // 過去6ヶ月
  }

  // ヒートマップデータの生成（時間x曜日）
  const getHeatmapData = () => {
    const heatmapData = Array.from({ length: 7 }, (_, day) =>
      Array.from({ length: 24 }, (_, hour) => ({
        day,
        hour,
        count: 0,
      }))
    ).flat()

    records.forEach(record => {
      const date = new Date(record.timestamp)
      const hour = date.getHours()
      const day = date.getDay()
      const index = day * 24 + hour
      heatmapData[index].count += record.cups
    })

    return heatmapData
  }

  // 統計サマリーの生成
  const getStatsSummary = () => {
    const totalCups = records.reduce((sum, r) => sum + r.cups, 0)
    const dailyTotals = Object.values(
      records.reduce(
        (acc, r) => {
          const date = r.date.split('T')[0]
          acc[date] = (acc[date] || 0) + r.cups
          return acc
        },
        {} as Record<string, number>
      )
    )

    const avgPerDay = dailyTotals.length > 0 ? totalCups / dailyTotals.length : 0
    const maxPerDay = Math.max(...dailyTotals, 0)
    const activeDays = dailyTotals.filter(total => total > 0).length

    return {
      totalCups,
      avgPerDay: Math.round(avgPerDay * 10) / 10,
      maxPerDay,
      activeDays,
      recordDays: dailyTotals.length,
    }
  }

  if (isAuthLoading || loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <Coffee className='w-12 h-12 text-brown-600 mx-auto mb-4 animate-pulse' />
          <div>読み込み中...</div>
        </div>
      </div>
    )
  }

  if (!user) return null

  const dailyData = getDailyData()
  const hourlyData = getHourlyData()
  const weeklyPattern = getWeeklyPattern()
  const monthlyTrends = getMonthlyTrends()
  const heatmapData = getHeatmapData()
  const stats = getStatsSummary()

  const tabs = [
    { id: 'daily', label: '日別推移', icon: TrendingUp },
    { id: 'hourly', label: '時間別分析', icon: Clock },
    { id: 'patterns', label: 'パターン分析', icon: BarChart },
    { id: 'trends', label: '長期トレンド', icon: Calendar },
  ] as const

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='container mx-auto px-4 py-8 max-w-6xl'>
        {/* ヘッダー */}
        <header className='flex justify-between items-center mb-8'>
          <div className='flex items-center gap-4'>
            <Link
              href='/'
              className='flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors'
            >
              <ArrowLeft className='w-5 h-5' />
              戻る
            </Link>
            <div>
              <h1 className='text-3xl font-bold text-gray-800 flex items-center gap-3'>
                <Coffee className='w-8 h-8 text-brown-600' />
                データ分析
              </h1>
              <p className='text-gray-600'>コーヒー摂取パターンの詳細分析</p>
            </div>
          </div>
        </header>

        {/* 統計サマリー */}
        <div className='grid gap-4 md:grid-cols-5 mb-8'>
          <div className='bg-white rounded-lg shadow-md p-6 text-center'>
            <div className='text-2xl font-bold text-blue-600'>{stats.totalCups}</div>
            <div className='text-sm text-gray-600'>総摂取量</div>
          </div>
          <div className='bg-white rounded-lg shadow-md p-6 text-center'>
            <div className='text-2xl font-bold text-green-600'>{stats.avgPerDay}</div>
            <div className='text-sm text-gray-600'>1日平均</div>
          </div>
          <div className='bg-white rounded-lg shadow-md p-6 text-center'>
            <div className='text-2xl font-bold text-orange-600'>{stats.maxPerDay}</div>
            <div className='text-sm text-gray-600'>1日最大</div>
          </div>
          <div className='bg-white rounded-lg shadow-md p-6 text-center'>
            <div className='text-2xl font-bold text-purple-600'>{stats.activeDays}</div>
            <div className='text-sm text-gray-600'>記録日数</div>
          </div>
          <div className='bg-white rounded-lg shadow-md p-6 text-center'>
            <div className='text-2xl font-bold text-red-600'>
              {Math.round((stats.activeDays / stats.recordDays) * 100) || 0}%
            </div>
            <div className='text-sm text-gray-600'>記録率</div>
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className='bg-white rounded-lg shadow-md mb-8'>
          <div className='border-b border-gray-200'>
            <nav className='flex space-x-8 px-6'>
              {tabs.map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className='w-4 h-4' />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          <div className='p-6'>
            {/* 日別推移タブ */}
            {activeTab === 'daily' && (
              <div>
                <h3 className='text-xl font-semibold mb-6'>過去30日間の摂取量推移</h3>
                <div className='h-80'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <LineChart data={dailyData}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis
                        dataKey='displayDate'
                        tick={{ fontSize: 12 }}
                        interval='preserveStartEnd'
                      />
                      <YAxis />
                      <Tooltip
                        labelFormatter={label => `${label}`}
                        formatter={value => [`${value}杯`, '摂取量']}
                      />
                      <Line
                        type='monotone'
                        dataKey='cups'
                        stroke='#2563eb'
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className='mt-6 grid gap-4 md:grid-cols-2'>
                  <div className='bg-gray-50 rounded-lg p-4'>
                    <h4 className='font-medium text-gray-700 mb-2'>最近の傾向</h4>
                    <p className='text-sm text-gray-600'>
                      過去7日間の平均：
                      <span className='font-semibold text-blue-600'>
                        {(dailyData.slice(-7).reduce((sum, d) => sum + d.cups, 0) / 7).toFixed(1)}
                        杯/日
                      </span>
                    </p>
                  </div>
                  <div className='bg-gray-50 rounded-lg p-4'>
                    <h4 className='font-medium text-gray-700 mb-2'>記録状況</h4>
                    <p className='text-sm text-gray-600'>
                      コーヒーを飲んだ日：
                      <span className='font-semibold text-green-600'>
                        {dailyData.filter(d => d.cups > 0).length}/30日
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 時間別分析タブ */}
            {activeTab === 'hourly' && (
              <div>
                <h3 className='text-xl font-semibold mb-6'>時間別摂取パターン</h3>
                <div className='h-80 mb-6'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart data={hourlyData}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis
                        dataKey='hour'
                        tickFormatter={hour => `${hour}時`}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis />
                      <Tooltip
                        labelFormatter={hour => `${hour}時台`}
                        formatter={value => [`${value}杯`, '摂取量']}
                      />
                      <Bar dataKey='count' fill='#f59e0b' />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* ヒートマップ */}
                <h4 className='text-lg font-semibold mb-4'>時間帯×曜日 ヒートマップ</h4>
                <div className='bg-gray-50 rounded-lg p-4'>
                  <div className='grid grid-cols-25 gap-1 text-xs'>
                    {/* ヘッダー行（時間） */}
                    <div></div>
                    {Array.from({ length: 24 }, (_, i) => (
                      <div key={i} className='text-center text-gray-500 py-1'>
                        {i}
                      </div>
                    ))}

                    {/* 曜日×時間のグリッド */}
                    {['日', '月', '火', '水', '木', '金', '土'].map((day, dayIndex) => (
                      <React.Fragment key={day}>
                        <div className='text-gray-700 font-medium py-2'>{day}</div>
                        {Array.from({ length: 24 }, (_, hourIndex) => {
                          const dataPoint = heatmapData.find(
                            d => d.day === dayIndex && d.hour === hourIndex
                          )
                          const intensity = dataPoint?.count || 0
                          const maxIntensity = Math.max(...heatmapData.map(d => d.count))
                          const opacity = maxIntensity > 0 ? intensity / maxIntensity : 0

                          return (
                            <div
                              key={hourIndex}
                              className='aspect-square rounded border border-gray-200 flex items-center justify-center text-xs'
                              style={{
                                backgroundColor:
                                  intensity > 0 ? `rgba(37, 99, 235, ${opacity})` : '#f9fafb',
                                color: opacity > 0.5 ? 'white' : '#374151',
                              }}
                              title={`${day}曜日 ${hourIndex}時: ${intensity}杯`}
                            >
                              {intensity > 0 ? intensity : ''}
                            </div>
                          )
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className='mt-4 text-xs text-gray-600'>
                    濃い色ほど摂取量が多いことを表します
                  </div>
                </div>
              </div>
            )}

            {/* パターン分析タブ */}
            {activeTab === 'patterns' && (
              <div>
                <h3 className='text-xl font-semibold mb-6'>摂取パターン分析</h3>
                <div className='grid gap-8 lg:grid-cols-2'>
                  {/* 曜日別パターン */}
                  <div>
                    <h4 className='text-lg font-semibold mb-4'>曜日別平均摂取量</h4>
                    <div className='h-64'>
                      <ResponsiveContainer width='100%' height='100%'>
                        <BarChart data={weeklyPattern}>
                          <CartesianGrid strokeDasharray='3 3' />
                          <XAxis dataKey='dayOfWeek' />
                          <YAxis />
                          <Tooltip formatter={value => [`${value}杯`, '平均摂取量']} />
                          <Bar dataKey='avgCups' fill='#10b981' />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* 時間帯分布 */}
                  <div>
                    <h4 className='text-lg font-semibold mb-4'>時間帯別分布</h4>
                    <div className='h-64'>
                      <ResponsiveContainer width='100%' height='100%'>
                        <PieChart>
                          <Pie
                            data={[
                              {
                                name: '朝（6-12時）',
                                value: hourlyData.slice(6, 12).reduce((sum, h) => sum + h.count, 0),
                              },
                              {
                                name: '昼（12-18時）',
                                value: hourlyData
                                  .slice(12, 18)
                                  .reduce((sum, h) => sum + h.count, 0),
                              },
                              {
                                name: '夜（18-24時）',
                                value: hourlyData
                                  .slice(18, 24)
                                  .reduce((sum, h) => sum + h.count, 0),
                              },
                              {
                                name: '深夜（0-6時）',
                                value: hourlyData.slice(0, 6).reduce((sum, h) => sum + h.count, 0),
                              },
                            ].filter(d => d.value > 0)}
                            cx='50%'
                            cy='50%'
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey='value'
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                          >
                            {['#3b82f6', '#10b981', '#f59e0b', '#ef4444'].map((color, index) => (
                              <Cell key={`cell-${index}`} fill={color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* パターン分析結果 */}
                <div className='mt-8 grid gap-4 md:grid-cols-3'>
                  <div className='bg-blue-50 rounded-lg p-4'>
                    <h5 className='font-medium text-blue-700 mb-2'>最もアクティブな曜日</h5>
                    <p className='text-blue-600'>
                      {
                        weeklyPattern.reduce((max, day) => (day.avgCups > max.avgCups ? day : max))
                          .dayOfWeek
                      }
                      曜日
                    </p>
                  </div>
                  <div className='bg-green-50 rounded-lg p-4'>
                    <h5 className='font-medium text-green-700 mb-2'>ピークタイム</h5>
                    <p className='text-green-600'>
                      {hourlyData.reduce((max, hour) => (hour.count > max.count ? hour : max)).hour}
                      時台
                    </p>
                  </div>
                  <div className='bg-orange-50 rounded-lg p-4'>
                    <h5 className='font-medium text-orange-700 mb-2'>摂取頻度</h5>
                    <p className='text-orange-600'>
                      {Math.round((stats.activeDays / stats.recordDays) * 100) || 0}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 長期トレンドタブ */}
            {activeTab === 'trends' && (
              <div>
                <h3 className='text-xl font-semibold mb-6'>月別トレンド</h3>
                <div className='h-80'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart data={monthlyTrends}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis dataKey='displayDate' tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip formatter={value => [`${value}杯`, '月間摂取量']} />
                      <Bar dataKey='cups' fill='#8b5cf6' />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className='mt-6 bg-gray-50 rounded-lg p-4'>
                  <h4 className='font-medium text-gray-700 mb-2'>トレンド分析</h4>
                  <p className='text-sm text-gray-600'>
                    {monthlyTrends.length >= 2 ? (
                      <>
                        前月との比較：
                        <span
                          className={`font-semibold ml-1 ${
                            monthlyTrends[monthlyTrends.length - 1].cups >
                            monthlyTrends[monthlyTrends.length - 2].cups
                              ? 'text-red-600'
                              : 'text-green-600'
                          }`}
                        >
                          {monthlyTrends[monthlyTrends.length - 1].cups >
                          monthlyTrends[monthlyTrends.length - 2].cups
                            ? '増加'
                            : '減少'}
                          （
                          {Math.abs(
                            monthlyTrends[monthlyTrends.length - 1].cups -
                              monthlyTrends[monthlyTrends.length - 2].cups
                          )}
                          杯）
                        </span>
                      </>
                    ) : (
                      'データが不足しています'
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
