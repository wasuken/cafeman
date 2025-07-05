'use client'

import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
} from 'date-fns'
import { ja } from 'date-fns/locale'

interface CoffeeRecord {
  id: number
  date: string
  cups: number
  time: string
}

interface CoffeeCalendarProps {
  records: CoffeeRecord[]
  currentMonth: Date
}

export default function CoffeeCalendar({ records, currentMonth }: CoffeeCalendarProps) {
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const getIntensity = (cups: number) => {
    if (cups === 0) return 'bg-gray-100'
    if (cups <= 2) return 'bg-yellow-200'
    if (cups <= 4) return 'bg-yellow-400'
    if (cups <= 6) return 'bg-orange-500'
    return 'bg-red-600'
  }

  const getCupsForDate = (date: Date) => {
    const record = records.find(r => isSameDay(new Date(r.date), date))
    return record?.cups || 0
  }

  return (
    <div className='bg-white rounded-lg shadow-md p-6'>
      <h3 className='text-lg font-semibold mb-4'>
        {format(currentMonth, 'yyyy年MM月', { locale: ja })}
      </h3>

      <div className='grid grid-cols-7 gap-1'>
        {['日', '月', '火', '水', '木', '金', '土'].map(day => (
          <div key={day} className='p-2 text-center text-sm font-medium text-gray-500'>
            {day}
          </div>
        ))}

        {days.map(day => {
          const cups = getCupsForDate(day)
          const isToday = isSameDay(day, new Date())

          return (
            <div
              key={day.toISOString()}
              className={`
                p-2 text-center text-sm rounded
                ${getIntensity(cups)}
                ${isToday ? 'ring-2 ring-blue-500' : ''}
                ${!isSameMonth(day, currentMonth) ? 'opacity-50' : ''}
              `}
            >
              <div className='font-medium'>{format(day, 'd')}</div>
              {cups > 0 && <div className='text-xs mt-1'>{cups}杯</div>}
            </div>
          )
        })}
      </div>

      <div className='mt-4 flex items-center gap-4 text-xs'>
        <span>少ない</span>
        <div className='flex gap-1'>
          <div className='w-3 h-3 bg-gray-100 rounded'></div>
          <div className='w-3 h-3 bg-yellow-200 rounded'></div>
          <div className='w-3 h-3 bg-yellow-400 rounded'></div>
          <div className='w-3 h-3 bg-orange-500 rounded'></div>
          <div className='w-3 h-3 bg-red-600 rounded'></div>
        </div>
        <span>多い</span>
      </div>
    </div>
  )
}
