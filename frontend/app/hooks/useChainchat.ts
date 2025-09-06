import { useReadContract, useWriteContract } from 'wagmi'
import ChainchatABI from '../abis/ChainchatAI.json'
import CCTokenABI from '../abis/CCToken.json'

export const useChainchat = () => {
    const chainchat = {
        address: process.env.NEXT_PUBLIC_CHAINCHAT_CONTRACT as `0x${string}`,
        abi: ChainchatABI,
    } as const

    const ccToken = {
        address: process.env.NEXT_PUBLIC_CC_TOKEN_CONTRACT as `0x${string}`,
        abi: CCTokenABI,
    } as const

    return { chainchat, ccToken }
}

export const useUserProfile = (address?: `0x${string}`) => {
    const chainchat = useChainchat()

    const { data: userProfile } = useReadContract({
        ...chainchat,
        functionName: 'getUserByAddress',
        args: address ? [address] as const : undefined,
    })

    return { userProfile }
}
