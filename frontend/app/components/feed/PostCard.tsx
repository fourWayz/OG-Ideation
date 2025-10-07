'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Heart, MessageCircle, Share, MoreHorizontal } from 'lucide-react';
import { usePosts } from '@/app/hooks/usePosts';
import { CommentSection } from './CommentSection';
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
    <div className="glass-card rounded-3xl p-8 hover:bg-white/20 transition-all duration-300">
      {/* Post Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          {post.authorProfile?.profileImage ? (
            <img 
              src={post.authorProfile.profileImage} 
              alt={post.authorProfile.username}
              className="w-12 h-12 rounded-2xl border-2 border-white/20"
            />
          ) : (
            <div className="w-12 h-12 bg-gradient-to-r from-white/30 to-white/10 rounded-2xl flex items-center justify-center text-white font-semibold border border-white/20">
              {post.author.slice(2, 4).toUpperCase()}
            </div>
          )}
          <div>
            <div className="font-semibold text-white text-lg">
              {post.authorProfile?.username || `${post.author.slice(0, 6)}...${post.author.slice(-4)}`}
            </div>
            <div className="text-white/60 text-sm">
              {formatTime(post.timestamp)}
            </div>
          </div>
        </div>
        <button className="p-2 text-white/60 hover:text-white rounded-xl hover:bg-white/10 transition-colors backdrop-blur-sm">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Post Content */}
      <div className="mb-6">
        <p className="text-white/90 text-lg leading-relaxed whitespace-pre-wrap">{post.content}</p>
        {post.image && (
          <div className="mt-6 rounded-2xl overflow-hidden border border-white/20">
            <img 
              src={post.image} 
              alt="Post image" 
              className="w-full max-h-96 object-cover"
            />
          </div>
        )}
      </div>

      {/* Post Stats */}
      <div className="flex items-center space-x-6 text-sm text-white/60 mb-6">
        <span>{post.likes} likes</span>
        <span>{post.commentsCount} comments</span>
      </div>

      {/* Post Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-white/20">
        <button
          onClick={handleLike}
          disabled={isLiking}
          className={`flex items-center space-x-3 px-5 py-3 rounded-xl transition-all duration-200 backdrop-blur-sm ${
            post.isLiked 
              ? 'bg-red-500/20 text-red-200 border border-red-400/30' 
              : 'text-white/80 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/20'
          }`}
        >
          <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
          <span className="font-medium">Like</span>
        </button>

        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex items-center space-x-3 px-5 py-3 rounded-xl text-white/80 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/20 transition-all duration-200 backdrop-blur-sm"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="font-medium">Comment</span>
        </button>

        <button className="flex items-center space-x-3 px-5 py-3 rounded-xl text-white/80 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/20 transition-all duration-200 backdrop-blur-sm">
          <Share className="w-5 h-5" />
          <span className="font-medium">Share</span>
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