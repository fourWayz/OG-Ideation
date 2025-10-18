'use client';

import { usePosts } from '@/app/hooks/usePosts';
import { PostCard } from '@/app/components/feed/PostCard';
import { LoadingSpinner } from '@/app/components/ui/LoadingSpinner';

export function Feed() {
  const { posts, isLoading, error } = usePosts();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" className="border-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-gray-600 glass rounded-2xl p-8">
        <p className="text-lg font-medium text-gray-700 mb-2">Error loading posts</p>
        <p className="text-sm text-gray-600">Please try refreshing the page</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}