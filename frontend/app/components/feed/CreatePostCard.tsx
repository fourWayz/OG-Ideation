'use client';

import { useState, useRef } from 'react';
import { useAccount } from 'wagmi';
import { Image, Video, FileText, Send, X } from 'lucide-react';
import { usePosts } from '@/app/hooks/usePosts';
import { toast } from 'react-hot-toast';

export function CreatePostCard() {
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { address } = useAccount();
  const { createPost, isCreating } = usePosts();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('Image must be smaller than 10MB');
      return;
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !selectedImage) {
      toast.error('Please add some content or an image');
      return;
    }

    try {
      await createPost({ content: content.trim(), image: selectedImage || undefined });
      setContent('');
      removeImage();
      toast.success('Post created successfully!');
    } catch (error: any) {
      console.error('Failed to create post:', error);
      toast.error(error?.message || 'Failed to create post');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
    <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share your story with the world..."
        className="w-full resize-none border border-gray-200/80 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 text-gray-800 placeholder-gray-500/70 min-h-[120px] p-5 text-lg leading-relaxed bg-white/50 backdrop-blur-sm transition-all duration-300 font-medium shadow-inner"
        disabled={isCreating}
        style={{ 
          fontFamily: 'var(--font-inter), system-ui, sans-serif',
          lineHeight: '1.6'
        }}
      />
      {content.length > 0 && (
        <div className="absolute bottom-3 right-3 text-xs text-gray-500/70 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full border border-white/50">
          {content.length}
        </div>
      )}
    </div>
        
        {/* Image Preview */}
        {imagePreview && (
          <div className="relative rounded-xl overflow-hidden border border-gray-200">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="w-full max-h-96 object-cover"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-3 right-3 bg-black/70 hover:bg-black/90 text-white p-2 rounded-full transition-all duration-200 hover:scale-110"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        {/* Action Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-1">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
              disabled={isCreating}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200 disabled:opacity-50"
              disabled={isCreating}
            >
              <Image className="w-5 h-5" />
              <span className="text-sm font-medium">Photo</span>
            </button>
            
            <button
              type="button"
              className="flex items-center space-x-2 px-3 py-2 text-gray-400 rounded-lg cursor-not-allowed"
              disabled
              title="Coming soon"
            >
              <Video className="w-5 h-5" />
              <span className="text-sm font-medium">Video</span>
            </button>
            
            <button
              type="button"
              className="flex items-center space-x-2 px-3 py-2 text-gray-400 rounded-lg cursor-not-allowed"
              disabled
              title="Coming soon"
            >
              <FileText className="w-5 h-5" />
              <span className="text-sm font-medium">File</span>
            </button>
          </div>
          
          <button
            type="submit"
            disabled={(!content.trim() && !selectedImage) || isCreating}
            className="flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isCreating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Posting...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Post</span>
              </>
            )}
          </button>
        </div>

        {/* Helper Text */}
        <div className="text-xs text-gray-500 text-center">
          {!content.trim() && !selectedImage && "Share your thoughts or upload an image to get started"}
        </div>
      </form>
    </div>
  );
}