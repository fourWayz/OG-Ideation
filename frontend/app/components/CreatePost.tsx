'use client';

import { useState } from 'react';
import { useChainchat } from '@/app/hooks/useChainchat';
import { useAccount } from 'wagmi';
import { ogStorage } from '@/app/lib/og-storage';
import { ogInference } from '@/app/lib/og-inference';
import { useWriteContract } from 'wagmi';
import { useGaslessTransactions } from '@/app/hooks/useGaslessTransactions';
import { useGaslessContract } from '@/app/hooks/useGaslessContract';

export function CreatePost() {
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { chainchat } = useChainchat();
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract()

  const { createPost } = useGaslessContract();
  const { loginToRelayer } = useGaslessTransactions();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content || !chainchat || !address) return;

    setIsLoading(true);
    try {

      // First login to relayer for authentication
      await loginToRelayer();
      // Upload content to OG Storage
      const contentData = {
        text: content,
        timestamp: Date.now(),
        author: address,
      };

      const contentCID = await ogStorage.uploadJSON(contentData);

      // Generate embedding for AI recommendations
      const embedding = await ogInference.generateEmbedding(content);
      const embeddingCID = await ogStorage.uploadJSON({
        embedding,
        content_cid: contentCID,
      });

      // Upload image if provided
      let imageCID = '';
      if (image) {
        imageCID = (await ogStorage.uploadProfile(image)).cid;
      }

      // Store on-chain
      // ✅ Store on-chain with wagmi
      const txHash = await writeContractAsync({
        address: chainchat.address,
        abi: chainchat.abi,
        functionName: 'createPost',
        args: [contentCID, imageCID],
      });

      console.log('tx hash:', txHash);

      setContent('');
      setImage(null);

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

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files?.[0] || null)}
          className="w-full p-2 border border-gray-300 rounded-lg"
          disabled={isLoading}
        />

        <button
          type="submit"
          disabled={!content || isLoading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating post with AI...' : 'Create Post'}
        </button>
      </form>
    </div>
  );
}