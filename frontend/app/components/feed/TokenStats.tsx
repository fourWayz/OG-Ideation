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
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner className="border-white border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
      <h3 className="font-semibold mb-4 flex items-center space-x-2">
        <Coins className="w-5 h-5" />
        <span>Your Rewards</span>
      </h3>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-indigo-100">Balance</span>
          <span className="font-bold text-lg">{formatTokenAmount(balance)} CC</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-indigo-100">Available Rewards</span>
          <span className="font-semibold">{formatTokenAmount(rewards)} CC</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-indigo-100 flex items-center space-x-1">
            <FileText className="w-4 h-4" />
            <span>Free Posts</span>
          </span>
          <span className="font-semibold">{freePosts} remaining</span>
        </div>
        
        <div className="pt-4 border-t border-indigo-400/30">
          <button className="w-full bg-white text-indigo-600 py-2 rounded-lg font-semibold hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            Claim Rewards
          </button>
        </div>
      </div>
    </div>
  );
}