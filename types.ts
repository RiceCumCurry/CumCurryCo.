
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
  icon?: string; // New: Role Emoji
  permissions: Permission[];
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  banner?: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  customStatus?: string;
  profileTheme?: 'royal' | 'prismatic' | 'minimalist' | 'formula1' | 'redbull';
}

export interface Message {
  id: string;
  userId: string;
  content: string;
  timestamp: number;
  replyToId?: string;
  reactions?: Record<string, string[]>; // New: Emoji -> Array of User IDs
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
  banner?: string; // New: Server Banner
  isPublic?: boolean; // New: Discoverable status
  channels: Channel[];
  ownerId: string;
  roles: Role[];
  memberRoles: Record<string, string[]>; // userId -> roleIds[]
  memberJoinedAt: Record<string, number>; // userId -> timestamp
  theme?: 'royal' | 'prismatic' | 'minimalist' | 'formula1' | 'redbull'; // Updated to match global themes
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
  notifications: Notification[];
  viewingUserId: string | null;
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
