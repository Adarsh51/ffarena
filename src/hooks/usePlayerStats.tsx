
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useUser } from '@clerk/clerk-react';

interface PlayerStats {
  tournaments_played: number;
  tournaments_won: number;
  total_earnings: number;
}

export const usePlayerStats = () => {
  const { user } = useUser();
  const [stats, setStats] = useState<PlayerStats>({
    tournaments_played: 0,
    tournaments_won: 0,
    total_earnings: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        // First get the player record
        const { data: player } = await supabase
          .from('players')
          .select('id')
          .eq('clerk_user_id', user.id)
          .single();

        if (player) {
          // Then get their stats
          const { data: playerStats } = await supabase
            .from('player_stats')
            .select('tournaments_played, tournaments_won, total_earnings')
            .eq('player_id', player.id)
            .single();

          if (playerStats) {
            setStats(playerStats);
          }
        }
      } catch (error) {
        console.error('Error fetching player stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Set up real-time subscription for stats updates
    const channel = supabase
      .channel('player-stats-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'player_stats'
        },
        async (payload) => {
          console.log('Stats updated:', payload);
          // Refetch stats when updated
          await fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { stats, loading };
};
