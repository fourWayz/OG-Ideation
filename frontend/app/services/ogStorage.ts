import { Indexer, ZgFile } from '@0glabs/0g-ts-sdk';
import { ethers } from 'ethers';

class OGStorageService {
  private indexer: Indexer;
  private signer: ethers.Wallet | null = null;
  private provider: ethers.JsonRpcProvider;

  constructor() {
    const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://evmrpc-testnet.0g.ai/';
    const INDEXER_RPC = process.env.NEXT_PUBLIC_INDEXER_RPC || 'https://indexer-storage-testnet-standard.0g.ai';
    
    this.provider = new ethers.JsonRpcProvider(RPC_URL);
    this.indexer = new Indexer(INDEXER_RPC);
    
    // Initialize signer if private key is available (for server-side operations)
    if (typeof window === 'undefined' && process.env.PRIVATE_KEY) {
      this.signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    }
  }

  // For client-side uploads, we'll use our API route
  async uploadFile(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/og/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.rootHash; // Return the root hash as CID
    } catch (error) {
      console.error('0G Storage upload error:', error);
      throw error;
    }
  }

  async uploadJSON(data: any): Promise<string> {
    try {
      // Convert JSON to Blob
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const file = new File([blob], 'data.json', { type: 'application/json' });
      
      return await this.uploadFile(file);
    } catch (error) {
      console.error('0G Storage JSON upload error:', error);
      throw error;
    }
  }

  async retrieveFile(rootHash: string): Promise<Blob> {
    try {
      const response = await fetch(`/api/og/download/${rootHash}`);
      
      if (!response.ok) {
        throw new Error(`Retrieve failed: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('0G Storage retrieve error:', error);
      throw error;
    }
  }

  async retrieveJSON<T>(rootHash: string): Promise<T> {
    try {
      const blob = await this.retrieveFile(rootHash);
      const text = await blob.text();
      return JSON.parse(text);
    } catch (error) {
      console.error('0G Storage JSON retrieve error:', error);
      throw error;
    }
  }

  async getFileURL(rootHash: string): Promise<string> {
    return `/api/og/download/${rootHash}`;
  }

  // Direct SDK access for server-side operations
//   async uploadFileDirect(file: File): Promise<{ rootHash: string; transactionHash: string }> {
//     if (!this.signer) {
//       throw new Error('Signer not initialized for direct uploads');
//     }

//     const zgFile = await ZgFile.fromFile(file);
//     const [tree, treeErr] = await zgFile.merkleTree();
    
//     if (treeErr !== null) {
//       throw new Error(`Error generating Merkle tree: ${treeErr}`);
//     }

//     const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://evmrpc-testnet.0g.ai/';
//     const [tx, uploadErr] = await this.indexer.upload(zgFile, RPC_URL, this.signer as any);

//     if (uploadErr !== null) {
//       throw new Error(`Upload error: ${uploadErr}`);
//     }

//     await zgFile.close();

//     return {
//       rootHash: tree?.rootHash() ?? '',
//       transactionHash: tx
//     };
//   }
}

export const ogStorage = new OGStorageService();