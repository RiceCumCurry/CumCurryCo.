
/**
 * VoiceService Placeholder
 * 
 * The Gemini integration has been removed as per the request to remove the API Key requirement.
 * This service is currently a stub. Voice and video functionality is handled by CallScreen.tsx
 * using direct local media stream simulation.
 */
export class GeminiCallService {
  connectToVoiceChannel(onMessage: (text: string) => void) {
    console.log("Voice channel service connected (Local/Stub).");
    return Promise.resolve({});
  }

  disconnect() {
    console.log("Voice channel disconnected.");
  }

  updateSettings(threshold: number, muted: boolean) {
    // Stub
  }
}
