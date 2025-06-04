
import { useState, useEffect } from 'react';

interface TournamentTimerProps {
  scheduledDate: string;
  scheduledTime: string;
  status: string;
}

export const useTournamentTimer = ({ scheduledDate, scheduledTime, status }: TournamentTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });

  const [timerStatus, setTimerStatus] = useState<'upcoming' | 'started' | 'ended'>('upcoming');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const tournamentDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      const now = new Date();
      const difference = tournamentDateTime.getTime() - now.getTime();

      if (status === 'started') {
        setTimerStatus('started');
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
        return;
      }

      if (status === 'ended') {
        setTimerStatus('ended');
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
        return;
      }

      if (difference > 0) {
        setTimerStatus('upcoming');
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
          total: difference
        });
      } else {
        setTimerStatus('started');
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [scheduledDate, scheduledTime, status]);

  return { timeLeft, timerStatus };
};
