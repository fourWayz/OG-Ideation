'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useChainchat } from '@/hooks/useChainchat';
import { ogStorage } from '@/lib/og-storage';
import { ogInference } from '@/lib/og-inference';

interface Post {
  id: number;
  author: string;
  content: any;
  embedding?: number[];
  timestamp: number;
}

export function AIFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { chainchat } = useChainchat();
  const { address } = useAccount();

  useEffect(() => {
    loadPersonalizedFeed();
  }, [address]);

  const loadPersonalizedFeed = async () => {
    if (!chainchat || !address) return;

    setIsLoading(true);
    try {
      // Get user's feed profile from OG Storage
      const userFeedCID = await chainchat.getUserFeed(address);
      const userProfile = userFeedCID 
        ? await ogStorage.retrieveJSON(userFeedCID)
        : null;

      // Get all posts
      const postCount = await chainchat.getPostsCount();
      const allPosts: Post[] = [];

      for (let i = 0; i < postCount; i++) {
        const post = await chainchat.getPost(i);
        const content = await ogStorage.retrieveJSON(post.contentCID);
        
        allPosts.push({
          id: i,
          author: post.author,
          content,
          timestamp: post.timestamp,
        });
      }

      // If user has AI profile, personalize feed
      if (userProfile && userProfile.embedding_cid) {
        const userEmbedding = await ogStorage.retrieveJSON(userProfile.embedding_cid);
        const postEmbeddings = await Promise.all(
          allPosts.map(async (post) => {
            try {
              const embeddingData = await ogStorage.retrieveJSON(post.contentCID + '-embedding');
              return embeddingData.embedding;
            } catch {
              return null;
            }
          })
        );

        // Get AI recommendations
        const validPosts = allPosts.filter((_, i) => postEmbeddings[i] !== null);
        const validEmbeddings = postEmbeddings.filter(emb => emb !== null) as number[][];
        
        const scores = await ogInference.recommendContent(
          userEmbedding.embedding,
          validEmbeddings
        );

        // Sort posts by AI score
        const scoredPosts = validPosts.map((post, index) => ({
          ...post,
          score: scores[index],
        }));

        scoredPosts.sort((a, b) => b.score - a.score);
        setPosts(scoredPosts);
      } else {
        // Default: chronological feed
        allPosts.sort((a, b) => b.timestamp - a.timestamp);
        setPosts(allPosts);
      }
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">AI is curating your feed...</div>;
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <div key={post.id} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
            <div className="ml-3">
              <div className="font-semibold">{post.author}</div>
              <div className="text-sm text-gray-500">
                {new Date(post.timestamp * 1000).toLocaleString()}
              </div>
            </div>
          </div>
          
          <p className="text-gray-800 mb-4">{post.content.text}</p>
          
          {post.content.image && (
            <img 
              src={`${process.env.NEXT_PUBLIC_OG_STORAGE_URL}/retrieve/${post.content.image}`}
              alt="Post"
              className="rounded-lg mb-4 max-w-full"
            />
          )}
          
          <div className="flex space-x-4 text-gray-500">
            <button className="hover:text-blue-600">Like</button>
            <button className="hover:text-green-600">Comment</button>
            <button className="hover:text-purple-600">Share</button>
          </div>
        </div>
      ))}
    </div>
  );
}