
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Clock, DollarSign, Trophy } from 'lucide-react';

interface TournamentCardProps {
  title: string;
  type: 'solo' | 'duo' | 'squad';
  time: string;
  entryFee: string;
  prizePool: string;
  image: string;
  maxPlayers: number;
  onRegister: () => void;
}

const TournamentCard: React.FC<TournamentCardProps> = ({
  title,
  type,
  time,
  entryFee,
  prizePool,
  image,
  maxPlayers,
  onRegister
}) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'solo': return 'bg-blue-500';
      case 'duo': return 'bg-green-500';
      case 'squad': return 'bg-purple-500';
      default: return 'bg-gray-500';
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
          onClick={onRegister}
          className="morph-button w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium"
        >
          Register Now
        </Button>
      </CardContent>
    </Card>
  );
};

export default TournamentCard;
