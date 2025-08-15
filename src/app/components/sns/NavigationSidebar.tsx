'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Coffee, Home, Plus, User, BarChart3, Bell } from 'lucide-react'

interface NavigationItem {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  badge?: number
}

const navigationItems: NavigationItem[] = [
  { href: '/', icon: Home, label: 'ホーム' },
  { href: '/feed', icon: Coffee, label: 'フィード' },
  { href: '/post-create', icon: Plus, label: '投稿作成' },
  { href: '/charts', icon: BarChart3, label: 'データ分析' },
  { href: '/notifications', icon: Bell, label: '通知' },
  { href: '/profile-my', icon: User, label: 'プロフィール' },
]

interface NavigationSidebarProps {
  className?: string
}

export default function NavigationSidebar({ className = '' }: NavigationSidebarProps) {
  const pathname = usePathname()

  return (
    <nav className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <h2 className='text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2'>
        <Coffee className='w-5 h-5 text-brown-600' />
        メニュー
      </h2>

      <ul className='space-y-2'>
        {navigationItems.map(item => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <Icon className='w-5 h-5' />
                <span>{item.label}</span>
                {item.badge && (
                  <span className='ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1'>
                    {item.badge}
                  </span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
