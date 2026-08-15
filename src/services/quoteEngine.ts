import QUOTES from '@/data/quotes.json';

export interface Quote {
    id: number;
    text: string;
    author: string;
    category: string;
    intensity: number;
    source_verified: boolean;
    source_url: string;
    source_type: string;
    context_tags: string[];
    belief_challenged: string;
    insight: string;
}

interface QuoteContext {
    timeOfDay?: 'morning' | 'afternoon' | 'evening';
    userState?: 'idle' | 'active' | 'struggling';
}

export const getQuoteForContext = (context?: QuoteContext): Quote => {
    const quotes = QUOTES as Quote[];

    if (!context) {
        return quotes[Math.floor(Math.random() * quotes.length)];
    }

    const hour = new Date().getHours();
    const timeOfDay = context.timeOfDay || (hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening');

    const scored = quotes.map(quote => {
        let score = 0;

        // Time-of-day scoring
        if (timeOfDay === 'morning') {
            if (quote.category === 'discipline' || quote.category === 'focus') score += 2;
            if (quote.context_tags.includes('morning')) score += 5;
            if (quote.context_tags.includes('action')) score += 1;
            if (quote.intensity >= 3) score += 1;
        } else if (timeOfDay === 'afternoon') {
            if (quote.category === 'execution' || quote.category === 'resilience') score += 2;
            if (quote.intensity >= 3) score += 1;
            if (quote.context_tags.includes('procrastination')) score += 2;
        } else if (timeOfDay === 'evening') {
            if (quote.category === 'time' || quote.category === 'accountability') score += 3;
            if (quote.context_tags.includes('reflection') || quote.context_tags.includes('long-term')) score += 2;
            if (quote.intensity <= 2) score += 1;
        }

        // Struggling state: bias toward resilience and accountability
        if (context.userState === 'struggling') {
            if (quote.category === 'resilience' || quote.category === 'discomfort') score += 5;
            if (quote.intensity === 4 || quote.intensity === 5) score += 2;
        }

        return { quote, score };
    });

    scored.sort((a, b) => b.score - a.score);

    // Pick randomly from top 12% to ensure variation
    const topCount = Math.max(3, Math.floor(quotes.length * 0.12));
    const topCandidates = scored.slice(0, topCount);

    return topCandidates[Math.floor(Math.random() * topCandidates.length)].quote;
};
