export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            🤖 MK Volume Bot
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Professional Solana Trading Automation
          </p>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Boost your tokens trading volume with our advanced bot system. 
            Automated market making, volume generation, and ranking optimization.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
            <h3 className="text-2xl font-bold text-green-400 mb-4">Basic Plan</h3>
            <div className="text-4xl font-bold text-green-400 mb-6">0.1 SOL</div>
            <ul className="space-y-3 text-left">
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span> Volume Generation
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span> Basic Analytics
              </li>
            </ul>
            <button className="w-full mt-8 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors">
              Get Started
            </button>
          </div>

          <div className="bg-gray-900 border border-blue-500 rounded-lg p-8 text-center relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
              POPULAR
            </div>
            <h3 className="text-2xl font-bold text-blue-400 mb-4">Pro Plan</h3>
            <div className="text-4xl font-bold text-blue-400 mb-6">0.25 SOL</div>
            <ul className="space-y-3 text-left">
              <li className="flex items-center">
                <span className="text-blue-400 mr-2">✓</span> Volume Generation
              </li>
              <li className="flex items-center">
                <span className="text-blue-400 mr-2">✓</span> Market Making
              </li>
              <li className="flex items-center">
                <span className="text-blue-400 mr-2">✓</span> Advanced Analytics
              </li>
            </ul>
            <button className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors">
              Get Started
            </button>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
            <h3 className="text-2xl font-bold text-orange-400 mb-4">Premium Plan</h3>
            <div className="text-4xl font-bold text-orange-400 mb-6">0.5 SOL</div>
            <ul className="space-y-3 text-left">
              <li className="flex items-center">
                <span className="text-orange-400 mr-2">✓</span> All Features
              </li>
              <li className="flex items-center">
                <span className="text-orange-400 mr-2">✓</span> Custom Strategies
              </li>
              <li className="flex items-center">
                <span className="text-orange-400 mr-2">✓</span> Priority Support
              </li>
            </ul>
            <button className="w-full mt-8 bg-orange-600 hover:bg-orange-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors">
              Get Started
            </button>
          </div>
        </div>

        <div className="text-center mt-16">
          <p className="text-gray-400 mb-4">
            Treasury Wallet: <span className="text-green-400 font-mono">6WgiZL5Aggq2XvTb4BJDkDh81nSmfjb9FTh66EkPKP1F</span>
          </p>
          <p className="text-gray-500 text-sm">
            Connect your wallet to start automated trading
          </p>
        </div>
      </div>
    </div>
  )
}
