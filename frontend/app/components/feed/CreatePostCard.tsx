'use client';

import { useState, useRef } from 'react';
import { useAccount } from 'wagmi';
import { Image, Video, FileText, Send, X, Sparkles, Zap, Wand2 } from 'lucide-react';
import { usePosts } from '@/app/hooks/usePosts';
import { useAIContent } from '@/app/hooks/useAIContent';
import { useUserProfile } from '@/app/hooks/useUserProfile';
import { toast } from 'react-hot-toast';

export function CreatePostCard() {
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [showAIOptions, setShowAIOptions] = useState(false);
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { address } = useAccount();
  const { createPost, isCreating } = usePosts();
  const { generateContent } = useAIContent();
  const { data: userProfile } = useUserProfile(address);

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
      setShowAIOptions(false);
      toast.success('Post created successfully!');
    } catch (error: any) {
      console.error('Failed to create post:', error);
      toast.error(error?.message || 'Failed to create post');
    }
  };

  const generateAIContent = async (type: 'post' | 'meme' | 'question') => {
    if (isAIGenerating) return;
    
    setIsAIGenerating(true);
    try {
      const result = await generateContent({
        userInterests: userProfile?.interests || ['technology', 'blockchain', 'web3'],
        mood: 'engaging',
        context: content || 'social media content',
        type
      });

      if (result.success) {
        let aiContent = '';
        
        if (type === 'post') {
          const hashtags = (result.content.hashtags || []).join(' ');
          aiContent = `${result.content.content} ${hashtags}`;
        } else if (type === 'meme') {
          aiContent = `😂 ${result.content.caption} #Meme #Funny`;
        } else if (type === 'question') {
          const hashtags = (result.content.hashtags || []).join(' ');
          aiContent = `${result.content.question} ${hashtags}`;
        }

        setContent(aiContent);
        setShowAIOptions(false);
        toast.success('AI content generated!');
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error('Failed to generate AI content');
    } finally {
      setIsAIGenerating(false);
    }
  };

  const enhanceWithAI = async () => {
    if (!content.trim() || isAIGenerating) return;
    
    setIsAIGenerating(true);
    try {
      const result = await generateContent({
        userInterests: userProfile?.interests || ['technology', 'blockchain'],
        mood: 'improved',
        context: content,
        type: 'post'
      });

      if (result.success && result.content.content) {
        const hashtags = (result.content.hashtags || []).join(' ');
        setContent(`${result.content.content} ${hashtags}`);
        toast.success('Content enhanced with AI!');
      }
    } catch (error) {
      console.error('AI enhancement error:', error);
      toast.error('Failed to enhance content');
    } finally {
      setIsAIGenerating(false);
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
          
          {/* AI Enhance Button (shown when there's content) */}
          {content.trim() && !isAIGenerating && (
            <button
              type="button"
              onClick={enhanceWithAI}
              className="absolute top-4 right-4 flex items-center space-x-1 px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-300 hover:text-purple-200 transition-all duration-200 text-sm backdrop-blur-sm"
            >
              <Wand2 className="w-3 h-3" />
              <span>Enhance</span>
            </button>
          )}
          
          {content.length > 0 && (
            <div className="absolute bottom-4 right-4 text-sm text-white/50 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">
              {content.length}
            </div>
          )}

          {/* AI Generating Indicator */}
          {isAIGenerating && (
            <div className="absolute top-4 right-4 flex items-center space-x-2 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-300 text-sm backdrop-blur-sm">
              <div className="w-3 h-3 border-2 border-blue-300 border-t-transparent rounded-full animate-spin" />
              <span>AI Thinking...</span>
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
            {/* File Upload Buttons */}
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

            {/* AI Assistant Button */}
            <button
              type="button"
              onClick={() => setShowAIOptions(!showAIOptions)}
              disabled={isCreating || isAIGenerating}
              className="flex items-center space-x-2 px-4 py-3 text-purple-300 hover:text-purple-200 hover:bg-purple-500/20 rounded-xl transition-all duration-200 disabled:opacity-50 backdrop-blur-sm border border-purple-500/30 hover:border-purple-500/50"
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-medium">AI Assistant</span>
            </button>
          </div>
          
          <button
            type="submit"
            disabled={(!content.trim() && !selectedImage) || isCreating || isAIGenerating}
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

        {/* AI Options Panel */}
        {showAIOptions && (
          <div className="glass rounded-2xl p-6 border border-white/20 animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-white flex items-center space-x-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span>AI Content Assistant</span>
              </h4>
              <button
                onClick={() => setShowAIOptions(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => generateAIContent('post')}
                disabled={isAIGenerating}
                className="flex flex-col items-center p-4 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl transition-all duration-200 disabled:opacity-50 group"
              >
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-white text-sm font-medium text-center">Generate Post</span>
                <span className="text-white/60 text-xs text-center mt-1">AI-written content</span>
              </button>

              <button
                type="button"
                onClick={() => generateAIContent('meme')}
                disabled={isAIGenerating}
                className="flex flex-col items-center p-4 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-xl transition-all duration-200 disabled:opacity-50 group"
              >
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <span className="text-lg">😂</span>
                </div>
                <span className="text-white text-sm font-medium text-center">Meme Idea</span>
                <span className="text-white/60 text-xs text-center mt-1">Funny caption</span>
              </button>

              <button
                type="button"
                onClick={() => generateAIContent('question')}
                disabled={isAIGenerating}
                className="flex flex-col items-center p-4 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 rounded-xl transition-all duration-200 disabled:opacity-50 group"
              >
                <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <span className="text-lg">💬</span>
                </div>
                <span className="text-white text-sm font-medium text-center">Ask Question</span>
                <span className="text-white/60 text-xs text-center mt-1">Engage community</span>
              </button>
            </div>

            <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
              <p className="text-white/70 text-xs text-center">
                Powered by OG Chain Inference • Uses your interests to personalize content
              </p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}