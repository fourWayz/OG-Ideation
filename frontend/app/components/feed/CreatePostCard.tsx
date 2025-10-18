'use client';

import { useState, useRef, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Image, Video, FileText, Send, X, Sparkles, Zap, Wand2, Smile } from 'lucide-react';
import { usePosts } from '@/app/hooks/usePosts';
import { useAIContent } from '@/app/hooks/useAIContent';
import { useUserProfile } from '@/app/hooks/useUserProfile';
import { toast } from 'react-hot-toast';


interface AIOptionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
  color: 'blue' | 'green' | 'orange';
}


export function CreatePostCard() {
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [showAIOptions, setShowAIOptions] = useState(false);
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [charCount, setCharCount] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { address } = useAccount();
  const { createPost, isCreating } = usePosts();
  const { generateContent } = useAIContent();
  const { data: userProfile } = useUserProfile(address);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  useEffect(() => {
    setCharCount(content.length);
  }, [content]);

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
    toast.success('Image added!');
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success('Image removed');
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
      toast.success('🎉 Post created successfully!');
    } catch (error: any) {
      console.error('Failed to create post:', error);
      toast.error(error?.message || 'Failed to create post');
    }
  };

  const generateAIContent = async (type: 'post' | 'meme' | 'question') => {
    if (isAIGenerating) return;
    
    setIsAIGenerating(true);
    toast.loading('✨ AI is crafting your content...', { id: 'ai-generate' });
    
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
        toast.success('✨ AI content generated!', { id: 'ai-generate' });
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error('Failed to generate AI content', { id: 'ai-generate' });
    } finally {
      setIsAIGenerating(false);
    }
  };

  const enhanceWithAI = async () => {
    if (!content.trim() || isAIGenerating) return;
    
    setIsAIGenerating(true);
    toast.loading('🔮 Enhancing your content...', { id: 'ai-enhance' });
    
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
        toast.success('🎨 Content enhanced!', { id: 'ai-enhance' });
      }
    } catch (error) {
      console.error('AI enhancement error:', error);
      toast.error('Failed to enhance content', { id: 'ai-enhance' });
    } finally {
      setIsAIGenerating(false);
    }
  };

  const getCharCountColor = () => {
    if (charCount > 240) return 'text-red-400';
    if (charCount > 200) return 'text-yellow-400';
    return 'text-white/50';
  };

  return (
    <div className="glass-card rounded-3xl p-8 hover:shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-top-4">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header with Visual Feedback */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center border border-blue-500/30 animate-pulse">
              <span className="text-lg">💬</span>
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg">Create Post</h3>
              <p className="text-white/60 text-sm">Share your thoughts with the community</p>
            </div>
          </div>
          
          {/* Online Indicator */}
          <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/20 rounded-full border border-green-500/30">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-300 text-xs font-medium">Online</span>
          </div>
        </div>

        {/* Enhanced Textarea */}
        <div className="relative group">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind? Share your thoughts, ask a question, or let AI help you get started..."
            className="w-full resize-none glass-input rounded-2xl focus:ring-2 focus:ring-blue-500/50 text-white placeholder-white/40 min-h-[120px] p-6 text-lg leading-relaxed transition-all duration-300 font-medium backdrop-blur-sm group-hover:border-white/40"
            disabled={isCreating}
            style={{ 
              fontFamily: 'var(--font-inter), system-ui, sans-serif',
              lineHeight: '1.6'
            }}
          />
          
          {/* Floating Action Buttons */}
          <div className="absolute top-4 right-4 flex items-center space-x-2">
            {/* Enhance Button */}
            {content.trim() && !isAIGenerating && (
              <button
                type="button"
                onClick={enhanceWithAI}
                className="flex items-center space-x-1 px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-300 hover:text-purple-200 transition-all duration-200 text-sm backdrop-blur-sm hover:scale-105"
                title="Enhance with AI"
              >
                <Wand2 className="w-3 h-3" />
                <span>Enhance</span>
              </button>
            )}
            
            {/* Character Count */}
            <div className={`text-sm bg-white/10 backdrop-blur-sm px-2 py-1 rounded border border-white/20 ${getCharCountColor()}`}>
              {charCount}/280
            </div>
          </div>

          {/* AI Generating Indicator */}
          {isAIGenerating && (
            <div className="absolute inset-0 bg-white/5 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <div className="flex items-center space-x-3 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-300">
                <div className="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">AI is crafting your content...</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Enhanced Image Preview */}
        {imagePreview && (
          <div className="relative rounded-2xl overflow-hidden border border-white/20 group animate-in zoom-in duration-300">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="w-full max-h-96 object-cover transition-transform group-hover:scale-105 duration-500"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-4 right-4 bg-black/70 hover:bg-black/90 text-white p-2 rounded-full transition-all duration-200 hover:scale-110 backdrop-blur-sm transform-gpu"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
              <p className="text-white text-sm">Image preview • Click X to remove</p>
            </div>
          </div>
        )}
        
        {/* Enhanced Action Bar */}
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
              className="flex items-center space-x-2 px-4 py-3 text-white/80 hover:text-white hover:bg-blue-500/20 rounded-xl transition-all duration-200 disabled:opacity-50 backdrop-blur-sm border border-transparent hover:border-blue-500/30 group"
              disabled={isCreating}
            >
              <Image className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Photo</span>
            </button>
            
            <button
              type="button"
              className="flex items-center space-x-2 px-4 py-3 text-white/40 rounded-xl cursor-not-allowed backdrop-blur-sm group"
              disabled
              title="Coming soon - Video uploads"
            >
              <Video className="w-5 h-5" />
              <span className="text-sm font-medium">Video</span>
              <span className="text-xs bg-yellow-500/20 text-yellow-300 px-1 rounded">Soon</span>
            </button>

            {/* AI Assistant Button */}
            <button
              type="button"
              onClick={() => setShowAIOptions(!showAIOptions)}
              disabled={isCreating || isAIGenerating}
              className="flex items-center space-x-2 px-4 py-3 text-purple-300 hover:text-purple-200 hover:bg-purple-500/20 rounded-xl transition-all duration-200 disabled:opacity-50 backdrop-blur-sm border border-purple-500/30 hover:border-purple-500/50 group"
            >
              <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">AI Assistant</span>
            </button>
          </div>
          
          {/* Submit Button with Enhanced States */}
          <button
            type="submit"
            disabled={(!content.trim() && !selectedImage) || isCreating || isAIGenerating}
            className="flex items-center space-x-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none backdrop-blur-sm border border-blue-500/30 hover:border-blue-400/50 animate-glow"
          >
            {isCreating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Posting...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Post to ChainChat</span>
              </>
            )}
          </button>
        </div>

        {/* Enhanced AI Options Panel */}
        {showAIOptions && (
          <div className="glass rounded-2xl p-6 border border-white/20 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center border border-purple-500/30">
                  <Zap className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">AI Content Assistant</h4>
                  <p className="text-white/60 text-sm">Let AI help you create engaging content</p>
                </div>
              </div>
              <button
                onClick={() => setShowAIOptions(false)}
                className="text-white/60 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AIOptionCard
                icon="📝"
                title="Generate Post"
                description="AI-written social media content"
                onClick={() => generateAIContent('post')}
                disabled={isAIGenerating}
                color="blue"
              />
              
              <AIOptionCard
                icon="😂"
                title="Meme Idea"
                description="Funny captions and ideas"
                onClick={() => generateAIContent('meme')}
                disabled={isAIGenerating}
                color="green"
              />
              
              <AIOptionCard
                icon="💬"
                title="Ask Question"
                description="Engage your community"
                onClick={() => generateAIContent('question')}
                disabled={isAIGenerating}
                color="orange"
              />
            </div>

            <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
              <p className="text-white/70 text-xs text-center">
                ✨ Powered by OG Chain Inference • Personalized based on your interests
              </p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

// AI Option Card Component
function AIOptionCard({
  icon,
  title,
  description,
  onClick,
  disabled = false,
  color,
}: AIOptionCardProps) {
  const colorClasses: Record<'blue' | 'green' | 'orange', string> = {
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30 hover:border-blue-400/50',
    green: 'from-green-500/20 to-green-600/20 border-green-500/30 hover:border-green-400/50',
    orange: 'from-orange-500/20 to-orange-600/20 border-orange-500/30 hover:border-orange-400/50',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center p-5 bg-gradient-to-br ${colorClasses[color]} rounded-xl transition-all duration-300 disabled:opacity-50 group hover:scale-105 border backdrop-blur-sm`}
    >
      <div className="text-2xl mb-3 group-hover:scale-110 transition-transform">{icon}</div>
      <span className="text-white text-sm font-semibold text-center mb-1">{title}</span>
      <span className="text-white/60 text-xs text-center">{description}</span>
    </button>
  );
}