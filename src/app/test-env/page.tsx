'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/lib/supabase'

export default function TestEnvPage() {
  const [envVars, setEnvVars] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({})

  useEffect(() => {
    const checkEnv = async () => {
      try {
        // Check if we can access Supabase
        const { data, error } = await supabase.auth.getSession()
        
        // Get all cookies
        const cookies = document.cookie.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=')
          acc[key] = value
          return acc
        }, {} as Record<string, string>)

        // Get environment variables that are exposed to the client
        const clientEnvVars = {
          NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set (hidden)' : 'Not set',
        }

        // Debug information
        const debug = {
          'Session Data': data.session ? {
            user: data.session.user.email,
            expires_at: new Date(data.session.expires_at! * 1000).toLocaleString(),
          } : 'No session',
          'Auth Error': error ? error.message : 'None',
          'Cookies Present': Object.keys(cookies).length > 0 ? Object.keys(cookies) : 'No cookies',
          'Window Location': window.location.href,
          'User Agent': navigator.userAgent,
        }

        setEnvVars(clientEnvVars)
        setDebugInfo(debug)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
      }
    }

    checkEnv()
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Environment Variables Status
            </h3>
            {error && (
              <div className="mt-2 text-sm text-red-600">
                Error: {error}
              </div>
            )}
            <div className="mt-5">
              <h4 className="text-md font-medium text-gray-900 mb-3">Client Environment Variables</h4>
              <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 mb-8">
                {Object.entries(envVars).map(([key, value]) => (
                  <div key={key} className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {key}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>

              <h4 className="text-md font-medium text-gray-900 mb-3">Debug Information</h4>
              <dl className="grid grid-cols-1 gap-5">
                {Object.entries(debugInfo).map(([key, value]) => (
                  <div key={key} className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {key}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 