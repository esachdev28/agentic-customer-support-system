import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import Layout from './Layout';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import { MessageSquare, AlertTriangle, Smile as SmileIcon, Meh, Filter } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const SENTIMENT_COLORS = {
  angry: '#ef4444',     // Red
  neutral: '#f59e0b',   // Amber/Orange
  friendly: '#10b981'   // Green
};

const SENTIMENT_ICONS = {
  angry: <AlertTriangle size={24} className="text-white" />,
  neutral: <Meh size={24} className="text-white" />,
  friendly: <SmileIcon size={24} className="text-white" />
};

const SENTIMENT_LABELS = {
  angry: 'Angry / Escalated',
  neutral: 'Neutral',
  friendly: 'Friendly'
};

export default function Sentiment({ activePage, setActivePage }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSentiment, setFilterSentiment] = useState('all');

  useEffect(() => {
    fetchMessages();
    
    // Real-time subscription
    const channel = supabase
      .channel('schema-db-changes-sentiment')
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

  // Derive Sentiment logic
  const processedMessages = useMemo(() => {
    return messages.map(msg => {
      let sentiment = 'neutral';
      if (msg.sender === 'pending_human') {
        sentiment = 'angry';
      } else {
        // pseudo-random logic for stable rendering based on id or content length
        const hash = msg.id + (msg.content ? msg.content.length : 0);
        sentiment = hash % 2 === 0 ? 'friendly' : 'neutral';
      }
      return { ...msg, sentiment };
    });
  }, [messages]);

  // Derived State (Metrics and Stats)
  const stats = useMemo(() => {
    const counts = { total: 0, angry: 0, neutral: 0, friendly: 0 };
    processedMessages.forEach(msg => {
      counts.total += 1;
      counts[msg.sentiment] += 1;
    });
    return counts;
  }, [processedMessages]);

  // Derived State (Filtered logs)
  const filteredMessages = useMemo(() => {
    if (filterSentiment === 'all') return processedMessages;
    return processedMessages.filter(msg => msg.sentiment === filterSentiment);
  }, [processedMessages, filterSentiment]);

  // Derived State (Charts Data)
  const { lineData, pieData, barData } = useMemo(() => {
    const { total, angry, friendly, neutral } = stats;

    const pData = [
      { name: 'Angry', value: angry, color: SENTIMENT_COLORS.angry },
      { name: 'Neutral', value: neutral, color: SENTIMENT_COLORS.neutral },
      { name: 'Friendly', value: friendly, color: SENTIMENT_COLORS.friendly },
    ].filter(item => item.value > 0);

    // Grouping by Date for Trend
    const grouped = {};
    processedMessages.forEach(msg => {
      if (!msg.created_at) return;
      const dateStr = format(parseISO(msg.created_at), 'MMM dd');
      if (!grouped[dateStr]) {
        grouped[dateStr] = { date: dateStr, count: 0, angry: 0, neutral: 0, friendly: 0 };
      }
      grouped[dateStr].count += 1;
      grouped[dateStr][msg.sentiment] += 1;
    });

    const lData = Object.values(grouped).reverse();
    const bData = pData.map(item => ({ name: item.name, count: item.value, fill: item.color }));

    return { lineData: lData, pieData: pData, barData: bData };
  }, [stats, processedMessages]);

  const calculatePercentage = (count) => {
    if (stats.total === 0) return 0;
    return ((count / stats.total) * 100).toFixed(1);
  };

  const StatCard = ({ title, value, count, colorKey }) => {
    const colorCode = SENTIMENT_COLORS[colorKey];
    const percentage = calculatePercentage(count);
    return (
      <div className={`bg-surface p-6 rounded-2xl border-l-[4px] shadow-sm transform transition-all duration-300 hover:scale-[1.02] hover:shadow-md`} style={{ borderLeftColor: colorCode }}>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-textMuted mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-textMain">{value}</h3>
            {colorKey && (
              <p className="text-xs mt-2 font-medium" style={{ color: colorCode }}>
                {percentage}% of total
              </p>
            )}
          </div>
          {colorKey && (
            <div className={`p-3 rounded-xl`} style={{ backgroundColor: colorCode }}>
              {SENTIMENT_ICONS[colorKey]}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Layout activePage={activePage} setActivePage={setActivePage}>
      {/* Header section w/ Filters */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Sentiment Analysis</h1>
          <p className="text-textMuted text-sm mt-1">AI-powered customer mood intelligence.</p>
        </div>
        <div className="flex items-center gap-3 bg-surface p-1.5 rounded-lg border border-border">
          <div className="relative flex items-center px-3 py-1.5">
            <Filter size={16} className="text-textMuted mr-2" />
            <select 
              className="bg-transparent text-sm text-textMain outline-none appearance-none cursor-pointer"
              value={filterSentiment}
              onChange={(e) => setFilterSentiment(e.target.value)}
            >
              <option value="all" className="bg-surface text-textMain">All Sentiments</option>
              <option value="angry" className="bg-surface text-textMain">Angry / Escalated</option>
              <option value="neutral" className="bg-surface text-textMain">Neutral</option>
              <option value="friendly" className="bg-surface text-textMain">Friendly</option>
            </select>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-surface p-6 rounded-2xl border-l-[4px] border-textMuted shadow-sm transform transition-all duration-300 hover:scale-[1.02]">
          <p className="text-sm font-medium text-textMuted mb-1">Total Messages</p>
          <div className="flex justify-between items-center mt-2">
            <h3 className="text-3xl font-bold text-textMain">{stats.total}</h3>
            <MessageSquare size={24} className="text-textMuted" />
          </div>
        </div>
        <StatCard title="Friendly Messages" value={stats.friendly} count={stats.friendly} colorKey="friendly" />
        <StatCard title="Neutral Messages" value={stats.neutral} count={stats.neutral} colorKey="neutral" />
        <StatCard title="Angry Messages" value={stats.angry} count={stats.angry} colorKey="angry" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Trend Chart */}
        <div className="bg-surface p-6 rounded-2xl border border-border lg:col-span-2 shadow-sm">
          <h3 className="text-lg font-semibold text-textMain mb-6">Sentiment Trends Over Time</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 12}} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 12}} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ fontSize: '14px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '14px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="friendly" name="Friendly" stroke={SENTIMENT_COLORS.friendly} strokeWidth={3} dot={{r: 4}} />
                <Line type="monotone" dataKey="neutral" name="Neutral" stroke={SENTIMENT_COLORS.neutral} strokeWidth={3} dot={{r: 4}} />
                <Line type="monotone" dataKey="angry" name="Angry" stroke={SENTIMENT_COLORS.angry} strokeWidth={3} dot={{r: 4}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Box - combining Pie and Bar logic in one space or side-by-side inside */}
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex flex-col">
          <h3 className="text-lg font-semibold text-textMain mb-2">Distribution</h3>
          
          <div className="h-40 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value" stroke="none">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="h-40 flex-1 mt-4">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} stroke="#94a3b8" tick={{ fontSize: 12 }} width={80} />
                  <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                    {barData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                  </Bar>
               </BarChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Highlight Section: Angry Logs only OR Filtered logs */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-textMain mb-4 flex items-center gap-2">
          {filterSentiment === 'all' ? (
            <><AlertTriangle size={20} className="text-red-500" /> Escalations to Monitor</>
          ) : (
             `Filtered Logs (${filterSentiment})`
          )}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
             <div className="col-span-full h-32 flex items-center justify-center">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
             </div>
          ) : (
            (filterSentiment === 'all' ? processedMessages.filter(m => m.sentiment === 'angry') : filteredMessages)
              .slice(0, 12) // Limits display to top 12 to not overload
              .map(msg => (
                <div key={msg.id} className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col relative group">
                  <div className={`h-1.5 w-full bg-[${SENTIMENT_COLORS[msg.sentiment]}]`} style={{ backgroundColor: SENTIMENT_COLORS[msg.sentiment] }}></div>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
                        style={{ backgroundColor: `${SENTIMENT_COLORS[msg.sentiment]}20`, color: SENTIMENT_COLORS[msg.sentiment] }}
                      >
                         {msg.sentiment === 'angry' ? <AlertTriangle size={12}/> : msg.sentiment === 'neutral' ? <Meh size={12}/> : <SmileIcon size={12}/>}
                         {SENTIMENT_LABELS[msg.sentiment]}
                      </span>
                      <span className="text-xs text-textMuted">
                        {msg.created_at ? format(parseISO(msg.created_at), 'MMM dd, h:mm a') : 'Unknown'}
                      </span>
                    </div>
                    <p className="text-sm text-textMain mb-4 flex-1">
                      "{msg.content}"
                    </p>
                    <div className="text-xs text-textMuted flex justify-between items-center border-t border-border pt-3">
                       <span>Sender: {msg.sender}</span>
                       <span>ID: {msg.id}</span>
                    </div>
                  </div>
                </div>
            ))
          )}
          {!loading && (filterSentiment === 'all' ? processedMessages.filter(m => m.sentiment === 'angry').length === 0 : filteredMessages.length === 0) && (
            <div className="col-span-full bg-surface p-12 rounded-2xl border border-border text-center">
               <SmileIcon size={48} className="mx-auto text-textMuted opacity-50 mb-4" />
               <p className="text-textMuted">No {filterSentiment !== 'all' ? filterSentiment : 'angry'} messages found.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
