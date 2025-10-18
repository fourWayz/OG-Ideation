import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { Indexer, ZgFile } from '@0glabs/0g-ts-sdk';
import { ethers } from 'ethers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check if we're in a server environment
    if (typeof window !== 'undefined') {
      return NextResponse.json(
        { error: 'This route can only be accessed server-side' },
        { status: 400 }
      );
    }

    const jsonData = await request.json();

    if (!jsonData) {
      return NextResponse.json({ error: 'No JSON data provided' }, { status: 400 });
    }

    // Validate environment variables
    const RPC_URL = process.env.NEXT_PUBLIC_OG_RPC_URL;
    const INDEXER_RPC = process.env.NEXT_PUBLIC_INDEXER_RPC;
    const PRIVATE_KEY = process.env.PRIVATE_KEY;

    if (!RPC_URL || !INDEXER_RPC || !PRIVATE_KEY) {
      return NextResponse.json(
        { error: '0G Storage configuration missing' },
        { status: 500 }
      );
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    const indexer = new Indexer(INDEXER_RPC);

    // Create temporary file with JSON data
    const tempDir = '/tmp';
    const tempPath = join(tempDir, `json-upload-${Date.now()}.json`);

    // Ensure temp directory exists
    const fs = await import('fs');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Write JSON to temporary file
    await writeFile(tempPath, JSON.stringify(jsonData));

    // Upload to 0G Storage
    const zgFile = await ZgFile.fromFilePath(tempPath);
    const [tree, treeErr] = await zgFile.merkleTree();

    if (treeErr !== null) {
      throw new Error(`Error generating Merkle tree: ${treeErr}`);
    }

    const [tx, uploadErr] = await indexer.upload(zgFile, RPC_URL, signer as any);

    if (uploadErr !== null) {
      throw new Error(`Upload error: ${uploadErr}`);
    }

    await zgFile.close();

    // Clean up temp file
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }

    return NextResponse.json({
      rootHash: tree?.rootHash() ?? '',
      transactionHash: tx,
      success: true
    });

  } catch (error) {
    console.error('JSON upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}