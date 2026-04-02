"use client";

import React from 'react';

interface SkeletonProps {
    className?: string;
    width?: string | number;
    height?: string | number;
    variant?: 'text' | 'circular' | 'rectangular';
}

export function Skeleton({
    className = '',
    width,
    height,
    variant = 'rectangular'
}: SkeletonProps) {
    const baseClasses = 'animate-pulse bg-white/5';

    const variantClasses = {
        text: 'rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-lg',
    };

    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height) style.height = typeof height === 'number' ? `${height}px` : height;

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={style}
        />
    );
}

export function TicketSkeleton() {
    return (
        <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
                <Skeleton width={100} height={20} />
                <Skeleton width={60} height={24} variant="rectangular" />
            </div>
            <Skeleton width="80%" height={16} />
            <Skeleton width="60%" height={14} />
            <div className="flex items-center gap-2 pt-2">
                <Skeleton width={80} height={24} variant="rectangular" />
                <Skeleton width={80} height={24} variant="rectangular" />
            </div>
        </div>
    );
}

export function CardSkeleton() {
    return (
        <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
                <Skeleton width={40} height={40} variant="circular" />
                <div className="flex-1 space-y-2">
                    <Skeleton width="60%" height={16} />
                    <Skeleton width="40%" height={12} />
                </div>
            </div>
            <Skeleton width="100%" height={12} />
            <Skeleton width="80%" height={12} />
            <Skeleton width="60%" height={12} />
        </div>
    );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
    return (
        <tr className="border-b border-white/5">
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <Skeleton width={i === 0 ? '80%' : '60%'} height={14} />
                </td>
            ))}
        </tr>
    );
}

export function ListSkeleton({ items = 5 }: { items?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: items }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                    <Skeleton width={36} height={36} variant="circular" />
                    <div className="flex-1 space-y-2">
                        <Skeleton width="70%" height={14} />
                        <Skeleton width="50%" height={12} />
                    </div>
                    <Skeleton width={60} height={24} variant="rectangular" />
                </div>
            ))}
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Skeleton width={200} height={28} />
                <Skeleton width={120} height={36} variant="rectangular" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 space-y-2">
                        <Skeleton width={80} height={12} />
                        <Skeleton width={60} height={24} />
                    </div>
                ))}
            </div>

            {/* Chart */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
                <Skeleton width={150} height={20} className="mb-4" />
                <Skeleton width="100%" height={200} />
            </div>
        </div>
    );
}