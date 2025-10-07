import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useContract } from './useContract';
import { useAccount } from 'wagmi';

export interface Post {
  id: string;
  author: string;
  content: string;
  image?: string;
  timestamp: number;
  likes: number;
  commentsCount: number;
  isLiked: boolean;
  originalPostId?: string;
  contentCID: string;
  imageCID?: string;
  authorProfile?: {
    username: string;
    profileImage?: string;
  };
}

export interface Comment {
  id: string;
  commenter: string;
  content: string;
  timestamp: number;
  commenterProfile?: {
    username: string;
    profileImage?: string;
  };
}

export function usePosts() {
  const { contract } = useContract();
  const { address } = useAccount();
  const queryClient = useQueryClient();

  // Upload JSON to 0G via API
  const uploadJSON = async (data: any): Promise<string> => {
    const response = await fetch('/api/og/upload-json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }

    const result = await response.json();
    return result.rootHash;
  };

  // Upload file to 0G via API
  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/og/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'File upload failed');
    }

    const result = await response.json();
    return result.rootHash;
  };

  // Retrieve JSON from 0G via API
  const retrieveJSON = async <T>(rootHash: string): Promise<T> => {
    const response = await fetch(`/api/og/retrieve-json?cid=${rootHash}`);
    
    if (!response.ok) {
      throw new Error('Retrieve failed');
    }

    return await response.json();
  };

  // Get file URL from API
  const getFileURL = (rootHash: string): string => {
    return `/api/og/download/${rootHash}`;
  };

  // Fetch all posts
  const { data: posts = [], isLoading, error } = useQuery({
    queryKey: ['posts'],
    queryFn: async (): Promise<Post[]> => {
      if (!contract) return [];

      try {
        const postCount = await contract.getPostsCount();
        const posts: Post[] = [];

        for (let i = 0; i < postCount; i++) {
          try {
            const postData = await contract.getPost(i);
            
            // Retrieve content from API route
            const contentData = await retrieveJSON<{ content: string; timestamp: number }>(postData.contentCID);
            
            let imageUrl;
            if (postData.imageCID) {
              imageUrl = getFileURL(postData.imageCID);
            }

            // Get author profile info
            let authorProfile;
            try {
              const authorData = await contract.getUserByAddress(postData.author);
              authorProfile = {
                username: authorData.username,
                profileImage: authorData.profileImage,
              };
            } catch (error) {
              console.error(`Error fetching author profile for ${postData.author}:`, error);
              authorProfile = {
                username: `${postData.author.slice(0, 6)}...${postData.author.slice(-4)}`,
              };
            }

            // Check if current user liked this post
            let isLiked = false;
            try {
              // This would require a view function in your contract to check if user liked the post
              // For now, we'll set it to false
              isLiked = false;
            } catch (error) {
              console.error('Error checking like status:', error);
            }

            posts.push({
              id: i.toString(),
              author: postData.author,
              content: contentData.content,
              image: imageUrl,
              timestamp: Number(postData.timestamp) * 1000,
              likes: Number(postData.likes),
              commentsCount: Number(postData.commentsCount),
              isLiked,
              originalPostId: postData.originalPostId > 0 ? postData.originalPostId.toString() : undefined,
              contentCID: postData.contentCID,
              imageCID: postData.imageCID,
              authorProfile,
            });
          } catch (error) {
            console.error(`Error loading post ${i}:`, error);
            // // Create a fallback post with basic info
            // posts.push({
            //   id: i.toString(),
            //   author: postData.author,
            //   content: `Content unavailable (CID: ${postData.contentCID})`,
            //   timestamp: Number(postData.timestamp) * 1000,
            //   likes: Number(postData.likes),
            //   commentsCount: Number(postData.commentsCount),
            //   isLiked: false,
            //   originalPostId: postData.originalPostId > 0 ? postData.originalPostId.toString() : undefined,
            //   contentCID: postData.contentCID,
            //   imageCID: postData.imageCID,
            //   authorProfile: {
            //     username: `${postData.author.slice(0, 6)}...${postData.author.slice(-4)}`,
            //   },
            // });
          }
        }

        return posts.sort((a, b) => b.timestamp - a.timestamp);
      } catch (error) {
        console.error('Error fetching posts:', error);
        throw error;
      }
    },
    enabled: !!contract,
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async ({ content, image }: { content: string; image?: File }) => {
      if (!contract) throw new Error('Contract not initialized');

      // Upload content via API route
      const contentCID = await uploadJSON({ 
        content, 
        timestamp: Date.now(),
        type: 'post'
      });
      
      let imageCID;
      if (image) {
        imageCID = await uploadFile(image);
      }

      // Call smart contract
      const tx = await contract.createPost(contentCID, imageCID || '');
      await tx.wait();

      return { contentCID, imageCID };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  // Like post mutation
  const likePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!contract) throw new Error('Contract not initialized');
      
      const tx = await contract.likePost(postId);
      await tx.wait();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      if (!contract) throw new Error('Contract not initialized');
      
      const tx = await contract.addComment(postId, content);
      await tx.wait();
      
      return { postId, content };
    },
    onSuccess: (data) => {
      // Invalidate posts to update comment count
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      // Invalidate comments for this post
      queryClient.invalidateQueries({ queryKey: ['comments', data.postId] });
    },
  });

  // Get comments for a specific post
  const getPostComments = async (postId: string): Promise<Comment[]> => {
    if (!contract) return [];

    try {
      const commentsCount = await contract.postCommentsCount(postId);
      const comments: Comment[] = [];

      for (let i = 0; i < commentsCount; i++) {
        try {
          const commentData = await contract.getComment(postId, i);
          
          // Get commenter profile info
          let commenterProfile;
          try {
            const commenterData = await contract.getUserByAddress(commentData.commenter);
            commenterProfile = {
              username: commenterData.username,
              profileImage: commenterData.profileImage,
            };
          } catch (error) {
            commenterProfile = {
              username: `${commentData.commenter.slice(0, 6)}...${commentData.commenter.slice(-4)}`,
            };
          }

          comments.push({
            id: i.toString(),
            commenter: commentData.commenter,
            content: commentData.content,
            timestamp: Number(commentData.timestamp) * 1000,
            commenterProfile,
          });
        } catch (error) {
          console.error(`Error loading comment ${i} for post ${postId}:`, error);
        }
      }

      return comments.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  };

  // Share post mutation
  const sharePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!contract) throw new Error('Contract not initialized');
      
      const tx = await contract.sharePost(postId);
      await tx.wait();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  return {
    posts,
    isLoading,
    error,
    createPost: createPostMutation.mutateAsync,
    likePost: likePostMutation.mutateAsync,
    addComment: addCommentMutation.mutateAsync,
    sharePost: sharePostMutation.mutateAsync,
    getPostComments,
    isCreating: createPostMutation.isPending,
    isLiking: likePostMutation.isPending,
    isCommenting: addCommentMutation.isPending,
    isSharing: sharePostMutation.isPending,
  };
}