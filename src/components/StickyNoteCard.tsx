import React, { useState } from 'react';
import { Calendar, Trash2, User, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { Task, STICKY_COLORS, Label, DEFAULT_LABELS } from '../types';

interface StickyNoteCardProps {
  key?: string;
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: 'todo' | 'progress' | 'done') => void;
  projectLabels?: Label[];
  onDragStart?: () => void;
}

const getOrganicTilt = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const tilts = [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5];
  const index = Math.abs(hash) % tilts.length;
  return tilts[index];
};

export default function StickyNoteCard({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  projectLabels = [],
  onDragStart
}: StickyNoteCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const colorPreset = STICKY_COLORS.find(c => c.colorCode === task.color) || STICKY_COLORS[0];
  const tiltAngle = getOrganicTilt(task.id);

  let fontClass = 'font-sans';
  if (task.fontFamily === 'mono') fontClass = 'font-mono text-[11px] leading-normal tracking-tight';
  else if (task.fontFamily === 'serif') fontClass = 'font-serif text-[13px] leading-relaxed tracking-wide';
  else if (task.fontFamily === 'handwritten') fontClass = 'font-handwritten text-[17px] leading-[1.2] font-semibold text-stone-800';
  else fontClass = 'font-sans text-[12px] leading-relaxed font-medium text-stone-800';

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  const isDueToday = task.dueDate && new Date(task.dueDate).toDateString() === new Date().toDateString() && task.status !== 'done';

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);

    if (onDragStart) {
      onDragStart();
    }

    setTimeout(() => {
      setIsDragging(true);
    }, 0);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      id={`sticky-note-wrapper-${task.id}`}
      className="relative w-full aspect-square p-2.5 overflow-visible"
    >
      <motion.div
        id={`sticky-note-${task.id}`}
        draggable
        onDragStart={handleDragStart as any}
        onDragEnd={handleDragEnd}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        animate={{
          rotate: isDragging ? -7 : isHovered ? 0 : tiltAngle,
          y: isDragging ? -16 : isHovered ? -6 : 0,
          scale: isDragging ? 1.08 : isHovered ? 1.03 : 1,
          opacity: isDragging ? 0.6 : 1,
          boxShadow: isDragging
            ? "0 35px 45px -15px rgba(0, 0, 0, 0.35), 0 18px 24px -10px rgba(0, 0, 0, 0.25)"
            : isHovered
              ? "0 14px 24px -6px rgba(0,0,0,0.15), 0 8px 10px -4px rgba(0,0,0,0.1)"
              : "0 5px 8px -2px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)"
        }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 18,
          mass: 0.8
        }}
        style={{
          backgroundColor: task.color,
        }}
        className={`relative w-full h-full p-5 pt-7 rounded-sm select-none cursor-grab active:cursor-grabbing border ${colorPreset.borderClass}`}
      >
        <div 
          className="absolute top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full z-20 flex items-center justify-center shadow-[0_3px_5px_rgba(0,0,0,0.3)] border cursor-pointer"
          style={{
            backgroundColor: 
              task.priority === 'high' ? '#f43f5e' : 
              task.priority === 'medium' ? '#f59e0b' : '#3b82f6',
            borderColor: 
              task.priority === 'high' ? '#be123c' : 
              task.priority === 'medium' ? '#b45309' : '#1d4ed8'
          }}
          title={`Priority: ${task.priority}`}
        >
          <div className="w-1 h-1 bg-white/60 rounded-full absolute top-0.5 left-0.5" />
        </div>
        <div className="absolute top-4 left-1/2 -translate-x-[20%] w-0.5 h-2.5 bg-stone-900/45 rounded-full blur-[0.5px] z-10 transform rotate-12" />

        <div className="absolute bottom-0 right-0 w-4 h-4 bg-gradient-to-br from-black/5 to-black/20 pointer-events-none rounded-tl-md rounded-br-sm" />

        <div className="h-full flex flex-col justify-between" onClick={() => onEdit(task)}>
          <div className="space-y-1.5 overflow-hidden flex-1 flex flex-col min-h-0 mb-1.5">
            <div className="flex items-start justify-between gap-1 shrink-0">
              <h4 className="font-serif font-bold text-stone-900 text-xs tracking-tight line-clamp-1 leading-snug">
                {task.title || 'Untitled'}
              </h4>
              <div className={`flex items-center gap-1 ${isHovered ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}>
                <button
                  id={`delete-note-btn-${task.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(task.id);
                  }}
                  className="p-1 hover:bg-stone-900/10 rounded text-stone-500 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Delete note"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>

            {task.labelIds && task.labelIds.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-0.5 max-h-[18px] overflow-hidden shrink-0">
                {task.labelIds.map(id => {
                  const lbl = projectLabels.find(l => l.id === id) || DEFAULT_LABELS.find(l => l.id === id);
                  if (!lbl) return null;
                  return (
                    <span
                      key={id}
                      style={{ backgroundColor: lbl.color }}
                      className="px-1.5 py-0.5 text-[7px] font-extrabold text-stone-900 rounded-full border border-black/5 uppercase tracking-wide leading-none"
                      title={lbl.name}
                    >
                      {lbl.name}
                    </span>
                  );
                })}
              </div>
            )}
            <p className={`${fontClass} ${colorPreset.textClass} flex-1 overflow-y-auto min-h-0 pr-0.5 leading-relaxed break-words scrollbar-thin`}>
              {task.content || 'Click to write a note...'}
            </p>
          </div>

          <div className="flex items-end justify-between border-t border-stone-800/10 pt-2 text-[10px] text-stone-500 font-mono">
            <div className="flex items-center gap-1 min-w-0 flex-1">
              {task.dueDate ? (
                <div 
                  className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full ${
                    isOverdue ? 'bg-rose-100 text-rose-700 font-bold border border-rose-200' :
                    isDueToday ? 'bg-amber-100 text-amber-700 font-bold border border-amber-200' :
                    'bg-stone-900/5 text-stone-600'
                  }`}
                  title={isOverdue ? 'Overdue!' : isDueToday ? 'Due today!' : `Due: ${task.dueDate}`}
                >
                  {isOverdue || isDueToday ? <Clock size={9} /> : <Calendar size={9} />}
                  <span className="truncate">{task.dueDate.split('-').slice(1).join('/')}</span>
                </div>
              ) : (
                <span className="text-[9px] text-stone-400 italic">No date</span>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
              {task.status !== 'todo' && (
                <button
                  id={`move-left-${task.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(task.id, task.status === 'done' ? 'progress' : 'todo');
                  }}
                  className="p-1 bg-white/40 hover:bg-white/80 rounded border border-stone-800/5 hover:border-stone-800/20 text-stone-600 shadow-sm cursor-pointer md:hidden"
                  title="Move Left"
                >
                  <ChevronLeft size={10} />
                </button>
              )}

              {task.assignee ? (
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold border border-black/10 shadow-sm"
                  style={{ backgroundColor: task.assignee.color }}
                  title={`Assigned to: ${task.assignee.name}`}
                >
                  {task.assignee.name.charAt(0).toUpperCase()}
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full flex items-center justify-center bg-stone-900/5 text-stone-400 border border-dashed border-stone-300">
                  <User size={8} />
                </div>
              )}

              {task.status !== 'done' && (
                <button
                  id={`move-right-${task.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(task.id, task.status === 'todo' ? 'progress' : 'done');
                  }}
                  className="p-1 bg-white/40 hover:bg-white/80 rounded border border-stone-800/5 hover:border-stone-800/20 text-stone-600 shadow-sm cursor-pointer md:hidden"
                  title="Move Right"
                >
                  <ChevronRight size={10} />
                </button>
              )}
            </div>

          </div>

        </div>
      </motion.div>
    </div>
  );
}
