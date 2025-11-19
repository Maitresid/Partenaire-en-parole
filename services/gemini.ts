import { GoogleGenAI, Chat, Modality, LiveServerMessage } from "@google/genai";
import { AppConfig } from "../types";
import { createPcmBlob, decode, decodeAudioData } from "../utils/audioUtils";

// --- Configuration ---

const SYSTEM_INSTRUCTION_TEMPLATE = (config: AppConfig) => `
Role: French Vocabulary Conversation Partner.
Objective: Act as an encouraging French tutor focused on ${config.level} proficiency.
Context: ${config.topic || 'General Conversation'}.
Target Words: ${config.words.join(', ')}.

Rules:
1. Respond entirely in French.
2. Integrate target words naturally over time.
3. If using a word beyond ${config.level}, provide inline translation: word [meaning].
4. Keep responses short (1-3 sentences).
5. Do not correct mistakes immediately; model correct usage in your response.
6. Ask 1-2 questions at a time to keep conversation flowing.
7. If the user wants to stop, provide a short English summary of their performance.
`;

// --- Text Chat Service ---

export class GeminiChatService {
  private ai: GoogleGenAI;
  private chat: Chat | null = null;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async startChat(config: AppConfig) {
    this.chat = this.ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_TEMPLATE(config),
      },
    });
    
    // Initial greeting generation
    const response = await this.chat.sendMessage({ message: "Bonjour! Commençons." });
    return response.text;
  }

  async sendMessage(text: string) {
    if (!this.chat) throw new Error("Chat not initialized");
    const response = await this.chat.sendMessage({ message: text });
    return response.text;
  }
}

// --- Live API Service (Speech) ---

export class GeminiLiveService {
  private ai: GoogleGenAI;
  private sessionPromise: Promise<any> | null = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private stream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;

  public onVolumeChange: ((vol: number) => void) | null = null;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async connect(config: AppConfig, onDisconnect: () => void) {
    this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    // Output gain for volume control/analysis if needed
    const outputNode = this.outputAudioContext.createGain();
    outputNode.connect(this.outputAudioContext.destination);

    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    this.sessionPromise = this.ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } }, // Deep, calm voice suitable for a tutor
        },
        systemInstruction: SYSTEM_INSTRUCTION_TEMPLATE(config),
      },
      callbacks: {
        onopen: () => {
          console.log("Live Session Opened");
          this.startAudioInput();
        },
        onmessage: async (message: LiveServerMessage) => {
          const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (base64Audio && this.outputAudioContext) {
            this.playAudioResponse(base64Audio, outputNode);
          }
          
          const turnComplete = message.serverContent?.turnComplete;
          if (turnComplete) {
              // Could handle turn logic here if needed
          }
        },
        onclose: () => {
          console.log("Live Session Closed");
          onDisconnect();
        },
        onerror: (err) => {
          console.error("Live Session Error", err);
          onDisconnect();
        }
      }
    });
  }

  private startAudioInput() {
    if (!this.inputAudioContext || !this.stream || !this.sessionPromise) return;

    this.inputSource = this.inputAudioContext.createMediaStreamSource(this.stream);
    this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
    
    // Simple volume analyzer
    const analyzer = this.inputAudioContext.createAnalyser();
    analyzer.fftSize = 256;
    this.inputSource.connect(analyzer);
    const dataArray = new Uint8Array(analyzer.frequencyBinCount);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      
      // Calculate volume for UI visualization
      analyzer.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      if (this.onVolumeChange) this.onVolumeChange(average);

      const pcmBlob = createPcmBlob(inputData);
      
      this.sessionPromise!.then((session) => {
        session.sendRealtimeInput({ media: pcmBlob });
      });
    };

    this.inputSource.connect(this.processor);
    this.processor.connect(this.inputAudioContext.destination);
  }

  private async playAudioResponse(base64Audio: string, outputNode: AudioNode) {
    if (!this.outputAudioContext) return;

    this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
    
    const audioBuffer = await decodeAudioData(
      decode(base64Audio),
      this.outputAudioContext,
      24000,
      1
    );

    const source = this.outputAudioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(outputNode);
    
    source.addEventListener('ended', () => {
      this.sources.delete(source);
    });

    source.start(this.nextStartTime);
    this.nextStartTime += audioBuffer.duration;
    this.sources.add(source);
  }

  disconnect() {
    if (this.sessionPromise) {
        this.sessionPromise.then(s => s.close());
    }
    
    this.sources.forEach(s => s.stop());
    this.sources.clear();

    this.stream?.getTracks().forEach(t => t.stop());
    this.inputSource?.disconnect();
    this.processor?.disconnect();
    this.inputAudioContext?.close();
    this.outputAudioContext?.close();
    
    this.inputAudioContext = null;
    this.outputAudioContext = null;
    this.sessionPromise = null;
  }
}
