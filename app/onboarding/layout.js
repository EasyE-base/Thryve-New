import OnboardingProvider from '@/components/onboarding/OnboardingProvider'

export default function OnboardingLayout({ children }) {
  return (
    <OnboardingProvider>
      {children}
    </OnboardingProvider>
  )
} 