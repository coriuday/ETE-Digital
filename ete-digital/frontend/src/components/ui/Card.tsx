/**
 * Card Component
 * Reusable card with optional hover effects
 */
import React from 'react';

export interface CardProps {
    children: React.ReactNode;
    hover?: boolean;
    className?: string;
    onClick?: () => void;
}

export function Card({ children, hover = false, className = '', onClick }: CardProps) {
    return (
        <div
            className={`
                bg-white rounded-xl border border-gray-200 shadow-sm
                ${hover ? 'transition-all duration-200 hover:shadow-md hover:border-primary-500/20 cursor-pointer' : ''}
                ${className}
            `}
            onClick={onClick}
        >
            {children}
        </div>
    );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>
            {children}
        </div>
    );
}

export function CardBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`px-6 py-4 ${className}`}>
            {children}
        </div>
    );
}

export function CardFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`px-6 py-4 border-t border-gray-200 ${className}`}>
            {children}
        </div>
    );
}
