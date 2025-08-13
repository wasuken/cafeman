'use client'

import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  startOfWeek,
  endOfWeek,
} from 'date-fns'
import { ja } from 'date-fns/locale'

interface CoffeeRecord {
  id: number
  date: string
  cups: number
  timestamp: string
}

interface CoffeeCalendarProps {
  records: CoffeeRecord[]
  currentMonth: Date
  selectedDate?: Date | null
  calendarMode: 'view' | 'select'
  onDateClick: (date: Date) => void
}

export default function CoffeeCalendar({
  records,
  currentMonth,
  selectedDate,
  calendarMode,
  onDateClick,
}: CoffeeCalendarProps) {
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  // Ensure the calendar grid starts on a Sunday for a full 6 weeks display
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: startDate, end: endDate })

  const getIntensity = (cups: number) => {
    if (cups === 0) return 'bg-gray-100 hover:bg-gray-200'
    if (cups <= 2) return 'bg-yellow-200 hover:bg-yellow-300'
    if (cups <= 4) return 'bg-yellow-400 hover:bg-yellow-500'
    if (cups <= 6) return 'bg-orange-500 hover:bg-orange-600'
    return 'bg-red-600 hover:bg-red-700'
  }

  const getCupsForDate = (date: Date) => {
    const totalCups = records
      .filter(r => isSameDay(new Date(r.date), date))
      .reduce((sum, x) => sum + (x.cups || 0), 0)
    return totalCups
  }

  return (
    <div className='bg-white rounded-lg shadow-md p-6 text-black'>
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
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isSelected = selectedDate && isSameDay(day, selectedDate)
          const isFuture = day > new Date()

          return (
            <div
              key={day.toISOString()}
              onClick={() => isCurrentMonth && !isFuture && onDateClick(day)}
              className={`
                p-2 text-center text-sm rounded transition-colors relative
                ${getIntensity(cups)}
                ${isToday ? 'ring-2 ring-blue-500' : ''}
                ${isSelected ? 'ring-2 ring-purple-500 ring-offset-1' : ''}
                ${!isCurrentMonth ? 'text-gray-400 bg-gray-50' : 'text-black'}
                ${isFuture ? 'text-gray-300 bg-gray-50 cursor-not-allowed' : 'cursor-pointer'}
                ${calendarMode === 'select' && isCurrentMonth && !isFuture ? 'hover:ring-2 hover:ring-purple-300' : ''}
              `}
            >
              <div className='font-medium'>{format(day, 'd')}</div>
              {cups > 0 && <div className='text-xs mt-1'>{cups}杯</div>}
              {isSelected && (
                <div className='absolute top-0 right-0 w-2 h-2 bg-purple-500 rounded-full'></div>
              )}
              {calendarMode === 'select' && isCurrentMonth && (
                <div className='absolute bottom-0 left-0 text-xs text-purple-600'>📅</div>
              )}
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
