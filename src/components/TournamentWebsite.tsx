import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import TournamentCard from './TournamentCard';
import { AdminTournamentPanel } from './AdminTournamentPanel';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Trophy, DollarSign, Clock } from 'lucide-react';
import { PlayerStatsDashboard } from './PlayerStatsDashboard';

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
  slot_time: string;
  payment_status: string;
  tournament_type: 'solo' | 'duo' | 'squad';
  created_at: string;
  player_id: string;
  player: {
    username: string;
    in_game_name: string;
  };
}

interface Player {
  id: string;
  username: string;
  in_game_name: string;
  free_fire_uid: string;
  email: string;
  clerk_user_id: string;
}

const TournamentWebsite: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tournaments' | 'dashboard' | 'admin'>('tournaments');

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
    if (!currentPlayer) return;

    try {
      const { data, error } = await supabase
        .from('tournament_registrations')
        .select(`
          *,
          player:players!tournament_registrations_player_id_fkey(
            username,
            in_game_name
          )
        `)
        .eq('player_id', currentPlayer.id);

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    }
  };

  const fetchCurrentPlayer = async () => {
    try {
      // This would be replaced with actual auth logic
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      setCurrentPlayer(data);
    } catch (error) {
      console.error('Error fetching current player:', error);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      await fetchCurrentPlayer();
      await fetchTournaments();
      setLoading(false);
    };

    initializeData();

    // Set up real-time subscription for tournaments
    const tournamentsChannel = supabase
      .channel('tournaments-changes')
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
      supabase.removeChannel(tournamentsChannel);
    };
  }, []);

  useEffect(() => {
    if (currentPlayer) {
      fetchRegistrations();

      // Set up real-time subscription for registrations
      const registrationsChannel = supabase
        .channel('registrations-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tournament_registrations'
          },
          () => {
            fetchRegistrations();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(registrationsChannel);
      };
    }
  }, [currentPlayer]);

  const handleRegister = async (tournamentId: string) => {
    if (!currentPlayer) {
      alert('Please log in to register for tournaments');
      return;
    }

    const tournament = tournaments.find(t => t.id === tournamentId);
    if (!tournament) return;

    try {
      const { error } = await supabase
        .from('tournament_registrations')
        .insert({
          player_id: currentPlayer.id,
          tournament_type: tournament.type,
          slot_time: tournament.scheduled_time,
          payment_status: 'pending'
        });

      if (error) throw error;

      alert(`Successfully registered for ${tournament.name}!`);
      fetchRegistrations();
    } catch (error) {
      console.error('Error registering for tournament:', error);
      alert('Failed to register for tournament');
    }
  };

  const getUserCompletedPayment = (tournamentId: string): boolean => {
    return registrations.some(
      reg => reg.tournament_type === tournaments.find(t => t.id === tournamentId)?.type && 
      reg.payment_status === 'completed'
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading tournaments...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
      
      <header className="relative overflow-hidden bg-black/50 text-white py-20">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
            FIRE ESPORTS TOURNAMENT
          </h1>
          <p className="text-xl mb-8 text-gray-300">
            Compete in Free Fire tournaments and win amazing prizes!
          </p>
          
          <div className="flex justify-center space-x-6 mb-8">
            <Button
              onClick={() => setActiveTab('tournaments')}
              variant={activeTab === 'tournaments' ? 'default' : 'outline'}
              className="flex items-center space-x-2"
            >
              <Trophy className="h-4 w-4" />
              <span>Tournaments</span>
            </Button>
            <Button
              onClick={() => setActiveTab('dashboard')}
              variant={activeTab === 'dashboard' ? 'default' : 'outline'}
              className="flex items-center space-x-2"
            >
              <Users className="h-4 w-4" />
              <span>Dashboard</span>
            </Button>
            <Button
              onClick={() => setActiveTab('admin')}
              variant={activeTab === 'admin' ? 'default' : 'outline'}
              className="flex items-center space-x-2"
            >
              <Calendar className="h-4 w-4" />
              <span>Admin</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {activeTab === 'tournaments' && (
          <div>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Active Tournaments</h2>
              <p className="text-gray-300">Choose your tournament and show your skills!</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {tournaments.map((tournament) => (
                <TournamentCard
                  key={tournament.id}
                  title={tournament.name}
                  type={tournament.type}
                  time={tournament.scheduled_time}
                  entryFee={tournament.entry_fee.toString()}
                  prizePool={tournament.prize_pool.toString()}
                  image="photo-1542751371-adc38448a05e"
                  maxPlayers={tournament.max_participants}
                  onRegister={() => handleRegister(tournament.id)}
                  scheduledDate={tournament.scheduled_date}
                  scheduledTime={tournament.scheduled_time}
                  status={tournament.status}
                  roomId={tournament.room_id || ''}
                  roomPassword={tournament.room_password || ''}
                  userHasCompletedPayment={getUserCompletedPayment(tournament.id)}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && <PlayerStatsDashboard />}
        
        {activeTab === 'admin' && <AdminTournamentPanel />}
      </main>
    </div>
  );
};

export default TournamentWebsite;
