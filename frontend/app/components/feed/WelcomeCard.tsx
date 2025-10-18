import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Sparkles, Users, Zap, Shield } from 'lucide-react';

export function WelcomeCard() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="max-w-4xl mx-auto text-center">
        {/* Hero Section */}
        <div className="relative mb-12">
          <div className="glass-card rounded-3xl p-12">
            <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-r from-white/50 to-white/30 rounded-2xl flex items-center justify-center border border-white/40 backdrop-blur-sm shadow-lg">
              <Sparkles className="w-12 h-12 text-gray-700" />
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Welcome to ChainChat
            </h1>
            
            <p className="text-xl text-gray-700 mb-8 max-w-md mx-auto leading-relaxed">
              The next-generation social platform powered by AI and blockchain technology.
            </p>

            <div className="flex justify-center">
              <div className="glass rounded-2xl">
                <ConnectButton />
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <GlassFeatureCard
            icon={<Zap className="w-8 h-8" />}
            title="AI Powered"
            description="Personalized feeds powered by OG Chain's inference engine"
          />
          <GlassFeatureCard
            icon={<Shield className="w-8 h-8" />}
            title="Decentralized"
            description="Your data, your control. Built on blockchain technology"
          />
          <GlassFeatureCard
            icon={<Users className="w-8 h-8" />}
            title="Earn Rewards"
            description="Get rewarded for your content and engagement"
          />
        </div>
      </div>
    </div>
  );
}

function GlassFeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="glass-card rounded-2xl p-8 text-center group hover:bg-white/90 transition-all duration-300 hover:scale-105">
      <div className="w-16 h-16 bg-gradient-to-br from-white/50 to-white/30 rounded-2xl flex items-center justify-center text-gray-700 mx-auto mb-6 border border-white/40 shadow-sm">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 text-xl mb-3">{title}</h3>
      <p className="text-gray-700 leading-relaxed">{description}</p>
    </div>
  );
}