import { useMutation } from '@tanstack/react-query';

interface SmartReply {
  id: string;
  text: string;
  tone: 'friendly' | 'supportive' | 'questioning' | 'agreeing';
  confidence: number;
}

export function useSmartReplies() {
  const generateFallbackReplies = (postContent: string): SmartReply[] => {
    const contentLower = postContent.toLowerCase();
    const replies: SmartReply[] = [];

    if (contentLower.includes('?')) {
      replies.push({
        id: '1',
        text: "That's a great question! I'd love to know more about this.",
        tone: 'questioning',
        confidence: 0.8
      });
    }

    if (contentLower.includes('amazing') || contentLower.includes('great') || contentLower.includes('love')) {
      replies.push({
        id: '2',
        text: "This is amazing! Thanks for sharing this perspective.",
        tone: 'agreeing',
        confidence: 0.7
      });
    }
 
    if (contentLower.includes('problem') || contentLower.includes('issue') || contentLower.includes('challenge')) {
      replies.push({
        id: '3',
        text: "I understand this challenge. Have you considered alternative approaches?",
        tone: 'supportive',
        confidence: 0.6
      });
    }

    if (contentLower.includes('blockchain') || contentLower.includes('web3') || contentLower.includes('ai')) {
      replies.push({
        id: '4',
        text: "Interesting take on this technology! How do you see this evolving?",
        tone: 'questioning',
        confidence: 0.75
      });
    }

    replies.push({
      id: '5',
      text: "Thanks for sharing this! Really made me think.",
      tone: 'friendly',
      confidence: 0.5
    });

    return replies.slice(0, 3);
  };

  const generateReplies = useMutation({
    mutationFn: async ({
      postContent,
      context,
    }: { postContent: string; context?: string }): Promise<SmartReply[]> => {
      const response = await fetch('/api/ai/generate-replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postContent,
          context,
          maxReplies: 5,
        }),
      });

      if (!response.ok) {
        return generateFallbackReplies(postContent);
      }

      const data = await response.json();
      return data.replies || [];
    },
  });

  return {
    // mutateAsync({ postContent, context })
    generateReplies: generateReplies.mutateAsync,
    isGenerating: generateReplies.isPending,
  };
}
