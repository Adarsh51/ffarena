
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

interface DatabaseFeaturedTournamentsProps {
  tournaments: Tournament[];
  featuredTournaments: FeaturedTournament[];
  selectedTournament: string;
  loading: boolean;
  onSelectedTournamentChange: (value: string) => void;
  onAddFeaturedTournament: () => void;
  onRemoveFeaturedTournament: (id: string) => void;
}

export const DatabaseFeaturedTournaments: React.FC<DatabaseFeaturedTournamentsProps> = ({
  tournaments,
  featuredTournaments,
  selectedTournament,
  loading,
  onSelectedTournamentChange,
  onAddFeaturedTournament,
  onRemoveFeaturedTournament
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Manage Database Featured Tournaments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-4">
          <Select value={selectedTournament} onValueChange={onSelectedTournamentChange}>
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
            onClick={onAddFeaturedTournament} 
            disabled={!selectedTournament || loading}
          >
            {loading ? 'Adding...' : 'Add Featured'}
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
                  onClick={() => onRemoveFeaturedTournament(featured.id)}
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
