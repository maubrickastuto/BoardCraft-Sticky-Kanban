import { useState, useEffect, useRef, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users2, 
  MessageSquare, 
  UserPlus, 
  CheckSquare, 
  Send, 
  X, 
  Check, 
  Copy, 
  AlertCircle,
  HelpCircle,
  Bell
} from 'lucide-react';
import { 
  Workspace, 
  Project, 
  Task, 
  UserProfile, 
  ChatMessage, 
  PresenceUser, 
  Collaborator,
  AppNotification
} from '../types';
import { 
  updateUserPresence,
  subscribePresence, 
  sendChatMessage, 
  subscribeChats, 
  inviteUserToWorkspace,
  sendEmailInvitation,
  updateTask,
  createTask,
  createActivityLog,
  subscribeWorkspaceMembers,
  kickUserFromWorkspace,
  createNotification
} from '../firebaseDataService';

interface FloatingCollabOrbProps {
  activeWorkspace: Workspace | null;
  activeProject: Project | null;
  tasks: Task[];
  userProfile: UserProfile;
  isSidebarOpen?: boolean;
  notifications?: AppNotification[];
  onMarkNotificationRead?: (id: string) => void;
  onMarkNotificationUnread?: (id: string) => void;
  onMarkAllNotificationsRead?: (userId: string) => void;
  onDeleteNotification?: (id: string) => void;
  onDeleteAllNotifications?: (userId: string) => void;
  onOpenTaskPreview?: (taskId: string) => void;
}

export default function FloatingCollabOrb({ 
  activeWorkspace, 
  activeProject, 
  tasks, 
  userProfile,
  isSidebarOpen = false,
  notifications = [],
  onMarkNotificationRead,
  onMarkNotificationUnread,
  onMarkAllNotificationsRead,
  onDeleteNotification,
  onDeleteAllNotifications,
  onOpenTaskPreview
}: FloatingCollabOrbProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'online' | 'chat' | 'invite' | 'assign' | 'notifs'>('online');
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<UserProfile[]>([]);

  const [chatInput, setChatInput] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [pasteLink, setPasteLink] = useState('');
  const [pasteSuccess, setPasteSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [selectedCollabNames, setSelectedCollabNames] = useState<string[]>([]);
  const [assignSuccess, setAssignSuccess] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const constraintsRef = useRef<HTMLDivElement>(null);

  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [panelPosition, setPanelPosition] = useState<{
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'right';
  }>({ vertical: 'bottom', horizontal: 'right' });

  const updatePanelPosition = () => {
    if (!orbRef.current) return;
    const rect = orbRef.current.getBoundingClientRect();
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    const buttonCenterY = rect.top + rect.height / 2;
    const vertical = buttonCenterY < screenHeight / 2 ? 'top' : 'bottom';

    const buttonCenterX = rect.left + rect.width / 2;
    const horizontal = buttonCenterX < screenWidth / 2 ? 'left' : 'right';

    setPanelPosition({ vertical, horizontal });
  };

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      updatePanelPosition();
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(updatePanelPosition, 20);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!userProfile.id) return;

    updateUserPresence(
      userProfile.id,
      userProfile.name,
      userProfile.color,
      activeProject ? activeProject.id : null
    );

    const interval = setInterval(() => {
      updateUserPresence(
        userProfile.id,
        userProfile.name,
        userProfile.color,
        activeProject ? activeProject.id : null
      );
    }, 8000);

    const unsubPresence = subscribePresence((users) => {
      setPresenceUsers(users);
    });

    return () => {
      clearInterval(interval);
      unsubPresence();
    };
  }, [userProfile, activeProject]);

  useEffect(() => {
    if (!activeWorkspace) {
      setWorkspaceMembers([]);
      return;
    }

    const memberIds = [activeWorkspace.creatorId, ...(activeWorkspace.invitedUsers || [])];
    const unsubMembers = subscribeWorkspaceMembers(memberIds, (members) => {
      setWorkspaceMembers(members);
    });
    return () => unsubMembers();
  }, [activeWorkspace]);

  useEffect(() => {
    if (!activeProject) {
      setChatMessages([]);
      return;
    }

    const unsubChats = subscribeChats(activeProject.id, (messages) => {
      setChatMessages(messages);
    });

    return () => {
      unsubChats();
    };
  }, [activeProject]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isOpen, activeTab]);

  if (!activeProject || !activeWorkspace) return null;

  const getProjectCollaborators = (): Collaborator[] => {
    const list: Collaborator[] = [];

    presenceUsers.forEach(u => {
      if (u.activeProjectId === activeProject.id && u.id !== userProfile.id) {
        list.push({ name: u.name, color: u.color });
      }
    });

    if (activeProject.isCollaborated) {
      activeProject.collaborators.forEach(simCollab => {
        if (!list.some(c => c.name === simCollab.name)) {
          list.push(simCollab);
        }
      });
    }

    return list;
  };

  const projectCollabs = getProjectCollaborators();
  const totalOnlineCount = projectCollabs.length + 1;

  const handleSendChat = async (e: FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const msg = await sendChatMessage(
      activeProject.id,
      userProfile.id,
      userProfile.name,
      userProfile.color,
      chatInput.trim()
    );

    workspaceMembers.forEach(member => {
      if (member.id !== userProfile.id) {

        const mentionsFull = chatInput.toLowerCase().includes(`@${member.name.toLowerCase()}`);
        const mentionsNoSpace = chatInput.toLowerCase().includes(`@${member.name.toLowerCase().replace(/\s+/g, '')}`);
        if (mentionsFull || mentionsNoSpace) {
          createNotification({
            userId: member.id,
            projectId: activeProject.id,
            type: 'mention',
            messageId: msg.id,
            senderName: userProfile.name,
            text: chatInput.trim()
          });
        }
      }
    });

    setChatInput('');
  };

  const handleDirectInvite = async (e: FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) return;

    await sendEmailInvitation(activeWorkspace.id, activeWorkspace.name, userProfile.name, inviteEmail.trim());
    setInviteEmail('');
    setInviteSuccess(true);
    setTimeout(() => setInviteSuccess(false), 3000);
  };

  const handlePasteLink = async (e: FormEvent) => {
    e.preventDefault();
    if (!pasteLink.trim()) return;

    let workspaceId = pasteLink.trim();
    if (workspaceId.includes('?invite=')) {
      try {
        const url = new URL(workspaceId);
        workspaceId = url.searchParams.get('invite') || workspaceId;
      } catch (e) {

      }
    }

    await inviteUserToWorkspace(workspaceId, userProfile.id);
    await inviteUserToWorkspace(workspaceId, userProfile.name);
    setPasteLink('');
    setPasteSuccess(true);
    setTimeout(() => setPasteSuccess(false), 3000);
  };

  const handleCopyLink = () => {
    const inviteLink = `${window.location.origin}${window.location.pathname}?invite=${activeWorkspace.id}`;
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleAssignTasks = async () => {
    if (selectedTaskIds.length === 0 || selectedCollabNames.length === 0) return;

    const collabsToAssign = projectCollabs.filter(c => selectedCollabNames.includes(c.name));
    if (collabsToAssign.length === 0) return;

    for (const taskId of selectedTaskIds) {
      const baseTask = tasks.find(t => t.id === taskId);
      if (!baseTask) continue;

      const firstCollab = collabsToAssign[0];
      await updateTask(taskId, { assignee: firstCollab });

      await createActivityLog({
        projectId: activeProject.id,
        taskId: taskId,
        taskTitle: baseTask.title,
        userName: userProfile.name,
        userColor: userProfile.color,
        type: 'assignee_change',
        details: `assigned task "${baseTask.title}" to ${firstCollab.name}`
      });

      const firstMember = workspaceMembers.find(m => m.name === firstCollab.name);
      if (firstMember && firstMember.id !== userProfile.id) {
        createNotification({
          userId: firstMember.id,
          projectId: activeProject.id,
          type: 'assignment',
          senderName: userProfile.name,
          text: `assigned you to task: ${baseTask.title}`,
          taskId: taskId
        });
      }

      for (let i = 1; i < collabsToAssign.length; i++) {
        const extraCollab = collabsToAssign[i];
        const clonedTask = {
          projectId: baseTask.projectId,
          title: `${baseTask.title} (${extraCollab.name})`,
          content: baseTask.content,
          status: baseTask.status,
          color: baseTask.color,
          fontFamily: baseTask.fontFamily,
          priority: baseTask.priority,
          dueDate: baseTask.dueDate,
          assignee: extraCollab,
          order: baseTask.order + i,
          labelIds: baseTask.labelIds || []
        };
        const created = await createTask(clonedTask);
        await createActivityLog({
          projectId: activeProject.id,
          taskId: created.id,
          taskTitle: created.title,
          userName: userProfile.name,
          userColor: userProfile.color,
          type: 'task_created',
          details: `cloned & assigned task to ${extraCollab.name}`
        });

        const extraMember = workspaceMembers.find(m => m.name === extraCollab.name);
        if (extraMember && extraMember.id !== userProfile.id) {
          createNotification({
            userId: extraMember.id,
            projectId: activeProject.id,
            type: 'assignment',
            senderName: userProfile.name,
            text: `assigned you to task: ${created.title}`,
            taskId: created.id
          });
        }
      }
    }

    setAssignSuccess(true);
    setSelectedTaskIds([]);
    setSelectedCollabNames([]);
    setTimeout(() => setAssignSuccess(false), 3000);
  };

  const handleToggleTaskSelect = (taskId: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const handleToggleCollabSelect = (collabName: string) => {
    setSelectedCollabNames(prev => 
      prev.includes(collabName) ? prev.filter(n => n !== collabName) : [...prev, collabName]
    );
  };

  const desiredLeft = isSidebarOpen ? 336 : 16;
  const leftBoundary = `${Math.min(desiredLeft, windowWidth - 80)}px`;

  return (
    <div 
      ref={constraintsRef} 
      className="fixed top-4 right-4 bottom-4 pointer-events-none z-40 select-none"
      style={{ left: leftBoundary }}
    >
      <motion.div
        ref={orbRef}
        drag
        dragConstraints={constraintsRef}
        dragMomentum={false}
        dragElastic={0.1}
        onDrag={updatePanelPosition}
        onDragEnd={updatePanelPosition}
        className="absolute right-2 bottom-2 md:right-4 md:bottom-4 cursor-grab active:cursor-grabbing z-50 pointer-events-auto"
        style={{ touchAction: 'none' }}
      >
        <button
          id="floating-collab-orb-btn"
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-14 h-14 rounded-2xl bg-[#FAF8F5] dark:bg-[#1C1B17] border-2 border-[#1A1A1A] dark:border-[#FAF8F5] text-[#1A1A1A] dark:text-[#FAF8F5] shadow-[4px_4px_0px_rgba(26,26,26,0.15)] dark:shadow-[4px_4px_0px_rgba(250,248,245,0.15)] hover:bg-[#F3EFE6] dark:hover:bg-[#25231F] flex items-center justify-center cursor-pointer transition-colors"
          title="Teammate Hub & Collaboration (Drag me around!)"
        >
          <Users2 size={24} strokeWidth={2} />
          <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-lg border-2 border-[#1A1A1A] dark:border-[#FAF8F5] shadow-[2px_2px_0px_rgba(26,26,26,0.15)]">
            {totalOnlineCount}
          </span>
          {notifications.filter(n => !n.read).length > 0 && (
            <span className="absolute -top-2 -left-2 bg-rose-500 text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-lg border-2 border-[#1A1A1A] dark:border-[#FAF8F5] shadow-[2px_2px_0px_rgba(26,26,26,0.15)]">
              {notifications.filter(n => !n.read).length}
            </span>
          )}
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ 
                opacity: 0, 
                scale: 0.9, 
                y: panelPosition.vertical === 'bottom' ? 15 : -15 
              }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: 0 
              }}
              exit={{ 
                opacity: 0, 
                scale: 0.9, 
                y: panelPosition.vertical === 'bottom' ? 15 : -15 
              }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className={`absolute w-[calc(100vw-32px)] sm:w-[360px] h-[360px] sm:h-[400px] max-h-[calc(100vh-100px)] bg-[#FAF8F5] dark:bg-[#1C1B17] border-2 border-[#1A1A1A] dark:border-[#FAF8F5] rounded-2xl shadow-[6px_6px_0px_rgba(26,26,26,0.15)] dark:shadow-[6px_6px_0px_rgba(250,248,245,0.15)] flex flex-col overflow-hidden pointer-events-auto
                ${panelPosition.vertical === 'bottom' ? 'bottom-full mb-4' : 'top-full mt-4'}
                ${panelPosition.horizontal === 'right' ? 'right-0' : 'left-0'}
              `}
            >
              <div className="bg-[#ECE9DF] dark:bg-[#25231F] px-4 py-3 border-b-2 border-[#1A1A1A] dark:border-[#FAF8F5] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-[#1A1A1A] dark:text-[#FAF8F5]">COLLAB HUB</span>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-[#D9D5C9] dark:hover:bg-[#2D2A24] rounded-lg border border-transparent hover:border-[#1A1A1A] dark:hover:border-[#FAF8F5] text-[#5C5850] dark:text-[#BEB9AD] hover:text-black dark:hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex border-b-2 border-[#1A1A1A] dark:border-[#FAF8F5] text-[10px] font-mono bg-[#FAF8F5] dark:bg-[#161512]">
                <button
                  onClick={() => setActiveTab('online')}
                  className={`flex-1 py-2 border-r-2 border-[#1A1A1A] dark:border-[#FAF8F5] text-center font-bold tracking-tight transition-colors ${
                    activeTab === 'online' 
                      ? 'bg-[#ECE9DF] dark:bg-[#25231F] text-[#1A1A1A] dark:text-[#FAF8F5]' 
                      : 'text-[#8C887D] dark:text-[#7A756B] hover:bg-[#F3EFE6] dark:hover:bg-[#1C1B17]'
                  }`}
                >
                  MEMBERS ({workspaceMembers.length})
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 py-2 border-r-2 border-[#1A1A1A] dark:border-[#FAF8F5] text-center font-bold tracking-tight transition-colors ${
                    activeTab === 'chat' 
                      ? 'bg-[#ECE9DF] dark:bg-[#25231F] text-[#1A1A1A] dark:text-[#FAF8F5]' 
                      : 'text-[#8C887D] dark:text-[#7A756B] hover:bg-[#F3EFE6] dark:hover:bg-[#1C1B17]'
                  }`}
                >
                  CHAT
                </button>
                <button
                  onClick={() => setActiveTab('invite')}
                  className={`flex-1 py-2 border-r-2 border-[#1A1A1A] dark:border-[#FAF8F5] text-center font-bold tracking-tight transition-colors ${
                    activeTab === 'invite' 
                      ? 'bg-[#ECE9DF] dark:bg-[#25231F] text-[#1A1A1A] dark:text-[#FAF8F5]' 
                      : 'text-[#8C887D] dark:text-[#7A756B] hover:bg-[#F3EFE6] dark:hover:bg-[#1C1B17]'
                  }`}
                >
                  INVITE
                </button>
                <button
                  onClick={() => setActiveTab('assign')}
                  className={`flex-1 py-2 border-r-2 border-[#1A1A1A] dark:border-[#FAF8F5] text-center font-bold tracking-tight transition-colors ${
                    activeTab === 'assign' 
                      ? 'bg-[#ECE9DF] dark:bg-[#25231F] text-[#1A1A1A] dark:text-[#FAF8F5]' 
                      : 'text-[#8C887D] dark:text-[#7A756B] hover:bg-[#F3EFE6] dark:hover:bg-[#1C1B17]'
                  }`}
                >
                  ASSIGN
                </button>
                <button
                  onClick={() => setActiveTab('notifs')}
                  className={`flex-1 py-2 flex items-center justify-center gap-1 text-center font-bold tracking-tight transition-colors ${
                    activeTab === 'notifs' 
                      ? 'bg-[#ECE9DF] dark:bg-[#25231F] text-[#1A1A1A] dark:text-[#FAF8F5]' 
                      : 'text-[#8C887D] dark:text-[#7A756B] hover:bg-[#F3EFE6] dark:hover:bg-[#1C1B17]'
                  }`}
                >
                  NOTIFS
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="bg-rose-500 text-white px-1 py-0.5 rounded text-[9px] leading-none">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 bg-[#FAF8F5] dark:bg-[#1C1B17]">
                {activeTab === 'online' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs text-[#5C5850] dark:text-[#BEB9AD]">
                      <Users2 size={14} />
                      <span>Workspace Members:</span>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-[#ECE9DF]/40 dark:bg-[#25231F]/40 border border-[#E5E2DA]/50 dark:border-[#2D2A24]/50">
                        <div className="flex items-center gap-2.5">
                          <div 
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shadow-inner"
                            style={{ backgroundColor: userProfile.color }}
                          >
                            {userProfile.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-[#1A1A1A] dark:text-[#FAF8F5] flex items-center gap-1.5">
                              {userProfile.name}
                              <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-950/50 px-1 rounded">YOU</span>
                              {activeWorkspace.creatorId === userProfile.id && (
                                <span className="text-[9px] font-mono text-amber-600 dark:text-amber-400 font-bold bg-amber-100 dark:bg-amber-950/50 px-1 rounded">OWNER</span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">Online</span>
                          </div>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      </div>

                      {workspaceMembers.filter(m => m.id !== userProfile.id && presenceUsers.some(p => p.id === m.id)).map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-2 rounded-lg bg-[#ECE9DF]/20 dark:bg-[#25231F]/20 border border-transparent hover:border-[#E5E2DA] dark:hover:border-[#2D2A24] transition-all group">
                          <div className="flex items-center gap-2.5">
                            <div 
                              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shadow-inner"
                              style={{ backgroundColor: member.color }}
                            >
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-xs font-medium text-[#1A1A1A] dark:text-[#FAF8F5] flex items-center gap-1.5">
                                {member.name}
                                {activeWorkspace.creatorId === member.id && (
                                  <span className="text-[9px] font-mono text-amber-600 dark:text-amber-400 font-bold bg-amber-100 dark:bg-amber-950/50 px-1 rounded">OWNER</span>
                                )}
                              </div>
                              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">Online</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {activeWorkspace.creatorId === userProfile.id && activeWorkspace.creatorId !== member.id && (
                              <button 
                                onClick={async () => {
                                  if (confirm(`Kick ${member.name} from the workspace?`)) {
                                    await kickUserFromWorkspace(activeWorkspace.id, member.id);
                                  }
                                }}
                                className="text-[10px] uppercase font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                Kick
                              </button>
                            )}
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          </div>
                        </div>
                      ))}

                      {workspaceMembers.filter(m => m.id !== userProfile.id && !presenceUsers.some(p => p.id === m.id)).map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-2 rounded-lg bg-[#ECE9DF]/10 dark:bg-[#25231F]/10 border border-transparent hover:border-[#E5E2DA] dark:hover:border-[#2D2A24] transition-all opacity-60 group">
                          <div className="flex items-center gap-2.5">
                            <div 
                              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shadow-inner grayscale"
                              style={{ backgroundColor: member.color }}
                            >
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-xs font-medium text-[#1A1A1A] dark:text-[#FAF8F5] flex items-center gap-1.5">
                                {member.name}
                                {activeWorkspace.creatorId === member.id && (
                                  <span className="text-[9px] font-mono text-amber-600 dark:text-amber-400 font-bold bg-amber-100 dark:bg-amber-950/50 px-1 rounded">OWNER</span>
                                )}
                              </div>
                              <span className="text-[10px] font-mono text-[#8C887D] dark:text-[#7A756B]">Offline</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {activeWorkspace.creatorId === userProfile.id && activeWorkspace.creatorId !== member.id && (
                              <button 
                                onClick={async () => {
                                  if (confirm(`Kick ${member.name} from the workspace?`)) {
                                    await kickUserFromWorkspace(activeWorkspace.id, member.id);
                                  }
                                }}
                                className="text-[10px] uppercase font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                Kick
                              </button>
                            )}
                            <span className="w-2 h-2 rounded-full bg-[#C5C2B9] dark:bg-[#3D3A35]" />
                          </div>
                        </div>
                      ))}

                      {projectCollabs.filter(c => ['Sarah Designer', 'Alex Developer', 'Liam Lead'].includes(c.name)).map((collab, index) => (
                        <div key={`sim-${index}`} className="flex items-center justify-between p-2 rounded-lg bg-[#ECE9DF]/20 dark:bg-[#25231F]/20 border border-transparent hover:border-[#E5E2DA] dark:hover:border-[#2D2A24] transition-all">
                          <div className="flex items-center gap-2.5">
                            <div 
                              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shadow-inner"
                              style={{ backgroundColor: collab.color }}
                            >
                              {collab.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-xs font-medium text-[#1A1A1A] dark:text-[#FAF8F5] flex items-center gap-1.5">
                                {collab.name}
                                <span className="text-[9px] font-mono text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-100 dark:bg-indigo-950/50 px-1 rounded">AGENT</span>
                              </div>
                              <span className="text-[10px] font-mono text-[#8C887D] dark:text-[#7A756B]">Watching active corkboard</span>
                            </div>
                          </div>
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        </div>
                      ))}

                      {workspaceMembers.length <= 1 && (
                        <div className="py-6 text-center space-y-1.5">
                          <HelpCircle size={28} className="mx-auto text-[#C5C2B9] dark:text-[#3D3930]" />
                          <p className="text-[11px] font-medium text-[#5C5850] dark:text-[#BEB9AD]">No other members.</p>
                          <p className="text-[10px] text-[#8C887D] dark:text-[#7A756B]">Invite them via the INVITE tab!</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'chat' && (
                  <div className="h-full flex flex-col">
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[225px] min-h-[225px]">
                      {chatMessages.map((msg) => {
                        const isSelf = msg.userId === userProfile.id;
                        const isHighlighted = highlightedMessageId === msg.id;

                        const renderMessageWithMentions = (text: string) => {
                          const parts = text.split(/(@[a-zA-Z0-9_]+)/g);
                          return parts.map((part, i) => {
                            if (part.startsWith('@')) {
                              return <span key={i} className="font-bold text-sky-600 dark:text-sky-400">{part}</span>;
                            }
                            return part;
                          });
                        };

                        return (
                          <div 
                            id={`chat-msg-${msg.id}`}
                            key={msg.id} 
                            className={`flex flex-col max-w-[85%] transition-all duration-500 ${isSelf ? 'ml-auto items-end' : 'mr-auto items-start'} ${isHighlighted ? 'scale-105 drop-shadow-md' : ''}`}
                          >
                            <span className="text-[9px] font-mono text-[#8C887D] dark:text-[#7A756B] mb-0.5 px-1">
                              {msg.userName}
                            </span>
                            <div 
                              className={`px-3 py-1.5 rounded-2xl text-xs break-all shadow-sm ${
                                isHighlighted ? 'bg-amber-100 dark:bg-amber-900 ring-2 ring-amber-500 text-amber-900 dark:text-amber-100' :
                                isSelf 
                                  ? 'bg-[#1A1A1A] dark:bg-[#FAF8F5] text-[#FAF8F5] dark:text-[#121211] rounded-tr-none' 
                                  : 'bg-[#ECE9DF] dark:bg-[#25231F] text-[#1A1A1A] dark:text-[#FAF8F5] rounded-tl-none'
                              }`}
                            >
                              {renderMessageWithMentions(msg.message)}
                            </div>
                          </div>
                        );
                      })}
                      {chatMessages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center py-10 space-y-1">
                          <MessageSquare size={24} className="text-[#C5C2B9] dark:text-[#3D3930]" />
                          <span className="text-xs font-serif italic text-[#8C887D] dark:text-[#7A756B]">The corkboard is silent...</span>
                          <span className="text-[10px] text-[#8C887D] dark:text-[#7A756B]">Type a message below to start chatting!</span>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    <form onSubmit={handleSendChat} className="mt-3 flex gap-2 border-t border-[#E5E2DA] dark:border-[#2D2A24] pt-3">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Say something to the team..."
                        className="flex-1 text-xs px-2.5 py-1.5 bg-white dark:bg-[#25231F] border border-[#E5E2DA] dark:border-[#2D2A24] rounded-lg text-[#1A1A1A] dark:text-[#FAF8F5] focus:outline-none focus:border-[#1A1A1A] dark:focus:border-[#FAF8F5]"
                      />
                      <button
                        type="submit"
                        className="p-1.5 bg-[#1A1A1A] dark:bg-[#FAF8F5] text-white dark:text-[#121211] rounded-lg hover:opacity-90 active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
                      >
                        <Send size={14} />
                      </button>
                    </form>
                  </div>
                )}

                {activeTab === 'invite' && (
                  <div className="space-y-4">
                    <form onSubmit={handlePasteLink} className="space-y-2 pb-4 border-b border-[#E5E2DA] dark:border-[#2D2A24]">
                      <label className="text-[10px] font-mono text-[#8C887D] dark:text-[#7A756B] uppercase font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        JOIN EXTERNAL WORKSPACE
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={pasteLink}
                          onChange={(e) => setPasteLink(e.target.value)}
                          placeholder="Paste an invite link..."
                          className="flex-1 text-[11px] px-2.5 py-1.5 bg-white dark:bg-[#25231F] border border-[#E5E2DA] dark:border-[#2D2A24] rounded-lg text-[#1A1A1A] dark:text-[#FAF8F5] focus:outline-none focus:border-[#1A1A1A] dark:focus:border-[#FAF8F5]"
                        />
                        <button
                          type="submit"
                          className="p-1.5 bg-[#1A1A1A] dark:bg-[#FAF8F5] text-white dark:text-[#121211] rounded-lg hover:opacity-90 active:scale-95 cursor-pointer flex items-center justify-center shrink-0 px-3 text-xs font-bold transition-transform"
                        >
                          Join
                        </button>
                      </div>
                      {pasteSuccess && (
                        <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 animate-fadeIn">🎉 Successfully joined workspace!</p>
                      )}
                    </form>

                    {activeWorkspace.type === 'personal' ? (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl flex flex-col gap-2">
                        <div className="flex gap-2 items-start text-amber-800 dark:text-amber-300">
                          <AlertCircle size={16} className="shrink-0 mt-0.5" />
                          <span className="text-xs font-semibold leading-relaxed">Personal Workspace Shared Restriction</span>
                        </div>
                        <p className="text-[11px] text-[#5C5850] dark:text-[#BEB9AD] leading-relaxed">
                          Personal workspaces are private and personal. Other users cannot view them. 
                        </p>
                        <p className="text-[10px] text-[#8C887D] dark:text-[#7A756B] italic">
                          To collaborate, create a Work workspace or select an existing one from the sidebar.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <div className="p-2.5 bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/50 rounded-lg flex gap-2 items-start">
                          <HelpCircle size={14} className="shrink-0 mt-0.5 text-sky-600 dark:text-sky-400" />
                          <p className="text-[10px] text-sky-800 dark:text-sky-300 leading-relaxed">
                            <span className="font-bold">Collab Invites:</span> Share the current link with others. Direct email invites will notify the user upon login.
                          </p>
                        </div>
                        <div className="space-y-2 pt-2 border-t border-[#E5E2DA] dark:border-[#2D2A24]">
                          <label className="text-[10px] font-mono text-[#8C887D] dark:text-[#7A756B] uppercase font-bold">CURRENT WORKSPACE SHARE LINK</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              readOnly
                              value={`${window.location.origin}${window.location.pathname}?invite=${activeWorkspace.id}`}
                              className="flex-1 text-[11px] px-2.5 py-1.5 bg-white dark:bg-[#25231F] border border-[#E5E2DA] dark:border-[#2D2A24] rounded-lg text-[#5C5850] dark:text-[#BEB9AD] select-all cursor-not-allowed"
                            />
                            <button
                              onClick={handleCopyLink}
                              className="p-1.5 bg-[#1A1A1A] dark:bg-[#FAF8F5] text-white dark:text-[#121211] rounded-lg hover:opacity-90 cursor-pointer flex items-center justify-center text-xs gap-1 px-3 shrink-0"
                            >
                              {copiedLink ? <Check size={12} /> : <Copy size={12} />}
                              <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                        </div>

                        <form onSubmit={handleDirectInvite} className="space-y-2 pt-2 border-t border-[#E5E2DA] dark:border-[#2D2A24]">
                          <label className="text-[10px] font-mono text-[#8C887D] dark:text-[#7A756B] uppercase font-bold">SEND EMAIL INVITATION</label>
                          <div className="flex gap-2">
                            <input
                              type="email"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              placeholder="Type user's email..."
                              className="flex-1 text-xs px-2.5 py-1.5 bg-white dark:bg-[#25231F] border border-[#E5E2DA] dark:border-[#2D2A24] rounded-lg text-[#1A1A1A] dark:text-[#FAF8F5] focus:outline-none focus:border-[#1A1A1A] dark:focus:border-[#FAF8F5]"
                            />
                            <button
                              type="submit"
                              className="p-1.5 bg-[#1A1A1A] dark:bg-[#FAF8F5] text-white dark:text-[#121211] rounded-lg hover:opacity-90 active:scale-95 cursor-pointer flex items-center justify-center shrink-0 px-3 text-xs"
                            >
                              <UserPlus size={12} className="mr-1" />
                              <span>Invite</span>
                            </button>
                          </div>
                          {inviteSuccess && (
                            <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 animate-fadeIn">🎉 Invitation sent successfully!</p>
                          )}
                        </form>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'assign' && (
                  <div className="space-y-4">
                    <p className="text-[10px] text-[#5C5850] dark:text-[#BEB9AD]">
                      Select tasks and multi-select collaborators to assign. Choosing multiple collaborators duplicates the tasks so everyone gets assigned.
                    </p>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono text-[#8C887D] dark:text-[#7A756B] uppercase font-bold block">1. SELECT TASKS ({selectedTaskIds.length})</span>
                      <div className="border border-[#E5E2DA] dark:border-[#2D2A24] rounded-lg bg-white dark:bg-[#25231F] p-2 max-h-[90px] overflow-y-auto space-y-1.5">
                        {tasks.map(t => (
                          <label key={t.id} className="flex items-start gap-2 cursor-pointer p-1 rounded hover:bg-[#F3EFE6] dark:hover:bg-[#1C1B17]">
                            <input
                              type="checkbox"
                              checked={selectedTaskIds.includes(t.id)}
                              onChange={() => handleToggleTaskSelect(t.id)}
                              className="mt-0.5 accent-[#1A1A1A] dark:accent-[#FAF8F5]"
                            />
                            <span className="text-[11px] text-[#1A1A1A] dark:text-[#FAF8F5] truncate font-medium">{t.title}</span>
                          </label>
                        ))}
                        {tasks.length === 0 && (
                          <div className="text-center py-2 text-[10px] text-[#8C887D]">No tasks available to assign.</div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono text-[#8C887D] dark:text-[#7A756B] uppercase font-bold block">2. CHOOSE TEAMMATES ({selectedCollabNames.length})</span>
                      <div className="border border-[#E5E2DA] dark:border-[#2D2A24] rounded-lg bg-white dark:bg-[#25231F] p-2 max-h-[90px] overflow-y-auto space-y-1.5">
                        {projectCollabs.map(c => (
                          <label key={c.name} className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-[#F3EFE6] dark:hover:bg-[#1C1B17]">
                            <input
                              type="checkbox"
                              checked={selectedCollabNames.includes(c.name)}
                              onChange={() => handleToggleCollabSelect(c.name)}
                              className="accent-[#1A1A1A] dark:accent-[#FAF8F5]"
                            />
                            <div className="w-4.5 h-4.5 rounded-full flex items-center justify-center text-white text-[8px] font-bold" style={{ backgroundColor: c.color }}>
                              {c.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-[11px] text-[#1A1A1A] dark:text-[#FAF8F5] truncate font-medium">{c.name}</span>
                          </label>
                        ))}
                        {projectCollabs.length === 0 && (
                          <div className="text-center py-2 text-[10px] text-[#8C887D]">No collaborators connected to assign.</div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={handleAssignTasks}
                      disabled={selectedTaskIds.length === 0 || selectedCollabNames.length === 0}
                      className="w-full py-2 bg-[#1A1A1A] dark:bg-[#FAF8F5] text-white dark:text-[#121211] text-[10px] font-bold tracking-widest uppercase rounded-lg hover:opacity-90 disabled:opacity-40 hover:scale-101 active:scale-99 transition-all cursor-pointer"
                    >
                      Assign Selected Tasks
                    </button>

                    {assignSuccess && (
                      <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 text-center animate-fadeIn">🎉 Tasks successfully assigned and synced!</p>
                    )}
                  </div>
                )}

                {activeTab === 'notifs' && (
                  <div className="h-full flex flex-col">
                    <div className="flex justify-between items-center mb-3 shrink-0">
                      <span className="text-[10px] font-mono text-[#8C887D] dark:text-[#7A756B] uppercase font-bold">
                        YOUR NOTIFICATIONS
                      </span>
                      <div className="flex items-center gap-2">
                        {notifications.filter(n => !n.read).length > 0 && (
                          <button 
                            onClick={() => onMarkAllNotificationsRead?.(userProfile.id)}
                            className="text-[10px] text-sky-600 dark:text-sky-400 hover:underline"
                          >
                            Mark all read
                          </button>
                        )}
                        {notifications.length > 0 && (
                          <button 
                            onClick={() => onDeleteAllNotifications?.(userProfile.id)}
                            className="text-[10px] text-rose-600 dark:text-rose-400 hover:underline"
                          >
                            Clear all
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                      {notifications.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center py-10 space-y-1">
                          <Bell size={24} className="text-[#C5C2B9] dark:text-[#3D3930]" />
                          <span className="text-xs font-serif italic text-[#8C887D] dark:text-[#7A756B]">All caught up!</span>
                          <span className="text-[10px] text-[#8C887D] dark:text-[#7A756B]">No new notifications.</span>
                        </div>
                      )}
                      {notifications.map(notif => (
                        <div 
                          key={notif.id}
                          className={`group relative p-3 rounded-xl transition-all border ${
                            notif.read 
                              ? 'bg-[#ECE9DF]/30 dark:bg-[#1A1A1A]/30 border-transparent opacity-60 grayscale hover:opacity-100 hover:grayscale-0' 
                              : 'bg-white dark:bg-[#25231F] border-rose-200 dark:border-rose-900/50 shadow-[2px_2px_0px_rgba(244,63,94,0.15)]'
                          }`}
                        >
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (notif.read) onMarkNotificationUnread?.(notif.id);
                                else onMarkNotificationRead?.(notif.id);
                              }}
                              className="px-2 py-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-[#8C887D] text-[9px] font-bold uppercase"
                              title={notif.read ? "Mark unread" : "Mark read"}
                            >
                              {notif.read ? 'Unread' : <Check size={12} />}
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteNotification?.(notif.id);
                              }}
                              className="p-1 rounded hover:bg-rose-500/10 text-rose-500"
                              title="Delete notification"
                            >
                              <X size={12} />
                            </button>
                          </div>

                          <div 
                            className="cursor-pointer"
                            onClick={() => {
                              if (!notif.read) onMarkNotificationRead?.(notif.id);
                              if (notif.type === 'mention' && notif.messageId) {
                                setActiveTab('chat');
                                setHighlightedMessageId(notif.messageId);
                                setTimeout(() => {
                                  const el = document.getElementById(`chat-msg-${notif.messageId}`);
                                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  setTimeout(() => setHighlightedMessageId(null), 3000);
                                }, 100);
                              } else if ((notif.type === 'assignment' || notif.type === 'status_change') && notif.taskId) {
                                onOpenTaskPreview?.(notif.taskId);
                              }
                            }}
                          >
                            <div className="flex justify-between items-start mb-1 pr-12">
                              <span className="text-xs font-bold text-[#1A1A1A] dark:text-[#FAF8F5]">
                                {notif.type === 'mention' && `${notif.senderName} mentioned you`}
                                {notif.type === 'assignment' && `${notif.senderName} assigned you a task`}
                                {notif.type === 'status_change' && `Task status updated`}
                              </span>
                              {!notif.read && <span className="w-2 h-2 rounded-full bg-rose-500 mt-1 shrink-0" />}
                            </div>
                            <p className={`text-[11px] text-[#5C5850] dark:text-[#BEB9AD] line-clamp-2 ${notif.type === 'mention' ? 'italic' : ''}`}>
                              {notif.type === 'mention' ? `"${notif.text}"` : notif.text}
                            </p>
                            <span className="text-[9px] font-mono text-[#8C887D] mt-2 block">
                              {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
