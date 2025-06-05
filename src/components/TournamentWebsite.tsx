import React, { useState, useEffect } from 'react';
import TournamentCard from './TournamentCard';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu"
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AdminTournamentPanel } from './AdminTournamentPanel';

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
  room_id?: string;
  room_password?: string;
}

interface TournamentRegistration {
  id: string;
  player_id: string;
  tournament_type: 'solo' | 'duo' | 'squad';
  slot_time: string;
  payment_status: string;
  created_at: string;
}

interface LeaderboardEntry {
  username: string;
  tournaments_won: number;
  total_earnings: number;
}

const TournamentWebsite = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const { isSignedIn, user, isLoaded } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTournaments();
    fetchRegistrations();
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
    }
  };

  const fetchRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from('tournament_registrations')
        .select('*');

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      // Fetch leaderboard data from Supabase
      // Adjust the query based on your actual table structure and requirements
      const { data, error } = await supabase
        .from('player_stats')
        .select('players(username), tournaments_won, total_earnings')
        .order('tournaments_won', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching leaderboard:', error);
        return;
      }

      // Transform the data to match the LeaderboardEntry interface
      const transformedData = data.map((item: any) => ({
        username: item.players?.username || 'Unknown',
        tournaments_won: item.tournaments_won,
        total_earnings: item.total_earnings,
      }));

      setLeaderboard(transformedData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const handleRegisterClick = (tournament: Tournament) => {
    if (!isSignedIn) {
      navigate('/sign-in');
      return;
    }
    setSelectedTournament(tournament);
    setIsRegistering(true);
  };

  const handleRegistration = async (slotTime: string) => {
    if (!selectedTournament || !user) return;

    setIsRegistering(false);
    try {
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('id')
        .eq('clerk_user_id', user.id)
        .single();

      if (playerError) {
        console.error('Error fetching player ID:', playerError);
        return;
      }

      if (!playerData) {
        console.error('Player not found for clerk_user_id:', user.id);
        return;
      }

      const { error } = await supabase
        .from('tournament_registrations')
        .insert([
          {
            player_id: playerData.id,
            tournament_type: selectedTournament.type,
            slot_time: slotTime,
            payment_status: 'pending',
          },
        ]);

      if (error) {
        console.error('Error registering for tournament:', error);
        return;
      }

      fetchRegistrations();
      alert('Registered successfully! Please proceed with the payment.');
    } catch (error) {
      console.error('Error during registration:', error);
      alert('Registration failed. Please try again.');
    }
  };

  const isRegistered = (tournamentId: string): boolean => {
    if (!user) return false;

    // Find the player's registration based on the current user's ID
    const playerRegistration = registrations.find(
      (reg) => {
        // Fetch player data to map clerk_user_id to player ID
        return reg.player_id === user.id && reg.tournament_type === selectedTournament?.type;
      }
    );

    return !!playerRegistration;
  };

  const getUserRegistrations = () => {
    if (!isSignedIn || !user) return [];

    return registrations.filter(registration => {
      // Assuming 'player_id' in 'tournament_registrations' table directly matches 'user.id'
      return registration.player_id === user.id;
    });
  };

  const userHasCompletedPayment = (tournamentId: string): boolean => {
    // Fetch the registration record for the user and the specific tournament
    const registration = registrations.find(
      (reg) => reg.player_id === user?.id && reg.tournament_type === selectedTournament?.type
    );

    // Check if a registration record exists and if the payment status is 'completed'
    return !!registration && registration.payment_status === 'completed';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <header className="bg-gray-800 text-white py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Tournament Website</h1>

          <nav>
            <ul className="flex space-x-6">
              <li>
                <Button variant="ghost" className="text-white" onClick={() => setActiveTab('home')}>Home</Button>
              </li>
              <li>
                <Button variant="ghost" className="text-white" onClick={() => {
                  setActiveTab('tournaments');
                  fetchTournaments();
                }}>
                  Tournaments
                </Button>
              </li>
              <li>
                <Button variant="ghost" className="text-white" onClick={() => {
                  setActiveTab('leaderboard');
                  fetchLeaderboard();
                }}>
                  Leaderboard
                </Button>
              </li>
              {isLoaded && user?.publicMetadata?.role === 'admin' && (
                <li>
                  <Button variant="ghost" className="text-white" onClick={() => setActiveTab('admin')}>Admin</Button>
                </li>
              )}
            </ul>
          </nav>

          {isLoaded && (
            isSignedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-white flex items-center">
                    <Avatar className="mr-2 h-8 w-8">
                      <AvatarImage src={user.imageUrl} alt={user.username} />
                      <AvatarFallback>{user.firstName?.[0]}{user.lastName?.[0]}</AvatarFallback>
                    </Avatar>
                    {user.firstName} {user.lastName}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white border rounded-md shadow-md w-56">
                  <DropdownMenuLabel className="font-medium text-gray-800">My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="text-blue-600 hover:bg-gray-100 focus:bg-gray-100">
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/sign-out')} className="text-red-600 hover:bg-gray-100 focus:bg-gray-100">
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div>
                <Button onClick={() => navigate('/sign-in')} className="mr-2">Sign In</Button>
                <Button onClick={() => navigate('/sign-up')} variant="secondary">Sign Up</Button>
              </div>
            )
          )}
        </div>
      </header>

      {activeTab === 'home' && (
        <div className="container mx-auto px-4 py-8">
          <section className="hero mb-8">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-white mb-4">Welcome to the Tournament Platform</h2>
              <p className="text-lg text-gray-300">Join exciting tournaments and compete with players from around the world.</p>
              <Button onClick={() => setActiveTab('tournaments')} className="mt-6 bg-blue-600 hover:bg-blue-700 text-white">
                Explore Tournaments
              </Button>
            </div>
          </section>

          <section className="about mb-8">
            <h3 className="text-2xl font-bold text-white mb-4">About Us</h3>
            <p className="text-gray-300">We are dedicated to providing a platform for gamers to showcase their skills and compete in organized tournaments. Our platform offers a variety of tournaments, including solo, duo, and squad modes.</p>
          </section>

          <section className="features">
            <h3 className="text-2xl font-bold text-white mb-4">Key Features</h3>
            <ul className="list-disc list-inside text-gray-300">
              <li>Real-time tournament updates</li>
              <li>Secure registration and payment process</li>
              <li>Detailed player statistics and leaderboards</li>
              <li>Dedicated admin support</li>
            </ul>
          </section>
        </div>
      )}

      {activeTab === 'tournaments' && (
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-3xl font-bold text-white mb-6">Available Tournaments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map(tournament => (
              <TournamentCard
                key={tournament.id}
                title={tournament.name}
                type={tournament.type}
                time={`${tournament.scheduled_time}`}
                entryFee={tournament.entry_fee.toString()}
                prizePool={tournament.prize_pool.toString()}
                image="photo-1608178398227-c4d3947c1808"
                maxPlayers={tournament.max_participants}
                onRegister={() => handleRegisterClick(tournament)}
                scheduledDate={tournament.scheduled_date}
                scheduledTime={tournament.scheduled_time}
                status={tournament.status}
                roomId={tournament.room_id}
                roomPassword={tournament.room_password}
                userHasCompletedPayment={userHasCompletedPayment(tournament.id)}
              />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-3xl font-bold text-white mb-6">Leaderboard</h2>
          <ScrollArea>
            <Table>
              <TableCaption>Top 10 Players</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Rank</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Tournaments Won</TableHead>
                  <TableHead>Total Earnings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((entry, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{entry.username}</TableCell>
                    <TableCell>{entry.tournaments_won}</TableCell>
                    <TableCell>₹{entry.total_earnings}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      )}

      {activeTab === 'admin' && (
        <div className="container mx-auto px-4 py-8">
          <AdminTournamentPanel />
        </div>
      )}
    </div>
  );
};

export default TournamentWebsite;
