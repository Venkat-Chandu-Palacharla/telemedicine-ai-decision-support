import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  Monitor, 
  MessageSquare,
  Loader2,
  Users,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import ConsultationChat from '@/components/consultation/ConsultationChat';

interface VideoConsultationRoomProps {
  onBack: () => void;
}

interface WaitingPatient {
  id: string;
  patient_id: string;
  patient_name: string;
  scheduled_at: string;
  type: string;
}

export default function VideoConsultationRoom({ onBack }: VideoConsultationRoomProps) {
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [waitingPatients, setWaitingPatients] = useState<WaitingPatient[]>([]);
  const [currentPatient, setCurrentPatient] = useState<WaitingPatient | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch waiting appointments
  useEffect(() => {
    if (!user) return;

    const fetchAppointments = async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('id, patient_id, scheduled_at, type')
        .eq('doctor_id', user.id)
        .eq('status', 'scheduled')
        .eq('type', 'video')
        .order('scheduled_at', { ascending: true });

      if (error) {
        console.error('Error fetching appointments:', error);
      } else {
        // Enrich with patient names
        const enriched = await Promise.all(
          (data || []).map(async (apt) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', apt.patient_id)
              .maybeSingle();
            
            return {
              ...apt,
              patient_name: profile?.full_name || 'Patient'
            };
          })
        );
        setWaitingPatients(enriched);
      }
    };

    fetchAppointments();

    // Realtime subscription for new appointments
    const channel = supabase
      .channel('doctor-video-appointments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `doctor_id=eq.${user.id}`
        },
        () => {
          fetchAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isInCall) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isInCall]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast({
        title: 'Camera/Microphone Error',
        description: 'Unable to access your camera or microphone. Please check permissions.',
        variant: 'destructive'
      });
      return null;
    }
  }, [toast]);

  const startCall = async (patient: WaitingPatient) => {
    setIsConnecting(true);
    setCurrentPatient(patient);

    const stream = await startLocalStream();
    if (!stream) {
      setIsConnecting(false);
      return;
    }

    // Create peer connection
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    const pc = new RTCPeerConnection(configuration);
    peerConnectionRef.current = pc;

    // Add local tracks
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    // Handle remote stream
    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('ICE candidate:', event.candidate);
        // In a real implementation, send this to the signaling server
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setIsInCall(true);
        setIsConnecting(false);
        setCallDuration(0);
      }
    };

    // Create and set offer
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      // Simulate connection for demo purposes
      // In production, this would be handled by a signaling server
      setTimeout(() => {
        setIsInCall(true);
        setIsConnecting(false);
        setCallDuration(0);
        toast({
          title: 'Call Connected',
          description: `Connected with ${patient.patient_name}`
        });
      }, 2000);
    } catch (error) {
      console.error('Error creating offer:', error);
      toast({
        title: 'Connection Error',
        description: 'Failed to start the video call.',
        variant: 'destructive'
      });
      setIsConnecting(false);
    }
  };

  const endCall = async () => {
    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Update appointment status
    if (currentPatient && user) {
      await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', currentPatient.id);
    }

    setIsInCall(false);
    setCurrentPatient(null);
    setCallDuration(0);

    toast({
      title: 'Call Ended',
      description: 'The video consultation has been completed.'
    });
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  if (isInCall || isConnecting) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Video className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Video Consultation with {currentPatient?.patient_name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isConnecting ? 'Connecting...' : `Duration: ${formatDuration(callDuration)}`}
              </p>
            </div>
          </div>
          <Badge variant={isConnecting ? 'secondary' : 'default'} className="animate-pulse">
            {isConnecting ? 'Connecting' : 'Live'}
          </Badge>
        </div>

        <div className="grid lg:grid-cols-4 gap-4">
          {/* Main Video Area */}
          <div className={showChat ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <Card className="overflow-hidden">
              <div className="relative aspect-video bg-muted">
                {/* Remote Video (Patient) */}
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                
                {isConnecting && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                    <p className="text-foreground font-medium">Connecting to {currentPatient?.patient_name}...</p>
                  </div>
                )}

                {/* Local Video (Doctor) */}
                <div className="absolute bottom-4 right-4 w-48 aspect-video rounded-lg overflow-hidden border-2 border-background shadow-lg">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {isVideoOff && (
                    <div className="absolute inset-0 bg-muted flex items-center justify-center">
                      <VideoOff className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>

              {/* Call Controls */}
              <div className="p-4 flex items-center justify-center gap-4 bg-muted/50">
                <Button
                  variant={isMuted ? 'destructive' : 'outline'}
                  size="lg"
                  className="rounded-full w-14 h-14"
                  onClick={toggleMute}
                >
                  {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </Button>
                <Button
                  variant={isVideoOff ? 'destructive' : 'outline'}
                  size="lg"
                  className="rounded-full w-14 h-14"
                  onClick={toggleVideo}
                >
                  {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full w-14 h-14"
                >
                  <Monitor className="w-6 h-6" />
                </Button>
                <Button
                  variant={showChat ? 'default' : 'outline'}
                  size="lg"
                  className="rounded-full w-14 h-14"
                  onClick={() => setShowChat(!showChat)}
                >
                  <MessageSquare className="w-6 h-6" />
                </Button>
                <Button
                  variant="destructive"
                  size="lg"
                  className="rounded-full w-14 h-14"
                  onClick={endCall}
                >
                  <Phone className="w-6 h-6 rotate-135" />
                </Button>
              </div>
            </Card>
          </div>

          {/* Chat Panel */}
          {showChat && currentPatient && (
            <div className="h-[500px]">
              <ConsultationChat
                appointmentId={currentPatient.id}
                participantName={currentPatient.patient_name}
                onClose={() => setShowChat(false)}
              />
            </div>
          )}

          {/* Side Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Patient Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{currentPatient?.patient_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{currentPatient?.patient_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Scheduled: {currentPatient ? new Date(currentPatient.scheduled_at).toLocaleTimeString() : ''}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button variant="ghost" onClick={onBack} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
          <Video className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Video Consultations</h1>
          <p className="text-muted-foreground">Start video calls with your patients</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Waiting Patients
          </CardTitle>
          <CardDescription>Patients with scheduled video appointments</CardDescription>
        </CardHeader>
        <CardContent>
          {waitingPatients.length === 0 ? (
            <div className="text-center py-12">
              <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No video appointments scheduled</p>
              <p className="text-sm text-muted-foreground mt-1">
                Patients can book video consultations from their dashboard
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {waitingPatients.map(patient => (
                <div key={patient.id} className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${patient.patient_name}`} />
                      <AvatarFallback>{patient.patient_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{patient.patient_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Scheduled: {new Date(patient.scheduled_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => startCall(patient)}
                    className="gradient-primary text-white border-0"
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Start Call
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
