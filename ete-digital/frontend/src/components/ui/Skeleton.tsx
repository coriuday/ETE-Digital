/**
 * Loading Skeleton Components
 * Skeleton screens for better loading UX
 */


export function SkeletonCard() {
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
            <div className="flex gap-2">
                <div className="h-8 bg-gray-200 rounded w-20"></div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
            </div>
        </div>
    );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
    return (
        <div className="animate-pulse space-y-2">
            {Array.from({ length: lines }).map((_, i) => (
                <div
                    key={i}
                    className={`h-4 bg-gray-200 rounded ${i === lines - 1 ? 'w-4/5' : 'w-full'
                        }`}
                ></div>
            ))}
        </div>
    );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
            <div className="h-12 bg-gray-100 border-b border-gray-200"></div>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="h-16 border-b border-gray-200 flex items-center px-6 gap-4">
                    <div className="h-4 bg-gray-200 rounded flex-1"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
            ))}
        </div>
    );
}

export function SkeletonAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-16 h-16',
    };

    return (
        <div className={`${sizeClasses[size]} bg-gray-200 rounded-full animate-pulse`}></div>
    );
}
