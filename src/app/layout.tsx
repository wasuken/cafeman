import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Coffee Meter',
  description: 'コーヒー摂取量を記録・管理するアプリ',
}

import { AuthProvider } from '@/context/AuthContext'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='ja'>
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
