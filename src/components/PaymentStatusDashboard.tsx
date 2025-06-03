
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TournamentRegistration {
  id: string;
  tournament_type: string;
  slot_time: string;
  payment_status: string;
  created_at: string;
}

export const PaymentStatusDashboard = () => {
  const { user } = useUser();

  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ['player-registrations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('tournament_registrations')
        .select(`
          id,
          tournament_type,
          slot_time,
          payment_status,
          created_at,
          player:players!inner(clerk_user_id)
        `)
        .eq('player.clerk_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Confirmed';
      case 'failed':
        return 'Failed';
      default:
        return 'Pending';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 dark:text-green-400';
      case 'failed':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-yellow-600 dark:text-yellow-400';
    }
  };

  if (isLoading) {
    return (
      <Card className="morph-container">
        <CardHeader>
          <CardTitle className="text-lg">Payment Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="morph-container">
      <CardHeader>
        <CardTitle className="text-lg">Payment Status</CardTitle>
      </CardHeader>
      <CardContent>
        {registrations.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            No tournament registrations yet
          </p>
        ) : (
          <div className="space-y-3">
            {registrations.map((registration) => (
              <div 
                key={registration.id} 
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm capitalize">
                    {registration.tournament_type} Tournament
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {new Date(registration.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(registration.payment_status)}
                  <span className={`text-sm font-medium ${getStatusColor(registration.payment_status)}`}>
                    {getStatusText(registration.payment_status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
