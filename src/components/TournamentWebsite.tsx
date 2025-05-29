
import React, { useState, useEffect } from 'react';
import { useUser, useAuth, SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';
import { Moon, Sun, Trophy, Users, Clock, DollarSign, Settings, Download } from 'lucide-react';

interface Player {
  id: string;
  clerk_user_id: string;
  username: string;
  email: string;
  in_game_name: string | null;
  free_fire_uid: string | null;
  created_at: string;
}

interface Winner {
  id: string;
  player_name: string;
  tournament_type: string;
  tournament_date: string;
}

interface GameSettings {
  entry_fee_solo: string;
  entry_fee_duo: string;
  entry_fee_squad: string;
  upi_id: string;
}

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
  const [tournamentType, setTournamentType] = useState('');
  const [slotTime, setSlotTime] = useState('');
  
  // Modal states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  
  // Admin states
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [settings, setSettings] = useState<GameSettings>({
    entry_fee_solo: '50',
    entry_fee_duo: '100',
    entry_fee_squad: '150',
    upi_id: 'ffarena@paytm'
  });
  const [newWinnerName, setNewWinnerName] = useState('');
  const [newWinnerType, setNewWinnerType] = useState('');

  // Load theme and data on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    if (isSignedIn && user) {
      loadPlayerProfile();
      loadWinners();
      loadSettings();
    }
  }, [isSignedIn, user, isDarkMode]);

  // Save theme to localStorage
  useEffect(() => {
    localStorage.setItem('ff-arena-theme', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // Load player profile from Supabase
  const loadPlayerProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('clerk_user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPlayerProfile(data);
        setIsProfileComplete(!!(data.in_game_name && data.free_fire_uid));
        setInGameName(data.in_game_name || '');
        setFreeFireUID(data.free_fire_uid || '');
      } else {
        // Create new player record
        const newPlayer = {
          clerk_user_id: user.id,
          username: user.username || user.firstName || 'Player',
          email: user.primaryEmailAddress?.emailAddress || '',
          in_game_name: null,
          free_fire_uid: null
        };

        const { data: created, error: createError } = await supabase
          .from('players')
          .insert([newPlayer])
          .select()
          .single();

        if (createError) throw createError;
        setPlayerProfile(created);
      }
    } catch (error) {
      console.error('Error loading player profile:', error);
      toast({
        title: "Error",
        description: "Failed to load player profile",
        variant: "destructive"
      });
    }
  };

  // Load winners from Supabase
  const loadWinners = async () => {
    try {
      const { data, error } = await supabase
        .from('winners')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setWinners(data || []);
    } catch (error) {
      console.error('Error loading winners:', error);
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
      setSettings(settingsObj);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  // Save player profile
  const savePlayerProfile = async () => {
    if (!playerProfile || !inGameName || !freeFireUID) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('players')
        .update({
          in_game_name: inGameName,
          free_fire_uid: freeFireUID,
          updated_at: new Date().toISOString()
        })
        .eq('id', playerProfile.id);

      if (error) throw error;

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
        description: "Failed to save profile",
        variant: "destructive"
      });
    }
  };

  // Handle tournament registration
  const handleTournamentRegistration = async () => {
    if (!playerProfile || !tournamentType || !slotTime) {
      toast({
        title: "Error",
        description: "Please fill in all tournament details",
        variant: "destructive"
      });
      return;
    }

    // Generate QR code for payment
    const upiUrl = `upi://pay?pa=${settings.upi_id}&pn=FF Arena&am=${settings[`entry_fee_${tournamentType}` as keyof GameSettings]}&cu=INR&tn=Tournament Entry Fee`;
    
    try {
      const qrDataUrl = await QRCode.toDataURL(upiUrl);
      setQrCodeDataUrl(qrDataUrl);
      setIsPaymentModalOpen(true);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "Error",
        description: "Failed to generate payment QR code",
        variant: "destructive"
      });
    }
  };

  // Handle payment completion
  const handlePaymentComplete = async () => {
    if (!playerProfile) return;

    try {
      const { error } = await supabase
        .from('tournament_registrations')
        .insert([{
          player_id: playerProfile.id,
          tournament_type: tournamentType,
          slot_time: slotTime,
          payment_status: 'completed'
        }]);

      if (error) throw error;

      setIsPaymentModalOpen(false);
      setTournamentType('');
      setSlotTime('');
      
      toast({
        title: "Success",
        description: "Tournament registration completed!"
      });
    } catch (error) {
      console.error('Error completing registration:', error);
      toast({
        title: "Error",
        description: "Failed to complete registration",
        variant: "destructive"
      });
    }
  };

  // Admin functions
  const handleAdminLogin = () => {
    if (adminPassword === 'Admin123!') {
      setIsAdminMode(true);
      loadAllPlayers();
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
        .update({ setting_value: value, updated_at: new Date().toISOString() })
        .eq('setting_key', key);

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
      const { error } = await supabase
        .from('winners')
        .insert([{
          player_name: newWinnerName,
          tournament_type: newWinnerType,
          tournament_date: new Date().toISOString()
        }]);

      if (error) throw error;

      setNewWinnerName('');
      setNewWinnerType('');
      await loadWinners();
      
      toast({
        title: "Success",
        description: "Winner added successfully!"
      });
    } catch (error) {
      console.error('Error adding winner:', error);
      toast({
        title: "Error",
        description: "Failed to add winner",
        variant: "destructive"
      });
    }
  };

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

  return (
    <div className={`min-h-screen transition-all duration-500 ${isDarkMode ? 'dark bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-purple-50'}`}>
      {/* Header */}
      <header className="morph-container sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-gray-800/80 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Trophy className="h-8 w-8 text-orange-500" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              FF Arena
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="morph-button"
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {/* Admin Button */}
            {!isAdminMode && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="morph-button">
                    <Settings className="h-4 w-4 mr-2" />
                    Admin
                  </Button>
                </DialogTrigger>
                <DialogContent className="morph-container">
                  <DialogHeader>
                    <DialogTitle>Admin Login</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      type="password"
                      placeholder="Enter admin password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="morph-input"
                    />
                    <Button onClick={handleAdminLogin} className="morph-button w-full">
                      Login
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {/* Authentication */}
            {isSignedIn ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium">
                  Welcome back, {user?.username || user?.firstName}!
                </span>
                <UserButton />
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <SignInButton>
                  <Button variant="outline" className="morph-button">Sign In</Button>
                </SignInButton>
                <SignUpButton>
                  <Button className="morph-button">Sign Up</Button>
                </SignUpButton>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {isSignedIn ? (
          <>
            {/* Player Profile Section */}
            {!isProfileComplete && (
              <Card className="morph-container">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Complete Your Profile</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="inGameName">In-Game Name</Label>
                    <Input
                      id="inGameName"
                      value={inGameName}
                      onChange={(e) => setInGameName(e.target.value)}
                      placeholder="Enter your Free Fire in-game name"
                      className="morph-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="freeFireUID">Free Fire UID</Label>
                    <Input
                      id="freeFireUID"
                      value={freeFireUID}
                      onChange={(e) => setFreeFireUID(e.target.value)}
                      placeholder="Enter your Free Fire UID"
                      className="morph-input"
                    />
                  </div>
                  <Button onClick={savePlayerProfile} className="morph-button">
                    Save Profile
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Tournament Registration */}
            {isProfileComplete && !isAdminMode && (
              <Card className="morph-container">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Trophy className="h-5 w-5" />
                    <span>Join Tournament</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="playerName">Player Name</Label>
                      <Input
                        id="playerName"
                        value={inGameName}
                        readOnly
                        className="morph-input bg-gray-100 dark:bg-gray-700"
                      />
                    </div>
                    <div>
                      <Label htmlFor="uid">Free Fire UID</Label>
                      <Input
                        id="uid"
                        value={freeFireUID}
                        readOnly
                        className="morph-input bg-gray-100 dark:bg-gray-700"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tournamentType">Tournament Type</Label>
                      <Select value={tournamentType} onValueChange={setTournamentType}>
                        <SelectTrigger className="morph-input">
                          <SelectValue placeholder="Select tournament type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solo">Solo (₹{settings.entry_fee_solo})</SelectItem>
                          <SelectItem value="duo">Duo (₹{settings.entry_fee_duo})</SelectItem>
                          <SelectItem value="squad">Squad (₹{settings.entry_fee_squad})</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="slotTime">Slot Time</Label>
                      <Select value={slotTime} onValueChange={setSlotTime}>
                        <SelectTrigger className="morph-input">
                          <SelectValue placeholder="Select slot time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10:00 AM">10:00 AM</SelectItem>
                          <SelectItem value="2:00 PM">2:00 PM</SelectItem>
                          <SelectItem value="6:00 PM">6:00 PM</SelectItem>
                          <SelectItem value="9:00 PM">9:00 PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button 
                    onClick={handleTournamentRegistration}
                    className="morph-button w-full"
                    disabled={!tournamentType || !slotTime}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Pay Entry Fee
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Admin Panel */}
            {isAdminMode && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Admin Panel</h2>
                  <Button 
                    onClick={() => setIsAdminMode(false)}
                    variant="outline"
                    className="morph-button"
                  >
                    Exit Admin
                  </Button>
                </div>

                {/* Settings Management */}
                <Card className="morph-container">
                  <CardHeader>
                    <CardTitle>Tournament Settings</CardTitle>
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
                      <span>Player Management ({allPlayers.length} players)</span>
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
                    <CardTitle>Add Winner</CardTitle>
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
                        <Select value={newWinnerType} onValueChange={setNewWinnerType}>
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
                      Add Winner
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Winners Section */}
            {!isAdminMode && winners.length > 0 && (
              <Card className="morph-container">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <span>Latest Winners</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {winners.slice(0, 6).map((winner) => (
                      <div key={winner.id} className="morph-winner-card p-4 text-center">
                        <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                        <h3 className="font-bold text-lg">{winner.player_name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                          {winner.tournament_type} Tournament
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(winner.tournament_date).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <Trophy className="h-16 w-16 text-orange-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Welcome to FF Arena</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
              Join the ultimate Free Fire tournament platform. Sign up to compete, win prizes, and become a champion!
            </p>
            <div className="space-x-4">
              <SignUpButton>
                <Button size="lg" className="morph-button">
                  Get Started
                </Button>
              </SignUpButton>
              <SignInButton>
                <Button variant="outline" size="lg" className="morph-button">
                  Sign In
                </Button>
              </SignInButton>
            </div>
          </div>
        )}
      </main>

      {/* Payment Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="morph-container max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="font-semibold">Amount: ₹{tournamentType && settings[`entry_fee_${tournamentType}` as keyof GameSettings]}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">UPI ID: {settings.upi_id}</p>
            </div>
            
            {qrCodeDataUrl && (
              <div className="flex justify-center">
                <img src={qrCodeDataUrl} alt="Payment QR Code" className="w-48 h-48" />
              </div>
            )}
            
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Scan the QR code or use the UPI ID to complete payment
            </p>
            
            <Button onClick={handlePaymentComplete} className="morph-button w-full">
              I've Paid
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TournamentWebsite;
