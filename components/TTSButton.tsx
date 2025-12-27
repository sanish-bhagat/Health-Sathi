import React, { useState, useRef, useEffect } from 'react';
import { generateSpeech } from '../services/geminiService';

interface TTSButtonProps {
  text: string;
  label?: string;
}

export const TTSButton: React.FC<TTSButtonProps> = ({ text, label }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sourceRef.current) {
        sourceRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const playAudio = async () => {
    if (isPlaying) {
      // Stop functionality
      if (sourceRef.current) {
        sourceRef.current.stop();
        sourceRef.current = null;
      }
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);
    try {
      // 1. Get Base64 Audio from Gemini
      const base64Audio = await generateSpeech(text);

      // 2. Setup Audio Context
      if (!audioContextRef.current) {
        // Gemini TTS typically uses 24000Hz
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // 3. Manually Decode Raw PCM Data (Int16 -> Float32)
      // The API returns raw PCM, not a WAV/MP3 file, so standard decodeAudioData will fail.
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const buffer = new ArrayBuffer(len);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < len; i++) {
        view[i] = binaryString.charCodeAt(i);
      }

      const int16Data = new Int16Array(buffer);
      const audioBuffer = audioContextRef.current.createBuffer(1, int16Data.length, 24000);
      const channelData = audioBuffer.getChannelData(0);

      // Convert Int16 to Float32
      for (let i = 0; i < int16Data.length; i++) {
        channelData[i] = int16Data[i] / 32768.0;
      }

      // 4. Play
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        setIsPlaying(false);
        sourceRef.current = null;
      };

      source.start(0);
      sourceRef.current = source;
      setIsPlaying(true);

    } catch (error) {
      console.error("Playback failed:", error);
      alert("Could not play audio. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      onClick={playAudio}
      disabled={isLoading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
        isPlaying 
          ? 'bg-red-100 text-red-700 border border-red-200' 
          : 'bg-white text-slate-600 border border-slate-200 hover:border-teal-500 hover:text-teal-600'
      }`}
      title="Listen to guidance"
    >
      {isLoading ? (
        <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      ) : isPlaying ? (
         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
      ) : (
         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
      )}
      {isPlaying ? "Stop" : (label || "Listen")}
    </button>
  );
};