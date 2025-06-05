
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Users, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TournamentWithCredentials {
  id: string;
  name: string;
  status: string;
  scheduled_date: string;
  scheduled_time: string;
  room_id?: string;
  room_password?: string;
  type: 'solo' | 'duo' | 'squad';
}

interface PlayerTournamentCredentialsProps {
  playerId: string;
}

export const PlayerTournamentCredentials: React.FC<PlayerTournamentCredentialsProps> = ({
  playerId
}) => {
  const [tournaments, setTournaments] = useState<TournamentWithCredentials[]>([]);
  const [registeredTournaments, setRegisteredTournaments] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchPlayerTournaments();

    // Set up real-time subscription for tournament updates
    const channel = supabase
      .channel('player-tournament-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tournaments'
        },
        () => {
          fetchPlayerTournaments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [playerId]);

  const fetchPlayerTournaments = async () => {
    try {
      // Get tournaments the player is registered for
      const { data: registrations, error: regError } = await supabase
        .from('tournament_registrations')
        .select('tournament_type')
        .eq('player_id', playerId)
        .eq('payment_status', 'completed');

      if (regError) throw regError;

      const tournamentTypes = registrations?.map(reg => reg.tournament_type) || [];
      setRegisteredTournaments(tournamentTypes);

      // Get tournament details for registered tournaments
      if (tournamentTypes.length > 0) {
        const { data: tournaments, error: tourError } = await supabase
          .from('tournaments')
          .select('*')
          .in('type', tournamentTypes)
          .in('status', ['upcoming', 'active']);

        if (tourError) throw tourError;
        setTournaments(tournaments || []);
      } else {
        setTournaments([]);
      }
    } catch (error) {
      console.error('Error fetching player tournaments:', error);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-500';
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-yellow-500';
    }
  };

  const tournamentsWithCredentials = tournaments.filter(t => t.room_id && t.room_password);

  if (tournamentsWithCredentials.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">No tournament credentials available yet.</p>
          <p className="text-sm text-gray-400 mt-2">
            Room credentials will appear here when tournaments are about to start.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white mb-4">Your Tournament Rooms</h3>
      {tournamentsWithCredentials.map((tournament) => (
        <Card key={tournament.id} className="border-green-200 dark:border-green-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-500" />
                <span>{tournament.name}</span>
              </CardTitle>
              <Badge className={`${getStatusColor(tournament.status)} text-white`}>
                {tournament.status.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
              <Clock className="h-4 w-4" />
              <span>{tournament.scheduled_date} at {tournament.scheduled_time}</span>
            </div>

            {tournament.status === 'active' && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-600 dark:text-green-300 font-medium mb-2">
                  🔴 Tournament is LIVE! Join the room now:
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Room ID</label>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono text-lg font-bold">{tournament.room_id}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(tournament.room_id!, 'Room ID')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Password</label>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono text-lg font-bold">{tournament.room_password}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(tournament.room_password!, 'Password')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Keep these credentials safe and join the room in Free Fire
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
