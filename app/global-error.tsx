'use client'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center bg-gray-50">
          <AlertTriangle className="w-14 h-14 text-amber-400" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">MissionBoard</h1>
            <p className="text-gray-600 mt-2">Something went wrong loading the app.</p>
            <p className="text-sm text-gray-400 mt-1">{error.message}</p>
          </div>
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
