
import React from 'react';
import { 
  Hash, 
  Volume2, 
  Video, 
  Settings, 
  UserPlus, 
  Search, 
  Plus, 
  MessageSquare, 
  Users, 
  Phone,
  Monitor,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  LogOut,
  ChevronDown,
  Bell,
  X,
  Check,
  Globe,
  Menu
} from 'lucide-react';
import { Server, User, ChannelType } from './types';

export const ICONS = {
  Hash: <Hash size={20} />,
  Volume2: <Volume2 size={20} />,
  Video: <Video size={20} />,
  Settings: <Settings size={20} />,
  UserPlus: <UserPlus size={20} />,
  Search: <Search size={20} />,
  Plus: <Plus size={20} />,
  MessageSquare: <MessageSquare size={20} />,
  Users: <Users size={20} />,
  Phone: <Phone size={20} />,
  Monitor: <Monitor size={20} />,
  Mic: <Mic size={20} />,
  MicOff: <MicOff size={20} />,
  VideoOff: <VideoOff size={20} />,
  PhoneOff: <PhoneOff size={20} />,
  LogOut: <LogOut size={20} />,
  ChevronDown: <ChevronDown size={16} />,
  Bell: <Bell size={20} />,
  X: <X size={20} />,
  Check: <Check size={20} />,
  Globe: <Globe size={20} />,
  Menu: <Menu size={24} />
};

export const SEED_USERS: User[] = [
  { id: 'u_arthur', username: 'Arthur', email: 'king@camelot.co', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop', status: 'online', customStatus: 'Pulling swords from stones' },
  { id: 'u_merlin', username: 'Merlin', email: 'wizard@magic.co', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop', status: 'dnd', customStatus: 'Pondering the orb' },
  { id: 'u_guinevere', username: 'Gwen', email: 'queen@royal.co', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop', status: 'idle' },
  { id: 'u_lancelot', username: 'Lancelot', email: 'lance@knight.co', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop', status: 'online' },
];

export const SEED_SERVERS: Server[] = [
  {
    id: 's_camelot',
    name: 'Camelot',
    icon: 'https://images.unsplash.com/photo-1599707367072-cd6ad6cb3d2e?w=200&h=200&fit=crop',
    banner: 'https://images.unsplash.com/photo-1533158388470-9a56699990c6?w=800&h=200&fit=crop',
    ownerId: 'u_arthur',
    createdAt: Date.now(),
    theme: 'royal',
    isPublic: true,
    roles: [
      { id: 'r_king', name: 'Sovereign', color: '#D4AF37', icon: '👑', permissions: ['MANAGE_SERVER'] },
      { id: 'r_knight', name: 'Knight', color: '#C0C0C0', icon: '⚔️', permissions: ['SEND_MESSAGES'] }
    ],
    memberRoles: { 'u_arthur': ['r_king'], 'u_lancelot': ['r_knight'] },
    memberJoinedAt: { 'u_arthur': Date.now(), 'u_lancelot': Date.now() },
    channels: [
      { id: 'c_roundtable', name: 'round-table', type: ChannelType.TEXT },
      { id: 'c_strategy', name: 'war-room', type: ChannelType.VOICE }
    ]
  },
  {
    id: 's_avalon',
    name: 'Avalon',
    icon: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200&h=200&fit=crop',
    banner: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=800&h=200&fit=crop',
    ownerId: 'u_merlin',
    createdAt: Date.now(),
    theme: 'prismatic',
    isPublic: true,
    roles: [],
    memberRoles: { 'u_merlin': [] },
    memberJoinedAt: { 'u_merlin': Date.now() },
    channels: [
      { id: 'c_spells', name: 'spell-casting', type: ChannelType.TEXT },
      { id: 'c_visions', name: 'crystal-ball', type: ChannelType.VIDEO }
    ]
  }
];

export const MOCK_SERVERS: Server[] = SEED_SERVERS;
export const MOCK_FRIENDS: User[] = [];
