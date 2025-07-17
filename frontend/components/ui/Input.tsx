'use client';

import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'flat' | 'bordered' | 'faded' | 'underlined' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  label?: string;
  labelPlacement?: 'outside' | 'inside' | 'outside-left';
  description?: string;
  errorMessage?: string;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  isInvalid?: boolean;
  isRequired?: boolean;
  isDisabled?: boolean;
}

const inputVariants = {
  flat: 'bg-default-100 hover:bg-default-200 focus:bg-transparent',
  bordered: 'bg-transparent border-2 border-default-200 hover:border-default-400 focus:border-primary-500',
  faded: 'bg-default-100 border-2 border-transparent hover:border-default-300 focus:border-primary-500',
  underlined: 'bg-transparent border-b-2 border-default-300 hover:border-default-400 focus:border-primary-500 rounded-none',
  glass: 'glass-input text-gray-800 placeholder-gray-500',
};

const inputSizes = {
  sm: 'h-8 text-sm',
  md: 'h-10 text-sm',
  lg: 'h-12 text-base',
};

const inputRadius = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant = 'glass',
      size = 'md',
      radius = 'md',
      label,
      labelPlacement = 'outside',
      description,
      errorMessage,
      startContent,
      endContent,
      isInvalid = false,
      isRequired = false,
      isDisabled = false,
      ...props
    },
    ref
  ) => {
    const baseClasses = 'w-full px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
    
    const inputElement = (
      <div className="relative flex items-center">
        {startContent && (
          <div className="absolute left-3 z-10 text-default-400">
            {startContent}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            baseClasses,
            inputVariants[variant],
            inputSizes[size],
            inputRadius[radius],
            startContent && 'pl-10',
            endContent && 'pr-10',
            isInvalid && 'border-danger-500 focus:border-danger-500',
            isDisabled && 'opacity-50 cursor-not-allowed',
            className
          )}
          disabled={isDisabled}
          aria-invalid={isInvalid}
          aria-required={isRequired}
          {...props}
        />
        {endContent && (
          <div className="absolute right-3 z-10 text-default-400">
            {endContent}
          </div>
        )}
      </div>
    );

    if (labelPlacement === 'inside' || (!label && !description && !errorMessage)) {
      return inputElement;
    }

    return (
      <div className="w-full">
        {label && labelPlacement === 'outside' && (
          <label className="block text-sm font-medium text-white mb-2">
            {label}
            {isRequired && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}
        
        {labelPlacement === 'outside-left' && label ? (
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-white min-w-fit">
              {label}
              {isRequired && <span className="text-red-400 ml-1">*</span>}
            </label>
            {inputElement}
          </div>
        ) : (
          inputElement
        )}
        
        {description && !errorMessage && (
          <p className="text-xs text-gray-300 mt-1">{description}</p>
        )}
        
        {errorMessage && (
          <p className="text-xs text-red-400 mt-1">{errorMessage}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';