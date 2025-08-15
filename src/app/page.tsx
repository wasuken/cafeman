'use client'

import { useState, useEffect } from 'react'
import { format, addMonths, subMonths, isSameDay, isSameMonth } from 'date-fns'
import CoffeeInput from './components/CoffeeInput'
import CoffeeCalendar from './components/CoffeeCalendar'
import CoffeeRecordModal from './components/CoffeeRecordModal'
import {
  Coffee,
  TrendingUp,
  Calendar,
  LogOut,
  Eye,
  MousePointer,
  BarChart3,
  Users,
} from 'lucide-react'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface CoffeeRecord {
  id: number
  date: string
  cups: number
  timestamp: string
  coffeeType?: string
  notes?: string
}

type CalendarMode = 'view' | 'select'

export default function HomePage() {
  const { user, isLoading: isAuthLoading, logout } = useAuth()
  const router = useRouter()
  const [records, setRecords] = useState<CoffeeRecord[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [recordsForSelectedDate, setRecordsForSelectedDate] = useState<CoffeeRecord[]>([])
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('view')

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/login')
    }
  }, [user, isAuthLoading, router])

  useEffect(() => {
    if (user) {
      fetchRecords()
    }
  }, [currentMonth, user])

  // 月が変更されたときにモーダル関連の状態をリセット
  useEffect(() => {
    // 選択された日付が現在の月に含まれていない場合、モーダルを閉じる
    if (selectedDate && !isSameMonth(selectedDate, currentMonth)) {
      if (calendarMode === 'view') {
        closeModal()
      }
    }
  }, [currentMonth, selectedDate, calendarMode])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      logout() // Clear user from context
      router.push('/login')
    } catch (error) {
      console.error('Logout failed', error)
    }
  }

  const fetchRecords = async () => {
    try {
      const monthStr = format(currentMonth, 'yyyy-MM')
      const response = await fetch(`/api/coffee?month=${monthStr}`)
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

  // 現在の基準日を取得（selectedDateがあればそれ、なければ今日）
  const getCurrentDate = () => {
    return selectedDate || new Date()
  }

  // 未来の日付かどうかをチェック
  const isFutureDate = (date: Date) => {
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    return checkDate > todayStart
  }

  const addCoffee = async (cups: number) => {
    const baseDate = getCurrentDate()

    // 未来の日付への登録を防ぐ
    if (isFutureDate(baseDate)) {
      alert('未来の日付にはコーヒーを記録できません。')
      return
    }

    try {
      const now = new Date() // 実際の記録時刻
      const response = await fetch('/api/coffee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.userId },
        body: JSON.stringify({
          date: format(baseDate, 'yyyy-MM-dd'), // 選択された日付
          cups,
          time: now.toISOString(), // 実際の記録時刻
        }),
      })

      if (response.ok) {
        const newRecord = await response.json()
        setRecords(prevRecords => [...prevRecords, newRecord])
      } else if (response.status === 401) {
        router.push('/login')
      }
    } catch (error) {
      console.error('Failed to add coffee:', error)
    }
  }

  const handleRecordDelete = (id: number) => {
    setRecords(prevRecords => prevRecords.filter(r => r.id !== id))
    setRecordsForSelectedDate(prevRecords => prevRecords.filter(r => r.id !== id))
    // If no records remain for the selected date, close the modal
    if (recordsForSelectedDate.length === 1) {
      closeModal()
    }
  }

  const handleDateClick = (date: Date) => {
    if (calendarMode === 'view') {
      // 既存の動作：記録を見るモーダルを開く
      const dailyRecords = records.filter(r => isSameDay(new Date(r.date), date))
      setRecordsForSelectedDate(dailyRecords)
      setIsModalOpen(true)
    } else {
      // 新しい動作：日付を選択
      setSelectedDate(date)

      // 選択された日付が現在の月と異なる場合、月を変更
      if (!isSameMonth(date, currentMonth)) {
        const newMonth = new Date(date.getFullYear(), date.getMonth(), 1)
        setCurrentMonth(newMonth)
      }

      setCalendarMode('view') // 選択後は表示モードに戻る
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setRecordsForSelectedDate([])
  }

  const goToPreviousMonth = () => {
    const newMonth = subMonths(currentMonth, 1)
    setCurrentMonth(newMonth)

    // 選択日付を新しい月の1日に設定
    const firstDayOfNewMonth = new Date(newMonth.getFullYear(), newMonth.getMonth(), 1)
    setSelectedDate(firstDayOfNewMonth)

    // 月変更時にモーダルを明示的に閉じる
    closeModal()
  }

  const goToNextMonth = () => {
    const newMonth = addMonths(currentMonth, 1)
    setCurrentMonth(newMonth)

    // 選択日付を新しい月の1日に設定
    const firstDayOfNewMonth = new Date(newMonth.getFullYear(), newMonth.getMonth(), 1)
    setSelectedDate(firstDayOfNewMonth)

    // 月変更時にモーダルを明示的に閉じる
    closeModal()
  }

  const goToToday = () => {
    const today = new Date()
    const newMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    setCurrentMonth(newMonth)
    setSelectedDate(today)
    closeModal()
  }

  const clearSelectedDate = () => {
    setSelectedDate(null)
    closeModal()
  }

  const toggleCalendarMode = () => {
    setCalendarMode(prev => (prev === 'view' ? 'select' : 'view'))
    closeModal()
  }

  const getTodayCups = () => {
    const baseDate = getCurrentDate()
    const dateStr = format(baseDate, 'yyyy-MM-dd')
    return records.filter(r => r.date.split('T')[0] === dateStr).reduce((sum, x) => sum + x.cups, 0)
  }

  const getWeeklyAverage = () => {
    const recentRecords = records.slice(0, 7)
    const total = recentRecords.reduce((sum, record) => sum + record.cups, 0)
    return recentRecords.length > 0 ? (total / recentRecords.length).toFixed(1) : '0'
  }

  const getMonthlyTotal = () => {
    return records.reduce((sum, record) => sum + record.cups, 0)
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

  if (!user) {
    return null
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='container mx-auto px-4 py-8 max-w-4xl'>
        <header className='flex justify-between items-center mb-8'>
          <div className='text-left'>
            <div className='flex items-center gap-3 mb-2'>
              <Coffee className='w-8 h-8 text-brown-600' />
              <h1 className='text-3xl font-bold text-gray-800'>Coffee Meter</h1>
            </div>
            <p className='text-gray-600'>コーヒー摂取量を記録・管理しよう</p>
            {selectedDate && !isSameDay(selectedDate, new Date()) && (
              <div className='mt-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm inline-block'>
                📅 {format(selectedDate, 'yyyy年MM月dd日')} の表示中
              </div>
            )}
          </div>
          <div className='text-right'>
            <p className='text-sm text-gray-600'>{user.email}</p>
            <div className='flex items-center gap-3 mt-1'>
              <Link
                href='/feed'
                className='flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors'
              >
                <Users className='w-4 h-4' />
                フィード
              </Link>
              <Link
                href='/charts'
                className='flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors'
              >
                <BarChart3 className='w-4 h-4' />
                データ分析
              </Link>
              <button
                onClick={handleLogout}
                className='flex items-center gap-2 text-sm text-blue-600 hover:underline'
              >
                <LogOut className='w-4 h-4' />
                ログアウト
              </button>
            </div>
          </div>
        </header>

        <div className='grid gap-6 md:grid-cols-3 mb-8'>
          <div className='bg-white rounded-lg shadow-md p-6 text-center'>
            <TrendingUp className='w-8 h-8 text-blue-600 mx-auto mb-2' />
            <div className='text-2xl font-bold text-gray-800'>{getWeeklyAverage()}</div>
            <div className='text-sm text-gray-600'>週平均（杯/日）</div>
          </div>

          <div className='bg-white rounded-lg shadow-md p-6 text-center'>
            <Calendar className='w-8 h-8 text-green-600 mx-auto mb-2' />
            <div className='text-2xl font-bold text-gray-800'>{getMonthlyTotal()}</div>
            <div className='text-sm text-gray-600'>今月の合計</div>
          </div>

          <div className='bg-white rounded-lg shadow-md p-6 text-center'>
            <Coffee className='w-8 h-8 text-orange-600 mx-auto mb-2' />
            <div className='text-2xl font-bold text-gray-800'>{records.length}</div>
            <div className='text-sm text-gray-600'>記録日数</div>
          </div>
        </div>

        <div className='grid gap-6 lg:grid-cols-5'>
          <div className='lg:col-span-2'>
            <CoffeeInput
              onAddCoffee={addCoffee}
              todayCups={getTodayCups()}
              currentDate={getCurrentDate()}
            />
          </div>

          <div className='lg:col-span-3 bg-white rounded-lg shadow-md p-6'>
            <div className='flex justify-between items-center mb-4'>
              <button onClick={goToPreviousMonth} className='p-2 rounded-md hover:bg-gray-100'>
                &lt;
              </button>
              <h2 className='text-lg font-semibold'>{format(currentMonth, 'yyyy年MM月')}</h2>
              <button onClick={goToNextMonth} className='p-2 rounded-md hover:bg-gray-100'>
                &gt;
              </button>
            </div>

            {/* カレンダーコントロール */}
            <div className='mb-4 p-3 bg-gray-50 rounded-lg'>
              <div className='flex items-center justify-between flex-wrap gap-2'>
                <div className='flex items-center gap-2'>
                  <button
                    onClick={toggleCalendarMode}
                    className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
                      calendarMode === 'select'
                        ? 'bg-purple-100 text-purple-700 border border-purple-300'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {calendarMode === 'select' ? (
                      <>
                        <MousePointer className='w-4 h-4' />
                        日付選択中
                      </>
                    ) : (
                      <>
                        <Eye className='w-4 h-4' />
                        選択日付変更
                      </>
                    )}
                  </button>
                  {calendarMode === 'select' && (
                    <span className='text-sm text-gray-600'>
                      カレンダーの日付をクリックして選択
                    </span>
                  )}
                </div>

                <div className='flex gap-2'>
                  <button
                    onClick={goToToday}
                    className='px-3 py-2 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors'
                  >
                    今日へ
                  </button>
                </div>
              </div>

              {selectedDate && (
                <div className='mt-2 text-sm text-purple-600'>
                  選択中: {format(selectedDate, 'yyyy年MM月dd日')}
                </div>
              )}
            </div>

            <CoffeeCalendar
              records={records}
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              calendarMode={calendarMode}
              onDateClick={handleDateClick}
            />
          </div>
        </div>
      </div>
      <CoffeeRecordModal
        isOpen={isModalOpen}
        onClose={closeModal}
        records={recordsForSelectedDate}
        selectedDate={
          recordsForSelectedDate.length > 0 ? new Date(recordsForSelectedDate[0].date) : null
        }
        onRecordDelete={handleRecordDelete}
      />
    </div>
  )
}
