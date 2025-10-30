import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

interface RelevanceScore {
  score: number;
  factors: {
    engagement: number;
    timeliness: number;
    personalInterest: number;
    communityTrend: number;
  };
  recommendations: string[];
}

export function useContentRelevance() {
  const { address } = useAccount();

  const calculateRelevance = async (post: any, userInterests: string[]): Promise<RelevanceScore> => {
    // Send to AI for relevance analysis
    const response = await fetch('/api/og/analyze-relevance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postContent: post.content,
        postEngagement: post.likes + post.commentsCount,
        userInterests,
        postTimestamp: post.timestamp,
        authorHistory: post.authorProfile?.postCount || 0
      }),
    });

    if (!response.ok) {
      // Fallback calculation
      return calculateFallbackRelevance(post, userInterests);
    }

    return await response.json();
  };

  const calculateFallbackRelevance = (post: any, userInterests: string[]): RelevanceScore => {
    const engagementScore = Math.min((post.likes + post.commentsCount) / 10, 1);
    const hoursAgo = (Date.now() - post.timestamp) / (1000 * 60 * 60);
    const timelinessScore = Math.max(0, 1 - (hoursAgo / 168)); // 1 week decay
    
    let interestScore = 0;
    const contentLower = post.content.toLowerCase();
    userInterests.forEach(interest => {
      if (contentLower.includes(interest.toLowerCase())) {
        interestScore += 0.3;
      }
    });
    interestScore = Math.min(interestScore, 1);

    const communityScore = post.authorProfile?.postCount > 10 ? 0.8 : 0.5;

    const finalScore = (
      engagementScore * 0.3 +
      timelinessScore * 0.25 +
      interestScore * 0.3 +
      communityScore * 0.15
    );

    return {
      score: finalScore,
      factors: {
        engagement: engagementScore,
        timeliness: timelinessScore,
        personalInterest: interestScore,
        communityTrend: communityScore
      },
      recommendations: generateRecommendations(finalScore, engagementScore, interestScore)
    };
  };

  const generateRecommendations = (score: number, engagement: number, interest: number): string[] => {
    const recommendations = [];
    
    if (score < 0.3) {
      recommendations.push("This content may not align with your interests");
    }
    if (engagement > 0.7) {
      recommendations.push("Highly engaged by community");
    }
    if (interest > 0.8) {
      recommendations.push("Strong match with your interests");
    }
    if (score > 0.8) {
      recommendations.push("Recommended for you");
    }

    return recommendations.length > 0 ? recommendations : ["Personalized content"];
  };

  return {
    calculateRelevance,
  };
}