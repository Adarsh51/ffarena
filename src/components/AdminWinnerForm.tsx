
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/hooks/use-toast';
import { Trophy } from 'lucide-react';

export const AdminWinnerForm = () => {
  const [playerName, setPlayerName] = useState('');
  const [tournamentType, setTournamentType] = useState('');
  const [prizeAmount, setPrizeAmount] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName || !tournamentType) return;

    setLoading(true);
    try {
      let imageUrl = null;

      if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('winner-images')
          .upload(fileName, image);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('winner-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      const { error } = await supabase
        .from('winners')
        .insert({
          player_name: playerName,
          tournament_type: tournamentType as any,
          prize_amount: prizeAmount ? parseInt(prizeAmount) : null,
          image_url: imageUrl,
          tournament_date: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Winner added successfully! Player stats will be updated automatically.",
      });

      // Reset form
      setPlayerName('');
      setTournamentType('');
      setPrizeAmount('');
      setImage(null);
      
    } catch (error) {
      console.error('Error adding winner:', error);
      toast({
        title: "Error", 
        description: "Failed to add winner",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Add Winner
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="playerName">Player Name</Label>
            <Input
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter player name"
              required
            />
          </div>

          <div>
            <Label htmlFor="tournamentType">Tournament Type</Label>
            <Select value={tournamentType} onValueChange={setTournamentType}>
              <SelectTrigger>
                <SelectValue placeholder="Select tournament type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solo">Solo</SelectItem>
                <SelectItem value="duo">Duo</SelectItem>
                <SelectItem value="squad">Squad</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="prizeAmount">Prize Amount (₹)</Label>
            <Input
              id="prizeAmount"
              type="number"
              value={prizeAmount}
              onChange={(e) => setPrizeAmount(e.target.value)}
              placeholder="Enter prize amount"
            />
          </div>

          <div>
            <Label htmlFor="image">Winner Image</Label>
            <Input
              id="image"
              type="file"
              onChange={handleImageChange}
              accept="image/*"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Adding Winner...' : 'Add Winner'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
