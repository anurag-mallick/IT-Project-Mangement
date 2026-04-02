"use client";

import { useState } from 'react';
import { Book, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import Link from 'next/link';

interface ApiEndpoint {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    description: string;
    auth: boolean;
    parameters?: { name: string; type: string; required: boolean; description: string }[];
    requestBody?: { field: string; type: string; required: boolean; description: string }[];
    responseExample?: string;
}

const apiEndpoints: ApiEndpoint[] = [
    {
        method: 'GET',
        path: '/api/tickets',
        description: 'Get all tickets with optional filtering',
        auth: true,
        parameters: [
            { name: 'status', type: 'string', required: false, description: 'Filter by status (TODO, IN_PROGRESS, AWAITING_USER, RESOLVED, CLOSED)' },
            { name: 'priority', type: 'string', required: false, description: 'Filter by priority (P0, P1, P2, P3)' },
            { name: 'assignedToId', type: 'number', required: false, description: 'Filter by assigned user ID' },
        ],
    },
    {
        method: 'POST',
        path: '/api/tickets',
        description: 'Create a new ticket',
        auth: true,
        requestBody: [
            { field: 'title', type: 'string', required: true, description: 'Ticket title' },
            { field: 'description', type: 'string', required: true, description: 'Ticket description' },
            { field: 'priority', type: 'string', required: false, description: 'Priority level (default: P2)' },
            { field: 'assignedToId', type: 'number', required: false, description: 'Assigned user ID' },
            { field: 'requesterName', type: 'string', required: false, description: 'Requester name' },
        ],
    },
    {
        method: 'GET',
        path: '/api/tickets/search',
        description: 'Advanced search with multiple filters and pagination',
        auth: true,
        parameters: [
            { name: 'q', type: 'string', required: false, description: 'Search query (searches title and description)' },
            { name: 'status', type: 'string', required: false, description: 'Filter by status' },
            { name: 'priority', type: 'string', required: false, description: 'Filter by priority' },
            { name: 'tags', type: 'string', required: false, description: 'Comma-separated tags' },
            { name: 'dateFrom', type: 'string', required: false, description: 'Start date (ISO format)' },
            { name: 'dateTo', type: 'string', required: false, description: 'End date (ISO format)' },
            { name: 'sortBy', type: 'string', required: false, description: 'Sort field (createdAt, updatedAt, title, priority, status, dueDate)' },
            { name: 'sortOrder', type: 'string', required: false, description: 'Sort order (asc, desc)' },
            { name: 'page', type: 'number', required: false, description: 'Page number (default: 1)' },
            { name: 'limit', type: 'number', required: false, description: 'Items per page (default: 20)' },
        ],
    },
    {
        method: 'GET',
        path: '/api/tickets/export',
        description: 'Export tickets to CSV or JSON',
        auth: true,
        parameters: [
            { name: 'format', type: 'string', required: false, description: 'Export format (csv, json)' },
            { name: 'status', type: 'string', required: false, description: 'Filter by status' },
            { name: 'priority', type: 'string', required: false, description: 'Filter by priority' },
        ],
    },
    {
        method: 'GET',
        path: '/api/activity',
        description: 'Get recent activity logs',
        auth: true,
        parameters: [
            { name: 'limit', type: 'number', required: false, description: 'Number of activities to return (default: 20)' },
            { name: 'ticketId', type: 'number', required: false, description: 'Filter by ticket ID' },
        ],
    },
    {
        method: 'GET',
        path: '/api/users/profile',
        description: 'Get current user profile',
        auth: true,
    },
    {
        method: 'PUT',
        path: '/api/users/profile',
        description: 'Update current user profile',
        auth: true,
        requestBody: [
            { field: 'name', type: 'string', required: false, description: 'User display name' },
            { field: 'email', type: 'string', required: false, description: 'User email' },
            { field: 'currentPassword', type: 'string', required: false, description: 'Current password (required to change password)' },
            { field: 'newPassword', type: 'string', required: false, description: 'New password' },
        ],
    },
    {
        method: 'GET',
        path: '/api/users/preferences',
        description: 'Get current user preferences',
        auth: true,
    },
    {
        method: 'PUT',
        path: '/api/users/preferences',
        description: 'Update current user preferences',
        auth: true,
        requestBody: [
            { field: 'emailNotifications', type: 'boolean', required: false, description: 'Enable email notifications' },
            { field: 'desktopNotifications', type: 'boolean', required: false, description: 'Enable desktop notifications' },
            { field: 'theme', type: 'string', required: false, description: 'Theme (dark, light, system)' },
            { field: 'language', type: 'string', required: false, description: 'Language code' },
            { field: 'timezone', type: 'string', required: false, description: 'Timezone' },
            { field: 'defaultView', type: 'string', required: false, description: 'Default view (kanban, list, calendar, intelligence, sla, reports)' },
        ],
    },
    {
        method: 'POST',
        path: '/api/auth/forgot-password',
        description: 'Request password reset email',
        auth: false,
        requestBody: [
            { field: 'email', type: 'string', required: true, description: 'User email address' },
        ],
    },
    {
        method: 'POST',
        path: '/api/auth/reset-password',
        description: 'Reset password with token',
        auth: false,
        requestBody: [
            { field: 'token', type: 'string', required: true, description: 'Reset token from email' },
            { field: 'password', type: 'string', required: true, description: 'New password' },
        ],
    },
];

const methodColors: Record<string, string> = {
    GET: 'bg-green-500/20 text-green-400 border-green-500/30',
    POST: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    PUT: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
    PATCH: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

function EndpointCard({ endpoint }: { endpoint: ApiEndpoint }) {
    const [expanded, setExpanded] = useState(false);
    const [copied, setCopied] = useState(false);

    const copyPath = () => {
        navigator.clipboard.writeText(endpoint.path);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-zinc-900/50 border border-white/5 rounded-xl overflow-hidden">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-colors"
            >
                <span className={`px-2 py-1 text-xs font-bold rounded border ${methodColors[endpoint.method]}`}>
                    {endpoint.method}
                </span>
                <code className="text-sm text-white/80 font-mono flex-1 text-left">{endpoint.path}</code>
                {endpoint.auth && (
                    <span className="px-2 py-0.5 text-[10px] bg-orange-500/20 text-orange-400 rounded border border-orange-500/30">
                        AUTH
                    </span>
                )}
                {expanded ? <ChevronDown size={16} className="text-white/40" /> : <ChevronRight size={16} className="text-white/40" />}
            </button>

            {expanded && (
                <div className="p-4 pt-0 space-y-4">
                    <p className="text-white/60 text-sm">{endpoint.description}</p>

                    {endpoint.parameters && endpoint.parameters.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Parameters</h4>
                            <div className="space-y-2">
                                {endpoint.parameters.map((param) => (
                                    <div key={param.name} className="flex items-start gap-2 text-sm">
                                        <code className="text-blue-400 font-mono">{param.name}</code>
                                        <span className="text-white/30">({param.type})</span>
                                        {param.required && <span className="text-red-400 text-xs">required</span>}
                                        <span className="text-white/40">- {param.description}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {endpoint.requestBody && endpoint.requestBody.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Request Body</h4>
                            <div className="space-y-2">
                                {endpoint.requestBody.map((field) => (
                                    <div key={field.field} className="flex items-start gap-2 text-sm">
                                        <code className="text-green-400 font-mono">{field.field}</code>
                                        <span className="text-white/30">({field.type})</span>
                                        {field.required && <span className="text-red-400 text-xs">required</span>}
                                        <span className="text-white/40">- {field.description}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <button
                            onClick={copyPath}
                            className="flex items-center gap-1 px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-xs text-white/60 transition-colors"
                        >
                            {copied ? <Check size={12} /> : <Copy size={12} />}
                            {copied ? 'Copied!' : 'Copy path'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ApiDocsPage() {
    return (
        <div className="min-h-screen bg-[#050505]">
            <header className="h-14 border-b border-white/5 flex items-center justify-between px-4 md:px-6 bg-zinc-950/20 backdrop-blur-sm sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-white/40 hover:text-white transition-colors"
                    >
                        <span className="text-sm font-medium">Back to Dashboard</span>
                    </Link>
                    <div className="h-6 w-px bg-white/10" />
                    <h1 className="text-lg font-bold text-white flex items-center gap-2">
                        <Book size={20} className="text-blue-500" />
                        API Documentation
                    </h1>
                </div>
            </header>

            <div className="max-w-4xl mx-auto p-6 space-y-8">
                <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Horizon IT API</h2>
                    <p className="text-white/60 text-sm mb-4">
                        Welcome to the Horizon IT API documentation. All endpoints require authentication unless marked otherwise.
                        Use JWT tokens in the Authorization header or cookies for authentication.
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                        <span className="text-white/40">Base URL:</span>
                        <code className="text-blue-400 bg-blue-500/10 px-2 py-1 rounded">https://your-domain.com</code>
                    </div>
                </div>

                <div className="space-y-3">
                    <h3 className="text-lg font-bold text-white">Endpoints</h3>
                    {apiEndpoints.map((endpoint, index) => (
                        <EndpointCard key={index} endpoint={endpoint} />
                    ))}
                </div>

                <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Authentication</h3>
                    <p className="text-white/60 text-sm mb-4">
                        To authenticate, include the JWT token in your requests:
                    </p>
                    <div className="bg-black/50 rounded-lg p-4">
                        <code className="text-green-400 text-sm">
                            Authorization: Bearer your_jwt_token_here
                        </code>
                    </div>
                    <p className="text-white/40 text-xs mt-2">
                        Or the token will be automatically included via cookies when logged in.
                    </p>
                </div>

                <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Error Responses</h3>
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <span className="px-2 py-1 text-xs font-bold bg-red-500/20 text-red-400 rounded">401</span>
                            <span className="text-white/60 text-sm">Unauthorized - Invalid or missing authentication</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="px-2 py-1 text-xs font-bold bg-yellow-500/20 text-yellow-400 rounded">400</span>
                            <span className="text-white/60 text-sm">Bad Request - Invalid parameters or request body</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="px-2 py-1 text-xs font-bold bg-red-500/20 text-red-400 rounded">500</span>
                            <span className="text-white/60 text-sm">Internal Server Error - Something went wrong on the server</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}