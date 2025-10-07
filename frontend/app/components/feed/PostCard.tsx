'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Heart, MessageCircle, Share, MoreHorizontal } from 'lucide-react';
import { usePosts } from '@/app/hooks/usePosts';
import { CommentSection } from '@/app/components/feed/CommentSection';
import { Post } from '@/app/hooks/usePosts';

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const { address } = useAccount();
  const { likePost } = usePosts();

  const handleLike = async () => {
    if (!address || isLiking) return;
    
    setIsLiking(true);
    try {
      await likePost(post.id);
    } catch (error) {
      console.error('Failed to like post:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      {/* Post Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {post.authorProfile?.profileImage ? (
            <img 
              src={post.authorProfile.profileImage} 
              alt={post.authorProfile.username}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
              {post.author.slice(2, 4).toUpperCase()}
            </div>
          )}
          <div>
            <div className="font-semibold text-gray-900">
              {post.authorProfile?.username || `${post.author.slice(0, 6)}...${post.author.slice(-4)}`}
            </div>
            <div className="text-sm text-gray-500">
              {formatTime(post.timestamp)}
            </div>
          </div>
        </div>
        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
        {post.image && (
          <div className="mt-4 rounded-lg overflow-hidden">
            <img 
              src={post.image} 
              alt="Post image" 
              className="w-full max-h-96 object-cover rounded-lg"
            />
          </div>
        )}
      </div>

      {/* Post Stats */}
      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
        <span>{post.likes} likes</span>
        <span>{post.commentsCount} comments</span>
      </div>

      {/* Post Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <button
          onClick={handleLike}
          disabled={isLiking}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            post.isLiked 
              ? 'text-red-500 bg-red-50' 
              : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
          }`}
        >
          <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
          <span>Like</span>
        </button>

        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-500 hover:text-blue-500 hover:bg-blue-50 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Comment</span>
        </button>

        <button className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-500 hover:text-green-500 hover:bg-green-50 transition-colors">
          <Share className="w-5 h-5" />
          <span>Share</span>
        </button>
      </div>

      {/* Comment Section */}
      <CommentSection 
        postId={post.id} 
        isOpen={showComments}
        onClose={() => setShowComments(false)}
      />
    </div>
  );
}