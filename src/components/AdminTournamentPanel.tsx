
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Gamepad2, Key, Play } from 'lucide-react';

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

export const AdminTournamentPanel = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [roomId, setRoomId] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchTournaments();
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

  const updateRoomCredentials = async () => {
    if (!selectedTournament || !roomId || !roomPassword) {
      toast({
        title: "Error",
        description: "Please select a tournament and enter room credentials",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('tournaments')
        .update({
          room_id: roomId,
          room_password: roomPassword,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTournament);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Room credentials updated successfully",
      });

      // Reset form and refresh tournaments
      setRoomId('');
      setRoomPassword('');
      setSelectedTournament('');
      fetchTournaments();
    } catch (error) {
      console.error('Error updating room credentials:', error);
      toast({
        title: "Error",
        description: "Failed to update room credentials",
        variant: "destructive",
      });
    }
  };

  const markTournamentStarted = async (tournamentId: string) => {
    try {
      const { error } = await supabase
        .from('tournaments')
        .update({
          status: 'ongoing',
          updated_at: new Date().toISOString()
        })
        .eq('id', tournamentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tournament marked as started",
      });

      fetchTournaments();
    } catch (error) {
      console.error('Error updating tournament status:', error);
      toast({
        title: "Error",
        description: "Failed to update tournament status",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-black/40 backdrop-blur-md border border-white/20 text-white">
        <CardHeader>
          <CardTitle className="text-xl text-white flex items-center gap-2">
            <Key className="w-5 h-5" />
            Room Credentials Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-white">Select Tournament</Label>
              <select
                value={selectedTournament}
                onChange={(e) => setSelectedTournament(e.target.value)}
                className="w-full p-2 bg-white/10 border border-white/20 rounded-md text-white"
              >
                <option value="">Choose a tournament</option>
                {tournaments.map((tournament) => (
                  <option key={tournament.id} value={tournament.id} className="bg-gray-800">
                    {tournament.name} - {tournament.type}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="room-id" className="text-white">Room ID</Label>
              <Input
                id="room-id"
                placeholder="Enter Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="room-password" className="text-white">Room Password</Label>
              <Input
                id="room-password"
                placeholder="Enter Room Password"
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
          </div>
          <Button 
            onClick={updateRoomCredentials}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold"
            disabled={!selectedTournament || !roomId || !roomPassword}
          >
            Update Room Credentials
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-black/40 backdrop-blur-md border border-white/20 text-white">
        <CardHeader>
          <CardTitle className="text-xl text-white flex items-center gap-2">
            <Play className="w-5 h-5" />
            Tournament Status Control
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tournaments.map((tournament) => (
              <div key={tournament.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center gap-4">
                  <Gamepad2 className="w-5 h-5 text-orange-400" />
                  <div>
                    <p className="font-medium">{tournament.name}</p>
                    <p className="text-sm text-white/70">
                      {tournament.type.toUpperCase()} | {tournament.scheduled_date} at {tournament.scheduled_time}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge 
                    variant={tournament.status === 'upcoming' ? 'default' : tournament.status === 'ongoing' ? 'destructive' : 'secondary'}
                    className="capitalize"
                  >
                    {tournament.status}
                  </Badge>
                  {tournament.status === 'upcoming' && (
                    <Button
                      onClick={() => markTournamentStarted(tournament.id)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Start Tournament
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
