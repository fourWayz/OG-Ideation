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

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
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
    <div className="glass-card rounded-3xl p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Premium Textarea */}
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?..."
            className="w-full resize-none glass-input rounded-2xl focus:ring-2 focus:ring-white/50 text-white placeholder-white/60 min-h-[140px] p-6 text-lg leading-relaxed transition-all duration-300 font-medium backdrop-blur-sm"
            disabled={isCreating}
            style={{ 
              fontFamily: 'var(--font-inter), system-ui, sans-serif',
              lineHeight: '1.6'
            }}
          />
          {content.length > 0 && (
            <div className="absolute bottom-4 right-4 text-sm text-white/50 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">
              {content.length}
            </div>
          )}
        </div>
        
        {/* Image Preview */}
        {imagePreview && (
          <div className="relative rounded-2xl overflow-hidden border border-white/20">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="w-full max-h-96 object-cover"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 hover:scale-110 backdrop-blur-sm"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        {/* Action Bar */}
        <div className="flex items-center justify-between pt-6 border-t border-white/20">
          <div className="flex items-center space-x-2">
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
              className="flex items-center space-x-2 px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 disabled:opacity-50 backdrop-blur-sm"
              disabled={isCreating}
            >
              <Image className="w-5 h-5" />
              <span className="text-sm font-medium">Photo</span>
            </button>
            
            <button
              type="button"
              className="flex items-center space-x-2 px-4 py-3 text-white/40 rounded-xl cursor-not-allowed backdrop-blur-sm"
              disabled
              title="Coming soon"
            >
              <Video className="w-5 h-5" />
              <span className="text-sm font-medium">Video</span>
            </button>
          </div>
          
          <button
            type="submit"
            disabled={(!content.trim() && !selectedImage) || isCreating}
            className="flex items-center space-x-3 bg-gradient-to-r from-white/30 to-white/10 text-white px-8 py-3 rounded-xl font-semibold hover:bg-white/20 border border-white/20 hover:border-white/30 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none backdrop-blur-sm"
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
      </form>
    </div>
  );
}