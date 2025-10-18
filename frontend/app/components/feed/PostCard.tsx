'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Heart, MessageCircle, Share, MoreHorizontal, Eye, Zap } from 'lucide-react';
import { usePosts } from '@/app/hooks/usePosts';
import { CommentSection } from './CommentSection';
import { Post } from '@/app/hooks/usePosts';
import { toast } from 'react-hot-toast';


interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { address } = useAccount();
  const { likePost } = usePosts();

  const handleLike = async () => {
    if (!address || isLiking) return;
    
    setIsLiking(true);
    try {
      await likePost(post.id);
      toast.success('Post liked!');
    } catch (error) {
      console.error('Failed to like post:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const formatTime = (timestamp: number) => {
    const now = new Date().getTime();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div 
      className="glass-card rounded-3xl p-8 hover:bg-white/20 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Enhanced Post Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4 group">
          {post.authorProfile?.profileImage ? (
            <img 
              src={post.authorProfile.profileImage} 
              alt={post.authorProfile.username}
              className="w-12 h-12 rounded-2xl border-2 border-white/20 group-hover:border-white/40 transition-all duration-300"
            />
          ) : (
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center text-white font-semibold border border-white/20 group-hover:scale-105 transition-transform">
              {post.author.slice(2, 4).toUpperCase()}
            </div>
          )}
          <div>
            <div className="font-semibold text-white text-lg group-hover:text-blue-200 transition-colors">
              {post.authorProfile?.username || `${post.author.slice(0, 6)}...${post.author.slice(-4)}`}
            </div>
            <div className="flex items-center space-x-2 text-white/60 text-sm">
              <span>{formatTime(post.timestamp)}</span>
              <span>•</span>
              <div className="flex items-center space-x-1">
                <Eye className="w-3 h-3" />
                <span>{Math.floor(post.likes * 2.5)} views</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Options Button */}
        <button className="p-2 text-white/60 hover:text-white rounded-xl hover:bg-white/10 transition-all duration-200 group">
          <MoreHorizontal className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Post Content with Read More */}
      <div className="mb-6">
        <p className="text-white/90 text-lg leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
        {post.image && (
          <div className="mt-6 rounded-2xl overflow-hidden border border-white/20 group">
            <img 
              src={post.image} 
              alt="Post image" 
              className="w-full max-h-96 object-cover transition-transform group-hover:scale-105 duration-500"
            />
          </div>
        )}
      </div>

      {/* Post Stats */}
      <div className="flex items-center space-x-6 text-sm text-white/60 mb-6">
        <span className="flex items-center space-x-1">
          <Zap className="w-4 h-4" />
          <span>{post.likes} likes</span>
        </span>
        <span className="flex items-center space-x-1">
          <MessageCircle className="w-4 h-4" />
          <span>{post.commentsCount} comments</span>
        </span>
        <span>•</span>
        <span>{(post.content.length / 200).toFixed(1)} min read</span>
      </div>

      {/* Post Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-white/20">
        <button
          onClick={handleLike}
          disabled={isLiking}
          className={`flex items-center space-x-3 px-5 py-3 rounded-xl transition-all duration-200 backdrop-blur-sm border ${
            post.isLiked 
              ? 'bg-red-500/20 text-red-200 border-red-400/30 scale-105' 
              : 'text-white/80 hover:text-white hover:bg-white/10 border-transparent hover:border-white/20'
          } ${isLiking ? 'animate-pulse' : ''}`}
        >
          <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current animate-bounce' : ''}`} />
          <span className="font-medium">Like</span>
        </button>

        <button 
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center space-x-3 px-5 py-3 rounded-xl text-white/80 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/20 transition-all duration-200 backdrop-blur-sm ${
            showComments ? 'bg-blue-500/20 border-blue-500/30' : ''
          }`}
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