import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import Layout from './Layout';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { MessageSquare, Users, Bot, UserCog, AlertCircle, Filter, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const SENDER_COLORS = {
  user: '#3b82f6',
  bot: '#10b981',
  agent: '#8b5cf6',
  pending_human: '#f59e0b'
};

const SENDER_ICONS = {
  user: <Users size={18} />,
  bot: <Bot size={18} />,
  agent: <UserCog size={18} />,
  pending_human: <AlertCircle size={18} />
};

const SENDER_LABELS = {
  user: 'User',
  bot: 'Bot',
  agent: 'Agent',
  pending_human: 'Escalation'
};

export default function Dashboard({ activePage, setActivePage }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSender, setFilterSender] = useState('all');
  const [filterDays, setFilterDays] = useState(7); // default 7 days

  useEffect(() => {
    fetchMessages();
    
    // Real-time subscription
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          setMessages((current) => [payload.new, ...current]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  // Derived State (Metrics)
  const stats = useMemo(() => {
    const defaultStats = { total: 0, user: 0, bot: 0, agent: 0, pending: 0 };
    return messages.reduce((acc, msg) => {
      acc.total += 1;
      if (msg.sender === 'user') acc.user += 1;
      if (msg.sender === 'bot') acc.bot += 1;
      if (msg.sender === 'agent') acc.agent += 1;
      if (msg.sender === 'pending_human') acc.pending += 1;
      return acc;
    }, defaultStats);
  }, [messages]);

  // Derived State (Filtered logs)
  const filteredMessages = useMemo(() => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - filterDays);
    
    return messages.filter(msg => {
      const msgDate = new Date(msg.created_at);
      const passesDate = msgDate >= cutoffDate;
      const passesSender = filterSender === 'all' || msg.sender === filterSender;
      return passesDate && passesSender;
    });
  }, [messages, filterDays, filterSender]);

  // Derived State (Charts Data)
  const { lineData, pieData } = useMemo(() => {
    // Pie Data
    const pData = [
      { name: 'User', value: stats.user, color: SENDER_COLORS.user },
      { name: 'Bot', value: stats.bot, color: SENDER_COLORS.bot },
      { name: 'Agent', value: stats.agent, color: SENDER_COLORS.agent },
      { name: 'Pending Human', value: stats.pending, color: SENDER_COLORS.pending_human },
    ].filter(item => item.value > 0);

    // Line Data (Messages over time - groupby Day)
    // We only use filteredMessages for trend to reflect date filter
    const grouped = {};
    filteredMessages.forEach(msg => {
      if (!msg.created_at) return;
      const dateStr = format(parseISO(msg.created_at), 'MMM dd');
      if (!grouped[dateStr]) {
        grouped[dateStr] = { date: dateStr, count: 0, user: 0, bot: 0, agent: 0, pending: 0 };
      }
      grouped[dateStr].count += 1;
      if (msg.sender === 'user') grouped[dateStr].user += 1;
      if (msg.sender === 'bot') grouped[dateStr].bot += 1;
      if (msg.sender === 'agent') grouped[dateStr].agent += 1;
      if (msg.sender === 'pending_human') grouped[dateStr].pending += 1;
    });

    // Convert object to array and sort by date. 
    // Simplified descending sort reversal since data is fetched descending
    const lData = Object.values(grouped).reverse();

    return { lineData: lData, pieData: pData };
  }, [stats, filteredMessages]);

  const StatCard = ({ title, value, icon, colorClass, borderClass }) => (
    <div className={`bg-surface p-6 rounded-2xl border-l-[4px] shadow-sm transform transition-all duration-300 hover:scale-[1.02] hover:shadow-md ${borderClass} border-border/50`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-textMuted mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-textMain">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl bg-opacity-10 ${colorClass}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <Layout activePage={activePage} setActivePage={setActivePage}>
      {/* Header section w/ Filters */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard Overview</h1>
          <p className="text-textMuted text-sm mt-1">Real-time metrics and conversation analysis.</p>
        </div>
        <div className="flex items-center gap-3 bg-surface p-1.5 rounded-lg border border-border">
          <div className="relative flex items-center px-3 py-1.5">
            <Filter size={16} className="text-textMuted mr-2" />
            <select 
              className="bg-transparent text-sm text-textMain outline-none appearance-none cursor-pointer"
              value={filterSender}
              onChange={(e) => setFilterSender(e.target.value)}
            >
              <option value="all" className="bg-surface text-textMain">All Senders</option>
              <option value="user" className="bg-surface text-textMain">Users</option>
              <option value="bot" className="bg-surface text-textMain">Bots</option>
              <option value="agent" className="bg-surface text-textMain">Agents</option>
              <option value="pending_human" className="bg-surface text-textMain">Escalations</option>
            </select>
          </div>
          <div className="w-px h-6 bg-border mx-1"></div>
          <div className="relative flex items-center px-3 py-1.5">
            <Calendar size={16} className="text-textMuted mr-2" />
            <select 
              className="bg-transparent text-sm text-textMain outline-none appearance-none cursor-pointer pr-4"
              value={filterDays}
              onChange={(e) => setFilterDays(Number(e.target.value))}
            >
              <option value={1} className="bg-surface text-textMain">Last 24 Hours</option>
              <option value={7} className="bg-surface text-textMain">Last 7 Days</option>
              <option value={30} className="bg-surface text-textMain">Last 30 Days</option>
              <option value={9999} className="bg-surface text-textMain">All Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatCard 
          title="Total Messages" 
          value={stats.total} 
          icon={<MessageSquare size={24} className="text-textMain" />} 
          colorClass="bg-white text-white" 
          borderClass="border-l-gray-300"
        />
        <StatCard 
          title="User Messages" 
          value={stats.user} 
          icon={<Users size={24} className="text-sender-user" />} 
          colorClass="bg-sender-user bg-opacity-20" 
          borderClass="border-l-sender-user"
        />
        <StatCard 
          title="Bot Responses" 
          value={stats.bot} 
          icon={<Bot size={24} className="text-sender-bot" />} 
          colorClass="bg-sender-bot bg-opacity-20" 
          borderClass="border-l-sender-bot"
        />
        <StatCard 
          title="Agent Responses" 
          value={stats.agent} 
          icon={<UserCog size={24} className="text-sender-agent" />} 
          colorClass="bg-sender-agent bg-opacity-20" 
          borderClass="border-l-sender-agent"
        />
        <StatCard 
          title="Escalations" 
          value={stats.pending} 
          icon={<AlertCircle size={24} className="text-sender-pending_human" />} 
          colorClass="bg-sender-pending_human bg-opacity-20" 
          borderClass="border-l-sender-pending_human"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface p-6 rounded-2xl border border-border lg:col-span-2 shadow-sm">
          <h3 className="text-lg font-semibold text-textMain mb-6">Message Volume (Last {filterDays === 9999 ? 'All Time' : filterDays + ' Days'})</h3>
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
                <Line type="monotone" dataKey="count" name="Total" stroke="#f8fafc" strokeWidth={3} dot={{r:4, fill: '#f8fafc', strokeWidth: 2}} activeDot={{r: 6}} />
                <Line type="monotone" dataKey="bot" name="Bot" stroke={SENDER_COLORS.bot} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="agent" name="Agent" stroke={SENDER_COLORS.agent} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="pending" name="Escalation" stroke={SENDER_COLORS.pending_human} strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex flex-col">
          <h3 className="text-lg font-semibold text-textMain mb-6">Sender Distribution</h3>
          <div className="h-64 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ fontSize: '14px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '14px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Logs Section */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col h-[500px]">
        <div className="p-6 border-b border-border flex justify-between items-center bg-surface sticky top-0 z-10">
          <h3 className="text-lg font-semibold text-textMain">Recent Conversations</h3>
          <span className="bg-primary/20 text-primary text-xs font-bold px-2.5 py-1 rounded-full">
            {filteredMessages.length} Messages
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-full text-textMuted">
              <MessageSquare size={48} className="mb-4 opacity-20" />
              <p>No messages found matching your filters.</p>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isUser = msg.sender === 'user';
              const sColor = SENDER_COLORS[msg.sender] || '#94a3b8';
              
              return (
                <div key={msg.id} className={`flex gap-4 group ${isUser ? 'flex-row-reverse' : ''}`}>
                  <div className="flex-shrink-0 mt-1">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm"
                      style={{ backgroundColor: sColor }}
                    >
                      {SENDER_ICONS[msg.sender] || <MessageSquare size={18} />}
                    </div>
                  </div>
                  <div className={`max-w-[75%] ${isUser ? 'items-end flex flex-col' : ''}`}>
                    <div className={`flex items-center gap-2 mb-1 ${isUser ? 'flex-row-reverse' : ''}`}>
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: sColor }}>
                        {SENDER_LABELS[msg.sender] || msg.sender}
                      </span>
                      <span className="text-xs text-textMuted opacity-0 group-hover:opacity-100 transition-opacity">
                        {msg.created_at ? format(parseISO(msg.created_at), 'MMM dd, h:mm a') : 'Unknown time'}
                      </span>
                    </div>
                    <div 
                      className={`p-4 rounded-2xl text-sm leading-relaxed ${
                        isUser 
                          ? 'bg-primary text-white rounded-tr-sm shadow-md' 
                          : 'bg-background border border-border text-textMain rounded-tl-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
}
