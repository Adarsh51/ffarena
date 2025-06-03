import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Calendar, Users, DollarSign } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/hooks/use-toast';
import { PlayerStatsDashboard } from './PlayerStatsDashboard';
import { PaymentStatusDashboard } from './PaymentStatusDashboard';
import { AdminFeaturedTournaments } from './AdminFeaturedTournaments';
import { useFeaturedTournaments } from '@/hooks/useFeaturedTournaments';
import { useUser } from '@clerk/clerk-react';

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

export const TournamentWebsite = () => {
  const { user } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const { featuredTournaments, loading: featuredLoading } = useFeaturedTournaments();
  const { toast } = useToast();
  const [winners, setWinners] = useState([
    { name: 'John Doe', tournament: 'Summer Open', prize: 5000 },
    { name: 'Jane Smith', tournament: 'Winter Classic', prize: 7500 },
  ]);

  // Check if user is admin (you can customize this logic)
  useEffect(() => {
    if (user?.emailAddresses?.[0]?.emailAddress === 'admin@tournament.com') {
      setIsAdmin(true);
    }
  }, [user]);

  const handleJoinTournament = (tournamentId: string) => {
    toast({
      title: "Joining Tournament",
      description: `You have requested to join tournament ${tournamentId}. Please complete the payment to confirm your registration.`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <nav className="bg-white bg-opacity-10 backdrop-blur-lg py-6">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <span className="text-xl font-bold text-white">Tournament Website</span>
          <div>
            {user ? (
              <Button onClick={() => {
                window.location.href = '/sign-out'
              }} variant="outline">Sign Out</Button>
            ) : (
              <div className="space-x-2">
                <Button onClick={() => {
                  window.location.href = '/sign-in'
                }} variant="outline">Sign In</Button>
                <Button onClick={() => {
                  window.location.href = '/sign-up'
                }}>Sign Up</Button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {showAdminPanel && isAdmin ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
              <Button 
                onClick={() => setShowAdminPanel(false)}
                variant="outline"
              >
                Back to Dashboard
              </Button>
            </div>
            <AdminFeaturedTournaments />
          </div>
        ) : (
          <>
            {/* User Dashboard Section */}
            {user && (
              <section className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold text-white">Your Dashboard</h2>
                  {isAdmin && (
                    <Button 
                      onClick={() => setShowAdminPanel(true)}
                      variant="outline"
                    >
                      Admin Panel
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  <div className="lg:col-span-2">
                    <PlayerStatsDashboard />
                  </div>
                  <div className="lg:col-span-1">
                    <PaymentStatusDashboard />
                  </div>
                </div>
              </section>
            )}

            {/* Featured Tournaments Section */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-white mb-6">Featured Tournaments</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredLoading ? (
                  <p className="text-white">Loading featured tournaments...</p>
                ) : featuredTournaments.length > 0 ? (
                  featuredTournaments.map((tournament) => (
                    <Card key={tournament.id} className="bg-white bg-opacity-10 backdrop-blur-lg">
                      <CardHeader>
                        <CardTitle className="text-xl font-semibold text-white">{tournament.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-2 text-white">
                          <Calendar className="h-5 w-5" />
                          <span>{new Date(tournament.scheduled_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white">
                          <Users className="h-5 w-5" />
                          <span>{tournament.max_participants} Participants</span>
                        </div>
                        <div className="flex items-center gap-2 text-white">
                          <DollarSign className="h-5 w-5" />
                          <span>Prize Pool: ₹{tournament.prize_pool}</span>
                        </div>
                        <Button onClick={() => handleJoinTournament(tournament.id)}>Join Now</Button>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-white">No featured tournaments available.</p>
                )}
              </div>
            </section>

            {/* How to Play Section */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-white mb-6">How to Play</h2>
              <Card className="bg-white bg-opacity-10 backdrop-blur-lg">
                <CardContent className="text-white">
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Sign up for an account or sign in if you already have one.</li>
                    <li>Browse the available tournaments and choose one to join.</li>
                    <li>Pay the entry fee to confirm your spot in the tournament.</li>
                    <li>Compete against other players and try to win the prize pool!</li>
                  </ul>
                </CardContent>
              </Card>
            </section>

            {/* Winners Section */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-white mb-6">Recent Winners</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {winners.map((winner, index) => (
                  <Card key={index} className="bg-white bg-opacity-10 backdrop-blur-lg">
                    <CardHeader>
                      <CardTitle className="text-xl text-white">{winner.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-white">
                      <p>Tournament: {winner.tournament}</p>
                      <p>Prize: ₹{winner.prize}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};
