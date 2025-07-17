'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'flat' | 'bordered' | 'shadow' | 'glass';
  radius?: 'none' | 'sm' | 'md' | 'lg';
  isPressable?: boolean;
  isHoverable?: boolean;
  children?: React.ReactNode;
}

interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

const cardVariants = {
  flat: 'bg-default-100',
  bordered: 'bg-transparent border-2 border-default-200',
  shadow: 'glass-card',
  glass: 'glass-card',
};

const cardRadius = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'glass',
      radius = 'lg',
      isPressable = false,
      isHoverable = false,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = 'overflow-hidden';
    
    const MotionDiv = isPressable || isHoverable ? motion.div : 'div';
    
    const motionProps = (isPressable || isHoverable) ? {
      whileHover: isHoverable ? { scale: 1.02, y: -2 } : undefined,
      whileTap: isPressable ? { scale: 0.98 } : undefined,
      transition: { type: 'spring', stiffness: 300, damping: 20 },
    } : {};
    
    return (
      <MotionDiv
        ref={ref}
        className={cn(
          baseClasses,
          cardVariants[variant],
          cardRadius[radius],
          isPressable && 'cursor-pointer',
          className
        )}
        {...motionProps}
        {...props}
      >
        {children}
      </MotionDiv>
    );
  }
);

export const CardBody = React.forwardRef<HTMLDivElement, CardBodyProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('p-4', className)}
      {...props}
    >
      {children}
    </div>
  )
);

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('p-4 pb-0 font-semibold', className)}
      {...props}
    >
      {children}
    </div>
  )
);

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('p-4 pt-0', className)}
      {...props}
    >
      {children}
    </div>
  )
);

Card.displayName = 'Card';
CardBody.displayName = 'CardBody';
CardHeader.displayName = 'CardHeader';
CardFooter.displayName = 'CardFooter';