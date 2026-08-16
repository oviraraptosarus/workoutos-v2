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

        // Regex extraction for OpenGraph and basic meta tags
        const getMetaTag = (html: string, property: string) => {
            const regex1 = new RegExp(`<meta\\s+(?:property|name)=["'](?:${property})["']\\s+content=["']([^"']+)["']`, 'i');
            const regex2 = new RegExp(`<meta\\s+content=["']([^"']+)["']\\s+(?:property|name)=["'](?:${property})["']`, 'i');
            const match = html.match(regex1) || html.match(regex2);
            return match ? match[1] : null;
        };

        let title = getMetaTag(html, 'og:title') || getMetaTag(html, 'twitter:title');
        let image = getMetaTag(html, 'og:image') || getMetaTag(html, 'twitter:image');
        const description = getMetaTag(html, 'og:description') || getMetaTag(html, 'twitter:description') || getMetaTag(html, 'description');

        // Fallback for title
        if (!title) {
            const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
            title = titleMatch ? titleMatch[1] : null;
            // Clean up YouTube titles that just say "YouTube" due to consent pages
            if (title === 'YouTube' || title === 'Before you continue to YouTube') title = null;
        }

        // Fallback for YouTube thumbnail if HTML scrape missed it (e.g. consent page or missing OG tags)
        if (!image && (url.includes('youtube.com') || url.includes('youtu.be'))) {
            const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
            if (match && match[1]) {
                image = `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg`;
                if (!title) title = 'YouTube Video'; // Provide a generic fallback title if totally blocked
            }
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
