
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit2, Save, X } from 'lucide-react';

interface FeaturedTournamentTemplate {
  id: string;
  title: string;
  type: 'solo' | 'duo' | 'squad';
  time: string;
  prizePool: string;
  image: string;
  maxPlayers: number;
}

interface FeaturedTemplateCardProps {
  template: FeaturedTournamentTemplate;
  isEditing: boolean;
  editingValues: Partial<FeaturedTournamentTemplate>;
  onStartEditing: (template: FeaturedTournamentTemplate) => void;
  onCancelEditing: () => void;
  onSaveEditing: () => void;
  onUpdateEditingValues: (values: Partial<FeaturedTournamentTemplate>) => void;
}

export const FeaturedTemplateCard: React.FC<FeaturedTemplateCardProps> = ({
  template,
  isEditing,
  editingValues,
  onStartEditing,
  onCancelEditing,
  onSaveEditing,
  onUpdateEditingValues
}) => {
  if (isEditing) {
    return (
      <div className="border rounded-lg p-4 space-y-3">
        <div>
          <Label>Tournament Title</Label>
          <Input
            value={editingValues.title || template.title}
            onChange={(e) => onUpdateEditingValues({ ...editingValues, title: e.target.value })}
            className="mt-1"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Type</Label>
            <Select 
              value={editingValues.type || template.type} 
              onValueChange={(value) => onUpdateEditingValues({ ...editingValues, type: value as 'solo' | 'duo' | 'squad' })}
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
              onChange={(e) => onUpdateEditingValues({ ...editingValues, time: e.target.value })}
              className="mt-1"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Prize Pool (₹)</Label>
            <Input
              value={editingValues.prizePool || template.prizePool}
              onChange={(e) => onUpdateEditingValues({ ...editingValues, prizePool: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Max Players</Label>
            <Input
              type="number"
              value={editingValues.maxPlayers || template.maxPlayers}
              onChange={(e) => onUpdateEditingValues({ ...editingValues, maxPlayers: parseInt(e.target.value) })}
              className="mt-1"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={onSaveEditing} size="sm" className="flex-1">
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
          <Button onClick={onCancelEditing} variant="outline" size="sm" className="flex-1">
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg">{template.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 capitalize">
            {template.type} • {template.time} • ₹{template.prizePool} • {template.maxPlayers} players
          </p>
        </div>
        <Button onClick={() => onStartEditing(template)} variant="outline" size="sm">
          <Edit2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
