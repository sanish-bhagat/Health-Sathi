
import React, { useState, useRef } from 'react';

interface AudioRecorderProps {
  onAudioCaptured: (base64Audio: string) => void;
  compact?: boolean;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onAudioCaptured, compact = false }) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64String = reader.result as string;
          // Strip the "data:audio/wav;base64," prefix for the API
          const base64Content = base64String.split(',')[1];
          onAudioCaptured(base64Content);
        };
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sizeClass = compact ? 'w-10 h-10' : 'w-16 h-16';
  const iconSize = compact ? '18' : '24';

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`relative ${sizeClass} rounded-full flex items-center justify-center transition-all shadow-sm ${
          isRecording 
            ? 'bg-red-50 text-red-600 border-2 border-red-500 animate-pulse' 
            : 'bg-teal-50 text-teal-600 border border-teal-200 hover:border-teal-400 hover:bg-teal-100'
        }`}
        title={isRecording ? "Stop Recording" : "Start Recording"}
      >
        {isRecording ? (
          <svg xmlns="http://www.w3.org/2000/svg" width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
        )}
      </button>
      {!compact && (
        <span className="text-xs font-medium text-slate-500">
          {isRecording ? "Listening..." : "Tap to Speak"}
        </span>
      )}
    </div>
  );
};
