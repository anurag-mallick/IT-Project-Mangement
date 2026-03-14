"use client";
import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { Loader2, AlertCircle, Clock, CheckCircle, Ticket, TrendingUp } from 'lucide-react';
import { format, subDays } from 'date-fns';

interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  slaBreached: number;
  byPriority: { name: string; value: number }[];
  byStatus: { name: string; value: number }[];
  trend: { date: string; count: number }[];
}

const COLORS = {
  P0: '#ef4444', // red-500
  P1: '#f97316', // orange-500
  P2: '#6366f1', // indigo-500
  P3: '#71717a', // zinc-500
  TODO: '#71717a',
  IN_PROGRESS: '#3b82f6',
  AWAITING_USER: '#eab308',
  RESOLVED: '#22c55e',
  CLOSED: '#3f3f46',
};

const STATUS_LABELS: Record<string, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  AWAITING_USER: 'Awaiting',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

const IntelligenceDashboard = () => {
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/tickets?all=true');
        if (!res.ok) throw new Error('Failed to load dashboard data');
        const data = await res.json();
        const tickets: any[] = data.tickets || [];

        const byStatus: Record<string, number> = {};
        const byPriority: Record<string, number> = {};
        const trendMap: Record<string, number> = {};
        let slaBreached = 0;
        const now = new Date();

        // Initialize trend for last 7 days
        for (let i = 6; i >= 0; i--) {
          const d = format(subDays(now, i), 'MMM dd');
          trendMap[d] = 0;
        }

        tickets.forEach(t => {
          byStatus[t.status] = (byStatus[t.status] || 0) + 1;
          byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
          
          if (t.slaBreachAt && new Date(t.slaBreachAt) < now && t.status !== 'RESOLVED' && t.status !== 'CLOSED') {
            slaBreached++;
          }

          const createdDate = format(new Date(t.createdAt), 'MMM dd');
          if (trendMap[createdDate] !== undefined) {
            trendMap[createdDate]++;
          }
        });

        setStats({
          total: tickets.length,
          open: byStatus['TODO'] || 0,
          inProgress: byStatus['IN_PROGRESS'] || 0,
          resolved: (byStatus['RESOLVED'] || 0) + (byStatus['CLOSED'] || 0),
          closed: byStatus['CLOSED'] || 0,
          slaBreached,
          byStatus: Object.entries(byStatus).map(([name, value]) => ({ name: STATUS_LABELS[name] || name, value })),
          byPriority: Object.entries(byPriority).map(([name, value]) => ({ name, value })),
          trend: Object.entries(trendMap).map(([date, count]) => ({ date, count })),
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
    </div>
  );

  if (error) return (
    <div className="glass-card p-6 flex items-center gap-3 text-red-400">
      <AlertCircle size={20} />
      <span>{error}</span>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Tickets', value: stats?.total, icon: Ticket, trend: '+5%', color: 'text-white' },
          { label: 'Pending Help', value: (stats?.open || 0) + (stats?.inProgress || 0), icon: Clock, trend: '-2%', color: 'text-blue-400' },
          { label: 'Resolved', value: stats?.resolved, icon: CheckCircle, trend: '+12%', color: 'text-green-400' },
          { label: 'SLA Breaches', value: stats?.slaBreached, icon: AlertCircle, trend: 'Critical', color: 'text-red-400' },
        ].map((kpi, i) => (
          <div key={i} className="glass-card p-5 group hover:border-white/20 transition-all">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{kpi.label}</p>
              <kpi.icon size={14} className="text-white/20 group-hover:text-white/40 transition-colors" />
            </div>
            <div className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</div>
            <div className="mt-2 text-[10px] flex items-center gap-1 font-bold">
              <span className={kpi.trend === 'Critical' ? 'text-red-500' : 'text-green-500'}>{kpi.trend}</span>
              <span className="text-white/20 font-normal">vs last period</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="lg:col-span-2 glass-card p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 flex items-center gap-2">
              <TrendingUp size={14} /> Ticket Volume Trend
            </h3>
            <span className="text-[10px] text-white/30 font-medium">Last 7 Days</span>
          </div>
          <div className="h-[300px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.trend}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="date" stroke="#ffffff20" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#ffffff20" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff10', borderRadius: '8px', fontSize: '10px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="glass-card p-6 flex flex-col">
          <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 mb-6">Priority Mix</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.byPriority}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats?.byPriority.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#8884d8'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff10', borderRadius: '8px', fontSize: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4 text-[10px]">
            {stats?.byPriority.map(p => (
              <div key={p.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[p.name as keyof typeof COLORS] }} />
                <span className="text-white/60 font-medium">{p.name}: <span className="text-white">{p.value}</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 mb-6">Workflow Distribution</h3>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats?.byStatus}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis dataKey="name" stroke="#ffffff40" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff10', borderRadius: '8px', fontSize: '10px' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {stats?.byStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="#6366f1" fillOpacity={0.6} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default IntelligenceDashboard;
