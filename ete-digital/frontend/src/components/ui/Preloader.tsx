import { useEffect, useState } from 'react';

interface PreloaderProps {
    isLoading: boolean;
}

export function Preloader({ isLoading }: PreloaderProps) {
    const [shouldRender, setShouldRender] = useState(isLoading);

    useEffect(() => {
        if (isLoading) {
            setShouldRender(true);
        } else {
            // Wait for fade out animation before unmounting
            const timer = setTimeout(() => setShouldRender(false), 500);
            return () => clearTimeout(timer);
        }
    }, [isLoading]);

    if (!shouldRender) return null;

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center bg-white transition-all duration-500 ${isLoading ? 'opacity-100 blur-none' : 'opacity-0 blur-sm'
                }`}
        >
            <div className="relative flex flex-col items-center animate-pulse-subtle">
                <h1
                    className="text-5xl md:text-6xl font-bold tracking-tight font-sans
                    bg-gradient-to-r from-[#2F80ED] via-[#5AA9FF] to-[#2F80ED]
                    bg-[length:200%_auto] text-transparent bg-clip-text
                    animate-text-shimmer"
                >
                    JobsRow.com
                </h1>
            </div>
        </div>
    );
}
