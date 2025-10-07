'use client';

import { usePosts } from '@/app/hooks/usePosts';
import { PostCard } from '@/app/components/feed/PostCard';
import { LoadingSpinner } from '@/app/components/ui/LoadingSpinner';

export function Feed() {
  const { posts, isLoading, error } = usePosts();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-gray-500">
        Error loading posts
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