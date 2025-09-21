'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/supabase'

interface AuthWrapperProps {
  children: React.ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl mb-4 block animate-bounce">🦅</span>
          <p className="text-lg text-gray-600">Loading EagleEye...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    // If Supabase is not configured, show a different message
    if (!supabase) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <span className="text-6xl mb-4 block">🦅</span>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to EagleEye
            </h1>
            <p className="text-gray-600 mb-4">
              Keep an eagle eye on your assignments!
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                Running in local mode. Your data will be stored locally on this device.
                To enable cloud sync, set up Supabase configuration.
              </p>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <span className="text-6xl mb-4 block">🦅</span>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to EagleEye
            </h1>
            <p className="text-gray-600">
              Keep an eagle eye on your assignments!
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <Auth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: '#3B82F6',
                      brandAccent: '#2563EB',
                    },
                  },
                },
                className: {
                  container: 'space-y-4',
                  button: 'w-full px-4 py-2 rounded-lg font-medium transition-colors',
                  input: 'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                },
              }}
              providers={['google', 'github']}
              redirectTo={`${window.location.origin}/`}
              theme="light"
              view="sign_in"
              showLinks={true}
              localization={{
                variables: {
                  sign_in: {
                    email_label: 'Email address',
                    password_label: 'Password',
                    button_label: 'Sign in',
                    loading_button_label: 'Signing in...',
                    social_provider_text: 'Sign in with {{provider}}',
                    link_text: "Don't have an account? Sign up",
                  },
                  sign_up: {
                    email_label: 'Email address',
                    password_label: 'Create a password',
                    button_label: 'Sign up',
                    loading_button_label: 'Signing up...',
                    social_provider_text: 'Sign up with {{provider}}',
                    link_text: 'Already have an account? Sign in',
                  },
                  forgotten_password: {
                    email_label: 'Email address',
                    button_label: 'Send reset instructions',
                    loading_button_label: 'Sending...',
                    link_text: 'Remember your password? Sign in',
                  },
                },
              }}
            />
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>🔒 Your data is secure and private</p>
            <p>📱 Works offline after first sync</p>
            <p>🚀 Install as an app on your device</p>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}