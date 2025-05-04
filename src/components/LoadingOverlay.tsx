import LoadingSpinner from './LoadingSpinner'

interface LoadingOverlayProps {
  message?: string
}

export default function LoadingOverlay({ message = 'Loading...' }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl flex flex-col items-center space-y-4">
        <LoadingSpinner size="lg" color="blue" />
        <p className="text-gray-700 dark:text-gray-300">{message}</p>
      </div>
    </div>
  )
} 