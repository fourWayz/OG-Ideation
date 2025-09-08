import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import jwt from 'jsonwebtoken';

const userNonces = new Map<string, number>();
const JWT_SECRET = process.env.JWT_SECRET || 'chainchatai-relayer-secret';

export async function POST(request: NextRequest) {
  try {
    const { address, signature } = await request.json();

    if (!address || !signature) {
      return NextResponse.json(
        { error: 'Missing address or signature' },
        { status: 400 }
      );
    }

    // Verify signature for authentication
    const message = `Login to ChainChatAI at ${Date.now()}`;
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() === address.toLowerCase()) {
      // Generate JWT token
      const token = jwt.sign({ address }, JWT_SECRET, { expiresIn: '7d' });
      
      // Initialize nonce
      userNonces.set(address, 0);

      return NextResponse.json({ success: true, token });
    } else {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}