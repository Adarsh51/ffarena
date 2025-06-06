
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Key, Gamepad2, Clock, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Tournament {
  id: string;
  name: string;
  type: 'solo' | 'duo' | 'squad';
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  room_id: string | null;
  room_password: string | null;
}

export const PlayerTournamentCredentials = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchTournaments();
    
    // Set up real-time subscription for tournament updates
    const channel = supabase
      .channel('tournament-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tournaments'
        },
        (payload) => {
          console.log('Tournament updated:', payload);
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
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'ongoing':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'completed':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-black/40 backdrop-blur-md border border-white/20 text-white">
        <CardHeader>
          <CardTitle className="text-2xl text-white flex items-center gap-2">
            <Key className="w-6 h-6 text-orange-400" />
            Tournament Room Information
          </CardTitle>
          <p className="text-white/70">Real-time updates when room credentials are available</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tournaments.length === 0 ? (
              <div className="text-center py-8 text-white/60">
                <Gamepad2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No tournaments available at the moment</p>
              </div>
            ) : (
              tournaments.map((tournament) => (
                <Card key={tournament.id} className="bg-white/5 border border-white/10">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">{tournament.name}</h3>
                        <div className="flex items-center gap-3 text-sm text-white/70">
                          <Badge variant="outline" className="border-orange-500 text-orange-400 bg-orange-500/10">
                            {tournament.type.toUpperCase()}
                          </Badge>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {tournament.scheduled_date} at {tournament.scheduled_time}
                          </span>
                        </div>
                      </div>
                      <Badge className={`${getStatusColor(tournament.status)} capitalize`}>
                        {tournament.status}
                      </Badge>
                    </div>

                    {tournament.room_id && tournament.room_password ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-white/80">Room ID</label>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 p-3 bg-white/10 rounded-lg border border-white/20">
                              <code className="text-orange-400 font-mono">{tournament.room_id}</code>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => copyToClipboard(tournament.room_id!, 'Room ID')}
                              className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-white/80">Room Password</label>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 p-3 bg-white/10 rounded-lg border border-white/20">
                              <code className="text-orange-400 font-mono">{tournament.room_password}</code>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => copyToClipboard(tournament.room_password!, 'Room Password')}
                              className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-white/60">
                        <Key className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Room credentials will be available before the tournament starts</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
