import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { Indexer, ZgFile } from '@0glabs/0g-ts-sdk';
import { ethers } from 'ethers';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Initialize 0G SDK
    const RPC_URL = process.env.NEXT_PUBLIC_OG_RPC_URL!;
    const INDEXER_RPC = process.env.NEXT_PUBLIC_INDEXER_RPC!;
    const PRIVATE_KEY = process.env.NEXT_PUBLIC_PRIVATE_KEY!;

    if (!PRIVATE_KEY) {
      throw new Error('Private key not configured');
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    const indexer = new Indexer(INDEXER_RPC);

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create temporary file path
    const tempDir = join(process.cwd(), 'temp');
    const tempPath = join(tempDir, file.name);
    
    // Ensure temp directory exists
    const fs = await import('fs');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    await writeFile(tempPath, buffer);

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
    fs.unlinkSync(tempPath);

    return NextResponse.json({
      rootHash: tree?.rootHash() ?? '',
      transactionHash: tx,
      success: true
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}