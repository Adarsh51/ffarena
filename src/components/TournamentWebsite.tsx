import React, { useState, useEffect } from 'react';
import { useUser, useAuth, SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Moon, Sun, Trophy, Users, Clock, DollarSign, Settings, Download, Calendar, MessageSquare, Bell, FileText, BarChart3, Shield, CheckCircle, XCircle, Edit, Trash2, Search, Filter, Upload, Image } from 'lucide-react';
import TournamentCard from './TournamentCard';

interface Player {
  id: string;
  clerk_user_id: string;
  username: string;
  email: string;
  in_game_name: string | null;
  free_fire_uid: string | null;
  created_at: string;
}

interface TournamentRegistration {
  id: string;
  player_id: string;
  tournament_type: string;
  slot_time: string;
  payment_status: string;
  created_at: string;
  player: Player;
}

interface Winner {
  id: string;
  player_name: string;
  tournament_type: string;
  tournament_date: string;
  image_url: string | null;
}

interface Tournament {
  id: string;
  name: string;
  type: 'solo' | 'duo' | 'squad';
  scheduled_date: string;
  scheduled_time: string;
  max_participants: number;
  entry_fee: number;
  status: 'upcoming' | 'active' | 'completed';
  prize_pool: number;
}

interface PlayerStats {
  player_id: string;
  tournaments_played: number;
  tournaments_won: number;
  total_earnings: number;
}

interface GameSettings {
  entry_fee_solo: string;
  entry_fee_duo: string;
  entry_fee_squad: string;
  upi_id: string;
}

type TournamentType = 'solo' | 'duo' | 'squad';

const TournamentWebsite = () => {
  const { user, isSignedIn } = useUser();
  const { signOut } = useAuth();
  const { toast } = useToast();
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('ff-arena-theme');
    return saved ? JSON.parse(saved) : false;
  });

  // Player data state
  const [playerProfile, setPlayerProfile] = useState<Player | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  
  // Form states
  const [inGameName, setInGameName] = useState('');
  const [freeFireUID, setFreeFireUID] = useState('');
  const [tournamentType, setTournamentType] = useState<TournamentType | ''>('');
  const [slotTime, setSlotTime] = useState('');
  
  // Modal states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  
  // Admin states
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [tournamentRegistrations, setTournamentRegistrations] = useState<TournamentRegistration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<TournamentRegistration[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [settings, setSettings] = useState<GameSettings>({
    entry_fee_solo: '50',
    entry_fee_duo: '100',
    entry_fee_squad: '150',
    upi_id: 'ffarena@paytm'
  });
  const [newWinnerName, setNewWinnerName] = useState('');
  const [newWinnerType, setNewWinnerType] = useState<TournamentType | ''>('');
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [winnerImage, setWinnerImage] = useState<File | null>(null);

  // Filter states
  const [registrationFilter, setRegistrationFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');

  // New tournament form states
  const [newTournament, setNewTournament] = useState({
    name: '',
    type: '' as TournamentType | '',
    scheduled_date: '',
    scheduled_time: '',
    max_participants: 50,
    prize_pool: 1000
  });

  // Featured tournament cards data
  const featuredTournaments = [
    {
      title: "Friday Night Battle",
      type: 'solo' as const,
      time: "8:00 PM",
      entryFee: settings.entry_fee_solo,
      prizePool: "5000",
      image: "photo-1581092795360-fd1ca04f0952",
      maxPlayers: 100
    },
    {
      title: "Weekend Warriors",
      type: 'duo' as const,
      time: "6:00 PM", 
      entryFee: settings.entry_fee_duo,
      prizePool: "10000",
      image: "photo-1605810230434-7631ac76ec81",
      maxPlayers: 50
    },
    {
      title: "Squad Championship",
      type: 'squad' as const,
      time: "9:00 PM",
      entryFee: settings.entry_fee_squad,
      prizePool: "25000",
      image: "photo-1519389950473-47ba0277781c",
      maxPlayers: 25
    },
    {
      title: "Elite Solo Challenge",
      type: 'solo' as const,
      time: "7:00 PM",
      entryFee: settings.entry_fee_solo,
      prizePool: "3000",
      image: "photo-1488590528505-98d2b5aba04b",
      maxPlayers: 80
    },
    {
      title: "Dynamic Duo Derby",
      type: 'duo' as const,
      time: "5:00 PM",
      entryFee: settings.entry_fee_duo,
      prizePool: "8000",
      image: "photo-1526374965328-7f61d4dc18c5",
      maxPlayers: 40
    },
    {
      title: "Squad Legends",
      type: 'squad' as const,
      time: "10:00 PM",
      entryFee: settings.entry_fee_squad,
      prizePool: "15000",
      image: "photo-1487058792275-0ad4aaf24ca7",
      maxPlayers: 30
    }
  ];

  // Load theme and data on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    // Load winners for all users regardless of sign-in status
    loadWinners();
    loadSettings();
    loadTournaments();
    if (isSignedIn && user) {
      loadPlayerProfile();
      loadPlayerStats();
    }
  }, [isSignedIn, user, isDarkMode]);

  // Save theme to localStorage
  useEffect(() => {
    localStorage.setItem('ff-arena-theme', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // Filter registrations based on search and filters
  useEffect(() => {
    let filtered = tournamentRegistrations;

    if (searchTerm) {
      filtered = filtered.filter(reg => 
        reg.player.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.player.in_game_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.player.free_fire_uid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.player.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (registrationFilter !== 'all') {
      filtered = filtered.filter(reg => reg.tournament_type === registrationFilter);
    }

    if (paymentFilter !== 'all') {
      filtered = filtered.filter(reg => reg.payment_status === paymentFilter);
    }

    setFilteredRegistrations(filtered);
  }, [tournamentRegistrations, searchTerm, registrationFilter, paymentFilter]);

  // Load player profile from Supabase
  const loadPlayerProfile = async () => {
    if (!user) return;
    
    console.log('Loading profile for user:', user.id);
    
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('clerk_user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading player profile:', error);
        throw error;
      }

      if (data) {
        console.log('Found existing player:', data);
        setPlayerProfile(data);
        setIsProfileComplete(!!(data.in_game_name && data.free_fire_uid));
        setInGameName(data.in_game_name || '');
        setFreeFireUID(data.free_fire_uid || '');
      } else {
        console.log('No existing player found, creating new one');
        const { data: created, error: createError } = await supabase
          .from('players')
          .insert([{
            clerk_user_id: user.id,
            username: user.username || user.firstName || 'Player',
            email: user.primaryEmailAddress?.emailAddress || '',
            in_game_name: null,
            free_fire_uid: null
          }])
          .select()
          .single();

        if (createError) {
          console.error('Error creating player:', createError);
          toast({
            title: "Setup Required",
            description: "Account setup is temporarily unavailable. Please try refreshing the page.",
            variant: "destructive"
          });
          return;
        }
        
        console.log('Created new player:', created);
        setPlayerProfile(created);
      }
    } catch (error) {
      console.error('Error in loadPlayerProfile:', error);
      toast({
        title: "Error",
        description: "Failed to load player profile. Please refresh the page.",
        variant: "destructive"
      });
    }
  };

  // Load tournament registrations with player details
  const loadTournamentRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from('tournament_registrations')
        .select(`
          *,
          player:players(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTournamentRegistrations(data || []);
    } catch (error) {
      console.error('Error loading tournament registrations:', error);
    }
  };

  // Load winners from Supabase - make this work for all users
  const loadWinners = async () => {
    try {
      console.log('Loading winners...');
      const { data, error } = await supabase
        .from('winners')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error loading winners:', error);
        // Don't throw error, just log it and continue
        setWinners([]);
        return;
      }
      
      console.log('Winners loaded:', data);
      setWinners(data || []);
    } catch (error) {
      console.error('Error in loadWinners:', error);
      setWinners([]);
    }
  };

  // Load settings from Supabase
  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*');

      if (error) throw error;

      const settingsObj: any = {};
      data?.forEach(setting => {
        settingsObj[setting.setting_key] = setting.setting_value;
      });
      setSettings(prev => ({ ...prev, ...settingsObj }));
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  // Load tournaments - using any type to bypass TypeScript issues until types are regenerated
  const loadTournaments = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('tournaments')
        .select('*')
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      setTournaments(data || []);
    } catch (error) {
      console.error('Error loading tournaments:', error);
    }
  };

  // Load player statistics - using any type to bypass TypeScript issues until types are regenerated
  const loadPlayerStats = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('player_stats')
        .select('*');

      if (error) throw error;
      setPlayerStats(data || []);
    } catch (error) {
      console.error('Error loading player stats:', error);
    }
  };

  // Create new tournament
  const createTournament = async () => {
    if (!newTournament.name || !newTournament.type || !newTournament.scheduled_date || !newTournament.scheduled_time) {
      toast({
        title: "Error",
        description: "Please fill in all tournament details",
        variant: "destructive"
      });
      return;
    }

    try {
      const entryFeeKey = `entry_fee_${newTournament.type}` as keyof GameSettings;
      const entryFee = parseInt(settings[entryFeeKey]);

      const { error } = await (supabase as any)
        .from('tournaments')
        .insert([{
          name: newTournament.name,
          type: newTournament.type,
          scheduled_date: newTournament.scheduled_date,
          scheduled_time: newTournament.scheduled_time,
          max_participants: newTournament.max_participants,
          entry_fee: entryFee,
          status: 'upcoming',
          prize_pool: newTournament.prize_pool
        }]);

      if (error) throw error;

      setNewTournament({
        name: '',
        type: '',
        scheduled_date: '',
        scheduled_time: '',
        max_participants: 50,
        prize_pool: 1000
      });
      
      await loadTournaments();
      toast({
        title: "Success",
        description: "Tournament created successfully!"
      });
    } catch (error) {
      console.error('Error creating tournament:', error);
      toast({
        title: "Error",
        description: "Failed to create tournament",
        variant: "destructive"
      });
    }
  };

  // Save player profile
  const savePlayerProfile = async () => {
    console.log('Attempting to save profile:', { inGameName, freeFireUID, playerProfile });
    
    if (!inGameName.trim() || !freeFireUID.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    if (!playerProfile) {
      toast({
        title: "Error",
        description: "Player profile not found. Please refresh the page.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('players')
        .update({
          in_game_name: inGameName.trim(),
          free_fire_uid: freeFireUID.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('clerk_user_id', user?.id);

      if (error) {
        console.error('Update error:', error);
        throw error;
      }

      setIsProfileComplete(true);
      toast({
        title: "Success",
        description: "Profile updated successfully!"
      });
      
      await loadPlayerProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Simplified tournament registration
  const handleTournamentRegistration = async (tournament: Tournament) => {
    console.log('Attempting to register for tournament:', tournament);
    
    if (!isSignedIn) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to register for tournaments",
        variant: "destructive"
      });
      return;
    }

    if (!playerProfile || !isProfileComplete) {
      toast({
        title: "Profile Incomplete",
        description: "Please complete your profile first",
        variant: "destructive"
      });
      return;
    }

    setSelectedTournament(tournament);
    setIsPaymentModalOpen(true);
  };

  // Handle featured tournament registration
  const handleFeaturedTournamentRegistration = (tournamentType: TournamentType) => {
    console.log('Attempting to register for featured tournament:', tournamentType);
    
    if (!isSignedIn) {
      toast({
        title: "Authentication Required", 
        description: "Please sign in to register for tournaments",
        variant: "destructive"
      });
      return;
    }

    if (!playerProfile || !isProfileComplete) {
      toast({
        title: "Profile Incomplete",
        description: "Please complete your profile first", 
        variant: "destructive"
      });
      return;
    }

    // Create a temporary tournament object for featured tournaments
    const tempTournament: Tournament = {
      id: `featured-${tournamentType}`,
      name: `Featured ${tournamentType.charAt(0).toUpperCase() + tournamentType.slice(1)} Tournament`,
      type: tournamentType,
      scheduled_date: new Date().toISOString().split('T')[0],
      scheduled_time: '20:00',
      max_participants: 100,
      entry_fee: parseInt(settings[`entry_fee_${tournamentType}` as keyof GameSettings]),
      status: 'upcoming',
      prize_pool: tournamentType === 'solo' ? 5000 : tournamentType === 'duo' ? 10000 : 25000
    };

    setSelectedTournament(tempTournament);
    setIsPaymentModalOpen(true);
  };

  // Handle payment completion
  const handlePaymentComplete = async () => {
    if (!playerProfile || !selectedTournament) {
      toast({
        title: "Error",
        description: "Missing player or tournament information",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Completing payment for:', selectedTournament);
      
      const { error } = await supabase
        .from('tournament_registrations')
        .insert([{
          player_id: playerProfile.id,
          tournament_type: selectedTournament.type,
          slot_time: `${selectedTournament.scheduled_date} ${selectedTournament.scheduled_time}`,
          payment_status: 'pending'
        }]);

      if (error) {
        console.error('Registration error:', error);
        throw error;
      }

      setIsPaymentModalOpen(false);
      setSelectedTournament(null);
      
      toast({
        title: "Registration Submitted!",
        description: "Your tournament registration has been submitted. Payment verification pending.",
      });
    } catch (error) {
      console.error('Error completing registration:', error);
      toast({
        title: "Registration Failed",
        description: "Failed to complete registration. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle admin login with form submission prevention
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (adminPassword === 'Admin123!') {
      setIsAdminMode(true);
      setIsAdminModalOpen(false);
      loadAllPlayers();
      loadTournamentRegistrations();
      setAdminPassword('');
      toast({
        title: "Success",
        description: "Admin access granted"
      });
    } else {
      toast({
        title: "Error",
        description: "Invalid admin password",
        variant: "destructive"
      });
    }
  };

  const loadAllPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllPlayers(data || []);
    } catch (error) {
      console.error('Error loading all players:', error);
    }
  };

  const removePlayer = async (playerId: string) => {
    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', playerId);

      if (error) throw error;
      
      await loadAllPlayers();
      toast({
        title: "Success",
        description: "Player removed successfully"
      });
    } catch (error) {
      console.error('Error removing player:', error);
      toast({
        title: "Error",
        description: "Failed to remove player",
        variant: "destructive"
      });
    }
  };

  const updateSettings = async (key: string, value: string) => {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({ setting_key: key, setting_value: value, updated_at: new Date().toISOString() });

      if (error) throw error;
      
      await loadSettings();
      toast({
        title: "Success",
        description: "Settings updated successfully"
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive"
      });
    }
  };

  // Fixed addWinner function to handle RLS properly
  const addWinner = async () => {
    if (!newWinnerName || !newWinnerType) {
      toast({
        title: "Error",
        description: "Please fill in winner details",
        variant: "destructive"
      });
      return;
    }

    try {
      let imageUrl = null;
      
      if (winnerImage) {
        imageUrl = await uploadWinnerImage(winnerImage);
        if (!imageUrl) {
          toast({
            title: "Error", 
            description: "Failed to upload winner image",
            variant: "destructive"
          });
          return;
        }
      }

      console.log('Adding winner:', { newWinnerName, newWinnerType, imageUrl });

      // Use INSERT with proper data structure
      const { data, error } = await supabase
        .from('winners')
        .insert({
          player_name: newWinnerName,
          tournament_type: newWinnerType,
          tournament_date: new Date().toISOString(),
          image_url: imageUrl
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding winner:', error);
        throw error;
      }

      console.log('Winner added successfully:', data);

      setNewWinnerName('');
      setNewWinnerType('');
      setWinnerImage(null);
      await loadWinners();
      
      toast({
        title: "Success",
        description: "Winner added successfully!"
      });
    } catch (error) {
      console.error('Error adding winner:', error);
      toast({
        title: "Error",
        description: "Failed to add winner. Please check your permissions.",
        variant: "destructive"
      });
    }
  };

  const uploadWinnerImage = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `winner-image-${Date.now()}.${fileExt}`;
      const { data, error } = await supabase
        .storage
        .from('winner-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Error uploading winner image:', error);
        return null;
      }

      if (data) {
        console.log('Winner image uploaded:', data);
        return data.path;
      }
    } catch (error) {
      console.error('Error in uploadWinnerImage:', error);
      return null;
    }
  };

  // Export players as CSV
  const exportPlayersCSV = () => {
    const csvContent = [
      ['Username', 'Email', 'In-Game Name', 'Free Fire UID', 'Created At'].join(','),
      ...allPlayers.map(player => [
        player.username,
        player.email,
        player.in_game_name || '',
        player.free_fire_uid || '',
        new Date(player.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ff-arena-players.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Export registrations as CSV
  const exportRegistrationsCSV = () => {
    const csvContent = [
      ['Player Name', 'Email', 'In-Game Name', 'Free Fire UID', 'Tournament Type', 'Slot Time', 'Payment Status', 'Registration Date'].join(','),
      ...filteredRegistrations.map(reg => [
        reg.player.username,
        reg.player.email,
        reg.player.in_game_name || '',
        reg.player.free_fire_uid || '',
        reg.tournament_type,
        reg.slot_time,
        reg.payment_status,
        new Date(reg.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tournament-registrations.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Update payment status
  const updatePaymentStatus = async (registrationId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('tournament_registrations')
        .update({ payment_status: status })
        .eq('id', registrationId);

      if (error) throw error;

      await loadTournamentRegistrations();
      toast({
        title: "Success",
        description: `Payment status updated to ${status}`,
      });
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive"
      });
    }
  };

  // Delete registration
  const deleteRegistration = async (registrationId: string) => {
    try {
      const { error } = await supabase
        .from('tournament_registrations')
        .delete()
        .eq('id', registrationId);

      if (error) throw error;

      await loadTournamentRegistrations();
      toast({
        title: "Success",
        description: "Registration deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting registration:', error);
      toast({
        title: "Error",
        description: "Failed to delete registration",
        variant: "destructive"
      });
    }
  };

  return (
    <div className={`min-h-screen transition-all duration-500 ${isDarkMode ? 'dark bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-purple-50'}`}>
      {/* Header - Made more mobile-friendly */}
      <header className="morph-container sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-gray-800/80 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Trophy className="h-6 w-6 md:h-8 md:w-8 text-orange-500" />
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              FF Arena
            </h1>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="morph-button h-9 w-9 md:h-10 md:w-10"
            >
              {isDarkMode ? <Sun className="h-4 w-4 md:h-5 md:w-5" /> : <Moon className="h-4 w-4 md:h-5 md:w-5" />}
            </Button>

            {/* Admin Button - Mobile optimized */}
            {!isAdminMode && (
              <Dialog open={isAdminModalOpen} onOpenChange={setIsAdminModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="morph-button text-sm md:text-base px-2 md:px-4">
                    <Settings className="h-4 w-4 mr-1 md:mr-2" />
                    <span className="hidden sm:inline">Admin</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-md mx-auto">
                  <DialogHeader>
                    <DialogTitle>Admin Login</DialogTitle>
                    <DialogDescription>
                      Enter the admin password to access the admin panel.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAdminLogin} className="space-y-4">
                    <div>
                      <Input
                        type="password"
                        placeholder="Enter admin password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="morph-input"
                        autoComplete="current-password"
                      />
                    </div>
                    <Button type="submit" className="morph-button w-full">
                      Login
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}

            {/* Authentication - Mobile optimized */}
            {isSignedIn ? (
              <div className="flex items-center space-x-2 md:space-x-3">
                <span className="text-xs md:text-sm font-medium hidden sm:block">
                  Welcome, {user?.username || user?.firstName}!
                </span>
                <UserButton />
              </div>
            ) : (
              <div className="flex items-center space-x-1 md:space-x-2">
                <SignInButton>
                  <Button variant="outline" className="morph-button text-xs md:text-sm px-2 md:px-4">
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton>
                  <Button className="morph-button text-xs md:text-sm px-2 md:px-4">
                    Sign Up
                  </Button>
                </SignUpButton>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 md:py-8 space-y-4 md:space-y-8">
        {isSignedIn ? (
          <>
            {/* Player Profile Section - Mobile optimized */}
            {!isProfileComplete && (
              <Card className="morph-container">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-lg md:text-xl">
                    <Users className="h-4 w-4 md:h-5 md:w-5" />
                    <span>Complete Your Profile</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="inGameName" className="text-sm font-medium">In-Game Name</Label>
                      <Input
                        id="inGameName"
                        value={inGameName}
                        onChange={(e) => setInGameName(e.target.value)}
                        placeholder="Enter your Free Fire in-game name"
                        className="morph-input mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="freeFireUID" className="text-sm font-medium">Free Fire UID</Label>
                      <Input
                        id="freeFireUID"
                        value={freeFireUID}
                        onChange={(e) => setFreeFireUID(e.target.value)}
                        placeholder="Enter your Free Fire UID"
                        className="morph-input mt-1"
                      />
                    </div>
                  </div>
                  <Button onClick={savePlayerProfile} className="morph-button w-full">
                    Save Profile
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Featured Tournament Cards - Fixed registration */}
            {isProfileComplete && !isAdminMode && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">Featured Tournaments</h2>
                  <p className="text-gray-600 dark:text-gray-300">Join the action and compete for amazing prizes!</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredTournaments.map((tournament, index) => (
                    <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                      <TournamentCard
                        {...tournament}
                        onRegister={() => handleFeaturedTournamentRegistration(tournament.type)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Tournaments - Fixed registration */}
            {isProfileComplete && !isAdminMode && tournaments.length > 0 && (
              <Card className="morph-container">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Scheduled Tournaments</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tournaments.filter(t => t.status === 'upcoming').map((tournament) => (
                      <div key={tournament.id} className="morph-winner-card p-4">
                        <h3 className="font-bold text-lg mb-2">{tournament.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 capitalize mb-1">
                          {tournament.type} Tournament
                        </p>
                        <p className="text-sm mb-1">
                          <Clock className="h-4 w-4 inline mr-1" />
                          {new Date(tournament.scheduled_date).toLocaleDateString()} at {tournament.scheduled_time}
                        </p>
                        <p className="text-sm mb-1">
                          <Users className="h-4 w-4 inline mr-1" />
                          Max: {tournament.max_participants} players
                        </p>
                        <p className="text-sm mb-3">
                          <DollarSign className="h-4 w-4 inline mr-1" />
                          Prize Pool: ₹{tournament.prize_pool}
                        </p>
                        <Button 
                          className="morph-button w-full" 
                          size="sm"
                          onClick={() => handleTournamentRegistration(tournament)}
                        >
                          Register (₹{tournament.entry_fee})
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Player Statistics */}
            {isProfileComplete && !isAdminMode && playerProfile && (
              <Card className="morph-container">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <span>Your Statistics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(() => {
                      const stats = playerStats.find(s => s.player_id === playerProfile.id) || {
                        tournaments_played: 0,
                        tournaments_won: 0,
                        total_earnings: 0
                      };
                      return (
                        <>
                          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <p className="text-2xl font-bold text-blue-500">{stats.tournaments_played}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Tournaments Played</p>
                          </div>
                          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <p className="text-2xl font-bold text-green-500">{stats.tournaments_won}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Tournaments Won</p>
                          </div>
                          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <p className="text-2xl font-bold text-yellow-500">₹{stats.total_earnings}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Total Earnings</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Enhanced Admin Panel */}
            {isAdminMode && (
              <div className="space-y-4 md:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h2 className="text-xl md:text-2xl font-bold flex items-center space-x-2">
                    <Shield className="h-6 w-6 text-blue-500" />
                    <span>Admin Dashboard</span>
                  </h2>
                  <Button 
                    onClick={() => setIsAdminMode(false)}
                    variant="outline"
                    className="morph-button w-full sm:w-auto"
                  >
                    Exit Admin
                  </Button>
                </div>

                {/* Admin Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="morph-container">
                    <CardContent className="p-4 text-center">
                      <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{allPlayers.length}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Total Players</p>
                    </CardContent>
                  </Card>
                  <Card className="morph-container">
                    <CardContent className="p-4 text-center">
                      <FileText className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{tournamentRegistrations.length}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Total Registrations</p>
                    </CardContent>
                  </Card>
                  <Card className="morph-container">
                    <CardContent className="p-4 text-center">
                      <Calendar className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{tournaments.length}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Total Tournaments</p>
                    </CardContent>
                  </Card>
                  <Card className="morph-container">
                    <CardContent className="p-4 text-center">
                      <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{winners.length}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Total Winners</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Tournament Registrations Management */}
                <Card className="morph-container">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-5 w-5" />
                        <span>Tournament Registrations ({filteredRegistrations.length})</span>
                      </div>
                      <Button onClick={exportRegistrationsCSV} variant="outline" className="morph-button">
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label>Search Players</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search by name, email, UID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="morph-input pl-10"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Tournament Type</Label>
                        <Select value={registrationFilter} onValueChange={setRegistrationFilter}>
                          <SelectTrigger className="morph-input">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="solo">Solo</SelectItem>
                            <SelectItem value="duo">Duo</SelectItem>
                            <SelectItem value="squad">Squad</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Payment Status</Label>
                        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                          <SelectTrigger className="morph-input">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <Button 
                          onClick={() => {
                            setSearchTerm('');
                            setRegistrationFilter('all');
                            setPaymentFilter('all');
                          }}
                          variant="outline" 
                          className="morph-button w-full"
                        >
                          <Filter className="h-4 w-4 mr-2" />
                          Clear
                        </Button>
                      </div>
                    </div>

                    {/* Registrations Table */}
                    <div className="rounded-md border max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Player Info</TableHead>
                            <TableHead>Tournament</TableHead>
                            <TableHead>Slot Time</TableHead>
                            <TableHead>Payment Status</TableHead>
                            <TableHead>Registration Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredRegistrations.map((registration) => (
                            <TableRow key={registration.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{registration.player.username}</p>
                                  <p className="text-sm text-gray-600">{registration.player.email}</p>
                                  <p className="text-sm text-gray-500">
                                    IGN: {registration.player.in_game_name || 'N/A'}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    UID: {registration.player.free_fire_uid || 'N/A'}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  registration.tournament_type === 'solo' ? 'bg-blue-100 text-blue-800' :
                                  registration.tournament_type === 'duo' ? 'bg-green-100 text-green-800' :
                                  'bg-purple-100 text-purple-800'
                                }`}>
                                  {registration.tournament_type.toUpperCase()}
                                </span>
                              </TableCell>
                              <TableCell>{registration.slot_time}</TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  registration.payment_status === 'completed' ? 'bg-green-100 text-green-800' :
                                  registration.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {registration.payment_status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                                  {registration.payment_status === 'failed' && <XCircle className="w-3 h-3 mr-1" />}
                                  {registration.payment_status}
                                </span>
                              </TableCell>
                              <TableCell>
                                {new Date(registration.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  {registration.payment_status === 'pending' && (
                                    <>
                                      <Button
                                        size="sm"
                                        onClick={() => updatePaymentStatus(registration.id, 'completed')}
                                        className="bg-green-500 hover:bg-green-600"
                                      >
                                        <CheckCircle className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => updatePaymentStatus(registration.id, 'failed')}
                                      >
                                        <XCircle className="h-3 w-3" />
                                      </Button>
                                    </>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => deleteRegistration(registration.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {filteredRegistrations.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          No registrations found matching your criteria.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Tournament Management - Enhanced */}
                <Card className="morph-container">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5" />
                      <span>Tournament Management</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <Label className="text-sm font-medium">Tournament Name</Label>
                        <Input
                          value={newTournament.name}
                          onChange={(e) => setNewTournament(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter tournament name"
                          className="morph-input mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Tournament Type</Label>
                        <Select 
                          value={newTournament.type} 
                          onValueChange={(value) => setNewTournament(prev => ({ ...prev, type: value as TournamentType }))}
                        >
                          <SelectTrigger className="morph-input mt-1">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="solo">Solo</SelectItem>
                            <SelectItem value="duo">Duo</SelectItem>
                            <SelectItem value="squad">Squad</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Date</Label>
                        <Input
                          type="date"
                          value={newTournament.scheduled_date}
                          onChange={(e) => setNewTournament(prev => ({ ...prev, scheduled_date: e.target.value }))}
                          className="morph-input mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Time</Label>
                        <Input
                          type="time"
                          value={newTournament.scheduled_time}
                          onChange={(e) => setNewTournament(prev => ({ ...prev, scheduled_time: e.target.value }))}
                          className="morph-input mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Max Participants</Label>
                        <Input
                          type="number"
                          value={newTournament.max_participants}
                          onChange={(e) => setNewTournament(prev => ({ ...prev, max_participants: parseInt(e.target.value) }))}
                          className="morph-input mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Prize Pool (₹)</Label>
                        <Input
                          type="number"
                          value={newTournament.prize_pool}
                          onChange={(e) => setNewTournament(prev => ({ ...prev, prize_pool: parseInt(e.target.value) }))}
                          className="morph-input mt-1"
                        />
                      </div>
                    </div>
                    <Button onClick={createTournament} className="morph-button w-full">
                      <Calendar className="h-4 w-4 mr-2" />
                      Create Tournament
                    </Button>
                  </CardContent>
                </Card>

                {/* Tournament List Management */}
                <Card className="morph-container">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5" />
                      <span>Tournament List</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {tournaments.map((tournament) => (
                        <div key={tournament.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div>
                            <p className="font-medium">{tournament.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {tournament.type} • {new Date(tournament.scheduled_date).toLocaleDateString()} • ₹{tournament.prize_pool}
                            </p>
                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                              tournament.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                              tournament.status === 'active' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {tournament.status}
                            </span>
                          </div>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">Edit</Button>
                            <Button size="sm" variant="destructive">Delete</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Settings Management */}
                <Card className="morph-container">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="h-5 w-5" />
                      <span>Tournament Settings</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Solo Entry Fee</Label>
                        <Input
                          value={settings.entry_fee_solo}
                          onChange={(e) => updateSettings('entry_fee_solo', e.target.value)}
                          className="morph-input"
                        />
                      </div>
                      <div>
                        <Label>Duo Entry Fee</Label>
                        <Input
                          value={settings.entry_fee_duo}
                          onChange={(e) => updateSettings('entry_fee_duo', e.target.value)}
                          className="morph-input"
                        />
                      </div>
                      <div>
                        <Label>Squad Entry Fee</Label>
                        <Input
                          value={settings.entry_fee_squad}
                          onChange={(e) => updateSettings('entry_fee_squad', e.target.value)}
                          className="morph-input"
                        />
                      </div>
                      <div>
                        <Label>UPI ID</Label>
                        <Input
                          value={settings.upi_id}
                          onChange={(e) => updateSettings('upi_id', e.target.value)}
                          className="morph-input"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Player Management */}
                <Card className="morph-container">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Users className="h-5 w-5" />
                        <span>Player Management ({allPlayers.length} players)</span>
                      </div>
                      <Button onClick={exportPlayersCSV} variant="outline" className="morph-button">
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {allPlayers.map((player) => (
                        <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div>
                            <p className="font-medium">{player.username}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {player.in_game_name} • {player.free_fire_uid}
                            </p>
                            <p className="text-xs text-gray-500">{player.email}</p>
                          </div>
                          <Button
                            onClick={() => removePlayer(player.id)}
                            variant="destructive"
                            size="sm"
                            className="morph-button"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Winner Management */}
                <Card className="morph-container">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Trophy className="h-5 w-5" />
                      <span>Winner Management</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Winner Name</Label>
                        <Input
                          value={newWinnerName}
                          onChange={(e) => setNewWinnerName(e.target.value)}
                          placeholder="Enter winner's name"
                          className="morph-input"
                        />
                      </div>
                      <div>
                        <Label>Tournament Type</Label>
                        <Select value={newWinnerType} onValueChange={(value) => setNewWinnerType(value as TournamentType)}>
                          <SelectTrigger className="morph-input">
                            <SelectValue placeholder="Select tournament type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="solo">Solo</SelectItem>
                            <SelectItem value="duo">Duo</SelectItem>
                            <SelectItem value="squad">Squad</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button onClick={addWinner} className="morph-button">
                      <Trophy className="h-4 w-4 mr-2" />
                      Add Winner
                    </Button>
                  </CardContent>
                </Card>

                {/* System Notifications */}
                <Card className="morph-container">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Bell className="h-5 w-5" />
                      <span>System Notifications</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center space-x-2 text-blue-800 dark:text-blue-200">
                        <Bell className="h-4 w-4" />
                        <span className="font-medium">System Status: Operational</span>
                      </div>
                      <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                        All systems are running smoothly. Last check: {new Date().toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" className="morph-button flex-1">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Send Notification
                      </Button>
                      <Button variant="outline" className="morph-button flex-1">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Analytics
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Winners Section - Always visible when not in admin mode */}
            {!isAdminMode && (
              <Card className="morph-container">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <span>Latest Winners</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {winners.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {winners.slice(0, 6).map((winner) => (
                        <div key={winner.id} className="morph-winner-card p-4 text-center">
                          {winner.image_url ? (
                            <img
                              src={winner.image_url}
                              alt={winner.player_name}
                              className="w-16 h-16 object-cover rounded-full mx-auto mb-3 border-2 border-yellow-500"
                              onError={(e) => {
                                console.error('Failed to load winner image:', winner.image_url);
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                          )}
                          <h3 className="font-bold text-lg">{winner.player_name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                            {winner.tournament_type} Tournament Winner
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(winner.tournament_date).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No winners yet. Be the first champion!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <>
            {/* Welcome section for non-signed-in users */}
            <div className="text-center py-12 md:py-20 px-4">
              <Trophy className="h-12 w-12 md:h-16 md:w-16 text-orange-500 mx-auto mb-4 md:mb-6" />
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Welcome to FF Arena</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6 md:mb-8 max-w-md mx-auto text-sm md:text-base">
                Join the ultimate Free Fire tournament platform. Sign up to compete, win prizes, and become a champion!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 sm:space-x-4 sm:space-y-0 justify-center">
                <SignUpButton>
                  <Button size="lg" className="morph-button w-full sm:w-auto">
                    Get Started
                  </Button>
                </SignUpButton>
                <SignInButton>
                  <Button variant="outline" size="lg" className="morph-button w-full sm:w-auto">
                    Sign In
                  </Button>
                </SignInButton>
              </div>
            </div>

            {/* Winners Section for non-signed-in users */}
            <Card className="morph-container">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <span>Recent Champions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {winners.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {winners.slice(0, 6).map((winner) => (
                      <div key={winner.id} className="morph-winner-card p-4 text-center">
                        {winner.image_url ? (
                          <img
                            src={winner.image_url}
                            alt={winner.player_name}
                            className="w-16 h-16 object-cover rounded-full mx-auto mb-3 border-2 border-yellow-500"
                            onError={(e) => {
                              console.error('Failed to load winner image:', winner.image_url);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                        )}
                        <h3 className="font-bold text-lg">{winner.player_name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                          {winner.tournament_type} Tournament Winner
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(winner.tournament_date).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No winners yet. Sign up to become the first champion!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>

      {/* Payment Modal - Updated with real QR code */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="w-[95vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
            <DialogDescription>
              Scan the QR code or use the UPI ID to complete your tournament payment.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="font-semibold text-lg">Amount: ₹{selectedTournament?.entry_fee}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">UPI ID: {settings.upi_id}</p>
              {selectedTournament && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                  Tournament: {selectedTournament.name}
                </p>
              )}
            </div>
            
            <div className="flex justify-center">
              <div>
                <img 
                  src="/lovable-uploads/2b618b58-53ee-44f4-beff-668c306292b0.png" 
                  alt="Payment QR Code" 
                  className="w-40 h-40 md:w-48 md:h-48 border rounded-lg shadow-lg"
                />
              </div>
            </div>
            
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
              Scan the QR code or use the UPI ID to complete payment
            </p>
            
            <Button 
              onClick={handlePaymentComplete} 
              className="morph-button w-full"
            >
              I've Paid
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TournamentWebsite;
