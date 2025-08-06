import { db } from '@/lib/firebase/config';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { auditLogService } from './audit-service';

export interface NewsArticle {
  id?: string;
  title: string;
  content: string;
  excerpt: string;
  category: 'allgemein' | 'ergebnisse' | 'termine' | 'regelaenderung' | 'wichtig';
  priority: 'normal' | 'hoch' | 'dringend';
  status: 'entwurf' | 'veroeffentlicht' | 'archiviert';
  
  // Autor
  authorEmail: string;
  authorName: string;
  
  // Zeitstempel
  createdAt: Date;
  publishedAt?: Date;
  updatedAt?: Date;
  
  // Zielgruppe
  targetAudience: 'alle' | 'vereinsvertreter' | 'mannschaftsfuehrer' | 'admins';
  
  // Anhänge
  attachments: string[];
  
  // Interaktion
  views: number;
  pinned: boolean;
  
  // SEO
  slug: string;
  tags: string[];
}

class NewsService {
  private collection = 'rwk_news';

  /**
   * Neuen News-Artikel erstellen
   */
  async createArticle(article: Omit<NewsArticle, 'id' | 'createdAt' | 'views' | 'slug'>): Promise<string> {
    try {
      const slug = this.generateSlug(article.title);
      
      const articleData = {
        ...article,
        createdAt: Timestamp.fromDate(new Date()),
        publishedAt: article.status === 'veroeffentlicht' ? Timestamp.fromDate(new Date()) : null,
        views: 0,
        slug
      };

      const docRef = await addDoc(collection(db, this.collection), articleData);
      
      // Audit-Log erstellen
      try {
        await auditLogService.logAction(
          'create',
          'news_article',
          docRef.id,
          {
            description: `News-Artikel erstellt: ${article.title}`,
            after: {
              title: article.title,
              category: article.category,
              status: article.status,
              priority: article.priority
            }
          },
          {},
          {
            userId: article.authorEmail,
            userName: article.authorName
          }
        );
      } catch (auditError) {
        console.error('Fehler beim Erstellen des Audit-Logs:', auditError);
      }
      
      // TODO: Push-Notification senden wenn veröffentlicht
      if (article.status === 'veroeffentlicht') {

      }
      
      return docRef.id;
    } catch (error) {
      console.error('Fehler beim Erstellen des News-Artikels:', error);
      throw error;
    }
  }

  /**
   * Alle News-Artikel abrufen (für Admin)
   */
  async getAllArticles(): Promise<NewsArticle[]> {
    try {
      const articlesQuery = query(
        collection(db, this.collection),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(articlesQuery);
      
      return this.mapArticles(snapshot);
    } catch (error) {
      console.error('Fehler beim Laden aller News-Artikel:', error);
      throw error;
    }
  }

  /**
   * Veröffentlichte News-Artikel abrufen
   */
  async getPublishedArticles(limitCount: number = 10): Promise<NewsArticle[]> {
    try {
      const articlesQuery = query(
        collection(db, this.collection),
        where('status', '==', 'veroeffentlicht'),
        orderBy('publishedAt', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(articlesQuery);
      
      return this.mapArticles(snapshot);
    } catch (error) {
      console.error('Fehler beim Laden der veröffentlichten News-Artikel:', error);
      // Leeres Array zurückgeben statt Fehler zu werfen
      return [];
    }
  }

  /**
   * Gepinnte News-Artikel abrufen
   */
  async getPinnedArticles(): Promise<NewsArticle[]> {
    try {
      const articlesQuery = query(
        collection(db, this.collection),
        where('status', '==', 'veroeffentlicht'),
        where('pinned', '==', true),
        orderBy('publishedAt', 'desc')
      );
      
      const snapshot = await getDocs(articlesQuery);
      
      return this.mapArticles(snapshot);
    } catch (error) {
      console.error('Fehler beim Laden der gepinnten News-Artikel:', error);
      throw error;
    }
  }

  /**
   * News-Artikel nach Kategorie abrufen
   */
  async getArticlesByCategory(category: NewsArticle['category'], limitCount: number = 10): Promise<NewsArticle[]> {
    try {
      const articlesQuery = query(
        collection(db, this.collection),
        where('status', '==', 'veroeffentlicht'),
        where('category', '==', category),
        orderBy('publishedAt', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(articlesQuery);
      
      return this.mapArticles(snapshot);
    } catch (error) {
      console.error('Fehler beim Laden der News-Artikel nach Kategorie:', error);
      throw error;
    }
  }

  /**
   * News-Artikel aktualisieren
   */
  async updateArticle(id: string, updates: Partial<NewsArticle>): Promise<void> {
    try {
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date())
      };

      // Wenn Status auf veröffentlicht geändert wird
      if (updates.status === 'veroeffentlicht' && !updates.publishedAt) {
        updateData.publishedAt = Timestamp.fromDate(new Date());
      }

      // Slug aktualisieren wenn Titel geändert wird
      if (updates.title) {
        updateData.slug = this.generateSlug(updates.title);
      }

      await updateDoc(doc(db, this.collection, id), updateData);
      

    } catch (error) {
      console.error('Fehler beim Aktualisieren des News-Artikels:', error);
      throw error;
    }
  }

  /**
   * News-Artikel löschen
   */
  async deleteArticle(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.collection, id));

    } catch (error) {
      console.error('Fehler beim Löschen des News-Artikels:', error);
      throw error;
    }
  }

  /**
   * Artikel-Views erhöhen
   */
  async incrementViews(id: string): Promise<void> {
    try {
      // Aktuellen Artikel laden
      const articlesQuery = query(
        collection(db, this.collection),
        where('__name__', '==', id)
      );
      
      const snapshot = await getDocs(articlesQuery);
      
      if (!snapshot.empty) {
        const currentViews = snapshot.docs[0].data().views || 0;
        await updateDoc(doc(db, this.collection, id), {
          views: currentViews + 1
        });
      }
    } catch (error) {
      console.error('Fehler beim Erhöhen der Views:', error);
    }
  }

  /**
   * News-Statistiken
   */
  async getNewsStats(): Promise<{
    total: number;
    published: number;
    drafts: number;
    archived: number;
    pinned: number;
  }> {
    try {
      const articles = await this.getAllArticles();
      
      return {
        total: articles.length,
        published: articles.filter(a => a.status === 'veroeffentlicht').length,
        drafts: articles.filter(a => a.status === 'entwurf').length,
        archived: articles.filter(a => a.status === 'archiviert').length,
        pinned: articles.filter(a => a.pinned).length
      };
    } catch (error) {
      console.error('Fehler beim Laden der News-Statistiken:', error);
      throw error;
    }
  }

  /**
   * Hilfsfunktion: Artikel-Daten mappen
   */
  private mapArticles(snapshot: any): NewsArticle[] {
    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      publishedAt: doc.data().publishedAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as NewsArticle[];
  }

  /**
   * Hilfsfunktion: Slug generieren
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[äöüß]/g, (match) => {
        const replacements: { [key: string]: string } = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' };
        return replacements[match] || match;
      })
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .substring(0, 50);
  }
}

export const newsService = new NewsService();
