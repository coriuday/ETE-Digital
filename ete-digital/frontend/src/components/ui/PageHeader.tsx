/**
 * PageHeader — Consistent page heading for all authenticated pages.
 * Replaces the ad-hoc inline h1/p pattern in each page.
 */
import React from 'react';
import { clsx } from 'clsx';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface Breadcrumb {
    label: string;
    href?: string;
}

export interface PageHeaderProps {
    title: string;
    description?: string;
    breadcrumbs?: Breadcrumb[];
    actions?: React.ReactNode;
    className?: string;
}

export default function PageHeader({
    title,
    description,
    breadcrumbs,
    actions,
    className,
}: PageHeaderProps) {
    return (
        <div className={clsx('flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4', className)}>
            <div>
                {breadcrumbs && breadcrumbs.length > 0 && (
                    <nav className="flex items-center gap-1 mb-2" aria-label="Breadcrumb">
                        {breadcrumbs.map((crumb, i) => (
                            <React.Fragment key={i}>
                                {i > 0 && <ChevronRight size={12} className="text-text-tertiary flex-shrink-0" />}
                                {crumb.href ? (
                                    <Link
                                        to={crumb.href}
                                        className="text-xs text-text-tertiary hover:text-text-secondary transition-colors font-medium"
                                    >
                                        {crumb.label}
                                    </Link>
                                ) : (
                                    <span className="text-xs text-text-tertiary font-medium">{crumb.label}</span>
                                )}
                            </React.Fragment>
                        ))}
                    </nav>
                )}

                <h1 className="text-xl font-bold text-text-primary tracking-tight">{title}</h1>

                {description && (
                    <p className="text-sm text-text-secondary mt-1">{description}</p>
                )}
            </div>

            {actions && (
                <div className="flex items-center gap-2 flex-shrink-0">
                    {actions}
                </div>
            )}
        </div>
    );
}
