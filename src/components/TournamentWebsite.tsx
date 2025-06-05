import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import TournamentCard from './TournamentCard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"

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

interface Settings {
  [key: string]: string;
}

const TournamentWebsite = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [featuredTemplates, setFeaturedTemplates] = useState<FeaturedTournamentTemplate[]>([]);
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeAdminTab, setActiveAdminTab] = useState<string>('general');
  const [newTournament, setNewTournament] = useState({
    name: '',
    type: 'solo' as 'solo' | 'duo' | 'squad',
    scheduled_date: '',
    scheduled_time: '',
    prize_pool: 0,
    entry_fee: 0,
    max_participants: 0,
    status: 'upcoming',
  });
  const [isCreateTournamentOpen, setIsCreateTournamentOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isApiKeyValid, setIsApiKeyValid] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    const storedApiKey = localStorage.getItem('adminApiKey');
    if (storedApiKey) {
      setApiKey(storedApiKey);
      setIsApiKeyValid(true);
      setIsAdmin(true);
    }
  }, []);

  const handleApiKeySubmit = () => {
    if (apiKey === process.env.NEXT_PUBLIC_ADMIN_API_KEY) {
      setIsApiKeyValid(true);
      setIsAdmin(true);
      localStorage.setItem('adminApiKey', apiKey);
      toast({
        title: "Success",
        description: "Admin access granted"
      });
    } else {
      setIsApiKeyValid(false);
      setIsAdmin(false);
      toast({
        title: "Error",
        description: "Invalid API key",
        variant: "destructive"
      });
    }
  };

  // Add new function to update tournament status
  const updateTournamentStatus = async (tournamentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tournaments')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', tournamentId);

      if (error) throw error;

      await loadTournaments();
      toast({
        title: "Success",
        description: `Tournament marked as ${newStatus}`
      });
    } catch (error) {
      console.error('Error updating tournament status:', error);
      toast({
        title: "Error",
        description: "Failed to update tournament status",
        variant: "destructive"
      });
    }
  };

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('scheduled_date', { ascending: true });

      if (error) {
        console.error('Error fetching tournaments:', error);
        toast({
          title: "Error",
          description: "Failed to load tournaments",
          variant: "destructive"
        });
      } else {
        setTournaments(data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*');

      if (error) {
        console.error('Error fetching settings:', error);
        toast({
          title: "Error",
          description: "Failed to load settings",
          variant: "destructive"
        });
      } else {
        const settingsData: Settings = {};
        data?.forEach(item => {
          settingsData[item.setting_key] = item.setting_value;
        });
        setSettings(settingsData);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive"
      });
    }
  };

  const loadFeaturedTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .like('setting_key', 'featured_tournament_%');

      if (error) {
        console.error('Error fetching featured templates:', error);
        toast({
          title: "Error",
          description: "Failed to load featured templates",
          variant: "destructive"
        });
      } else {
        const templates: FeaturedTournamentTemplate[] = [];
        for (let i = 1; i <= 6; i++) {
          const templateKey = `featured_tournament_featured-${i}`;
          const templateData = data?.find(item => item.setting_key === templateKey);
          if (templateData) {
            try {
              const parsedTemplate = JSON.parse(templateData.setting_value);
              templates.push(parsedTemplate);
            } catch (parseError) {
              console.error(`Error parsing template ${templateKey}:`, parseError);
            }
          }
        }
        setFeaturedTemplates(templates);
      }
    } catch (error) {
      console.error('Error loading featured templates:', error);
      toast({
        title: "Error",
        description: "Failed to load featured templates",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadTournaments();
    loadSettings();
    loadFeaturedTemplates();
  }, []);

  const handleFeaturedTournamentRegistration = (type: string) => {
    const entryFee = settings[`entry_fee_${type}`];
    if (entryFee) {
      toast({
        title: "Registration",
        description: `Registering for ${type} tournament with entry fee ₹${entryFee}`
      });
    } else {
      toast({
        title: "Error",
        description: `Entry fee for ${type} tournament not found`,
        variant: "destructive"
      });
    }
  };

  const handleTournamentRegistration = (tournament: Tournament) => {
    toast({
      title: "Registration",
      description: `Registering for ${tournament.name} tournament`
    });
  };

  const handleSettingChange = async (key: string, value: string) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [key]: value
    }));

    try {
      const { error } = await supabase
        .from('settings')
        .upsert({ setting_key: key, setting_value: value }, { onConflict: 'setting_key' });

      if (error) {
        console.error('Error updating setting:', error);
        toast({
          title: "Error",
          description: `Failed to update ${key}`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: `${key} updated successfully`
        });
      }
    } catch (error) {
      console.error('Error updating setting:', error);
      toast({
        title: "Error",
        description: `Failed to update ${key}`,
        variant: "destructive"
      });
    }
  };

  const handleFeaturedTemplateChange = async (id: string, field: string, value: any) => {
    const updatedTemplates = featuredTemplates.map(template =>
      template.id === id ? { ...template, [field]: value } : template
    );
    setFeaturedTemplates(updatedTemplates);

    const template = updatedTemplates.find(t => t.id === id);
    if (template) {
      try {
        const { error } = await supabase
          .from('settings')
          .upsert(
            {
              setting_key: `featured_tournament_${id}`,
              setting_value: JSON.stringify(template)
            },
            { onConflict: 'setting_key' }
          );

        if (error) {
          console.error('Error updating featured template:', error);
          toast({
            title: "Error",
            description: `Failed to update ${template.title}`,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Success",
            description: `${template.title} updated successfully`
          });
        }
      } catch (error) {
        console.error('Error updating featured template:', error);
        toast({
          title: "Error",
          description: `Failed to update ${template.title}`,
          variant: "destructive"
        });
      }
    }
  };

  const handleCreateTournament = async () => {
    setIsSaving(true);
    setProgress(30);

    try {
      const { data, error } = await supabase
        .from('tournaments')
        .insert([{
          name: newTournament.name,
          type: newTournament.type,
          scheduled_date: newTournament.scheduled_date,
          scheduled_time: newTournament.scheduled_time,
          prize_pool: newTournament.prize_pool,
          entry_fee: newTournament.entry_fee,
          max_participants: newTournament.max_participants,
          status: newTournament.status,
        }])
        .select();

      if (error) {
        console.error('Error creating tournament:', error);
        toast({
          title: "Error",
          description: "Failed to create tournament",
          variant: "destructive"
        });
        setProgress(100);
      } else {
        toast({
          title: "Success",
          description: "Tournament created successfully"
        });
        if (data && data.length > 0) {
          setTournaments([...tournaments, { ...newTournament, id: data[0].id }]);
        }
        setNewTournament({
          name: '',
          type: 'solo',
          scheduled_date: '',
          scheduled_time: '',
          prize_pool: 0,
          entry_fee: 0,
          max_participants: 0,
          status: 'upcoming',
        });
        setProgress(70);
        setIsCreateTournamentOpen(false);
      }
    } catch (error) {
      console.error('Error creating tournament:', error);
      toast({
        title: "Error",
        description: "Failed to create tournament",
        variant: "destructive"
      });
      setProgress(100);
    } finally {
      setIsSaving(false);
      setProgress(100);
      loadTournaments();
    }
  };

  // Update the featuredTournaments mapping to include schedule data
  const featuredTournaments = featuredTemplates.map((template) => ({
    title: template.title,
    type: template.type,
    time: template.time,
    entryFee: settings[`entry_fee_${template.type}`],
    prizePool: template.prizePool,
    image: template.image,
    maxPlayers: template.maxPlayers,
    scheduledDate: new Date().toISOString().split('T')[0], // Today's date for featured tournaments
    scheduledTime: template.time,
    status: 'upcoming'
  }));

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-400 to-purple-600 text-white py-40">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-extrabold mb-4">
            Welcome to the Ultimate Tournament Platform
          </h1>
          <p className="text-xl mb-8">
            Compete, win, and become a legend. Join our exciting tournaments and
            showcase your skills!
          </p>
          <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-100">
            Explore Tournaments
          </Button>
        </div>
      </section>

      {/* Tournaments Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-800 dark:text-white">
            Featured Tournaments
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredTournaments.map((tournament, index) => (
              <TournamentCard
                key={index}
                title={tournament.title}
                type={tournament.type}
                time={tournament.time}
                entryFee={tournament.entryFee}
                prizePool={tournament.prizePool}
                image={tournament.image}
                maxPlayers={tournament.maxPlayers}
                scheduledDate={tournament.scheduledDate}
                scheduledTime={tournament.scheduledTime}
                status={tournament.status}
                onRegister={() => handleFeaturedTournamentRegistration(tournament.type)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Live Tournaments Section */}
      {tournaments.length > 0 && (
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-800 dark:text-white">
              Live Tournaments
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {tournaments.map((tournament) => (
                <TournamentCard
                  key={tournament.id}
                  title={tournament.name}
                  type={tournament.type as 'solo' | 'duo' | 'squad'}
                  time={tournament.scheduled_time}
                  entryFee={tournament.entry_fee?.toString() || '0'}
                  prizePool={tournament.prize_pool?.toString() || '0'}
                  image="photo-1581092795360-fd1ca04f0952"
                  maxPlayers={tournament.max_participants}
                  scheduledDate={tournament.scheduled_date}
                  scheduledTime={tournament.scheduled_time}
                  status={tournament.status}
                  onRegister={() => handleTournamentRegistration(tournament)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer Section */}
      <footer className="bg-gray-200 dark:bg-gray-800 py-12">
        <div className="container mx-auto text-center">
          <p className="text-gray-600 dark:text-gray-400">
            © 2023 Tournament Platform. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Admin Panel */}
      <Drawer open={isAdmin} onOpenChange={setIsAdmin}>
        <DrawerTrigger asChild>
          <Button variant="outline">Admin Panel</Button>
        </DrawerTrigger>
        <DrawerContent className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
          <DrawerHeader>
            <DrawerTitle>Admin Panel</DrawerTitle>
            <DrawerDescription>
              Manage tournaments and settings.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4">
            {!isApiKeyValid ? (
              <div className="space-y-4">
                <Label htmlFor="api-key">Enter Admin API Key</Label>
                <Input
                  type="password"
                  id="api-key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <Button onClick={handleApiKeySubmit}>Submit</Button>
              </div>
            ) : (
              <Tabs defaultValue="general" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="general" onClick={() => setActiveAdminTab('general')}>General Settings</TabsTrigger>
                  <TabsTrigger value="featured" onClick={() => setActiveAdminTab('featured')}>Featured Tournaments</TabsTrigger>
                  <TabsTrigger value="tournaments" onClick={() => setActiveAdminTab('tournaments')}>Tournaments</TabsTrigger>
                </TabsList>
                <TabsContent value="general" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>General Settings</CardTitle>
                      <CardDescription>Manage general settings for the website.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="entry_fee_solo">Solo Entry Fee</Label>
                        <Input
                          type="number"
                          id="entry_fee_solo"
                          value={settings['entry_fee_solo'] || ''}
                          onChange={(e) => handleSettingChange('entry_fee_solo', e.target.value)}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="entry_fee_duo">Duo Entry Fee</Label>
                        <Input
                          type="number"
                          id="entry_fee_duo"
                          value={settings['entry_fee_duo'] || ''}
                          onChange={(e) => handleSettingChange('entry_fee_duo', e.target.value)}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="entry_fee_squad">Squad Entry Fee</Label>
                        <Input
                          type="number"
                          id="entry_fee_squad"
                          value={settings['entry_fee_squad'] || ''}
                          onChange={(e) => handleSettingChange('entry_fee_squad', e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="featured">
                  <Card>
                    <CardHeader>
                      <CardTitle>Featured Tournaments</CardTitle>
                      <CardDescription>Manage featured tournaments settings.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                      {featuredTemplates.map((template) => (
                        <div key={template.id} className="space-y-2 border rounded-md p-4">
                          <h3 className="text-lg font-semibold">{template.title}</h3>
                          <div className="flex items-center space-x-2">
                            <Label htmlFor={`title-${template.id}`}>Title</Label>
                            <Input
                              type="text"
                              id={`title-${template.id}`}
                              value={template.title}
                              onChange={(e) => handleFeaturedTemplateChange(template.id, 'title', e.target.value)}
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Label htmlFor={`prizePool-${template.id}`}>Prize Pool</Label>
                            <Input
                              type="number"
                              id={`prizePool-${template.id}`}
                              value={template.prizePool}
                              onChange={(e) => handleFeaturedTemplateChange(template.id, 'prizePool', e.target.value)}
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Label htmlFor={`maxPlayers-${template.id}`}>Max Players</Label>
                            <Input
                              type="number"
                              id={`maxPlayers-${template.id}`}
                              value={template.maxPlayers}
                              onChange={(e) => handleFeaturedTemplateChange(template.id, 'maxPlayers', parseInt(e.target.value))}
                            />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tournament Management Tab */}
                {activeAdminTab === 'tournaments' && (
                  <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                      <h3 className="text-xl font-semibold mb-4">Tournament Status Management</h3>
                      <div className="space-y-4">
                        {tournaments.map((tournament) => (
                          <div key={tournament.id} className="border rounded-lg p-4 space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-semibold">{tournament.name}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {tournament.scheduled_date} at {tournament.scheduled_time}
                                </p>
                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                  tournament.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                                  tournament.status === 'started' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {tournament.status.toUpperCase()}
                                </span>
                              </div>
                              <div className="flex space-x-2">
                                {tournament.status === 'upcoming' && (
                                  <Button
                                    size="sm"
                                    onClick={() => updateTournamentStatus(tournament.id, 'started')}
                                    className="bg-green-500 hover:bg-green-600"
                                  >
                                    Mark Started
                                  </Button>
                                )}
                                {tournament.status === 'started' && (
                                  <Button
                                    size="sm"
                                    onClick={() => updateTournamentStatus(tournament.id, 'ended')}
                                    className="bg-red-500 hover:bg-red-600"
                                  >
                                    Mark Ended
                                  </Button>
                                )}
                                {tournament.status === 'ended' && (
                                  <Button
                                    size="sm"
                                    onClick={() => updateTournamentStatus(tournament.id, 'upcoming')}
                                    variant="outline"
                                  >
                                    Reset to Upcoming
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button onClick={() => setIsCreateTournamentOpen(true)}>Create New Tournament</Button>

                    <Drawer open={isCreateTournamentOpen} onOpenChange={setIsCreateTournamentOpen}>
                      <DrawerContent className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                        <DrawerHeader>
                          <DrawerTitle>Create New Tournament</DrawerTitle>
                          <DrawerDescription>
                            Fill out the form below to create a new tournament.
                          </DrawerDescription>
                        </DrawerHeader>
                        <div className="p-4">
                          <div className="grid gap-4">
                            <div className="flex items-center space-x-2">
                              <Label htmlFor="name">Name</Label>
                              <Input
                                type="text"
                                id="name"
                                value={newTournament.name}
                                onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })}
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <Label htmlFor="type">Type</Label>
                              <Select onValueChange={(value: 'solo' | 'duo' | 'squad') => setNewTournament({ ...newTournament, type: value })}>
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue placeholder="Select type" defaultValue={newTournament.type} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="solo">Solo</SelectItem>
                                  <SelectItem value="duo">Duo</SelectItem>
                                  <SelectItem value="squad">Squad</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Label htmlFor="scheduled_date">Scheduled Date</Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-[240px] justify-start text-left font-normal",
                                      !date && "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="center" side="bottom">
                                  <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    disabled={(date) =>
                                      date < new Date()
                                    }
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Label htmlFor="scheduled_time">Scheduled Time</Label>
                              <Input
                                type="time"
                                id="scheduled_time"
                                value={newTournament.scheduled_time}
                                onChange={(e) => setNewTournament({ ...newTournament, scheduled_time: e.target.value })}
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <Label htmlFor="prize_pool">Prize Pool</Label>
                              <Input
                                type="number"
                                id="prize_pool"
                                value={newTournament.prize_pool}
                                onChange={(e) => setNewTournament({ ...newTournament, prize_pool: parseInt(e.target.value) })}
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <Label htmlFor="entry_fee">Entry Fee</Label>
                              <Input
                                type="number"
                                id="entry_fee"
                                value={newTournament.entry_fee}
                                onChange={(e) => setNewTournament({ ...newTournament, entry_fee: parseInt(e.target.value) })}
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <Label htmlFor="max_participants">Max Participants</Label>
                              <Input
                                type="number"
                                id="max_participants"
                                value={newTournament.max_participants}
                                onChange={(e) => setNewTournament({ ...newTournament, max_participants: parseInt(e.target.value) })}
                              />
                            </div>
                          </div>
                        </div>
                        <DrawerFooter>
                          <Button onClick={handleCreateTournament} disabled={isSaving}>
                            {isSaving ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              "Create Tournament"
                            )}
                          </Button>
                        </DrawerFooter>
                      </DrawerContent>
                    </Drawer>
                  </div>
                )}
              </Tabs>
            )}
          </div>
          <DrawerFooter>
            <Button onClick={() => {
              setIsAdmin(false);
              setIsApiKeyValid(false);
              localStorage.removeItem('adminApiKey');
            }}>Logout</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default TournamentWebsite;
