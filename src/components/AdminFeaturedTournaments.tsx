
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/hooks/use-toast';
import { Trash2, Star, Edit2, Save, X } from 'lucide-react';

interface Tournament {
  id: string;
  name: string;
  type: string;
  scheduled_date: string;
  prize_pool: number;
}

interface FeaturedTournament {
  id: string;
  tournament_id: string;
  display_order: number;
  tournaments: Tournament;
}

interface FeaturedTournamentTemplate {
  id: string;
  title: string;
  type: 'solo' | 'duo' | 'squad';
  time: string;
  prizePool: string;
  image: string;
  maxPlayers: number;
}

// Default featured tournament templates
const defaultFeaturedTournaments: FeaturedTournamentTemplate[] = [
  {
    id: 'featured-1',
    title: "Friday Night Battle",
    type: 'solo',
    time: "8:00 PM",
    prizePool: "5000",
    image: "photo-1581092795360-fd1ca04f0952",
    maxPlayers: 100
  },
  {
    id: 'featured-2',
    title: "Weekend Warriors",
    type: 'duo',
    time: "6:00 PM", 
    prizePool: "10000",
    image: "photo-1605810230434-7631ac76ec81",
    maxPlayers: 50
  },
  {
    id: 'featured-3',
    title: "Squad Championship",
    type: 'squad',
    time: "9:00 PM",
    prizePool: "25000",
    image: "photo-1519389950473-47ba0277781c",
    maxPlayers: 25
  },
  {
    id: 'featured-4',
    title: "Elite Solo Challenge",
    type: 'solo',
    time: "7:00 PM",
    prizePool: "3000",
    image: "photo-1488590528505-98d2b5aba04b",
    maxPlayers: 80
  },
  {
    id: 'featured-5',
    title: "Dynamic Duo Derby",
    type: 'duo',
    time: "5:00 PM",
    prizePool: "8000",
    image: "photo-1526374965328-7f61d4dc18c5",
    maxPlayers: 40
  },
  {
    id: 'featured-6',
    title: "Squad Legends",
    type: 'squad',
    time: "10:00 PM",
    prizePool: "15000",
    image: "photo-1487058792275-0ad4aaf24ca7",
    maxPlayers: 30
  }
];

export const AdminFeaturedTournaments = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [featuredTournaments, setFeaturedTournaments] = useState<FeaturedTournament[]>([]);
  const [featuredTemplates, setFeaturedTemplates] = useState<FeaturedTournamentTemplate[]>(defaultFeaturedTournaments);
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<Partial<FeaturedTournamentTemplate>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchTournaments();
    fetchFeaturedTournaments();
    loadFeaturedTemplates();

    // Set up real-time subscription for featured tournaments
    const channel = supabase
      .channel('featured-tournaments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'featured_tournaments'
        },
        () => {
          fetchFeaturedTournaments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadFeaturedTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .like('setting_key', 'featured_tournament_%');

      if (error) throw error;

      // Update templates with saved values
      const updatedTemplates = featuredTemplates.map(template => {
        const savedTemplate = data?.find(setting => 
          setting.setting_key === `featured_tournament_${template.id}`
        );
        
        if (savedTemplate) {
          try {
            const parsedData = JSON.parse(savedTemplate.setting_value);
            return { ...template, ...parsedData };
          } catch (e) {
            console.error('Error parsing saved template:', e);
          }
        }
        return template;
      });

      setFeaturedTemplates(updatedTemplates);
    } catch (error) {
      console.error('Error loading featured templates:', error);
    }
  };

  const saveFeaturedTemplate = async (template: FeaturedTournamentTemplate) => {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          setting_key: `featured_tournament_${template.id}`,
          setting_value: JSON.stringify(template),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Featured tournament template updated successfully",
      });

      await loadFeaturedTemplates();
    } catch (error) {
      console.error('Error saving featured template:', error);
      toast({
        title: "Error",
        description: "Failed to save featured tournament template",
        variant: "destructive",
      });
    }
  };

  const startEditing = (template: FeaturedTournamentTemplate) => {
    setEditingTemplate(template.id);
    setEditingValues(template);
  };

  const cancelEditing = () => {
    setEditingTemplate(null);
    setEditingValues({});
  };

  const saveEditing = async () => {
    if (!editingTemplate || !editingValues) return;

    const updatedTemplate = featuredTemplates.find(t => t.id === editingTemplate);
    if (!updatedTemplate) return;

    const newTemplate = { ...updatedTemplate, ...editingValues };
    await saveFeaturedTemplate(newTemplate);
    
    setEditingTemplate(null);
    setEditingValues({});
  };

  const fetchTournaments = async () => {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .order('scheduled_date', { ascending: true });

    if (error) {
      console.error('Error fetching tournaments:', error);
      return;
    }

    setTournaments(data || []);
  };

  const fetchFeaturedTournaments = async () => {
    const { data, error } = await supabase
      .from('featured_tournaments')
      .select(`
        *,
        tournaments:tournament_id (*)
      `)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching featured tournaments:', error);
      return;
    }

    setFeaturedTournaments(data || []);
  };

  const addFeaturedTournament = async () => {
    if (!selectedTournament) return;

    setLoading(true);
    try {
      const nextOrder = featuredTournaments.length;
      
      const { error } = await supabase
        .from('featured_tournaments')
        .insert({
          tournament_id: selectedTournament,
          display_order: nextOrder
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tournament added to featured list",
      });

      setSelectedTournament('');
    } catch (error) {
      console.error('Error adding featured tournament:', error);
      toast({
        title: "Error",
        description: "Failed to add featured tournament",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFeaturedTournament = async (id: string) => {
    try {
      const { error } = await supabase
        .from('featured_tournaments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tournament removed from featured list",
      });
    } catch (error) {
      console.error('Error removing featured tournament:', error);
      toast({
        title: "Error",
        description: "Failed to remove featured tournament",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Featured Tournament Templates Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit2 className="h-5 w-5" />
            Customize Featured Tournament Templates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featuredTemplates.map((template) => (
              <div key={template.id} className="border rounded-lg p-4 space-y-3">
                {editingTemplate === template.id ? (
                  <>
                    <div>
                      <Label>Tournament Title</Label>
                      <Input
                        value={editingValues.title || template.title}
                        onChange={(e) => setEditingValues(prev => ({ ...prev, title: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Type</Label>
                        <Select 
                          value={editingValues.type || template.type} 
                          onValueChange={(value) => setEditingValues(prev => ({ ...prev, type: value as 'solo' | 'duo' | 'squad' }))}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="solo">Solo</SelectItem>
                            <SelectItem value="duo">Duo</SelectItem>
                            <SelectItem value="squad">Squad</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Time</Label>
                        <Input
                          value={editingValues.time || template.time}
                          onChange={(e) => setEditingValues(prev => ({ ...prev, time: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Prize Pool (₹)</Label>
                        <Input
                          value={editingValues.prizePool || template.prizePool}
                          onChange={(e) => setEditingValues(prev => ({ ...prev, prizePool: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Max Players</Label>
                        <Input
                          type="number"
                          value={editingValues.maxPlayers || template.maxPlayers}
                          onChange={(e) => setEditingValues(prev => ({ ...prev, maxPlayers: parseInt(e.target.value) }))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={saveEditing} size="sm" className="flex-1">
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button onClick={cancelEditing} variant="outline" size="sm" className="flex-1">
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{template.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                          {template.type} • {template.time} • ₹{template.prizePool} • {template.maxPlayers} players
                        </p>
                      </div>
                      <Button onClick={() => startEditing(template)} variant="outline" size="sm">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Database Featured Tournaments Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Manage Database Featured Tournaments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            <Select value={selectedTournament} onValueChange={setSelectedTournament}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a tournament to feature" />
              </SelectTrigger>
              <SelectContent>
                {tournaments
                  .filter(t => !featuredTournaments.some(ft => ft.tournament_id === t.id))
                  .map((tournament) => (
                    <SelectItem key={tournament.id} value={tournament.id}>
                      {tournament.name} - {tournament.type} - ₹{tournament.prize_pool}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={addFeaturedTournament} 
              disabled={!selectedTournament || loading}
            >
              Add Featured
            </Button>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Current Featured Tournaments:</h3>
            {featuredTournaments.length === 0 ? (
              <p className="text-muted-foreground">No featured tournaments yet</p>
            ) : (
              featuredTournaments.map((featured) => (
                <div key={featured.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <span className="font-medium">{featured.tournaments.name}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {featured.tournaments.type} - ₹{featured.tournaments.prize_pool}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeFeaturedTournament(featured.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
