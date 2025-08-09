'use client'

import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface CoffeeRecord {
  id: number
  date: string
  cups: number
  timestamp: string
  coffeeType?: string
  notes?: string
}

interface CoffeeRecordModalProps {
  isOpen: boolean
  onClose: () => void
  records: CoffeeRecord[]
  selectedDate: Date | null
  onRecordDelete: (id: number) => void
}

export default function CoffeeRecordModal({
  isOpen,
  onClose,
  records,
  selectedDate,
  onRecordDelete,
}: CoffeeRecordModalProps) {
  if (!isOpen || !selectedDate) return null

  const handleDelete = async (id: number) => {
    if (!confirm('この記録を削除しますか？')) return

    try {
      const response = await fetch(`/api/coffee/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete record')
      }
      onRecordDelete(id)
    } catch (error) {
      console.error(error)
      alert('削除に失敗しました。')
    }
  }

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center'>
      <div className='bg-white rounded-lg shadow-xl p-6 w-full max-w-md'>
        <div className='flex justify-between items-center mb-4'>
          <h2 className='text-xl font-bold'>
            {format(selectedDate, 'yyyy年M月d日', { locale: ja })} の記録
          </h2>
          <button onClick={onClose} className='text-gray-500 hover:text-gray-800'>
            &times;
          </button>
        </div>
        <div>
          {records.length === 0 ? (
            <p>この日の記録はありません。</p>
          ) : (
            <ul className='space-y-3'>
              {records.map(record => (
                <li key={record.id} className='p-3 bg-gray-50 rounded-md flex justify-between items-center'>
                  <div>
                    <p className='font-semibold'>
                      {record.cups} 杯 - {format(new Date(record.timestamp), 'HH:mm')}
                    </p>
                    {record.coffeeType && <p className='text-sm text-gray-600'>{record.coffeeType}</p>}
                    {record.notes && <p className='text-sm text-gray-500'>{record.notes}</p>}
                  </div>
                  <button
                    onClick={() => handleDelete(record.id)}
                    className='text-red-500 hover:text-red-700 font-semibold'
                  >
                    削除
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className='text-right mt-6'>
          <button
            onClick={onClose}
            className='px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300'
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}
