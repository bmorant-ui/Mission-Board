import type { Metadata } from 'next'
import { Nunito } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '@/providers/QueryProvider'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito', weight: ['400', '500', '600', '700', '800'] })

export const metadata: Metadata = {
  title: 'MissionBoard',
  description: 'Project management for nonprofits',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${nunito.variable} h-full`}>
      <body className="h-full antialiased font-[var(--font-nunito)]">
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
