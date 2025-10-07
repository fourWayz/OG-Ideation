interface UserBehavior {
  likes: string[]; // Post IDs user liked
  comments: Array<{
    postId: string;
    content: string;
    timestamp: number;
  }>;
  shares: string[]; // Post IDs user shared
  interests: string[];
  readingTime: Map<string, number>; // Post ID -> seconds spent
}

interface FeedRecommendation {
  postId: string;
  score: number;
  reasons: string[];
}

class OGInferenceService {
  private baseURL: string;
  private apiKey: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_OG_INFERENCE_URL!;
    this.apiKey = process.env.NEXT_PUBLIC_OG_INFERENCE_API_KEY!;
  }

  async analyzeUserBehavior(userAddress: string, behavior: UserBehavior): Promise<string> {
    try {
      const response = await fetch(`${this.baseURL}/analyze/behavior`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          userAddress,
          behavior,
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Behavior analysis failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.modelCID; // Return the AI model CID
    } catch (error) {
      console.error('OG Inference analysis error:', error);
      throw error;
    }
  }

  async generatePersonalizedFeed(
    userAddress: string, 
    modelCID: string, 
    availablePosts: any[]
  ): Promise<FeedRecommendation[]> {
    try {
      const response = await fetch(`${this.baseURL}/generate/feed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          userAddress,
          modelCID,
          availablePosts,
          options: {
            diversity: 0.7,
            recency: 0.3,
            relevance: 0.8,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Feed generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.recommendations;
    } catch (error) {
      console.error('OG Inference feed generation error:', error);
      throw error;
    }
  }

  async analyzeContentSentiment(content: string): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
    topics: string[];
  }> {
    try {
      const response = await fetch(`${this.baseURL}/analyze/sentiment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error(`Sentiment analysis failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('OG Inference sentiment analysis error:', error);
      throw error;
    }
  }

  async generateContentEmbedding(content: string): Promise<number[]> {
    try {
      const response = await fetch(`${this.baseURL}/embeddings/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error(`Embedding generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.embedding;
    } catch (error) {
      console.error('OG Inference embedding error:', error);
      throw error;
    }
  }
}

export const ogInference = new OGInferenceService();