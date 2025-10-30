import { useMutation } from '@tanstack/react-query';

interface HashtagSuggestion {
  tag: string;
  relevance: number;
  category: string;
  popularity: number;
}

export function useHashtagSuggestions() {
  // --- Helper functions ---

  const extractContentHashtags = (content: string): HashtagSuggestion[] => {
    const tags: HashtagSuggestion[] = [];

    if (content.includes('blockchain')) {
      tags.push({ tag: '#Blockchain', relevance: 0.9, category: 'technology', popularity: 0.8 });
    }
    if (content.includes('ai') || content.includes('artificial intelligence')) {
      tags.push({ tag: '#AI', relevance: 0.9, category: 'technology', popularity: 0.9 });
      tags.push({ tag: '#MachineLearning', relevance: 0.7, category: 'technology', popularity: 0.7 });
    }
    if (content.includes('crypto') || content.includes('bitcoin') || content.includes('ethereum')) {
      tags.push({ tag: '#Crypto', relevance: 0.8, category: 'finance', popularity: 0.8 });
      tags.push({ tag: '#DeFi', relevance: 0.6, category: 'finance', popularity: 0.7 });
    }
    if (content.includes('nft')) {
      tags.push({ tag: '#NFT', relevance: 0.9, category: 'art', popularity: 0.6 });
      tags.push({ tag: '#DigitalArt', relevance: 0.7, category: 'art', popularity: 0.5 });
    }
    if (content.includes('dao')) {
      tags.push({ tag: '#DAO', relevance: 0.8, category: 'governance', popularity: 0.6 });
    }

    tags.push({ tag: '#ChainChat', relevance: 0.5, category: 'platform', popularity: 0.8 });

    return tags;
  };

  const extractInterestHashtags = (interests: string[]): HashtagSuggestion[] => {
    const interestMap: Record<string, string[]> = {
      technology: ['#Tech', '#Innovation', '#FutureTech'],
      blockchain: ['#Blockchain', '#Web3', '#Crypto'],
      ai: ['#AI', '#MachineLearning', '#ArtificialIntelligence'],
      art: ['#DigitalArt', '#Creativity', '#ArtCommunity'],
      gaming: ['#Gaming', '#GameDev', '#NFTGames'],
      finance: ['#DeFi', '#Finance', '#CryptoNews'],
    };

    const tags: HashtagSuggestion[] = [];

    interests.forEach((interest) => {
      const interestLower = interest.toLowerCase();
      Object.entries(interestMap).forEach(([category, categoryTags]) => {
        if (interestLower.includes(category.toLowerCase())) {
          categoryTags.forEach((tag) => {
            tags.push({ tag, relevance: 0.7, category, popularity: 0.6 });
          });
        }
      });
    });

    return tags;
  };

  const generateFallbackHashtags = (
    content: string,
    userInterests?: string[]
  ): HashtagSuggestion[] => {
    const contentLower = content.toLowerCase();
    const suggestions: HashtagSuggestion[] = [];

    suggestions.push(...extractContentHashtags(contentLower));

    if (userInterests) {
      suggestions.push(...extractInterestHashtags(userInterests));
    }

    const trendingTags: HashtagSuggestion[] = [
      { tag: '#Web3', relevance: 0.8, category: 'technology', popularity: 0.9 },
      { tag: '#Blockchain', relevance: 0.7, category: 'technology', popularity: 0.8 },
      { tag: '#AI', relevance: 0.6, category: 'technology', popularity: 0.95 },
      { tag: '#DeFi', relevance: 0.5, category: 'finance', popularity: 0.7 },
      { tag: '#NFT', relevance: 0.4, category: 'art', popularity: 0.6 },
    ];

    suggestions.push(...trendingTags);

    const uniqueSuggestions = suggestions.reduce((acc, current) => {
      const exists = acc.find((item) => item.tag === current.tag);
      if (!exists) acc.push(current);
      return acc;
    }, [] as HashtagSuggestion[]);

    return uniqueSuggestions.sort((a, b) => b.relevance - a.relevance).slice(0, 8);
  };

  // --- Mutation hook ---
  const suggestHashtags = useMutation<
    HashtagSuggestion[], // data type
    Error, // error type
    { content: string; userInterests?: string[] } // variable type
  >({
    mutationFn: async ({ content, userInterests }): Promise<HashtagSuggestion[]> => {
      const response = await fetch('/api/ai/suggest-hashtags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          userInterests: userInterests || [],
          maxSuggestions: 8,
        }),
      });

      if (!response.ok) {
        return generateFallbackHashtags(content, userInterests);
      }

      const data = await response.json();
      return data.suggestions || [];
    },
  });

  return {
    suggestHashtags: suggestHashtags.mutateAsync,
    isSuggesting: suggestHashtags.isPending,
  };
}
