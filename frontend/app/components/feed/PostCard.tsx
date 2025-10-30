'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Heart, MessageCircle, Share, MoreHorizontal, Sparkles, Filter, Hash } from 'lucide-react';
import { usePosts } from '@/app/hooks/usePosts';
import { useContentRelevance } from '@/app/hooks/useContentRelevance';
import { useContentFiltering } from '@/app/hooks/useContentFiltering';
import { useSmartReplies } from '@/app/hooks/useSmartReplies';
import { CommentSection } from './CommentSection';
import { Post } from '@/app/hooks/usePosts';

interface PostCardProps {
  post: Post;
  userInterests: string[];
}

export function PostCard({ post, userInterests }: PostCardProps) {
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showSmartReplies, setShowSmartReplies] = useState(false);
  const [relevanceScore, setRelevanceScore] = useState<any>(null);
  const [contentAnalysis, setContentAnalysis] = useState<any>(null);
  const [smartReplies, setSmartReplies] = useState<any[]>([]);
  
  const { address } = useAccount();
  const { likePost } = usePosts();
  const { calculateRelevance } = useContentRelevance();
  const { analyzeContent } = useContentFiltering();
  const { generateReplies, isGenerating: isGeneratingReplies } = useSmartReplies();

  // Calculate relevance on component mount
  useEffect(() => {
    const loadRelevanceData = async () => {
      const relevance = await calculateRelevance(post, userInterests);
      setRelevanceScore(relevance);
      
      const analysis = await analyzeContent(post.content);
      setContentAnalysis(analysis);
    };

    loadRelevanceData();
  }, [post, userInterests]);

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

  const handleSmartReplies = async () => {
    if (smartReplies.length === 0) {
      const replies = await generateReplies({ postContent: post.content });
      setSmartReplies(replies);
    }
    setShowSmartReplies(!showSmartReplies);
  };

  const getRelevanceColor = (score: number) => {
    if (score > 0.8) return 'text-green-400';
    if (score > 0.6) return 'text-blue-400';
    if (score > 0.4) return 'text-yellow-400';
    return 'text-gray-400';
  };

  const getSafetyBadge = (analysis: any) => {
    if (!analysis) return null;
    
    if (analysis.isSafe && analysis.confidence > 0.8) {
      return (
        <div className="flex items-center space-x-1 px-2 py-1 bg-green-500/20 rounded-full border border-green-500/30">
          <Filter className="w-3 h-3 text-green-400" />
          <span className="text-green-400 text-xs">Verified</span>
        </div>
      );
    }
    
    if (!analysis.isSafe) {
      return (
        <div className="flex items-center space-x-1 px-2 py-1 bg-red-500/20 rounded-full border border-red-500/30">
          <Filter className="w-3 h-3 text-red-400" />
          <span className="text-red-400 text-xs">Review</span>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="glass-card rounded-3xl p-8 hover:bg-white/20 transition-all duration-300">
      {/* Enhanced Header with AI Insights */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          {/* Author info */}
          <div className="flex items-center space-x-3">
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
              <div className="flex items-center space-x-2 text-white/60 text-sm">
                <span>{new Date(post.timestamp).toLocaleDateString()}</span>
                {relevanceScore && (
                  <div className={`flex items-center space-x-1 ${getRelevanceColor(relevanceScore.score)}`}>
                    <Sparkles className="w-3 h-3" />
                    <span className="text-xs">{Math.round(relevanceScore.score * 100)}% relevant</span>
                  </div>
                )}
                {contentAnalysis && getSafetyBadge(contentAnalysis)}
              </div>
            </div>
          </div>
        </div>
        
        <button className="p-2 text-white/60 hover:text-white rounded-xl hover:bg-white/10 transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Content with AI Insights */}
      <div className="mb-6">
        <p className="text-white/90 text-lg leading-relaxed whitespace-pre-wrap mb-4">
          {post.content}
        </p>
        
        {/* Relevance Factors */}
        {relevanceScore && (
          <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/70 text-sm">Content Insights</span>
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-white/60">Engagement:</span>
                <span className="text-white">{Math.round(relevanceScore.factors.engagement * 100)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Interest Match:</span>
                <span className="text-white">{Math.round(relevanceScore.factors.personalInterest * 100)}%</span>
              </div>
            </div>
            {relevanceScore.recommendations.length > 0 && (
              <div className="mt-2 pt-2 border-t border-white/10">
                <p className="text-purple-300 text-xs">
                  💡 {relevanceScore.recommendations[0]}
                </p>
              </div>
            )}
          </div>
        )}

        {post.image && (
          <div className="rounded-2xl overflow-hidden border border-white/20">
            <img 
              src={post.image} 
              alt="Post image" 
              className="w-full max-h-96 object-cover"
            />
          </div>
        )}
      </div>

      {/* Enhanced Actions with Smart Replies */}
      <div className="flex items-center justify-between pt-6 border-t border-white/20">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
              post.isLiked 
                ? 'bg-red-500/20 text-red-200 border border-red-400/30' 
                : 'text-white/80 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/20'
            }`}
          >
            <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
            <span>{post.likes}</span>
          </button>

          <button 
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/20 transition-all duration-200"
          >
            <MessageCircle className="w-5 h-5" />
            <span>{post.commentsCount}</span>
          </button>

          <button
            onClick={handleSmartReplies}
            disabled={isGeneratingReplies}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-purple-300 hover:text-purple-200 hover:bg-purple-500/20 border border-purple-500/30 hover:border-purple-500/50 transition-all duration-200 disabled:opacity-50"
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-sm">Smart Reply</span>
          </button>
        </div>

        <button className="flex items-center space-x-2 px-4 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/20 transition-all duration-200">
          <Share className="w-5 h-5" />
          <span className="text-sm">Share</span>
        </button>
      </div>

      {/* Smart Replies Panel */}
      {showSmartReplies && (
        <div className="mt-4 glass rounded-2xl p-4 border border-white/20 animate-in fade-in">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-white text-sm flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>AI Reply Suggestions</span>
            </h4>
            <button
              onClick={() => setShowSmartReplies(false)}
              className="text-white/60 hover:text-white transition-colors"
            >
              <span className="text-sm">Close</span>
            </button>
          </div>

          {isGeneratingReplies ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mr-2" />
              <span className="text-white/60 text-sm">Generating smart replies...</span>
            </div>
          ) : (
            <div className="space-y-2">
              {smartReplies.map((reply) => (
                <button
                  key={reply.id}
                  onClick={() => {
                    // This would set the comment input with the reply text
                    setShowSmartReplies(false);
                  }}
                  className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-200"
                >
                  <p className="text-white text-sm mb-1">{reply.text}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-white/50 text-xs capitalize">{reply.tone}</span>
                    <span className="text-white/40 text-xs">
                      {Math.round(reply.confidence * 100)}% match
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Comment Section */}
      <CommentSection 
        postId={post.id} 
        isOpen={showComments}
        onClose={() => setShowComments(false)}
      />
    </div>
  );
}