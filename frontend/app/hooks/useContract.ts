'use client';

import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import Chainchat from '@/app/lib/abis/ChainchatAI.json';
import {CONTRACT_ADDRESS} from '@/app/lib/constants';

export function useContract() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
 
  useEffect(() => {
    const initializeContract = async () => {
      if (!walletClient || !address) return;

      try {
        // Convert viem wallet to ethers signer
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();
        
        const contractInstance = new ethers.Contract(
          CONTRACT_ADDRESS as `0x${string}`,
          Chainchat.abi as any,
          signer
        );
        
        setSigner(signer);
        setContract(contractInstance);
      } catch (error) {
        console.error('Failed to initialize contract:', error);
      }
    };

    initializeContract();
  }, [walletClient, address]);

  return { contract, signer, address };
}