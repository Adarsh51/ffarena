
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePlayerStats } from '@/hooks/usePlayerStats';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Target, DollarSign, Key, Clock } from 'lucide-react';

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

export const PlayerStatsDashboard = () => {
  const { stats, loading } = usePlayerStats();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  useEffect(() => {
    fetchTournaments();
    
    // Set up real-time subscription for tournament updates
    const channel = supabase
      .channel('tournament-updates')
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
        .in('status', ['upcoming', 'active'])
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      setTournaments(data || []);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Player Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tournaments Played</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tournaments_played}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tournaments Won</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tournaments_won}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.total_earnings}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tournament Credentials Section */}
      {tournaments.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">Tournament Room Details</h3>
          {tournaments.map((tournament) => (
            <Card key={tournament.id} className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex justify-between items-center">
                  <span>{tournament.name}</span>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    tournament.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-orange-500'
                  }`}>
                    {tournament.status === 'active' ? 'LIVE NOW' : tournament.status}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tournament.room_id && (
                    <div className="flex items-center space-x-2">
                      <Key className="h-4 w-4 text-blue-400" />
                      <div>
                        <p className="text-sm text-gray-400">Room ID</p>
                        <p className="text-lg font-mono text-white bg-gray-700 px-3 py-1 rounded">
                          {tournament.room_id}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {tournament.room_password && (
                    <div className="flex items-center space-x-2">
                      <Key className="h-4 w-4 text-green-400" />
                      <div>
                        <p className="text-sm text-gray-400">Room Password</p>
                        <p className="text-lg font-mono text-white bg-gray-700 px-3 py-1 rounded">
                          {tournament.room_password}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                {!tournament.room_id && !tournament.room_password && (
                  <div className="flex items-center space-x-2 text-gray-400">
                    <Clock className="h-4 w-4" />
                    <p>Room credentials will be available before tournament starts</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
