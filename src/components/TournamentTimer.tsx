
import React from 'react';
import { Clock } from 'lucide-react';
import { useTournamentTimer } from '@/hooks/useTournamentTimer';

interface TournamentTimerProps {
  scheduledDate: string;
  scheduledTime: string;
  status: string;
  className?: string;
}

export const TournamentTimer: React.FC<TournamentTimerProps> = ({
  scheduledDate,
  scheduledTime,
  status,
  className = ""
}) => {
  const timeLeft = useTournamentTimer({ scheduledDate, scheduledTime, status });

  if (status === 'completed') {
    return (
      <div className={`flex items-center text-gray-500 ${className}`}>
        <Clock className="h-4 w-4 mr-1" />
        <span className="text-sm">Tournament Completed</span>
      </div>
    );
  }

  if (status === 'active') {
    return (
      <div className={`flex items-center text-green-500 ${className}`}>
        <Clock className="h-4 w-4 mr-1" />
        <span className="text-sm font-medium">Tournament Live</span>
      </div>
    );
  }

  if (timeLeft.isExpired) {
    return (
      <div className={`flex items-center text-red-500 ${className}`}>
        <Clock className="h-4 w-4 mr-1" />
        <span className="text-sm font-medium">Tournament Started</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center text-orange-500 ${className}`}>
      <Clock className="h-4 w-4 mr-1" />
      <div className="text-sm font-mono">
        {timeLeft.days > 0 && `${timeLeft.days}d `}
        {String(timeLeft.hours).padStart(2, '0')}:
        {String(timeLeft.minutes).padStart(2, '0')}:
        {String(timeLeft.seconds).padStart(2, '0')}
      </div>
    </div>
  );
};
