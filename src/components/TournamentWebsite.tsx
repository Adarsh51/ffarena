import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Trophy, 
  Users, 
  Calendar, 
  Clock, 
  DollarSign, 
  Plus, 
  Trash2, 
  Edit, 
  UserPlus,
  Loader2
} from 'lucide-react';
import { TournamentCard } from '@/components/TournamentCard';
import { RoomCredentials } from './RoomCredentials';
import { TournamentTimer } from './TournamentTimer';

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
  created_at: string;
  updated_at: string;
}

interface TournamentRegistration {
  id: string;
  player_id: string;
  slot_time: string;
  tournament_type: 'solo' | 'duo' | 'squad';
  payment_status: string;
  created_at: string;
  player: {
    id: string;
    username: string;
    email: string;
    in_game_name: string;
    free_fire_uid: string;
  };
}

interface RoomCredentials {
  room_id: string;
  room_password: string;
}

const TournamentWebsite = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [roomCredentials, setRoomCredentials] = useState<Record<string, RoomCredentials>>({});
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  const [isRoomCredentialsOpen, setIsRoomCredentialsOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [generatedRoomId, setGeneratedRoomId] = useState('');
  const [generatedRoomPassword, setGeneratedRoomPassword] = useState('');

  const [newTournament, setNewTournament] = useState({
    name: '',
    type: 'solo' as 'solo' | 'duo' | 'squad',
    scheduled_date: '',
    scheduled_time: '',
    prize_pool: 1000,
    entry_fee: 50,
    max_participants: 50,
    status: 'upcoming'
  });

  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRegistrationsDialog, setShowRegistrationsDialog] = useState(false);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');

  useEffect(() => {
    fetchTournaments();
    fetchRegistrations();
    checkAdminStatus();
  }, []);

  const checkAdminStatus = () => {
    const adminEmails = ['admin@tournament.com', 'organizer@tournament.com'];
    setIsAdmin(true); // For demo purposes, set to true
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
        description: "Failed to load tournaments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from('tournament_registrations')
        .select(`
          *,
          player:players(*)
        `);

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    }
  };

  const addTournament = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .insert([newTournament])
        .select();

      if (error) throw error;

      if (data) {
        setTournaments([...tournaments, ...data]);
        setNewTournament({
          name: '',
          type: 'solo',
          scheduled_date: '',
          scheduled_time: '',
          prize_pool: 1000,
          entry_fee: 50,
          max_participants: 50,
          status: 'upcoming'
        });
        setShowAddDialog(false);
        toast({
          title: "Success",
          description: "Tournament created successfully",
        });
      }
    } catch (error) {
      console.error('Error adding tournament:', error);
      toast({
        title: "Error",
        description: "Failed to create tournament",
        variant: "destructive",
      });
    }
  };

  const updateTournament = async () => {
    if (!editingTournament) return;

    try {
      const { data, error } = await supabase
        .from('tournaments')
        .update({
          name: editingTournament.name,
          type: editingTournament.type,
          scheduled_date: editingTournament.scheduled_date,
          scheduled_time: editingTournament.scheduled_time,
          prize_pool: editingTournament.prize_pool,
          entry_fee: editingTournament.entry_fee,
          max_participants: editingTournament.max_participants,
          status: editingTournament.status
        })
        .eq('id', editingTournament.id)
        .select();

      if (error) throw error;

      if (data) {
        setTournaments(tournaments.map(t => 
          t.id === editingTournament.id ? data[0] : t
        ));
        setEditingTournament(null);
        setShowEditDialog(false);
        toast({
          title: "Success",
          description: "Tournament updated successfully",
        });
      }
    } catch (error) {
      console.error('Error updating tournament:', error);
      toast({
        title: "Error",
        description: "Failed to update tournament",
        variant: "destructive",
      });
    }
  };

  const deleteTournament = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTournaments(tournaments.filter(t => t.id !== id));
      toast({
        title: "Success",
        description: "Tournament deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting tournament:', error);
      toast({
        title: "Error",
        description: "Failed to delete tournament",
        variant: "destructive",
      });
    }
  };

  const setRoomCredentialsForTournament = (tournamentId: string, roomId: string, password: string) => {
    setRoomCredentials(prev => ({
      ...prev,
      [tournamentId]: { room_id: roomId, room_password: password }
    }));
    
    toast({
      title: "Room Credentials Set",
      description: "Players with completed payments will see the room details when the tournament starts.",
    });
  };

  const getUserRegistration = (tournamentId: string) => {
    // For demo purposes, return a mock registration with completed payment
    return registrations.find(reg => 
      reg.tournament_type === tournaments.find(t => t.id === tournamentId)?.type &&
      reg.payment_status === 'completed'
    );
  };

  const handleOpenRoomCredentials = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    // Generate a random room ID and password
    const roomId = Math.random().toString(36).substring(2, 10).toUpperCase();
    const roomPassword = Math.random().toString(36).substring(2, 8).toUpperCase();

    setGeneratedRoomId(roomId);
    setGeneratedRoomPassword(roomPassword);
    setIsRoomCredentialsOpen(true);
  };

  const handleCloseRoomCredentials = () => {
    setIsRoomCredentialsOpen(false);
    setSelectedTournament(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-6 shadow-md">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">
              {/* <span className="text-yellow-400">Free Fire</span> Tournaments */}
              <img src="/logo-white.png" alt="Tournament Logo" className="h-10" />
            </h1>
          </div>
          <div className="space-x-4">
            <Button variant="ghost" className="text-white hover:bg-purple-500">
              Upcoming
            </Button>
            <Button variant="ghost" className="text-white hover:bg-purple-500">
              Results
            </Button>
            <Button variant="ghost" className="text-white hover:bg-purple-500">
              About
            </Button>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Free Fire Tournament Hub
          </h1>
          <p className="text-xl text-blue-200 mb-8">
            Join epic battles, win amazing prizes!
          </p>
        </div>

        <Tabs defaultValue="tournaments" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3">
            <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            {isAdmin && <TabsTrigger value="admin">Admin</TabsTrigger>}
          </TabsList>

          <TabsContent value="tournaments" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tournaments.map((tournament) => (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  userRegistration={getUserRegistration(tournament.id)}
                  roomCredentials={roomCredentials[tournament.id]}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Trophy className="h-6 w-6 mr-2 text-yellow-400" />
                  Top Players
                </CardTitle>
              </CardHeader>
              <CardContent className="text-white">
                <p>Leaderboard coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Plus className="h-6 w-6 mr-2" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button 
                      onClick={() => setShowAddDialog(true)}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Tournament
                    </Button>
                    <Button 
                      onClick={() => setShowRegistrationsDialog(true)}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      View Registrations
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Room Credentials</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="tournament-select" className="text-white">
                        Select Tournament
                      </Label>
                      <Select onValueChange={setSelectedTournamentId}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="Choose tournament" />
                        </SelectTrigger>
                        <SelectContent>
                          {tournaments.map((tournament) => (
                            <SelectItem key={tournament.id} value={tournament.id}>
                              {tournament.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedTournamentId && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-white">Room ID</Label>
                            <Input 
                              placeholder="Room ID"
                              className="bg-white/10 border-white/20 text-white"
                              id="room-id"
                            />
                          </div>
                          <div>
                            <Label className="text-white">Password</Label>
                            <Input 
                              placeholder="Password"
                              className="bg-white/10 border-white/20 text-white"
                              id="room-password"
                            />
                          </div>
                        </div>
                        <Button 
                          onClick={() => {
                            const roomId = (document.getElementById('room-id') as HTMLInputElement)?.value;
                            const password = (document.getElementById('room-password') as HTMLInputElement)?.value;
                            if (roomId && password) {
                              setRoomCredentialsForTournament(selectedTournamentId, roomId, password);
                            }
                          }}
                          className="w-full bg-purple-600 hover:bg-purple-700"
                        >
                          Set Room Credentials
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Manage Tournaments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tournaments.map((tournament) => (
                      <Card key={tournament.id} className="bg-white/5 border-white/10">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-white text-sm">{tournament.name}</CardTitle>
                          <Badge variant="outline" className="w-fit text-xs">
                            {tournament.type}
                          </Badge>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingTournament(tournament);
                                setShowEditDialog(true);
                              }}
                              className="text-white border-white/20 hover:bg-white/10"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteTournament(tournament.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Add New Tournament</DialogTitle>
            <DialogDescription>
              Create a new tournament for players to join.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Tournament Name</Label>
              <Input
                id="name"
                value={newTournament.name}
                onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })}
                className="bg-gray-800 border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={newTournament.type} onValueChange={(value: 'solo' | 'duo' | 'squad') => setNewTournament({ ...newTournament, type: value })}>
                <SelectTrigger className="bg-gray-800 border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solo">Solo</SelectItem>
                  <SelectItem value="duo">Duo</SelectItem>
                  <SelectItem value="squad">Squad</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newTournament.scheduled_date}
                  onChange={(e) => setNewTournament({ ...newTournament, scheduled_date: e.target.value })}
                  className="bg-gray-800 border-gray-600"
                />
              </div>
              <div>
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={newTournament.scheduled_time}
                  onChange={(e) => setNewTournament({ ...newTournament, scheduled_time: e.target.value })}
                  className="bg-gray-800 border-gray-600"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="prize">Prize Pool</Label>
                <Input
                  id="prize"
                  type="number"
                  value={newTournament.prize_pool}
                  onChange={(e) => setNewTournament({ ...newTournament, prize_pool: parseInt(e.target.value) })}
                  className="bg-gray-800 border-gray-600"
                />
              </div>
              <div>
                <Label htmlFor="fee">Entry Fee</Label>
                <Input
                  id="fee"
                  type="number"
                  value={newTournament.entry_fee}
                  onChange={(e) => setNewTournament({ ...newTournament, entry_fee: parseInt(e.target.value) })}
                  className="bg-gray-800 border-gray-600"
                />
              </div>
              <div>
                <Label htmlFor="max">Max Players</Label>
                <Input
                  id="max"
                  type="number"
                  value={newTournament.max_participants}
                  onChange={(e) => setNewTournament({ ...newTournament, max_participants: parseInt(e.target.value) })}
                  className="bg-gray-800 border-gray-600"
                />
              </div>
            </div>
            <Button onClick={addTournament} className="w-full bg-green-600 hover:bg-green-700">
              Create Tournament
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Edit Tournament</DialogTitle>
            <DialogDescription>
              Update tournament details.
            </DialogDescription>
          </DialogHeader>
          {editingTournament && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Tournament Name</Label>
                <Input
                  id="edit-name"
                  value={editingTournament.name}
                  onChange={(e) => setEditingTournament({ ...editingTournament, name: e.target.value })}
                  className="bg-gray-800 border-gray-600"
                />
              </div>
              <div>
                <Label htmlFor="edit-type">Type</Label>
                <Select value={editingTournament.type} onValueChange={(value: 'solo' | 'duo' | 'squad') => setEditingTournament({ ...editingTournament, type: value })}>
                  <SelectTrigger className="bg-gray-800 border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solo">Solo</SelectItem>
                    <SelectItem value="duo">Duo</SelectItem>
                    <SelectItem value="squad">Squad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-date">Date</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={editingTournament.scheduled_date}
                    onChange={(e) => setEditingTournament({ ...editingTournament, scheduled_date: e.target.value })}
                    className="bg-gray-800 border-gray-600"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-time">Time</Label>
                  <Input
                    id="edit-time"
                    type="time"
                    value={editingTournament.scheduled_time}
                    onChange={(e) => setEditingTournament({ ...editingTournament, scheduled_time: e.target.value })}
                    className="bg-gray-800 border-gray-600"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-prize">Prize Pool</Label>
                  <Input
                    id="edit-prize"
                    type="number"
                    value={editingTournament.prize_pool}
                    onChange={(e) => setEditingTournament({ ...editingTournament, prize_pool: parseInt(e.target.value) })}
                    className="bg-gray-800 border-gray-600"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-fee">Entry Fee</Label>
                  <Input
                    id="edit-fee"
                    type="number"
                    value={editingTournament.entry_fee}
                    onChange={(e) => setEditingTournament({ ...editingTournament, entry_fee: parseInt(e.target.value) })}
                    className="bg-gray-800 border-gray-600"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-max">Max Players</Label>
                  <Input
                    id="edit-max"
                    type="number"
                    value={editingTournament.max_participants}
                    onChange={(e) => setEditingTournament({ ...editingTournament, max_participants: parseInt(e.target.value) })}
                    className="bg-gray-800 border-gray-600"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select value={editingTournament.status} onValueChange={(value) => setEditingTournament({ ...editingTournament, status: value })}>
                  <SelectTrigger className="bg-gray-800 border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={updateTournament} className="w-full bg-blue-600 hover:bg-blue-700">
                Update Tournament
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showRegistrationsDialog} onOpenChange={setShowRegistrationsDialog}>
        <DialogContent className="bg-gray-900 text-white border-gray-700 max-w-4xl">
          <DialogHeader>
            <DialogTitle>Tournament Registrations</DialogTitle>
            <DialogDescription>
              View all player registrations across tournaments.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-4">
              {registrations.map((registration) => (
                <Card key={registration.id} className="bg-gray-800 border-gray-600">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-4 gap-4 items-center">
                      <div>
                        <p className="font-medium">{registration.player?.username || 'Unknown Player'}</p>
                        <p className="text-sm text-gray-400">{registration.player?.email}</p>
                      </div>
                      <div>
                        <Badge variant="outline" className="text-xs">
                          {registration.tournament_type}
                        </Badge>
                      </div>
                      <div>
                        <Badge 
                          variant={registration.payment_status === 'completed' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {registration.payment_status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-400">
                        {new Date(registration.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {selectedTournament && (
        <RoomCredentials
          isOpen={isRoomCredentialsOpen}
          onClose={handleCloseRoomCredentials}
          roomId={generatedRoomId}
          roomPassword={generatedRoomPassword}
          tournamentName={selectedTournament.name}
        />
      )}
    </div>
  );
};

export default TournamentWebsite;
