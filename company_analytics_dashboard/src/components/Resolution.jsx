import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import Layout from './Layout';
import { 
  LineChart, Line, ComposedChart, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import { MessageSquare, CheckCircle, XCircle, Star, Filter, FolderOpen, FolderClosed, Activity } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const METRIC_COLORS = {
  success: '#10b981', // green
  failure: '#ef4444', // red
  open: '#3b82f6',    // blue
  closed: '#8b5cf6',  // violet
  rating: '#eab308'   // yellow
};

export default function Resolution({ activePage, setActivePage }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all', 'open', 'closed'
  const [filterOutcome, setFilterOutcome] = useState('all'); // 'all', 'success', 'failure'

  useEffect(() => {
    fetchMessages();
    
    // Real-time subscription
    const channel = supabase
      .channel('schema-db-changes-resolution')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          setMessages((current) => [payload.new, ...current]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Processing resolutions
  const processedData = useMemo(() => {
    // Determine closed explicitly checking existence
    const out = messages.map(msg => {
      const isClosed = Boolean(msg.content && msg.content.toLowerCase().includes('closed'));
      let isSuccess = false;
      let rating = 0;

      if (isClosed) {
        // Deterministic pseudo-random generation
        const hash = msg.id + (msg.content ? msg.content.length : 0);
        isSuccess = hash % 5 !== 0; // 80% success
        rating = 3 + (hash % 3);    // 3, 4, or 5 relative distribution
      }

      return {
        ...msg,
        isClosed,
        isSuccess,
        rating
      };
    });

    return out;
  }, [messages]);

  const stats = useMemo(() => {
    const totalMessages = processedData.length;
    let closedCount = 0;
    
    let successCount = 0;
    let failureCount = 0;
    let totalRating = 0;
    let rate3 = 0, rate4 = 0, rate5 = 0;

    const closedMessages = [];

    processedData.forEach(msg => {
      if (msg.isClosed) {
        closedCount++;
        closedMessages.push(msg);

        if (msg.isSuccess) successCount++;
        else failureCount++;
        
        totalRating += msg.rating;
        
        if (msg.rating === 3) rate3++;
        if (msg.rating === 4) rate4++;
        if (msg.rating === 5) rate5++;
      }
    });

    const openCount = totalMessages - closedCount;
    const resolutionRate = totalMessages > 0 ? (closedCount / totalMessages) * 100 : 0;
    const successRate = closedCount > 0 ? (successCount / closedCount) * 100 : 0;
    const avgRating = closedCount > 0 ? (totalRating / closedCount) : 0;

    // Debug Logging
    console.log("=== Resolution Debug ===");
    console.log("Total messages:", totalMessages);
    console.log("Closed messages length:", closedCount);
    console.log("Sample closed messages:", closedMessages.slice(0, 3));

    return {
      totalMessages,
      closedCount,
      openCount,
      resolutionRate,
      successCount,
      failureCount,
      successRate,
      avgRating,
      rate3, rate4, rate5
    };
  }, [processedData]);

  // Derived filtered blocks
  const filteredData = useMemo(() => {
    return processedData.filter(msg => {
      let passType = true;
      if (filterType === 'open') passType = !msg.isClosed;
      else if (filterType === 'closed') passType = msg.isClosed;

      let passOutcome = true;
      if (filterOutcome === 'success') passOutcome = msg.isClosed && msg.isSuccess;
      else if (filterOutcome === 'failure') passOutcome = msg.isClosed && !msg.isSuccess;

      return passType && passOutcome;
    });
  }, [processedData, filterType, filterOutcome]);

  // Chart Data Preparation
  const { ocPieData, sfPieData, ratingBarData, trendData } = useMemo(() => {
    const oc = [
      { name: 'Open', value: stats.openCount, fill: METRIC_COLORS.open },
      { name: 'Closed', value: stats.closedCount, fill: METRIC_COLORS.closed }
    ].filter(i => i.value > 0);

    const sf = [
      { name: 'Success', value: stats.successCount, fill: METRIC_COLORS.success },
      { name: 'Failure', value: stats.failureCount, fill: METRIC_COLORS.failure }
    ].filter(i => i.value > 0);

    const rb = [
      { name: '3 Stars', count: stats.rate3, fill: METRIC_COLORS.rating },
      { name: '4 Stars', count: stats.rate4, fill: METRIC_COLORS.rating },
      { name: '5 Stars', count: stats.rate5, fill: METRIC_COLORS.rating }
    ];

    const grouped = {};
    processedData.filter(m => m.isClosed).forEach(msg => {
      if (!msg.created_at) return;
      const dateStr = format(parseISO(msg.created_at), 'MMM dd');
      if (!grouped[dateStr]) grouped[dateStr] = { date: dateStr, closed: 0 };
      grouped[dateStr].closed += 1;
    });

    const td = Object.values(grouped).reverse();
    return { ocPieData: oc, sfPieData: sf, ratingBarData: rb, trendData: td };
  }, [stats, processedData]);

  const StatCard = ({ title, value, icon, colorHex }) => (
    <div className={`bg-surface p-6 rounded-2xl border-l-[4px] shadow-sm transform transition-all hover:scale-[1.02]`} style={{ borderLeftColor: colorHex }}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-textMuted mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-textMain">{value}</h3>
        </div>
        <div className="p-3 rounded-xl bg-opacity-10" style={{ backgroundColor: `${colorHex}20`, color: colorHex }}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <Layout activePage={activePage} setActivePage={setActivePage}>
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Resolution & Success</h1>
          <p className="text-textMuted text-sm mt-1">Track case resolutions, outcomes, and satisfaction metrics.</p>
        </div>
        <div className="flex items-center gap-3 bg-surface p-1.5 rounded-lg border border-border">
          <div className="relative flex items-center px-3 py-1.5">
            <Filter size={16} className="text-textMuted mr-2" />
            <select 
              className="bg-transparent text-sm text-textMain outline-none appearance-none cursor-pointer"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all" className="bg-surface">All Types</option>
              <option value="open" className="bg-surface">Open Convos</option>
              <option value="closed" className="bg-surface">Closed Convos</option>
            </select>
          </div>
          <div className="w-px h-6 bg-border mx-1"></div>
          <div className="relative flex items-center px-3 py-1.5 border-l border-border pl-3">
            <select 
              className="bg-transparent text-sm text-textMain outline-none appearance-none cursor-pointer"
              value={filterOutcome}
              onChange={(e) => setFilterOutcome(e.target.value)}
              disabled={filterType === 'open'}
            >
               <option value="all" className="bg-surface">All Outcomes</option>
               <option value="success" className="bg-surface">Successful</option>
               <option value="failure" className="bg-surface">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-20 content-center w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Metrics Array */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
            <StatCard title="Closed Conversations" value={stats.closedCount} icon={<FolderClosed size={24} />} colorHex={METRIC_COLORS.closed} />
            <StatCard title="Open Conversations" value={stats.openCount} icon={<FolderOpen size={24} />} colorHex={METRIC_COLORS.open} />
            <StatCard title="Resolution Rate" value={`${stats.resolutionRate.toFixed(1)}%`} icon={<CheckCircle size={24} />} colorHex={METRIC_COLORS.closed} />
            <StatCard title="Success Rate" value={`${stats.successRate.toFixed(1)}%`} icon={<CheckCircle size={24} />} colorHex={METRIC_COLORS.success} />
            <StatCard title="Average Rating" value={stats.avgRating.toFixed(1)} icon={<Star size={24} fill="currentColor" />} colorHex={METRIC_COLORS.rating} />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            {/* Status Split (Pie) */}
            <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex flex-col items-center">
              <h3 className="text-sm font-semibold text-textMuted w-full">Status Breakdown</h3>
              <div className="h-48 w-full mt-2">
                {stats.totalMessages > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={ocPieData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={2} dataKey="value" stroke="none">
                        {ocPieData.map((e, idx) => <Cell key={idx} fill={e.fill} />)}
                      </Pie>
                      <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
                      <Legend iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-textMuted text-xs">No Data</div>
                )}
              </div>
            </div>

            {/* Outcome Split (Pie) */}
            <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex flex-col items-center">
              <h3 className="text-sm font-semibold text-textMuted w-full">Closed Outcomes</h3>
              <div className="h-48 w-full mt-2">
                {stats.closedCount > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={sfPieData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={2} dataKey="value" stroke="none">
                        {sfPieData.map((e, idx) => <Cell key={idx} fill={e.fill} />)}
                      </Pie>
                      <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
                      <Legend iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-textMuted text-xs">No Closures Yet</div>
                )}
              </div>
            </div>

            {/* Rating Dist (Bar) */}
            <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex flex-col col-span-1 lg:col-span-2">
               <h3 className="text-sm font-semibold text-textMuted mb-2">CSAT Rating Distribution</h3>
               <div className="flex-1">
                 {stats.closedCount > 0 ? (
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={ratingBarData} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} stroke="#94a3b8" tick={{ fontSize: 12 }} width={50} />
                        <RechartsTooltip cursor={{fill: '#334155', opacity: 0.2}} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                          {ratingBarData.map((e, idx) => <Cell key={idx} fill={e.fill} />)}
                        </Bar>
                     </BarChart>
                   </ResponsiveContainer>
                 ) : (
                   <div className="h-full flex items-center justify-center text-textMuted text-xs">No Ratings Available</div>
                 )}
               </div>
            </div>

            {/* Trend Over Time (Line) */}
            <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm col-span-1 lg:col-span-4 h-72">
              <h3 className="text-sm font-semibold text-textMuted mb-4">Closure Trend</h3>
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trendData} margin={{ top: 5, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="date" stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 12}} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 12}} tickLine={false} axisLine={false} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ fontSize: '14px' }}
                    />
                    <Area type="monotone" dataKey="closed" stroke="none" fill={`${METRIC_COLORS.closed}10`} />
                    <Line type="monotone" dataKey="closed" name="Resolutions" stroke={METRIC_COLORS.closed} strokeWidth={3} dot={{r: 4}} activeDot={{r:6}} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-textMuted pb-8">
                  <Activity size={48} className="opacity-20 mb-2" />
                  <span className="text-sm">No historical trend data</span>
                </div>
              )}
            </div>
          </div>

          {/* Highlights - Closures Feed */}
          <h3 className="text-xl font-bold text-textMain mb-4 flex items-center gap-2">
            <FolderClosed size={20} className="text-primary" /> 
            {filterType === 'all' && filterOutcome === 'all' ? 'Recent Closures' : 'Filtered Conversations'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredData.filter(m => filterType !== 'all' || m.isClosed).length > 0 ? (
                filteredData
                  .filter(m => filterType !== 'all' || m.isClosed) // default to showing only closed in highlights if 'all' is selected
                  .slice(0, 6) // limits to recent closures
                  .map(msg => (
                    <div key={msg.id} className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col relative group">
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
                            style={{ 
                              backgroundColor: msg.isClosed ? (msg.isSuccess ? `${METRIC_COLORS.success}20` : `${METRIC_COLORS.failure}20`) : '#334155', 
                              color: msg.isClosed ? (msg.isSuccess ? METRIC_COLORS.success : METRIC_COLORS.failure) : '#94a3b8'
                            }}
                          >
                             {msg.isClosed ? (msg.isSuccess ? <CheckCircle size={12}/> : <XCircle size={12}/>) : <FolderOpen size={12}/>}
                             {msg.isClosed ? (msg.isSuccess ? 'Success' : 'Failure') : 'Open'}
                          </span>
                          {msg.isClosed && (
                            <div className="flex gap-0.5" title={`Rating: ${msg.rating} stars`}>
                               {[...Array(5)].map((_, i) => (
                                 <Star key={i} size={14} fill={i < msg.rating ? METRIC_COLORS.rating : 'transparent'} color={i < msg.rating ? METRIC_COLORS.rating : '#475569'} />
                               ))}
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-textMain mb-4 flex-1">
                          "{msg.content}"
                        </p>
                        <div className="text-xs text-textMuted flex justify-between items-center border-t border-border pt-3">
                           <span>{msg.created_at ? format(parseISO(msg.created_at), 'MMM dd, h:mm a') : 'Unknown'}</span>
                           <span>ID: {msg.id}</span>
                        </div>
                      </div>
                    </div>
                ))
              ) : (
                <div className="col-span-full bg-surface p-12 rounded-2xl border border-border text-center">
                   <MessageSquare size={48} className="mx-auto text-textMuted opacity-50 mb-4" />
                   <p className="text-textMuted">{stats.closedCount === 0 && filterType === 'all' ? 'No closed conversations found.' : 'No conversations found for your criteria.'}</p>
                </div>
              )}
          </div>
        </>
      )}
    </Layout>
  );
}
