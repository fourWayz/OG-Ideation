import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider(process.env.OG_RPC_URL);
const relayerWallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY!, provider);

export async function GET() {
  try {
    const balance = await provider.getBalance(relayerWallet.address);
    const gasPrice = await provider.send('eth_gasPrice', []);
    const blockNumber = await provider.getBlockNumber();

    return NextResponse.json({
      relayerAddress: relayerWallet.address,
      balance: ethers.formatEther(balance),
      gasPrice: ethers.formatUnits(gasPrice, 'gwei'),
      blockNumber,
      status: 'operational'
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Failed to get relayer status' },
      { status: 500 }
    );
  }
}