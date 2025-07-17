'use client';

import React from 'react';
import { cn } from '../../lib/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  src?: string;
  alt?: string;
  name?: string;
  icon?: React.ReactNode;
  isBordered?: boolean;
  isDisabled?: boolean;
  fallback?: React.ReactNode;
}

const avatarSizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

const avatarRadius = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
};

const avatarColors = {
  default: 'bg-default-200 text-default-700',
  primary: 'bg-primary-500 text-white',
  secondary: 'bg-secondary-500 text-white',
  success: 'bg-success-500 text-white',
  warning: 'bg-warning-500 text-white',
  danger: 'bg-danger-500 text-white',
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      className,
      size = 'md',
      radius = 'full',
      color = 'default',
      src,
      alt = '',
      name,
      icon,
      isBordered = false,
      isDisabled = false,
      fallback,
      ...props
    },
    ref
  ) => {
    const [imageError, setImageError] = React.useState(false);
    
    const baseClasses = 'inline-flex items-center justify-center font-medium overflow-hidden';
    
    const handleImageError = () => {
      setImageError(true);
    };

    const renderContent = () => {
      if (src && !imageError) {
        return (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
        );
      }

      if (icon) {
        return icon;
      }

      if (name) {
        return getInitials(name);
      }

      if (fallback) {
        return fallback;
      }

      return (
        <svg
          className="w-1/2 h-1/2"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      );
    };

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          avatarSizes[size],
          avatarRadius[radius],
          !src || imageError ? avatarColors[color] : '',
          isBordered && 'ring-2 ring-white ring-offset-2',
          isDisabled && 'opacity-50',
          className
        )}
        {...props}
      >
        {renderContent()}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';