'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Coffee, Plus, Minus } from 'lucide-react'

interface CoffeeInputProps {
  onAddCoffee: (cups: number) => void
  todayCups: number
}

export default function CoffeeInput({ onAddCoffee, todayCups }: CoffeeInputProps) {
  const [cups, setCups] = useState(1)

  const handleSubmit = () => {
    onAddCoffee(cups)
    setCups(1)
  }

  const getColorClass = (totalCups: number) => {
    if (totalCups <= 2) return 'text-green-600'
    if (totalCups <= 4) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
      <div className='flex items-center gap-3 mb-4'>
        <Coffee className='w-6 h-6 text-brown-600' />
        <h2 className='text-xl font-semibold'>今日のコーヒー</h2>
      </div>

      <div className='text-center mb-4'>
        <div className={`text-4xl font-bold ${getColorClass(todayCups)}`}>{todayCups} 杯</div>
        <div className='text-sm text-gray-500 mt-1'>{format(new Date(), 'yyyy年MM月dd日')}</div>
      </div>

      <div className='flex items-center justify-center gap-4 mb-4'>
        <button
          onClick={() => setCups(Math.max(1, cups - 1))}
          className='w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300'
          aria-label='Decrement coffee cups'
        >
          <Minus className='w-4 h-4' />
        </button>

        <div className='text-2xl font-semibold min-w-[3rem] text-center'>{cups}</div>

        <button
          onClick={() => setCups(cups + 1)}
          className='w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300'
          aria-label='Increment coffee cups'
        >
          <Plus className='w-4 h-4' />
        </button>
      </div>

      <button
        onClick={handleSubmit}
        className='w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors'
      >
        コーヒーを記録
      </button>

      {todayCups > 4 && (
        <div className='mt-3 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm'>
          ⚠️ 今日は飲みすぎかも！カフェインの摂りすぎに注意してください。
        </div>
      )}
    </div>
  )
}
