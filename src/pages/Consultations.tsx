import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, MessageSquare, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ConsultationRow {
  id: string;
  status: string;
  created_at: string;
  requesting_doctor_id: string;
  specialist_id: string;
  counterpart_name: string;
  counterpart_specialty: string;
  counterpart_avatar: string;
  role: 'Requested by you' | 'Sent to you';
}

const Consultations = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState<ConsultationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchConsultations = async () => {
      const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error || !data) {
        console.error('Error loading consultations:', error);
        setLoading(false);
        return;
      }

      const rows = await Promise.all(
        data.map(async (c) => {
          const isRequester = c.requesting_doctor_id === user.id;
          const counterpartId = isRequester ? c.specialist_id : c.requesting_doctor_id;
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, specialty, avatar_url')
            .eq('user_id', counterpartId)
            .maybeSingle();

          return {
            ...c,
            counterpart_name: profile?.full_name || 'Unknown',
            counterpart_specialty: profile?.specialty || '',
            counterpart_avatar: profile?.avatar_url || '',
            role: isRequester ? 'Requested by you' : 'Sent to you',
          } as ConsultationRow;
        })
      );

      setConsultations(rows);
      setLoading(false);
    };

    fetchConsultations();
  }, [user, authLoading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-2 text-3xl font-bold">Consultations</h1>
        <p className="mb-8 text-muted-foreground">
          Cases you have shared with specialists, and cases shared with you.
        </p>

        {consultations.length === 0 ? (
          <Card className="p-10 text-center">
            <Users className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
            <p className="mb-4 text-muted-foreground">
              No consultations yet. Send an analysis to a specialist from the dashboard.
            </p>
            <Button asChild>
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {consultations.map((c) => (
              <Card key={c.id} className="flex items-center gap-4 p-4">
                <Avatar>
                  <AvatarImage src={c.counterpart_avatar} />
                  <AvatarFallback>{c.counterpart_name[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{c.counterpart_name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {c.counterpart_specialty || c.role} ·{' '}
                    {new Date(c.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={c.status === 'pending' ? 'secondary' : 'default'}>
                  {c.status}
                </Badge>
                <Button asChild size="sm">
                  <Link to={`/consultation/${c.id}`}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Open
                  </Link>
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Consultations;
