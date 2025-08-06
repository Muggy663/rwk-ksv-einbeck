"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Newspaper, Pin, Eye, Edit, Trash2, Search, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { newsService, NewsArticle } from '@/lib/services/news-service';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface NewsListProps {
  showAll?: boolean; // true für Admin-Ansicht
  onEdit?: (article: NewsArticle) => void;
  limit?: number;
}

export function NewsList({ showAll = false, onEdit, limit = 10 }: NewsListProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('alle');
  const [statusFilter, setStatusFilter] = useState<string>('alle');

  const isAdmin = user?.email === 'admin@rwk-einbeck.de';

  useEffect(() => {
    loadArticles();
  }, [showAll, categoryFilter]);

  const loadArticles = async () => {
    setLoading(true);
    try {
      let articlesData: NewsArticle[];
      
      if (showAll && isAdmin) {
        articlesData = await newsService.getAllArticles();
      } else if (categoryFilter !== 'alle') {
        articlesData = await newsService.getArticlesByCategory(categoryFilter as NewsArticle['category'], limit);
      } else {
        articlesData = await newsService.getPublishedArticles(limit);
      }
      
      setArticles(articlesData);
    } catch (error) {
      console.error('Fehler beim Laden der News-Artikel:', error);
      toast({
        title: 'Fehler',
        description: 'Die News-Artikel konnten nicht geladen werden.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (articleId: string) => {
    if (!isAdmin) return;
    
    if (!confirm('Sind Sie sicher, dass Sie diesen Artikel löschen möchten?')) {
      return;
    }

    try {
      await newsService.deleteArticle(articleId);
      toast({
        title: 'Artikel gelöscht',
        description: 'Der News-Artikel wurde erfolgreich gelöscht.',
      });
      await loadArticles();
    } catch (error) {
      console.error('Fehler beim Löschen des Artikels:', error);
      toast({
        title: 'Fehler',
        description: 'Der Artikel konnte nicht gelöscht werden.',
        variant: 'destructive'
      });
    }
  };

  const handleViewIncrement = async (articleId: string) => {
    await newsService.incrementViews(articleId);
  };

  const getStatusBadge = (status: NewsArticle['status']) => {
    switch (status) {
      case 'entwurf':
        return <Badge variant="outline">Entwurf</Badge>;
      case 'veroeffentlicht':
        return <Badge variant="default">Veröffentlicht</Badge>;
      case 'archiviert':
        return <Badge variant="secondary">Archiviert</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: NewsArticle['priority']) => {
    switch (priority) {
      case 'dringend':
        return <Badge variant="destructive">Dringend</Badge>;
      case 'hoch':
        return <Badge variant="default" className="bg-orange-600">Hoch</Badge>;
      case 'normal':
        return <Badge variant="outline">Normal</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getCategoryBadge = (category: NewsArticle['category']) => {
    const colors = {
      'allgemein': 'bg-blue-600',
      'ergebnisse': 'bg-green-600',
      'termine': 'bg-purple-600',
      'regelaenderung': 'bg-orange-600',
      'wichtig': 'bg-red-600'
    };

    const labels = {
      'allgemein': 'Allgemein',
      'ergebnisse': 'Ergebnisse',
      'termine': 'Termine',
      'regelaenderung': 'Regeländerung',
      'wichtig': 'Wichtig'
    };

    return (
      <Badge variant="default" className={colors[category]}>
        {labels[category]}
      </Badge>
    );
  };

  // Filter articles based on search and status
  const filteredArticles = articles.filter(article => {
    const matchesSearch = searchTerm === '' || 
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'alle' || article.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="text-center py-8">Lade News-Artikel...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filter und Suche */}
      {(showAll || articles.length > 5) && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Suche</label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Artikel durchsuchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Kategorie</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle Kategorien</SelectItem>
                    <SelectItem value="allgemein">Allgemein</SelectItem>
                    <SelectItem value="ergebnisse">Ergebnisse</SelectItem>
                    <SelectItem value="termine">Termine</SelectItem>
                    <SelectItem value="regelaenderung">Regeländerung</SelectItem>
                    <SelectItem value="wichtig">Wichtig</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {showAll && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alle">Alle Status</SelectItem>
                      <SelectItem value="entwurf">Entwurf</SelectItem>
                      <SelectItem value="veroeffentlicht">Veröffentlicht</SelectItem>
                      <SelectItem value="archiviert">Archiviert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {filteredArticles.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Newspaper className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm || categoryFilter !== 'alle' || statusFilter !== 'alle' 
                ? 'Keine Artikel gefunden, die den Filterkriterien entsprechen.'
                : 'Keine News-Artikel vorhanden.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        filteredArticles.map((article) => (
          <Card key={article.id} className={article.pinned ? 'border-primary' : ''}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {article.pinned && <Pin className="h-4 w-4 text-primary" />}
                    <CardTitle className="text-lg">{article.title}</CardTitle>
                  </div>
                  <CardDescription>
                    {article.excerpt}
                  </CardDescription>
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  {getCategoryBadge(article.category)}
                  {getPriorityBadge(article.priority)}
                  {showAll && getStatusBadge(article.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{article.content.length > 800 ? article.content.substring(0, 800) + '...' : article.content}</p>
              </div>

              {article.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {article.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <div>
                  Von {article.authorName} • {format(article.publishedAt || article.createdAt, 'dd.MM.yyyy HH:mm', { locale: de })}
                  {article.views > 0 && (
                    <span className="ml-2 flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {article.views}
                    </span>
                  )}
                </div>
                
                {isAdmin && showAll && (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit?.(article)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(article.id!)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
