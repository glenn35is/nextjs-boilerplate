'use client';

import { useState } from "react";
import { Button } from "../ui/button";
import WalletConnectModal from "./wallet-connect-modal";
import { Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { CreditCard, Wallet, AlertTriangle, Loader2, Check, Unlink, Shield } from "lucide-react";

interface PaymentProcessorProps {
  isOpen: boolean;
  onClose: () => void;
  planDetails: {
    hours: number;
    sol: number;
    label: string;
  } | null;
  onPaymentSuccess: () => void;
}

interface ConnectedWallet {
  address: string;
  balance: number;
}

declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      connect: () => Promise<{ publicKey: { toString: () => string } }>;
      disconnect: () => Promise<void>;
      isConnected: boolean;
      publicKey?: { toString: () => string };
      signTransaction: (transaction: any) => Promise<any>;
    };
  }
}

export default function PaymentProcessor({ isOpen, onClose, planDetails, onPaymentSuccess }: PaymentProcessorProps) {
  const [connectedWallet, setConnectedWallet] = useState<ConnectedWallet | null>(null);
  const [showWalletConnect, setShowWalletConnect] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleWalletConnected = (walletInfo: ConnectedWallet) => {
    setConnectedWallet(walletInfo);
    setShowWalletConnect(false);
  };

  const handleDisconnectWallet = () => {
    setConnectedWallet(null);
    if (window.solana) {
      window.solana.disconnect().catch(console.error);
    }
  };

  const processPayment = async () => {
    if (!planDetails || !connectedWallet) return;

    try {
      setIsProcessing(true);

      const requiredSOL = planDetails.sol;
      const transactionFee = 0.001;
      const totalRequired = requiredSOL + transactionFee;
      const availableSOL = connectedWallet.balance;
      
      if (availableSOL < totalRequired) {
        alert(`Insufficient balance. Need ${totalRequired.toFixed(3)} SOL but have ${availableSOL.toFixed(3)} SOL`);
        return;
      }

      // Production Web3 payment with Phantom
      if (!window.solana || !window.solana.isConnected) {
        throw new Error('Phantom wallet not connected');
      }

      const treasuryAddress = "6WgiZL5Aggq2XvTb4BJDkDh81nSmfjb9FTh66EkPKP1F";
      
      // Multiple RPC endpoints for reliability
      const rpcEndpoints = [
        'https://api.mainnet-beta.solana.com',
        'https://mainnet.helius-rpc.com/?api-key=',
        'https://solana-api.syndica.io/access-token/YOUR_TOKEN/rpc'
      ];
      
      let connection;
      for (const rpc of rpcEndpoints) {
        try {
          connection = new Connection(rpc, { commitment: 'confirmed' });
          await connection.getLatestBlockhash('finalized');
          break;
        } catch (e) {
          console.log(`RPC ${rpc} failed, trying next...`);
          continue;
        }
      }
      
      if (!connection) {
        throw new Error('All RPC endpoints failed');
      }

      // Create and send transaction
      const fromPubkey = new PublicKey(connectedWallet.address);
      const toPubkey = new PublicKey(treasuryAddress);
      const lamports = Math.floor(requiredSOL * LAMPORTS_PER_SOL);

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports,
        })
      );

      const blockHashInfo = await connection.getLatestBlockhash('finalized');
      transaction.recentBlockhash = blockHashInfo.blockhash;
      transaction.feePayer = fromPubkey;

      const signedTransaction = await window.solana.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');

      // Call backend to record payment
      const response = await fetch('/api/process-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hours: planDetails.hours,
          sol: planDetails.sol,
          walletAddress: connectedWallet.address,
          transactionHash: signature,
        }),
      });

      if (!response.ok) {
        throw new Error('Backend payment processing failed');
      }

      alert(`Payment successful! Transaction: ${signature}`);
      onPaymentSuccess();
      onClose();
      
    } catch (error: any) {
      console.error('Payment failed:', error);
      alert(`Payment failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  if (!planDetails || !isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 text-white max-w-md w-full mx-4 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <CreditCard className="text-green-400 mr-2 h-5 w-5" />
          <h2 className="text-xl font-bold">Complete Payment</h2>
        </div>

        {/* Plan Summary */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mb-4">
          <h3 className="font-semibold mb-2 text-green-400">Subscription Plan</h3>
          <div className="flex justify-between items-center">
            <span>{planDetails.label}</span>
            <span className="font-bold text-blue-400">{planDetails.sol} SOL</span>
          </div>
          <div className="text-sm text-gray-400 mt-1">
            Trading time: {planDetails.hours} hours
          </div>
        </div>

        {/* Wallet Connection */}
        <div className="space-y-3 mb-4">
          <h3 className="font-semibold">Payment Wallet</h3>
          
          {connectedWallet ? (
            <div className="bg-gray-800 rounded-lg p-4 border border-green-400">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    <span className="font-mono text-sm">{formatAddress(connectedWallet.address)}</span>
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    Balance: {connectedWallet.balance.toFixed(2)} SOL
                  </div>
                </div>
                <Button
                  onClick={handleDisconnectWallet}
                  className="text-gray-400 hover:text-red-400 px-3 py-1 text-sm"
                >
                  <Unlink className="mr-1 h-3 w-3" />
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setShowWalletConnect(true)}
              className="w-full bg-green-600 text-white hover:bg-green-700"
            >
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
          )}
        </div>

        {/* Payment Button */}
        {connectedWallet && (
          <div className="space-y-3">
            <div className="text-xs text-gray-400">
              By proceeding, you agree to pay {planDetails.sol} SOL for {planDetails.hours} hours of trading service.
            </div>
            
            <Button
              onClick={processPayment}
              disabled={isProcessing || connectedWallet.balance < planDetails.sol}
              className="w-full bg-blue-600 text-white hover:bg-blue-700 py-3"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Payment...
                </>
              ) : connectedWallet.balance < planDetails.sol ? (
                <>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Insufficient Balance
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Pay {planDetails.sol} SOL
                </>
              )}
            </Button>

            {connectedWallet.balance < planDetails.sol && (**🚀 Perfect! I've got all the code ready!**

Once you **commit those dependencies**, here's your **first file to create** on GitHub:

**📝 File 1: `app/components/payment-processor.tsx`**

Go to your GitHub repo → **Add file** → **Create new file** → Type filename: `app/components/payment-processor.tsx`

Then paste this **Next.js-optimized code:**

```typescript
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import WalletConnectModal from "./wallet-connect-modal";
import { Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { CreditCard, Wallet, AlertTriangle, Loader2, Check, Unlink, Keyboard, Shield } from "lucide-react";

interface PaymentProcessorProps {
  isOpen: boolean;
  onClose: () => void;
  planDetails: {
    hours: number;
    sol: number;
    label: string;
  } | null;
  onPaymentSuccess: () => void;
}

interface ConnectedWallet {
  address: string;
  balance: number;
}

export default function PaymentProcessor({ isOpen, onClose, planDetails, onPaymentSuccess }: PaymentProcessorProps) {
  const [connectedWallet, setConnectedWallet] = useState<ConnectedWallet | null>(null);
  const [showWalletConnect, setShowWalletConnect] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleWalletConnected = (walletInfo: ConnectedWallet) => {
    setConnectedWallet(walletInfo);
    setShowWalletConnect(false);
  };

  const handleDisconnectWallet = () => {
    setConnectedWallet(null);
    if (window.solana) {
      window.solana.disconnect().catch(console.error);
    }
  };

  const processPayment = async () => {
    if (!planDetails || !connectedWallet) return;

    try {
      setIsProcessing(true);

      // Check if wallet has sufficient balance including transaction fees
      const requiredSOL = planDetails.sol;
      const transactionFee = 0.001; // Solana transaction fee
      const totalRequired = requiredSOL + transactionFee;
      const availableSOL = connectedWallet.balance;
      
      console.log(`Payment check: Need ${requiredSOL} SOL + ${transactionFee} fee = ${totalRequired} SOL, Have ${availableSOL} SOL`);
      
      if (availableSOL < totalRequired) {
        toast({
          title: "Insufficient Balance",
          description: `You need ${totalRequired.toFixed(3)} SOL (including fees) but only have ${availableSOL.toFixed(3)} SOL. Please add more SOL to your wallet.`,
          variant: "destructive",
        });
        return;
      }
      
      console.log('Balance check passed, proceeding with payment...');

      // Production mode: Automated Web3 transaction with Phantom wallet approval
      console.log('🚀 Processing automated Web3 payment...');
      
      let transactionHash;
      
      try {
        if (!window.solana || !window.solana.isConnected) {
          throw new Error('Phantom wallet not connected. Please connect your wallet first.');
        }

        const treasuryAddress = "6WgiZL5Aggq2XvTb4BJDkDh81nSmfjb9FTh66EkPKP1F";
        
        toast({
          title: "Preparing Payment",
          description: "Setting up blockchain transaction...",
        });

        toast({
          title: "Connecting to Solana",
          description: "Establishing blockchain connection...",
        });

        // Use Helius free RPC endpoint (more reliable for production)
        const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=', { 
          commitment: 'confirmed', 
          confirmTransactionInitialTimeout: 30000 
        });

        toast({
          title: "Connected to Solana",
          description: "Creating transaction for Phantom approval...",
        });

        // Create the transaction
        const fromPubkey = new PublicKey(connectedWallet.address);
        const toPubkey = new PublicKey(treasuryAddress);
        const lamports = Math.floor(requiredSOL * LAMPORTS_PER_SOL);

        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: fromPubkey,
            toPubkey: toPubkey,
            lamports: lamports,
          })
        );

        // Get fresh blockhash for the transaction
        const blockHashInfo = await connection.getLatestBlockhash('finalized');
        transaction.recentBlockhash = blockHashInfo.blockhash;
        transaction.feePayer = fromPubkey;

        // Estimate transaction fee
        const fee = await transaction.getEstimatedFee(connection);
        const feeInSOL = fee ? fee / LAMPORTS_PER_SOL : 0.001;

        toast({
          title: "Wallet Approval Required",
          description: `Phantom will prompt to approve ${requiredSOL} SOL payment + ${feeInSOL.toFixed(4)} SOL gas fee`,
        });

        // Sign and send transaction through Phantom wallet
        const signedTransaction = await window.solana.signTransaction(transaction);
        
        toast({
          title: "Transaction Signed!",
          description: "Sending payment to blockchain...",
        });
        
        const signature = await connection.sendRawTransaction(signedTransaction.serialize());
        transactionHash = signature;

        toast({
          title: "Transaction Submitted!",
          description: `Confirming payment on Solana blockchain...`,
        });

        // Wait for transaction confirmation
        const confirmation = await connection.confirmTransaction(transactionHash, 'confirmed');
        
        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${confirmation.value.err}`);
        }

        toast({
          title: "Payment Confirmed!",
          description: `Transaction confirmed on blockchain. Gas fees included.`,
        });

        console.log(`✅ Payment confirmed on blockchain: ${transactionHash}`);

      } catch (error: any) {
        console.error('❌ Web3 payment failed:', error);
        
        let errorMessage = "Web3 transaction failed";
        let errorTitle = "Payment Failed";
        
        if (error.message?.includes('User rejected') || error.message?.includes('User denied')) {
          errorTitle = "Payment Cancelled";
          errorMessage = "You cancelled the transaction in your wallet";
        } else if (error.message?.includes('Phantom wallet not connected')) {
          errorTitle = "Wallet Issue";
          errorMessage = "Please make sure your Phantom wallet is connected and try again";
        } else if (error.message?.includes('Insufficient funds')) {
          errorTitle = "Insufficient Balance";
          errorMessage = "Your wallet doesn't have enough SOL for this transaction";
        } else if (error.message?.includes('simulation failed')) {
          errorTitle = "Transaction Failed";
          errorMessage = "Transaction simulation failed. Please check your wallet balance and try again.";
        } else if (error.message?.includes('blockhash') || error.message?.includes('network') || error.message?.includes('connection') || error.message?.includes('fetch')) {
          errorTitle = "Connection Issue";
          errorMessage = "Unable to connect to Solana blockchain. This may be due to mobile browser limitations. Please try using a desktop browser or the Phantom mobile app directly.";
        } else {
          errorMessage = `Payment failed: ${error.message || 'Unknown error occurred'}`;
        }
        
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }
      
      // Call backend API to record purchase
      const response = await fetch('/api/process-payment', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hours: planDetails.hours,
          sol: planDetails.sol,
          walletAddress: connectedWallet.address,
          transactionHash: transactionHash,
        }),
      });

      console.log('Purchase response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Payment error response:', errorData);
        throw new Error(`Payment processing failed: ${errorData}`);
      }

      const responseData = await response.json();
      
      toast({
        title: "Payment Successful!",
        description: `Successfully purchased ${planDetails.hours} hours of trading time.`,
      });

      onPaymentSuccess();
      onClose();
      setConnectedWallet(null);
      
    } catch (error) {
      console.error("Payment failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to process payment. Please try again.";
      toast({
        title: "Payment Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  if (!planDetails) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center">
              <CreditCard className="text-green-400 mr-2 h-4 w-4" />
              Complete Payment
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Plan Summary */}
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <h3 className="font-semibold mb-2 text-green-400">Subscription Plan</h3>
              <div className="flex justify-between items-center">
                <span>{planDetails.label}</span>
                <span className="font-bold text-blue-400">{planDetails.sol} SOL</span>
              </div>
              <div className="text-sm text-gray-400 mt-1">
                Trading time: {planDetails.hours} hours
              </div>
            </div>

            {/* Wallet Connection */}
            <div className="space-y-3">
              <h3 className="font-semibold">Payment Wallet</h3>
              
              {connectedWallet ? (
                <div className="bg-slate-800 rounded-lg p-4 border border-green-400">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                        <span className="font-mono text-sm">{formatAddress(connectedWallet.address)}</span>
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        Balance: {connectedWallet.balance.toFixed(2)} SOL
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDisconnectWallet}
                      className="text-gray-400 hover:text-red-400 px-3 py-1"
                      data-testid="button-disconnect-wallet"
                    >
                      <Unlink className="mr-1 h-3 w-3" />
                      Disconnect
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setShowWalletConnect(true)}
                  className="w-full bg-green-600 text-white hover:bg-green-700"
                  data-testid="button-connect-wallet"
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
                </Button>
              )}
            </div>

            {/* Payment Button */}
            {connectedWallet && (
              <div className="space-y-3">
                <div className="text-xs text-gray-400">
                  By proceeding, you agree to pay {planDetails.sol} SOL for {planDetails.hours} hours of trading service.
                </div>
                
                <Button
                  onClick={processPayment}
                  disabled={isProcessing || connectedWallet.balance < planDetails.sol}
                  className="w-full bg-blue-600 text-white hover:bg-blue-700 py-3"
                  data-testid="button-process-payment"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing Payment...
                    </>
                  ) : connectedWallet.balance < planDetails.sol ? (
                    <>
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Insufficient Balance
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Pay {planDetails.sol} SOL
                    </>
                  )}
                </Button>

                {connectedWallet.balance < planDetails.sol && (
                  <div className="text-xs text-red-400 text-center">
                    You need {(planDetails.sol - connectedWallet.balance).toFixed(2)} more SOL to complete this purchase.
                  </div>
                )}
              </div>
            )}

            {/* Security Notice */}
            <div className="text-xs text-gray-400 text-center bg-slate-800 rounded p-2">
              <Shield className="text-green-400 mr-1 h-3 w-3" />
              All transactions are processed securely on the Solana blockchain
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Wallet Connect Modal */}
      <WalletConnectModal
        isOpen={showWalletConnect}
        onClose={() => setShowWalletConnect(false)}
        onWalletConnected={handleWalletConnected}
      />
    </>
  );
}
