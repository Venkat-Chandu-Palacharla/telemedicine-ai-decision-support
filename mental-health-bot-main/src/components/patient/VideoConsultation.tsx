import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff,
  Monitor,
  MessageSquare,
  Volume2,
  VolumeX,
  Clock,
  Users,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Maximize,
  Minimize,
  Circle,
  Signal,
  Wifi,
  WifiOff
} from 'lucide-react';
import { toast } from 'sonner';
import { mockDoctors } from '@/data/mockData';

type ConsultationState = 'idle' | 'joining' | 'waiting' | 'doctor-joining' | 'connected';

interface VideoConsultationProps {
  appointmentId?: string;
  doctorId?: string;
  onBack?: () => void;
}

const VideoConsultation: React.FC<VideoConsultationProps> = ({ appointmentId, doctorId, onBack }) => {
  const [consultationState, setConsultationState] = useState<ConsultationState>('idle');
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ sender: string; message: string; time: string }[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [waitingTime, setWaitingTime] = useState(0);
  const [waitingPosition, setWaitingPosition] = useState(1);
  const [connectionProgress, setConnectionProgress] = useState(0);
  
  // Enhanced features
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor'>('excellent');
  const [showSettings, setShowSettings] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const waitingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const qualityCheckRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const selectedDoctor = doctorId 
    ? mockDoctors.find(d => d.id === doctorId) 
    : mockDoctors[0];

  // Join waiting room
  const joinWaitingRoom = async () => {
    setConsultationState('joining');
    setConnectionProgress(0);

    try {
      // Request camera and microphone permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Simulate connection progress
      const progressInterval = setInterval(() => {
        setConnectionProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 20;
        });
      }, 300);

      // Enter waiting room after setup
      await new Promise(resolve => setTimeout(resolve, 2000));
      setConsultationState('waiting');
      
      // Start waiting timer
      waitingTimerRef.current = setInterval(() => {
        setWaitingTime(prev => prev + 1);
      }, 1000);

      toast.success('You have joined the waiting room');

      // Simulate doctor joining after random time (8-15 seconds for demo)
      const doctorJoinDelay = 8000 + Math.random() * 7000;
      setTimeout(() => {
        setConsultationState('doctor-joining');
        toast.info('Dr. ' + selectedDoctor?.name + ' is joining...');
        
        setTimeout(() => {
          startCall();
        }, 2000);
      }, doctorJoinDelay);

    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast.error('Could not access camera/microphone. Please check permissions.');
      setConsultationState('idle');
    }
  };

  // Start the actual call
  const startCall = async () => {
    if (waitingTimerRef.current) {
      clearInterval(waitingTimerRef.current);
    }

    setConsultationState('connected');

    // Start call timer
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    // Simulate receiving remote video (using local stream as simulation)
    if (localVideoRef.current?.srcObject && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = localVideoRef.current.srcObject;
    }

    toast.success('Connected to Dr. ' + selectedDoctor?.name);

    // Simulate doctor sending a message
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        sender: 'Doctor',
        message: 'Hello! How are you feeling today?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 3000);
  };

  const endCall = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (waitingTimerRef.current) {
      clearInterval(waitingTimerRef.current);
    }

    // Stop all tracks
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }

    setConsultationState('idle');
    setCallDuration(0);
    setWaitingTime(0);
    setChatMessages([]);
    toast.info('Call ended');
  };

  const leaveWaitingRoom = () => {
    if (waitingTimerRef.current) {
      clearInterval(waitingTimerRef.current);
    }

    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }

    setConsultationState('idle');
    setWaitingTime(0);
    toast.info('Left waiting room');
  };

  const toggleVideo = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoEnabled;
      });
    }
    setIsVideoEnabled(!isVideoEnabled);
  };

  const toggleAudio = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getAudioTracks().forEach(track => {
        track.enabled = !isAudioEnabled;
      });
    }
    setIsAudioEnabled(!isAudioEnabled);
  };

const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        });
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        
        setIsScreenSharing(true);
        toast.success('Screen sharing started');

        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
              if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
              }
            });
        };
      } catch (error) {
        console.error('Error sharing screen:', error);
        toast.error('Could not share screen');
      }
    } else {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setIsScreenSharing(false);
    }
  };

  const toggleFullscreen = () => {
    const container = document.getElementById('video-consultation-container');
    if (!container) return;
    
    if (!isFullscreen) {
      container.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      toast.success('Recording saved');
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: true
        });
        
        mediaRecorderRef.current = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9'
        });
        
        recordedChunksRef.current = [];
        
        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };
        
        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `consultation-${new Date().toISOString()}.webm`;
          a.click();
          URL.revokeObjectURL(url);
          stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorderRef.current.start();
        setIsRecording(true);
        toast.success('Recording started');
      } catch (error) {
        console.error('Error starting recording:', error);
        toast.error('Could not start recording');
      }
    }
  };

  // Monitor connection quality
  const startQualityMonitoring = () => {
    qualityCheckRef.current = setInterval(() => {
      // Simulate quality checks
      const qualities: ('excellent' | 'good' | 'poor')[] = ['excellent', 'excellent', 'excellent', 'good', 'poor'];
      setConnectionQuality(qualities[Math.floor(Math.random() * qualities.length)]);
    }, 5000);
  };

  const stopQualityMonitoring = () => {
    if (qualityCheckRef.current) {
      clearInterval(qualityCheckRef.current);
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    setChatMessages(prev => [...prev, {
      sender: 'You',
      message: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setNewMessage('');

    // Simulate doctor response
    setTimeout(() => {
      const responses = [
        "I understand. Can you tell me more about your symptoms?",
        "That's helpful to know. Have you experienced this before?",
        "I see. Let me make a note of that.",
        "Thank you for sharing. We'll discuss treatment options."
      ];
      setChatMessages(prev => [...prev, {
        sender: 'Doctor',
        message: responses[Math.floor(Math.random() * responses.length)],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 2000);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const localVideo = localVideoRef.current;
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (waitingTimerRef.current) {
        clearInterval(waitingTimerRef.current);
      }
      if (localVideo?.srcObject) {
        const stream = localVideo.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Render Waiting Room
  const renderWaitingRoom = () => (
    <div className="space-y-6">
      {/* Waiting Room Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
          <Clock className="h-4 w-4 animate-pulse" />
          <span className="text-sm font-medium">Waiting Room</span>
        </div>
        <h3 className="text-2xl font-semibold">Waiting for Dr. {selectedDoctor?.name}</h3>
        <p className="text-muted-foreground">
          Please stay on this page. The doctor will join shortly.
        </p>
      </div>

      {/* Video Preview */}
      <div className="relative aspect-video max-w-2xl mx-auto rounded-2xl overflow-hidden bg-black">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
        />
        {!isVideoEnabled && (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
            <VideoOff className="h-16 w-16 text-white/50" />
          </div>
        )}
        
        {/* Preview Controls */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleAudio}
            className={`rounded-full ${!isAudioEnabled ? 'bg-red-500 hover:bg-red-600' : 'bg-white/10 hover:bg-white/20'} text-white`}
          >
            {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleVideo}
            className={`rounded-full ${!isVideoEnabled ? 'bg-red-500 hover:bg-red-600' : 'bg-white/10 hover:bg-white/20'} text-white`}
          >
            {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Waiting Status */}
      <div className="max-w-md mx-auto space-y-6">
        <Card className="border-border/50">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Waiting time</p>
                  <p className="text-lg font-semibold">{formatDuration(waitingTime)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-500/10">
                  <Users className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Queue position</p>
                  <p className="text-lg font-semibold">#{waitingPosition}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Camera and microphone ready</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Connection established</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                <span>Waiting for doctor to join...</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Doctor Info */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
          <Avatar className="h-14 w-14 border-2 border-primary/20">
            <AvatarImage src={selectedDoctor?.avatar} />
            <AvatarFallback>{selectedDoctor?.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-medium">Dr. {selectedDoctor?.name}</p>
            <p className="text-sm text-muted-foreground">{selectedDoctor?.specialty}</p>
          </div>
          <Badge variant="outline" className="border-amber-500/50 text-amber-600">
            Joining soon
          </Badge>
        </div>

        <Button 
          variant="outline" 
          className="w-full" 
          onClick={leaveWaitingRoom}
        >
          Leave Waiting Room
        </Button>
      </div>
    </div>
  );

  // Render Doctor Joining State
  const renderDoctorJoining = () => (
    <div className="text-center py-12 space-y-6">
      <div className="relative inline-block">
        <Avatar className="h-32 w-32 border-4 border-green-500/50 animate-pulse">
          <AvatarImage src={selectedDoctor?.avatar} />
          <AvatarFallback className="text-3xl bg-primary/10">
            {selectedDoctor?.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
          <Badge className="bg-green-500 animate-pulse">Joining...</Badge>
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-semibold">Dr. {selectedDoctor?.name} is joining</h3>
        <p className="text-muted-foreground mt-2">Your consultation will begin in a moment...</p>
      </div>
      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
    </div>
  );

  // Render Pre-call / Idle State
  const renderIdleState = () => (
    <div className="text-center py-12 space-y-8">
      <div className="flex justify-center">
        <div className="relative">
          <Avatar className="h-32 w-32 border-4 border-primary/20">
            <AvatarImage src={selectedDoctor?.avatar} />
            <AvatarFallback className="text-3xl bg-primary/10">
              {selectedDoctor?.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-500">
            Available
          </Badge>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-2xl font-semibold">Dr. {selectedDoctor?.name}</h3>
        <p className="text-muted-foreground">{selectedDoctor?.specialty}</p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>⭐ {selectedDoctor?.rating}</span>
          <span>•</span>
          <span>{selectedDoctor?.experience} years exp.</span>
        </div>
      </div>

      <div className="bg-muted/50 rounded-xl p-6 max-w-md mx-auto">
        <h4 className="font-medium mb-3">Before you start:</h4>
        <ul className="text-sm text-muted-foreground space-y-2 text-left">
          <li className="flex items-center gap-2">
            <Video className="h-4 w-4 text-primary" />
            Ensure your camera is working
          </li>
          <li className="flex items-center gap-2">
            <Mic className="h-4 w-4 text-primary" />
            Check your microphone
          </li>
          <li className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-primary" />
            Find a quiet, well-lit space
          </li>
        </ul>
      </div>

      <div className="space-y-3">
        <Button 
          size="lg" 
          onClick={joinWaitingRoom}
          className="px-12 py-6 text-lg rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
        >
          <Users className="h-5 w-5 mr-2" />
          Join Waiting Room
        </Button>
        <p className="text-sm text-muted-foreground">
          You'll be connected when the doctor is ready
        </p>
      </div>
    </div>
  );

  // Render Joining State
  const renderJoiningState = () => (
    <div className="text-center py-12 space-y-6">
      <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary" />
      <div>
        <h3 className="text-xl font-semibold">Setting up your connection...</h3>
        <p className="text-muted-foreground mt-2">Please allow camera and microphone access</p>
      </div>
      <div className="max-w-xs mx-auto">
        <Progress value={connectionProgress} className="h-2" />
        <p className="text-sm text-muted-foreground mt-2">{connectionProgress}% complete</p>
      </div>
    </div>
  );

// Render Connected State (In-call)
  const renderConnectedState = () => (
    <div className="space-y-4" id="video-consultation-container">
      {/* Video Grid */}
      <div className="relative aspect-video bg-black rounded-2xl overflow-hidden">
        {/* Remote Video (Doctor) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* Call Duration */}
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-white font-mono">{formatDuration(callDuration)}</span>
        </div>

        {/* Connection Quality Indicator */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2">
          {connectionQuality === 'excellent' && <Wifi className="h-4 w-4 text-green-500" />}
          {connectionQuality === 'good' && <Wifi className="h-4 w-4 text-yellow-500" />}
          {connectionQuality === 'poor' && <WifiOff className="h-4 w-4 text-red-500" />}
          <span className={`text-xs ${
            connectionQuality === 'excellent' ? 'text-green-500' : 
            connectionQuality === 'good' ? 'text-yellow-500' : 'text-red-500'
          }`}>
            {connectionQuality.charAt(0).toUpperCase() + connectionQuality.slice(1)}
          </span>
        </div>

        {/* Recording Indicator */}
        {isRecording && (
          <div className="absolute top-4 right-4 bg-red-500 px-3 py-1.5 rounded-full flex items-center gap-2">
            <Circle className="h-3 w-3 text-white animate-pulse fill-white" />
            <span className="text-white text-xs font-medium">REC</span>
          </div>
        )}

        {/* Doctor Info Overlay */}
        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full">
          <span className="text-white text-sm">Dr. {selectedDoctor?.name}</span>
        </div>

        {/* Local Video (Patient) */}
        <div className="absolute bottom-4 right-4 w-48 aspect-video rounded-xl overflow-hidden border-2 border-white/20 shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
          {!isVideoEnabled && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <VideoOff className="h-8 w-8 text-white/50" />
            </div>
          )}
        </div>

        {/* Controls Overlay */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/50 backdrop-blur-sm px-6 py-3 rounded-full flex-wrap justify-center max-w-[90%]">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleAudio}
            className={`rounded-full ${!isAudioEnabled ? 'bg-red-500 hover:bg-red-600' : 'bg-white/10 hover:bg-white/20'} text-white`}
          >
            {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleVideo}
            className={`rounded-full ${!isVideoEnabled ? 'bg-red-500 hover:bg-red-600' : 'bg-white/10 hover:bg-white/20'} text-white`}
          >
            {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleScreenShare}
            className={`rounded-full ${isScreenSharing ? 'bg-primary hover:bg-primary/90' : 'bg-white/10 hover:bg-white/20'} text-white`}
          >
            <Monitor className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleRecording}
            className={`rounded-full ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-white/10 hover:bg-white/20'} text-white`}
            title={isRecording ? 'Stop Recording' : 'Start Recording'}
          >
            <Circle className={`h-5 w-5 ${isRecording ? 'fill-white animate-pulse' : ''}`} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="rounded-full bg-white/10 hover:bg-white/20 text-white"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSpeakerEnabled(!isSpeakerEnabled)}
            className={`rounded-full ${!isSpeakerEnabled ? 'bg-red-500 hover:bg-red-600' : 'bg-white/10 hover:bg-white/20'} text-white`}
          >
            {isSpeakerEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowChat(!showChat)}
            className={`rounded-full ${showChat ? 'bg-primary hover:bg-primary/90' : 'bg-white/10 hover:bg-white/20'} text-white relative`}
          >
            <MessageSquare className="h-5 w-5" />
            {chatMessages.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center">
                {chatMessages.length}
              </span>
            )}
          </Button>

          <div className="w-px h-8 bg-white/20" />

          <Button
            variant="ghost"
            size="icon"
            onClick={endCall}
            className="rounded-full bg-red-500 hover:bg-red-600 text-white"
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Chat Panel */}
      {showChat && (
        <Card className="border border-border/50">
          <CardHeader className="py-3 px-4 border-b">
            <CardTitle className="text-sm">Chat</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-48 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.sender === 'You' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                      msg.sender === 'You'
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">{msg.time}</span>
                </div>
              ))}
            </div>
            <div className="p-3 border-t flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-muted rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <Button size="sm" onClick={sendMessage} className="rounded-full">
                Send
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        {onBack && consultationState === 'idle' && (
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        )}

        <Card className="border-none shadow-xl bg-gradient-to-br from-card to-secondary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 rounded-xl bg-primary/10">
                <Video className="h-6 w-6 text-primary" />
              </div>
              Video Consultation
            </CardTitle>
            <CardDescription>
              {consultationState === 'waiting' 
                ? 'You are in the waiting room' 
                : consultationState === 'connected'
                ? 'In consultation with your doctor'
                : 'Connect with your doctor through secure video call'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {consultationState === 'idle' && renderIdleState()}
            {consultationState === 'joining' && renderJoiningState()}
            {consultationState === 'waiting' && renderWaitingRoom()}
            {consultationState === 'doctor-joining' && renderDoctorJoining()}
            {consultationState === 'connected' && renderConnectedState()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VideoConsultation;
