import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import jwt from 'jsonwebtoken';

// Initialize OG Chain provider
const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_OG_RPC_URL!);
const relayerWallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY!, provider);

// In-memory store 
const userNonces = new Map<string, number>();
const JWT_SECRET = process.env.JWT_SECRET || 'chainchatai-relayer-secret';

export async function POST(request: NextRequest) {
  try {
    const { to, data, value, userAddress, signature } = await request.json();

    // Validate request
    if (!to || !data || !userAddress || !signature) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Verify user signature
    const message = `Relay transaction for ${userAddress}`;
    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    if (recoveredAddress.toLowerCase() !== userAddress.toLowerCase()) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Check nonce to prevent replay attacks
    const currentNonce = userNonces.get(userAddress) || 0;
    userNonces.set(userAddress, currentNonce + 1);

    // Estimate gas cost
    const gasEstimate = await provider.estimateGas({
      to,
      data,
      value: value || 0
    });

    const gasPrice = await provider.send('eth_gasPrice', []);
    const totalCost = gasEstimate * gasPrice;

    // Check relayer balance
    const relayerBalance = await provider.getBalance(relayerWallet.address);
    if (relayerBalance < totalCost) {
      return NextResponse.json(
        { error: 'Relayer out of funds' },
        { status: 402 }
      );
    }

    // Send transaction
    const tx = await relayerWallet.sendTransaction({
      to,
      data,
      value: value || 0,
      gasLimit: gasEstimate,
      gasPrice
    });

    console.log(`Relayed transaction: ${tx.hash} for user: ${userAddress}`);

    return NextResponse.json({ 
      success: true, 
      txHash: tx.hash,
      cost: totalCost.toString()
    });

  } catch (error) {
    console.error('Relay error:', error);
    return NextResponse.json(
      { error: 'Failed to relay transaction' },
      { status: 500 }
    );
  }
}