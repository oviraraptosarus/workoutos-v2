'use client';

import React, { useState, useCallback, useMemo, memo } from 'react';
import Image, { ImageProps } from 'next/image';

interface AppImageProps extends Omit<ImageProps, 'src' | 'alt'> {
    src: string;
    alt: string;
    fallbackSrc?: string;
    onClick?: () => void;
}

const AppImage = memo(function AppImage({
    src,
    alt = '',
    width,
    height,
    className = '',
    priority = false,
    quality = 85,
    placeholder = 'empty',
    blurDataURL,
    fill = false,
    sizes,
    onClick,
    fallbackSrc = '/assets/images/no_image.png',
    loading = 'lazy',
    unoptimized = false,
    ...props
}: AppImageProps) {
    const [imageSrc, setImageSrc] = useState(src);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const isExternalUrl = useMemo(() => typeof imageSrc === 'string' && imageSrc.startsWith('http'), [imageSrc]);
    const resolvedUnoptimized = unoptimized || isExternalUrl;

    const handleError = useCallback(() => {
        if (!hasError && imageSrc !== fallbackSrc) {
            setImageSrc(fallbackSrc);
            setHasError(true);
        }
        setIsLoading(false);
    }, [hasError, imageSrc, fallbackSrc]);

    const handleLoad = useCallback(() => {
        setIsLoading(false);
        setHasError(false);
    }, []);

    const imageClassName = useMemo(() => {
        const classes = [className];
        if (isLoading) classes.push('bg-surface-container-high');
        if (onClick) classes.push('cursor-pointer hover:opacity-90 transition-opacity duration-200');
        return classes.filter(Boolean).join(' ');
    }, [className, isLoading, onClick]);

    if (fill) {
        return (
            <div className="relative w-full h-full">
                <Image
                    src={imageSrc}
                    alt={alt}
                    className={imageClassName}
                    quality={quality}
                    placeholder={placeholder}
                    blurDataURL={blurDataURL}
                    unoptimized={resolvedUnoptimized}
                    onError={handleError}
                    onLoad={handleLoad}
                    onClick={onClick}
                    priority={priority}
                    loading={priority ? undefined : loading}
                    fill
                    sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
                    style={{ objectFit: 'cover' }}
                    {...props}
                />
            </div>
        );
    }

    return (
        <Image
            src={imageSrc}
            alt={alt}
            width={width || 400}
            height={height || 300}
            className={imageClassName}
            quality={quality}
            placeholder={placeholder}
            blurDataURL={blurDataURL}
            unoptimized={resolvedUnoptimized}
            onError={handleError}
            onLoad={handleLoad}
            onClick={onClick}
            priority={priority}
            loading={priority ? undefined : loading}
            sizes={sizes}
            {...props}
        />
    );
});

AppImage.displayName = 'AppImage';

export default AppImage;