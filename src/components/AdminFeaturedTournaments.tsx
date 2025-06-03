
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/hooks/use-toast';
import { Trash2, Star } from 'lucide-react';

interface Tournament {
  id: string;
  name: string;
  type: string;
  scheduled_date: string;
  prize_pool: number;
}

interface FeaturedTournament {
  id: string;
  tournament_id: string;
  display_order: number;
  tournaments: Tournament;
}

export const AdminFeaturedTournaments = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [featuredTournaments, setFeaturedTournaments] = useState<FeaturedTournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTournaments();
    fetchFeaturedTournaments();

    // Set up real-time subscription for featured tournaments
    const channel = supabase
      .channel('featured-tournaments-changes')
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

  const fetchTournaments = async () => {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .order('scheduled_date', { ascending: true });

    if (error) {
      console.error('Error fetching tournaments:', error);
      return;
    }

    setTournaments(data || []);
  };

  const fetchFeaturedTournaments = async () => {
    const { data, error } = await supabase
      .from('featured_tournaments')
      .select(`
        *,
        tournaments:tournament_id (*)
      `)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching featured tournaments:', error);
      return;
    }

    setFeaturedTournaments(data || []);
  };

  const addFeaturedTournament = async () => {
    if (!selectedTournament) return;

    setLoading(true);
    try {
      const nextOrder = featuredTournaments.length;
      
      const { error } = await supabase
        .from('featured_tournaments')
        .insert({
          tournament_id: selectedTournament,
          display_order: nextOrder
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tournament added to featured list",
      });

      setSelectedTournament('');
    } catch (error) {
      console.error('Error adding featured tournament:', error);
      toast({
        title: "Error",
        description: "Failed to add featured tournament",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFeaturedTournament = async (id: string) => {
    try {
      const { error } = await supabase
        .from('featured_tournaments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tournament removed from featured list",
      });
    } catch (error) {
      console.error('Error removing featured tournament:', error);
      toast({
        title: "Error",
        description: "Failed to remove featured tournament",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Manage Featured Tournaments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-4">
          <Select value={selectedTournament} onValueChange={setSelectedTournament}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a tournament to feature" />
            </SelectTrigger>
            <SelectContent>
              {tournaments
                .filter(t => !featuredTournaments.some(ft => ft.tournament_id === t.id))
                .map((tournament) => (
                  <SelectItem key={tournament.id} value={tournament.id}>
                    {tournament.name} - {tournament.type} - ₹{tournament.prize_pool}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={addFeaturedTournament} 
            disabled={!selectedTournament || loading}
          >
            Add Featured
          </Button>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">Current Featured Tournaments:</h3>
          {featuredTournaments.length === 0 ? (
            <p className="text-muted-foreground">No featured tournaments yet</p>
          ) : (
            featuredTournaments.map((featured) => (
              <div key={featured.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <span className="font-medium">{featured.tournaments.name}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    {featured.tournaments.type} - ₹{featured.tournaments.prize_pool}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeFeaturedTournament(featured.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
