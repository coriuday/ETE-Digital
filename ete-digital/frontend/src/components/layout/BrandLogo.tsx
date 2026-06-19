/**
 * BrandLogo — canonical JobsRow.com wordmark (#176BBE)
 */
interface BrandLogoProps {
    size?: 'sm' | 'md' | 'lg';
    subtitle?: string;
    className?: string;
    compact?: boolean;
}

const sizeClasses = {
    sm: 'text-[20px]',
    md: 'text-[22px]',
    lg: 'text-[28px]',
};

export default function BrandLogo({ size = 'md', subtitle, className = '', compact = false }: BrandLogoProps) {
    return (
        <div className={`flex flex-col ${className}`}>
            <span
                className={`font-extrabold text-[#176BBE] tracking-tight leading-tight whitespace-nowrap ${sizeClasses[size]}`}
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
            >
                JobsRow.com
            </span>
            {subtitle && !compact && (
                <p className="text-[10px] text-text-tertiary mt-0.5 font-medium tracking-wide uppercase truncate max-w-[200px]">
                    {subtitle}
                </p>
            )}
        </div>
    );
}
