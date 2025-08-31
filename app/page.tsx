'use client';

import { useState } from 'react';
import PaymentProcessor from './components/payment-processor';
import { Button } from './ui/button';

export default function Home() {
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  const plans = [
    {
      hours: 24,
      sol: 0.1,
      label: "Starter Plan - 24 Hours"
    },
    {
      hours: 168,
      sol: 0.5,
      label: "Weekly Plan - 7 Days"
    },
    {
      hours: 720,
      sol: 1.5,
      label: "Monthly Plan - 30 Days"
    }
  ];

  const handleSelectPlan = (plan: any) => {
    setSelectedPlan(plan);
    setShowPayment(true);
  };

  const handlePaymentSuccess = () => {
    alert('🎉 Payment successful! Your MK Volume Bot trading time has been added to your account.');
    setShowPayment(false);
    setSelectedPlan(null);
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-green-400 mb-4">
            🤖 MK Volume Bot
          </h1>
          <p className="text-xl text-gray-300">
            Professional Cryptocurrency Trading Automation
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Now deployed on Vercel with full Web3 functionality!
          </p>
        </header>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan, index) => (
            <div key={index} className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-green-400 mb-2">
                {plan.label}
              </h3>
              <div className="text-3xl font-bold text-blue-400 mb-4">
                {plan.sol} SOL
              </div>
              <p className="text-gray-300 mb-6">
                {plan.hours} hours of automated trading with MK Volume Bot
              </p>
              <Button
                onClick={() => handleSelectPlan(plan)}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Select Plan
              </Button>
            </div>
          ))}
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-green-400 mb-4">
            ✅ MK Volume Bot - Vercel Deployment Features
          </h2>
          <ul className="space-y-2 text-gray-300">
            <li>• ✅ Real Solana & Sui RPC connections (no restrictions)</li>
            <li>• ✅ Phantom wallet integration works perfectly</li>
            <li>• ✅ Live SOL transactions on mainnet</li>
            <li>• ✅ Auto-deployment from GitHub</li>
            <li>• ✅ Production-ready Web3 infrastructure for MK Volume Bot</li>
          </ul>
        </div>

        <footer className="text-center mt-8 text-gray-400">
          <p>Ready to test real SOL payments with MK Volume Bot? Click any plan above! 🚀</p>
        </footer>
      </div>

      <PaymentProcessor
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        planDetails={selectedPlan}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </main>
  );
}
