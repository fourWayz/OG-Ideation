import { useQuery } from '@tanstack/react-query';
import { useContract } from './useContract';
import { useTokenBalance } from './useTokenBalance';

export function useUserProfile(address?: string) {
  const { contract } = useContract();
  const { balance } = useTokenBalance(address);

  return useQuery({
    queryKey: ['userProfile', address],
    queryFn: async () => {
      if (!address || !contract) return null;
      
      try {
        const user = await contract.getUserByAddress(address);
        const userStats = await contract.getUserStats(address);
        
        return {
          username: user.username,
          profileImage: user.profileImage ? `/api/og/download/${user.profileImage}` : '',
          bio: user.bio,
          coverPhoto: user.coverPhoto ? `/api/og/download/${user.coverPhoto}` : '',
          interests: user.interests || [],
          postCount: Number(userStats.posts) || 0,
          likeCount: Number(userStats.likesGiven) || 0,
          commentCount: Number(userStats.comments) || 0,
          shareCount: Number(userStats.shares) || 0,
          balance: balance || 0,
          isRegistered: user.isRegistered,
          userAddress: user.userAddress,
        };
      } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
    },
    enabled: !!address && !!contract,
  });
}