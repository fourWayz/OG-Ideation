import { useCallback, useMemo } from 'react'
import { useWalletClient } from 'wagmi'
import { ethers } from 'ethers'
import { getRelayerClient } from '@/app/lib/relayer'

export const useGaslessTransactions = () => {
  const { data: walletClient } = useWalletClient()

  const signer = useMemo(() => {
    const provider = new ethers.BrowserProvider(window.ethereum!)
    return provider.getSigner()
  }, [walletClient])

  const relayTransaction = useCallback(
    async (to: string, data: string, value: bigint = BigInt(0)) => {
      if (!signer) throw new Error('No signer available')

      const relayer = getRelayerClient(await signer)
      return await relayer.relayTransaction(to, data, value)
    },
    [signer],
  )

  const loginToRelayer = useCallback(async () => {
    if (!signer) throw new Error('No signer available')

    const relayer = getRelayerClient(await signer)
    return await relayer.login()
  }, [signer])

  const getRelayerStatus = useCallback(async () => {
    if (!signer) throw new Error('No signer available')

    const relayer = getRelayerClient(await signer)
    return await relayer.getStatus()
  }, [signer])

  return {
    relayTransaction,
    loginToRelayer,
    getRelayerStatus,
  }
}
