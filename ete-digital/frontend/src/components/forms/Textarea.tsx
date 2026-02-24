/**
 * Styled Textarea Component
 * Reusable textarea with error states and character count
 */
import React, { useState } from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    helperText?: string;
    showCharCount?: boolean;
    fullWidth?: boolean;
}

export default function Textarea({
    label,
    error,
    helperText,
    showCharCount = false,
    fullWidth = false,
    maxLength,
    value,
    className = '',
    ...props
}: TextareaProps) {
    const [charCount, setCharCount] = useState(value ? String(value).length : 0);

    const textareaClasses = `
        w-full px-4 py-2 rounded-lg border transition-all duration-200
        ${error
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
        }
        focus:outline-none focus:ring-2
        disabled:bg-gray-100 disabled:cursor-not-allowed
        ${className}
    `.trim().replace(/\s+/g, ' ');

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCharCount(e.target.value.length);
        if (props.onChange) {
            props.onChange(e);
        }
    };

    return (
        <div className={fullWidth ? 'w-full' : ''}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                </label>
            )}

            <textarea
                className={textareaClasses}
                maxLength={maxLength}
                value={value}
                {...props}
                onChange={handleChange}
            />

            <div className="flex justify-between items-center mt-1">
                <div className="flex-1">
                    {error && (
                        <p className="text-sm text-red-600">{error}</p>
                    )}
                    {helperText && !error && (
                        <p className="text-sm text-gray-500">{helperText}</p>
                    )}
                </div>

                {showCharCount && maxLength && (
                    <p className="text-sm text-gray-500">
                        {charCount}/{maxLength}
                    </p>
                )}
            </div>
        </div>
    );
}
