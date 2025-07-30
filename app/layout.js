import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import AuthProvider from '@/components/auth-provider'
import OnboardingProvider from '@/components/onboarding/OnboardingProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Thryve - Multi-Role Fitness Platform',
  description: 'Book classes, teach fitness, manage your studio - all in one platform',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <OnboardingProvider>
            {children}
          </OnboardingProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  )
}