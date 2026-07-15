import React from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  TooltipProps
} from 'recharts';
import { 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  Tag, 
  Target,
  BarChart3,
  Calendar
} from 'lucide-react';
import { Project, Task, DEFAULT_LABELS, Label } from '../types';

interface AnalyticsDashboardProps {
  project: Project;
  tasks: Task[];
  projectLabels?: Label[];
  isDarkMode?: boolean;
}

export default function AnalyticsDashboard({
  project,
  tasks,
  projectLabels = [],
  isDarkMode = false
}: AnalyticsDashboardProps) {

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const inProgressTasks = tasks.filter(t => t.status === 'progress').length;
  const todoTasks = tasks.filter(t => t.status === 'todo').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const highPriorityTasks = tasks.filter(t => t.priority === 'high').length;

  const todayStr = new Date().toISOString().split('T')[0];
  const overdueTasksCount = tasks.filter(t => t.dueDate && t.dueDate < todayStr && t.status !== 'done').length;

  const statusData = [
    { name: 'To Do', value: todoTasks, color: '#f59e0b', bgClass: 'bg-amber-100 border-amber-300 text-amber-900' },
    { name: 'In Progress', value: inProgressTasks, color: '#3b82f6', bgClass: 'bg-blue-100 border-blue-300 text-blue-900' },
    { name: 'Done', value: completedTasks, color: '#10b981', bgClass: 'bg-emerald-100 border-emerald-300 text-emerald-900' }
  ].filter(item => item.value > 0 || totalTasks === 0);

  const statusChartData = statusData.length > 0 ? statusData : [
    { name: 'Empty', value: 1, color: '#e5e7eb', bgClass: 'bg-gray-100' }
  ];

  const memberNames = Array.from(new Set([
    ...(project.collaborators || []).map(c => c.name),
    ...tasks.map(t => t.assignee?.name).filter(Boolean) as string[]
  ]));

  const teamProductivityData = memberNames.map(name => {
    const memberTasks = tasks.filter(t => t.assignee?.name === name);
    const todo = memberTasks.filter(t => t.status === 'todo').length;
    const progress = memberTasks.filter(t => t.status === 'progress').length;
    const done = memberTasks.filter(t => t.status === 'done').length;
    return {
      name: name.split(' ')[0] || name,
      fullName: name,
      'To Do': todo,
      'In Progress': progress,
      'Done': done,
      total: memberTasks.length
    };
  }).sort((a, b) => b.total - a.total);

  const unassignedTasks = tasks.filter(t => !t.assignee);
  if (unassignedTasks.length > 0) {
    teamProductivityData.push({
      name: 'Unassigned',
      fullName: 'Unassigned Tasks',
      'To Do': unassignedTasks.filter(t => t.status === 'todo').length,
      'In Progress': unassignedTasks.filter(t => t.status === 'progress').length,
      'Done': unassignedTasks.filter(t => t.status === 'done').length,
      total: unassignedTasks.length
    });
  }

  const labelsToUse = project.labels && project.labels.length > 0 ? project.labels : DEFAULT_LABELS;
  const labelsBreakdown = labelsToUse.map(lbl => {
    const matchingTasks = tasks.filter(t => t.labelIds?.includes(lbl.id));
    return {
      name: lbl.name,
      Count: matchingTasks.length,
      color: lbl.color
    };
  }).filter(lbl => lbl.Count > 0);

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      if (data.name === 'Empty') return null;
      return (
        <div className="bg-[#FAF8F5] dark:bg-[#1C1B17] border border-[#E5E2DA] dark:border-[#2D2A24] p-2.5 rounded shadow-lg text-xs font-serif italic text-[#1A1A1A] dark:text-[#FAF8F5]">
          <span className="font-bold font-sans not-italic text-[10px] uppercase tracking-wider block text-stone-500 dark:text-stone-400">{data.name}</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
            <span className="font-semibold text-xs text-stone-900 dark:text-stone-100">{data.value} {data.value === 1 ? 'note' : 'notes'}</span>
            <span className="text-[10px] text-stone-500 dark:text-stone-400">({totalTasks > 0 ? Math.round((data.value / totalTasks) * 100) : 0}%)</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#FAF8F5] dark:bg-[#1C1B17] border border-[#E5E2DA] dark:border-[#2D2A24] p-2.5 rounded shadow-lg text-xs">
          <span className="font-bold text-[#1A1A1A] dark:text-[#FAF8F5] block mb-1.5 border-b border-[#E5E2DA] dark:border-[#2D2A24] pb-1">{label}</span>
          <div className="space-y-1">
            {payload.map((p, index) => (
              <div key={index} className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-stone-500 dark:text-stone-400 text-[10px]">{p.name}:</span>
                </div>
                <span className="font-bold text-stone-900 dark:text-stone-100 text-xs">{p.value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between gap-6 pt-1 border-t border-[#E5E2DA]/60 dark:border-[#2D2A24]/60 font-semibold">
              <span className="text-[10px] text-stone-700 dark:text-stone-300">Total Notes:</span>
              <span className="text-xs text-stone-900 dark:text-stone-100">
                {payload.reduce((acc, p) => acc + (p.value as number), 0)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="analytics-dashboard-panel" className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div id="kpi-total-notes" className="bg-[#FAF8F5] border border-[#E5E2DA] p-4 rounded-lg flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="block text-[8px] font-bold text-[#8C887D] uppercase tracking-wider">Total Notes Pin</span>
            <span className="block text-2xl font-serif font-bold text-[#1A1A1A]">{totalTasks}</span>
          </div>
          <div className="p-2.5 bg-stone-100 rounded-lg text-stone-600">
            <BarChart3 size={18} />
          </div>
        </div>

        <div id="kpi-completion-rate" className="bg-[#FAF8F5] border border-[#E5E2DA] p-4 rounded-lg flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="block text-[8px] font-bold text-[#8C887D] uppercase tracking-wider">Completion Rate</span>
            <span className="block text-2xl font-serif font-bold text-emerald-700">
              {completionRate}%
            </span>
          </div>
          <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600">
            <TrendingUp size={18} />
          </div>
        </div>

        <div id="kpi-high-priority" className="bg-[#FAF8F5] border border-[#E5E2DA] p-4 rounded-lg flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="block text-[8px] font-bold text-[#8C887D] uppercase tracking-wider">Urgent Action Items</span>
            <span className="block text-2xl font-serif font-bold text-amber-700">{highPriorityTasks}</span>
          </div>
          <div className="p-2.5 bg-amber-50 rounded-lg text-amber-600">
            <AlertTriangle size={18} />
          </div>
        </div>

        <div id="kpi-overdue-notes" className="bg-[#FAF8F5] border border-[#E5E2DA] p-4 rounded-lg flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="block text-[8px] font-bold text-[#8C887D] uppercase tracking-wider">Overdue Notes</span>
            <span className={`block text-2xl font-serif font-bold ${overdueTasksCount > 0 ? 'text-rose-700' : 'text-stone-500'}`}>
              {overdueTasksCount}
            </span>
          </div>
          <div className={`p-2.5 rounded-lg ${overdueTasksCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-stone-100 text-stone-400'}`}>
            <Clock size={18} />
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div id="chart-card-status-distribution" className="bg-[#FAF8F5] border border-[#E5E2DA] rounded-lg p-5 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-1.5 border-b border-[#E5E2DA] pb-2.5 mb-4">
              <Target size={14} className="text-amber-600" />
              <h3 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">Task Distribution by Status</h3>
            </div>
            {totalTasks === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center text-center">
                <p className="text-xs italic text-stone-400">No active sticky notes found to calculate distribution.</p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-around gap-4">
                <div className="w-48 h-48 shrink-0 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute flex flex-col items-center text-center">
                    <span className="text-2xl font-serif font-extrabold text-stone-800">{totalTasks}</span>
                    <span className="text-[8px] font-mono font-bold tracking-wider text-stone-400 uppercase">Notes</span>
                  </div>
                </div>

                <div className="flex-1 space-y-2 w-full max-w-[200px]">
                  {statusData.map((item, index) => (
                    <div key={index} className={`p-2 rounded border flex items-center justify-between text-xs ${item.bgClass}`}>
                      <div className="flex items-center gap-2 font-semibold">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-bold text-xs">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <p className="text-[10px] text-stone-400 italic mt-3 border-t border-[#E5E2DA]/40 pt-2 text-center sm:text-left">
            Current balance of workspace cards across standard columns.
          </p>
        </div>

        <div id="chart-card-team-productivity" className="bg-[#FAF8F5] border border-[#E5E2DA] rounded-lg p-5 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-1.5 border-b border-[#E5E2DA] pb-2.5 mb-4">
              <Users size={14} className="text-blue-600" />
              <h3 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">Teammate Allocation & Productivity</h3>
            </div>

            {teamProductivityData.length === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center text-center">
                <p className="text-xs italic text-stone-400">No teammates or task assignments configured.</p>
              </div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={teamProductivityData}
                    layout="vertical"
                    margin={{ top: 5, right: 10, left: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke={isDarkMode ? '#2D2A24' : '#E5E2DA'} />
                    <XAxis type="number" tick={{ fontSize: 9, fill: isDarkMode ? '#7A756B' : '#8C887D' }} stroke={isDarkMode ? '#4D483E' : '#C5C2B9'} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fontWeight: 'bold', fill: isDarkMode ? '#FAF8F5' : '#1A1A1A' }} stroke={isDarkMode ? '#4D483E' : '#C5C2B9'} width={65} />
                    <Tooltip content={<CustomBarTooltip />} cursor={{ fill: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)' }} />
                    <Legend 
                      verticalAlign="top" 
                      height={24} 
                      iconType="circle"
                      iconSize={6}
                      wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} 
                    />
                    <Bar dataKey="To Do" stackId="productivity" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="In Progress" stackId="productivity" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Done" stackId="productivity" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          <p className="text-[10px] text-stone-400 italic mt-3 border-t border-[#E5E2DA]/40 pt-2 text-center sm:text-left">
            Breakdown of tasks currently on boards assigned per team member.
          </p>
        </div>

        <div id="chart-card-label-breakdown" className="bg-[#FAF8F5] border border-[#E5E2DA] rounded-lg p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-1.5 border-b border-[#E5E2DA] pb-2.5 mb-4">
            <Tag size={14} className="text-emerald-600" />
            <h3 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">Tag & Label Density Analysis</h3>
          </div>

          {labelsBreakdown.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-center">
              <p className="text-xs italic text-stone-400">No custom labels mapped or currently assigned to notes on the board.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="h-44 md:col-span-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={labelsBreakdown}
                    margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#2D2A24' : '#E5E2DA'} />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 'semibold', fill: isDarkMode ? '#BEB9AD' : '#5C5850' }} stroke={isDarkMode ? '#4D483E' : '#C5C2B9'} />
                    <YAxis tick={{ fontSize: 9, fill: isDarkMode ? '#7A756B' : '#8C887D' }} stroke={isDarkMode ? '#4D483E' : '#C5C2B9'} allowDecimals={false} />
                    <Tooltip 
                      cursor={{ fill: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-[#FAF8F5] dark:bg-[#1C1B17] border border-[#E5E2DA] dark:border-[#2D2A24] px-2.5 py-1.5 rounded shadow-md text-[10px]">
                              <span className="font-bold text-stone-900 dark:text-stone-100">{data.name}</span>
                              <div className="mt-1 flex items-center gap-1 text-stone-600 dark:text-stone-400">
                                Count: <span className="font-bold text-stone-900 dark:text-stone-100">{data.Count}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="Count" fill={isDarkMode ? '#FAF8F5' : '#1A1A1A'} radius={[4, 4, 0, 0]}>
                      {labelsBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke={isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} strokeWidth={1} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 border-t md:border-t-0 md:border-l border-[#E5E2DA] pt-4 md:pt-0 md:pl-5">
                <span className="block text-[8px] font-mono font-bold text-stone-400 uppercase tracking-widest mb-1.5">Note density counts</span>
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {labelsBreakdown.map((lbl, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1 px-2.5 rounded bg-white border border-[#E5E2DA]">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/5" style={{ backgroundColor: lbl.color }} />
                        <span className="font-semibold text-stone-700 truncate">{lbl.name}</span>
                      </div>
                      <span className="font-bold font-mono text-stone-900 text-xs bg-stone-100 px-1.5 py-0.5 rounded">
                        {lbl.Count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      <div className="bg-[#FAF8F5] border border-dashed border-[#E5E2DA] rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[#5C5850]">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-600" />
          <span className="text-[10px] font-medium leading-relaxed">
            All visual statistics are updated in real-time as team members create, complete, or re-assign cards.
          </span>
        </div>
        <div className="text-[9px] font-mono uppercase tracking-wider text-stone-400 flex items-center gap-1">
          <Calendar size={10} /> Sync Time: Live
        </div>
      </div>

    </div>
  );
}
