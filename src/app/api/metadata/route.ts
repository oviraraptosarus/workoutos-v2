import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    try {
        // Special handler for YouTube using oEmbed
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
            const ytRes = await fetch(oEmbedUrl);
            if (ytRes.ok) {
                const ytData = await ytRes.json();
                return NextResponse.json({
                    url,
                    title: ytData.title,
                    image: ytData.thumbnail_url,
                    description: ytData.author_name
                });
            }
        }

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch URL: ${response.statusText}`);
        }

        const html = await response.text();

        // Simple regex extraction for OpenGraph and basic meta tags
        const getMetaTag = (html: string, property: string) => {
            const regex = new RegExp(`<meta\\s+(?:property|name)=["'](?:${property})["']\\s+content=["']([^"']+)["']`, 'i');
            const match = html.match(regex);
            return match ? match[1] : null;
        };

        let title = getMetaTag(html, 'og:title') || getMetaTag(html, 'twitter:title');
        let image = getMetaTag(html, 'og:image') || getMetaTag(html, 'twitter:image');
        const description = getMetaTag(html, 'og:description') || getMetaTag(html, 'twitter:description') || getMetaTag(html, 'description');

        // Fallback for title
        if (!title) {
            const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
            title = titleMatch ? titleMatch[1] : null;
        }

        return NextResponse.json({
            url,
            title: title ? decodeHtmlEntities(title) : null,
            image: image ? decodeHtmlEntities(image) : null,
            description: description ? decodeHtmlEntities(description) : null
        });

    } catch (error: any) {
        console.error('Metadata extraction error:', error);
        return NextResponse.json({ error: 'Failed to extract metadata' }, { status: 500 });
    }
}

// Simple HTML entity decoder since we aren't using a full DOM parser
function decodeHtmlEntities(text: string) {
    const entities: Record<string, string> = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&#x27;': "'"
    };
    return text.replace(/&[#\w]+;/g, match => entities[match] || match);
}
