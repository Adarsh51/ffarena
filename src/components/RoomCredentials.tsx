
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RoomCredentialsProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomPassword: string;
  tournamentName: string;
}

export const RoomCredentials: React.FC<RoomCredentialsProps> = ({
  isOpen,
  onClose,
  roomId,
  roomPassword,
  tournamentName
}) => {
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-green-500" />
            <span>Join Tournament Room</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
              {tournamentName}
            </h3>
            <p className="text-sm text-green-600 dark:text-green-300">
              Tournament has started! Use these credentials to join the custom room.
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Room ID</label>
              <div className="flex items-center justify-between mt-1">
                <span className="font-mono text-lg font-bold">{roomId}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(roomId, 'Room ID')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Password</label>
              <div className="flex items-center justify-between mt-1">
                <span className="font-mono text-lg font-bold">{roomPassword}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(roomPassword, 'Password')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Keep these credentials safe and join the room in Free Fire
          </div>

          <Button onClick={onClose} className="w-full">
            Got it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
