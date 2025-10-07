import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Sparkles, Users, Zap, Shield } from 'lucide-react';

export function WelcomeCard() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Hero Section */}
        <div className="relative mb-8">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg blur opacity-20"></div>
          <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-200/50 shadow-2xl">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">
              Welcome to ChainChat
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
              The next-generation social platform powered by AI and blockchain technology.
            </p>

            <div className="flex justify-center">
              <ConnectButton />
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <FeatureCard
            icon={<Zap className="w-6 h-6" />}
            title="AI Powered"
            description="Personalized feeds powered by OG Chain's inference engine"
          />
          <FeatureCard
            icon={<Shield className="w-6 h-6" />}
            title="Decentralized"
            description="Your data, your control. Built on blockchain technology"
          />
          <FeatureCard
            icon={<Users className="w-6 h-6" />}
            title="Earn Rewards"
            description="Get rewarded for your content and engagement"
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white/50 backdrop-blur-lg rounded-xl p-6 border border-gray-200/30 shadow-sm hover:shadow-md transition-shadow">
      <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center text-indigo-600 mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}