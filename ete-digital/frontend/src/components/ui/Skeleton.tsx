/**
 * Premium Loading Skeleton Components
 * Designed for a high-end SaaS dark mode experience
 */

import React from 'react';

// Base Shimmer Component
export function Skeleton({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div 
            className={`relative overflow-hidden bg-gray-200/50 rounded-md ${className}`} 
            {...props}
        >
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-gray-300/50 to-transparent animate-shimmer"></div>
        </div>
    );
}

// Navbar Skeleton
export function SkeletonNavbar() {
    return (
        <div className="w-full h-16 border-b border-gray-100 bg-white/80 backdrop-blur-md flex items-center justify-between px-6">
            {/* Logo placeholder */}
            <Skeleton className="w-24 h-8" />
            
            {/* Nav links placeholder */}
            <div className="hidden md:flex gap-6">
                <Skeleton className="w-16 h-4" />
                <Skeleton className="w-20 h-4" />
                <Skeleton className="w-16 h-4" />
            </div>
            
            {/* User avatar placeholder */}
            <Skeleton className="w-10 h-10 rounded-full" />
        </div>
    );
}

// Job Card Skeleton
export function SkeletonJobCard() {
    return (
        <div className="bg-white border border-gray-100 rounded-xl p-6 relative overflow-hidden shadow-sm">
            {/* Job Title */}
            <Skeleton className="w-3/4 h-6 mb-3" />
            
            {/* Company & Location */}
            <div className="flex gap-3 mb-6">
                <Skeleton className="w-24 h-4" />
                <Skeleton className="w-32 h-4" />
            </div>
            
            {/* Tags/Badges */}
            <div className="flex gap-2 mt-auto pt-4 border-t border-gray-50">
                <Skeleton className="w-20 h-6 rounded-full" />
                <Skeleton className="w-24 h-6 rounded-full" />
            </div>
        </div>
    );
}

// Text Block Skeleton
export function SkeletonText({ lines = 3, className = '' }: { lines?: number, className?: string }) {
    return (
        <div className={`space-y-3 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => {
                // Generate widths: 100%, 80%, 60% for a natural text block look
                const width = i === 0 ? 'w-full' : i === 1 ? 'w-4/5' : i === 2 ? 'w-3/5' : 'w-full';
                return (
                    <Skeleton key={i} className={`h-4 ${width}`} />
                );
            })}
        </div>
    );
}

// Full Page Layout Skeleton
export function SkeletonPageLayout() {
    return (
        <div className="min-h-screen bg-gray-50">
            <SkeletonNavbar />
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="mb-10">
                    <Skeleton className="w-1/3 h-10 mb-4" />
                    <SkeletonText lines={2} className="max-w-2xl" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SkeletonJobCard />
                    <SkeletonJobCard />
                </div>
                
                <div className="mt-12 p-8 border border-gray-100 rounded-xl bg-white/50">
                    <Skeleton className="w-1/4 h-6 mb-6" />
                    <SkeletonText lines={3} />
                </div>
            </div>
        </div>
    );
}
