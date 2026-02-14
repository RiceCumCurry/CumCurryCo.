
import React, { useEffect, useRef } from 'react';

interface MicVisualizerProps {
  threshold: number;
}

const MicVisualizer: React.FC<MicVisualizerProps> = ({ threshold }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>(0);
  const thresholdRef = useRef(threshold);

  // Keep threshold ref in sync with prop to avoid re-running the main effect
  useEffect(() => {
    thresholdRef.current = threshold;
  }, [threshold]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let isMounted = true;

    const setupAudio = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // If component unmounted while waiting for permission, stop tracks immediately
        if (!isMounted) {
          mediaStream.getTracks().forEach(track => track.stop());
          return;
        }

        stream = mediaStream;
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
          if (!isMounted) return;
          if (!canvasRef.current || !analyserRef.current) return;
          
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          analyserRef.current.getByteFrequencyData(dataArray);

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Draw background
          ctx.fillStyle = '#18181b';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Calculate average volume
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          const normalizedVolume = average / 255;

          // Use the latest threshold from ref
          const currentThreshold = thresholdRef.current;

          // Draw volume bar
          const barWidth = canvas.width * normalizedVolume;
          const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
          gradient.addColorStop(0, '#dc2626');
          gradient.addColorStop(0.5, '#f97316');
          gradient.addColorStop(1, '#facc15');

          ctx.fillStyle = normalizedVolume > currentThreshold ? gradient : '#3f3f46';
          ctx.fillRect(0, 0, barWidth, canvas.height);

          // Draw threshold marker
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(canvas.width * currentThreshold, 0);
          ctx.lineTo(canvas.width * currentThreshold, canvas.height);
          ctx.stroke();

          animationRef.current = requestAnimationFrame(draw);
        };

        draw();
      } catch (err) {
        if (isMounted) console.error('Mic Access Denied for Visualizer', err);
      }
    };

    setupAudio();

    return () => {
      isMounted = false;
      cancelAnimationFrame(animationRef.current);
      
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // Empty dependency array ensures we don't restart stream on threshold change

  return (
    <div className="w-full h-4 bg-zinc-950 rounded overflow-hidden relative border border-zinc-800">
      <canvas ref={canvasRef} width={200} height={16} className="w-full h-full" />
    </div>
  );
};

export default MicVisualizer;
