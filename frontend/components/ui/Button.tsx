'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost' | 'light' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  isLoading?: boolean;
  isDisabled?: boolean;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  children?: React.ReactNode;
}

const buttonVariants = {
  default: 'bg-default-100 text-default-900 hover:bg-default-200',
  primary: 'glass-button text-white hover:bg-opacity-80',
  secondary: 'glass-button text-gray-700 hover:bg-opacity-80',
  success: 'glass-button text-green-700 hover:bg-opacity-80',
  warning: 'glass-button text-orange-700 hover:bg-opacity-80',
  danger: 'glass-button text-red-700 hover:bg-opacity-80',
  ghost: 'bg-transparent hover:bg-white hover:bg-opacity-20',
  light: 'glass-button text-gray-800 hover:bg-opacity-80',
  glass: 'glass-button text-white hover:bg-opacity-80',
};

const buttonSizes = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

const buttonRadius = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'glass',
      size = 'md',
      radius = 'md',
      isLoading = false,
      isDisabled = false,
      startContent,
      endContent,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
    
    return (
      <motion.button
        ref={ref}
        className={cn(
          baseClasses,
          buttonVariants[variant],
          buttonSizes[size],
          buttonRadius[radius],
          isDisabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        disabled={isDisabled || isLoading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        {...props}
      >
        {isLoading && (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {startContent && <span className="mr-2">{startContent}</span>}
        {children}
        {endContent && <span className="ml-2">{endContent}</span>}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';