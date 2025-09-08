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
    return <div className="text-center py-8">Loading posts…</div>
  }

  if (isCurating) {
    return <div className="text-center py-8">AI is curating your feed…</div>
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <div key={post.originalPostId} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
            <div className="ml-3">
              <div className="font-semibold">{post.author}</div>
              <div className="text-sm text-gray-500">
                {new Date(post.timestamp * 1000).toLocaleString()}
              </div>
            </div>
          </div>
            {/* TODO : content extraction from CID */}
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
  )
}
