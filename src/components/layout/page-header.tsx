'use client';

import { cn } from "@/lib/utils";

interface PageHeaderProps {
    title: string;
    description?: string;
    children?: React.ReactNode;
    className?: string;
}

export default function PageHeader({ title, description, children, className }: PageHeaderProps) {
    return (
        <div className={cn(
            "flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8 p-6 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-2xl border-2 border-primary/20 shadow-lg",
            className
        )}>
            <div className="space-y-1.5">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                    {title}
                </h1>
                {description && (
                    <p className="text-base text-slate-500 max-w-2xl">
                        {description}
                    </p>
                )}
            </div>
            {children && (
                <div className="flex items-center gap-2">
                    {children}
                </div>
            )}
        </div>
    );
}
