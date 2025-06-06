
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Clock, Users, Trophy, DollarSign, Calendar, Gamepad2 } from 'lucide-react';
import { TournamentTimer } from './TournamentTimer';
import { RoomCredentials } from './RoomCredentials';
import { AdminWinnerForm } from './AdminWinnerForm';
import { AdminFeaturedTournaments } from './AdminFeaturedTournaments';
import { AdminTournamentPanel } from './AdminTournamentPanel';
import { PlayerTournamentCredentials } from './PlayerTournamentCredentials';

interface Tournament {
  id: string;
  name: string;
  type: 'solo' | 'duo' | 'squad';
  scheduled_date: string;
  scheduled_time: string;
  prize_pool: number;
  entry_fee: number;
  max_participants: number;
  status: string;
  room_id: string | null;
  room_password: string | null;
  admin_notes: string | null;
}

interface TournamentRegistration {
  id: string;
  player_id: string;
  tournament_type: 'solo' | 'duo' | 'squad';
  slot_time: string;
  payment_status: string | null;
  player: {
    username: string;
    in_game_name: string | null;
  } | null;
}

interface AdminFormState {
  name: string;
  type: 'solo' | 'duo' | 'squad';
  scheduled_date: string;
  scheduled_time: string;
  prize_pool: number;
  entry_fee: number;
  max_participants: number;
  admin_notes: string;
}

const TournamentWebsite = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [tournamentType, setTournamentType] = useState<'solo' | 'duo' | 'squad'>('solo');
  const [slotTime, setSlotTime] = useState('');
  const [adminForm, setAdminForm] = useState<AdminFormState>({
    name: '',
    type: 'solo',
    scheduled_date: '',
    scheduled_time: '',
    prize_pool: 0,
    entry_fee: 0,
    max_participants: 0,
    admin_notes: '',
  });
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const { toast } = useToast();

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      // Replace with your actual admin check logic
      const adminEmails = ['admin@example.com'];
      setIsAdmin(user && adminEmails.includes(user.email || ''));
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

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

  const fetchRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from('tournament_registrations')
        .select(`
          *,
          player:players(username, in_game_name)
        `);

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch registrations",
        variant: "destructive",
      });
    }
  };

  const handleRegistration = async () => {
    if (!playerName || !slotTime) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('id')
        .eq('username', playerName)
        .single();

      if (playerError) throw playerError;

      let playerId;
      if (playerData) {
        playerId = playerData.id;
      } else {
        // If player doesn't exist, create a new player
        const { data: newPlayerData, error: newPlayerError } = await supabase
          .from('players')
          .insert({ username: playerName, email: `${playerName.replace(/\s/g, '')}@example.com`, clerk_user_id: 'null' })
          .select('id')
          .single();

        if (newPlayerError) throw newPlayerError;
        playerId = newPlayerData.id;
      }

      const { data, error } = await supabase
        .from('tournament_registrations')
        .insert({
          player_id: playerId,
          tournament_type: tournamentType,
          slot_time: slotTime,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Registered for tournament!",
      });
      fetchRegistrations();
    } catch (error) {
      console.error('Error registering for tournament:', error);
      toast({
        title: "Error",
        description: "Failed to register for tournament",
        variant: "destructive",
      });
    }
  };

  const handleAdminSubmit = async () => {
    try {
      const { error } = await supabase
        .from('tournaments')
        .insert({
          name: adminForm.name,
          type: adminForm.type,
          scheduled_date: adminForm.scheduled_date,
          scheduled_time: adminForm.scheduled_time,
          prize_pool: adminForm.prize_pool,
          entry_fee: adminForm.entry_fee,
          max_participants: adminForm.max_participants,
          admin_notes: adminForm.admin_notes,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tournament created successfully!",
      });

      // Clear the form
      setAdminForm({
        name: '',
        type: 'solo',
        scheduled_date: '',
        scheduled_time: '',
        prize_pool: 0,
        entry_fee: 0,
        max_participants: 0,
        admin_notes: '',
      });

      fetchTournaments();
    } catch (error) {
      console.error('Error creating tournament:', error);
      toast({
        title: "Error",
        description: "Failed to create tournament",
        variant: "destructive",
      });
    }
  };
  
  useEffect(() => {
    fetchTournaments();
    fetchRegistrations();
    checkAdminStatus();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchRegistrations();
    }
  }, [isAdmin]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <header className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <Gamepad2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Free Fire Tournaments</h1>
                <p className="text-blue-200 text-sm">Compete. Win. Dominate.</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="tournaments" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6 bg-black/20 backdrop-blur-md border border-white/10">
            <TabsTrigger value="tournaments" className="text-white data-[state=active]:bg-white/20">Tournaments</TabsTrigger>
            <TabsTrigger value="register" className="text-white data-[state=active]:bg-white/20">Register</TabsTrigger>
            <TabsTrigger value="credentials" className="text-white data-[state=active]:bg-white/20">Room Info</TabsTrigger>
            {isAdmin && (
              <>
                <TabsTrigger value="admin" className="text-white data-[state=active]:bg-white/20">Admin</TabsTrigger>
                <TabsTrigger value="winners" className="text-white data-[state=active]:bg-white/20">Winners</TabsTrigger>
                <TabsTrigger value="featured" className="text-white data-[state=active]:bg-white/20">Featured</TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="tournaments" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {tournaments.map((tournament) => (
                <Card key={tournament.id} className="bg-black/40 backdrop-blur-md border border-white/20 text-white overflow-hidden group hover:border-white/40 transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl text-white group-hover:text-orange-300 transition-colors">
                          {tournament.name}
                        </CardTitle>
                        <Badge variant="outline" className="mt-2 border-orange-500 text-orange-400 bg-orange-500/10">
                          {tournament.type.toUpperCase()}
                        </Badge>
                      </div>
                      <Badge 
                        variant={tournament.status === 'upcoming' ? 'default' : tournament.status === 'ongoing' ? 'destructive' : 'secondary'}
                        className="capitalize"
                      >
                        {tournament.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                        <span>₹{tournament.prize_pool}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-green-400" />
                        <span>₹{tournament.entry_fee}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-blue-400" />
                        <span>{tournament.max_participants} slots</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-purple-400" />
                        <span>{tournament.scheduled_date}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center py-2">
                      <TournamentTimer 
                        scheduledDate={tournament.scheduled_date} 
                        scheduledTime={tournament.scheduled_time}
                        status={tournament.status}
                      />
                    </div>

                    {tournament.room_id && tournament.room_password && (
                      <RoomCredentials 
                        isOpen={false}
                        onClose={() => {}}
                        roomId={tournament.room_id}
                        roomPassword={tournament.room_password}
                        tournamentName={tournament.name}
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="register" className="space-y-6">
            <Card className="bg-black/40 backdrop-blur-md border border-white/20 text-white">
              <CardHeader>
                <CardTitle className="text-2xl text-center text-white">Tournament Registration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="player-name" className="text-white">Player Name</Label>
                    <Input
                      id="player-name"
                      placeholder="Enter your in-game name"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tournament-type" className="text-white">Tournament Type</Label>
                    <Select value={tournamentType} onValueChange={(value: 'solo' | 'duo' | 'squad') => setTournamentType(value)}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Select tournament type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solo">Solo</SelectItem>
                        <SelectItem value="duo">Duo</SelectItem>
                        <SelectItem value="squad">Squad</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slot-time" className="text-white">Preferred Slot Time</Label>
                    <Input
                      id="slot-time"
                      type="time"
                      value={slotTime}
                      onChange={(e) => setSlotTime(e.target.value)}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleRegistration} 
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3"
                  disabled={!playerName || !slotTime}
                >
                  Register for Tournament
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="credentials">
            <PlayerTournamentCredentials />
          </TabsContent>

          {isAdmin && (
            <>
              <TabsContent value="admin" className="space-y-6">
                <AdminTournamentPanel />
                <Card className="bg-black/40 backdrop-blur-md border border-white/20 text-white">
                  <CardHeader>
                    <CardTitle className="text-2xl text-white">Admin Panel</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="admin-tournament-name" className="text-white">Tournament Name</Label>
                        <Input
                          id="admin-tournament-name"
                          placeholder="Enter tournament name"
                          value={adminForm.name}
                          onChange={(e) => setAdminForm({...adminForm, name: e.target.value})}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="admin-tournament-type" className="text-white">Tournament Type</Label>
                        <Select value={adminForm.type} onValueChange={(value: 'solo' | 'duo' | 'squad') => setAdminForm({...adminForm, type: value})}>
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="solo">Solo</SelectItem>
                            <SelectItem value="duo">Duo</SelectItem>
                            <SelectItem value="squad">Squad</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="admin-entry-fee" className="text-white">Entry Fee (₹)</Label>
                        <Input
                          id="admin-entry-fee"
                          type="number"
                          placeholder="Entry fee"
                          value={adminForm.entry_fee}
                          onChange={(e) => setAdminForm({...adminForm, entry_fee: parseInt(e.target.value) || 0})}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="admin-prize-pool" className="text-white">Prize Pool (₹)</Label>
                        <Input
                          id="admin-prize-pool"
                          type="number"
                          placeholder="Prize pool"
                          value={adminForm.prize_pool}
                          onChange={(e) => setAdminForm({...adminForm, prize_pool: parseInt(e.target.value) || 0})}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="admin-max-participants" className="text-white">Max Participants</Label>
                        <Input
                          id="admin-max-participants"
                          type="number"
                          placeholder="Max participants"
                          value={adminForm.max_participants}
                          onChange={(e) => setAdminForm({...adminForm, max_participants: parseInt(e.target.value) || 0})}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="admin-scheduled-date" className="text-white">Scheduled Date</Label>
                        <Input
                          id="admin-scheduled-date"
                          type="date"
                          value={adminForm.scheduled_date}
                          onChange={(e) => setAdminForm({...adminForm, scheduled_date: e.target.value})}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="admin-scheduled-time" className="text-white">Scheduled Time</Label>
                        <Input
                          id="admin-scheduled-time"
                          type="time"
                          value={adminForm.scheduled_time}
                          onChange={(e) => setAdminForm({...adminForm, scheduled_time: e.target.value})}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="admin-notes" className="text-white">Admin Notes</Label>
                      <Textarea
                        id="admin-notes"
                        placeholder="Additional notes for the tournament"
                        value={adminForm.admin_notes}
                        onChange={(e) => setAdminForm({...adminForm, admin_notes: e.target.value})}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      />
                    </div>

                    <Button 
                      onClick={handleAdminSubmit} 
                      className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold py-3"
                      disabled={!adminForm.name || !adminForm.scheduled_date || !adminForm.scheduled_time}
                    >
                      Create Tournament
                    </Button>
                  </CardContent>
                </Card>

                {/* Registration Management */}
                <Card className="bg-black/40 backdrop-blur-md border border-white/20 text-white">
                  <CardHeader>
                    <CardTitle className="text-xl text-white">Registration Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {registrations.map((registration) => (
                        <div key={registration.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="space-y-1">
                            <p className="font-medium">{registration.player?.username || 'Unknown Player'}</p>
                            <p className="text-sm text-white/70">
                              Type: {registration.tournament_type} | Time: {registration.slot_time}
                            </p>
                          </div>
                          <Badge 
                            variant={registration.payment_status === 'paid' ? 'default' : 'secondary'}
                            className="capitalize"
                          >
                            {registration.payment_status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="winners">
                <AdminWinnerForm />
              </TabsContent>

              <TabsContent value="featured">
                <AdminFeaturedTournaments />
              </TabsContent>
            </>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default TournamentWebsite;
