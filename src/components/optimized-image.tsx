"use client";

import React, { memo } from 'react';
import Image, { ImageProps } from 'next/image';

interface OptimizedImageProps extends Omit<ImageProps, 'loading'> {
  priority?: boolean;
}

function OptimizedImageComponent({
  src,
  alt,
  width,
  height,
  priority = false,
  ...props
}: OptimizedImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      {...props}
    />
  );
}

export const OptimizedImage = memo(OptimizedImageComponent);