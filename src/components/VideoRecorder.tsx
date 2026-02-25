'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Video, StopCircle, RotateCcw, Play, Mic } from 'lucide-react';

interface VideoRecorderProps {
  onVideoChange: (dataUrl: string) => void;
  statementText: string;
}

export default function VideoRecorder({ onVideoChange, statementText }: VideoRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<'idle' | 'previewing' | 'recording' | 'recorded'>('idle');
  const [recordedUrl, setRecordedUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [error, setError] = useState('');

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [recordedUrl]);

  const startCamera = useCallback(async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.play();
      }
      setStatus('previewing');
    } catch {
      setError('Could not access camera/microphone. Please allow access and try again.');
    }
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    chunksRef.current = [];

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
      ? 'video/webm;codecs=vp8,opus'
      : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'video/mp4';

    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      setRecordedUrl(url);

      // Convert to data URL for storage
      const reader = new FileReader();
      reader.onload = () => {
        onVideoChange(reader.result as string);
      };
      reader.readAsDataURL(blob);

      // Stop camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }

      setStatus('recorded');
    };

    recorder.start(1000);
    setStatus('recording');
    setTimeElapsed(0);
    timerRef.current = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
  }, [onVideoChange]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const retake = useCallback(() => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    setRecordedUrl('');
    onVideoChange('');
    setStatus('idle');
    setTimeElapsed(0);
    setIsPlaying(false);
  }, [recordedUrl, onVideoChange]);

  const togglePlayback = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div>
      <label className="block text-sm font-medium text-brand-800 mb-1.5">
        <span className="flex items-center gap-1.5">
          <Video className="w-4 h-4 text-red-500" />
          Record Liability Statement *
        </span>
      </label>

      {/* Statement text to read */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3">
        <p className="text-xs font-semibold text-amber-800 mb-1">Read the following statement on camera:</p>
        <p className="text-sm text-amber-900 italic leading-relaxed">&ldquo;{statementText}&rdquo;</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Idle state - show start button */}
      {status === 'idle' && (
        <button
          onClick={startCamera}
          type="button"
          className="w-full py-8 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center gap-2 hover:border-red-400 hover:bg-red-50/50 transition-colors"
        >
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <Video className="w-6 h-6 text-red-500" />
          </div>
          <span className="text-sm font-medium text-gray-700">Tap to open camera</span>
          <span className="text-xs text-gray-400">You&apos;ll record yourself reading the statement above</span>
        </button>
      )}

      {/* Camera preview / recording */}
      {(status === 'previewing' || status === 'recording') && (
        <div className="relative rounded-xl overflow-hidden border border-gray-200">
          <video
            ref={videoRef}
            className="w-full aspect-video bg-black object-cover"
            playsInline
            muted
          />

          {/* Recording indicator */}
          {status === 'recording' && (
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 text-white px-3 py-1.5 rounded-full">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-mono font-bold">{formatTimer(timeElapsed)}</span>
            </div>
          )}

          {/* Audio indicator */}
          {status === 'recording' && (
            <div className="absolute top-3 right-3 bg-black/60 text-white px-2 py-1.5 rounded-full">
              <Mic className="w-4 h-4 text-green-400 animate-pulse" />
            </div>
          )}

          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
            {status === 'previewing' && (
              <button
                onClick={startRecording}
                type="button"
                className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-full font-medium shadow-lg hover:bg-red-700 transition-colors"
              >
                <div className="w-3 h-3 bg-white rounded-full" />
                Start Recording
              </button>
            )}
            {status === 'recording' && (
              <button
                onClick={stopRecording}
                type="button"
                className="flex items-center gap-2 bg-white text-red-600 px-5 py-2.5 rounded-full font-medium shadow-lg hover:bg-gray-100 transition-colors"
              >
                <StopCircle className="w-4 h-4" />
                Stop Recording
              </button>
            )}
          </div>
        </div>
      )}

      {/* Playback of recorded video */}
      {status === 'recorded' && recordedUrl && (
        <div className="space-y-2">
          <div className="relative rounded-xl overflow-hidden border border-green-300 bg-black">
            <video
              ref={videoRef}
              src={recordedUrl}
              className="w-full aspect-video object-cover"
              playsInline
              onEnded={() => setIsPlaying(false)}
            />
            <button
              onClick={togglePlayback}
              type="button"
              className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
            >
              {!isPlaying && (
                <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center">
                  <Play className="w-6 h-6 text-brand-900 ml-1" />
                </div>
              )}
            </button>
            <div className="absolute top-3 left-3 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <Video className="w-3 h-3" /> Recorded
            </div>
          </div>
          <button
            onClick={retake}
            type="button"
            className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-800 font-medium mx-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Re-record
          </button>
        </div>
      )}
    </div>
  );
}
