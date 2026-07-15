import { Workspace, Project, Task, Collaborator, ActivityLog, PresenceUser, ChatMessage, AuthSession, Invitation, UserProfile, AppNotification } from './types';
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, getDocs, writeBatch, arrayUnion, arrayRemove, documentId, orderBy } from 'firebase/firestore';
import { db } from './firebaseConfig';

const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export const subscribeWorkspaces = (cb: (data: Workspace[]) => void) => {
  return onSnapshot(collection(db, 'workspaces'), (snapshot) => {
    cb(snapshot.docs.map(d => d.data() as Workspace));
  });
};
export const createWorkspace = async (name: string, type: 'personal' | 'work', ownerId: string, ownerName: string) => {
  const newWs: Workspace = { id: generateId(), name, type, createdAt: Date.now(), creatorId: ownerId, creatorName: ownerName, invitedUsers: [] };
  await setDoc(doc(db, 'workspaces', newWs.id), newWs);
  return newWs;
};
export const updateWorkspace = async (workspaceId: string, updates: Partial<Workspace>) => {
  await updateDoc(doc(db, 'workspaces', workspaceId), updates);
};
export const deleteWorkspace = async (workspaceId: string) => {
  await deleteDoc(doc(db, 'workspaces', workspaceId));
};
export const inviteUserToWorkspace = async (workspaceId: string, userIdOrName: string) => {
  await updateDoc(doc(db, 'workspaces', workspaceId), {
    invitedUsers: arrayUnion(userIdOrName)
  });
};

export const sendEmailInvitation = async (workspaceId: string, workspaceName: string, fromName: string, toEmail: string) => {
  const inv: Invitation = {
    id: generateId(),
    workspaceId,
    workspaceName,
    fromName,
    toEmail: toEmail.toLowerCase().trim(),
    status: 'pending',
    createdAt: Date.now()
  };
  console.log("Sending invitation to Firestore:", inv);
  await setDoc(doc(db, 'invitations', inv.id), inv);
  console.log("Invitation sent successfully!");
};

export const subscribeToPendingInvitations = (email: string, cb: (data: Invitation[]) => void) => {
  console.log("Subscribing to pending invitations for email:", email);
  if (!email) {
    console.log("No email provided to subscribeToPendingInvitations. Bailing out.");
    return () => {};
  }
  const q = query(
    collection(db, 'invitations'), 
    where('toEmail', '==', email.toLowerCase().trim()),
    where('status', '==', 'pending')
  );
  return onSnapshot(q, (snapshot) => {
    const invites = snapshot.docs.map(d => d.data() as Invitation);
    console.log(`Received ${invites.length} pending invitations from Firestore.`);
    cb(invites);
  }, (error) => {
    console.error("Error subscribing to invitations:", error);
  });
};

export const respondToInvitation = async (invitationId: string, workspaceId: string, userId: string, response: 'accepted' | 'declined') => {
  try {
    if (response === 'accepted') {

      await setDoc(doc(db, 'workspaces', workspaceId), {
        invitedUsers: arrayUnion(userId)
      }, { merge: true });
    }

    await updateDoc(doc(db, 'invitations', invitationId), { status: response });
  } catch (err) {
    console.error("Error responding to invitation:", err);

  }
};

export const subscribeProjects = (cb: (data: Project[]) => void) => {
  return onSnapshot(collection(db, 'projects'), (snapshot) => {
    cb(snapshot.docs.map(d => d.data() as Project));
  });
};
export const createProject = async (workspaceId: string, name: string, description: string, isCollaborated: boolean, creatorId?: string) => {
  const newProj: Project = { 
    id: generateId(), 
    workspaceId, 
    name, 
    description, 
    isCollaborated, 
    createdAt: Date.now(),
    collaborators: [],
    labels: [],
    creatorId
  };
  await setDoc(doc(db, 'projects', newProj.id), newProj);
  return newProj;
};
export const updateProject = async (projectId: string, updates: Partial<Project>) => {
  await updateDoc(doc(db, 'projects', projectId), updates);
};
export const updateProjectCollaborators = async (projectId: string, collaborators: Collaborator[]) => {
  await updateDoc(doc(db, 'projects', projectId), { collaborators });
};
export const deleteProject = async (projectId: string) => {
  await deleteDoc(doc(db, 'projects', projectId));
};

export const subscribeTasks = (projectId: string, cb: (data: Task[]) => void) => {
  const q = query(collection(db, 'tasks'), where('projectId', '==', projectId));
  return onSnapshot(q, (snapshot) => {
    cb(snapshot.docs.map(d => d.data() as Task));
  });
};
export const createTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
  const newTask: Task = {
    ...taskData,
    id: generateId(),
    createdAt: Date.now(),
  };
  await setDoc(doc(db, 'tasks', newTask.id), newTask);
  return newTask;
};
export const updateTask = async (taskId: string, updates: Partial<Task>) => {
  await updateDoc(doc(db, 'tasks', taskId), updates);
};
export const deleteTask = async (taskId: string) => {
  await deleteDoc(doc(db, 'tasks', taskId));
};

export const subscribeActivityLogs = (projectId: string, cb: (data: ActivityLog[]) => void) => {
  const q = query(collection(db, 'activityLogs'), where('projectId', '==', projectId));
  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map(d => d.data() as ActivityLog);
    cb(logs.sort((a,b) => b.createdAt - a.createdAt));
  });
};
export const createActivityLog = async (logData: Omit<ActivityLog, 'id' | 'createdAt'>) => {
  const newLog: ActivityLog = {
    ...logData,
    id: generateId(),
    createdAt: Date.now()
  };
  await setDoc(doc(db, 'activityLogs', newLog.id), newLog);
  return newLog;
};

export const subscribeChats = (projectId: string, cb: (data: ChatMessage[]) => void) => {
  const q = query(collection(db, 'chats'), where('projectId', '==', projectId));
  return onSnapshot(q, (snapshot) => {
    const chats = snapshot.docs.map(d => d.data() as ChatMessage);
    cb(chats.sort((a,b) => a.createdAt - b.createdAt));
  });
};
export const sendChatMessage = async (projectId: string, senderId: string, senderName: string, userColor: string, text: string) => {
  const msg: ChatMessage = {
    id: generateId(),
    projectId,
    userId: senderId,
    userName: senderName,
    userColor,
    message: text,
    createdAt: Date.now()
  };
  await setDoc(doc(db, 'chats', msg.id), msg);
  return msg;
};

export const subscribeNotifications = (userId: string, cb: (data: AppNotification[]) => void) => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId)
  );
  return onSnapshot(q, (snapshot) => {
    const notifs = snapshot.docs.map(d => d.data() as AppNotification);
    cb(notifs.sort((a, b) => b.createdAt - a.createdAt));
  });
};

export const createNotification = async (notificationData: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
  const notif: AppNotification = {
    ...notificationData,
    id: generateId(),
    read: false,
    createdAt: Date.now()
  };
  await setDoc(doc(db, 'notifications', notif.id), notif);
  return notif;
};

export const markNotificationRead = async (id: string) => {
  await updateDoc(doc(db, 'notifications', id), { read: true });
};

export const markNotificationUnread = async (id: string) => {
  await updateDoc(doc(db, 'notifications', id), { read: false });
};

export const deleteNotification = async (id: string) => {
  await deleteDoc(doc(db, 'notifications', id));
};

export const deleteAllNotifications = async (userId: string) => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
};

export const cleanupOldNotifications = async (userId: string) => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);

  snapshot.docs.forEach((doc) => {
    const data = doc.data() as Partial<AppNotification>;
    if (!data.type) {
      batch.delete(doc.ref);
    }
  });
  await batch.commit();
};

export const markAllNotificationsRead = async (userId: string) => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('read', '==', false)
  );
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, { read: true });
  });
  await batch.commit();
};

export const subscribePresence = (cb: (data: PresenceUser[]) => void) => {
  const q = query(collection(db, 'presence'));
  return onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map(d => d.data() as PresenceUser);

    const now = Date.now();
    const activeUsers = users.filter(u => (now - u.lastActive) < 20000);
    cb(activeUsers);
  }, (error) => {
    console.error("Presence subscription error:", error);
  });
};

export const updateUserPresence = async (id: string, name: string, color: string, activeProjectId: string | null) => {
  try {
    const user: PresenceUser = { id, name, color, activeProjectId, lastActive: Date.now() };
    await setDoc(doc(db, 'presence', id), user, { merge: true });
  } catch (error) {
    console.error("Error updating user presence:", error);
  }
};

export const seedDefaultData = async (ownerId?: string, ownerName?: string) => {
  const q = collection(db, 'workspaces');
  const snap = await getDocs(q);
  if (snap.empty) {
    const id = ownerId || 'sys_admin';
    const name = ownerName || 'System Admin';
    const owner = { name, color: '#10b981' };
    const ws = await createWorkspace('Personal Sandbox', 'personal', id, name);
    await createProject(ws.id, 'Welcome Board', 'Get started with BoardCraft', false, owner);
  }
};

const SESSION_KEY = 'kb_auth_session';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const saveSession = (session: AuthSession): void => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const loadSession = (): AuthSession | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: AuthSession = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
};

export const clearSession = (): void => {
  localStorage.removeItem(SESSION_KEY);
};

export const createSession = (
  uid: string,
  displayName: string,
  email: string,
  photoURL: string | null,
  color: string,
  rememberMe: boolean
): AuthSession => {
  const now = Date.now();
  return {
    uid,
    displayName,
    email,
    photoURL,
    color,
    rememberMe,
    loginTimestamp: now,
    expiresAt: now + (rememberMe ? THIRTY_DAYS_MS : ONE_DAY_MS),
  };
};

export const migrateWorkspacesToFirebaseUser = async (newUid: string, newName: string): Promise<void> => {
  const oldUserId = localStorage.getItem('kanban_user_id');
  if (oldUserId && oldUserId !== newUid && oldUserId.startsWith('usr_')) {
    const q = query(collection(db, 'workspaces'), where('creatorId', '==', oldUserId));
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.docs.forEach(d => {
      batch.update(d.ref, { creatorId: newUid, creatorName: newName });
    });
    await batch.commit();
  }
};

export const migrateLocalDataToFirebase = async () => {
  if (localStorage.getItem('kb_migrated_to_firebase')) return;
  try {
    const localWorkspaces: Workspace[] = JSON.parse(localStorage.getItem('kb_workspaces') || '[]');
    const localProjects: Project[] = JSON.parse(localStorage.getItem('kb_projects') || '[]');
    const localTasks: Task[] = JSON.parse(localStorage.getItem('kb_tasks') || '[]');
    const localActivityLogs: ActivityLog[] = JSON.parse(localStorage.getItem('kb_activityLogs') || '[]');
    const localChats: ChatMessage[] = JSON.parse(localStorage.getItem('kb_chats') || '[]');
    if (localWorkspaces.length === 0 && localProjects.length === 0) {
      localStorage.setItem('kb_migrated_to_firebase', 'true');
      return;
    }

    const batch = writeBatch(db);
    localWorkspaces.forEach(ws => batch.set(doc(db, 'workspaces', ws.id), ws));
    localProjects.forEach(p => batch.set(doc(db, 'projects', p.id), p));
    localTasks.forEach(t => batch.set(doc(db, 'tasks', t.id), t));
    localActivityLogs.forEach(l => batch.set(doc(db, 'activityLogs', l.id), l));
    localChats.forEach(c => batch.set(doc(db, 'chats', c.id), c));
    await batch.commit();
    localStorage.setItem('kb_migrated_to_firebase', 'true');
    console.log('Successfully migrated local data to Firebase');
  } catch (err) {
    console.error('Failed to migrate data to Firebase', err);
  }
};

export const saveUserProfileToFirestore = async (profile: UserProfile) => {
  if (!profile.id) return;
  await setDoc(doc(db, 'users', profile.id), profile, { merge: true });
};

export const subscribeWorkspaceMembers = (userIds: string[], cb: (users: UserProfile[]) => void) => {
  if (!userIds || userIds.length === 0) {
    cb([]);
    return () => {};
  }

  const chunks = [];
  for (let i = 0; i < userIds.length; i += 10) {
    chunks.push(userIds.slice(i, i + 10));
  }
  const usersMap = new Map<string, UserProfile>();
  const finalUnsubs = chunks.map(chunk => {
    const q = query(collection(db, 'users'), where(documentId(), 'in', chunk));
    return onSnapshot(q, (snapshot) => {
      snapshot.docs.forEach(d => {
        usersMap.set(d.id, d.data() as UserProfile);
      });
      cb(Array.from(usersMap.values()));
    });
  });

  return () => finalUnsubs.forEach(unsub => unsub());
};

export const kickUserFromWorkspace = async (workspaceId: string, userIdToKick: string) => {
  await updateDoc(doc(db, 'workspaces', workspaceId), {
    invitedUsers: arrayRemove(userIdToKick)
  });
};
