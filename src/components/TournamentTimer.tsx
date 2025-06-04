
import React from 'react';
import { Clock } from 'lucide-react';
import { useTournamentTimer } from '@/hooks/useTournamentTimer';

interface TournamentTimerProps {
  scheduledDate: string;
  scheduledTime: string;
  status: string;
}

export const TournamentTimer: React.FC<TournamentTimerProps> = ({
  scheduledDate,
  scheduledTime,
  status
}) => {
  const { timeLeft, timerStatus } = useTournamentTimer({ scheduledDate, scheduledTime, status });

  const getStatusDisplay = () => {
    switch (timerStatus) {
      case 'upcoming':
        return (
          <div className="flex items-center space-x-2 text-blue-500">
            <Clock className="h-4 w-4" />
            <span className="font-mono text-sm">
              {timeLeft.days > 0 && `${timeLeft.days}d `}
              {String(timeLeft.hours).padStart(2, '0')}:
              {String(timeLeft.minutes).padStart(2, '0')}:
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
          </div>
        );
      case 'started':
        return (
          <div className="flex items-center space-x-2 text-green-500">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <span className="font-medium text-sm">LIVE NOW</span>
          </div>
        );
      case 'ended':
        return (
          <div className="flex items-center space-x-2 text-gray-500">
            <Clock className="h-4 w-4" />
            <span className="font-medium text-sm">ENDED</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-2 border">
      {getStatusDisplay()}
    </div>
  );
};
