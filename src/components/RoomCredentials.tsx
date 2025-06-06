
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Users, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

interface RoomCredentialsProps {
  isOpen: boolean;
  onClose: () => void;
  roomId?: string;
  roomPassword?: string;
  tournamentName?: string;
  tournament?: Tournament | null;
  isAdminView?: boolean;
}

export const RoomCredentials: React.FC<RoomCredentialsProps> = ({
  isOpen,
  onClose,
  roomId = '',
  roomPassword = '',
  tournamentName = '',
  tournament = null,
  isAdminView = false
}) => {
  const { toast } = useToast();
  const [editingRoomId, setEditingRoomId] = useState('');
  const [editingRoomPassword, setEditingRoomPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tournament) {
      setEditingRoomId(tournament.room_id || '');
      setEditingRoomPassword(tournament.room_password || '');
    } else {
      setEditingRoomId(roomId);
      setEditingRoomPassword(roomPassword);
    }
  }, [tournament, roomId, roomPassword]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const saveCredentials = async () => {
    if (!tournament) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('tournaments')
        .update({
          room_id: editingRoomId,
          room_password: editingRoomPassword
        })
        .eq('id', tournament.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Room credentials saved successfully",
      });
      onClose();
    } catch (error) {
      console.error('Error saving credentials:', error);
      toast({
        title: "Error",
        description: "Failed to save room credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const displayName = tournament?.name || tournamentName;
  const displayRoomId = tournament ? editingRoomId : roomId;
  const displayPassword = tournament ? editingRoomPassword : roomPassword;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-green-500" />
            <span>{isAdminView || tournament ? 'Manage Room Credentials' : 'Join Tournament Room'}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
              {displayName}
            </h3>
            <p className="text-sm text-green-600 dark:text-green-300">
              {isAdminView || tournament ? 'Set room credentials for this tournament' : 'Tournament has started! Use these credentials to join the custom room.'}
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">Room ID</Label>
              {isAdminView || tournament ? (
                <Input
                  value={editingRoomId}
                  onChange={(e) => setEditingRoomId(e.target.value)}
                  placeholder="Enter Room ID"
                  className="mt-1"
                />
              ) : (
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono text-lg font-bold">{displayRoomId}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(displayRoomId, 'Room ID')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">Password</Label>
              {isAdminView || tournament ? (
                <Input
                  value={editingRoomPassword}
                  onChange={(e) => setEditingRoomPassword(e.target.value)}
                  placeholder="Enter Room Password"
                  className="mt-1"
                />
              ) : (
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono text-lg font-bold">{displayPassword}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(displayPassword, 'Password')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {!isAdminView && !tournament && (
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Keep these credentials safe and join the room in Free Fire
            </div>
          )}

          <div className="flex gap-2">
            {isAdminView || tournament ? (
              <>
                <Button onClick={onClose} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button onClick={saveCredentials} disabled={loading} className="flex-1">
                  {loading ? 'Saving...' : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button onClick={onClose} className="w-full">
                Got it!
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
