'use client';

import { cn } from '@/app/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-gray-300 border-t-blue-500',
        sizeClasses[size],
        className
      )}
    />
  );
}

// Skeleton loading components for better UX
export function PostSkeleton() {
  return (
    <div className="glass rounded-2xl p-6 animate-pulse">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-gray-200/80 rounded-full backdrop-blur-sm"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200/80 rounded w-24 backdrop-blur-sm"></div>
          <div className="h-3 bg-gray-200/80 rounded w-16 backdrop-blur-sm"></div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200/80 rounded w-full backdrop-blur-sm"></div>
        <div className="h-4 bg-gray-200/80 rounded w-3/4 backdrop-blur-sm"></div>
        <div className="h-4 bg-gray-200/80 rounded w-1/2 backdrop-blur-sm"></div>
      </div>
      <div className="flex space-x-4 mt-4 pt-4 border-t border-gray-200/50">
        <div className="h-8 bg-gray-200/80 rounded w-16 backdrop-blur-sm"></div>
        <div className="h-8 bg-gray-200/80 rounded w-16 backdrop-blur-sm"></div>
        <div className="h-8 bg-gray-200/80 rounded w-16 backdrop-blur-sm"></div>
      </div>
    </div>
  );
}

export function FeedSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="glass rounded-2xl p-6 animate-pulse">
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-20 h-20 bg-gray-200/80 rounded-full backdrop-blur-sm"></div>
        <div className="space-y-2 flex-1">
          <div className="h-6 bg-gray-200/80 rounded w-32 backdrop-blur-sm"></div>
          <div className="h-4 bg-gray-200/80 rounded w-48 backdrop-blur-sm"></div>
          <div className="h-4 bg-gray-200/80 rounded w-24 backdrop-blur-sm"></div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="h-6 bg-gray-200/80 rounded w-16 mx-auto mb-1 backdrop-blur-sm"></div>
          <div className="h-4 bg-gray-200/80 rounded w-12 mx-auto backdrop-blur-sm"></div>
        </div>
        <div className="text-center">
          <div className="h-6 bg-gray-200/80 rounded w-16 mx-auto mb-1 backdrop-blur-sm"></div>
          <div className="h-4 bg-gray-200/80 rounded w-12 mx-auto backdrop-blur-sm"></div>
        </div>
        <div className="text-center">
          <div className="h-6 bg-gray-200/80 rounded w-16 mx-auto mb-1 backdrop-blur-sm"></div>
          <div className="h-4 bg-gray-200/80 rounded w-12 mx-auto backdrop-blur-sm"></div>
        </div>
      </div>
    </div>
  );
}