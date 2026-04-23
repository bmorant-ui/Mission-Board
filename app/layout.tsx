import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '@/providers/QueryProvider'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'MissionBoard',
  description: 'Project management for nonprofits',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="h-full antialiased font-[var(--font-geist)]">
        <QueryProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </QueryProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
