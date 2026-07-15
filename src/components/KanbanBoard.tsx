import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Layers, 
  HelpCircle, 
  AlertCircle, 
  CalendarCheck2, 
  Clock, 
  Sparkles,
  BarChart3,
  Menu,
  History,
  Activity,
  Maximize2,
  Minimize2,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, Task, UserProfile, Label, DEFAULT_LABELS, ActivityLog } from '../types';
import StickyNoteCard from './StickyNoteCard';
import AnalyticsDashboard from './AnalyticsDashboard';
import { subscribePresence } from '../firebaseDataService';
import { PresenceUser } from '../types';

interface KanbanBoardProps {
  project: Project;
  tasks: Task[];
  activityLogs: ActivityLog[];
  onAddTask: (status: 'todo' | 'progress' | 'done') => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateTaskStatus: (taskId: string, newStatus: 'todo' | 'progress' | 'done') => void;
  onToggleCollab: (projectId: string) => void;
  currentUserProfile: UserProfile;
  isSidebarOpen?: boolean;
  onOpenSidebar?: () => void;
  onExportProject?: (projectId: string) => void;
  isDarkMode?: boolean;
}

export default function KanbanBoard({
  project,
  tasks,
  activityLogs,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onUpdateTaskStatus,
  onToggleCollab,
  currentUserProfile,
  isSidebarOpen = false,
  onOpenSidebar,
  onExportProject,
  isDarkMode = false
}: KanbanBoardProps) {

  const [dragOverCol, setDragOverCol] = useState<'todo' | 'progress' | 'done' | null>(null);

  const [viewMode, setViewMode] = useState<'board' | 'analytics'>('board');

  const [showActivitySidebar, setShowActivitySidebar] = useState(false);

  const [expandedCol, setExpandedCol] = useState<'todo' | 'progress' | 'done' | null>(null);

  useEffect(() => {
    setExpandedCol(null);
  }, [project.id]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [boardWidth, setBoardWidth] = useState(0);

  const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {

    const unsubPresence = subscribePresence((users) => {

      const projectUsers = users.filter(u => u.activeProjectId === project.id && u.id !== currentUserProfile.id);
      setActiveUsers(projectUsers);
    });

    return () => {
      unsubPresence();
    };
  }, [project.id, currentUserProfile.id]);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [filterLabelIds, setFilterLabelIds] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const projectLabels = project.labels && project.labels.length > 0 ? project.labels : DEFAULT_LABELS;

  const totalTasks = tasks.length;
  const doneTasksCount = tasks.filter(t => t.status === 'done').length;
  const completionPercentage = totalTasks > 0 ? Math.round((doneTasksCount / totalTasks) * 100) : 0;

  const handleToggleFilterLabel = (id: string) => {
    setFilterLabelIds(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedAssignee('');
    setStartDate('');
    setEndDate('');
    setPriorityFilter('all');
    setFilterLabelIds([]);
  };

  const allAssignees = Array.from(new Set([
    currentUserProfile.name,
    ...(project.collaborators || []).map(c => c.name),
    ...tasks.map(t => t.assignee?.name).filter(Boolean) as string[]
  ]));

  const filteredTasks = tasks.filter(task => {

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchTitle = task.title?.toLowerCase().includes(query);
      const matchContent = task.content?.toLowerCase().includes(query);
      if (!matchTitle && !matchContent) return false;
    }

    if (selectedAssignee) {
      if (!task.assignee || task.assignee.name !== selectedAssignee) return false;
    }

    if (priorityFilter !== 'all') {
      if (task.priority !== priorityFilter) return false;
    }

    if (startDate || endDate) {
      if (!task.dueDate) return false;
      if (startDate && task.dueDate < startDate) return false;
      if (endDate && task.dueDate > endDate) return false;
    }

    if (filterLabelIds.length > 0) {
      if (!task.labelIds || !task.labelIds.some(id => filterLabelIds.includes(id))) {
        return false;
      }
    }

    return true;
  });

  const todoTasks = filteredTasks.filter(t => t.status === 'todo');
  const progressTasks = filteredTasks.filter(t => t.status === 'progress');
  const doneTasks = filteredTasks.filter(t => t.status === 'done');

  const expandedColInfo = expandedCol === 'todo' 
    ? { title: 'To Do 📌', tasks: todoTasks, dotColor: 'bg-amber-400', status: 'todo' as const }
    : expandedCol === 'progress'
      ? { title: 'In Progress ⚡', tasks: progressTasks, dotColor: 'bg-blue-400', status: 'progress' as const }
      : expandedCol === 'done'
        ? { title: 'Done 🌿', tasks: doneTasks, dotColor: 'bg-emerald-400', status: 'done' as const }
        : null;

  const todayStr = new Date().toISOString().split('T')[0];
  const overdueTasks = tasks.filter(t => t.dueDate && t.dueDate < todayStr && t.status !== 'done');
  const dueTodayTasks = tasks.filter(t => t.dueDate && t.dueDate === todayStr && t.status !== 'done');

  const handleDragOver = (e: React.DragEvent, colStatus: 'todo' | 'progress' | 'done') => {
    e.preventDefault();
    if (dragOverCol !== colStatus) {
      setDragOverCol(colStatus);
    }
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = (e: React.DragEvent, colStatus: 'todo' | 'progress' | 'done') => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onUpdateTaskStatus(taskId, colStatus);
    }
    setDragOverCol(null);
  };

  const renderColumn = (
    title: string,
    colStatus: 'todo' | 'progress' | 'done',
    columnTasks: Task[],
    dotColor: string
  ) => {
    const isOver = dragOverCol === colStatus;
    return (
      <div
        id={`column-${colStatus}`}
        onDragOver={(e) => handleDragOver(e, colStatus)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, colStatus)}
        className={`flex-1 flex flex-col min-h-[450px] p-5 rounded-lg border transition-all duration-300 ${
          isOver 
            ? 'bg-[#ECE9DF] dark:bg-[#25231F] border-[#1A1A1A] dark:border-[#FAF8F5] scale-[1.005]' 
            : 'bg-[#FAF8F5] dark:bg-[#1E1C18] border-[#E5E2DA] dark:border-[#2D2A24] hover:bg-[#F4F1EA]/50 dark:hover:bg-[#25231F]/50'
        }`}
      >
        <div 
          onClick={() => setExpandedCol(expandedCol === colStatus ? null : colStatus)}
          className="flex items-center justify-between mb-4 pb-2 border-b border-[#E5E2DA] dark:border-[#2D2A24] cursor-pointer group/header select-none"
          title={expandedCol === colStatus ? "Collapse Column View" : "Expand Column View"}
        >
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${dotColor}`} />
            <h3 className="text-sm font-serif italic font-bold tracking-wide text-[#1A1A1A] dark:text-[#FAF8F5] group-hover/header:underline">
              {title}
            </h3>
            <span className="text-[10px] font-bold text-[#5C5850] dark:text-[#BEB9AD] font-mono bg-[#E5E2DA] dark:bg-[#2D2A24] px-2 py-0.5 rounded-full">
              {columnTasks.length}
            </span>
            <span className="text-stone-400 dark:text-stone-500 group-hover/header:text-[#1A1A1A] dark:group-hover/header:text-[#FAF8F5] transition-colors ml-1" title={expandedCol === colStatus ? "Collapse View" : "Full View"}>
              {expandedCol === colStatus ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
            </span>
          </div>

          <button
            id={`add-note-to-${colStatus}`}
            onClick={(e) => {
              e.stopPropagation();
              onAddTask(colStatus);
            }}
            className="p-1 hover:bg-[#E5E2DA] dark:hover:bg-[#2D2A24] rounded text-[#5C5850] dark:text-[#BEB9AD] hover:text-[#1A1A1A] dark:hover:text-[#FAF8F5] transition-all cursor-pointer"
            title={`Add to ${title}`}
          >
            <Plus size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[60vh] px-5 pt-2.5 pb-10 -mx-5 space-y-0">
          {columnTasks.length === 0 ? (
            <div 
              onClick={(e) => {

                e.stopPropagation();
                onAddTask(colStatus);
              }}
              className="h-28 rounded border border-dashed border-[#C5C2B9] dark:border-[#4D483E] flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:bg-[#FAF8F5] dark:hover:bg-[#1C1B17] hover:border-[#1A1A1A] dark:hover:border-[#FAF8F5] transition-all text-[#5C5850] dark:text-[#BEB9AD] select-none group"
            >
              <Plus size={16} className="text-[#8C887D] dark:text-[#7A756B] group-hover:scale-110 group-hover:text-[#1A1A1A] dark:group-hover:text-[#FAF8F5] transition-transform mb-1" />
              <span className="text-[9px] font-bold uppercase tracking-widest">Pin Sticky</span>
            </div>
          ) : (
            columnTasks.map(task => (
              <StickyNoteCard
                key={task.id}
                task={task}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onStatusChange={onUpdateTaskStatus}
                projectLabels={project.labels || []}
                onDragStart={() => setExpandedCol(null)}
              />
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div id="kanban-board-workspace" className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 overflow-y-auto h-screen transition-colors duration-200">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-start gap-4 border-b border-[#E5E2DA] dark:border-[#2D2A24] pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            {onOpenSidebar && !isSidebarOpen && (
              <button
                id="mobile-sidebar-toggle-btn"
                onClick={onOpenSidebar}
                className="p-1.5 hover:bg-[#E5E2DA] dark:hover:bg-[#2D2A24] rounded text-[#5C5850] dark:text-[#BEB9AD] hover:text-[#1A1A1A] dark:hover:text-[#FAF8F5] transition-all cursor-pointer"
                title="Open Sidebar"
              >
                <Menu size={18} />
              </button>
            )}
            <h2 className="text-3xl font-serif font-semibold text-[#1A1A1A] dark:text-[#FAF8F5] tracking-tight leading-none">
              {project.name}
            </h2>

            <div 
              className="flex items-center gap-2 bg-[#FAF8F5]/80 dark:bg-[#1C1B17]/80 border border-[#E5E2DA] dark:border-[#2D2A24] px-2.5 py-1 rounded-full shadow-2xs shrink-0 select-none ml-1 cursor-help" 
              title={`${doneTasksCount} of ${totalTasks} tasks completed`}
            >
              <div className="relative flex items-center justify-center w-7 h-7">
                <svg className="w-7 h-7 transform -rotate-90">
                  <circle
                    className="text-[#E5E2DA] dark:text-[#2D2A24]"
                    strokeWidth="2.5"
                    stroke="currentColor"
                    fill="transparent"
                    r="10.5"
                    cx="14"
                    cy="14"
                  />
                  <circle
                    className="text-emerald-600 dark:text-emerald-400 transition-all duration-500 ease-out"
                    strokeWidth="2.5"
                    strokeDasharray={2 * Math.PI * 10.5}
                    strokeDashoffset={2 * Math.PI * 10.5 - (completionPercentage / 100) * (2 * Math.PI * 10.5)}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="10.5"
                    cx="14"
                    cy="14"
                  />
                </svg>
                <span className="absolute text-[8px] font-mono font-bold text-[#1A1A1A] dark:text-[#FAF8F5]">
                  {completionPercentage}%
                </span>
              </div>
              <span className="text-[9px] font-sans font-semibold tracking-wider text-[#5C5850] dark:text-[#BEB9AD] uppercase pr-1">
                Done
              </span>
            </div>
          </div>
          <p className="text-xs text-[#5C5850] dark:text-[#BEB9AD] max-w-xl font-medium leading-relaxed">
            {project.description || 'Use sticky notes to draft goals, map sprints, and organize tasks.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2 md:gap-3 w-full sm:w-auto shrink-0">
          <div className="flex items-center gap-1 bg-[#FAF8F5] dark:bg-[#1C1B17] border border-[#E5E2DA] dark:border-[#2D2A24] p-1 rounded-lg shadow-xs">
            <button
              id="view-mode-board-btn"
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[9px] uppercase font-bold tracking-widest cursor-pointer transition-all ${
                viewMode === 'board'
                  ? 'bg-[#1A1A1A] dark:bg-[#FAF8F5] text-white dark:text-[#121211] shadow-xs'
                  : 'text-[#5C5850] dark:text-[#BEB9AD] hover:text-[#1A1A1A] dark:hover:text-[#FAF8F5] hover:bg-[#E5E2DA]/40 dark:hover:bg-[#2D2A24]/40'
              }`}
            >
              <Layers size={11} />
              Whiteboard
            </button>
            <button
              id="view-mode-analytics-btn"
              onClick={() => setViewMode('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[9px] uppercase font-bold tracking-widest cursor-pointer transition-all ${
                viewMode === 'analytics'
                  ? 'bg-[#1A1A1A] dark:bg-[#FAF8F5] text-white dark:text-[#121211] shadow-xs'
                  : 'text-[#5C5850] dark:text-[#BEB9AD] hover:text-[#1A1A1A] dark:hover:text-[#FAF8F5] hover:bg-[#E5E2DA]/40 dark:hover:bg-[#2D2A24]/40'
              }`}
            >
              <BarChart3 size={11} />
              Analytics
            </button>
          </div>

          <button
            id="toggle-activity-feed-btn"
            onClick={() => setShowActivitySidebar(!showActivitySidebar)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] uppercase font-bold tracking-widest cursor-pointer transition-all border h-[34px] ${
              showActivitySidebar
                ? 'bg-[#1A1A1A] dark:bg-[#FAF8F5] text-white dark:text-[#121211] border-[#1A1A1A] dark:border-[#FAF8F5] shadow-xs'
                : 'bg-white dark:bg-[#1C1B17] text-[#5C5850] dark:text-[#BEB9AD] hover:text-[#1A1A1A] dark:hover:text-[#FAF8F5] border-[#E5E2DA] dark:border-[#2D2A24]'
            }`}
            title="Toggle Activity Feed"
          >
            <History size={11} />
            Activity Feed
          </button>

          <div className="hidden lg:flex items-center gap-2 bg-[#FAF8F5] dark:bg-[#1C1B17] border border-[#E5E2DA] dark:border-[#2D2A24] p-1.5 rounded-lg shadow-xs w-auto shrink-0">
            <div className="hidden xl:flex flex-col pr-1">
              <div className="flex items-center gap-1">
                <Users size={12} className="text-[#5C5850] dark:text-[#BEB9AD]" />
                <span className="text-[9px] font-bold text-[#1A1A1A] dark:text-[#FAF8F5] uppercase tracking-[0.15em] font-sans">Collaboration</span>
              </div>
              <span className="text-[9px] text-[#8C887D] dark:text-[#7A756B] font-medium">
                {project.isCollaborated ? 'Active Simulation' : 'Private Board'}
              </span>
            </div>

            <div className="flex xl:hidden items-center justify-center p-1" title={project.isCollaborated ? 'Collaboration Active' : 'Private Board'}>
              <div className="relative">
                <Users size={14} className="text-[#5C5850] dark:text-[#BEB9AD]" />
                <span className={`absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full border border-white dark:border-[#1C1B17] ${project.isCollaborated ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'}`} />
              </div>
            </div>

            {project.isCollaborated ? (
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold border-2 border-[#FAF8F5] dark:border-[#1C1B17] shadow-sm hover:scale-110 transition-all z-10"
                    style={{ backgroundColor: currentUserProfile.color }}
                    title={`${currentUserProfile.name} (You)`}
                  >
                    {currentUserProfile.name.charAt(0).toUpperCase()}
                  </div>
                  {activeUsers.map((c, i) => (
                    <div
                      key={c.id}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold border-2 border-[#FAF8F5] dark:border-[#1C1B17] shadow-sm hover:scale-110 transition-transform animate-fadeIn"
                      style={{ backgroundColor: c.color, zIndex: 9 - i }}
                      title={`${c.name} (Online right now!)`}
                    >
                      {c.name.charAt(0).toUpperCase()}
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-[#FAF8F5] dark:border-[#1C1B17]" />
                    </div>
                  ))}
                </div>

                  {(!project.creatorId || project.creatorId === currentUserProfile.id) && (
                    <button
                      id="disable-collaboration-btn"
                      onClick={() => onToggleCollab(project.id)}
                      className="text-[9px] text-[#5C5850] dark:text-[#BEB9AD] hover:text-[#1A1A1A] dark:hover:text-[#FAF8F5] underline font-medium cursor-pointer shrink-0 ml-1"
                      title="Make Private"
                    >
                      <span className="hidden xl:inline">Make Private</span>
                      <span className="xl:hidden text-[8px] font-bold uppercase tracking-wider">End</span>
                    </button>
                  )}
              </div>
            ) : (!project.creatorId || project.creatorId === currentUserProfile.id) ? (
              <button
                id="activate-collaboration-btn"
                onClick={() => onToggleCollab(project.id)}
                className="flex items-center gap-1 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-[#1A1A1A] dark:text-[#FAF8F5] bg-white dark:bg-[#1C1B17] hover:bg-[#1A1A1A] dark:hover:bg-[#FAF8F5] hover:text-white dark:hover:text-[#121211] border border-[#1A1A1A] dark:border-[#FAF8F5] rounded transition-all cursor-pointer shadow-sm shrink-0"
                title="Enable Collaboration"
              >
                <Users size={10} />
                <span className="hidden xl:inline ml-1">Enable Collaboration</span>
                <span className="xl:hidden ml-1">Enable</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {(overdueTasks.length > 0 || dueTodayTasks.length > 0) && (
        <div id="due-date-reminders-banner" className="bg-[#FAF8F5] dark:bg-[#1C1B17] border border-[#E5E2DA] dark:border-[#2D2A24] rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm transition-colors duration-200">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="text-amber-700 dark:text-amber-500 shrink-0 mt-0.5" size={16} />
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-[#1A1A1A] dark:text-[#FAF8F5]">Workspace Reminders</h4>
              <p className="text-[11px] text-[#5C5850] dark:text-[#BEB9AD] leading-normal">
                {overdueTasks.length > 0 && (
                  <span className="font-semibold text-rose-700 dark:text-rose-400">{overdueTasks.length} Overdue</span>
                )}
                {overdueTasks.length > 0 && dueTodayTasks.length > 0 && ' and '}
                {dueTodayTasks.length > 0 && (
                  <span className="font-semibold text-amber-700 dark:text-amber-400">{dueTodayTasks.length} Due Today</span>
                )}
                {'. Keep up the momentum!'}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {overdueTasks.map(t => (
              <div 
                key={t.id}
                onClick={() => onEditTask(t)}
                style={{ backgroundColor: t.color }}
                className="px-2.5 py-1 text-[9px] font-bold text-stone-800 rounded border border-black/10 hover:scale-105 transition-all cursor-pointer shadow-sm max-w-[120px] truncate"
                title={`Overdue: ${t.title}`}
              >
                ⚠️ {t.title}
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'board' ? (
        <>
          <div id="search-filter-controls-panel" className="bg-[#FAF8F5] dark:bg-[#1C1B17] border border-[#E5E2DA] dark:border-[#2D2A24] rounded-lg p-4 shadow-sm relative transition-colors duration-200">
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
              <div className="relative flex-1">
                <input
                  id="board-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search sticky notes by title or keyword..."
                  className="w-full text-xs border border-[#E5E2DA] dark:border-[#2D2A24] rounded pl-8 pr-10 py-2 bg-white dark:bg-[#25231F] text-[#1A1A1A] dark:text-[#FAF8F5] focus:outline-none focus:border-[#1A1A1A] dark:focus:border-[#FAF8F5] placeholder:text-stone-400 font-medium"
                />
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 font-bold cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 relative">
                <button
                  id="toggle-filters-btn"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-1.5 px-4 py-2 text-[10px] uppercase font-bold tracking-widest border rounded transition-all cursor-pointer ${
                    showFilters || selectedAssignee || startDate || endDate || priorityFilter !== 'all' || filterLabelIds.length > 0
                      ? 'bg-[#1A1A1A] dark:bg-[#FAF8F5] text-white dark:text-[#121211] border-[#1A1A1A] dark:border-[#FAF8F5]'
                      : 'bg-white dark:bg-[#1C1B17] text-[#1A1A1A] dark:text-[#FAF8F5] border-[#E5E2DA] dark:border-[#2D2A24] hover:bg-[#F4F1EA] dark:hover:bg-[#2D2A24]'
                  }`}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  {showFilters ? 'Hide Filters' : 'Filters & Tags'}
                  {(selectedAssignee || startDate || endDate || priorityFilter !== 'all' || filterLabelIds.length > 0) && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block animate-pulse" />
                  )}
                </button>

                {showFilters && (
                  <div 
                    id="filter-dropdown-menu" 
                    className="absolute right-0 top-full mt-2 w-[320px] sm:w-[380px] bg-[#FAF8F5] dark:bg-[#1E1C18] border border-[#E5E2DA] dark:border-[#2D2A24] rounded-xl p-4 shadow-xl z-30 animate-fadeIn space-y-4 text-left"
                  >
                    <div className="flex items-center justify-between border-b border-[#E5E2DA] dark:border-[#2D2A24] pb-2">
                      <span className="text-[10px] font-bold text-[#1A1A1A] dark:text-[#FAF8F5] uppercase tracking-wider">Filter Settings</span>
                      <button 
                        onClick={() => setShowFilters(false)}
                        className="text-[10px] text-stone-400 hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-300 font-bold hover:underline cursor-pointer"
                      >
                        Close
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <span className="block text-[8px] font-bold text-[#8C887D] dark:text-[#7A756B] uppercase tracking-wider">Filter by Assignee</span>
                      <select
                        id="filter-assignee-select"
                        value={selectedAssignee}
                        onChange={(e) => setSelectedAssignee(e.target.value)}
                        className="w-full text-xs border border-[#E5E2DA] dark:border-[#2D2A24] rounded px-2 py-1.5 bg-white dark:bg-[#25231F] text-[#1A1A1A] dark:text-[#FAF8F5] focus:outline-none focus:border-[#1A1A1A] dark:focus:border-[#FAF8F5] cursor-pointer"
                      >
                        <option value="">All Team Members</option>
                        {allAssignees.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <span className="block text-[8px] font-bold text-[#8C887D] dark:text-[#7A756B] uppercase tracking-wider">Filter by Priority</span>
                      <div className="grid grid-cols-4 gap-1">
                        {(['all', 'low', 'medium', 'high'] as const).map(p => (
                          <button
                            key={p}
                            onClick={() => setPriorityFilter(p)}
                            className={`py-1.5 px-1 text-[10px] font-bold uppercase tracking-wider rounded border cursor-pointer text-center transition-all ${
                              priorityFilter === p
                                ? 'bg-[#1A1A1A] dark:bg-[#FAF8F5] text-white dark:text-[#121211] border-[#1A1A1A] dark:border-[#FAF8F5]'
                                : 'bg-white dark:bg-[#1C1B17] text-[#5C5850] dark:text-[#BEB9AD] border-[#E5E2DA] dark:border-[#2D2A24] hover:bg-[#F4F1EA] dark:hover:bg-[#2D2A24]'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="block text-[8px] font-bold text-[#8C887D] dark:text-[#7A756B] uppercase tracking-wider">Due Date Window</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="flex-1 text-[11px] border border-[#E5E2DA] dark:border-[#2D2A24] rounded px-2 py-1 bg-white dark:bg-[#25231F] text-[#1A1A1A] dark:text-[#FAF8F5] focus:outline-none focus:border-[#1A1A1A] dark:focus:border-[#FAF8F5]"
                        />
                        <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500">to</span>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="flex-1 text-[11px] border border-[#E5E2DA] dark:border-[#2D2A24] rounded px-2 py-1 bg-white dark:bg-[#25231F] text-[#1A1A1A] dark:text-[#FAF8F5] focus:outline-none focus:border-[#1A1A1A] dark:focus:border-[#FAF8F5]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 border-t border-[#E5E2DA]/60 dark:border-[#2D2A24]/60 pt-3">
                      <span className="block text-[8px] font-bold text-[#8C887D] dark:text-[#7A756B] uppercase tracking-wider">Filter by Labels</span>
                      <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto pr-1">
                        {projectLabels.map(lbl => {
                          const isSelected = filterLabelIds.includes(lbl.id);
                          return (
                            <button
                              key={lbl.id}
                              onClick={() => handleToggleFilterLabel(lbl.id)}
                              style={{ backgroundColor: isSelected ? lbl.color : 'transparent' }}
                              className={`px-2.5 py-0.5 text-[9px] font-bold rounded-full border cursor-pointer transition-all ${
                                isSelected
                                  ? 'text-stone-900 border-transparent shadow-xs ring-1 ring-black/10'
                                  : 'text-[#5C5850] dark:text-[#BEB9AD] bg-white dark:bg-[#1C1B17] border-[#E5E2DA] dark:border-[#2D2A24] hover:bg-[#F4F1EA] dark:hover:bg-[#2D2A24]'
                              }`}
                            >
                              {isSelected ? '✓ ' : ''}{lbl.name}
                            </button>
                          );
                        })}
                      </div>
                      {filterLabelIds.length > 0 && (
                        <div className="pt-1 text-right">
                          <button
                            onClick={() => setFilterLabelIds([])}
                            className="text-[9px] text-[#8C887D] dark:text-[#7A756B] hover:text-[#1A1A1A] dark:hover:text-[#FAF8F5] underline font-bold cursor-pointer"
                          >
                            Clear Labels
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-[#E5E2DA] dark:border-[#2D2A24] pt-2 mt-2">
                      <span className="text-[10px] text-[#5C5850] dark:text-[#BEB9AD]">
                        {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'} found
                      </span>
                      {(selectedAssignee || startDate || endDate || priorityFilter !== 'all' || filterLabelIds.length > 0) && (
                        <button
                          onClick={handleResetFilters}
                          className="text-[9px] uppercase tracking-wider font-bold text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 cursor-pointer"
                        >
                          Reset All
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {(searchQuery || selectedAssignee || startDate || endDate || priorityFilter !== 'all' || filterLabelIds.length > 0) && (
                  <button
                    id="reset-all-filters-btn"
                    onClick={handleResetFilters}
                    className="text-[9px] uppercase tracking-wider font-bold text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 px-2 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-all cursor-pointer"
                  >
                    Reset All
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col xl:flex-row gap-6 items-stretch">
            <div className="flex-1 grid gap-6 grid-cols-1 md:grid-cols-3">
              {renderColumn('To Do 📌', 'todo', todoTasks, 'bg-amber-400')}
              {renderColumn('In Progress ⚡', 'progress', progressTasks, 'bg-blue-400')}
              {renderColumn('Done 🌿', 'done', doneTasks, 'bg-emerald-400')}
            </div>

            {showActivitySidebar && (
              <div 
                id="activity-feed-sidebar" 
                className="w-full xl:w-80 shrink-0 bg-[#FAF8F5] dark:bg-[#1C1B17] border border-[#E5E2DA] dark:border-[#2D2A24] rounded-lg p-5 flex flex-col shadow-sm max-h-[75vh] xl:max-h-[60vh] overflow-hidden animate-fadeIn"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E2DA] dark:border-[#2D2A24] mb-4">
                  <div className="flex items-center gap-2">
                    <Activity size={14} className="text-[#1A1A1A] dark:text-[#FAF8F5]" />
                    <h3 className="text-xs font-serif italic font-bold tracking-wide text-[#1A1A1A] dark:text-[#FAF8F5]">
                      Recent Activity
                    </h3>
                  </div>
                  <button
                    id="hide-activity-feed-btn"
                    onClick={() => setShowActivitySidebar(false)}
                    className="text-[10px] text-[#8C887D] dark:text-[#7A756B] hover:text-[#1A1A1A] dark:hover:text-[#FAF8F5] uppercase tracking-wider font-bold cursor-pointer"
                  >
                    Hide
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-left select-none scrollbar-thin">
                  {activityLogs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4 text-[#8C887D] dark:text-[#7A756B]">
                      <Clock size={20} className="stroke-[1.5] mb-2 text-[#C5C2B9] dark:text-[#4D483E] animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">No Activity Yet</span>
                      <p className="text-[9px] text-[#8C887D] dark:text-[#7A756B] mt-1 leading-relaxed">
                        Changes to sticky notes, status moves, and collaborator comments will stream here live.
                      </p>
                    </div>
                  ) : (
                    activityLogs.map((log) => {
                      const timeStr = new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      let typeLabel = "EDIT";
                      let badgeBg = "bg-stone-100 dark:bg-stone-900 text-stone-700 dark:text-stone-300";
                      if (log.type === 'task_created') {
                        typeLabel = "NEW";
                        badgeBg = "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30";
                      } else if (log.type === 'status_change') {
                        typeLabel = "MOVE";
                        badgeBg = "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30";
                      } else if (log.type === 'task_deleted') {
                        typeLabel = "DEL";
                        badgeBg = "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30";
                      }

                      return (
                        <div 
                          key={log.id} 
                          className="p-3 bg-white dark:bg-[#25231F] rounded-lg border border-[#E5E2DA] dark:border-[#2D2A24] space-y-1.5 shadow-2xs hover:border-[#1A1A1A] dark:hover:border-[#FAF8F5] transition-all group duration-200 animate-fadeIn"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div 
                                className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0 shadow-3xs"
                                style={{ backgroundColor: log.userColor || '#8C887D' }}
                                title={log.userName}
                              >
                                {log.userName.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-[10px] font-bold text-[#1A1A1A] dark:text-[#FAF8F5] truncate max-w-[120px]">
                                {log.userName}
                              </span>
                            </div>
                            <span className="text-[8px] font-mono text-[#8C887D] dark:text-[#7A756B]">
                              {timeStr}
                            </span>
                          </div>

                          <div className="space-y-1 pl-5">
                            <div className="flex flex-wrap items-center gap-1">
                              <span className={`text-[7px] font-bold tracking-widest px-1 py-0.5 rounded uppercase ${badgeBg}`}>
                                {typeLabel}
                              </span>
                              {log.taskTitle && (
                                <span className="text-[9px] font-bold text-[#1A1A1A] dark:text-[#FAF8F5] truncate max-w-[150px] italic">
                                  "{log.taskTitle}"
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-[#5C5850] dark:text-[#BEB9AD] leading-relaxed break-words font-medium">
                              {log.details}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 flex justify-center text-[9px] text-[#8C887D] dark:text-[#7A756B] font-mono tracking-widest uppercase gap-1.5 items-center">
            <span>💡 Tip: You can drag and drop paper sticky notes into different columns!</span>
          </div>
        </>
      ) : (
        <AnalyticsDashboard
          project={project}
          tasks={tasks}
          projectLabels={projectLabels}
          isDarkMode={isDarkMode}
        />
      )}

      <AnimatePresence>
        {expandedColInfo && (
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-10"
            onClick={() => setExpandedCol(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", duration: 0.3, bounce: 0.1 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-6xl bg-[#FAF8F5] dark:bg-[#1C1B17] border border-[#E5E2DA] dark:border-[#2D2A24] rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E2DA] dark:border-[#2D2A24] bg-white/50 dark:bg-black/25">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${expandedColInfo.dotColor}`} />
                  <h2 className="text-lg font-serif italic font-bold tracking-wide text-[#1A1A1A] dark:text-[#FAF8F5]">
                    {expandedColInfo.title}
                  </h2>
                  <span className="text-[11px] font-bold text-[#5C5850] dark:text-[#BEB9AD] font-mono bg-[#E5E2DA] dark:bg-[#2D2A24] px-2.5 py-0.5 rounded-full">
                    {expandedColInfo.tasks.length} {expandedColInfo.tasks.length === 1 ? 'Note' : 'Notes'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    id="modal-add-note-btn"
                    onClick={() => {
                      onAddTask(expandedColInfo.status);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-white rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer shadow-xs"
                  >
                    <Plus size={12} />
                    Add Sticky
                  </button>
                  <button
                    id="close-expanded-col-btn"
                    onClick={() => setExpandedCol(null)}
                    className="p-1.5 hover:bg-[#E5E2DA] dark:hover:bg-[#2D2A24] rounded-lg text-[#5C5850] dark:text-[#BEB9AD] hover:text-[#1A1A1A] dark:hover:text-[#FAF8F5] transition-all cursor-pointer"
                    title="Close Full View"
                  >
                    <Minimize2 size={16} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#FAF8F5] dark:bg-[#1E1C18]">
                {expandedColInfo.tasks.length === 0 ? (
                  <div 
                    onClick={() => onAddTask(expandedColInfo.status)}
                    className="h-64 rounded-xl border-2 border-dashed border-[#C5C2B9] dark:border-[#4D483E] flex flex-col items-center justify-center p-8 text-center cursor-pointer hover:bg-white dark:hover:bg-[#25231F] hover:border-[#1A1A1A] dark:hover:border-[#FAF8F5] transition-all text-[#5C5850] dark:text-[#BEB9AD] group"
                  >
                    <Plus size={24} className="text-[#8C887D] dark:text-[#7A756B] group-hover:scale-110 group-hover:text-[#1A1A1A] dark:group-hover:text-[#FAF8F5] transition-transform mb-2" />
                    <span className="text-xs font-bold uppercase tracking-widest mb-1">No Sticky Notes Pinned</span>
                    <p className="text-[11px] text-[#8C887D] dark:text-[#7A756B] max-w-sm leading-relaxed">
                      Click here or the button above to pin your first elegant sticky note to this board.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-12">
                    {expandedColInfo.tasks.map((task) => (
                      <StickyNoteCard
                        key={task.id}
                        task={task}
                        onEdit={onEditTask}
                        onDelete={onDeleteTask}
                        onStatusChange={onUpdateTaskStatus}
                        projectLabels={project.labels || []}
                        onDragStart={() => setExpandedCol(null)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
