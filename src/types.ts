export interface Workspace {
  id: string;
  name: string;
  type: 'personal' | 'work';
  createdAt: number;
  creatorId?: string;
  creatorName?: string;
  invitedUsers?: string[];
}

export interface Invitation {
  id: string;
  workspaceId: string;
  workspaceName: string;
  fromName: string;
  toEmail: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userColor: string;
  message: string;
  createdAt: number;
}

export interface PresenceUser {
  id: string;
  name: string;
  color: string;
  activeProjectId: string | null;
  lastActive: number;
}

export interface Collaborator {
  name: string;
  color: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  isCollaborated: boolean;
  collaborators: Collaborator[];
  createdAt: number;
  labels?: Label[];
  creatorId?: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  content: string;
  status: 'todo' | 'progress' | 'done';
  color: string;
  fontFamily: 'sans' | 'mono' | 'serif' | 'handwritten';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  assignee: Collaborator | null;
  createdAt: number;
  order: number;
  labelIds?: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  color: string;
  email?: string;
  photoURL?: string | null;
}

export interface AuthSession {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  color: string;
  rememberMe: boolean;
  loginTimestamp: number;
  expiresAt: number;
}

export interface ActivityLog {
  id: string;
  projectId: string;
  taskId?: string;
  taskTitle?: string;
  userName: string;
  userColor?: string;
  type: 'status_change' | 'label_assigned' | 'task_created' | 'task_edited' | 'task_deleted' | 'priority_change' | 'assignee_change';
  details: string;
  createdAt: number;
}

export interface AppNotification {
  id: string;
  userId: string;
  projectId: string;
  type: 'mention' | 'assignment' | 'status_change';
  senderName: string;
  text: string;
  read: boolean;
  createdAt: number;
  messageId?: string;
  taskId?: string;
}

export const STICKY_COLORS = [
  { name: 'Yellow', bgClass: 'bg-amber-100/90 hover:bg-amber-100', borderClass: 'border-amber-200', textClass: 'text-amber-900', colorCode: '#fef3c7', pinColor: 'bg-red-500' },
  { name: 'Green', bgClass: 'bg-emerald-100/90 hover:bg-emerald-100', borderClass: 'border-emerald-200', textClass: 'text-emerald-900', colorCode: '#d1fae5', pinColor: 'bg-blue-500' },
  { name: 'Blue', bgClass: 'bg-sky-100/90 hover:bg-sky-100', borderClass: 'border-sky-200', textClass: 'text-sky-900', colorCode: '#e0f2fe', pinColor: 'bg-amber-500' },
  { name: 'Pink', bgClass: 'bg-rose-100/90 hover:bg-rose-100', borderClass: 'border-rose-200', textClass: 'text-rose-900', colorCode: '#ffe4e6', pinColor: 'bg-teal-500' },
  { name: 'Purple', bgClass: 'bg-purple-100/90 hover:bg-purple-100', borderClass: 'border-purple-200', textClass: 'text-purple-900', colorCode: '#f3e8ff', pinColor: 'bg-orange-500' },
  { name: 'Orange', bgClass: 'bg-orange-100/90 hover:bg-orange-100', borderClass: 'border-orange-200', textClass: 'text-orange-900', colorCode: '#ffedd5', pinColor: 'bg-indigo-500' },
];

export const DEFAULT_LABELS: Label[] = [
  { id: 'lbl-bug', name: 'Bug', color: '#fca5a5' },
  { id: 'lbl-feature', name: 'Feature', color: '#86efac' },
  { id: 'lbl-urgent', name: 'Urgent', color: '#fde047' },
  { id: 'lbl-client', name: 'Client Request', color: '#93c5fd' },
];

export const LABEL_COLOR_PRESETS = [
  { name: 'Rose', color: '#fca5a5' },
  { name: 'Emerald', color: '#86efac' },
  { name: 'Amber', color: '#fde047' },
  { name: 'Sky', color: '#93c5fd' },
  { name: 'Purple', color: '#d8b4fe' },
  { name: 'Orange', color: '#fdba74' },
  { name: 'Pink', color: '#fbcfe8' },
  { name: 'Teal', color: '#99f6e4' },
];

export const FONT_FAMILIES = [
  { id: 'sans', name: 'Modern Sans', class: 'font-sans' },
  { id: 'mono', name: 'Technical Mono', class: 'font-mono' },
  { id: 'serif', name: 'Elegant Serif', class: 'font-serif' },
  { id: 'handwritten', name: 'Sticky Handwritten', class: 'font-handwritten' },
];

export const COLLABORATOR_COLORS = [
  '#f43f5e',
  '#3b82f6',
  '#10b981',
  '#eab308',
  '#a855f7',
  '#f97316',
  '#06b6d4',
];
