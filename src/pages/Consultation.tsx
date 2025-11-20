import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string;
}

interface ConsultationData {
  id: string;
  requesting_doctor_id: string;
  specialist_id: string;
  status: string;
  specialist_name: string;
  specialist_specialty: string;
  specialist_avatar: string;
}

const Consultation = () => {
  const { consultationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [consultation, setConsultation] = useState<ConsultationData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!consultationId || !user) return;

    const fetchConsultation = async () => {
      const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .eq('id', consultationId)
        .single();

      if (error) {
        console.error('Error fetching consultation:', error);
        toast({
          title: 'Error',
          description: 'Failed to load consultation',
          variant: 'destructive',
        });
        return;
      }

      // Fetch specialist profile separately
      const { data: specialistData } = await supabase
        .from('profiles')
        .select('full_name, specialty, avatar_url')
        .eq('user_id', data.specialist_id)
        .single();

      setConsultation({
        ...data,
        specialist_name: specialistData?.full_name || 'Unknown',
        specialist_specialty: specialistData?.specialty || 'Unknown',
        specialist_avatar: specialistData?.avatar_url || '',
      });
    };

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('consultation_messages')
        .select('*')
        .eq('consultation_id', consultationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      // Fetch sender profiles for all messages
      const messagesWithSenders = await Promise.all(
        data.map(async (msg) => {
          const { data: senderData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', msg.sender_id)
            .single();

          return {
            ...msg,
            sender_name: senderData?.full_name || 'Unknown',
            sender_avatar: senderData?.avatar_url || '',
          };
        })
      );

      setMessages(messagesWithSenders as Message[]);
      setLoading(false);
    };

    fetchConsultation();
    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`consultation-${consultationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'consultation_messages',
          filter: `consultation_id=eq.${consultationId}`,
        },
        async (payload) => {
          const { data: senderData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', payload.new.sender_id)
            .single();

          setMessages((prev) => [
            ...prev,
            {
              ...payload.new,
              sender_name: senderData?.full_name,
              sender_avatar: senderData?.avatar_url,
            } as Message,
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [consultationId, user, toast]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !consultationId) return;

    setSending(true);
    const { error } = await supabase.from('consultation_messages').insert({
      consultation_id: consultationId,
      sender_id: user.id,
      message: newMessage.trim(),
    });

    if (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } else {
      setNewMessage('');
    }
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="p-8 text-center">
          <p className="mb-4 text-muted-foreground">Consultation not found</p>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="border-b bg-card p-4">
        <div className="container mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar>
            <AvatarImage src={consultation.specialist_avatar} />
            <AvatarFallback>{consultation.specialist_name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="font-semibold">{consultation.specialist_name}</h2>
            <p className="text-sm text-muted-foreground">{consultation.specialist_specialty}</p>
          </div>
          <Badge variant={consultation.status === 'active' ? 'default' : 'secondary'}>
            {consultation.status}
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-muted/20 p-4">
        <div className="container mx-auto max-w-4xl space-y-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwnMessage = msg.sender_id === user?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={msg.sender_avatar} />
                    <AvatarFallback>{msg.sender_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      isOwnMessage
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-card-foreground'
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <p
                      className={`mt-1 text-xs ${
                        isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}
                    >
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t bg-card p-4">
        <div className="container mx-auto max-w-4xl flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1"
          />
          <Button onClick={handleSendMessage} disabled={sending || !newMessage.trim()}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Consultation;
