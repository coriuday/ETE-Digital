/**
 * EmptyState — Consistent empty state component
 * Used when lists, tables, or sections have no data.
 * Replaces ad-hoc inline empty states across pages.
 */
import React from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

export interface EmptyStateProps {
    icon: React.ReactNode;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick?: () => void;
        href?:   string;
    };
    className?: string;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
}

export default function EmptyState({
    icon,
    title,
    description,
    action,
    className,
    size = 'md',
}: EmptyStateProps) {
    const iconSize = size === 'sm' ? 'w-10 h-10' : size === 'lg' ? 'w-16 h-16' : 'w-12 h-12';
    const padding  = size === 'sm' ? 'py-8'  : size === 'lg' ? 'py-16' : 'py-12';

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={clsx(
                'flex flex-col items-center justify-center text-center px-6',
                padding,
                className,
            )}
        >
            {/* Icon container */}
            <div className={clsx(
                'flex items-center justify-center rounded-full bg-background border border-border mb-4 flex-shrink-0',
                iconSize,
            )}>
                <div className="text-text-tertiary [&>svg]:w-5 [&>svg]:h-5">
                    {icon}
                </div>
            </div>

            <h3 className={clsx(
                'font-semibold text-text-primary',
                size === 'sm' ? 'text-sm' : 'text-base',
            )}>
                {title}
            </h3>

            {description && (
                <p className={clsx(
                    'text-text-secondary mt-1.5 max-w-xs mx-auto',
                    size === 'sm' ? 'text-xs' : 'text-sm',
                )}>
                    {description}
                </p>
            )}

            {action && (
                <div className="mt-5">
                    {action.href ? (
                        <a
                            href={action.href}
                            className="inline-flex items-center px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
                        >
                            {action.label}
                        </a>
                    ) : (
                        <button
                            onClick={action.onClick}
                            className="inline-flex items-center px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
                        >
                            {action.label}
                        </button>
                    )}
                </div>
            )}
        </motion.div>
    );
}
