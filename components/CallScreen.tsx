
import React, { useState, useEffect, useRef } from 'react';
import { ICONS } from '../constants';
import { ChannelType, User } from '../types';

interface CallScreenProps {
  type: ChannelType;
  participants: User[];
  onDisconnect: () => void;
}

const CallScreen: React.FC<CallScreenProps> = ({ type, participants, onDisconnect }) => {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(type === ChannelType.VIDEO);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped ${track.kind} track`);
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    const initMedia = async () => {
      stopTracks();
      if (isVideoOn) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          streamRef.current = stream;
          if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
          console.error("Could not access camera", err);
          setIsVideoOn(false);
        }
      }
    };

    initMedia();

    // Cleanup tracks on unmount or toggle
    return () => {
      if (!isScreenSharing) stopTracks();
    };
  }, [isVideoOn]);

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        stopTracks();
        const stream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setIsScreenSharing(true);
        setIsVideoOn(false); // Disable camera if sharing screen
        
        // Handle when user stops sharing via browser bar
        stream.getTracks()[0].onended = () => {
          setIsScreenSharing(false);
          setIsVideoOn(true);
        };
      } catch (e) {
        console.error("Screen share failed", e);
      }
    } else {
      stopTracks();
      setIsScreenSharing(false);
      setIsVideoOn(true); // fall back to camera
    }
  };

  const handleDisconnect = () => {
    stopTracks();
    onDisconnect();
  };

  // Final catch-all for component unmount
  useEffect(() => {
    return () => stopTracks();
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-6 backdrop-blur-xl transition-all duration-300">
      <div className="w-full h-full max-w-7xl flex flex-col gap-6">
        {/* Participants Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-center content-center">
          {isVideoOn || isScreenSharing ? (
            <div className="relative rounded-3xl overflow-hidden bg-zinc-900 h-full max-h-[600px] border-2 border-orange-500/30 shadow-[0_0_50px_rgba(249,115,22,0.1)] group">
              <video 
                ref={videoRef} 
                autoPlay 
                muted 
                playsInline 
                className={`w-full h-full object-cover ${isScreenSharing ? '' : 'mirror'}`}
              />
              <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-white/10">
                You {isScreenSharing ? '(Sharing Screen)' : '(Live)'}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-[3rem] bg-zinc-900 border border-zinc-800/50 h-full max-h-[600px] shadow-2xl">
              <div className="relative">
                 <img src="https://picsum.photos/seed/you/200/200" className="w-40 h-40 rounded-[2.5rem] border-4 border-orange-500 shadow-2xl object-cover" />
                 <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-zinc-900 flex items-center justify-center">
                    <span className="scale-75">{ICONS.Mic}</span>
                 </div>
              </div>
              <div className="mt-8 text-2xl font-black uppercase tracking-tighter italic">You</div>
              <div className="mt-2 text-green-500 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
                <span className="animate-pulse w-2 h-2 bg-green-500 rounded-full" /> Transmission Active
              </div>
            </div>
          )}

          {participants.map(p => (
            <div key={p.id} className="flex flex-col items-center justify-center rounded-[3rem] bg-zinc-900/50 border border-zinc-800/30 h-full max-h-[600px]">
              <img src={p.avatar} className="w-40 h-40 rounded-[2.5rem] opacity-30 object-cover grayscale" />
              <div className="mt-8 text-2xl font-black text-zinc-600 uppercase tracking-tighter italic">{p.username}</div>
              <div className="mt-2 text-zinc-700 font-black text-[10px] uppercase tracking-widest italic">Silent Zone</div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="h-24 bg-zinc-900/80 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center gap-6 px-12 border border-zinc-800/50 shadow-2xl self-center mb-6">
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
            onClick={handleDisconnect}
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
