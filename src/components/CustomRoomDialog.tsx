
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CustomRoomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentName: string;
}

export const CustomRoomDialog: React.FC<CustomRoomDialogProps> = ({
  isOpen,
  onClose,
  tournamentName
}) => {
  const { toast } = useToast();

  const roomDetails = {
    roomId: "FF-ARENA-" + Math.random().toString(36).substr(2, 8).toUpperCase(),
    password: Math.random().toString(36).substr(2, 6).toUpperCase()
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard`
    });
  };

  const openWhatsApp = () => {
    const message = `🎮 ${tournamentName} - Room Details:\n\nRoom ID: ${roomDetails.roomId}\nPassword: ${roomDetails.password}\n\nJoin now!`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">🎮 Join Custom Room</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="font-semibold text-lg mb-2">{tournamentName}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tournament has started! Join the custom room now.
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Room ID</p>
                <p className="text-lg font-mono font-bold">{roomDetails.roomId}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(roomDetails.roomId, 'Room ID')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Password</p>
                <p className="text-lg font-mono font-bold">{roomDetails.password}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(roomDetails.password, 'Password')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={openWhatsApp}
              className="flex-1 bg-green-500 hover:bg-green-600"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Share on WhatsApp
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
