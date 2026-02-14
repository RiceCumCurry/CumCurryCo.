
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
  Globe
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
  Globe: <Globe size={20} />
};

export const MOCK_SERVERS: Server[] = [];

export const MOCK_FRIENDS: User[] = [];
