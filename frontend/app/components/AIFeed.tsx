'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAccount, useReadContract, useReadContracts } from 'wagmi'
import { useChainchat } from '@/app/hooks/useChainchat'
import { ogStorage } from '@/app/lib/og-storage'
import { ogInference } from '@/app/lib/og-inference'
import type { Abi } from 'viem'

interface Post {
  author: `0x${string}`
  contentCID: any
  imageCID: string
  timestamp: number
  likes: number
  commentsCount: number
  originalPostId: number
  score?: number
}

export function AIFeed() {
  const [posts, setPosts] = useState<Post[]>([])
  const [isCurating, setIsCurating] = useState(false)

  const { chainchat } = useChainchat()
  const { address } = useAccount()

  // 🔹 get user feed CID
  const { data: userFeedCID } = useReadContract({
    address: chainchat.address,
    abi: chainchat.abi as Abi,
    functionName: 'getUserFeed',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  // 🔹 get post count
  const { data: postCount } = useReadContract({
    address: chainchat.address,
    abi: chainchat.abi,
    functionName: 'getPostsCount',
  })

  // 🔹 batch all post reads when we know the count
  const postQueries = useMemo(() => {
    if (!postCount) return []
    return Array.from({ length: Number(postCount) }, (_, i) => ({
      address: chainchat.address,
      abi: chainchat.abi,
      functionName: 'getPost',
      args: [i],
    }))
  }, [postCount, chainchat])

  const { data: postsData } = useReadContracts({
    contracts: postQueries as any[],
    query: { enabled: postQueries.length > 0 },
  })

  
  // 🔹 whenever postsData or userFeedCID changes → process feed
  useEffect(() => {
    if (!postsData) return
    loadPersonalizedFeed()
  }, [postsData, userFeedCID])

  const loadPersonalizedFeed = async () => {
    
    if (!postsData) return
    setIsCurating(true)

  const posts = (postsData ?? []).map((p) => p.result as Post)

    try {
      // 1. User profile
      const userProfile = userFeedCID
        ? await ogStorage.downloadContent(userFeedCID as string)
        : null

      // 2. Resolve posts from OG Storage
      const allPosts: any[] = []
      for (let i = 0; i < posts.length; i++) {
        const post = posts[i]
        if (!post) continue

        const contentCID = await ogStorage.downloadContent(post.contentCID)

        allPosts.push({
          id: i,
          author: post.author,
          contentCID,
          timestamp: Number(post.timestamp),
        })
      }
 
      // 3. If AI profile exists, personalize
      if (userProfile && userProfile.embedding_cid) {
        const userEmbedding = await ogStorage.downloadContent(
          userProfile.embedding_cid,
        )

       const postsWithEmbeddings = await Promise.all(
            allPosts.map(async (post) => {
              try {
                const embedding = await getPostEmbedding(post.content.contentCID || post.id.toString());
                return { ...post, embedding };
              } catch {
                return { ...post, embedding: null };
              }
            })
          );

        const validPosts = allPosts.filter((_, i) => postsWithEmbeddings[i] !== null)
        const validEmbeddings = postsWithEmbeddings.filter(
          (emb) => emb !== null,
        ) as number[][]

        const scores = await ogInference.recommendContent(
          userEmbedding.embedding,
          validEmbeddings,
        )

        const scoredPosts = validPosts.map((post, index) => ({
          ...post,
          score: scores[index],
        }))

        scoredPosts.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        setPosts(scoredPosts)
      } else {
        // fallback: chronological
        allPosts.sort((a, b) => b.timestamp - a.timestamp)
        setPosts(allPosts)
      }
    } catch (err) {
      console.error('Error curating feed:', err)
    } finally {
      setIsCurating(false)
    }
  }
   const getPostEmbedding = async (postIdentifier: string): Promise<number[]> => {
    try {
      // Try to get existing embedding
      const embeddingData = await ogStorage.downloadContent(`${postIdentifier}-embedding`);
      return embeddingData.embedding;
    } catch {
      // Generate new embedding if not exists
      try {
        const postContent = await ogStorage.downloadContent(postIdentifier);
        const textContent = typeof postContent === 'string' ? postContent : postContent.content;
        const embedding = await ogInference.generateEmbedding(textContent);
        
        // Store the new embedding
        await ogStorage.uploadModel(embedding, 'post-embedding');
        
        return embedding;
      } catch (error) {
        console.error('Failed to generate embedding:', error);
        throw error;
      }
    }
  };

  if (!postCount) {
     return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">🤖</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
        <p className="text-gray-600">Be the first to create a post!</p>
      </div>
    );
  }

  if (isCurating) {
   return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">AI is curating your feed...</p>
      </div>
    );
  }

 return (
    <div className="space-y-6">
      {posts.map((post) => (
        <div key={post.originalPostId} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {post.author.slice(2, 4).toUpperCase()}
              </span>
            </div>
            <div className="ml-3">
              <div className="font-semibold text-gray-900">
                {post.author.slice(0, 8)}...{post.author.slice(-6)}
              </div>
              <div className="text-sm text-gray-500">
                {new Date(post.timestamp * 1000).toLocaleString()}
              </div>
            </div>
            {post.score && (
              <div className="ml-auto bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                AI Score: {Math.round(post.score * 100)}%
              </div>
            )}
          </div>
          
          <p className="text-gray-800 mb-4">{post.contentCID.content || post.contentCID}</p>
          
          {post.contentCID.imageCID && (
            <img 
              src={`${process.env.NEXT_PUBLIC_OG_INDEXER_URL}/retrieve/${post.contentCID.imageCID}`}
              alt="Post"
              className="rounded-lg mb-4 max-w-full h-auto"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          
          <div className="flex space-x-4 text-gray-500 text-sm">
            <button className="hover:text-blue-600 flex items-center">
              👍 Like
            </button>
            <button className="hover:text-green-600 flex items-center">
              💬 Comment
            </button>
            <button className="hover:text-purple-600 flex items-center">
              🔄 Share
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
