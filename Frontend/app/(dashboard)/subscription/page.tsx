"use client";

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  CreditCard, 
  CheckCircle2,
  X,
  Mail,
  Globe,
  Settings,
  Crown,
  Zap,
  Building2,
} from 'lucide-react';
import { mockSubscription, mockSubscriptionPlans } from '@/data/mockSubscription';
import { formatCurrency, formatDate } from '@/lib/utils/format';

export default function SubscriptionPage() {
  const [subscription] = useState(mockSubscription);
  const [plans] = useState(mockSubscriptionPlans);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const currentPlan = plans.find(p => p.id === subscription.plan);

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free': return Zap;
      case 'basic': return Settings;
      case 'premium': return Crown;
      case 'enterprise': return Building2;
      default: return CreditCard;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'free': return 'border-gray-200 bg-gray-50';
      case 'basic': return 'border-blue-200 bg-blue-50';
      case 'premium': return 'border-teal-200 bg-teal-50';
      case 'enterprise': return 'border-purple-200 bg-purple-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-teal-50 via-cyan-50 to-teal-50 border-2 border-teal-200">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Subscription & Billing</h1>
            <p className="text-xs text-gray-600 mt-0.5">Manage your subscription and payment methods</p>
          </div>
        </div>

        {/* Current Subscription */}
        <Card className="border-2 border-teal-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Current Plan</CardTitle>
                <CardDescription>
                  {subscription.status === 'active' ? 'Active subscription' : 'Subscription status'}
                </CardDescription>
              </div>
              <Badge variant={subscription.status === 'active' ? 'success' : 'warning'}>
                {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {currentPlan && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-lg ${getPlanColor(currentPlan.id)}`}>
                    {(() => {
                      const Icon = getPlanIcon(currentPlan.id);
                      return <Icon className="h-8 w-8 text-teal-600" />;
                    })()}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">{currentPlan.name} Plan</h3>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(currentPlan.price)}/{subscription.billingInterval === 'monthly' ? 'month' : 'year'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">Next billing date</p>
                    <p className="text-sm font-semibold">{formatDate(subscription.currentPeriodEnd)}</p>
                  </div>
                </div>

                {/* Plan Features */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-2">Plan Features</p>
                    <ul className="space-y-1">
                      {currentPlan.features.slice(0, 4).map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs">
                          <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-2">Limits</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Documents:</span>
                        <span className="font-medium">
                          {currentPlan.maxDocuments === 'unlimited' ? 'Unlimited' : currentPlan.maxDocuments}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Distributors:</span>
                        <span className="font-medium">
                          {currentPlan.maxDistributors === 'unlimited' ? 'Unlimited' : currentPlan.maxDistributors}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Support:</span>
                        <span className="font-medium capitalize">{currentPlan.supportLevel}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                {subscription.paymentMethod && (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="text-sm font-medium">
                            {subscription.paymentMethod.brand} •••• {subscription.paymentMethod.last4}
                          </p>
                          <p className="text-xs text-gray-600">
                            Expires {subscription.paymentMethod.expiryMonth}/{subscription.paymentMethod.expiryYear}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPaymentForm(!showPaymentForm)}
                      >
                        Update
                      </Button>
                    </div>
                  </div>
                )}

                {/* Payment Form */}
                {showPaymentForm && (
                  <Card className="border-2 border-blue-200">
                    <CardHeader>
                      <CardTitle className="text-base">Update Payment Method</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Card Number</label>
                        <input
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          className="w-full px-3 py-2 border border-input rounded-lg text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Expiry Date</label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            className="w-full px-3 py-2 border border-input rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">CVV</label>
                          <input
                            type="text"
                            placeholder="123"
                            className="w-full px-3 py-2 border border-input rounded-lg text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setShowPaymentForm(false)}
                          variant="outline"
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button className="flex-1 bg-teal-600 hover:bg-teal-700">
                          Save Payment Method
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" className="flex-1">
                    Change Plan
                  </Button>
                  {subscription.cancelAtPeriodEnd ? (
                    <Button variant="outline" className="flex-1 text-green-600 border-green-300">
                      Reactivate Subscription
                    </Button>
                  ) : (
                    <Button variant="outline" className="flex-1 text-red-600 border-red-300">
                      Cancel Subscription
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Plans */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Available Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {plans.map((plan) => {
              const Icon = getPlanIcon(plan.id);
              const isCurrentPlan = plan.id === subscription.plan;
              
              return (
                <Card
                  key={plan.id}
                  className={`border-2 ${
                    isCurrentPlan
                      ? 'border-teal-500 bg-teal-50'
                      : getPlanColor(plan.id)
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${
                        isCurrentPlan ? 'bg-teal-100' : 'bg-gray-100'
                      }`}>
                        <Icon className={`h-6 w-6 ${
                          isCurrentPlan ? 'text-teal-600' : 'text-gray-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base">{plan.name}</CardTitle>
                        <p className="text-2xl font-bold mt-1">
                          {plan.price === 0 ? 'Free' : formatCurrency(plan.price)}
                          {plan.price > 0 && <span className="text-sm font-normal text-gray-600">/mo</span>}
                        </p>
                      </div>
                    </div>
                    {isCurrentPlan && (
                      <Badge variant="success" className="text-xs">Current Plan</Badge>
                    )}
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-4">
                      {plan.features.slice(0, 5).map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs">
                          <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full ${
                        isCurrentPlan
                          ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                          : 'bg-teal-600 hover:bg-teal-700'
                      }`}
                      disabled={isCurrentPlan}
                    >
                      {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Integration Settings */}
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base">Integration Settings</CardTitle>
            <CardDescription>Configure automatic data collection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Email Integration</p>
                  <p className="text-xs text-gray-600">Forward emails from reverse distributors</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Portal Auto-Fetch</p>
                  <p className="text-xs text-gray-600">Automatically fetch from distributor portals</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Manage Credentials
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

