
import React, { useState, useEffect, useRef } from 'react';
import { ICONS } from '../constants';
import { ChannelType, User } from '../types';
import { Maximize2, Minimize2, MessageSquare } from 'lucide-react';
import { socket } from '../services/socket';

interface CallScreenProps {
  currentUser: User;
  type: ChannelType;
  participants: User[]; // This might be empty initially, we rely on signaling to find peers
  activeChannelId: string;
  onDisconnect: () => void;
}

const PEER_CONNECTION_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ]
};

const CallScreen: React.FC<CallScreenProps> = ({ currentUser, type, participants, activeChannelId, onDisconnect }) => {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(type === ChannelType.VIDEO);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);

  // Initialize Media and Socket Logic
  useEffect(() => {
    let mounted = true;

    const startCall = async () => {
      try {
        // 1. Get Local Media
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: type === ChannelType.VIDEO, 
            audio: true 
        });
        localStreamRef.current = stream;
        
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
        }

        // 2. Setup Peer Connection
        const peer = new RTCPeerConnection(PEER_CONNECTION_CONFIG);
        peerRef.current = peer;

        // Add local tracks to peer connection
        stream.getTracks().forEach(track => {
            peer.addTrack(track, stream);
        });

        // Handle receiving remote tracks
        peer.ontrack = (event) => {
            console.log("Received remote track", event.streams[0]);
            if (event.streams && event.streams[0]) {
                setRemoteStream(event.streams[0]);
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = event.streams[0];
                }
                setConnectionState('connected');
            }
        };

        // Handle ICE candidates
        peer.onicecandidate = (event) => {
            if (event.candidate) {
                // Determine target - Simplification: In a 2-person call, we broadcast or send to "the other person".
                // Since we don't have the target ID easily here without state, 
                // we'll rely on the server to route or broadcast to room for 1v1.
                // NOTE: For robust 1v1, we need to know who we are calling. 
                // Let's assume we are calling the first participant that isn't us, OR
                // we broadcast to the room and the other person picks it up.
                // Server change: 'call:signal' with null targetUserId could broadcast to others in room.
                
                // However, to be precise, let's use the `participants` prop to find the other user.
                const target = participants.find(p => p.id !== currentUser.id);
                if (target) {
                    socket.emit('call:signal', {
                        targetUserId: target.id,
                        channelId: activeChannelId,
                        signalData: { type: 'candidate', candidate: event.candidate }
                    });
                }
            }
        };

        peer.onconnectionstatechange = () => {
            console.log("Connection state:", peer.connectionState);
            if (peer.connectionState === 'disconnected') {
                setConnectionState('disconnected');
            }
        };

        // 3. Socket Signaling Listeners
        
        // Handle incoming signals
        const handleSignal = async (data: { fromUserId: string, signalData: any }) => {
            if (!peerRef.current) return;
            const { signalData, fromUserId } = data;

            try {
                if (signalData.type === 'offer') {
                    console.log("Received Offer from", fromUserId);
                    await peerRef.current.setRemoteDescription(new RTCSessionDescription(signalData.offer));
                    const answer = await peerRef.current.createAnswer();
                    await peerRef.current.setLocalDescription(answer);
                    
                    socket.emit('call:signal', {
                        targetUserId: fromUserId,
                        channelId: activeChannelId,
                        signalData: { type: 'answer', answer }
                    });
                } else if (signalData.type === 'answer') {
                    console.log("Received Answer from", fromUserId);
                    await peerRef.current.setRemoteDescription(new RTCSessionDescription(signalData.answer));
                } else if (signalData.type === 'candidate') {
                    console.log("Received ICE Candidate");
                    if (peerRef.current.remoteDescription) {
                        await peerRef.current.addIceCandidate(new RTCIceCandidate(signalData.candidate));
                    }
                }
            } catch (err) {
                console.error("Signaling error", err);
            }
        };

        // Handle when a new peer joins the room (If we are already here, we initiate)
        const handlePeerJoined = async ({ userId }: { userId: string }) => {
            if (userId === currentUser.id) return;
            console.log("Peer joined:", userId, "Initiating offer...");
            
            // Create Offer
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);

            socket.emit('call:signal', {
                targetUserId: userId,
                channelId: activeChannelId,
                signalData: { type: 'offer', offer }
            });
        };

        socket.on('call:signal', handleSignal);
        socket.on('call:peer-joined', handlePeerJoined);

        // Join the signaling room
        socket.emit('call:join', { channelId: activeChannelId });

        // If participants already exist, initiate offer to the first one found
        if (participants.length > 0) {
             const target = participants.find(p => p.id !== currentUser.id);
             if (target) {
                 // Small delay to ensure socket join is processed
                 setTimeout(() => handlePeerJoined({ userId: target.id }), 1000);
             }
        }

        return () => {
            socket.off('call:signal', handleSignal);
            socket.off('call:peer-joined', handlePeerJoined);
        };

      } catch (err) {
        console.error("Failed to start call", err);
      }
    };

    startCall();

    return () => {
      mounted = false;
      // Cleanup
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peerRef.current) {
        peerRef.current.close();
      }
    };
  }, [activeChannelId]); // Re-run only if channel changes (unlikely during call)

  // Toggle Mute/Video logic
  useEffect(() => {
      if (localStreamRef.current) {
          localStreamRef.current.getAudioTracks().forEach(track => track.enabled = isMicOn);
          localStreamRef.current.getVideoTracks().forEach(track => track.enabled = isVideoOn);
      }
  }, [isMicOn, isVideoOn]);

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
        try {
            const stream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
            const screenTrack = stream.getVideoTracks()[0];
            
            if (peerRef.current) {
                const senders = peerRef.current.getSenders();
                const videoSender = senders.find(s => s.track?.kind === 'video');
                if (videoSender) {
                    videoSender.replaceTrack(screenTrack);
                }
            }
            
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            setIsScreenSharing(true);
            setIsVideoOn(false); // UI toggle

            screenTrack.onended = () => {
                // Revert to camera
                setIsScreenSharing(false);
                setIsVideoOn(true);
                // We'd need to re-get user media here in a real app or keep the original stream handy
            };
        } catch (e) {
            console.error("Screen share failed", e);
        }
    }
  };

  if (isMinimized) {
      return (
          <div className="fixed bottom-4 right-4 z-[100] w-80 bg-[#0a0a0a] border border-[#D4AF37] rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="h-1 bg-gradient-to-r from-[#996515] via-[#F4C430] to-[#996515]" />
             <div className="p-4 flex items-center justify-between bg-[#111]">
                <div className="flex items-center gap-3">
                    <span className={`text-[#D4AF37] ${connectionState === 'connected' ? 'animate-pulse' : ''}`}>●</span>
                    <div>
                        <div className="text-xs font-bold uppercase text-[#F5F5DC] royal-font">
                            {connectionState === 'connected' ? 'Live Signal' : 'Establishing...'}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setIsMicOn(!isMicOn)}
                        className={`p-2 rounded hover:bg-white/10 ${isMicOn ? 'text-[#D4AF37]' : 'text-red-500'}`}
                    >
                        {isMicOn ? ICONS.Mic : ICONS.MicOff}
                    </button>
                    <button 
                        onClick={onDisconnect}
                        className="p-2 rounded hover:bg-red-900/50 text-red-500"
                    >
                        {ICONS.PhoneOff}
                    </button>
                    <button 
                        onClick={() => setIsMinimized(false)}
                        className="p-2 rounded hover:bg-white/10 text-[#F5F5DC]"
                    >
                        <Maximize2 size={16} />
                    </button>
                </div>
             </div>
          </div>
      );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-6 backdrop-blur-xl transition-all duration-300">
      <div className="w-full h-full max-w-7xl flex flex-col gap-6">
        {/* Header/Minimizer */}
        <div className="absolute top-6 right-6 z-50">
            <button 
                onClick={() => setIsMinimized(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#3d2b0f] rounded-full text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-all royal-font text-xs font-bold uppercase tracking-widest"
            >
                <MessageSquare size={16} />
                Text Chat
            </button>
        </div>

        {/* Video Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 items-center content-center relative">
          
          {/* Local User */}
          <div className="relative rounded-3xl overflow-hidden bg-zinc-900 h-full max-h-[600px] border-2 border-orange-500/30 shadow-[0_0_50px_rgba(249,115,22,0.1)] group">
              <video 
                ref={localVideoRef} 
                autoPlay 
                muted 
                playsInline 
                className={`w-full h-full object-cover ${isScreenSharing ? '' : 'mirror'}`}
              />
              <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-white/10">
                You {isScreenSharing ? '(Sharing Screen)' : ''}
              </div>
              <div className="absolute bottom-6 right-6">
                 {!isMicOn && <div className="bg-red-600 p-2 rounded-full text-white"><Minimize2 size={16} /></div>}
              </div>
          </div>

          {/* Remote User */}
          {remoteStream ? (
             <div className="relative rounded-3xl overflow-hidden bg-zinc-900 h-full max-h-[600px] border-2 border-[#D4AF37]/30 shadow-[0_0_50px_rgba(212,175,55,0.1)]">
                <video 
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                />
                <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-white/10 text-[#D4AF37]">
                    Remote Signal
                </div>
             </div>
          ) : (
             <div className="flex flex-col items-center justify-center rounded-[3rem] bg-zinc-900/50 border border-zinc-800/30 h-full max-h-[600px]">
                <div className="w-32 h-32 rounded-full border-4 border-dashed border-zinc-700 flex items-center justify-center animate-spin-slow">
                    <span className="text-zinc-700 text-4xl">📡</span>
                </div>
                <div className="mt-8 text-2xl font-black text-zinc-600 uppercase tracking-tighter italic">
                    {connectionState === 'connecting' ? 'Searching for Carrier Signal...' : 'Signal Lost'}
                </div>
             </div>
          )}

        </div>

        {/* Controls */}
        <div className="h-24 bg-zinc-900/80 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center gap-6 px-12 border border-zinc-800/50 shadow-2xl self-center mb-6 z-10">
          <button 
            onClick={() => setIsMicOn(!isMicOn)}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
              isMicOn ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white' : 'bg-red-600 text-white hover:bg-red-700 hover:scale-105'
            }`}
          >
            {isMicOn ? ICONS.Mic : ICONS.MicOff}
          </button>
          <button 
            onClick={() => setIsVideoOn(!isVideoOn)}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
              isVideoOn ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white' : 'bg-red-600 text-white hover:bg-red-700 hover:scale-105'
            }`}
          >
            {isVideoOn ? ICONS.Video : ICONS.VideoOff}
          </button>
          <button 
            onClick={toggleScreenShare}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
              isScreenSharing ? 'bg-orange-500 text-white scale-110 shadow-orange-500/30' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
            }`}
          >
            {ICONS.Monitor}
          </button>
          <div className="w-[2px] h-10 bg-zinc-800 mx-2 rounded-full" />
          <button 
            onClick={onDisconnect}
            className="w-20 h-14 bg-red-600 rounded-3xl flex items-center justify-center text-white hover:bg-red-700 transition-all hover:w-28 shadow-2xl shadow-red-600/20 group"
          >
            <span className="scale-125 group-hover:rotate-12 transition-transform">{ICONS.PhoneOff}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallScreen;
