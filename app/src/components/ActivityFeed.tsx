"use client";

import { useState, useEffect } from 'react';
import { Activity, Clock, ArrowRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/Skeleton';

interface ActivityItem {
    id: number;
    action: string;
    field: string | null;
    oldValue: string | null;
    newValue: string | null;
    createdAt: string;
    user: {
        id: number;
        name: string | null;
        username: string;
        email: string;
    } | null;
    ticket: {
        id: number;
        title: string;
        status: string;
        priority: string;
    };
}

interface ActivityFeedProps {
    limit?: number;
    showHeader?: boolean;
}

export function ActivityFeed({ limit = 20, showHeader = true }: ActivityFeedProps) {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchActivities();
    }, []);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/activity?limit=${limit}`);
            if (!res.ok) throw new Error('Failed to fetch activities');
            const data = await res.json();
            setActivities(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'STATUS_CHANGE':
                return <div className="w-2 h-2 rounded-full bg-blue-500" />;
            case 'ASSIGNMENT':
                return <div className="w-2 h-2 rounded-full bg-green-500" />;
            case 'PRIORITY_CHANGE':
                return <div className="w-2 h-2 rounded-full bg-orange-500" />;
            case 'COMMENT':
                return <div className="w-2 h-2 rounded-full bg-purple-500" />;
            default:
                return <div className="w-2 h-2 rounded-full bg-gray-500" />;
        }
    };

    const getActionText = (activity: ActivityItem) => {
        const userName = activity.user?.name || activity.user?.username || 'Someone';

        switch (activity.action) {
            case 'STATUS_CHANGE':
                return `${userName} changed status from ${activity.oldValue} to ${activity.newValue}`;
            case 'ASSIGNMENT':
                return `${userName} assigned ticket to ${activity.newValue}`;
            case 'PRIORITY_CHANGE':
                return `${userName} changed priority from ${activity.oldValue} to ${activity.newValue}`;
            case 'COMMENT':
                return `${userName} added a comment`;
            case 'CREATED':
                return `${userName} created the ticket`;
            default:
                return `${userName} made changes`;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {showHeader && (
                    <div className="flex items-center justify-between">
                        <Skeleton width={150} height={24} />
                        <Skeleton width={80} height={32} />
                    </div>
                )}
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                        <Skeleton width={8} height={8} variant="circular" />
                        <div className="flex-1 space-y-2">
                            <Skeleton width="80%" height={14} />
                            <Skeleton width="40%" height={12} />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                <p className="text-red-500 text-sm">{error}</p>
                <button
                    onClick={fetchActivities}
                    className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
                >
                    Try again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {showHeader && (
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Activity size={20} className="text-blue-500" />
                        Recent Activity
                    </h3>
                    <button
                        onClick={fetchActivities}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={16} className="text-white/40" />
                    </button>
                </div>
            )}

            {activities.length === 0 ? (
                <div className="text-center py-8">
                    <Activity size={32} className="mx-auto text-white/20 mb-2" />
                    <p className="text-white/40 text-sm">No recent activity</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {activities.map((activity) => (
                        <Link
                            key={activity.id}
                            href={`/tickets/${activity.ticket.id}`}
                            className="flex items-start gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group"
                        >
                            <div className="mt-1.5">
                                {getActionIcon(activity.action)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-white/80 group-hover:text-white transition-colors">
                                    {getActionText(activity)}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-white/40">
                                        #{activity.ticket.id}
                                    </span>
                                    <span className="text-xs text-white/60 truncate">
                                        {activity.ticket.title}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-white/40">
                                <Clock size={12} />
                                <span className="text-xs">
                                    {formatDate(activity.createdAt)}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function ActivityDashboardPage() {
    return (
        <div className="min-h-screen bg-[#050505]">
            <header className="h-14 border-b border-white/5 flex items-center justify-between px-4 md:px-6 bg-zinc-950/20 backdrop-blur-sm sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-white/40 hover:text-white transition-colors"
                    >
                        <ArrowRight size={18} className="rotate-180" />
                        <span className="text-sm font-medium">Back to Dashboard</span>
                    </Link>
                    <div className="h-6 w-px bg-white/10" />
                    <h1 className="text-lg font-bold text-white">Activity Dashboard</h1>
                </div>
            </header>

            <div className="max-w-4xl mx-auto p-6 space-y-6">
                <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
                    <ActivityFeed limit={50} />
                </div>
            </div>
        </div>
    );
}