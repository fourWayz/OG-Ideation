'use client';

import { useState } from 'react';
import { useChainchat } from '../hooks/useChainchat';
import { useAccount } from 'wagmi';

export function CreatePost() {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { chainchat } = useChainchat();
  const { address } = useAccount();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content || !chainchat || !address) return;

    setIsLoading(true);
    try {
      // In production, you'd upload to IPFS/OG Storage first
      const contentCID = `ipfs://mock-cid-${Date.now()}`;
      
      const tx = await chainchat.createPost(contentCID, '');
      await tx.wait();
      
      setContent('');
      // Refresh feed
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!content || isLoading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Posting...' : 'Post'}
        </button>
      </form>
    </div>
  );
}