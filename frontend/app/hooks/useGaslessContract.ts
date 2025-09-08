import { useCallback } from 'react';
import { useWalletClient } from 'wagmi';
import { ethers } from 'ethers';
import { useGaslessTransactions } from './useGaslessTransactions';
import ChainChatAIABI from '@/app/abis/ChainchatAI.json';

export const useGaslessContract = () => {
  const { data: walletClient } = useWalletClient();
  const { relayTransaction } = useGaslessTransactions();

  const getContract = useCallback(() => {
    if (!walletClient) throw new Error('No wallet client available');

    const provider = new ethers.BrowserProvider(walletClient);
    return new ethers.Contract(
      process.env.NEXT_PUBLIC_CHAINCHAT_AI_ADDRESS!,
      ChainChatAIABI.abi,
      provider
    );
  }, [walletClient]);

  const createPost = useCallback(async (contentCID: string, imageCID: string = '') => {
    const contract = getContract();
    const data = contract.interface.encodeFunctionData('createPost', [contentCID, imageCID]);
    return await relayTransaction(contract.target as string, data);
  }, [getContract, relayTransaction]);

  const likePost = useCallback(async (postId: number) => {
    const contract = getContract();
    const data = contract.interface.encodeFunctionData('likePost', [postId]);
    return await relayTransaction(contract.target as string, data);
  }, [getContract, relayTransaction]);

  const addComment = useCallback(async (postId: number, content: string) => {
    const contract = getContract();
    const data = contract.interface.encodeFunctionData('addComment', [postId, content]);
    return await relayTransaction(contract.target as string, data);
  }, [getContract, relayTransaction]);

  const registerUser = useCallback(async (creator: string, username: string) => {
    const contract = getContract();
    const data = contract.interface.encodeFunctionData('registerUser', [creator, username]);
    return await relayTransaction(contract.target as string, data);
  }, [getContract, relayTransaction]);

  return {
    createPost,
    likePost,
    addComment,
    registerUser,
    getContract,
  };
};
