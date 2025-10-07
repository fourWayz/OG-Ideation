import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { useContract } from '@/app/hooks/useContract';
import { useEffect, useState } from 'react';

export function useUserRegistration() {
  const { address, isConnected } = useAccount();
  const { contract } = useContract();
  const queryClient = useQueryClient();
  const [hasChecked, setHasChecked] = useState(false);

  // Check if user is registered
  const { data: isRegistered, isLoading: isLoadingRegistration } = useQuery({
    queryKey: ['userRegistration', address],
    queryFn: async () => {
      if (!address || !contract) return false;

      try {
        const user = await contract.getUserByAddress(address);
        return user.isRegistered;
      } catch (error) {
        return false;
      }
    },
    enabled: !!address && !!contract && isConnected,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Reset hasChecked when address changes
  useEffect(() => {
    setHasChecked(false);
  }, [address]);

  // Set hasChecked when registration status is loaded
  useEffect(() => {
    if (!isLoadingRegistration && isConnected) {
      setHasChecked(true);
    }
  }, [isLoadingRegistration, isConnected]);

  const registerMutation = useMutation({
    mutationFn: async (username: string) => {
      if (!contract || !address) {
        throw new Error('Contract or address not available');
      }

      const tx = await contract.registerUser(address, username);
      await tx.wait();
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userRegistration', address] });
      queryClient.invalidateQueries({ queryKey: ['userProfile', address] });
    },
  });

  return {
    isRegistered: isRegistered ?? false,
    isLoading: isLoadingRegistration,
    hasChecked,
    registerUser: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
  };
}