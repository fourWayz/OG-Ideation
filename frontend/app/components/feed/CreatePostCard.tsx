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
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full resize-none border-0 focus:ring-0 text-lg placeholder-gray-400 min-h-[100px] p-0"
          disabled={isCreating}
        />
        
        {/* Image Preview */}
        {imagePreview && (
          <div className="relative rounded-lg overflow-hidden">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="w-full max-h-96 object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              disabled={isCreating}
            >
              <Image className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              disabled
            >
              <Video className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              disabled
            >
              <FileText className="w-5 h-5" />
            </button>
          </div>
          
          <button
            type="submit"
            disabled={(!content.trim() && !selectedImage) || isCreating}
            className="flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            <span>{isCreating ? 'Posting...' : 'Post'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}