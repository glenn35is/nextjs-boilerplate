'use client'

import { useState, useEffect } from 'react'
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { Button } from '@/app/ui/button'
import { WalletConnectModal } from './wallet-connect-modal'
import { useToast } from '@/app/hooks/use-toast'

interface PaymentProcessorProps {
  plan: 'basic' | 'pro' | 'premium'
  onPaymentSuccess: () => void
}

interface ConnectedWallet {
  address: string
  balance: number
}

const PLAN_DETAILS = {
  basic: { sol: 0.1, name: 'Basic Plan', features: ['Volume Generation', 'Basic Analytics'] },
  pro: { sol: 0.25, name: 'Pro Plan', features: ['Volume Generation', 'Market Making', 'Advanced Analytics'] },
  premium: { sol: 0.5, name: 'Premium Plan', features: ['All Features', 'Custom Strategies', 'Priority Support'] }
}

const TREASURY_WALLET = '6WgiZL5Aggq2XvTb4BJDkDh81nSmfjb9FTh66EkPKP1F'

export function PaymentProcessor({ plan, onPaymentSuccess }: PaymentProcessorProps) {
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [connectedWallet, setConnectedWallet] = useState<ConnectedWallet | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  const planDetails = PLAN_DETAILS[plan]

  const handleWalletConnect = async (walletAddress: string) => {
    try {
      const connection = new Connection('https://api.mainnet-beta.solana.com')
      const publicKey = new PublicKey(walletAddress)
      const balance = await connection.getBalance(publicKey)
      
      setConnectedWallet({
        address: walletAddress,
        balance: balance / LAMPORTS_PER_SOL
      })
      setShowWalletModal(false)
      
      toast({
        title: "Wallet Connected",
        description: `Connected with ${balance / LAMPORTS_PER_SOL} SOL`,
      })
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet",
        variant: "destructive",
      })
    }
  }

  const handlePayment = async () => {
    if (!connectedWallet) return

    setIsProcessing(true)
    try {
      const response = await fetch('/api/process-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAddress: connectedWallet.address,
          amount: planDetails.sol,
          plan: plan
        })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Payment Successful!",
          description: `Welcome to ${planDetails.name}!`,
        })
        onPaymentSuccess()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Payment processing failed",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">{planDetails.name}</h2>
        <p className="text-green-400 text-3xl font-bold">{planDetails.sol} SOL</p>
      </div>

      <div className="space-y-2">
        {planDetails.features.map((feature, index) => (
          <div key={index} className="flex items-center text-white">
            <span className="text-green-400 mr-2">✓</span>
            {feature}
          </div>
        ))}
      </div>

      {!connectedWallet ? (
        <Button 
          onClick={() => setShowWalletModal(true)}
          className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
        >
          Connect Wallet
        </Button>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-gray-800 rounded-lg">
            <p className="text-white">Wallet: {connectedWallet.address.slice(0, 8)}...{connectedWallet.address.slice(-8)}</p>
            <p className="text-green-400">Balance: {connectedWallet.balance.toFixed(4)} SOL</p>
          </div>

          <Button 
            onClick={handlePayment}
            disabled={isProcessing || connectedWallet.balance < planDetails.sol}
            className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : `Pay ${planDetails.sol} SOL`}
          </Button>

          {connectedWallet.balance < planDetails.sol && (
            <p className="text-red-400 text-sm text-center">
              Insufficient balance. You need {planDetails.sol} SOL but have {connectedWallet.balance.toFixed(4)} SOL.
            </p>
          )}
        </div>
      )}

      <WalletConnectModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnect={handleWalletConnect}
      />
    </div>
  )
}
