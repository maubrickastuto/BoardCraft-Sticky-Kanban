import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Info, Tag, Plus, Trash2, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Task, 
  STICKY_COLORS, 
  FONT_FAMILIES, 
  Collaborator, 
  UserProfile, 
  Label, 
  DEFAULT_LABELS, 
  LABEL_COLOR_PRESETS, 
  Project 
} from '../types';

interface StickyNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Omit<Task, 'id' | 'projectId' | 'createdAt' | 'order'>) => void;
  task?: Task | null;
  project: Project;
  onUpdateProjectLabels: (labels: Label[]) => Promise<void>;
  currentUserProfile: UserProfile;
  workspaceMembers?: UserProfile[];
}

export default function StickyNoteModal({
  isOpen,
  onClose,
  onSave,
  task,
  project,
  onUpdateProjectLabels,
  currentUserProfile,
  workspaceMembers = []
}: StickyNoteModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'todo' | 'progress' | 'done'>('todo');
  const [color, setColor] = useState(STICKY_COLORS[0].colorCode);
  const [fontFamily, setFontFamily] = useState<'sans' | 'mono' | 'serif' | 'handwritten'>('handwritten');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [assignee, setAssignee] = useState<Collaborator | null>(null);

  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [showLabelManager, setShowLabelManager] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLOR_PRESETS[0].color);

  const [isEditingMode, setIsEditingMode] = useState(false);

  const projectLabels = project.labels && project.labels.length > 0 ? project.labels : DEFAULT_LABELS;

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setContent(task.content || '');
      setStatus(task.status || 'todo');
      setColor(task.color || STICKY_COLORS[0].colorCode);
      setFontFamily(task.fontFamily || 'handwritten');
      setPriority(task.priority || 'medium');
      setDueDate(task.dueDate || '');
      setAssignee(task.assignee || null);
      setSelectedLabelIds(task.labelIds || []);
      setIsEditingMode(false);
    } else {

      setTitle('');
      setContent('');
      setStatus('todo');
      setColor(STICKY_COLORS[0].colorCode);
      setFontFamily('handwritten');
      setPriority('medium');
      setDueDate('');
      setAssignee(null);
      setSelectedLabelIds([]);
      setIsEditingMode(true);
    }
    setShowLabelManager(false);
    setNewLabelName('');
  }, [task, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title: title.trim(),
      content: content.trim(),
      status,
      color,
      fontFamily,
      priority,
      dueDate,
      assignee,
      labelIds: selectedLabelIds
    });
    onClose();
  };

  const handleCancelEdit = () => {
    if (task) {
      setIsEditingMode(false);
    } else {
      onClose();
    }
  };

  const handleToggleLabel = (labelId: string) => {
    setSelectedLabelIds(prev => 
      prev.includes(labelId)
        ? prev.filter(id => id !== labelId)
        : [...prev, labelId]
    );
  };

  const handleCreateProjectLabel = async () => {
    if (!newLabelName.trim()) return;
    const newId = 'lbl-' + Math.random().toString(36).substring(2, 11);
    const newLabel: Label = {
      id: newId,
      name: newLabelName.trim(),
      color: newLabelColor
    };
    const updatedLabels = [...projectLabels, newLabel];
    await onUpdateProjectLabels(updatedLabels);

    setSelectedLabelIds(prev => [...prev, newId]);
    setNewLabelName('');
  };

  const handleDeleteProjectLabel = async (labelId: string) => {
    const updatedLabels = projectLabels.filter(lbl => lbl.id !== labelId);
    await onUpdateProjectLabels(updatedLabels);

    setSelectedLabelIds(prev => prev.filter(id => id !== labelId));
  };

  const projectCollaborators = project.collaborators || [];

  const assigneeMap = new Map<string, Collaborator>();

  assigneeMap.set(currentUserProfile.name, { name: currentUserProfile.name, color: currentUserProfile.color });

  workspaceMembers.forEach(m => {
    if (!assigneeMap.has(m.name)) {
      assigneeMap.set(m.name, { name: m.name, color: m.color });
    }
  });

  projectCollaborators.forEach(c => {
    if (!assigneeMap.has(c.name)) {
      assigneeMap.set(c.name, { name: c.name, color: c.color });
    }
  });

  const allAvailableAssignees = Array.from(assigneeMap.values());

  let previewFontClass = 'font-sans';
  if (fontFamily === 'mono') previewFontClass = 'font-mono text-xs';
  else if (fontFamily === 'serif') previewFontClass = 'font-serif text-sm';
  else if (fontFamily === 'handwritten') previewFontClass = 'font-handwritten text-xl font-semibold';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="sticky-note-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-stone-950/75 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={onClose}
        >
          {!isEditingMode ? (
            <motion.div
              id="sticky-note-preview-container"
              initial={{ scale: 0.6, y: 30, opacity: 0, rotate: -3 }}
              animate={{ scale: 1, y: 0, opacity: 1, rotate: 1 }}
              exit={{ scale: 0.6, y: 30, opacity: 0, rotate: -3 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="flex flex-col items-center gap-6 w-full max-w-md md:max-w-lg"
            >
              <div
                className="w-full aspect-square p-8 pt-10 rounded-sm shadow-2xl border relative flex flex-col justify-between text-stone-800 transition-colors duration-300"
                style={{
                  backgroundColor: color,
                  borderColor: STICKY_COLORS.find(c => c.colorCode === color)?.borderClass || '#e5e7eb'
                }}
              >
                <div
                  className="absolute top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full z-20 flex items-center justify-center shadow-[0_4px_6px_rgba(0,0,0,0.3)] border"
                  style={{
                    backgroundColor:
                      priority === 'high' ? '#f43f5e' :
                      priority === 'medium' ? '#f59e0b' : '#3b82f6',
                    borderColor:
                      priority === 'high' ? '#be123c' :
                      priority === 'medium' ? '#b45309' : '#1d4ed8'
                  }}
                >
                  <div className="w-1.5 h-1.5 bg-white/60 rounded-full absolute top-0.5 left-0.5" />
                </div>
                <div className="absolute top-6 left-1/2 -translate-x-[20%] w-0.5 h-3.5 bg-stone-900/40 rounded-full blur-[0.5px] z-10 transform rotate-12" />

                <div className="absolute bottom-0 right-0 w-6 h-6 bg-gradient-to-br from-black/5 to-black/20 pointer-events-none rounded-tl-lg rounded-br-sm shadow-xs" />

                <div className="flex flex-col h-full justify-between">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4 border-b border-stone-900/10 pb-3">
                      <h3 className="font-serif font-bold text-lg md:text-xl tracking-tight text-stone-900 leading-snug">
                        {title || 'Untitled Sticky Note'}
                      </h3>
                      <span className={`px-2.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider rounded border ${
                        priority === 'high' ? 'bg-rose-100 text-rose-700 border-rose-300' :
                        priority === 'medium' ? 'bg-amber-100 text-amber-700 border-amber-300' :
                        'bg-blue-100 text-blue-700 border-blue-300'
                      }`}>
                        {priority} priority
                      </span>
                    </div>

                    {selectedLabelIds.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 py-1">
                        {selectedLabelIds.map(id => {
                          const lbl = projectLabels.find(l => l.id === id);
                          if (!lbl) return null;
                          return (
                            <span
                              key={id}
                              style={{ backgroundColor: lbl.color }}
                              className="px-2 py-0.5 text-[9px] font-extrabold text-stone-900 rounded-full border border-black/5 uppercase tracking-wide"
                            >
                              {lbl.name}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    <p className={`${previewFontClass} leading-relaxed text-stone-850 whitespace-pre-wrap overflow-y-auto max-h-[160px] md:max-h-[220px] pr-2 scrollbar-thin`}>
                      {content || 'No description provided.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-stone-900/10 pt-4 text-xs font-mono text-stone-600 mt-4">
                    <span className="flex items-center gap-1.5 bg-stone-900/5 px-2.5 py-1 rounded-full">
                      <Calendar size={12} /> {dueDate ? `Due: ${dueDate.split('-').slice(1).join('/')}` : 'No due date'}
                    </span>

                    {assignee ? (
                      <div className="flex items-center gap-1.5 bg-stone-900/5 px-2.5 py-1 rounded-full">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold border border-black/10 shadow-sm"
                          style={{ backgroundColor: assignee.color }}
                        >
                          {assignee.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold">{assignee.name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-stone-400">
                        <User size={12} /> <span className="text-[10px] italic">Unassigned</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 w-full justify-center">
                <button
                  type="button"
                  onClick={() => setIsEditingMode(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-stone-100 text-stone-900 border border-stone-300 text-xs font-bold uppercase tracking-wider rounded shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  <Pencil size={12} /> Edit Sticky Note
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center gap-2 px-5 py-2.5 bg-stone-900/80 hover:bg-stone-900 text-white text-xs font-bold uppercase tracking-wider rounded shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  <X size={12} /> Close
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              id="sticky-note-modal"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-[#FAF8F5] dark:bg-[#1E1C18] rounded shadow-2xl border border-[#E5E2DA] dark:border-[#2D2A24] w-full max-w-4xl overflow-hidden flex flex-col md:flex-row h-auto max-h-[90vh] transition-colors duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-5 overflow-y-auto max-h-[50vh] md:max-h-[90vh]">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-serif italic font-bold text-[#1A1A1A] dark:text-[#FAF8F5]">
                    {task ? 'Configure Sticky Note' : 'Create Sticky Note'}
                  </h3>
                  <button 
                    type="button" 
                    onClick={handleCancelEdit} 
                    className="p-1 hover:bg-[#E5E2DA] dark:hover:bg-[#2D2A24] rounded text-[#8C887D] dark:text-[#BEB9AD] hover:text-[#1A1A1A] dark:hover:text-[#FAF8F5] transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-[#8C887D] dark:text-[#7A756B] uppercase tracking-wider mb-1.5">Note Heading</label>
                  <input
                    id="sticky-title-input"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Design Wireframes 🎨"
                    className="w-full text-xs font-serif font-medium border border-[#E5E2DA] dark:border-[#2D2A24] rounded px-3 py-2 bg-white dark:bg-[#25231F] text-[#1A1A1A] dark:text-[#FAF8F5] focus:outline-none focus:border-[#1A1A1A] dark:focus:border-[#FAF8F5]"
                    maxLength={40}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-[#8C887D] dark:text-[#7A756B] uppercase tracking-wider mb-1.5">Content Body</label>
                  <textarea
                    id="sticky-content-input"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Scribble down your ideas, goals, or sprint descriptions..."
                    className={`w-full h-24 text-xs border border-[#E5E2DA] dark:border-[#2D2A24] rounded px-3 py-2 bg-white dark:bg-[#25231F] text-[#1A1A1A] dark:text-[#FAF8F5] focus:outline-none focus:border-[#1A1A1A] dark:focus:border-[#FAF8F5] resize-none ${previewFontClass}`}
                    maxLength={220}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-[#8C887D] dark:text-[#7A756B] uppercase tracking-wider mb-1.5">Paper Color</label>
                  <div className="flex flex-wrap gap-2">
                    {STICKY_COLORS.map((c) => (
                      <button
                        id={`color-picker-${c.name}`}
                        key={c.name}
                        type="button"
                        onClick={() => setColor(c.colorCode)}
                        style={{ backgroundColor: c.colorCode }}
                        className={`w-8 h-8 rounded-full border cursor-pointer transition-transform duration-200 ${
                          color === c.colorCode 
                            ? 'border-[#1A1A1A] dark:border-[#FAF8F5] scale-110 shadow-md ring-2 ring-[#1A1A1A]/20 dark:ring-[#FAF8F5]/20' 
                            : 'border-[#E5E2DA] dark:border-[#2D2A24] hover:scale-105 shadow-sm'
                        }`}
                        title={`${c.name} Paper`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-[#8C887D] dark:text-[#7A756B] uppercase tracking-wider mb-1.5">Note Typography</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {FONT_FAMILIES.map((f) => (
                      <button
                        id={`font-picker-${f.id}`}
                        key={f.id}
                        type="button"
                        onClick={() => setFontFamily(f.id as any)}
                        className={`py-1.5 px-2.5 text-xs font-medium rounded border cursor-pointer transition-all ${
                          fontFamily === f.id
                            ? 'bg-[#1A1A1A] dark:bg-[#FAF8F5] text-white dark:text-[#121211] border-[#1A1A1A] dark:border-[#FAF8F5] shadow-sm font-semibold'
                            : 'bg-white dark:bg-[#1E1C18] text-[#5C5850] dark:text-[#BEB9AD] border-[#E5E2DA] dark:border-[#2D2A24] hover:bg-[#F4F1EA] dark:hover:bg-[#2D2A24]'
                        }`}
                      >
                        <span className={f.id === 'handwritten' ? 'font-handwritten text-sm' : ''}>{f.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5 border-t border-[#E5E2DA] dark:border-[#2D2A24] pt-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-[9px] font-bold text-[#8C887D] dark:text-[#7A756B] uppercase tracking-wider">
                      Labels & Tags
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowLabelManager(!showLabelManager)}
                      className="text-[9px] font-bold text-[#1A1A1A] dark:text-[#FAF8F5] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Tag size={10} /> {showLabelManager ? 'Close Manager' : 'Manage Custom Labels'}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-white dark:bg-[#25231F] border border-[#E5E2DA] dark:border-[#2D2A24] rounded items-center">
                    {selectedLabelIds.length === 0 ? (
                      <span className="text-[10px] text-[#8C887D] dark:text-[#7A756B] italic pl-1">No labels assigned. Click labels below to assign.</span>
                    ) : (
                      selectedLabelIds.map(id => {
                        const lbl = projectLabels.find(l => l.id === id);
                        if (!lbl) return null;
                        return (
                          <span
                            key={id}
                            style={{ backgroundColor: lbl.color }}
                            className="px-2.5 py-0.5 text-[9px] font-bold text-stone-900 rounded-full flex items-center gap-1 border border-black/5"
                          >
                            {lbl.name}
                            <button
                              type="button"
                              onClick={() => handleToggleLabel(id)}
                              className="hover:bg-black/10 rounded-full w-3.5 h-3.5 flex items-center justify-center cursor-pointer font-bold text-[8px]"
                            >
                              ×
                            </button>
                          </span>
                        );
                      })
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {projectLabels.map(lbl => {
                      const isSelected = selectedLabelIds.includes(lbl.id);
                      return (
                        <button
                          key={lbl.id}
                          type="button"
                          onClick={() => handleToggleLabel(lbl.id)}
                          style={{ backgroundColor: isSelected ? lbl.color : 'transparent' }}
                          className={`px-3 py-1 text-[10px] font-bold rounded-full border cursor-pointer transition-all ${
                            isSelected 
                              ? 'text-stone-900 border-transparent shadow-sm scale-102 ring-1 ring-black/10' 
                              : 'text-[#5C5850] dark:text-[#BEB9AD] bg-white dark:bg-[#1C1B17] border-[#E5E2DA] dark:border-[#2D2A24] hover:bg-[#F4F1EA] dark:hover:bg-[#2D2A24]'
                          }`}
                        >
                          {isSelected ? '✓ ' : ''}{lbl.name}
                        </button>
                      );
                    })}
                  </div>

                  {showLabelManager && (
                    <div className="p-3.5 bg-[#F4F1EA]/50 dark:bg-[#25231F]/30 border border-dashed border-[#C5C2B9] dark:border-[#4D483E] rounded space-y-3 mt-2">
                      <h4 className="text-[10px] font-bold text-[#1A1A1A] dark:text-[#FAF8F5] uppercase tracking-wider flex items-center gap-1">
                        Create or Remove Custom Labels
                      </h4>
                      <div className="flex flex-wrap gap-2 pb-2 border-b border-[#E5E2DA] dark:border-[#2D2A24]">
                        {projectLabels.map(lbl => (
                          <div 
                            key={lbl.id} 
                            className="flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded border bg-white dark:bg-[#1E1C18] border-[#E5E2DA] dark:border-[#2D2A24] text-[10px]"
                          >
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: lbl.color }} />
                            <span className="font-semibold text-[#1A1A1A] dark:text-[#FAF8F5] truncate max-w-[100px]">{lbl.name}</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteProjectLabel(lbl.id)}
                              className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-[#8C887D] dark:text-[#BEB9AD] hover:text-rose-600 rounded cursor-pointer transition-colors"
                              title="Delete Label from Project"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col sm:flex-row items-end gap-3 pt-1">
                        <div className="flex-1 space-y-1 w-full">
                          <span className="block text-[8px] font-bold text-[#8C887D] dark:text-[#7A756B] uppercase">Label Name</span>
                          <input
                            type="text"
                            value={newLabelName}
                            onChange={(e) => setNewLabelName(e.target.value)}
                            placeholder="e.g. Bug, Feature, Urgent"
                            className="w-full text-xs border border-[#E5E2DA] dark:border-[#2D2A24] rounded px-2.5 py-1.5 bg-white dark:bg-[#25231F] text-[#1A1A1A] dark:text-[#FAF8F5] focus:outline-none focus:border-[#1A1A1A] dark:focus:border-[#FAF8F5]"
                            maxLength={18}
                          />
                        </div>
                        <div className="space-y-1 shrink-0">
                          <span className="block text-[8px] font-bold text-[#8C887D] dark:text-[#7A756B] uppercase">Select Color</span>
                          <div className="flex gap-1.5 py-1">
                            {LABEL_COLOR_PRESETS.map(preset => (
                              <button
                                key={preset.name}
                                type="button"
                                onClick={() => setNewLabelColor(preset.color)}
                                style={{ backgroundColor: preset.color }}
                                className={`w-5 h-5 rounded-full border cursor-pointer transition-transform ${
                                  newLabelColor === preset.color 
                                    ? 'border-[#1A1A1A] dark:border-[#FAF8F5] scale-110 shadow-xs ring-1 ring-[#1A1A1A]/35' 
                                    : 'border-[#E5E2DA] dark:border-[#2D2A24] hover:scale-105'
                                }`}
                                title={preset.name}
                              />
                            ))}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleCreateProjectLabel}
                          className="w-full sm:w-auto px-4 py-1.5 bg-[#1A1A1A] dark:bg-[#FAF8F5] hover:bg-[#2E2E2E] dark:hover:bg-[#D6D3C9] text-white dark:text-[#121211] text-xs font-bold rounded cursor-pointer shrink-0 shadow-sm transition-all"
                        >
                          Add Label
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-[#E5E2DA] dark:border-[#2D2A24] pt-4">
                  <div>
                    <label className="block text-[9px] font-bold text-[#8C887D] dark:text-[#7A756B] uppercase tracking-wider mb-1.5">Priority Level</label>
                    <div className="flex flex-col gap-1.5">
                      {(['low', 'medium', 'high'] as const).map((p) => (
                        <button
                          id={`priority-btn-${p}`}
                          key={p}
                          type="button"
                          onClick={() => setPriority(p)}
                          className={`py-1.5 px-3 text-xs font-semibold rounded border text-left cursor-pointer transition-all ${
                            priority === p
                              ? 'bg-[#1A1A1A] dark:bg-[#FAF8F5] text-white dark:text-[#121211] border-[#1A1A1A] dark:border-[#FAF8F5] shadow-sm'
                              : 'bg-white dark:bg-[#1E1C18] text-[#5C5850] dark:text-[#BEB9AD] border-[#E5E2DA] dark:border-[#2D2A24] hover:bg-[#F4F1EA] dark:hover:bg-[#2D2A24]'
                          }`}
                        >
                          <span className="capitalize">{p}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-[#8C887D] dark:text-[#7A756B] uppercase tracking-wider mb-1.5">Due Date</label>
                    <div className="relative">
                      <input
                        id="sticky-dueDate-input"
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full text-xs border border-[#E5E2DA] dark:border-[#2D2A24] rounded px-2.5 py-1.5 bg-white dark:bg-[#25231F] text-[#1A1A1A] dark:text-[#FAF8F5] focus:outline-none focus:border-[#1A1A1A] dark:focus:border-[#FAF8F5] cursor-pointer shadow-sm"
                      />
                      {dueDate && (
                        <button
                          type="button"
                          onClick={() => setDueDate('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C887D] dark:text-[#BEB9AD] hover:text-[#1A1A1A] dark:hover:text-[#FAF8F5] text-[10px] cursor-pointer font-bold"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-[#8C887D] dark:text-[#7A756B] uppercase tracking-wider mb-1.5">Assign Task</label>
                    <div className="space-y-1.5">
                      <select
                        id="sticky-assignee-select"
                        value={assignee ? assignee.name : ''}
                        onChange={(e) => {
                          const selectedName = e.target.value;
                          if (!selectedName) {
                            setAssignee(null);
                          } else {
                            const match = allAvailableAssignees.find(c => c.name === selectedName);
                            if (match) {
                              setAssignee(match);
                            }
                          }
                        }}
                        className="w-full text-xs border border-[#E5E2DA] dark:border-[#2D2A24] rounded px-2.5 py-1.5 bg-white dark:bg-[#25231F] text-[#1A1A1A] dark:text-[#FAF8F5] focus:outline-none focus:border-[#1A1A1A] dark:focus:border-[#FAF8F5] cursor-pointer shadow-sm"
                      >
                        <option value="">Unassigned</option>
                        {allAvailableAssignees.map(collab => (
                          <option key={collab.name} value={collab.name}>
                            {collab.name} {collab.name === currentUserProfile.name ? '(You)' : ''}
                          </option>
                        ))}
                      </select>

                      {assignee && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-[#F4F1EA] dark:bg-[#25231F] rounded border border-[#E5E2DA] dark:border-[#2D2A24]">
                          <div 
                            className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold"
                            style={{ backgroundColor: assignee.color }}
                          >
                            {assignee.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-[10px] font-medium text-[#5C5850] dark:text-[#BEB9AD] truncate max-w-[120px]">
                            {assignee.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                <div className="flex items-center justify-between border-t border-[#E5E2DA] dark:border-[#2D2A24] pt-4">
                  {task ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#8C887D] dark:text-[#7A756B] uppercase tracking-wider">Status:</span>
                      <select
                        id="sticky-status-select"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as any)}
                        className="text-xs bg-[#FAF8F5] dark:bg-[#1E1C18] border border-[#E5E2DA] dark:border-[#2D2A24] rounded px-2 py-1 font-medium text-[#1A1A1A] dark:text-[#FAF8F5] cursor-pointer focus:outline-none focus:border-[#1A1A1A] dark:focus:border-[#FAF8F5]"
                      >
                        <option value="todo">To Do</option>
                        <option value="progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                  ) : (
                    <div className="text-[10px] text-[#8C887D] dark:text-[#7A756B] italic">Sticky will land on the "To Do" stack</div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-3.5 py-1.5 text-xs font-semibold text-[#5C5850] dark:text-[#BEB9AD] hover:text-[#1A1A1A] dark:hover:text-[#FAF8F5] hover:bg-[#FAF8F5] dark:hover:bg-[#2D2A24] rounded cursor-pointer"
                    >
                      Discard
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-bold bg-[#1A1A1A] dark:bg-[#FAF8F5] hover:bg-[#2E2E2E] dark:hover:bg-[#D6D3C9] text-white dark:text-[#121211] rounded shadow-sm cursor-pointer"
                    >
                      Pin to Board
                    </button>
                  </div>
                </div>
              </form>

              <div className="w-full md:w-80 bg-[#E5E2DA]/50 dark:bg-[#1E1C18]/40 p-6 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-[#E5E2DA] dark:border-[#2D2A24] transition-colors duration-200">
                <div className="text-[10px] font-mono font-bold text-[#8C887D] dark:text-[#7A756B] uppercase tracking-widest mb-4 flex items-center gap-1">
                  <Info size={11} /> Paper Sticky Live Preview
                </div>

                <div
                  className="w-64 aspect-square p-5 pt-7 rounded-sm shadow-lg border relative transition-colors duration-300 rotate-1"
                  style={{ 
                    backgroundColor: color,
                    borderColor: STICKY_COLORS.find(c => c.colorCode === color)?.borderClass || '#e5e7eb'
                  }}
                >
                  <div 
                    className="absolute top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full z-20 flex items-center justify-center shadow-md border"
                    style={{
                      backgroundColor: 
                        priority === 'high' ? '#f43f5e' : 
                        priority === 'medium' ? '#f59e0b' : '#3b82f6',
                      borderColor: 
                        priority === 'high' ? '#be123c' : 
                        priority === 'medium' ? '#b45309' : '#1d4ed8'
                    }}
                  >
                    <div className="w-1 h-1 bg-white/60 rounded-full absolute top-0.5 left-0.5" />
                  </div>
                  <div className="absolute top-4 left-1/2 -translate-x-[20%] w-0.5 h-2.5 bg-stone-900/40 rounded-full blur-[0.5px] z-10 transform rotate-12" />

                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-gradient-to-br from-black/5 to-black/15 pointer-events-none rounded-tl-md rounded-br-sm" />

                  <div className="h-full flex flex-col justify-between text-stone-800">
                    <div className="space-y-1.5">
                      <h4 className="font-serif font-bold text-xs tracking-tight truncate">
                        {title || 'Sticky Title'}
                      </h4>

                      {selectedLabelIds.length > 0 && (
                        <div className="flex flex-wrap gap-1 py-0.5 max-h-[36px] overflow-hidden">
                          {selectedLabelIds.map(id => {
                            const lbl = projectLabels.find(l => l.id === id);
                            if (!lbl) return null;
                            return (
                              <span 
                                key={id}
                                style={{ backgroundColor: lbl.color }}
                                className="px-1.5 py-0.2 text-[7px] font-bold text-stone-900 rounded-full border border-black/5"
                              >
                                {lbl.name}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      <p className={`${previewFontClass} leading-snug line-clamp-4 max-h-[85px] overflow-y-auto break-words`}>
                        {content || 'Your sticky scribbles will appear here in real-time as you type...'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-stone-900/10 pt-1.5 text-[9px] font-mono text-stone-500">
                      <span className="flex items-center gap-0.5 bg-stone-900/5 px-1.5 py-0.5 rounded-full">
                        <Calendar size={8} /> {dueDate ? dueDate.split('-').slice(1).join('/') : 'No date'}
                      </span>

                      {assignee ? (
                        <div 
                          className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold border border-black/10"
                          style={{ backgroundColor: assignee.color }}
                        >
                          {assignee.name.charAt(0).toUpperCase()}
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full flex items-center justify-center bg-stone-900/5 text-stone-400 border border-dashed border-stone-300">
                          <User size={8} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
