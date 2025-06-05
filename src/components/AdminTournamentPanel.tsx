
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Play, Save } from 'lucide-react';

interface Tournament {
  id: string;
  name: string;
  type: 'solo' | 'duo' | 'squad';
  status: string;
  scheduled_date: string;
  scheduled_time: string;
  room_id?: string;
  room_password?: string;
}

export const AdminTournamentPanel = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
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
    } finally {
      setLoading(false);
    }
  };

  const updateTournamentCredentials = async (tournamentId: string, roomId: string, roomPassword: string) => {
    try {
      const { error } = await supabase
        .from('tournaments')
        .update({ 
          room_id: roomId,
          room_password: roomPassword,
          updated_at: new Date().toISOString()
        })
        .eq('id', tournamentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Room credentials updated successfully",
      });

      fetchTournaments();
    } catch (error) {
      console.error('Error updating credentials:', error);
      toast({
        title: "Error",
        description: "Failed to update room credentials",
        variant: "destructive",
      });
    }
  };

  const markTournamentStarted = async (tournamentId: string) => {
    try {
      const tournament = tournaments.find(t => t.id === tournamentId);
      if (!tournament) return;

      // Update tournament status
      const { error: updateError } = await supabase
        .from('tournaments')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
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
        title: "Success",
        description: "Tournament marked as started",
      });

      fetchTournaments();
    } catch (error) {
      console.error('Error marking tournament as started:', error);
      toast({
        title: "Error",
        description: "Failed to mark tournament as started",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-white">Loading tournaments...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white mb-8">Admin Panel - Tournament Management</h2>
      
      {tournaments.map((tournament) => (
        <Card key={tournament.id} className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex justify-between items-center">
              <span>{tournament.name}</span>
              <span className={`px-3 py-1 rounded-full text-sm ${
                tournament.status === 'active' ? 'bg-green-500' : 
                tournament.status === 'completed' ? 'bg-gray-500' : 'bg-orange-500'
              }`}>
                {tournament.status}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`room-id-${tournament.id}`} className="text-gray-300">
                  Room ID
                </Label>
                <Input
                  id={`room-id-${tournament.id}`}
                  defaultValue={tournament.room_id || ''}
                  placeholder="Enter Room ID"
                  className="bg-gray-700 border-gray-600 text-white"
                  onBlur={(e) => {
                    const roomPassword = tournament.room_password || '';
                    if (e.target.value !== tournament.room_id) {
                      updateTournamentCredentials(tournament.id, e.target.value, roomPassword);
                    }
                  }}
                />
              </div>
              <div>
                <Label htmlFor={`room-password-${tournament.id}`} className="text-gray-300">
                  Room Password
                </Label>
                <Input
                  id={`room-password-${tournament.id}`}
                  defaultValue={tournament.room_password || ''}
                  placeholder="Enter Room Password"
                  className="bg-gray-700 border-gray-600 text-white"
                  onBlur={(e) => {
                    const roomId = tournament.room_id || '';
                    if (e.target.value !== tournament.room_password) {
                      updateTournamentCredentials(tournament.id, roomId, e.target.value);
                    }
                  }}
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  const roomIdInput = document.getElementById(`room-id-${tournament.id}`) as HTMLInputElement;
                  const roomPasswordInput = document.getElementById(`room-password-${tournament.id}`) as HTMLInputElement;
                  updateTournamentCredentials(tournament.id, roomIdInput.value, roomPasswordInput.value);
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Credentials
              </Button>
              
              {tournament.status === 'upcoming' && (
                <Button
                  onClick={() => markTournamentStarted(tournament.id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Mark as Started
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
