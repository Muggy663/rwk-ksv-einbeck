"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { PenTool, Save, Eye, Pin, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { newsService, NewsArticle } from '@/lib/services/news-service';
import { containsProfanity, findProfanity } from '@/lib/utils/profanity-filter';

interface NewsFormProps {
  article?: NewsArticle;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function NewsForm({ article, onSuccess, onCancel }: NewsFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form data
  const [title, setTitle] = useState(article?.title || '');
  const [content, setContent] = useState(article?.content || '');
  const [excerpt, setExcerpt] = useState(article?.excerpt || '');
  const [category, setCategory] = useState<NewsArticle['category']>(article?.category || 'allgemein');
  const [priority, setPriority] = useState<NewsArticle['priority']>(article?.priority || 'normal');
  const [status, setStatus] = useState<NewsArticle['status']>(article?.status || 'entwurf');
  const [targetAudience, setTargetAudience] = useState<NewsArticle['targetAudience']>(article?.targetAudience || 'alle');
  const [pinned, setPinned] = useState(article?.pinned || false);
  const [tags, setTags] = useState<string[]>(article?.tags || []);
  const [newTag, setNewTag] = useState('');

  const isAdmin = user?.email === 'admin@rwk-einbeck.de';
  const isEditing = !!article?.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !isAdmin) {
      toast({
        title: 'Fehler',
        description: 'Sie haben keine Berechtigung, News-Artikel zu erstellen.',
        variant: 'destructive'
      });
      return;
    }

    if (!title || !content) {
      toast({
        title: 'Fehler',
        description: 'Bitte füllen Sie alle Pflichtfelder aus.',
        variant: 'destructive'
      });
      return;
    }

    // Content-Filter
    if (containsProfanity(title) || containsProfanity(content) || containsProfanity(excerpt)) {
      const titleWords = containsProfanity(title) ? findProfanity(title) : [];
      const contentWords = containsProfanity(content) ? findProfanity(content) : [];
      const excerptWords = containsProfanity(excerpt) ? findProfanity(excerpt) : [];
      
      const allForbiddenWords = [...titleWords, ...contentWords, ...excerptWords];
      
      alert(`Unerlaubter Inhalt gefunden: ${allForbiddenWords.join(', ')}`);
      toast({
        title: 'Unerlaubter Inhalt',
        description: `Der Artikel enthält unerlaubte Wörter: ${allForbiddenWords.join(', ')}`,
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const articleData: Omit<NewsArticle, 'id' | 'createdAt' | 'views' | 'slug'> = {
        title,
        content,
        excerpt: excerpt || content.substring(0, 200) + '...',
        category,
        priority,
        status,
        targetAudience,
        pinned,
        tags,
        attachments: [],
        authorEmail: user.email || '',
        authorName: user.displayName || user.email || 'Admin'
      };

      if (isEditing && article?.id) {
        await newsService.updateArticle(article.id, articleData);
        toast({
          title: 'Artikel aktualisiert',
          description: 'Der News-Artikel wurde erfolgreich aktualisiert.',
        });
      } else {
        await newsService.createArticle(articleData);
        
        // Push-Notification Hinweis (ohne Cloud Functions)
        if (status === 'veroeffentlicht') {

        }
        
        toast({
          title: 'Artikel erstellt',
          description: status === 'veroeffentlicht' 
            ? 'Der News-Artikel wurde erfolgreich veröffentlicht.'
            : 'Der News-Artikel wurde als Entwurf gespeichert.',
        });
      }

      onSuccess?.();
    } catch (error) {
      console.error('Fehler beim Speichern des News-Artikels:', error);
      toast({
        title: 'Fehler',
        description: 'Der News-Artikel konnte nicht gespeichert werden.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'allgemein': return 'Allgemein';
      case 'ergebnisse': return 'Ergebnisse';
      case 'termine': return 'Termine';
      case 'regelaenderung': return 'Regeländerung';
      case 'wichtig': return 'Wichtig';
      default: return cat;
    }
  };

  const getPriorityLabel = (prio: string) => {
    switch (prio) {
      case 'normal': return 'Normal';
      case 'hoch': return 'Hoch';
      case 'dringend': return 'Dringend';
      default: return prio;
    }
  };

  const getStatusLabel = (stat: string) => {
    switch (stat) {
      case 'entwurf': return 'Entwurf';
      case 'veroeffentlicht': return 'Veröffentlicht';
      case 'archiviert': return 'Archiviert';
      default: return stat;
    }
  };

  const getAudienceLabel = (aud: string) => {
    switch (aud) {
      case 'alle': return 'Alle';
      case 'vereinsvertreter': return 'Vereinsvertreter';
      case 'mannschaftsfuehrer': return 'Mannschaftsführer';
      case 'admins': return 'Admins';
      default: return aud;
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">
            Sie haben keine Berechtigung, News-Artikel zu erstellen.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PenTool className="h-5 w-5" />
          {isEditing ? 'News-Artikel bearbeiten' : 'Neuer News-Artikel'}
        </CardTitle>
        <CardDescription>
          Erstellen Sie offizielle Mitteilungen für die RWK-Community.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Aussagekräftiger Titel für den News-Artikel"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">Kurzbeschreibung</Label>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Kurze Zusammenfassung (wird automatisch generiert wenn leer)"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Inhalt *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Vollständiger Inhalt des News-Artikels..."
              rows={10}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Kategorie</Label>
              <Select value={category} onValueChange={(value: NewsArticle['category']) => setCategory(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="allgemein">Allgemein</SelectItem>
                  <SelectItem value="ergebnisse">Ergebnisse</SelectItem>
                  <SelectItem value="termine">Termine</SelectItem>
                  <SelectItem value="regelaenderung">Regeländerung</SelectItem>
                  <SelectItem value="wichtig">Wichtig</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priorität</Label>
              <Select value={priority} onValueChange={(value: NewsArticle['priority']) => setPriority(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="hoch">Hoch</SelectItem>
                  <SelectItem value="dringend">Dringend</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value: NewsArticle['status']) => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entwurf">Entwurf</SelectItem>
                  <SelectItem value="veroeffentlicht">Veröffentlicht</SelectItem>
                  <SelectItem value="archiviert">Archiviert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="audience">Zielgruppe</Label>
              <Select value={targetAudience} onValueChange={(value: NewsArticle['targetAudience']) => setTargetAudience(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Alle</SelectItem>
                  <SelectItem value="vereinsvertreter">Vereinsvertreter</SelectItem>
                  <SelectItem value="mannschaftsfuehrer">Mannschaftsführer</SelectItem>
                  <SelectItem value="admins">Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="pinned"
              checked={pinned}
              onCheckedChange={setPinned}
            />
            <Label htmlFor="pinned" className="flex items-center gap-2">
              <Pin className="w-4 h-4" />
              Artikel oben anheften
            </Label>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => handleRemoveTag(tag)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Neuen Tag hinzufügen"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>
                Hinzufügen
              </Button>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Abbrechen
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Wird gespeichert...' : (
                <>
                  {status === 'veroeffentlicht' ? <Eye className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  {status === 'veroeffentlicht' ? 'Veröffentlichen' : 'Als Entwurf speichern'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
