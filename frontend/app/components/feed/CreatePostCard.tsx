'use client';

import { useState, useRef, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Image, Video, FileText, Send, X, Sparkles, Zap, Wand2, Smile, Hash } from 'lucide-react';
import { usePosts } from '@/app/hooks/usePosts';
import { useAIContent } from '@/app/hooks/useAIContent';
import { useUserProfile } from '@/app/hooks/useUserProfile';
import { useHashtagSuggestions } from '@/app/hooks/useHashtagSuggestions';
import { useContentFiltering } from '@/app/hooks/useContentFiltering';
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
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false);
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [hashtagSuggestions, setHashtagSuggestions] = useState<any[]>([]);
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [contentSafety, setContentSafety] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { address } = useAccount();
  const { createPost, isCreating } = usePosts();
  const { generateContent } = useAIContent();
  const { data: userProfile } = useUserProfile(address);
  const { suggestHashtags, isSuggesting: isSuggestingHashtags } = useHashtagSuggestions();
  const { analyzeContent } = useContentFiltering();

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

  // Analyze content safety and suggest hashtags when content changes
  useEffect(() => {
    const analyzeContentSafety = async () => {
      if (content.trim().length > 10) {
        const analysis = await analyzeContent(content);
        setContentSafety(analysis);
        
        // Only suggest hashtags if content is safe
        if (analysis.isSafe) {
          const suggestions = await suggestHashtags({ content, userInterests: userProfile?.interests });
          setHashtagSuggestions(suggestions);
        }
      }
    };

    const debounceTimer = setTimeout(analyzeContentSafety, 1000);
    return () => clearTimeout(debounceTimer);
  }, [content, userProfile?.interests]);

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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Final safety check
    if (contentSafety && !contentSafety.isSafe) {
      toast.error('Please review your content before posting');
      return;
    }

    if (!content.trim() && !selectedImage) {
      toast.error('Please add some content or an image');
      return;
    }

    try {
      const finalContent = selectedHashtags.length > 0 
        ? `${content.trim()} ${selectedHashtags.join(' ')}`
        : content.trim();

      await createPost({ content: finalContent, image: selectedImage || undefined });
      setContent('');
      setSelectedHashtags([]);
      removeImage();
      setShowAIOptions(false);
      setShowHashtagSuggestions(false);
      toast.success('🎉 Post created successfully!');
    } catch (error: any) {
      const errMsg = String(error?.message || '');

      // errors to suppress
      const ignoreErrors = [
        'no matching receipts found',
        'could not coalesce error',
        'Internal JSON-RPC error',
        'eth_getTransactionReceipt'
      ];

      // Check if error matches any known pattern
      const isRpcSyncError = ignoreErrors.some((msg) => errMsg.includes(msg));

      if (isRpcSyncError) {
        console.warn('⚠️ Ignored harmless RPC sync error:', error);
        toast.success('Post created! (receipt syncing)');
        return;
      }

      // Otherwise show the real error
      console.error('Failed to create post:', error);
      toast.error('Failed to create post. Please try again.');
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

  const addHashtag = (hashtag: string) => {
    if (!selectedHashtags.includes(hashtag)) {
      setSelectedHashtags(prev => [...prev, hashtag]);
    }
    setShowHashtagSuggestions(false);
  };

  const removeHashtag = (hashtagToRemove: string) => {
    setSelectedHashtags(prev => prev.filter(tag => tag !== hashtagToRemove));
  };

  const getCharCountColor = () => {
    if (charCount > 240) return 'text-red-500';
    if (charCount > 200) return 'text-yellow-500';
    return 'text-gray-500';
  };

  const getSafetyIndicator = () => {
    if (!contentSafety) return null;
    
    if (contentSafety.isSafe && contentSafety.confidence > 0.8) {
      return (
        <div className="flex items-center space-x-1 px-2 py-1 bg-green-500/20 rounded-full border border-green-500/30">
          <span className="text-green-400 text-xs">✓ Safe</span>
        </div>
      );
    }
    
    if (!contentSafety.isSafe) {
      return (
        <div className="flex items-center space-x-1 px-2 py-1 bg-red-500/20 rounded-full border border-red-500/30">
          <span className="text-red-400 text-xs">⚠️ Review</span>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="glass-card rounded-3xl p-8 hover:shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-top-4">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header with Visual Feedback and Safety Indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-xl flex items-center justify-center border border-white/40 shadow-sm">
              <span className="text-lg">💬</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">Create Post</h3>
              <p className="text-gray-600 text-sm">Share your thoughts with the community</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Online Indicator */}
            <div className="flex items-center space-x-2 px-3 py-1 bg-green-100/80 rounded-full border border-green-200/60 backdrop-blur-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-700 text-xs font-medium">Online</span>
            </div>
            
            {/* Safety Indicator */}
            {getSafetyIndicator()}
          </div>
        </div>

        {/* Enhanced Textarea */}
        <div className="relative group">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind? Share your thoughts, ask a question, or let AI help you get started..."
            className="w-full resize-none glass-input rounded-2xl focus:ring-2 focus:ring-blue-300 text-gray-900 placeholder-gray-500 min-h-[120px] p-6 text-lg leading-relaxed transition-all duration-300 font-medium backdrop-blur-sm group-hover:border-white/60"
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
                className="flex items-center space-x-1 px-3 py-1 bg-purple-100/80 hover:bg-purple-200/80 border border-purple-200/60 rounded-lg text-purple-700 hover:text-purple-800 transition-all duration-200 text-sm backdrop-blur-sm hover:scale-105"
                title="Enhance with AI"
              >
                <Wand2 className="w-3 h-3" />
                <span>Enhance</span>
              </button>
            )}

            {/* Character Count */}
            <div className={`text-sm bg-white/80 backdrop-blur-sm px-2 py-1 rounded border border-white/60 ${getCharCountColor()}`}>
              {charCount}/280
            </div>
          </div>

          {/* AI Generating Indicator */}
          {isAIGenerating && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <div className="flex items-center space-x-3 px-4 py-2 bg-blue-100/80 border border-blue-200/60 rounded-lg text-blue-700">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">AI is crafting your content...</span>
              </div>
            </div>
          )}
        </div>

        {/* Selected Hashtags */}
        {selectedHashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 animate-in fade-in">
            {selectedHashtags.map((hashtag) => (
              <div
                key={hashtag}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-100/80 rounded-full border border-blue-200/60 backdrop-blur-sm"
              >
                <span className="text-blue-700 text-sm">{hashtag}</span>
                <button
                  type="button"
                  onClick={() => removeHashtag(hashtag)}
                  className="text-blue-500 hover:text-blue-700 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Enhanced Image Preview */}
        {imagePreview && (
          <div className="relative rounded-2xl overflow-hidden border border-white/40 group animate-in zoom-in duration-300">
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

        {/* Hashtag Suggestions */}
        {showHashtagSuggestions && hashtagSuggestions.length > 0 && (
          <div className="glass rounded-2xl p-6 border border-white/40 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900 text-sm flex items-center space-x-2">
                <Hash className="w-4 h-4 text-blue-500" />
                <span>Suggested Hashtags</span>
              </h4>
              <button
                onClick={() => setShowHashtagSuggestions(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors p-1 hover:bg-white/60 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {hashtagSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => addHashtag(suggestion.tag)}
                  className="flex items-center space-x-2 px-3 py-2 bg-white/80 hover:bg-white border border-white/60 hover:border-blue-300 rounded-lg transition-all duration-200 group backdrop-blur-sm hover:scale-105"
                >
                  <span className="text-gray-900 text-sm font-medium">{suggestion.tag}</span>
                  <div className="flex items-center space-x-1 text-gray-500 text-xs">
                    <span>{Math.round(suggestion.relevance * 100)}%</span>
                    <span>•</span>
                    <span>{suggestion.category}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-gray-200/50">
          {/* Left Actions */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
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
              className="flex items-center space-x-2 px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-white/80 rounded-xl transition-all duration-200 disabled:opacity-50 backdrop-blur-sm border border-transparent hover:border-white/60 group flex-shrink-0"
              disabled={isCreating}
            >
              <Image className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium hidden sm:inline">Photo</span>
            </button>

            <button
              type="button"
              className="flex items-center space-x-2 px-4 py-3 text-gray-400 rounded-xl cursor-not-allowed backdrop-blur-sm group flex-shrink-0"
              disabled
              title="Coming soon - Video uploads"
            >
              <Video className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">Video</span>
              <span className="text-xs bg-yellow-100 text-yellow-700 px-1 rounded hidden sm:inline">Soon</span>
            </button>

            {/* AI Assistant Button */}
            <button
              type="button"
              onClick={() => setShowAIOptions(!showAIOptions)}
              disabled={isCreating || isAIGenerating}
              className="flex items-center space-x-2 px-4 py-3 text-purple-700 hover:text-purple-800 hover:bg-purple-100/80 rounded-xl transition-all duration-200 disabled:opacity-50 backdrop-blur-sm border border-purple-200/60 hover:border-purple-300/80 group flex-shrink-0"
            >
              <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium hidden sm:inline">AI Assistant</span>
            </button>

            {/* Hashtag Suggestions Button */}
            <button
              type="button"
              onClick={() => setShowHashtagSuggestions(!showHashtagSuggestions)}
              disabled={isCreating || isSuggestingHashtags}
              className="flex items-center space-x-2 px-4 py-3 text-blue-700 hover:text-blue-800 hover:bg-blue-100/80 rounded-xl transition-all duration-200 disabled:opacity-50 backdrop-blur-sm border border-blue-200/60 hover:border-blue-300/80 group flex-shrink-0"
            >
              <Hash className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium hidden sm:inline">Hashtags</span>
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={(!content.trim() && !selectedImage) || isCreating || isAIGenerating || (contentSafety && !contentSafety.isSafe)}
            className="w-full sm:w-auto flex items-center justify-center space-x-3 bg-white/80 backdrop-blur-md text-gray-900 px-6 sm:px-8 py-3 rounded-xl font-semibold hover:bg-white hover:shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border border-white/40 hover:border-white/60 shadow-md flex-shrink-0"
          >
            {isCreating ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-700 border-t-transparent rounded-full animate-spin" />
                <span className="hidden sm:inline">Posting...</span>
                <span className="sm:hidden">Posting...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Post to ChainChat</span>
                <span className="sm:hidden">Post</span>
              </>
            )}
          </button>
        </div>

        {/* Safety Warnings */}
        {contentSafety && !contentSafety.isSafe && (
          <div className="bg-red-100/80 border border-red-200/60 rounded-xl p-4 backdrop-blur-sm animate-in fade-in">
            <div className="flex items-center space-x-2 text-red-700 mb-2">
              <span className="text-sm font-semibold">Content Review Needed</span>
            </div>
            <p className="text-red-600 text-sm">
              Our AI detected potential issues with your content. Please review and consider modifying your post.
            </p>
            {contentSafety.flags.length > 0 && (
              <div className="mt-2">
                <p className="text-red-600 text-xs">Flags: {contentSafety.flags.join(', ')}</p>
              </div>
            )}
          </div>
        )}

        {/* Enhanced AI Options Panel */}
        {showAIOptions && (
          <div className="glass rounded-2xl p-6 border border-white/40 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg flex items-center justify-center border border-purple-200/60">
                  <Zap className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">AI Content Assistant</h4>
                  <p className="text-gray-600 text-sm">Let AI help you create engaging content</p>
                </div>
              </div>
              <button
                onClick={() => setShowAIOptions(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors p-1 hover:bg-white/60 rounded"
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

            <div className="mt-6 p-4 bg-white/60 rounded-lg border border-white/40 backdrop-blur-sm">
              <p className="text-gray-600 text-xs text-center">
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
    blue: 'from-blue-100/80 to-blue-200/80 border-blue-200/60 hover:border-blue-300/80 text-blue-700',
    green: 'from-green-100/80 to-green-200/80 border-green-200/60 hover:border-green-300/80 text-green-700',
    orange: 'from-orange-100/80 to-orange-200/80 border-orange-200/60 hover:border-orange-300/80 text-orange-700',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center p-5 bg-gradient-to-br ${colorClasses[color]} rounded-xl transition-all duration-300 disabled:opacity-50 group hover:scale-105 border backdrop-blur-sm`}
    >
      <div className="text-2xl mb-3 group-hover:scale-110 transition-transform">{icon}</div>
      <span className="text-sm font-semibold text-center mb-1">{title}</span>
      <span className="text-opacity-80 text-xs text-center">{description}</span>
    </button>
  );
}