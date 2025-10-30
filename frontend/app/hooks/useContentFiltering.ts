import { useMutation } from '@tanstack/react-query';

interface ContentAnalysis {
  isSafe: boolean;
  confidence: number;
  categories: {
    spam: number;
    harmful: number;
    nsfw: number;
    misinformation: number;
  };
  flags: string[];
  suggestedActions: string[];
}

export function useContentFiltering() {
  const analyzeContent = useMutation({
    mutationFn: async (content: string): Promise<ContentAnalysis> => {
      const response = await fetch('/api/og/analyze-content-safety', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        return analyzeContentFallback(content);
      }

      return await response.json();
    },
  });

  const analyzeContentFallback = (content: string): ContentAnalysis => {
    const contentLower = content.toLowerCase();
    
    // Basic keyword-based filtering
    const spamKeywords = ['buy now', 'click here', 'make money', 'limited time'];
    const harmfulKeywords = ['hate', 'violence', 'attack', 'harm'];
    const nsfwKeywords = ['nsfw', 'explicit', 'adult', 'xxx'];
    
    let spamScore = 0;
    let harmfulScore = 0;
    let nsfwScore = 0;
    
    spamKeywords.forEach(keyword => {
      if (contentLower.includes(keyword)) spamScore += 0.3;
    });
    
    harmfulKeywords.forEach(keyword => {
      if (contentLower.includes(keyword)) harmfulScore += 0.4;
    });
    
    nsfwKeywords.forEach(keyword => {
      if (contentLower.includes(keyword)) nsfwScore += 0.5;
    });

    const categories = {
      spam: Math.min(spamScore, 1),
      harmful: Math.min(harmfulScore, 1),
      nsfw: Math.min(nsfwScore, 1),
      misinformation: 0.1 // Basic assumption
    };

    const flags = [];
    if (categories.spam > 0.7) flags.push('potential_spam');
    if (categories.harmful > 0.6) flags.push('potentially_harmful');
    if (categories.nsfw > 0.5) flags.push('nsfw_content');

    const isSafe = categories.spam < 0.8 && categories.harmful < 0.7 && categories.nsfw < 0.6;
    const confidence = 1 - Math.max(categories.spam, categories.harmful, categories.nsfw);

    const suggestedActions = [];
    if (!isSafe) suggestedActions.push('review_content');
    if (categories.spam > 0.5) suggestedActions.push('mark_as_spam');
    if (categories.harmful > 0.4) suggestedActions.push('report_content');

    return {
      isSafe,
      confidence,
      categories,
      flags,
      suggestedActions
    };
  };

  return {
    analyzeContent: analyzeContent.mutateAsync,
    isAnalyzing: analyzeContent.isPending,
  };
}