/**
 * BrandLogo — canonical JobsRow.com wordmark (#176BBE)
 */
interface BrandLogoProps {
    size?: 'sm' | 'md' | 'lg';
    subtitle?: string;
    className?: string;
}

const sizeClasses = {
    sm: 'text-lg',
    md: 'text-[22px]',
    lg: 'text-[28px]',
};

export default function BrandLogo({ size = 'md', subtitle, className = '' }: BrandLogoProps) {
    return (
        <div className={`min-w-0 ${className}`}>
            <span className={`font-extrabold text-[#176BBE] tracking-tight leading-none ${sizeClasses[size]}`}>
                JobsRow.com
            </span>
            {subtitle && (
                <p className="text-[10px] text-text-tertiary mt-0.5 font-medium tracking-wide uppercase truncate">
                    {subtitle}
                </p>
            )}
        </div>
    );
}
