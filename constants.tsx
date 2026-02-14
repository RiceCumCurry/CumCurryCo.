
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
  Check
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
  Check: <Check size={20} />
};

export const MOCK_SERVERS: Server[] = [
  {
    id: 's1',
    name: 'Curry Hub',
    icon: 'https://picsum.photos/seed/curry/100/100',
    ownerId: 'u2',
    roles: [],
    memberRoles: {},
    memberJoinedAt: {},
    createdAt: Date.now(),
    channels: [
      { id: 'c1', name: 'general', type: ChannelType.TEXT },
      { id: 'c2', name: 'gaming-talk', type: ChannelType.TEXT },
      { id: 'c3', name: 'Voice Lounge', type: ChannelType.VOICE },
      { id: 'c4', name: 'Squad Stream', type: ChannelType.VIDEO }
    ]
  },
  {
    id: 's2',
    name: 'FPS Elite',
    icon: 'https://picsum.photos/seed/fps/100/100',
    ownerId: 'u2',
    roles: [],
    memberRoles: {},
    memberJoinedAt: {},
    createdAt: Date.now(),
    channels: [
      { id: 'c5', name: 'lobby', type: ChannelType.TEXT },
      { id: 'c6', name: 'scrims', type: ChannelType.VOICE }
    ]
  }
];

export const MOCK_FRIENDS: User[] = [
  { id: 'u2', username: 'SpicyBoi', email: 'spicy@cumcurry.co', avatar: 'https://picsum.photos/seed/spicy/100/100', banner: 'https://picsum.photos/seed/spicy_banner/600/200', status: 'online' },
  { id: 'u3', username: 'FragMaster', email: 'frag@cumcurry.co', avatar: 'https://picsum.photos/seed/frag/100/100', banner: 'https://picsum.photos/seed/frag_banner/600/200', status: 'idle' },
  { id: 'u4', username: 'LaggyGamer', email: 'lag@cumcurry.co', avatar: 'https://picsum.photos/seed/lag/100/100', banner: 'https://picsum.photos/seed/lag_banner/600/200', status: 'offline' }
];
