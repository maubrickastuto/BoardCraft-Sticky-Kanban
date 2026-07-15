import React, { useState } from 'react';
import { 
  Briefcase, 
  User, 
  Plus, 
  Trash2, 
  Folder, 
  FolderOpen, 
  Users, 
  ChevronRight, 
  ChevronDown,
  X,
  FileText,
  Sun,
  Moon,
  Download,
  LogOut
} from 'lucide-react';
import { Workspace, Project, UserProfile } from '../types';
import UserProfileHeader from './UserProfileHeader';

interface SidebarProps {
  workspaces: Workspace[];
  projects: Project[];
  activeWorkspaceId: string | null;
  activeProjectId: string | null;
  onSelectWorkspace: (workspaceId: string) => void;
  onSelectProject: (projectId: string) => void;
  onCreateWorkspace: (name: string, type: 'personal' | 'work') => void;
  onCreateProject: (workspaceId: string, name: string, description: string, isCollaborated: boolean) => void;
  onDeleteWorkspace: (workspaceId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onRenameWorkspace: (workspaceId: string, name: string) => void;
  onRenameProject: (projectId: string, name: string) => void;
  onExportProject?: (projectId: string) => void;
  userProfile: UserProfile;
  onProfileChange: (profile: UserProfile) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout?: () => void;
  className?: string;
  onCloseSidebar?: () => void;
}

export default function Sidebar({
  workspaces,
  projects,
  activeWorkspaceId,
  activeProjectId,
  onSelectWorkspace,
  onSelectProject,
  onCreateWorkspace,
  onCreateProject,
  onDeleteWorkspace,
  onDeleteProject,
  onRenameWorkspace,
  onRenameProject,
  onExportProject,
  userProfile,
  onProfileChange,
  isDarkMode,
  onToggleDarkMode,
  onLogout,
  className,
  onCloseSidebar
}: SidebarProps) {
  const [showAddWorkspace, setShowAddWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceType, setNewWorkspaceType] = useState<'personal' | 'work'>('personal');

  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectCollab, setNewProjectCollab] = useState(false);

  const [deleteWorkspaceId, setDeleteWorkspaceId] = useState<string | null>(null);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);

  const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(null);
  const [editingWorkspaceName, setEditingWorkspaceName] = useState('');

  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');

  const handleRenameWorkspaceSubmit = (workspaceId: string) => {
    if (editingWorkspaceName.trim()) {
      onRenameWorkspace(workspaceId, editingWorkspaceName.trim());
    }
    setEditingWorkspaceId(null);
  };

  const handleRenameProjectSubmit = (projectId: string) => {
    if (editingProjectName.trim()) {
      onRenameProject(projectId, editingProjectName.trim());
    }
    setEditingProjectId(null);
  };

  const personalWorkspaces = workspaces.filter(w => w.type === 'personal');
  const workWorkspaces = workspaces.filter(w => w.type === 'work');

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    onCreateWorkspace(newWorkspaceName.trim(), newWorkspaceType);
    setNewWorkspaceName('');
    setShowAddWorkspace(false);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !activeWorkspaceId) return;
    onCreateProject(activeWorkspaceId, newProjectName.trim(), newProjectDesc.trim(), newProjectCollab);
    setNewProjectName('');
    setNewProjectDesc('');
    setNewProjectCollab(false);
    setShowAddProject(false);
  };

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
  const activeWorkspaceProjects = projects.filter(p => p.workspaceId === activeWorkspaceId);

  return (
    <aside 
      id="app-sidebar" 
      className={`w-80 h-screen bg-[#F4F1EA] dark:bg-[#161512] border-r border-[#E5E2DA] dark:border-[#2D2A24] flex flex-col justify-between select-none transition-all duration-300 overflow-hidden shrink-0 ${className || ''}`}
    >
      <div className="p-5 border-b border-[#E5E2DA] dark:border-[#2D2A24] flex flex-col gap-3 min-w-[320px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#1A1A1A] dark:bg-[#FAF8F5]" />
            <h1 className="text-sm font-serif tracking-widest text-[#1A1A1A] dark:text-[#FAF8F5] uppercase">Sticky Kanban</h1>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggleDarkMode}
              className="p-1 hover:bg-[#E5E2DA] dark:hover:bg-[#2D2A24] rounded text-[#5C5850] dark:text-[#BEB9AD] hover:text-[#1A1A1A] dark:hover:text-[#FAF8F5] transition-all cursor-pointer"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            {onCloseSidebar && (
              <button
                id="mobile-sidebar-close-btn"
                onClick={onCloseSidebar}
                className="p-1 hover:bg-[#E5E2DA] dark:hover:bg-[#2D2A24] rounded text-[#5C5850] dark:text-[#BEB9AD] hover:text-[#1A1A1A] dark:hover:text-[#FAF8F5] transition-all cursor-pointer"
                title="Close Sidebar"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
        <UserProfileHeader profile={userProfile} onProfileChange={onProfileChange} />
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 min-w-[320px]">
        <div>
          <div className="flex items-center justify-between mb-3 pb-1 border-b border-[#E5E2DA]/60 dark:border-[#2D2A24]/60">
            <span className="text-[10px] font-bold text-[#8C887D] dark:text-[#7A756B] uppercase tracking-[0.2em] font-sans">Workspaces</span>
            <button
              id="show-add-workspace-btn"
              onClick={() => setShowAddWorkspace(!showAddWorkspace)}
              className="p-1 hover:bg-[#E5E2DA] dark:hover:bg-[#2D2A24] rounded text-[#5C5850] dark:text-[#BEB9AD] hover:text-[#1A1A1A] dark:hover:text-[#FAF8F5] transition-all cursor-pointer"
              title="Add Workspace"
            >
              <Plus size={14} />
            </button>
          </div>

          {showAddWorkspace && (
            <form onSubmit={handleCreateWorkspace} className="bg-[#F9F7F2] dark:bg-[#1C1B17] p-4 rounded-lg border border-[#E5E2DA] dark:border-[#2D2A24] shadow-sm mb-4 space-y-3">
              <div>
                <label className="block text-[9px] font-bold text-[#8C887D] dark:text-[#7A756B] uppercase tracking-wider mb-1">Workspace Name</label>
                <input
                  id="new-workspace-name"
                  type="text"
                  placeholder="e.g. Life Planning"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  className="w-full text-xs border border-[#E5E2DA] dark:border-[#2D2A24] rounded px-2.5 py-1.5 focus:outline-none focus:border-[#1A1A1A] dark:focus:border-[#FAF8F5] bg-white dark:bg-[#25231F] text-[#1A1A1A] dark:text-[#FAF8F5]"
                  maxLength={25}
                  required
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-[#8C887D] dark:text-[#7A756B] uppercase tracking-wider mb-1">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewWorkspaceType('personal')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-medium rounded border cursor-pointer transition-all ${
                      newWorkspaceType === 'personal'
                        ? 'bg-[#1A1A1A] dark:bg-[#FAF8F5] text-white dark:text-[#121211] border-[#1A1A1A] dark:border-[#FAF8F5]'
                        : 'bg-white dark:bg-[#1E1C18] text-[#5C5850] dark:text-[#BEB9AD] border-[#E5E2DA] dark:border-[#2D2A24] hover:bg-[#F4F1EA] dark:hover:bg-[#2D2A24]'
                    }`}
                  >
                    <User size={12} /> Personal
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewWorkspaceType('work')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-medium rounded border cursor-pointer transition-all ${
                      newWorkspaceType === 'work'
                        ? 'bg-[#1A1A1A] dark:bg-[#FAF8F5] text-white dark:text-[#121211] border-[#1A1A1A] dark:border-[#FAF8F5]'
                        : 'bg-white dark:bg-[#1E1C18] text-[#5C5850] dark:text-[#BEB9AD] border-[#E5E2DA] dark:border-[#2D2A24] hover:bg-[#F4F1EA] dark:hover:bg-[#2D2A24]'
                    }`}
                  >
                    <Briefcase size={12} /> Work
                  </button>
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddWorkspace(false)}
                  className="px-2.5 py-1 text-[10px] font-medium text-[#5C5850] dark:text-[#BEB9AD] hover:text-[#1A1A1A] dark:hover:text-[#FAF8F5] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1 text-[10px] font-bold bg-[#1A1A1A] dark:bg-[#FAF8F5] text-white dark:text-[#121211] rounded hover:bg-[#2E2E2E] dark:hover:bg-[#ECE8DF] cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {personalWorkspaces.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-[9px] font-bold text-[#8C887D] dark:text-[#7A756B] uppercase tracking-wider px-2 py-0.5">
                  <User size={10} /> Personal
                </div>
                {personalWorkspaces.map(ws => {
                  const isConfirming = deleteWorkspaceId === ws.id;
                  const isEditing = editingWorkspaceId === ws.id;
                  const isOwner = !ws.creatorId || ws.creatorId === userProfile.id;
                  return (
                    <div
                      key={ws.id}
                      className={`group flex items-center justify-between px-2.5 py-2 rounded text-xs font-medium cursor-pointer transition-all ${
                        activeWorkspaceId === ws.id
                          ? 'bg-[#E5E2DA] dark:bg-[#2D2A24] text-[#1A1A1A] dark:text-[#FAF8F5] font-medium'
                          : 'text-[#5C5850] dark:text-[#BEB9AD] hover:bg-[#E5E2DA]/30 dark:hover:bg-[#2D2A24]/30 hover:text-[#1A1A1A] dark:hover:text-[#FAF8F5]'
                      }`}
                      onClick={() => !isConfirming && !isEditing && onSelectWorkspace(ws.id)}
                      onDoubleClick={(e) => {
                        if (!isOwner) return;
                        e.stopPropagation();
                        setEditingWorkspaceId(ws.id);
                        setEditingWorkspaceName(ws.name);
                      }}
                      title={isOwner ? "Double click to rename" : undefined}
                    >
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingWorkspaceName}
                          onChange={(e) => setEditingWorkspaceName(e.target.value)}
                          onBlur={() => handleRenameWorkspaceSubmit(ws.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleRenameWorkspaceSubmit(ws.id);
                            } else if (e.key === 'Escape') {
                              setEditingWorkspaceId(null);
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full text-xs border border-[#1A1A1A] dark:border-[#FAF8F5] rounded px-1.5 py-0.5 bg-white dark:bg-[#25231F] text-[#1A1A1A] dark:text-[#FAF8F5] focus:outline-none"
                          maxLength={25}
                          autoFocus
                        />
                      ) : isConfirming ? (
                        <div className="flex items-center justify-between w-full" onClick={(e) => e.stopPropagation()}>
                          <span className="text-rose-600 dark:text-rose-400 font-semibold text-[11px] animate-pulse">Delete workspace?</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteWorkspace(ws.id);
                                setDeleteWorkspaceId(null);
                              }}
                              className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded-[3px] text-[10px] font-bold cursor-pointer"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteWorkspaceId(null);
                              }}
                              className="px-1.5 py-0.5 bg-[#D5D2C9] dark:bg-[#3D3930] hover:bg-[#C5C2B9] dark:hover:bg-[#4D483E] text-[#1A1A1A] dark:text-[#FAF8F5] rounded-[3px] text-[10px] cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <span className="truncate">{ws.name}</span>
                          {isOwner && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteWorkspaceId(ws.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-[#D5D2C9] dark:hover:bg-[#3D3930] rounded text-[#8C887D] dark:text-[#7A756B] hover:text-rose-600 dark:hover:text-rose-400 transition-all cursor-pointer"
                              title="Delete Workspace"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {workWorkspaces.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-[9px] font-bold text-[#8C887D] dark:text-[#7A756B] uppercase tracking-wider px-2 py-0.5">
                  <Briefcase size={10} /> Work
                </div>
                {workWorkspaces.map(ws => {
                  const isConfirming = deleteWorkspaceId === ws.id;
                  const isEditing = editingWorkspaceId === ws.id;
                  const isOwner = !ws.creatorId || ws.creatorId === userProfile.id;
                  return (
                    <div
                      key={ws.id}
                      className={`group flex items-center justify-between px-2.5 py-2 rounded text-xs font-medium cursor-pointer transition-all ${
                        activeWorkspaceId === ws.id
                          ? 'bg-[#E5E2DA] dark:bg-[#2D2A24] text-[#1A1A1A] dark:text-[#FAF8F5] font-medium'
                          : 'text-[#5C5850] dark:text-[#BEB9AD] hover:bg-[#E5E2DA]/30 dark:hover:bg-[#2D2A24]/30 hover:text-[#1A1A1A] dark:hover:text-[#FAF8F5]'
                      }`}
                      onClick={() => !isConfirming && !isEditing && onSelectWorkspace(ws.id)}
                      onDoubleClick={(e) => {
                        if (!isOwner) return;
                        e.stopPropagation();
                        setEditingWorkspaceId(ws.id);
                        setEditingWorkspaceName(ws.name);
                      }}
                      title={isOwner ? "Double click to rename" : undefined}
                    >
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingWorkspaceName}
                          onChange={(e) => setEditingWorkspaceName(e.target.value)}
                          onBlur={() => handleRenameWorkspaceSubmit(ws.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleRenameWorkspaceSubmit(ws.id);
                            } else if (e.key === 'Escape') {
                              setEditingWorkspaceId(null);
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full text-xs border border-[#1A1A1A] dark:border-[#FAF8F5] rounded px-1.5 py-0.5 bg-white dark:bg-[#25231F] text-[#1A1A1A] dark:text-[#FAF8F5] focus:outline-none"
                          maxLength={25}
                          autoFocus
                        />
                      ) : isConfirming ? (
                        <div className="flex items-center justify-between w-full" onClick={(e) => e.stopPropagation()}>
                          <span className="text-rose-600 dark:text-rose-400 font-semibold text-[11px] animate-pulse">Delete workspace?</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteWorkspace(ws.id);
                                setDeleteWorkspaceId(null);
                              }}
                              className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded-[3px] text-[10px] font-bold cursor-pointer"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteWorkspaceId(null);
                              }}
                              className="px-1.5 py-0.5 bg-[#D5D2C9] dark:bg-[#3D3930] hover:bg-[#C5C2B9] dark:hover:bg-[#4D483E] text-[#1A1A1A] dark:text-[#FAF8F5] rounded-[3px] text-[10px] cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <span className="truncate">{ws.name}</span>
                          {isOwner && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteWorkspaceId(ws.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-[#D5D2C9] dark:hover:bg-[#3D3930] rounded text-[#8C887D] dark:text-[#7A756B] hover:text-rose-600 dark:hover:text-rose-400 transition-all cursor-pointer"
                              title="Delete Workspace"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {activeWorkspace && (
          <div className="pt-4 border-t border-[#E5E2DA] dark:border-[#2D2A24]">
            <div className="flex items-center justify-between mb-3 pb-1 border-b border-[#E5E2DA]/60 dark:border-[#2D2A24]/60">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-[#8C887D] dark:text-[#7A756B] uppercase tracking-[0.2em] font-sans">Projects</span>
                <span className="text-[9px] font-medium text-[#8C887D] dark:text-[#7A756B] italic max-w-[150px] truncate">
                  in {activeWorkspace.name}
                </span>
              </div>
              <button
                id="show-add-project-btn"
                onClick={() => setShowAddProject(!showAddProject)}
                className="p-1 hover:bg-[#E5E2DA] dark:hover:bg-[#2D2A24] rounded text-[#5C5850] dark:text-[#BEB9AD] hover:text-[#1A1A1A] dark:hover:text-[#FAF8F5] transition-all cursor-pointer"
                title="Add Project"
              >
                <Plus size={14} />
              </button>
            </div>

            {showAddProject && (
              <form onSubmit={handleCreateProject} className="bg-[#F9F7F2] dark:bg-[#1C1B17] p-4 rounded-lg border border-[#E5E2DA] dark:border-[#2D2A24] shadow-sm mb-4 space-y-3">
                <div>
                  <label className="block text-[9px] font-bold text-[#8C887D] dark:text-[#7A756B] uppercase tracking-wider mb-1">Project Title</label>
                  <input
                    id="new-project-name"
                    type="text"
                    placeholder="e.g. 🏡 Cabin Renovation"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full text-xs border border-[#E5E2DA] dark:border-[#2D2A24] rounded px-2.5 py-1.5 focus:outline-none focus:border-[#1A1A1A] dark:focus:border-[#FAF8F5] bg-white dark:bg-[#25231F] text-[#1A1A1A] dark:text-[#FAF8F5]"
                    maxLength={30}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-[#8C887D] dark:text-[#7A756B] uppercase tracking-wider mb-1">Description</label>
                  <textarea
                    id="new-project-desc"
                    placeholder="A brief project focus..."
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    className="w-full text-xs border border-[#E5E2DA] dark:border-[#2D2A24] rounded px-2.5 py-1.5 focus:outline-none focus:border-[#1A1A1A] dark:focus:border-[#FAF8F5] bg-white dark:bg-[#25231F] text-[#1A1A1A] dark:text-[#FAF8F5] resize-none h-12"
                    maxLength={100}
                  />
                </div>
                <div className="flex items-center justify-between py-1.5 bg-[#F4F1EA] dark:bg-[#25231F] rounded px-2 border border-[#E5E2DA]/50 dark:border-[#2D2A24]/50">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-[#1A1A1A] dark:text-[#FAF8F5]">Real-time Collaboration</span>
                    <span className="text-[9px] text-[#8C887D] dark:text-[#7A756B]">Allow workspace members to join</span>
                  </div>
                  <input
                    id="new-project-collab-checkbox"
                    type="checkbox"
                    checked={newProjectCollab}
                    onChange={(e) => setNewProjectCollab(e.target.checked)}
                    className="w-3.5 h-3.5 text-[#1A1A1A] dark:text-[#FAF8F5] accent-[#1A1A1A] dark:accent-[#FAF8F5] border-[#E5E2DA] dark:border-[#2D2A24] rounded focus:ring-0 cursor-pointer"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddProject(false)}
                    className="px-2.5 py-1 text-[10px] font-medium text-[#5C5850] dark:text-[#BEB9AD] hover:text-[#1A1A1A] dark:hover:text-[#FAF8F5] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1 text-[10px] font-bold bg-[#1A1A1A] dark:bg-[#FAF8F5] text-white dark:text-[#121211] rounded hover:bg-[#2E2E2E] dark:hover:bg-[#ECE8DF] cursor-pointer"
                  >
                    Add Project
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-1">
              {activeWorkspaceProjects.length === 0 ? (
                <div className="text-[11px] text-[#8C887D] dark:text-[#7A756B] italic px-2.5 py-2">
                  No projects. Click '+' to start.
                </div>
              ) : (
                activeWorkspaceProjects.map(p => {
                  const isActive = activeProjectId === p.id;
                  const isConfirming = deleteProjectId === p.id;
                  const isEditing = editingProjectId === p.id;
                  const isOwner = !p.creatorId || p.creatorId === userProfile.id;
                  return (
                    <div
                      key={p.id}
                      className={`group flex items-center justify-between px-2.5 py-2 rounded text-xs font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#E5E2DA] dark:bg-[#2D2A24] text-[#1A1A1A] dark:text-[#FAF8F5] font-semibold'
                          : 'text-[#5C5850] dark:text-[#BEB9AD] hover:bg-[#E5E2DA]/30 dark:hover:bg-[#2D2A24]/30 hover:text-[#1A1A1A] dark:hover:text-[#FAF8F5]'
                      }`}
                      onClick={() => !isConfirming && !isEditing && onSelectProject(p.id)}
                      onDoubleClick={(e) => {
                        if (!isOwner) return;
                        e.stopPropagation();
                        setEditingProjectId(p.id);
                        setEditingProjectName(p.name);
                      }}
                      title={isOwner ? "Double click to rename" : undefined}
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-2 w-full" onClick={(e) => e.stopPropagation()}>
                          {isActive ? (
                            <FolderOpen size={14} className="text-[#1A1A1A] dark:text-[#FAF8F5] shrink-0" />
                          ) : (
                            <Folder size={14} className="text-[#8C887D] dark:text-[#7A756B] shrink-0" />
                          )}
                          <input
                            type="text"
                            value={editingProjectName}
                            onChange={(e) => setEditingProjectName(e.target.value)}
                            onBlur={() => handleRenameProjectSubmit(p.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleRenameProjectSubmit(p.id);
                              } else if (e.key === 'Escape') {
                                setEditingProjectId(null);
                              }
                            }}
                            className="w-full text-xs font-serif border border-[#1A1A1A] dark:border-[#FAF8F5] rounded px-1.5 py-0.5 bg-white dark:bg-[#25231F] text-[#1A1A1A] dark:text-[#FAF8F5] focus:outline-none"
                            maxLength={30}
                            autoFocus
                          />
                        </div>
                      ) : isConfirming ? (
                        <div className="flex items-center justify-between w-full" onClick={(e) => e.stopPropagation()}>
                          <span className="text-rose-600 dark:text-rose-400 font-semibold text-[11px] animate-pulse">Delete project?</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteProject(p.id);
                                setDeleteProjectId(null);
                              }}
                              className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded-[3px] text-[10px] font-bold cursor-pointer"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteProjectId(null);
                              }}
                              className="px-1.5 py-0.5 bg-[#D5D2C9] dark:bg-[#3D3930] hover:bg-[#C5C2B9] dark:hover:bg-[#4D483E] text-[#1A1A1A] dark:text-[#FAF8F5] rounded-[3px] text-[10px] cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {isActive ? (
                              <FolderOpen size={14} className="text-[#1A1A1A] dark:text-[#FAF8F5] shrink-0" />
                            ) : (
                              <Folder size={14} className="text-[#8C887D] dark:text-[#7A756B] shrink-0" />
                            )}
                            <span className="truncate font-serif text-[13px]">{p.name}</span>
                            {p.isCollaborated && (
                              <Users size={11} className="text-[#1A1A1A] dark:text-[#FAF8F5] shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150 shrink-0">
                            {onExportProject && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onExportProject(p.id);
                                }}
                                className="p-0.5 hover:bg-[#D5D2C9] dark:hover:bg-[#3D3930] rounded text-[#8C887D] dark:text-[#7A756B] hover:text-[#1A1A1A] dark:hover:text-[#FAF8F5] transition-all cursor-pointer"
                                title="Export Project JSON"
                              >
                                <Download size={11} />
                              </button>
                            )}
                            {isOwner && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteProjectId(p.id);
                                }}
                                className="p-0.5 hover:bg-[#D5D2C9] dark:hover:bg-[#3D3930] rounded text-[#8C887D] dark:text-[#7A756B] hover:text-rose-600 dark:hover:text-rose-400 transition-all cursor-pointer"
                                title="Delete Project"
                              >
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

      </div>

      <div className="shrink-0 p-4 border-t border-[#E5E2DA] dark:border-[#2D2A24] bg-[#ECE9DF] dark:bg-[#1C1B17] min-w-[320px]">
        <div className="flex items-center justify-between text-[10px] font-mono text-[#8C887D] dark:text-[#7A756B]">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A] dark:bg-[#FAF8F5]" />
            <span>{workspaces.length} Workspaces</span>
          </div>
          <span>{projects.length} Projects</span>
        </div>

        {onLogout && (
          <button
            id="sidebar-sign-out-btn"
            onClick={onLogout}
            className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-[10px] uppercase tracking-wider font-bold rounded-lg border border-[#E5E2DA] dark:border-[#2D2A24] text-[#8C887D] dark:text-[#7A756B] hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
          >
            <LogOut size={13} />
            Sign Out
          </button>
        )}
      </div>
    </aside>
  );
}
