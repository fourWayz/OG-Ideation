import { useMutation } from '@tanstack/react-query';

interface AIGenerationParams {
  userInterests?: string[];
  mood?: string;
  context?: string;
  type?: 'post' | 'meme' | 'question';
}

export function useAIContent() {
  const generateMutation = useMutation({
    mutationFn: async (params: AIGenerationParams) => {
      const response = await fetch('/api/og/generate-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI content');
      }

      return await response.json();
    },
  });

  return {
    generateContent: generateMutation.mutateAsync,
    isGenerating: generateMutation.isPending,
    error: generateMutation.error,
  };
}