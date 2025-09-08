import { Indexer, ZgFile } from '@0glabs/0g-ts-sdk';
import { ethers } from 'ethers';
import { Wallet, JsonRpcProvider } from 'ethers';
import fs from 'fs/promises';

export class OGStorageService {
  private indexer: Indexer;
  private signer: any;
  private provider: ethers.JsonRpcProvider;

  constructor() {
    // Initialize provider and signer
    this.provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_OG_RPC_URL!);
    this.signer = new ethers.Wallet(process.env.NEXT_PUBLIC_PRIVATE_KEY!, this.provider!);
    this.indexer = new Indexer(process.env.OG_INDEXER_RPC!);
  }

  /**
   * Upload post content to OG Storage
   */
  async uploadPost(content: string, metadata: any = {}): Promise<{ cid: string; txHash: string }> {
    try {
      const postData = {
        content,
        metadata: {
          ...metadata,
          timestamp: Date.now(),
          version: '1.0',
          type: 'post'
        }
      };

      return await this.uploadJSON(postData);
    } catch (error) {
      console.error('Post upload failed:', error);
      throw error;
    }
  }

  /**
   * Upload user profile to OG Storage
   */
  async uploadProfile(profileData: any): Promise<{ cid: string; txHash: string }> {
    try {
      const profile = {
        ...profileData,
        timestamp: Date.now(),
        version: '1.0',
        type: 'profile'
      };

      return await this.uploadJSON(profile).;
    } catch (error) {
      console.error('Profile upload failed:', error);
      throw error;
    }
  }

  /**
   * Upload AI model data to OG Storage
   */
  async uploadModel(modelData: any, modelType: string = 'embedding'): Promise<{ cid: string; txHash: string }> {
    try {
      const model = {
        data: modelData,
        metadata: {
          type: modelType,
          timestamp: Date.now(),
          version: '1.0',
          framework: 'og-inference'
        }
      };

      return await this.uploadJSON(model);
    } catch (error) {
      console.error('Model upload failed:', error);
      throw error;
    }
  }

  /**
   * Generic JSON upload to OG Storage
   */
  async uploadJSON(data: any): Promise<{ cid: string; txHash: string }> {
    try {
      const tempPath = `/tmp/${Date.now()}.json`;
      await fs.writeFile(tempPath, JSON.stringify(data));

      const file = await ZgFile.fromFilePath(tempPath);
      const [tree, err] = await file.merkleTree();
      if (err) throw new Error(`Merkle tree error: ${err}`);

      const rootHash = tree?.rootHash();
      if (!rootHash) throw new Error("Merkle tree root hash is missing");

      console.log("Data Root Hash:", rootHash);

      const [tx, uploadErr] = await this.indexer.upload(
        file,
        process.env.OG_RPC_URL!,
        this.signer
      );
      if (uploadErr) throw new Error(`Upload error: ${uploadErr}`);

      await file.close();
      await fs.unlink(tempPath);

      return { cid: tx.rootHash, txHash: tx.txHash };
    } catch (error) {
      console.error("OG Storage upload failed:", error);
      throw error;
    }
  }


  /**
   * Upload image file to OG Storage
   */
  async uploadImage(filePath: string): Promise<{ cid: string; txHash: string }> {
    try {
      const file = await ZgFile.fromFilePath(filePath);
      const [tree, err] = await file.merkleTree();
      if (err) throw new Error(`Merkle tree error: ${err}`);
      
      const rootHash = tree?.rootHash();
      if (!rootHash) throw new Error("Merkle tree root hash is missing");

      console.log("Data Root Hash:", rootHash);

      const [tx, uploadErr] = await this.indexer.upload(file, process.env.OG_RPC_URL!, this.signer);
      if (uploadErr) throw new Error(`Upload error: ${uploadErr}`);

      await file.close();
      return { cid: tx.rootHash, txHash: tx.txHash };
    } catch (error) {
      console.error('Image upload failed:', error);
      throw error;
    }
  }

  /**
   * Download and parse content from OG Storage
   */
  async downloadContent(cid: string): Promise<any> {
    try {
      const tempPath = `/tmp/${cid}.json`;
      await this.download(cid, tempPath, false);

      const data = await fs.readFile(tempPath, 'utf-8');
      await fs.unlink(tempPath);

      return JSON.parse(data);
    } catch (error) {
      console.error('Content download failed:', error);
      throw error;
    }
  }

  /**
   * Download file from OG Storage
   */
  async download(cid: string, outputPath: string, withProof: boolean = false): Promise<void> {
    try {
      const err = await this.indexer.download(cid, outputPath, withProof);
      if (err) throw new Error(`Download error: ${err}`);

      console.log(`File downloaded successfully to: ${outputPath}`);
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  }

  /**
   * Verify content integrity using merkle proof
   */
  async verifyContent(cid: string, content: any): Promise<boolean> {
    try {
      // Create temporary file with content
      const tempPath = `/tmp/verify-${Date.now()}.json`;
      await fs.writeFile(tempPath, JSON.stringify(content));

      const file = await ZgFile.fromFilePath(tempPath);
      const [tree, err] = await file.merkleTree();
      if (err) throw new Error(`Merkle tree error: ${err}`);

      const isValid = tree?.rootHash() === cid;
      await file.close();
      await fs.unlink(tempPath);

      return isValid;
    } catch (error) {
      console.error('Verification failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const ogStorage = new OGStorageService();