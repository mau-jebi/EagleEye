'use client'

import { AuthWrapper } from '@/components/AuthWrapper'
import { EagleEyeAppWithSupabase } from '@/components/EagleEyeAppWithSupabase'

export default function Home() {
  return (
    <AuthWrapper>
      <EagleEyeAppWithSupabase />
    </AuthWrapper>
  )
}
