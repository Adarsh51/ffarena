
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface Tournament {
  id: string;
  name: string;
  type: string;
  scheduled_date: string;
  scheduled_time: string;
  prize_pool: number;
  entry_fee: number;
  max_participants: number;
  status: string;
}

export const useFeaturedTournaments = () => {
  const [featuredTournaments, setFeaturedTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedTournaments = async () => {
      try {
        const { data, error } = await supabase
          .from('featured_tournaments')
          .select(`
            tournaments:tournament_id (*)
          `)
          .eq('is_featured', true)
          .order('display_order', { ascending: true });

        if (error) throw error;

        const tournaments = data?.map(item => item.tournaments).filter(Boolean) || [];
        setFeaturedTournaments(tournaments);
      } catch (error) {
        console.error('Error fetching featured tournaments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedTournaments();

    // Set up real-time subscription
    const channel = supabase
      .channel('featured-tournaments-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'featured_tournaments'
        },
        () => {
          fetchFeaturedTournaments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { featuredTournaments, loading };
};
