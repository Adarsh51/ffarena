
import { useState, useEffect } from 'react';

interface UseTournamentTimerProps {
  scheduledDate: string;
  scheduledTime: string;
  status: string;
}

export const useTournamentTimer = ({ scheduledDate, scheduledTime, status }: UseTournamentTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  useEffect(() => {
    if (status !== 'upcoming') {
      setTimeLeft(prev => ({ ...prev, isExpired: true }));
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const targetDate = new Date(`${scheduledDate}T${scheduledTime}`).getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({
          days,
          hours,
          minutes,
          seconds,
          isExpired: false
        });
      } else {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [scheduledDate, scheduledTime, status]);

  return timeLeft;
};
