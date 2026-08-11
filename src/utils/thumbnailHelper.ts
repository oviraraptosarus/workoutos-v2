export function getFallbackThumbnail(url: string, currentThumb: string | null): string | null {
    if (currentThumb && currentThumb.trim() !== '' && currentThumb !== 'null') {
        return currentThumb;
    }
    
    if (!url) return null;
    
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
        if (match && match[1]) {
            return `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg`;
        }
    }
    
    return null;
}
