import { ogStorage } from '../lib/og-storage';
import { ethers } from 'ethers';
import ChainchatAI from '../abis/ChainchatAI.json';
import fs from 'fs/promises';

export class PostService {
  private contract: ethers.Contract;

  constructor() {
    this.contract = new ethers.Contract(
      process.env.CHAINCHAT_AI_ADDRESS!,
      ChainchatAI.abi,
      new ethers.JsonRpcProvider(process.env.OG_RPC_URL)
    );
  }

  async createPost(content: string, imageFile?: File): Promise<{ cid: string; txHash: string }> {
    try {
      let imageCID = '';

      // Upload image if provided
      if (imageFile) {
        const tempPath = `/tmp/${imageFile.name}`;
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await fs.writeFile(tempPath, buffer);
        
        const imageResult = await ogStorage.uploadImage(tempPath);
        imageCID = imageResult.cid;
        await fs.unlink(tempPath);
      }

      // Upload post content to OG Storage
      const postResult = await ogStorage.uploadPost(content, {
        imageCID: imageCID || undefined,
        author: await this.getCurrentUserAddress()
      });

      console.log(`Post stored on OG Storage: ${postResult.cid}`);

      return postResult;
    } catch (error) {
      console.error('Post creation failed:', error);
      throw error;
    }
  }

  async createPostOnChain(content: string, imageFile?: File): Promise<string> {
    try {
      // First upload to OG Storage
      const { cid: contentCID } = await this.createPost(content, imageFile);
      
      let imageCID = '';
      if (imageFile) {
        const { cid } = await this.uploadImage(imageFile);
        imageCID = cid;
      }

      //  create on-chain reference
      const signer = new ethers.Wallet(process.env.OG_STORAGE_PRIVATE_KEY!);
      const contractWithSigner = this.contract.connect(signer);
      
      const tx = await contractWithSigner.createPost(contentCID, imageCID);
      await tx.wait();

      console.log(`Post created on-chain: ${tx.hash}`);
      return tx.hash;

    } catch (error) {
      console.error('On-chain post creation failed:', error);
      throw error;
    }
  }

  async getPost(postId: number): Promise<any> {
    try {
      // Get on-chain post data
      const onChainPost = await this.contract.getPost(postId);
      
      // Download actual content from OG Storage
      const content = await ogStorage.downloadContent(onChainPost.contentCID);
      
      let imageUrl = '';
      if (onChainPost.imageCID) {
        imageUrl = `${process.env.OG_INDEXER_RPC}/retrieve/${onChainPost.imageCID}`;
      }

      return {
        ...content,
        onChainData: onChainPost,
        imageUrl
      };
    } catch (error) {
      console.error('Post retrieval failed:', error);
      throw error;
    }
  }

  private async uploadImage(file: File): Promise<{ cid: string }> {
    const tempPath = `/tmp/${file.name}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(tempPath, buffer);
    
    const result = await ogStorage.uploadImage(tempPath);
    await fs.unlink(tempPath);
    
    return { cid: result.cid };
  }

  private async getCurrentUserAddress(): Promise<string> {
    // Placeholder for actual user address retrieval logic
    
    // Implement user address retrieval
    return '0xUserAddress';
  }
}