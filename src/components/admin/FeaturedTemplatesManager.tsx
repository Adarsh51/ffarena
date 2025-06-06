
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit2 } from 'lucide-react';
import { FeaturedTemplateCard } from './FeaturedTemplateCard';

interface FeaturedTournamentTemplate {
  id: string;
  title: string;
  type: 'solo' | 'duo' | 'squad';
  time: string;
  prizePool: string;
  image: string;
  maxPlayers: number;
}

interface FeaturedTemplatesManagerProps {
  featuredTemplates: FeaturedTournamentTemplate[];
  editingTemplate: string | null;
  editingValues: Partial<FeaturedTournamentTemplate>;
  onStartEditing: (template: FeaturedTournamentTemplate) => void;
  onCancelEditing: () => void;
  onSaveEditing: () => void;
  onUpdateEditingValues: (values: Partial<FeaturedTournamentTemplate>) => void;
}

export const FeaturedTemplatesManager: React.FC<FeaturedTemplatesManagerProps> = ({
  featuredTemplates,
  editingTemplate,
  editingValues,
  onStartEditing,
  onCancelEditing,
  onSaveEditing,
  onUpdateEditingValues
}) => {
  return (
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
            <FeaturedTemplateCard
              key={template.id}
              template={template}
              isEditing={editingTemplate === template.id}
              editingValues={editingValues}
              onStartEditing={onStartEditing}
              onCancelEditing={onCancelEditing}
              onSaveEditing={onSaveEditing}
              onUpdateEditingValues={onUpdateEditingValues}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
