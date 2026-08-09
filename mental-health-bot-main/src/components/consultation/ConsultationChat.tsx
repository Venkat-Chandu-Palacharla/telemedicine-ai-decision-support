import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Send, 
  Paperclip, 
  Image as ImageIcon,
  File,
  X,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import FilePreview from './FilePreview';

interface ChatMessage {
  id: string;
  sender_id: string;
  sender_role: string;
  message: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  created_at: string;
}

interface ConsultationChatProps {
  appointmentId: string;
  participantName: string;
  participantAvatar?: string;
  isMinimized?: boolean;
  onClose?: () => void;
}

export default function ConsultationChat({ 
  appointmentId, 
  participantName,
  participantAvatar,
  isMinimized = false,
  onClose
}: ConsultationChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { user, role } = useAuth();
  const { toast } = useToast();

  // Fetch existing messages
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('consultation_messages')
        .select('*')
        .eq('appointment_id', appointmentId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
      } else {
        setMessages(data || []);
      }
    };

    fetchMessages();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`chat-${appointmentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'consultation_messages',
          filter: `appointment_id=eq.${appointmentId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [appointmentId]);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) return;
    if (!user || !role) return;

    setIsLoading(true);

    try {
      let fileUrl = null;
      let fileName = null;
      let fileType = null;

      // Upload file if selected
      if (selectedFile) {
        setIsUploading(true);
        const fileExt = selectedFile.name.split('.').pop();
        const filePath = `${appointmentId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('consultation-files')
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        // SECURITY FIX: Store the file path, not a public URL
        // Files will be accessed via signed URLs that respect RLS and expire
        fileUrl = filePath; // Store path, not public URL
        fileName = selectedFile.name;
        fileType = selectedFile.type;
        setIsUploading(false);
      }

      // Insert message
      const { error } = await supabase
        .from('consultation_messages')
        .insert({
          appointment_id: appointmentId,
          sender_id: user.id,
          sender_role: role,
          message: newMessage.trim() || null,
          file_url: fileUrl,
          file_name: fileName,
          file_type: fileType
        });

      if (error) throw error;

      setNewMessage('');
      setSelectedFile(null);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: 'File too large',
          description: 'Please select a file smaller than 10MB.',
          variant: 'destructive'
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const renderFilePreview = (message: ChatMessage) => {
    if (!message.file_url) return null;
    
    return (
      <FilePreview
        fileUrl={message.file_url}
        fileName={message.file_name}
        fileType={message.file_type}
      />
    );
  };

  if (isMinimized) {
    return null;
  }

  return (
    <div className="flex flex-col h-full bg-card rounded-lg border border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={participantAvatar} />
            <AvatarFallback>{participantName.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-sm">{participantName}</span>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.sender_id === user?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      isOwn
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {msg.message && <p className="text-sm">{msg.message}</p>}
                    {renderFilePreview(msg)}
                    <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Selected file preview */}
      {selectedFile && (
        <div className="px-3 py-2 border-t border-border bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {selectedFile.type.startsWith('image/') ? (
                <ImageIcon className="w-4 h-4 text-primary" />
              ) : (
                <File className="w-4 h-4 text-primary" />
              )}
              <span className="text-sm truncate max-w-[150px]">{selectedFile.name}</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={() => setSelectedFile(null)}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={isLoading}
          />
          <Button
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={handleSendMessage}
            disabled={isLoading || (!newMessage.trim() && !selectedFile)}
          >
            {isLoading || isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
