import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { useContract } from './useContract';
import { useEffect, useState } from 'react';

export function useUserRegistration() {
  const { address, isConnected } = useAccount();
  const { contract } = useContract();
  const queryClient = useQueryClient();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Check if user is registered
  const { 
    data: isRegistered, 
    isLoading: isLoadingRegistration,
    error,
    refetch,
    isFetched 
  } = useQuery({
    queryKey: ['userRegistration', address],
    queryFn: async (): Promise<boolean> => {
      if (!address || !contract) return false;

      try {
        console.log('🔍 Checking registration for:', address);
        const user = await contract.getUserByAddress(address);
        console.log('✅ User is registered:', user.isRegistered);
        return user.isRegistered;
      } catch (error: any) {
        console.log('❌ User not registered:', error?.message);
        return false;
      }
    },
    enabled: !!address && !!contract && isConnected,
    staleTime: Infinity, 
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });

  // Track when initial load is complete
  useEffect(() => {
    if (isFetched && isInitialLoad) {
      console.log('🎯 Initial registration check complete');
      setIsInitialLoad(false);
    }
  }, [isFetched, isInitialLoad]);

  // Reset initial load when address changes
  useEffect(() => {
    setIsInitialLoad(true);
  }, [address]);

  const registerMutation = useMutation({
    mutationFn: async (username: string) => {
      if (!contract || !address) {
        throw new Error('Contract or address not available');
      }

      console.log('🚀 Registering user:', username);
      const tx = await contract.registerUser(address, username);
      console.log('📝 Transaction sent:', tx.hash);
      
      await tx.wait();
      console.log('✅ Registration confirmed');
      return true;
    },
    onSuccess: () => {
      console.log('🔄 Invalidating queries after registration');
      queryClient.invalidateQueries({ queryKey: ['userRegistration', address] });
      queryClient.invalidateQueries({ queryKey: ['userProfile', address] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  return {
    isRegistered: isRegistered ?? false,
    isLoading: isLoadingRegistration || isInitialLoad,
    isFetched,
    isInitialLoad,
    error,
    registerUser: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    refetchRegistration: refetch,
  };
}