
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Clock, DollarSign, Trophy, Trash2, Key } from 'lucide-react';
import { TournamentTimer } from './TournamentTimer';
import { RoomCredentials } from './RoomCredentials';
import { useTournamentTimer } from '@/hooks/useTournamentTimer';

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

interface TournamentCardProps {
  tournament: Tournament;
  registrations: TournamentRegistration[];
  isAdmin: boolean;
  onDelete: (id: string) => Promise<void>;
  onOpenRoomCredentials: (tournament: Tournament) => void;
}

const TournamentCard: React.FC<TournamentCardProps> = ({
  tournament,
  registrations,
  isAdmin,
  onDelete,
  onOpenRoomCredentials
}) => {
  const [showRoomCredentials, setShowRoomCredentials] = useState(false);
  const timeLeft = useTournamentTimer({ 
    scheduledDate: tournament.scheduled_date, 
    scheduledTime: tournament.scheduled_time, 
    status: tournament.status 
  });

  const userRegistration = registrations.find(reg => 
    reg.tournament_type === tournament.type && reg.payment_status === 'completed'
  );

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'solo': return 'bg-blue-500';
      case 'duo': return 'bg-green-500';
      case 'squad': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getButtonText = () => {
    if (tournament.status === 'completed') return 'Tournament Ended';
    if (tournament.status === 'active') return 'Tournament Live';
    if (timeLeft.isExpired) return 'Tournament Started';
    return 'Register Now';
  };

  const isButtonDisabled = () => {
    return tournament.status === 'completed' || tournament.status === 'active' || timeLeft.isExpired;
  };

  const handleJoinRoom = () => {
    if (tournament.room_id && tournament.room_password && userRegistration) {
      setShowRoomCredentials(true);
    }
  };

  return (
    <>
      <Card className="morph-container overflow-hidden group cursor-pointer transform transition-all duration-300 hover:scale-105">
        <div className="relative h-48 overflow-hidden">
          <img 
            src={`https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&h=200`}
            alt={tournament.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-white text-sm font-medium ${getTypeColor(tournament.type)}`}>
            {tournament.type?.toUpperCase() || 'UNKNOWN'}
          </div>
          <div className="absolute bottom-4 left-4 text-white">
            <h3 className="text-xl font-bold mb-1">{tournament.name}</h3>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {tournament.scheduled_time}
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {tournament.max_participants}
              </div>
            </div>
          </div>
        </div>
        
        <CardContent className="p-6">
          {/* Timer Section */}
          <div className="mb-4">
            <TournamentTimer 
              scheduledDate={tournament.scheduled_date}
              scheduledTime={tournament.scheduled_time}
              status={tournament.status}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <DollarSign className="h-5 w-5 mx-auto mb-1 text-green-500" />
              <p className="text-lg font-bold text-green-500">₹{tournament.prize_pool}</p>
              <p className="text-xs text-gray-600 dark:text-gray-300">Prize Pool</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <Trophy className="h-5 w-5 mx-auto mb-1 text-orange-500" />
              <p className="text-lg font-bold text-orange-500">₹{tournament.entry_fee}</p>
              <p className="text-xs text-gray-600 dark:text-gray-300">Entry Fee</p>
            </div>
          </div>

          <div className="space-y-2">
            <Button 
              onClick={() => {}}
              disabled={isButtonDisabled()}
              className={`w-full font-medium ${
                isButtonDisabled() 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white'
              }`}
            >
              {getButtonText()}
            </Button>

            {userRegistration && tournament.room_id && tournament.room_password && (
              <Button 
                onClick={handleJoinRoom}
                className="w-full bg-green-500 hover:bg-green-600 text-white"
              >
                <Key className="h-4 w-4 mr-2" />
                View Room Credentials
              </Button>
            )}

            {isAdmin && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenRoomCredentials(tournament)}
                  className="flex-1"
                >
                  <Key className="h-4 w-4 mr-1" />
                  Set Credentials
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(tournament.id)}
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <RoomCredentials
        isOpen={showRoomCredentials}
        onClose={() => setShowRoomCredentials(false)}
        roomId={tournament.room_id || ''}
        roomPassword={tournament.room_password || ''}
        tournamentName={tournament.name}
      />
    </>
  );
};

export default TournamentCard;
