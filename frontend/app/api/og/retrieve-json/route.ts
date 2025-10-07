import { NextRequest, NextResponse } from 'next/server';
import { Indexer } from '@0glabs/0g-ts-sdk';
import { join } from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cid = searchParams.get('cid');

    if (!cid) {
      return NextResponse.json({ error: 'CID parameter required' }, { status: 400 });
    }

    const INDEXER_RPC = process.env.NEXT_PUBLIC_INDEXER_RPC;

    if (!INDEXER_RPC) {
      return NextResponse.json(
        { error: '0G Storage configuration missing' },
        { status: 500 }
      );
    }

    const indexer = new Indexer(INDEXER_RPC);
    const downloadsDir = '/tmp';
    const outputPath = join(downloadsDir, `${cid}.json`);

    const fs = await import('fs');
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }

    // Download from 0G Storage
    const err = await indexer.download(cid, outputPath, true);

    if (err !== null) {
      throw new Error(`Download error: ${err}`);
    }

    // Read and parse the JSON file
    const fileBuffer = fs.readFileSync(outputPath);
    const jsonData = JSON.parse(fileBuffer.toString());

    // Clean up
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }

    return NextResponse.json(jsonData);

  } catch (error) {
    console.error('JSON retrieve error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}