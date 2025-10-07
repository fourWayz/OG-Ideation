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
        'animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600',
        sizeClasses[size],
        className
      )}
    />
  );
}

// Skeleton loading components for better UX
export function PostSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
      <div className="flex space-x-4 mt-4 pt-4 border-t border-gray-100">
        <div className="h-8 bg-gray-200 rounded w-16"></div>
        <div className="h-8 bg-gray-200 rounded w-16"></div>
        <div className="h-8 bg-gray-200 rounded w-16"></div>
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
        <div className="space-y-2 flex-1">
          <div className="h-6 bg-gray-200 rounded w-32"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="h-6 bg-gray-200 rounded w-16 mx-auto mb-1"></div>
          <div className="h-4 bg-gray-200 rounded w-12 mx-auto"></div>
        </div>
        <div className="text-center">
          <div className="h-6 bg-gray-200 rounded w-16 mx-auto mb-1"></div>
          <div className="h-4 bg-gray-200 rounded w-12 mx-auto"></div>
        </div>
        <div className="text-center">
          <div className="h-6 bg-gray-200 rounded w-16 mx-auto mb-1"></div>
          <div className="h-4 bg-gray-200 rounded w-12 mx-auto"></div>
        </div>
      </div>
    </div>
  );
}