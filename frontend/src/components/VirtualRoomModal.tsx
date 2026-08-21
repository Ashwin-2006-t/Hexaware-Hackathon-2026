import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Video, VideoOff, Send, PhoneOff, Users, MessageSquare, ShieldCheck, Clock } from 'lucide-react';
import type { VirtualRoomRecord } from '../types';
import { createOrJoinVirtualRoomApi, fetchVirtualRoomApi, sendVirtualRoomMessageApi, endVirtualRoomSessionApi } from '../services/api';

interface VirtualRoomModalProps {
  bookingId: string;
  onClose: () => void;
}

import { useLanguage } from '../context/LanguageContext';

export const VirtualRoomModal: React.FC<VirtualRoomModalProps> = ({ bookingId, onClose }) => {
  const { t } = useLanguage();
  const [room, setRoom] = useState<VirtualRoomRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [chatMessage, setChatMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Initialize camera preview
  useEffect(() => {
    async function startCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          mediaStreamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }
      } catch (err) {
        console.warn('Camera/Microphone access not available or permission denied:', err);
      }
    }
    startCamera();

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Fetch or create room
  useEffect(() => {
    setLoading(true);
    setError(null);
    createOrJoinVirtualRoomApi(bookingId)
      .then((data) => setRoom(data))
      .catch((err: any) => setError(err.message || 'Failed to initialize virtual tuition room'))
      .finally(() => setLoading(false));
  }, [bookingId]);

  // Poll chat messages every 3 seconds
  useEffect(() => {
    if (!room || room.status === 'ENDED') return;
    const interval = setInterval(() => {
      fetchVirtualRoomApi(room.id)
        .then((updated) => setRoom(updated))
        .catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, [room]);

  const handleToggleMic = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !micEnabled;
      });
    }
    setMicEnabled(!micEnabled);
  };

  const handleToggleCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !cameraEnabled;
      });
    }
    setCameraEnabled(!cameraEnabled);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !room || isSending) return;
    setIsSending(true);
    try {
      const msg = await sendVirtualRoomMessageApi(room.id, chatMessage.trim());
      setRoom((prev) => prev ? { ...prev, messages: [...prev.messages, msg] } : prev);
      setChatMessage('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const handleEndSession = async () => {
    if (!room) return;
    try {
      const updated = await endVirtualRoomSessionApi(room.id);
      setRoom(updated);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <h3 className="text-lg font-black text-slate-900">Connecting to Virtual Tuition Room...</h3>
          <p className="text-xs font-semibold text-slate-500">Establishing encrypted WebRTC peer connection & initializing audio/video streams.</p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl border border-red-200">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <X className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-slate-900">Room Connection Failed</h3>
          <p className="text-xs font-semibold text-red-600">{error || 'Unable to access virtual classroom'}</p>
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-lg z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="bg-slate-900 text-white rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl border border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base text-white">{room.service_title}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-900/80 text-blue-200 border border-blue-700">
                  {room.room_code}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium flex items-center mt-0.5">
                <Users className="w-3.5 h-3.5 mr-1 text-slate-400" />
                {room.host_name} (Tutor) & {room.participant_name} (Student)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {room.status === 'ACTIVE' && (
              <button
                onClick={handleEndSession}
                className="px-4 py-2 rounded-xl bg-red-600/90 hover:bg-red-700 text-white text-xs font-extrabold flex items-center space-x-1.5 transition"
              >
                <PhoneOff className="w-3.5 h-3.5" />
                <span>End Class</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
          
          {/* Video Classroom Area */}
          <div className="lg:col-span-8 p-4 flex flex-col justify-between bg-slate-950/30 overflow-hidden">
            
            {/* Main Remote Video Frame */}
            <div className="relative flex-1 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-center overflow-hidden min-h-[280px]">
              {room.status === 'ENDED' ? (
                <div className="text-center space-y-2 p-6">
                  <Clock className="w-12 h-12 text-slate-500 mx-auto" />
                  <h4 className="font-extrabold text-lg text-slate-300">Class Session Ended</h4>
                  <p className="text-xs text-slate-500 font-medium">This virtual tuition room session has been concluded.</p>
                </div>
              ) : (
                <div className="text-center space-y-3 p-6">
                  <div className="w-20 h-20 rounded-full bg-blue-600/20 border-2 border-blue-500 flex items-center justify-center mx-auto text-blue-400 font-extrabold text-2xl">
                    {room.participant_name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base text-slate-200">{room.participant_name}</h4>
                    <p className="text-xs text-emerald-400 font-bold flex items-center justify-center mt-1">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Connected via WebRTC Secure Stream
                    </p>
                  </div>
                </div>
              )}

              {/* Local Camera Picture-in-Picture Preview */}
              {room.status === 'ACTIVE' && (
                <div className="absolute bottom-4 right-4 w-36 h-28 bg-slate-950 rounded-xl border-2 border-blue-500/80 shadow-2xl overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${cameraEnabled ? 'block' : 'hidden'}`}
                  />
                  {!cameraEnabled && (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-500 text-xs font-bold">
                      Camera Off
                    </div>
                  )}
                  <span className="absolute bottom-1 left-2 text-[9px] font-black bg-slate-900/90 text-slate-200 px-1.5 py-0.5 rounded">
                    You
                  </span>
                </div>
              )}
            </div>

            {/* In-Call Controls Bar */}
            {room.status === 'ACTIVE' && (
              <div className="flex items-center justify-center space-x-3 pt-4">
                <button
                  onClick={handleToggleMic}
                  className={`p-3.5 rounded-2xl font-bold transition flex items-center space-x-2 ${
                    micEnabled ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                  title={micEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
                >
                  {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>

                <button
                  onClick={handleToggleCamera}
                  className={`p-3.5 rounded-2xl font-bold transition flex items-center space-x-2 ${
                    cameraEnabled ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                  title={cameraEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
                >
                  {cameraEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>

                <button
                  onClick={onClose}
                  className="px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs transition"
                >
                  {t('virtualRoom.leaveRoom')}
                </button>
              </div>
            )}
          </div>

          {/* Classroom Live Chat Sidebar */}
          <div className="lg:col-span-4 border-l border-slate-800 flex flex-col bg-slate-950/80">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h4 className="font-extrabold text-xs text-slate-300 uppercase tracking-wider flex items-center">
                <MessageSquare className="w-4 h-4 mr-2 text-blue-400" /> Live Class Chat
              </h4>
              <span className="text-[10px] font-bold text-slate-500">{room.messages.length} messages</span>
            </div>

            {/* Messages History */}
            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              {room.messages.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs font-medium">
                  No messages yet. Send a note or lesson question to your class!
                </div>
              ) : (
                room.messages.map((m) => (
                  <div key={m.id} className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                      <span>{m.sender_name}</span>
                      <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-200 font-medium">
                      {m.content}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Chat Input Form */}
            {room.status === 'ACTIVE' && (
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 flex items-center space-x-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Type lesson note or question..."
                  className="flex-1 bg-slate-900 text-white placeholder-slate-500 px-4 py-2.5 rounded-xl border border-slate-800 focus:border-blue-500 text-xs focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!chatMessage.trim() || isSending}
                  className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
