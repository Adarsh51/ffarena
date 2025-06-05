
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Play, Save, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Tournament {
  id: string;
  name: string;
  status: string;
  scheduled_date: string;
  scheduled_time: string;
  room_id?: string;
  room_password?: string;
  admin_notes?: string;
}

export const AdminTournamentPanel: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchTournaments();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('admin-tournaments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournaments'
        },
        () => {
          fetchTournaments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      setTournaments(data || []);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tournaments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTournamentCredentials = async (
    tournamentId: string,
    roomId: string,
    roomPassword: string,
    adminNotes: string
  ) => {
    try {
      const { error } = await supabase
        .from('tournaments')
        .update({
          room_id: roomId,
          room_password: roomPassword,
          admin_notes: adminNotes
        })
        .eq('id', tournamentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tournament credentials updated successfully"
      });
    } catch (error) {
      console.error('Error updating credentials:', error);
      toast({
        title: "Error",
        description: "Failed to update tournament credentials",
        variant: "destructive"
      });
    }
  };

  const startTournament = async (tournamentId: string) => {
    try {
      const tournament = tournaments.find(t => t.id === tournamentId);
      if (!tournament) return;

      // Update tournament status to active
      const { error: updateError } = await supabase
        .from('tournaments')
        .update({ status: 'active' })
        .eq('id', tournamentId);

      if (updateError) throw updateError;

      // Log the status change
      const { error: logError } = await supabase
        .from('tournament_status_log')
        .insert({
          tournament_id: tournamentId,
          old_status: tournament.status,
          new_status: 'active',
          changed_by: 'admin'
        });

      if (logError) throw logError;

      toast({
        title: "Tournament Started",
        description: `${tournament.name} has been marked as active`
      });
    } catch (error) {
      console.error('Error starting tournament:', error);
      toast({
        title: "Error",
        description: "Failed to start tournament",
        variant: "destructive"
      });
    }
  };

  const togglePasswordVisibility = (tournamentId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [tournamentId]: !prev[tournamentId]
    }));
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading tournaments...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Tournament Panel</h1>
        <Badge variant="outline" className="text-lg px-3 py-1">
          {tournaments.length} Tournaments
        </Badge>
      </div>

      <div className="grid gap-6">
        {tournaments.map((tournament) => (
          <TournamentAdminCard
            key={tournament.id}
            tournament={tournament}
            showPassword={showPasswords[tournament.id] || false}
            onTogglePassword={() => togglePasswordVisibility(tournament.id)}
            onUpdateCredentials={updateTournamentCredentials}
            onStartTournament={startTournament}
          />
        ))}
      </div>
    </div>
  );
};

interface TournamentAdminCardProps {
  tournament: Tournament;
  showPassword: boolean;
  onTogglePassword: () => void;
  onUpdateCredentials: (id: string, roomId: string, password: string, notes: string) => void;
  onStartTournament: (id: string) => void;
}

const TournamentAdminCard: React.FC<TournamentAdminCardProps> = ({
  tournament,
  showPassword,
  onTogglePassword,
  onUpdateCredentials,
  onStartTournament
}) => {
  const [roomId, setRoomId] = useState(tournament.room_id || '');
  const [roomPassword, setRoomPassword] = useState(tournament.room_password || '');
  const [adminNotes, setAdminNotes] = useState(tournament.admin_notes || '');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-500';
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-yellow-500';
    }
  };

  const canStart = tournament.status === 'upcoming';

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{tournament.name}</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge className={`${getStatusColor(tournament.status)} text-white`}>
              {tournament.status.toUpperCase()}
            </Badge>
            <span className="text-sm text-gray-500">
              {tournament.scheduled_date} at {tournament.scheduled_time}
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`room-id-${tournament.id}`}>Room ID</Label>
            <Input
              id={`room-id-${tournament.id}`}
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter room ID"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`room-password-${tournament.id}`}>Room Password</Label>
            <div className="flex">
              <Input
                id={`room-password-${tournament.id}`}
                type={showPassword ? 'text' : 'password'}
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
                placeholder="Enter room password"
                className="rounded-r-none"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={onTogglePassword}
                className="rounded-l-none border-l-0"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`admin-notes-${tournament.id}`}>Admin Notes</Label>
          <Textarea
            id={`admin-notes-${tournament.id}`}
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Internal notes for this tournament"
            rows={2}
          />
        </div>

        <div className="flex justify-between items-center pt-4">
          <Button
            onClick={() => onUpdateCredentials(tournament.id, roomId, roomPassword, adminNotes)}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>Save Credentials</span>
          </Button>

          {canStart && (
            <Button
              onClick={() => onStartTournament(tournament.id)}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
            >
              <Play className="h-4 w-4" />
              <span>Start Tournament</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
