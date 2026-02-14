
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

/**
 * GeminiCallService manages real-time voice interactions using the Gemini Live API.
 * It handles session setup, audio streaming (input/output), and transcription.
 */
export class GeminiCallService {
  private session: any = null;
  private audioContext: AudioContext | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private mediaStream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private noiseThreshold: number = 0.05;
  private isMuted: boolean = false;

  updateSettings(threshold: number, muted: boolean) {
    this.noiseThreshold = threshold;
    this.isMuted = muted;
  }

  async connectToVoiceChannel(onMessage: (text: string) => void) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });

    const sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks: {
        onopen: async () => {
          console.log('Connected to Gemini Voice');
          try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const source = inputAudioContext.createMediaStreamSource(this.mediaStream);
            this.scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            
            this.scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              
              // Apply Noise Gate & Mute
              const processedData = new Float32Array(inputData.length);
              
              if (!this.isMuted) {
                // Calculate RMS to determine if frame should be gated
                let sumSquare = 0;
                for (let i = 0; i < inputData.length; i++) {
                  sumSquare += inputData[i] * inputData[i];
                }
                const rms = Math.sqrt(sumSquare / inputData.length);

                // If volume is above threshold, pass the data
                if (rms > this.noiseThreshold) {
                  processedData.set(inputData);
                }
              }

              const pcmBlob = this.createBlob(processedData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(this.scriptProcessor);
            this.scriptProcessor.connect(inputAudioContext.destination);
          } catch (err) {
            console.error('Microphone access denied', err);
          }
        },
        onmessage: async (message: LiveServerMessage) => {
          const base64EncodedAudioString = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (base64EncodedAudioString) {
            await this.playAudio(base64EncodedAudioString);
          }
          if (message.serverContent?.outputTranscription) {
            onMessage(message.serverContent.outputTranscription.text);
          }
          const interrupted = message.serverContent?.interrupted;
          if (interrupted) {
            this.stopAllAudio();
          }
        },
        onerror: (e: any) => console.error('Gemini Voice Error', e),
        onclose: () => console.log('Gemini Voice Closed'),
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
        },
        systemInstruction: 'You are a helpful gaming companion in a voice channel. Keep it casual and short.',
        outputAudioTranscription: {},
        inputAudioTranscription: {},
      },
    });

    this.session = await sessionPromise;
    return this.session;
  }

  private stopAllAudio() {
    for (const source of this.sources.values()) {
      source.stop();
      this.sources.delete(source);
    }
    this.nextStartTime = 0;
  }

  private createBlob(data: Float32Array) {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: this.encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  private async playAudio(base64: string) {
    if (!this.audioContext) return;
    const data = this.decode(base64);
    const audioBuffer = await this.decodeAudioData(data, this.audioContext, 24000, 1);
    
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);
    
    this.nextStartTime = Math.max(this.nextStartTime, this.audioContext.currentTime);
    source.start(this.nextStartTime);
    this.nextStartTime += audioBuffer.duration;
    this.sources.add(source);
    
    source.onended = () => this.sources.delete(source);
  }

  private decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  private encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private async decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }

  disconnect() {
    this.stopAllAudio();
    this.scriptProcessor?.disconnect();
    this.mediaStream?.getTracks().forEach(track => track.stop());
    this.audioContext?.close();
    if (this.session) {
      this.session.close();
    }
    this.session = null;
  }
}
