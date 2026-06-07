/**
 * Input — Premium form input with label, hint, and error state
 * Consistent across all pages. Uses design system tokens.
 */
import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    hint?:  string;
    error?: string;
    leftIcon?:  React.ReactNode;
    rightElement?: React.ReactNode;
    /** Extra className for the outer wrapper */
    wrapperClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
    {
        label,
        hint,
        error,
        leftIcon,
        rightElement,
        wrapperClassName,
        className,
        id,
        ...props
    },
    ref
) {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const hasError = Boolean(error);

    return (
        <div className={clsx('space-y-1.5', wrapperClassName)}>
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-sm font-medium text-text-primary"
                >
                    {label}
                    {props.required && (
                        <span className="ml-1 text-error text-xs" aria-hidden="true">*</span>
                    )}
                </label>
            )}

            <div className="relative">
                {leftIcon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
                        {leftIcon}
                    </div>
                )}

                <input
                    ref={ref}
                    id={inputId}
                    aria-invalid={hasError}
                    aria-describedby={
                        hasError ? `${inputId}-error`
                        : hint    ? `${inputId}-hint`
                        : undefined
                    }
                    className={clsx(
                        // Base
                        'w-full rounded-lg border text-sm text-text-primary bg-surface',
                        'placeholder:text-text-tertiary',
                        'transition-colors duration-150',
                        // Focus
                        'focus:outline-none focus:ring-2 focus:ring-offset-0',
                        // Padding
                        leftIcon    ? 'pl-10 pr-3.5 py-2.5' : 'px-3.5 py-2.5',
                        rightElement ? 'pr-10' : '',
                        // States
                        hasError
                            ? 'border-error focus:border-error focus:ring-error/20'
                            : 'border-border focus:border-primary-600 focus:ring-primary-600/20',
                        // Disabled
                        props.disabled && 'opacity-50 cursor-not-allowed bg-background',
                        className,
                    )}
                    {...props}
                />

                {rightElement && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {rightElement}
                    </div>
                )}
            </div>

            {hasError && (
                <p id={`${inputId}-error`} className="flex items-center gap-1.5 text-xs text-error" role="alert">
                    <AlertCircle size={12} className="flex-shrink-0" />
                    {error}
                </p>
            )}

            {hint && !hasError && (
                <p id={`${inputId}-hint`} className="text-xs text-text-tertiary">
                    {hint}
                </p>
            )}
        </div>
    );
});

export default Input;
