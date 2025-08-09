'use client'

import { useState, useEffect } from 'react'
import { format, addMonths, subMonths, isSameDay } from 'date-fns'
import CoffeeInput from './components/CoffeeInput'
import CoffeeCalendar from './components/CoffeeCalendar'
import CoffeeRecordModal from './components/CoffeeRecordModal'
import { Coffee, TrendingUp, Calendar, LogOut } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

interface CoffeeRecord {
  id: number
  date: string
  cups: number
  timestamp: string
  coffeeType?: string
  notes?: string
}

export default function HomePage() {
  const { user, isLoading: isAuthLoading, logout } = useAuth()
  const router = useRouter()
  const [records, setRecords] = useState<CoffeeRecord[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [recordsForSelectedDate, setRecordsForSelectedDate] = useState<CoffeeRecord[]>([])

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

  const addCoffee = async (cups: number) => {
    try {
      const now = new Date()
      const response = await fetch('/api/coffee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: format(now, 'yyyy-MM-dd'),
          cups,
          timestamp: now.toISOString(),
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
    setSelectedDate(date)
    const dailyRecords = records.filter(r => isSameDay(new Date(r.date), date))
    setRecordsForSelectedDate(dailyRecords)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedDate(null)
    setRecordsForSelectedDate([])
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const getTodayCups = () => {
    const today = format(new Date(), 'yyyy-MM-dd')
    return records.filter(r => r.date.split('T')[0] === today).reduce((sum, x) => sum + x.cups, 0)
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
          </div>
          <div className='text-right'>
            <p className='text-sm text-gray-600'>{user.email}</p>
            <button
              onClick={handleLogout}
              className='flex items-center gap-2 text-sm text-blue-600 hover:underline'
            >
              <LogOut className='w-4 h-4' />
              ログアウト
            </button>
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
            <CoffeeInput onAddCoffee={addCoffee} todayCups={getTodayCups()} />
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
            <CoffeeCalendar
              records={records}
              currentMonth={currentMonth}
              onDateClick={handleDateClick}
            />
          </div>
        </div>
      </div>
      <CoffeeRecordModal
        isOpen={isModalOpen}
        onClose={closeModal}
        records={recordsForSelectedDate}
        selectedDate={selectedDate}
        onRecordDelete={handleRecordDelete}
      />
    </div>
  )
}
