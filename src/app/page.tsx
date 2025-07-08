'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import CoffeeInput from './components/CoffeeInput'
import CoffeeCalendar from './components/CoffeeCalendar'
import { Coffee, TrendingUp, Calendar } from 'lucide-react'

interface CoffeeRecord {
  id: number
  date: string
  cups: number
  time: string
}

export default function HomePage() {
  const [records, setRecords] = useState<CoffeeRecord[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecords()
  }, [currentMonth])

  const fetchRecords = async () => {
    try {
      const monthStr = format(currentMonth, 'yyyy-MM')
      const response = await fetch(`/api/coffee?month=${monthStr}`)
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
          time: now.toISOString(),
        }),
      })

      if (response.ok) {
        await fetchRecords()
      }
    } catch (error) {
      console.error('Failed to add coffee:', error)
    }
  }

  const getTodayCups = () => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const todayTotalCups = records
      .filter(r => r.date.split('T')[0] === today)
      .reduce((scm, x) => scm + x.cups || 0, 0)
    return todayTotalCups;
  }

  const getWeeklyAverage = () => {
    const recentRecords = records.slice(0, 7)
    const total = recentRecords.reduce((sum, record) => sum + record.cups, 0)
    return recentRecords.length > 0 ? (total / recentRecords.length).toFixed(1) : '0'
  }

  const getMonthlyTotal = () => {
    return records.reduce((sum, record) => sum + record.cups, 0)
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <Coffee className='w-12 h-12 text-brown-600 mx-auto mb-4 animate-pulse' />
          <div>読み込み中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='container mx-auto px-4 py-8 max-w-4xl'>
        <header className='text-center mb-8'>
          <div className='flex items-center justify-center gap-3 mb-2'>
            <Coffee className='w-8 h-8 text-brown-600' />
            <h1 className='text-3xl font-bold text-gray-800'>Coffee Meter</h1>
          </div>
          <p className='text-gray-600'>コーヒー摂取量を記録・管理しよう</p>
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

        <div className='grid gap-6 lg:grid-cols-2'>
          <CoffeeInput onAddCoffee={addCoffee} todayCups={getTodayCups()} />

          <CoffeeCalendar records={records} currentMonth={currentMonth} />
        </div>

        <div className='mt-8 bg-white rounded-lg shadow-md p-6'>
          <h3 className='text-lg font-semibold mb-4'>最近の記録</h3>
          <div className='space-y-2'>
            {records.slice(0, 5).map(record => (
              <div
                key={record.id}
                className='flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0'
              >
                <div className='text-sm text-gray-600'>
                  {format(new Date(record.date), 'MM月dd日')}
                </div>
                <div className='font-medium'>{record.cups}杯</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
