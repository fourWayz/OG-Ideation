// src/services/ai-service.ts
import { ogStorage } from '../lib/og-storage';
import { ogInference } from '../lib/og-inference';
import {ethers} from 'ethers';
import ChainChatAIABI from '../abis/ChainchatAI.json';

export class AIService {
  async generateEmbeddings(text: string): Promise<{ embedding: number[]; cid: string }> {
    try {
      // Generate embedding using OG Inference
      const embedding = await ogInference.generateEmbedding(text);
      console.log(embedding,'embedding')
      // Store embedding on OG Storage
      const { cid } = await ogStorage.uploadModel(embedding, 'text-embedding');
      
      return { embedding, cid };
    } catch (error) {
      console.error('Embedding generation failed:', error);
      throw error;
    }
  }

  async updateUserModel(userAddress: string, embedding: number[]): Promise<string> {
    try {
      // Store user model on OG Storage
      const { cid } = await ogStorage.uploadModel(
        { embedding, userAddress, timestamp: Date.now() },
        'user-model'
      );

      // Update on-chain pointer
      const signer = new ethers.Wallet(process.env.OG_STORAGE_PRIVATE_KEY!);
      const contract = new ethers.Contract(
        process.env.CHAINCHAT_AI_ADDRESS!,
        ChainChatAIABI.abi,
        signer
      );

      const tx = await contract.updateUserModel(userAddress, cid);
      await tx.wait();

      return cid;
    } catch (error) {
      console.error('User model update failed:', error);
      throw error;
    }
  }

  async getPersonalizedFeed(userAddress: string): Promise<any[]> {
    try {
      // Get user model from on-chain pointer
      const contract = new ethers.Contract(
        process.env.CHAINCHAT_AI_ADDRESS!,
        ChainChatAIABI.abi
      );

      const modelCID = await contract.userFeedModels(userAddress);
      if (!modelCID) return [];

      // Download user model from OG Storage
      const userModel = await ogStorage.downloadContent(modelCID);
      
      // Get all posts and their embeddings
      const postCount = await contract.getPostsCount();
      const postsWithEmbeddings = [];

      for (let i = 0; i < postCount; i++) {
        const post = await contract.getPost(i);
        try {
          const postContent = await ogStorage.downloadContent(post.contentCID);
          const embedding = await this.getPostEmbedding(post.contentCID);
          
          postsWithEmbeddings.push({
            postId: i,
            embedding,
            content: postContent,
            onChainData: post
          });
        } catch (error) {
          console.warn(`Failed to process post ${i}:`, error);
        }
      }

      // Get AI recommendations
      const userEmbedding = userModel.embedding;
      const postEmbeddings = postsWithEmbeddings.map(p => p.embedding);
      
      const scores = await ogInference.recommendContent(userEmbedding, postEmbeddings);
      
      // Sort posts by recommendation score
      return postsWithEmbeddings
        .map((post, index) => ({ ...post, score: scores[index] }))
        .sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Personalized feed generation failed:', error);
      throw error;
    }
  }

  private async getPostEmbedding(contentCID: string): Promise<number[]> {
    try {
      // Try to get existing embedding
      const embeddingData = await ogStorage.downloadContent(`${contentCID}-embedding`);
      return embeddingData.embedding;
    } catch {
      // Generate new embedding if not exists
      const postContent = await ogStorage.downloadContent(contentCID);
      const { embedding } = await this.generateEmbeddings(postContent.content);
      return embedding;
    }
  }
}