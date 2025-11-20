'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card'
import { authService } from '@/lib/api/services'

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form data
  const [pharmacyName, setPharmacyName] = useState('')
  const [npiNumber, setNpiNumber] = useState('')
  const [deaNumber, setDeaNumber] = useState('')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (step < 3) {
      setStep(step + 1)
    } else {
      handleSubmit()
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      await authService.signup({
        email,
        password,
        name: contactName,
        pharmacyName,
        phone,
      })
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="text-3xl font-bold text-primary">PharmAnalytics</div>
          </div>
          <CardTitle className="text-2xl text-center">Create your account</CardTitle>
          <CardDescription className="text-center">
            Step {step} of 3 - {step === 1 ? 'Basic Information' : step === 2 ? 'Contact Details' : 'Account Setup'}
          </CardDescription>

          {/* Progress indicator */}
          <div className="flex gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full ${
                  s <= step ? 'bg-primary' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </CardHeader>

        <form onSubmit={handleNext}>
          <CardContent className="space-y-4">
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <label htmlFor="pharmacyName" className="text-sm font-medium">
                    Pharmacy Name *
                  </label>
                  <Input
                    id="pharmacyName"
                    placeholder="HealthCare Pharmacy"
                    value={pharmacyName}
                    onChange={(e) => setPharmacyName(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="npiNumber" className="text-sm font-medium">
                      NPI Number *
                    </label>
                    <Input
                      id="npiNumber"
                      placeholder="1234567890"
                      maxLength={10}
                      value={npiNumber}
                      onChange={(e) => setNpiNumber(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="deaNumber" className="text-sm font-medium">
                      DEA Number *
                    </label>
                    <Input
                      id="deaNumber"
                      placeholder="AB1234563"
                      maxLength={9}
                      value={deaNumber}
                      onChange={(e) => setDeaNumber(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <label htmlFor="contactName" className="text-sm font-medium">
                    Contact Name *
                  </label>
                  <Input
                    id="contactName"
                    placeholder="John Smith"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email Address *
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@pharmacy.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium">
                    Phone Number *
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <h3 className="font-medium mb-2">Review your information</h3>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Pharmacy:</dt>
                      <dd className="font-medium">{pharmacyName}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Contact:</dt>
                      <dd className="font-medium">{contactName}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Email:</dt>
                      <dd className="font-medium">{email}</dd>
                    </div>
                  </dl>
                </div>
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Create Password *
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 8 characters
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="terms"
                    className="mt-1"
                    required
                  />
                  <label htmlFor="terms" className="text-sm text-muted-foreground">
                    I agree to the Terms of Service and Privacy Policy
                  </label>
                </div>
              </>
            )}
          </CardContent>

          <CardFooter className="flex justify-between">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(step - 1)}
              >
                Back
              </Button>
            )}
            <Button type="submit" className="ml-auto" disabled={loading}>
              {loading ? 'Creating account...' : step === 3 ? 'Create Account' : 'Next'}
            </Button>
          </CardFooter>
        </form>

        <div className="p-6 pt-0 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </Card>
    </div>
  )
}
