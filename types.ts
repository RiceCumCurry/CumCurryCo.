
export enum ChannelType {
  TEXT = 'TEXT',
  VOICE = 'VOICE',
  VIDEO = 'VIDEO'
}

export type Permission = 'MANAGE_SERVER' | 'MANAGE_ROLES' | 'MANAGE_CHANNELS' | 'KICK_MEMBERS' | 'SEND_MESSAGES' | 'MENTION_EVERYONE';

export interface Role {
  id: string;
  name: string;
  color: string;
  permissions: Permission[];
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  banner?: string; // New banner property
  status: 'online' | 'idle' | 'dnd' | 'offline';
  customStatus?: string; // New custom status property
}

export interface Message {
  id: string;
  userId: string;
  content: string;
  timestamp: number;
}

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
}

export interface Server {
  id: string;
  name: string;
  icon: string;
  channels: Channel[];
  ownerId: string;
  roles: Role[];
  memberRoles: Record<string, string[]>; // userId -> roleIds[]
  memberJoinedAt: Record<string, number>; // userId -> timestamp
  theme?: 'fiery' | 'void' | 'neon';
  createdAt: number;
}

export interface Notification {
  id: string;
  type: 'FRIEND_REQUEST' | 'MENTION' | 'PING' | 'SYSTEM';
  fromUserId?: string;
  content: string;
  read: boolean;
  timestamp: number;
}

export interface AppState {
  currentUser: User | null;
  servers: Server[];
  activeServerId: string | null;
  activeChannelId: string | null;
  messages: Record<string, Message[]>; // channelId -> messages[]
  friends: User[];
  notifications: Notification[]; // New notifications state
  viewingUserId: string | null; // New state for profile modal
  isCallActive: boolean;
  callType: ChannelType | null;
  isCreateServerOpen: boolean;
  isCreateChannelOpen: boolean;
  isAddFriendOpen: boolean;
  isExploreOpen: boolean;
  isServerSettingsOpen: boolean;
  isUserSettingsOpen: boolean;
  isServerInfoOpen: boolean;
  noiseThreshold: number;
  isMicMuted: boolean;
  ping: number;
  connectionStatus: 'stable' | 'lagging' | 'disconnected';
}
