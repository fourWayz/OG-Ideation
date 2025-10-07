'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { useContract } from './useContract';
import { CC_TOKEN_ADDRESS } from '../lib/constants';

// ERC20 ABI for basic token functions
const tokenABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)"
];

export function useTokenBalance(address?: string) {
  const { contract } = useContract();
  const { address: userAddress } = useAccount();

  const targetAddress = address || userAddress;

  // Get CC token balance
  const { data: balance = 0, isLoading: balanceLoading } = useQuery({
    queryKey: ['tokenBalance', targetAddress],
    queryFn: async () => {
      if (!targetAddress) return 0;

      try {
        // Get token address from contract
        // const tokenAddress = await contract?.ccToken();
        // if (!tokenAddress) return 0;

        // Create token contract instance
        const provider = new ethers.BrowserProvider(window.ethereum);
        const tokenContract = new ethers.Contract(CC_TOKEN_ADDRESS, tokenABI, provider);
        
        const balance = await tokenContract.balanceOf(targetAddress);
        const decimals = await tokenContract.decimals();
        
        // Convert from wei to token units
        return Number(ethers.formatUnits(balance, decimals));
      } catch (error) {
        console.error('Error fetching token balance:', error);
        return 0;
      }
    },
    enabled: !!targetAddress && !!contract,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Get available rewards (simplified - you might want to calculate this from engagement)
  const { data: rewards = 0, isLoading: rewardsLoading } = useQuery({
    queryKey: ['availableRewards', targetAddress],
    queryFn: async () => {
      if (!targetAddress || !contract) return 0;

      try {
        // This is a simplified calculation - you might want to implement
        // the actual reward calculation based on user activity
        const userStats = await contract.getUserStats(targetAddress);
        
        // Calculate potential rewards based on activity since last claim
        const posts = Number(userStats.posts) || 0;
        const comments = Number(userStats.comments) || 0;
        const shares = Number(userStats.shares) || 0;

        // Use contract reward rates (these would need to be fetched from contract)
        const rewardPerPost = 2; // These should come from contract
        const rewardPerComment = 1;
        const rewardPerShare = 1;

        return (posts * rewardPerPost) + (comments * rewardPerComment) + (shares * rewardPerShare);
      } catch (error) {
        console.error('Error calculating rewards:', error);
        return 0;
      }
    },
    enabled: !!targetAddress && !!contract,
  });

  // Get free posts remaining
  const { data: freePosts = 0, isLoading: freePostsLoading } = useQuery({
    queryKey: ['freePosts', targetAddress],
    queryFn: async () => {
      if (!targetAddress || !contract) return 0;

      try {
        const freePosts = await contract.getFreePostsRemaining(targetAddress);
        return Number(freePosts);
      } catch (error) {
        console.error('Error fetching free posts:', error);
        return 0;
      }
    },
    enabled: !!targetAddress && !!contract,
  });

  return {
    balance,
    rewards,
    freePosts,
    isLoading: balanceLoading || rewardsLoading || freePostsLoading,
  };
}