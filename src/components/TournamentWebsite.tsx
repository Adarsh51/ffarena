import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/hooks/use-toast';
import { useFeaturedTournaments } from '@/hooks/useFeaturedTournaments';
import TournamentCard from './TournamentCard';
import { AdminWinnerForm } from './AdminWinnerForm';
import { PlayerStatsDashboard } from './PlayerStatsDashboard';
import { AdminFeaturedTournaments } from './AdminFeaturedTournaments';
import { RoomCredentials } from './RoomCredentials';
import { 
  Users, 
  Trophy, 
  Calendar, 
  Clock, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X,
  Settings,
  Star,
  Shield,
  Key
} from 'lucide-react';

interface Tournament {
  id: string;
  name: string;
  type: 'solo' | 'duo' | 'squad';
  scheduled_date: string;
  scheduled_time: string;
  entry_fee: number;
  prize_pool: number;
  max_participants: number;
  status: string;
  room_id: string | null;
  room_password: string | null;
  admin_notes: string | null;
}

interface TournamentRegistration {
  id: string;
  player_id: string;
  slot_time: string;
  tournament_type: 'solo' | 'duo' | 'squad';
  payment_status: string;
  created_at: string;
}

interface NewTournament {
  name: string;
  type: 'solo' | 'duo' | 'squad';
  scheduled_date: string;
  scheduled_time: string;
  entry_fee: number;
  prize_pool: number;
  max_participants: number;
}

const initialNewTournament: NewTournament = {
  name: '',
  type: 'solo',
  scheduled_date: new Date().toISOString().split('T')[0],
  scheduled_time: '20:00',
  entry_fee: 0,
  prize_pool: 0,
  max_participants: 50,
};

const TournamentWebsite = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [newTournament, setNewTournament] = useState<NewTournament>(initialNewTournament);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [isWinnerFormOpen, setIsWinnerFormOpen] = useState(false);
  const [isRoomCredentialsOpen, setIsRoomCredentialsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { featuredTournaments, featuredTemplates, loading: featuredLoading } = useFeaturedTournaments();

  useEffect(() => {
    fetchTournaments();
    fetchRegistrations();
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    const user = supabase.auth.getUser();
    if (!user) return;

    // Fetch the user's data from the players table
    const { data: playerData, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('clerk_user_id', (await user).data?.user?.id)
      .single();

    if (playerError) {
      console.error('Error fetching player data:', playerError);
      return;
    }

    // Check if the user exists and has the is_admin flag set to true
    setIsAdmin(playerData?.clerk_user_id === (await user).data?.user?.id);
  };

  const fetchTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('scheduled_date', { ascending: true });

      if (error) {
        console.error('Error fetching tournaments:', error);
        return;
      }

      setTournaments(data || []);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    }
  };

  const fetchRegistrations = async () => {
    const { data, error } = await supabase
      .from('tournament_registrations')
      .select('*');

    if (error) {
      console.error('Error fetching registrations:', error);
      return;
    }

    setRegistrations(data || []);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewTournament(prevState => ({
      ...prevState,
      [name]: name === 'entry_fee' || name === 'prize_pool' || name === 'max_participants' ? parseFloat(value) : value
    }));
  };

  const handleSelectChange = (value: string) => {
    setNewTournament(prevState => ({
      ...prevState,
      type: value as 'solo' | 'duo' | 'squad'
    }));
  };

  const addTournament = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .insert([newTournament]);

      if (error) {
        console.error('Error adding tournament:', error);
        toast({
          title: "Error",
          description: "Failed to create tournament. Please check the fields.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Tournament created successfully.",
      });

      fetchTournaments();
      setNewTournament(initialNewTournament);
    } catch (error) {
      console.error('Error adding tournament:', error);
      toast({
        title: "Error",
        description: "Failed to create tournament.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteTournament = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting tournament:', error);
        toast({
          title: "Error",
          description: "Failed to delete tournament.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Tournament deleted successfully.",
      });

      fetchTournaments();
    } catch (error) {
      console.error('Error deleting tournament:', error);
      toast({
        title: "Error",
        description: "Failed to delete tournament.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openRoomCredentials = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setIsRoomCredentialsOpen(true);
  };

  const closeRoomCredentials = () => {
    setIsRoomCredentialsOpen(false);
    setSelectedTournament(null);
  };

  const openWinnerForm = () => {
    setIsWinnerFormOpen(true);
  };

  const closeWinnerForm = () => {
    setIsWinnerFormOpen(false);
  };

  // Convert featured tournaments to match local Tournament interface
  const convertedFeaturedTournaments: Tournament[] = featuredTournaments.map(ft => ({
    id: ft.id,
    name: ft.name,
    type: ft.type as 'solo' | 'duo' | 'squad',
    scheduled_date: ft.scheduled_date,
    scheduled_time: ft.scheduled_time,
    entry_fee: ft.entry_fee,
    prize_pool: ft.prize_pool,
    max_participants: ft.max_participants,
    status: ft.status,
    room_id: ft.room_id || null,
    room_password: ft.room_password || null,
    admin_notes: ft.admin_notes || null
  }));

  return (
    <div className="container mx-auto py-10 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Tournament Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAdmin ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Add New Tournament</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input type="text" id="name" name="name" value={newTournament.name} onChange={handleInputChange} />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select onValueChange={handleSelectChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solo">Solo</SelectItem>
                      <SelectItem value="duo">Duo</SelectItem>
                      <SelectItem value="squad">Squad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="scheduled_date">Scheduled Date</Label>
                  <Input type="date" id="scheduled_date" name="scheduled_date" value={newTournament.scheduled_date} onChange={handleInputChange} />
                </div>
                <div>
                  <Label htmlFor="scheduled_time">Scheduled Time</Label>
                  <Input type="time" id="scheduled_time" name="scheduled_time" value={newTournament.scheduled_time} onChange={handleInputChange} />
                </div>
                <div>
                  <Label htmlFor="entry_fee">Entry Fee</Label>
                  <Input type="number" id="entry_fee" name="entry_fee" value={newTournament.entry_fee} onChange={handleInputChange} />
                </div>
                <div>
                  <Label htmlFor="prize_pool">Prize Pool</Label>
                  <Input type="number" id="prize_pool" name="prize_pool" value={newTournament.prize_pool} onChange={handleInputChange} />
                </div>
                <div>
                  <Label htmlFor="max_participants">Max Participants</Label>
                  <Input type="number" id="max_participants" name="max_participants" value={newTournament.max_participants} onChange={handleInputChange} />
                </div>
              </div>
              <Button onClick={addTournament} disabled={loading}>
                {loading ? 'Adding...' : 'Add Tournament'}
              </Button>
            </div>
          ) : (
            <p>Only admins can manage tournaments.</p>
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <AdminFeaturedTournaments />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Tournaments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tournaments.length === 0 ? (
            <p>No upcoming tournaments scheduled.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tournaments.map((tournament) => (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  registrations={registrations}
                  isAdmin={isAdmin}
                  onDelete={deleteTournament}
                  onOpenRoomCredentials={openRoomCredentials}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Featured Tournaments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {featuredLoading ? (
            <p>Loading featured tournaments...</p>
          ) : convertedFeaturedTournaments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {convertedFeaturedTournaments.map((tournament) => (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  registrations={registrations}
                  isAdmin={isAdmin}
                  onDelete={deleteTournament}
                  onOpenRoomCredentials={openRoomCredentials}
                />
              ))}
            </div>
          ) : (
            <p>No featured tournaments available.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
             Hall of Fame
          </CardTitle>
        </CardHeader>
        <CardContent>
           {isAdmin ? (
              <Button onClick={openWinnerForm}>Add Winner</Button>
           ) : null}
        </CardContent>
      </Card>

      {isAdmin && (
        <PlayerStatsDashboard />
      )}

      <AdminWinnerForm isOpen={isWinnerFormOpen} onClose={closeWinnerForm} />
      <RoomCredentials 
        isOpen={isRoomCredentialsOpen} 
        onClose={closeRoomCredentials} 
        tournament={selectedTournament}
        isAdminView={true}
      />
    </div>
  );
};

export default TournamentWebsite;
