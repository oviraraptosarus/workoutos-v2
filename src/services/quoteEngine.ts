import QUOTES from '@/data/quotes.json';

export interface Quote {
    id: number;
    text: string;
    author: string;
    category: string;
    intensity: number;
    source_verified: boolean;
    context_tags: string[];
}

interface QuoteContext {
    timeOfDay?: 'morning' | 'afternoon' | 'evening';
    userState?: 'idle' | 'active' | 'struggling'; // Future expansion for actual user state
}

export const getQuoteForContext = (context?: QuoteContext): Quote => {
    const quotes = QUOTES as Quote[];
    
    // Default to random if no context
    if (!context) {
        return quotes[Math.floor(Math.random() * quotes.length)];
    }

    // Example scoring system
    // We score each quote based on how well it fits the context
    let bestQuotes: { quote: Quote, score: number }[] = [];
    
    // Auto-detect time of day if not provided
    const hour = new Date().getHours();
    const timeOfDay = context.timeOfDay || (hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening');

    for (const quote of quotes) {
        let score = 0;

        // Morning favors discipline, urgency, and morning tags
        if (timeOfDay === 'morning') {
            if (quote.category === 'discipline' || quote.category === 'focus') score += 2;
            if (quote.context_tags.includes('morning')) score += 5;
            if (quote.context_tags.includes('action')) score += 1;
        }
        
        // Afternoon favors execution, resilience
        else if (timeOfDay === 'afternoon') {
            if (quote.category === 'execution' || quote.category === 'resilience') score += 2;
            if (quote.intensity >= 3) score += 1;
        }
        
        // Evening favors time, mortality, accountability, reflection
        else if (timeOfDay === 'evening') {
            if (quote.category === 'time' || quote.category === 'accountability') score += 3;
            if (quote.context_tags.includes('reflection') || quote.context_tags.includes('planning')) score += 2;
            if (quote.intensity <= 2) score += 1;
        }

        // Future state handling could go here
        if (context.userState === 'struggling') {
            if (quote.category === 'resilience' || quote.category === 'discomfort') score += 5;
        }

        bestQuotes.push({ quote, score });
    }

    // Sort by score descending
    bestQuotes.sort((a, b) => b.score - a.score);

    // Take top 10% of matching quotes to maintain variety, and pick a random one among them
    const topCandidates = bestQuotes.slice(0, Math.max(1, Math.floor(quotes.length * 0.1)));
    
    if (topCandidates.length > 0) {
        return topCandidates[Math.floor(Math.random() * topCandidates.length)].quote;
    }

    // Fallback
    return quotes[Math.floor(Math.random() * quotes.length)];
};
