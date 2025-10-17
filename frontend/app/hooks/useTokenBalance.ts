'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { useContract } from './useContract';
import { CC_TOKEN_ADDRESS } from '../lib/constants';
import tokenABI from '@/app/lib/abis/CCToken.json';


export function useTokenBalance(address?: string) {
  const { contract } = useContract();
  const { address: userAddress } = useAccount();

  const targetAddress = address || userAddress;

  // Get CC token balance
 const { data: balance = '0', isLoading: balanceLoading } = useQuery({
    queryKey: ['tokenBalance', targetAddress],
    queryFn: async () => {
      if (!targetAddress) return '0';

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const tokenContract = new ethers.Contract(CC_TOKEN_ADDRESS, tokenABI.abi, provider);

        const bal = await tokenContract.balanceOf(targetAddress);
        console.log('Raw balance:', bal.toString());
        const decimals = await tokenContract.decimals();

        return ethers.formatUnits(bal, decimals); // return string
      } catch (err) {
        console.error('Error fetching token balance:', err);
        return '0';
      }
    },
    enabled: !!targetAddress,        
    refetchInterval: 30_000,
  });


  const { data: rewards = 0, isLoading: rewardsLoading } = useQuery({
    queryKey: ['availableRewards', targetAddress],
    queryFn: async () => {
      if (!targetAddress || !contract) return 0;

      try {
       
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