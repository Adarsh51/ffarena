
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface Tournament {
  id: string;
  name: string;
  type: string;
  scheduled_date: string;
  scheduled_time: string;
  prize_pool: number;
  entry_fee: number;
  max_participants: number;
  status: string;
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

export const useFeaturedTournaments = () => {
  const [featuredTournaments, setFeaturedTournaments] = useState<Tournament[]>([]);
  const [featuredTemplates, setFeaturedTemplates] = useState<FeaturedTournamentTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Default templates as fallback
  const defaultTemplates: FeaturedTournamentTemplate[] = [
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch database featured tournaments
        const { data: dbFeatured, error: dbError } = await supabase
          .from('featured_tournaments')
          .select(`
            tournaments:tournament_id (*)
          `)
          .eq('is_featured', true)
          .order('display_order', { ascending: true });

        if (dbError) throw dbError;

        const tournaments = dbFeatured?.map(item => item.tournaments).filter(Boolean) || [];
        setFeaturedTournaments(tournaments);

        // Fetch customized templates
        const { data: templatesData, error: templatesError } = await supabase
          .from('settings')
          .select('*')
          .like('setting_key', 'featured_tournament_%');

        if (templatesError) throw templatesError;

        // Update templates with saved values
        const updatedTemplates = defaultTemplates.map(template => {
          const savedTemplate = templatesData?.find(setting => 
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
        console.error('Error fetching featured data:', error);
        // Use default templates as fallback
        setFeaturedTemplates(defaultTemplates);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up real-time subscription
    const channel = supabase
      .channel('featured-tournaments-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'featured_tournaments'
        },
        () => {
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'settings'
        },
        (payload) => {
          // Only refetch if it's a featured tournament setting
          if (payload.new?.setting_key?.includes('featured_tournament_')) {
            fetchData();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { featuredTournaments, featuredTemplates, loading };
};
