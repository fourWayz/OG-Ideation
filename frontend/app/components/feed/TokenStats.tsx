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
      <div className="glass-card rounded-3xl p-8">
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner className="border-gray-400 border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-3xl p-8">
      <h3 className="font-semibold text-xl mb-6 flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-white/50 to-white/30 rounded-2xl flex items-center justify-center border border-white/40 shadow-sm">
          <Coins className="w-5 h-5 text-gray-700" />
        </div>
        <span className="text-gray-900">Your Rewards</span>
      </h3>
      
      <div className="space-y-6">
        <div className="flex justify-between items-center py-3 border-b border-gray-200/50">
          <span className="text-gray-600">Balance</span>
          <span className="font-bold text-2xl text-gray-900">{balance} CC</span>
        </div>
        
        <div className="flex justify-between items-center py-3 border-b border-gray-200/50">
          <span className="text-gray-600">Available Rewards</span>
          <span className="font-semibold text-xl text-gray-900">{formatTokenAmount(rewards)} CC</span>
        </div>

        <div className="flex justify-between items-center py-3">
          <span className="text-gray-600 flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Free Posts</span>
          </span>
          <span className="font-semibold text-xl text-gray-900">{freePosts} remaining</span>
        </div>
        
        <div className="pt-6 border-t border-gray-200/50">
          <button className="w-full bg-white/80 backdrop-blur-md text-gray-900 py-4 rounded-xl font-semibold hover:bg-white hover:shadow-lg border border-white/40 transition-all duration-200 shadow-md">
            Claim Rewards
          </button>
        </div>
      </div>
    </div>
  );
}