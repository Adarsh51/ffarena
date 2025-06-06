
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Clock, DollarSign, Trophy, MessageCircle } from 'lucide-react';
import { TournamentTimer } from './TournamentTimer';
import { useTournamentTimer } from '@/hooks/useTournamentTimer';
import { useToast } from '@/hooks/use-toast';

interface TournamentCardProps {
  title: string;
  type: 'solo' | 'duo' | 'squad';
  time: string;
  entryFee: string;
  prizePool: string;
  image: string;
  maxPlayers: number;
  onRegister: () => void;
  scheduledDate?: string;
  scheduledTime?: string;
  status?: string;
  roomId?: string;
  roomPassword?: string;
  userHasCompletedPayment?: boolean;
}

const TournamentCard: React.FC<TournamentCardProps> = ({
  title,
  type,
  time,
  entryFee,
  prizePool,
  image,
  maxPlayers,
  onRegister,
  scheduledDate,
  scheduledTime,
  status = 'upcoming',
  roomId = '',
  roomPassword = '',
  userHasCompletedPayment = false
}) => {
  const { toast } = useToast();
  const timeLeft = useTournamentTimer({ 
    scheduledDate: scheduledDate || '', 
    scheduledTime: scheduledTime || '', 
    status 
  });

  useEffect(() => {
    if (timeLeft.isExpired && userHasCompletedPayment && roomId && roomPassword && status === 'upcoming') {
      toast({
        title: "Tournament Started! 🎮",
        description: "Join the room using credentials shared in the WhatsApp group",
        duration: 5000,
      });
    }
  }, [timeLeft.isExpired, userHasCompletedPayment, roomId, roomPassword, status, toast, title]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'solo': return 'bg-blue-500';
      case 'duo': return 'bg-green-500';
      case 'squad': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getButtonText = () => {
    if (status === 'completed') return 'Tournament Ended';
    if (status === 'active') return 'Tournament Live';
    if (timeLeft.isExpired && userHasCompletedPayment) return 'Check WhatsApp Group';
    if (timeLeft.isExpired) return 'Tournament Started';
    return 'Register Now';
  };

  const isButtonDisabled = () => {
    return status === 'completed' || status === 'active' || (timeLeft.isExpired && !userHasCompletedPayment);
  };

  const handleButtonClick = () => {
    if (timeLeft.isExpired && userHasCompletedPayment) {
      toast({
        title: "Check WhatsApp Group 📱",
        description: "Room credentials have been shared in the WhatsApp group. Join the room in Free Fire!",
        duration: 5000,
      });
    } else {
      onRegister();
    }
  };

  return (
    <Card className="morph-container overflow-hidden group cursor-pointer transform transition-all duration-300 hover:scale-105">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={`https://images.unsplash.com/${image}?auto=format&fit=crop&w=400&h=200`}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-white text-sm font-medium ${getTypeColor(type)}`}>
          {type.toUpperCase()}
        </div>
        <div className="absolute bottom-4 left-4 text-white">
          <h3 className="text-xl font-bold mb-1">{title}</h3>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {time}
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              {maxPlayers}
            </div>
          </div>
        </div>
      </div>
      
      <CardContent className="p-6">
        {/* Timer Section */}
        {scheduledDate && scheduledTime && (
          <div className="mb-4">
            <TournamentTimer 
              scheduledDate={scheduledDate}
              scheduledTime={scheduledTime}
              status={status}
            />
          </div>
        )}

        {/* Tournament Started Message */}
        {timeLeft.isExpired && userHasCompletedPayment && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center space-x-2 text-green-800 dark:text-green-200">
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Tournament Started!</span>
            </div>
            <p className="text-xs text-green-600 dark:text-green-300 mt-1">
              Check WhatsApp group for room credentials
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <DollarSign className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <p className="text-lg font-bold text-green-500">₹{prizePool}</p>
            <p className="text-xs text-gray-600 dark:text-gray-300">Prize Pool</p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <Trophy className="h-5 w-5 mx-auto mb-1 text-orange-500" />
            <p className="text-lg font-bold text-orange-500">₹{entryFee}</p>
            <p className="text-xs text-gray-600 dark:text-gray-300">Entry Fee</p>
          </div>
        </div>
        
        <Button 
          onClick={handleButtonClick}
          disabled={isButtonDisabled()}
          className={`morph-button w-full font-medium ${
            isButtonDisabled() 
              ? 'bg-gray-400 cursor-not-allowed' 
              : timeLeft.isExpired && userHasCompletedPayment
              ? 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white'
              : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white'
          }`}
        >
          {getButtonText()}
        </Button>
      </CardContent>
    </Card>
  );
};

export default TournamentCard;
