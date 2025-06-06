
import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/hooks/use-toast';
import { FeaturedTemplatesManager } from './admin/FeaturedTemplatesManager';
import { DatabaseFeaturedTournaments } from './admin/DatabaseFeaturedTournaments';

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

      if (error) {
        console.error('Error loading featured templates:', error);
        return;
      }

      // Update templates with saved values
      const updatedTemplates = defaultFeaturedTournaments.map(template => {
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
      console.log('Saving template:', template);
      
      const { data, error } = await supabase
        .from('settings')
        .upsert({
          setting_key: `featured_tournament_${template.id}`,
          setting_value: JSON.stringify(template)
        }, {
          onConflict: 'setting_key'
        })
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Save successful:', data);

      toast({
        title: "Success",
        description: "Featured tournament template updated successfully",
      });

      await loadFeaturedTemplates();
    } catch (error) {
      console.error('Error saving featured template:', error);
      toast({
        title: "Error",
        description: `Failed to save featured tournament template: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('scheduled_date', { ascending: true });

      if (error) {
        console.error('Error fetching tournaments:', error);
        return;
      }

      setTournaments(data || []);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    }
  };

  const fetchFeaturedTournaments = async () => {
    try {
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
    } catch (error) {
      console.error('Error fetching featured tournaments:', error);
    }
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
          display_order: nextOrder,
          is_featured: true
        });

      if (error) {
        console.error('Supabase error adding featured tournament:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Tournament added to featured list",
      });

      setSelectedTournament('');
      await fetchFeaturedTournaments();
    } catch (error) {
      console.error('Error adding featured tournament:', error);
      toast({
        title: "Error",
        description: `Failed to add featured tournament: ${error instanceof Error ? error.message : 'Unknown error'}`,
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

      if (error) {
        console.error('Supabase error removing featured tournament:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Tournament removed from featured list",
      });

      await fetchFeaturedTournaments();
    } catch (error) {
      console.error('Error removing featured tournament:', error);
      toast({
        title: "Error",
        description: `Failed to remove featured tournament: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <FeaturedTemplatesManager
        featuredTemplates={featuredTemplates}
        editingTemplate={editingTemplate}
        editingValues={editingValues}
        onStartEditing={startEditing}
        onCancelEditing={cancelEditing}
        onSaveEditing={saveEditing}
        onUpdateEditingValues={setEditingValues}
      />

      <DatabaseFeaturedTournaments
        tournaments={tournaments}
        featuredTournaments={featuredTournaments}
        selectedTournament={selectedTournament}
        loading={loading}
        onSelectedTournamentChange={setSelectedTournament}
        onAddFeaturedTournament={addFeaturedTournament}
        onRemoveFeaturedTournament={removeFeaturedTournament}
      />
    </div>
  );
};
