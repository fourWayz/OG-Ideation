'use client';

import { useAccount } from 'wagmi';
import { useTokenBalance } from '@/app/hooks/useTokenBalance';
import { Coins, TrendingUp, Users, FileText } from 'lucide-react';
import { LoadingSpinner } from '@/app/components/ui/LoadingSpinner';
import { formatTokenAmount } from '@/app/lib/utils';

export function TokenStats() {
  const { address } = useAccount();
  const { balance, rewards, freePosts, isLoading } = useTokenBalance(address);

  if (isLoading) {
    return (
      <div className="glass-card rounded-3xl p-8 text-white">
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner className="border-white border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-3xl p-8 text-white">
      <h3 className="font-semibold text-xl mb-6 flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-white/30 to-white/10 rounded-2xl flex items-center justify-center border border-white/20">
          <Coins className="w-5 h-5" />
        </div>
        <span className="text-glow">Your Rewards</span>
      </h3>
      
      <div className="space-y-6">
        <div className="flex justify-between items-center py-3 border-b border-white/20">
          <span className="text-white/70">Balance</span>
          <span className="font-bold text-2xl text-glow">{formatTokenAmount(balance)} CC</span>
        </div>
        
        <div className="flex justify-between items-center py-3 border-b border-white/20">
          <span className="text-white/70">Available Rewards</span>
          <span className="font-semibold text-xl">{formatTokenAmount(rewards)} CC</span>
        </div>

        <div className="flex justify-between items-center py-3">
          <span className="text-white/70 flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Free Posts</span>
          </span>
          <span className="font-semibold text-xl">{freePosts} remaining</span>
        </div>
        
        <div className="pt-6 border-t border-white/20">
          <button className="w-full bg-gradient-to-r from-white/30 to-white/10 text-white py-4 rounded-xl font-semibold hover:bg-white/20 border border-white/20 hover:border-white/30 transition-all duration-200 backdrop-blur-sm">
            Claim Rewards
          </button>
        </div>
      </div>
    </div>
  );
}