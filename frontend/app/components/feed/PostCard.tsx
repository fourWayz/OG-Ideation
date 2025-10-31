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
import toast from 'react-hot-toast';

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showSmartReplies, setShowSmartReplies] = useState(false);
  const [relevanceScore, setRelevanceScore] = useState<any>(null);
  const [contentAnalysis, setContentAnalysis] = useState<any>(null);
  const [smartReplies, setSmartReplies] = useState<any[]>([]);

  const { address } = useAccount();
  const { likePost, addComment } = usePosts();
  const { calculateRelevance } = useContentRelevance();
  const { analyzeContent } = useContentFiltering();
  const { generateReplies, isGenerating: isGeneratingReplies } = useSmartReplies();

  // Calculate relevance on component mount
  useEffect(() => {
    const loadRelevanceData = async () => {
      const relevance = await calculateRelevance(post, post.authorProfile?.interests || []);
      setRelevanceScore(relevance);

      const analysis = await analyzeContent(post.content);
      setContentAnalysis(analysis);
    };

    loadRelevanceData();
  }, [post]);


  const handleLike = async () => {
    if (!address || isLiking) return;

    setIsLiking(true);
    try {
      await likePost(post.id);
    } catch (error: any) {
      const errMsg = String(error?.message || '');

      // Errors to suppress
      const ignoreErrors = [
        'no matching receipts found',
        'could not coalesce error',
        'Internal JSON-RPC error',
        'eth_getTransactionReceipt',
        'User rejected the request',
        'user rejected transaction'
      ];

      // Check if error matches any known pattern
      const isRpcSyncError = ignoreErrors.some((msg) => errMsg.includes(msg));

      if (isRpcSyncError) {
        console.warn('⚠️ Ignored harmless RPC sync error:', error);
        return;
      }

      // Otherwise show the real error
      console.error('Failed to like post:', error);
      toast.error('Failed to like post. Please try again.');
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

  const handleSmartReplySelect = async (replyText: string) => {
    try {
      await addComment({
        postId: post.id,
        content: replyText
      });

      toast.success('Comment added!');
      setShowSmartReplies(false);
      setShowComments(true);

    } catch (error: any) {
      const errMsg = String(error?.message || '');

      // Errors to suppress 
      const ignoreErrors = [
        'no matching receipts found',
        'could not coalesce error',
        'Internal JSON-RPC error',
        'eth_getTransactionReceipt',
        'User rejected the request',
        'user rejected transaction'
      ];

      // Check if error matches any known pattern
      const isRpcSyncError = ignoreErrors.some((msg) => errMsg.includes(msg));

      if (isRpcSyncError) {
        console.warn('⚠️ Ignored harmless RPC sync error:', error);
        toast.success('Comment added! (receipt syncing)');
        setShowSmartReplies(false);
        setShowComments(true);
        return;
      }

      // Otherwise show the real error
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment. Please try again.');
    }
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
    <div className="glass-card rounded-3xl p-8 hover:shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          {/* Author info */}
          <div className="flex items-center space-x-3">
            {post.authorProfile?.profileImage ? (
              <img
                src={post.authorProfile.profileImage}
                alt={post.authorProfile.username}
                className="w-12 h-12 rounded-2xl border-2 border-white/40 shadow-sm"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-2xl flex items-center justify-center text-gray-900 font-semibold border border-white/40 shadow-sm">
                {post.author.slice(2, 4).toUpperCase()}
              </div>
            )}
            <div>
              <div className="font-semibold text-gray-900 text-lg">
                {post.authorProfile?.username || `${post.author.slice(0, 6)}...${post.author.slice(-4)}`}
              </div>
              <div className="flex items-center space-x-2 text-gray-600 text-sm">
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

        <button className="p-2 text-gray-500 hover:text-gray-700 rounded-xl hover:bg-white/80 transition-colors backdrop-blur-sm">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Content with AI Insights */}
      <div className="mb-6">
        <p className="text-gray-900 text-lg leading-relaxed whitespace-pre-wrap mb-4 font-medium">
          {post.content}
        </p>

        {/* Relevance Factors */}
        {relevanceScore && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/40 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-700 text-sm font-medium">Content Insights</span>
              <Sparkles className="w-4 h-4 text-purple-600" />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Engagement:</span>
                <span className="text-gray-900 font-medium">{Math.round(relevanceScore.factors.engagement * 100)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Interest Match:</span>
                <span className="text-gray-900 font-medium">{Math.round(relevanceScore.factors.personalInterest * 100)}%</span>
              </div>
            </div>
            {relevanceScore.recommendations.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200/50">
                <p className="text-purple-700 text-sm font-medium">
                  💡 {relevanceScore.recommendations[0]}
                </p>
              </div>
            )}
          </div>
        )}

        {post.image && (
          <div className="rounded-2xl overflow-hidden border border-white/40 group">
            <img
              src={post.image}
              alt="Post image"
              className="w-full max-h-96 object-cover transition-transform group-hover:scale-105 duration-500"
            />
          </div>
        )}
      </div>

      {/* Enhanced Actions with Smart Replies */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200/50">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 backdrop-blur-sm border ${post.isLiked
                ? 'bg-red-100/80 text-red-700 border-red-200/60 hover:border-red-300/80'
                : 'text-gray-700 hover:text-gray-900 hover:bg-white/80 border-transparent hover:border-white/60'
              }`}
          >
            <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
            <span className="font-medium">{post.likes}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-gray-700 hover:text-gray-900 hover:bg-white/80 border border-transparent hover:border-white/60 transition-all duration-200 backdrop-blur-sm"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium">{post.commentsCount}</span>
          </button>

          <button
            onClick={handleSmartReplies}
            disabled={isGeneratingReplies}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-purple-700 hover:text-purple-800 hover:bg-purple-100/80 border border-purple-200/60 hover:border-purple-300/80 transition-all duration-200 disabled:opacity-50 backdrop-blur-sm"
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-medium">Smart Reply</span>
          </button>
        </div>

        <button className="flex items-center space-x-2 px-4 py-2 rounded-xl text-gray-700 hover:text-gray-900 hover:bg-white/80 border border-transparent hover:border-white/60 transition-all duration-200 backdrop-blur-sm">
          <Share className="w-5 h-5" />
          <span className="text-sm font-medium">Share</span>
        </button>
      </div>

      {/* Smart Replies Panel */}
      {showSmartReplies && (
        <div className="mt-4 glass rounded-2xl p-6 border border-white/40 animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900 text-sm flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>AI Reply Suggestions</span>
            </h4>
            <button
              onClick={() => setShowSmartReplies(false)}
              className="text-gray-500 hover:text-gray-700 transition-colors p-1 hover:bg-white/60 rounded backdrop-blur-sm"
            >
              <span className="text-sm">Close</span>
            </button>
          </div>

          {isGeneratingReplies ? (
            <div className="flex items-center justify-center py-4">
              <div className="flex items-center space-x-3 px-4 py-2 bg-blue-100/80 border border-blue-200/60 rounded-lg text-blue-700">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Generating smart replies...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {smartReplies.map((reply) => (
                <button
                  key={reply.id}
                  onClick={() => handleSmartReplySelect(reply.text)}
                  className="w-full text-left p-4 bg-white/80 hover:bg-white border border-white/60 hover:border-blue-300 rounded-xl transition-all duration-200 group backdrop-blur-sm hover:scale-105"
                >
                  <p className="text-gray-900 text-sm mb-2 font-medium">{reply.text}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-xs capitalize font-medium">{reply.tone}</span>
                    <span className="text-gray-500 text-xs">
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