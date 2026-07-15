import { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { 
  subscribeWorkspaces, 
  subscribeProjects, 
  subscribeTasks, 
  createWorkspace, 
  createProject, 
  createTask, 
  updateTask, 
  deleteTask, 
  deleteProject, 
  deleteWorkspace, 
  seedDefaultData,
  updateProjectCollaborators,
  updateProject,
  createActivityLog,
  subscribeActivityLogs,
  updateWorkspace,
  sendChatMessage,
  inviteUserToWorkspace,
  subscribeToPendingInvitations,
  respondToInvitation,
  saveSession,
  loadSession,
  clearSession,
  createSession,
  migrateWorkspacesToFirebaseUser,
  migrateLocalDataToFirebase,
  saveUserProfileToFirestore,
  subscribeWorkspaceMembers,
  subscribeNotifications,
  markNotificationRead,
  markNotificationUnread,
  deleteNotification,
  deleteAllNotifications,
  cleanupOldNotifications,
  markAllNotificationsRead,
  createNotification
} from './firebaseDataService';
import { Workspace, Project, Task, UserProfile, STICKY_COLORS, Label, ActivityLog, COLLABORATOR_COLORS, Invitation, AppNotification } from './types';
import Sidebar from './components/Sidebar';
import KanbanBoard from './components/KanbanBoard';
import StickyNoteModal from './components/StickyNoteModal';
import FloatingCollabOrb from './components/FloatingCollabOrb';
import WindowsFrame from './components/WindowsFrame';
import LoginScreen from './components/LoginScreen';
import TutorialOverlay from './components/TutorialOverlay';
import { Sparkles, Layers, FileText, Plus, Briefcase, User } from 'lucide-react';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const prevNotifsRef = useRef<Set<string> | null>(null);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {

    const session = loadSession();
    if (session) {
      return {
        id: session.uid,
        name: session.displayName,
        color: session.color,
        email: session.email,
        photoURL: session.photoURL,
      };
    }
    return { id: '', name: '', color: COLLABORATOR_COLORS[0] };
  });

  const visibleWorkspaces = useMemo(() => {
    return workspaces.filter(ws => {

      if (ws.id === 'ws-personal-default' || ws.id === 'ws-work-default' || !ws.creatorId) {
        return true;
      }
      if (ws.type === 'personal') {
        return ws.creatorId === userProfile.id;
      }
      if (ws.type === 'work') {
        return (
          ws.creatorId === userProfile.id ||
          ws.invitedUsers?.includes(userProfile.id) ||
          ws.invitedUsers?.includes(userProfile.name)
        );
      }
      return false;
    });
  }, [workspaces, userProfile.id, userProfile.name]);

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return false;
  });

  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);

  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !isLoading && !authLoading) {
      if (localStorage.getItem('kb_tutorial_completed') !== 'true') {
        setShowTutorial(true);
      }
    }
  }, [isAuthenticated, isLoading, authLoading]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultNewStatus, setDefaultNewStatus] = useState<'todo' | 'progress' | 'done'>('todo');

  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectCollab, setProjectCollab] = useState(false);

  const [showWorkspaceForm, setShowWorkspaceForm] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceType, setWorkspaceType] = useState<'personal' | 'work'>('personal');

  const [workspaceMembers, setWorkspaceMembers] = useState<UserProfile[]>([]);

  const activeWorkspace = visibleWorkspaces.find(w => w.id === activeWorkspaceId) || null;

  const visibleProjects = projects.filter(p => {

    if (p.workspaceId !== activeWorkspaceId) return false;

    if (p.isCollaborated || p.creatorId === userProfile.id || !p.creatorId) return true;
    return false;
  });
  const activeProject = visibleProjects.find(p => p.id === activeProjectId) || null;

  const activeWorkspaceIdRef = useRef<string | null>(null);
  const activeProjectIdRef = useRef<string | null>(null);
  const tasksRef = useRef<Task[]>([]);

  useEffect(() => {
    activeWorkspaceIdRef.current = activeWorkspaceId;
  }, [activeWorkspaceId]);

  useEffect(() => {
    activeProjectIdRef.current = activeProjectId;
  }, [activeProjectId]);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    const session = loadSession();
    if (session) {
      setUserProfile({
        id: session.uid,
        name: session.displayName,
        color: session.color,
        email: session.email,
        photoURL: session.photoURL,
      });
      setIsAuthenticated(true);
    }

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user && !loadSession()) {

        const color = localStorage.getItem('kanban_user_color') || COLLABORATOR_COLORS[0];
        const rebuilt = createSession(
          user.uid,
          user.displayName || user.email || 'User',
          user.email || '',
          user.photoURL,
          color,
          true
        );
        saveSession(rebuilt);
        const reconstructedProfile = {
          id: user.uid,
          name: user.displayName || user.email || 'User',
          color,
          email: user.email || undefined,
          photoURL: user.photoURL,
        };
        setUserProfile(reconstructedProfile);
        setIsAuthenticated(true);
        saveUserProfileToFirestore(reconstructedProfile).catch(console.error);
      }
      setAuthLoading(false);
    });

    return () => unsubAuth();
  }, []);

  const handleLoginSuccess = (userData: {
    uid: string;
    displayName: string;
    email: string;
    photoURL: string | null;
    color: string;
    rememberMe: boolean;
  }) => {
    const session = createSession(
      userData.uid,
      userData.displayName,
      userData.email,
      userData.photoURL,
      userData.color,
      userData.rememberMe
    );
    saveSession(session);
    migrateWorkspacesToFirebaseUser(userData.uid, userData.displayName);

    setUserProfile({
      id: userData.uid,
      name: userData.displayName,
      color: userData.color,
      email: userData.email,
      photoURL: userData.photoURL,
    });
    setIsAuthenticated(true);
    saveUserProfileToFirestore({
      id: userData.uid,
      name: userData.displayName,
      color: userData.color,
      email: userData.email,
      photoURL: userData.photoURL,
    }).catch(console.error);

    localStorage.setItem('kanban_user_id', userData.uid);
    localStorage.setItem('kanban_user_name', userData.displayName);
    localStorage.setItem('kanban_user_color', userData.color);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Firebase signOut error (may be offline):', e);
    }
    clearSession();
    setIsAuthenticated(false);
    setUserProfile({ id: '', name: '', color: COLLABORATOR_COLORS[0] });
  };

  useEffect(() => {
    if (!isAuthenticated || !userProfile.id) return;

    const initializeApp = async () => {
      try {
        setIsLoading(true);
        migrateLocalDataToFirebase().catch(console.error);
        seedDefaultData(userProfile.id, userProfile.name).catch(console.error);
        const unsubWorkspaces = subscribeWorkspaces((wsList) => {
          setWorkspaces(wsList);
          if (wsList.length > 0 && !activeWorkspaceIdRef.current) {
            const personalDefault = wsList.find(w => w.id === 'ws-personal-default');
            setActiveWorkspaceId(personalDefault ? personalDefault.id : wsList[0].id);
          }
        });

        const unsubProjects = subscribeProjects((projList) => {
          setProjects(projList);
        });

        const unsubInvitations = subscribeToPendingInvitations(userProfile.email || '', (invList) => {
          setPendingInvitations(invList);
        });

        cleanupOldNotifications(userProfile.id).catch(console.error);

        const unsubNotifications = subscribeNotifications(userProfile.id, (notifs) => {
          setNotifications(notifs);

          if (prevNotifsRef.current !== null) {
            const newIds = notifs.filter(n => !n.read && !prevNotifsRef.current!.has(n.id));
            if (newIds.length > 0) {
              newIds.forEach(n => {
                if ((window as any).ipcRenderer) {
                  (window as any).ipcRenderer.send('show-notification', 'BoardCraft', n.text);
                } else if ('Notification' in window && Notification.permission === 'granted') {
                  new window.Notification('BoardCraft', { body: n.text });
                }
              });
            }
          }
          prevNotifsRef.current = new Set(notifs.map(n => n.id));
        });

        setIsLoading(false);

      } catch (err) {
        console.error("Initialization error:", err);
        setIsLoading(false);
      }
    };

    initializeApp();

    return () => {

    };
  }, [isAuthenticated, userProfile.id]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const inviteWorkspaceId = params.get('invite');
    if (inviteWorkspaceId && userProfile.id) {
      const joinWorkspace = async () => {
        try {
          await inviteUserToWorkspace(inviteWorkspaceId, userProfile.id);
          await inviteUserToWorkspace(inviteWorkspaceId, userProfile.name);
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });

          const newUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
          setActiveWorkspaceId(inviteWorkspaceId);
          alert(`🎉 Successfully joined workspace!`);
        } catch (err) {
          console.error("Error joining workspace from link:", err);
        }
      };
      joinWorkspace();
    }
  }, [userProfile.id]);

  useEffect(() => {
    if (!activeWorkspaceId) return;

    const workspaceProjects = projects.filter(p => {
      if (p.workspaceId !== activeWorkspaceId) return false;
      if (p.isCollaborated || p.creatorId === userProfile.id || !p.creatorId) return true;
      return false;
    });

    const currentProjInWorkspace = workspaceProjects.find(p => p.id === activeProjectId);
    if (!currentProjInWorkspace) {
      if (workspaceProjects.length > 0) {
        setActiveProjectId(workspaceProjects[0].id);
      } else {
        setActiveProjectId(null);
      }
    }
  }, [activeWorkspaceId, projects]);

  useEffect(() => {
    if (!activeWorkspace) {
      setWorkspaceMembers([]);
      return;
    }
    const memberIds = [activeWorkspace.creatorId, ...(activeWorkspace.invitedUsers || [])];
    const unsub = subscribeWorkspaceMembers(memberIds, (members) => {
      setWorkspaceMembers(members);
    });
    return () => unsub();
  }, [activeWorkspace]);

  useEffect(() => {
    if (!activeProjectId) {
      setTasks([]);
      return;
    }

    const unsubTasks = subscribeTasks(activeProjectId, (taskList) => {
      setTasks(taskList);
    });

    return () => {
      unsubTasks();
    };
  }, [activeProjectId]);

  useEffect(() => {
    if (!activeProjectId) {
      setActivityLogs([]);
      return;
    }

    const unsubActivityLogs = subscribeActivityLogs(activeProjectId, (logs) => {
      setActivityLogs(logs);
    });

    return () => {
      unsubActivityLogs();
    };
  }, [activeProjectId]);

  const handleSelectWorkspace = (workspaceId: string) => {
    setActiveWorkspaceId(workspaceId);
    setShowProjectForm(false);
    setShowWorkspaceForm(false);
  };

  const handleSelectProject = (projectId: string) => {
    setActiveProjectId(projectId);
    setShowProjectForm(false);
    setShowWorkspaceForm(false);
  };

  const handleCreateWorkspace = async (name: string, type: 'personal' | 'work') => {
    const ws = await createWorkspace(name, type, userProfile.id, userProfile.name);
    setActiveWorkspaceId(ws.id);
    setShowWorkspaceForm(false);
  };

  const handleCreateProject = async (workspaceId: string, name: string, description: string, isCollaborated: boolean) => {
    const proj = await createProject(workspaceId, name, description, isCollaborated, userProfile.id);
    setActiveProjectId(proj.id);
    setShowProjectForm(false);
  };

  const handleDeleteWorkspace = async (workspaceId: string) => {
    const ws = workspaces.find(w => w.id === workspaceId);
    if (ws && ws.creatorId && ws.creatorId !== userProfile.id) {
      alert("Only the workspace creator can delete it.");
      return;
    }

    await deleteWorkspace(workspaceId);
    if (activeWorkspaceId === workspaceId) {
      setActiveWorkspaceId(null);
      setActiveProjectId(null);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    const proj = projects.find(p => p.id === projectId);
    if (proj && proj.creatorId && proj.creatorId !== userProfile.id) {
      alert("Only the project creator can delete it.");
      return;
    }

    await deleteProject(projectId);
    if (activeProjectId === projectId) {
      setActiveProjectId(null);
    }
  };

  const handleRenameWorkspace = async (workspaceId: string, name: string) => {
    const ws = workspaces.find(w => w.id === workspaceId);
    if (ws && ws.creatorId && ws.creatorId !== userProfile.id) {
      alert("Only the workspace creator can rename it.");
      return;
    }

    try {
      await updateWorkspace(workspaceId, { name });
    } catch (err) {
      console.error("Error renaming workspace:", err);
    }
  };

  const handleRenameProject = async (projectId: string, name: string) => {
    const proj = projects.find(p => p.id === projectId);
    if (proj && proj.creatorId && proj.creatorId !== userProfile.id) {
      alert("Only the project creator can rename it.");
      return;
    }

    try {
      await updateProject(projectId, { name });
    } catch (err) {
      console.error("Error renaming project:", err);
    }
  };

  const handleAddTaskClick = (status: 'todo' | 'progress' | 'done') => {
    setEditingTask(null);
    setDefaultNewStatus(status);
    setIsModalOpen(true);
  };

  const handleEditTaskClick = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleOpenTaskPreview = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      handleEditTaskClick(task);
    }
  };

  const handleSaveTask = async (taskData: Omit<Task, 'id' | 'projectId' | 'createdAt' | 'order'>) => {
    if (!activeProjectId) return;

    if (editingTask) {

      if (editingTask.status !== 'done' && taskData.status === 'done') {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6']
        });
      }

      await updateTask(editingTask.id, taskData);

      const changes: string[] = [];
      if (editingTask.title !== taskData.title) changes.push(`renamed to "${taskData.title}"`);
      if (editingTask.status !== taskData.status) {
        const colNames = { todo: 'To Do', progress: 'In Progress', done: 'Done' };
        changes.push(`moved to "${colNames[taskData.status]}"`);
      }
      if (editingTask.priority !== taskData.priority) changes.push(`changed priority to ${taskData.priority}`);
      if (editingTask.dueDate !== taskData.dueDate) changes.push(`set due date to ${taskData.dueDate || 'none'}`);
      if (editingTask.assignee?.name !== taskData.assignee?.name) {
        changes.push(taskData.assignee ? `assigned to ${taskData.assignee.name}` : `removed assignee`);
      }
      if (editingTask.color !== taskData.color) changes.push(`updated note color`);
      const beforeLabels = editingTask.labelIds || [];
      const afterLabels = taskData.labelIds || [];
      if (JSON.stringify(beforeLabels.slice().sort()) !== JSON.stringify(afterLabels.slice().sort())) {
        changes.push(`updated task labels`);
      }

      const logDetails = changes.length > 0 ? changes.join(', ') : 'updated task details';

      await createActivityLog({
        projectId: activeProjectId,
        taskId: editingTask.id,
        taskTitle: taskData.title,
        userName: userProfile.name,
        userColor: userProfile.color,
        type: 'task_edited',
        details: logDetails
      });

      if (
        taskData.assignee && 
        taskData.assignee.name !== editingTask.assignee?.name &&
        taskData.assignee.name !== userProfile.name
      ) {
        const assignedMember = workspaceMembers.find(m => m.name === taskData.assignee?.name);
        if (assignedMember) {
          createNotification({
            userId: assignedMember.id,
            projectId: activeProjectId,
            type: 'assignment',
            senderName: userProfile.name,
            text: `assigned you to task: ${taskData.title}`,
            taskId: editingTask.id
          });
        }
      }
    } else {

      const created = await createTask({
        ...taskData,
        projectId: activeProjectId,
        status: defaultNewStatus,
        order: tasks.length
      });

      const colNames = { todo: 'To Do', progress: 'In Progress', done: 'Done' };
      await createActivityLog({
        projectId: activeProjectId,
        taskId: created.id,
        taskTitle: created.title,
        userName: userProfile.name,
        userColor: userProfile.color,
        type: 'task_created',
        details: `created task in "${colNames[defaultNewStatus]}"`
      });

      if (taskData.assignee && taskData.assignee.name !== userProfile.name) {
        const assignedMember = workspaceMembers.find(m => m.name === taskData.assignee?.name);
        if (assignedMember) {
          createNotification({
            userId: assignedMember.id,
            projectId: activeProjectId,
            type: 'assignment',
            senderName: userProfile.name,
            text: `assigned you to task: ${created.title}`,
            taskId: created.id
          });
        }
      }
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    await deleteTask(taskId);
    if (taskToDelete && activeProjectId) {
      await createActivityLog({
        projectId: activeProjectId,
        taskId,
        taskTitle: taskToDelete.title,
        userName: userProfile.name,
        userColor: userProfile.color,
        type: 'task_deleted',
        details: `deleted task "${taskToDelete.title}"`
      });
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: 'todo' | 'progress' | 'done') => {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== 'done' && newStatus === 'done') {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6']
      });
    }
    await updateTask(taskId, { status: newStatus });
    if (task && activeProjectId) {
      const colNames = { todo: 'To Do', progress: 'In Progress', done: 'Done' };
      await createActivityLog({
        projectId: activeProjectId,
        taskId,
        taskTitle: task.title,
        userName: userProfile.name,
        userColor: userProfile.color,
        type: 'status_change',
        details: `moved to "${colNames[newStatus]}"`
      });

      if (newStatus === 'progress' || newStatus === 'done') {
        workspaceMembers.forEach(member => {
          if (member.id !== userProfile.id) {
            createNotification({
              userId: member.id,
              projectId: activeProjectId,
              type: 'status_change',
              senderName: userProfile.name,
              text: `moved task "${task.title}" to ${colNames[newStatus]}`,
              taskId: taskId
            });
          }
        });
      }
    }
  };

  const handleToggleCollab = async (projectId: string) => {
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;

    if (proj.creatorId && proj.creatorId !== userProfile.id) {
      alert("Only the project creator can change collaboration settings.");
      return;
    }

    const willCollaborate = !proj.isCollaborated;

    await updateProject(projectId, { 
      isCollaborated: willCollaborate,
      creatorId: proj.creatorId || userProfile.id
    });
  };

  const handleExportProject = (projectId: string) => {
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    const exportData = {
      project: {
        id: proj.id,
        name: proj.name,
        description: proj.description,
        isCollaborated: proj.isCollaborated,
        createdAt: proj.createdAt
      },
      tasks: projectTasks.map(t => ({
        id: t.id,
        title: t.title,
        content: t.content,
        status: t.status,
        color: t.color,
        fontFamily: t.fontFamily,
        priority: t.priority,
        dueDate: t.dueDate,
        assignee: t.assignee,
        labelIds: t.labelIds,
        createdAt: t.createdAt
      }))
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${proj.name.toLowerCase().replace(/\s+/g, '_')}_board_export.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (authLoading) {
    return (
      <div className={`flex items-center justify-center h-screen ${isDarkMode ? 'bg-[#121211]' : 'bg-[#FAF8F5]'}`}>
        <div className="w-8 h-8 border-4 border-[#1A1A1A] dark:border-[#FAF8F5] border-t-transparent dark:border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} isDarkMode={isDarkMode} />;
  }

  return (
    <WindowsFrame
      isDarkMode={isDarkMode}
      onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      onExportProject={() => {
        if (activeProject) handleExportProject(activeProject.id);
      }}
      activeProjectName={activeProject?.name}
      isSidebarOpen={isSidebarOpen}
      onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      onAddTask={() => {
        if (activeProject) {
          handleAddTaskClick('todo');
        } else {
          setShowProjectForm(true);
        }
      }}
    >
      <div className="flex h-full w-full overflow-hidden bg-[#F9F7F2] dark:bg-[#121211] font-sans relative">
      {showTutorial && <TutorialOverlay onComplete={() => setShowTutorial(false)} />}

      {pendingInvitations.length > 0 && (
        <div className="absolute inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#FAF8F5] dark:bg-[#1C1B17] border-2 border-[#1A1A1A] dark:border-[#FAF8F5] shadow-[8px_8px_0px_rgba(26,26,26,1)] dark:shadow-[8px_8px_0px_rgba(250,248,245,0.2)] rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold font-serif mb-4 flex items-center gap-2 text-[#1A1A1A] dark:text-[#FAF8F5]">
              <Sparkles className="text-amber-500" size={24} />
              You're Invited!
            </h2>
            <div className="space-y-3">
              {pendingInvitations.map(inv => (
                <div key={inv.id} className="bg-white dark:bg-[#25231F] border border-[#E5E2DA] dark:border-[#2D2A24] rounded-xl p-4">
                  <p className="text-sm mb-3 text-[#1A1A1A] dark:text-[#FAF8F5]">
                    <span className="font-bold">{inv.fromName}</span> invited you to join <span className="font-bold font-serif">{inv.workspaceName}</span>.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        console.log("Clicked Accept for:", inv.id);
                        setPendingInvitations(prev => prev.filter(p => p.id !== inv.id));
                        await respondToInvitation(inv.id, inv.workspaceId, userProfile.id, 'accepted');
                      }}
                      className="flex-1 py-1.5 bg-[#1A1A1A] dark:bg-[#FAF8F5] text-white dark:text-[#1A1A1A] text-sm font-bold rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      Accept
                    </button>
                    <button
                      onClick={async () => {
                        console.log("Clicked Decline for:", inv.id);
                        setPendingInvitations(prev => prev.filter(p => p.id !== inv.id));
                        await respondToInvitation(inv.id, inv.workspaceId, userProfile.id, 'declined');
                      }}
                      className="flex-1 py-1.5 bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 text-sm font-bold rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors cursor-pointer"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isSidebarOpen && (
        <div 
          id="mobile-sidebar-backdrop"
          className="fixed inset-0 bg-[#1A1A1A]/30 dark:bg-black/50 z-40 md:hidden animate-fadeIn"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar
        workspaces={visibleWorkspaces}
        projects={visibleProjects}
        activeWorkspaceId={activeWorkspaceId}
        activeProjectId={activeProjectId}
        onSelectWorkspace={(workspaceId) => {
          handleSelectWorkspace(workspaceId);
          if (typeof window !== 'undefined' && window.innerWidth < 768) {
            setIsSidebarOpen(false);
          }
        }}
        onSelectProject={(projectId) => {
          handleSelectProject(projectId);
          if (typeof window !== 'undefined' && window.innerWidth < 768) {
            setIsSidebarOpen(false);
          }
        }}
        onCreateWorkspace={handleCreateWorkspace}
        onCreateProject={handleCreateProject}
        onDeleteWorkspace={handleDeleteWorkspace}
        onDeleteProject={handleDeleteProject}
        onRenameWorkspace={handleRenameWorkspace}
        onRenameProject={handleRenameProject}
        onExportProject={handleExportProject}
        userProfile={userProfile}
        onProfileChange={setUserProfile}
        onCloseSidebar={() => setIsSidebarOpen(false)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onLogout={handleLogout}
        className={`fixed inset-y-0 left-0 z-50 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-all duration-300 ease-in-out md:relative md:transform-none ${
          isSidebarOpen ? 'md:w-80 md:opacity-100 md:border-r' : 'md:w-0 md:opacity-0 md:pointer-events-none md:border-r-0'
        }`}
      />

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-3 bg-[#F9F7F2] dark:bg-[#121211]">
          <div className="w-8 h-8 border-4 border-[#1A1A1A] dark:border-[#FAF8F5] border-t-transparent dark:border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#8C887D] dark:text-[#7A756B]">Unrolling sticky corkboard...</p>
        </div>
      ) : activeProject ? (
        <KanbanBoard
          project={activeProject}
          tasks={tasks}
          activityLogs={activityLogs}
          onAddTask={handleAddTaskClick}
          onEditTask={handleEditTaskClick}
          onDeleteTask={handleDeleteTask}
          onUpdateTaskStatus={handleUpdateTaskStatus}
          onToggleCollab={handleToggleCollab}
          currentUserProfile={userProfile}
          isSidebarOpen={isSidebarOpen}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onExportProject={handleExportProject}
          isDarkMode={isDarkMode}
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#FAF8F5] dark:bg-[#121211]">
          <Layers size={40} className="text-[#C5C2B9] dark:text-[#3D3930] mb-4" />
          <h3 className="text-base font-serif italic font-bold text-[#1A1A1A] dark:text-[#FAF8F5]">No active project selected</h3>
          <p className="text-xs text-[#5C5850] dark:text-[#BEB9AD] mt-2 max-w-sm leading-relaxed">
            Select an existing project in the sidebar workspaces, or click the '+' icon to launch a brand new collaborative whiteboard.
          </p>
          <div className="mt-6 flex flex-col items-center">
            {!showProjectForm && !showWorkspaceForm ? (
              <div className="flex flex-wrap gap-3 justify-center">
                {activeWorkspaceId && (
                  <button
                    id="new-project-btn-empty"
                    onClick={() => {
                      setShowProjectForm(true);
                      setProjectName('');
                      setProjectDesc('');
                      setProjectCollab(false);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 border border-[#1A1A1A] dark:border-[#FAF8F5] text-[10px] uppercase font-bold tracking-widest hover:bg-[#1A1A1A] hover:text-white dark:hover:bg-[#FAF8F5] dark:hover:text-[#121211] text-[#1A1A1A] dark:text-[#FAF8F5] transition-all cursor-pointer shadow-sm animate-fadeIn"
                  >
                    <Plus size={14} /> New Project
                  </button>
                )}
                {!activeWorkspaceId && (
                  <button
                    id="new-workspace-btn-empty"
                    onClick={() => {
                      setShowWorkspaceForm(true);
                      setWorkspaceName('');
                      setWorkspaceType('personal');
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 border border-[#1A1A1A] dark:border-[#FAF8F5] text-[10px] uppercase font-bold tracking-widest hover:bg-[#1A1A1A] hover:text-white dark:hover:bg-[#FAF8F5] dark:hover:text-[#121211] text-[#1A1A1A] dark:text-[#FAF8F5] transition-all cursor-pointer shadow-sm animate-fadeIn"
                  >
                    <Plus size={14} /> New Workspace
                  </button>
                )}
              </div>
            ) : showProjectForm ? (
              <form
                id="inline-project-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!projectName.trim() || !activeWorkspaceId) return;
                  await handleCreateProject(activeWorkspaceId, projectName.trim(), projectDesc.trim(), projectCollab);
                }}
                className="w-full max-w-sm bg-[#FAF8F5] dark:bg-[#1C1B17] p-5 rounded-lg border border-[#E5E2DA] dark:border-[#2D2A24] shadow-md text-left space-y-4 animate-fadeIn"
              >
                <div className="text-center pb-2 border-b border-[#E5E2DA] dark:border-[#2D2A24]">
                  <h4 className="text-xs font-serif italic font-bold text-[#1A1A1A] dark:text-[#FAF8F5]">Create a New Project</h4>
                  <p className="text-[10px] text-[#8C887D] dark:text-[#7A756B] mt-0.5">
                    Adding to workspace: <span className="font-bold">{workspaces.find(w => w.id === activeWorkspaceId)?.name}</span>
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[9px] font-bold text-[#8C887D] dark:text-[#7A756B] uppercase tracking-wider mb-1">Project Title</label>
                    <input
                      id="inline-project-name-input"
                      type="text"
                      placeholder="e.g. 🏡 Cabin Renovation"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="w-full text-xs border border-[#E5E2DA] dark:border-[#2D2A24] rounded px-2.5 py-1.5 focus:outline-none focus:border-[#1A1A1A] dark:focus:border-[#FAF8F5] bg-white dark:bg-[#25231F] text-[#1A1A1A] dark:text-[#FAF8F5]"
                      maxLength={30}
                      required
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-[#8C887D] dark:text-[#7A756B] uppercase tracking-wider mb-1">Description</label>
                    <textarea
                      id="inline-project-desc-input"
                      placeholder="A brief project focus..."
                      value={projectDesc}
                      onChange={(e) => setProjectDesc(e.target.value)}
                      className="w-full text-xs border border-[#E5E2DA] dark:border-[#2D2A24] rounded px-2.5 py-1.5 focus:outline-none focus:border-[#1A1A1A] dark:focus:border-[#FAF8F5] bg-white dark:bg-[#25231F] text-[#1A1A1A] dark:text-[#FAF8F5] resize-none h-16"
                      maxLength={100}
                    />
                  </div>

                  <div className="flex items-center justify-between py-1.5 bg-[#F4F1EA] dark:bg-[#25231F] rounded px-3 border border-[#E5E2DA]/50 dark:border-[#2D2A24]/50">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-[#1A1A1A] dark:text-[#FAF8F5]">Real-time Collaboration</span>
                      <span className="text-[9px] text-[#8C887D] dark:text-[#7A756B]">Allow workspace members to join</span>
                    </div>
                    <input
                      id="inline-project-collab-checkbox"
                      type="checkbox"
                      checked={projectCollab}
                      onChange={(e) => setProjectCollab(e.target.checked)}
                      className="w-4 h-4 text-[#1A1A1A] dark:text-[#FAF8F5] accent-[#1A1A1A] dark:accent-[#FAF8F5] border-[#E5E2DA] dark:border-[#2D2A24] rounded cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2 border-t border-[#E5E2DA] dark:border-[#2D2A24]">
                  <button
                    type="button"
                    onClick={() => setShowProjectForm(false)}
                    className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-medium text-[#5C5850] dark:text-[#BEB9AD] hover:text-[#1A1A1A] dark:hover:text-[#FAF8F5] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-[10px] uppercase tracking-wider font-bold bg-[#1A1A1A] dark:bg-[#FAF8F5] text-white dark:text-[#121211] rounded hover:bg-[#2E2E2E] dark:hover:bg-[#ECE8DF] cursor-pointer"
                  >
                    Create Project
                  </button>
                </div>
              </form>
            ) : (
              <form
                id="inline-workspace-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!workspaceName.trim()) return;
                  await handleCreateWorkspace(workspaceName.trim(), workspaceType);
                }}
                className="w-full max-w-sm bg-[#FAF8F5] dark:bg-[#1C1B17] p-5 rounded-lg border border-[#E5E2DA] dark:border-[#2D2A24] shadow-md text-left space-y-4 animate-fadeIn"
              >
                <div className="text-center pb-2 border-b border-[#E5E2DA] dark:border-[#2D2A24]">
                  <h4 className="text-xs font-serif italic font-bold text-[#1A1A1A] dark:text-[#FAF8F5]">Create a New Workspace</h4>
                  <p className="text-[10px] text-[#8C887D] dark:text-[#7A756B] mt-0.5">Organize your boards into custom spaces</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[9px] font-bold text-[#8C887D] dark:text-[#7A756B] uppercase tracking-wider mb-1">Workspace Name</label>
                    <input
                      id="inline-workspace-name-input"
                      type="text"
                      placeholder="e.g. Personal Projects"
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      className="w-full text-xs border border-[#E5E2DA] dark:border-[#2D2A24] rounded px-2.5 py-1.5 focus:outline-none focus:border-[#1A1A1A] dark:focus:border-[#FAF8F5] bg-white dark:bg-[#25231F] text-[#1A1A1A] dark:text-[#FAF8F5]"
                      maxLength={25}
                      required
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-[#8C887D] dark:text-[#7A756B] uppercase tracking-wider mb-1">Workspace Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setWorkspaceType('personal')}
                        className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded border cursor-pointer transition-all ${
                          workspaceType === 'personal'
                            ? 'bg-[#1A1A1A] dark:bg-[#FAF8F5] text-white dark:text-[#121211] border-[#1A1A1A] dark:border-[#FAF8F5]'
                            : 'bg-white dark:bg-[#1E1C18] text-[#5C5850] dark:text-[#BEB9AD] border-[#E5E2DA] dark:border-[#2D2A24] hover:bg-[#F4F1EA] dark:hover:bg-[#2D2A24]'
                        }`}
                      >
                        <User size={12} /> Personal
                      </button>
                      <button
                        type="button"
                        onClick={() => setWorkspaceType('work')}
                        className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded border cursor-pointer transition-all ${
                          workspaceType === 'work'
                            ? 'bg-[#1A1A1A] dark:bg-[#FAF8F5] text-white dark:text-[#121211] border-[#1A1A1A] dark:border-[#FAF8F5]'
                            : 'bg-white dark:bg-[#1E1C18] text-[#5C5850] dark:text-[#BEB9AD] border-[#E5E2DA] dark:border-[#2D2A24] hover:bg-[#F4F1EA] dark:hover:bg-[#2D2A24]'
                        }`}
                      >
                        <Briefcase size={12} /> Work
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2 border-t border-[#E5E2DA] dark:border-[#2D2A24]">
                  <button
                    type="button"
                    onClick={() => setShowWorkspaceForm(false)}
                    className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-medium text-[#5C5850] dark:text-[#BEB9AD] hover:text-[#1A1A1A] dark:hover:text-[#FAF8F5] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-[10px] uppercase tracking-wider font-bold bg-[#1A1A1A] dark:bg-[#FAF8F5] text-white dark:text-[#121211] rounded hover:bg-[#2E2E2E] dark:hover:bg-[#ECE8DF] cursor-pointer"
                  >
                    Create Workspace
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {activeProject && (
        <StickyNoteModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveTask}
          task={editingTask}
          project={activeProject}
          onUpdateProjectLabels={async (labels) => {
            await updateProject(activeProject.id, { labels });
          }}
          currentUserProfile={userProfile}
          workspaceMembers={workspaceMembers}
        />
      )}

      <FloatingCollabOrb
        activeWorkspace={activeWorkspace}
        activeProject={activeProject}
        tasks={tasks}
        userProfile={userProfile}
        isSidebarOpen={isSidebarOpen}
        notifications={notifications}
        onMarkNotificationRead={markNotificationRead}
        onMarkNotificationUnread={markNotificationUnread}
        onMarkAllNotificationsRead={markAllNotificationsRead}
        onDeleteNotification={deleteNotification}
        onDeleteAllNotifications={deleteAllNotifications}
        onOpenTaskPreview={handleOpenTaskPreview}
      />
      </div>
    </WindowsFrame>
  );
}
