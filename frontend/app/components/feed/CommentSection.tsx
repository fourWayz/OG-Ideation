'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { usePosts } from '@/app/hooks/usePosts';
import { MessageCircle, Send, User } from 'lucide-react';
import { LoadingSpinner } from '@/app/components/ui/LoadingSpinner';
import { formatDate } from '@/app/lib/utils';
import toast from 'react-hot-toast';

interface CommentSectionProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CommentSection({ postId, isOpen, onClose }: CommentSectionProps) {
  const [comment, setComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [postComments, setPostComments] = useState<any[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  
  const { address } = useAccount();
  const { addComment, isCommenting, getPostComments } = usePosts();

  // Load comments when section is opened
  useEffect(() => {
    if (isOpen && showComments) {
      loadComments();
    }
  }, [isOpen, showComments]);

  const loadComments = async () => {
    setIsLoadingComments(true);
    try {
      const comments = await getPostComments(postId);
      setPostComments(comments);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      await addComment({ postId, content: comment });
      toast.success('Comment added!');
      setComment('');
      // Reload comments after adding new one
      loadComments();
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="border-t border-gray-100 pt-4 mt-4">
      {/* Comment Input */}
      <form onSubmit={handleSubmit} className="flex space-x-3 mb-4">
        <div className="flex-1">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isCommenting}
          />
        </div>
        <button
          type="submit"
          disabled={!comment.trim() || isCommenting}
          className="px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isCommenting ? <LoadingSpinner size="sm" /> : <Send className="w-4 h-4" />}
        </button>
      </form>

      {/* View Comments Toggle */}
      <button
        onClick={() => setShowComments(!showComments)}
        className="flex items-center space-x-2 text-gray-600 hover:text-indigo-600 mb-4 transition-colors"
      >
        <MessageCircle className="w-4 h-4" />
        <span className="text-sm font-medium">
          {showComments ? 'Hide Comments' : 'View Comments'}
        </span>
      </button>

      {/* Comments List */}
      {showComments && (
        <div className="space-y-4">
          {isLoadingComments ? (
            <div className="flex justify-center py-4">
              <LoadingSpinner size="sm" />
            </div>
          ) : postComments.length > 0 ? (
            postComments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))
          ) : (
            <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No comments yet. Be the first to comment!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CommentItem({ comment }: { comment: any }) {
  return (
    <div className="flex space-x-3">
      {/* Commenter Avatar */}
      {comment.commenterProfile?.profileImage ? (
        <img 
          src={comment.commenterProfile.profileImage} 
          alt={comment.commenterProfile.username}
          className="w-8 h-8 rounded-full flex-shrink-0"
        />
      ) : (
        <div className="w-8 h-8 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
          {comment.commenter.slice(2, 4).toUpperCase()}
        </div>
      )}
      
      {/* Comment Content */}
      <div className="flex-1 min-w-0">
        <div className="bg-gray-50 rounded-2xl px-4 py-3">
          <div className="flex items-baseline space-x-2 mb-1">
            <span className="font-semibold text-gray-900 text-sm">
              {comment.commenterProfile?.username || `${comment.commenter.slice(0, 6)}...${comment.commenter.slice(-4)}`}
            </span>
            <span className="text-xs text-gray-500">
              {formatDate(comment.timestamp)}
            </span>
          </div>
          <p className="text-gray-800 text-sm">{comment.content}</p>
        </div>
        
        {/* Comment Actions */}
        <div className="flex items-center space-x-4 mt-2 px-1">
          <button className="text-xs text-gray-500 hover:text-indigo-600 transition-colors">
            Like
          </button>
          <button className="text-xs text-gray-500 hover:text-indigo-600 transition-colors">
            Reply
          </button>
        </div>
      </div>
    </div>
  );
}