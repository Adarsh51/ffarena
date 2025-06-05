
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, DollarSign, Calendar, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PlayerTournamentCredentials } from './PlayerTournamentCredentials';

interface PlayerStats {
  tournaments_played: number;
  tournaments_won: number;
  total_earnings: number;
}

interface Player {
  id: string;
  username: string;
  in_game_name: string;
  free_fire_uid: string;
}

export const PlayerStatsDashboard: React.FC = () => {
  const [player, setPlayer] = useState<Player | null>(null);
  const [stats, setStats] = useState<PlayerStats>({
    tournaments_played: 0,
    tournaments_won: 0,
    total_earnings: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlayerData();
  }, []);

  const fetchPlayerData = async () => {
    try {
      // This would be replaced with actual auth logic to get current user
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('*')
        .limit(1)
        .single();

      if (playerError) throw playerError;
      setPlayer(playerData);

      // Fetch player stats
      const { data: statsData, error: statsError } = await supabase
        .from('player_stats')
        .select('*')
        .eq('player_id', playerData.id)
        .single();

      if (statsError && statsError.code !== 'PGRST116') {
        throw statsError;
      }

      if (statsData) {
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching player data:', error);
    } finally {
      setLoading(false);
    }
  };

  const winRate = stats.tournaments_played > 0 
    ? ((stats.tournaments_won / stats.tournaments_played) * 100).toFixed(1)
    : '0.0';

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-white text-xl">Loading dashboard...</div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="text-center py-12">
        <div className="text-white text-xl mb-4">Player not found</div>
        <p className="text-gray-300">Please log in to view your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Player Info Card */}
      <Card className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Users className="h-6 w-6" />
            <span>Player Profile</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-300">Username</p>
              <p className="text-xl font-bold">{player.username}</p>
            </div>
            <div>
              <p className="text-gray-300">In-Game Name</p>
              <p className="text-xl font-bold">{player.in_game_name || 'Not set'}</p>
            </div>
            <div>
              <p className="text-gray-300">Free Fire UID</p>
              <p className="text-xl font-bold">{player.free_fire_uid || 'Not set'}</p>
            </div>
            <div>
              <p className="text-gray-300">Win Rate</p>
              <p className="text-xl font-bold text-green-400">{winRate}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-900/50 to-blue-700/50 border-blue-500/20">
          <CardContent className="p-6 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-blue-400" />
            <p className="text-3xl font-bold text-white mb-2">{stats.tournaments_played}</p>
            <p className="text-blue-200">Tournaments Played</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900/50 to-green-700/50 border-green-500/20">
          <CardContent className="p-6 text-center">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-green-400" />
            <p className="text-3xl font-bold text-white mb-2">{stats.tournaments_won}</p>
            <p className="text-green-200">Tournaments Won</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-900/50 to-yellow-700/50 border-yellow-500/20">
          <CardContent className="p-6 text-center">
            <DollarSign className="h-12 w-12 mx-auto mb-4 text-yellow-400" />
            <p className="text-3xl font-bold text-white mb-2">₹{stats.total_earnings}</p>
            <p className="text-yellow-200">Total Earnings</p>
          </CardContent>
        </Card>
      </div>

      {/* Tournament Credentials Section */}
      <PlayerTournamentCredentials playerId={player.id} />
    </div>
  );
};
