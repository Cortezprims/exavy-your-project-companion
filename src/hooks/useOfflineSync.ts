import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';

interface OfflineContent {
  id: string;
  content_type: string;
  content_id: string;
  compressed_data: string;
  file_size: number;
  last_synced_at: string;
  version: number;
}

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingChanges: number;
  lastSyncAt: Date | null;
  totalStorageUsed: number;
}

const DB_NAME = 'exavy_offline';
const DB_VERSION = 1;
const STORE_NAME = 'content';

export function useOfflineSync() {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingChanges: 0,
    lastSyncAt: null,
    totalStorageUsed: 0,
  });
  const [db, setDb] = useState<IDBDatabase | null>(null);

  // Initialize IndexedDB
  useEffect(() => {
    if (!isPremium()) return;

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open IndexedDB');
    };

    request.onsuccess = () => {
      setDb(request.result);
      calculateStorageUsed(request.result);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('content_type', 'content_type', { unique: false });
        store.createIndex('content_id', 'content_id', { unique: false });
        store.createIndex('synced', 'synced', { unique: false });
      }
    };

    return () => {
      db?.close();
    };
  }, [isPremium]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
      if (isPremium()) {
        syncPendingChanges();
        toast.success('Connexion rétablie ! Synchronisation en cours...');
      }
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }));
      if (isPremium()) {
        toast.info('Mode hors ligne activé');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isPremium]);

  const calculateStorageUsed = async (database: IDBDatabase) => {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const items = request.result;
      const totalSize = items.reduce((acc, item) => acc + (item.file_size || 0), 0);
      setStatus(prev => ({ ...prev, totalStorageUsed: totalSize }));
    };
  };

  // Compress content using LZ compression (simplified base64 for now)
  const compressContent = (content: string): string => {
    // In a real app, use a proper compression library like lz-string
    return btoa(encodeURIComponent(content));
  };

  const decompressContent = (compressed: string): string => {
    try {
      return decodeURIComponent(atob(compressed));
    } catch {
      return compressed;
    }
  };

  // Save content for offline access
  const saveForOffline = useCallback(async (
    contentType: 'document' | 'quiz' | 'flashcard' | 'mindmap' | 'summary',
    contentId: string,
    data: any
  ) => {
    if (!db || !user || !isPremium()) return false;

    try {
      const compressed = compressContent(JSON.stringify(data));
      const fileSize = new Blob([compressed]).size;

      const offlineItem = {
        id: `${contentType}_${contentId}`,
        user_id: user.id,
        content_type: contentType,
        content_id: contentId,
        data: compressed,
        file_size: fileSize,
        synced: true,
        version: Date.now(),
        created_at: new Date().toISOString(),
      };

      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      await store.put(offlineItem);

      // Also save to Supabase for backup
      if (status.isOnline) {
        await supabase.from('offline_content').upsert({
          user_id: user.id,
          content_type: contentType,
          content_id: contentId,
          compressed_data: compressed,
          file_size: fileSize,
          version: offlineItem.version,
        });
      }

      calculateStorageUsed(db);
      toast.success('Contenu sauvegardé pour le mode hors ligne');
      return true;
    } catch (error) {
      console.error('Save offline error:', error);
      toast.error('Erreur lors de la sauvegarde hors ligne');
      return false;
    }
  }, [db, user, isPremium, status.isOnline]);

  // Get offline content
  const getOfflineContent = useCallback(async (
    contentType: string,
    contentId: string
  ): Promise<any | null> => {
    if (!db) return null;

    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(`${contentType}_${contentId}`);

      request.onsuccess = () => {
        if (request.result?.data) {
          const decompressed = decompressContent(request.result.data);
          try {
            resolve(JSON.parse(decompressed));
          } catch {
            resolve(decompressed);
          }
        } else {
          resolve(null);
        }
      };

      request.onerror = () => resolve(null);
    });
  }, [db]);

  // Get all offline content of a type
  const getAllOfflineContent = useCallback(async (
    contentType?: string
  ): Promise<any[]> => {
    if (!db) return [];

    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      let request;
      if (contentType) {
        const index = store.index('content_type');
        request = index.getAll(contentType);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        const items = request.result.map(item => ({
          ...item,
          data: item.data ? JSON.parse(decompressContent(item.data)) : null,
        }));
        resolve(items);
      };

      request.onerror = () => resolve([]);
    });
  }, [db]);

  // Sync pending changes when back online
  const syncPendingChanges = useCallback(async () => {
    if (!db || !user || !status.isOnline) return;

    setStatus(prev => ({ ...prev, isSyncing: true }));

    try {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = async () => {
        const pendingItems = request.result.filter((item: any) => !item.synced);
        
        for (const item of pendingItems) {
          try {
            await supabase.from('offline_content').upsert({
              user_id: user.id,
              content_type: item.content_type,
              content_id: item.content_id,
              compressed_data: item.data,
              file_size: item.file_size,
              version: item.version,
            });

            // Mark as synced
            const updateTx = db.transaction(STORE_NAME, 'readwrite');
            const updateStore = updateTx.objectStore(STORE_NAME);
            item.synced = true;
            updateStore.put(item);
          } catch (error) {
            console.error('Sync item error:', error);
          }
        }

        setStatus(prev => ({ 
          ...prev, 
          isSyncing: false, 
          pendingChanges: 0,
          lastSyncAt: new Date(),
        }));
      };
    } catch (error) {
      console.error('Sync error:', error);
      setStatus(prev => ({ ...prev, isSyncing: false }));
    }
  }, [db, user, status.isOnline]);

  // Delete offline content
  const removeOfflineContent = useCallback(async (
    contentType: string,
    contentId: string
  ) => {
    if (!db || !user) return;

    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.delete(`${contentType}_${contentId}`);

    if (status.isOnline) {
      await supabase
        .from('offline_content')
        .delete()
        .eq('user_id', user.id)
        .eq('content_type', contentType)
        .eq('content_id', contentId);
    }

    calculateStorageUsed(db);
  }, [db, user, status.isOnline]);

  // Download all user content for offline
  const downloadAllContent = useCallback(async () => {
    if (!user || !isPremium() || !status.isOnline) return;

    setStatus(prev => ({ ...prev, isSyncing: true }));
    
    try {
      // Fetch all documents
      const { data: documents } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id);

      // Fetch all quizzes
      const { data: quizzes } = await supabase
        .from('quizzes')
        .select('*')
        .eq('user_id', user.id);

      // Fetch all flashcard decks with cards
      const { data: decks } = await supabase
        .from('flashcard_decks')
        .select('*, flashcards(*)')
        .eq('user_id', user.id);

      // Fetch all mind maps
      const { data: mindMaps } = await supabase
        .from('mind_maps')
        .select('*')
        .eq('user_id', user.id);

      // Fetch all summaries
      const { data: summaries } = await supabase
        .from('summaries')
        .select('*')
        .eq('user_id', user.id);

      // Save all to offline storage
      let savedCount = 0;
      
      for (const doc of documents || []) {
        await saveForOffline('document', doc.id, doc);
        savedCount++;
      }

      for (const quiz of quizzes || []) {
        await saveForOffline('quiz', quiz.id, quiz);
        savedCount++;
      }

      for (const deck of decks || []) {
        await saveForOffline('flashcard', deck.id, deck);
        savedCount++;
      }

      for (const map of mindMaps || []) {
        await saveForOffline('mindmap', map.id, map);
        savedCount++;
      }

      for (const summary of summaries || []) {
        await saveForOffline('summary', summary.id, summary);
        savedCount++;
      }

      toast.success(`${savedCount} éléments téléchargés pour le mode hors ligne`);
    } catch (error) {
      console.error('Download all error:', error);
      toast.error('Erreur lors du téléchargement');
    } finally {
      setStatus(prev => ({ ...prev, isSyncing: false, lastSyncAt: new Date() }));
    }
  }, [user, isPremium, status.isOnline, saveForOffline]);

  // Clear all offline content
  const clearOfflineContent = useCallback(async () => {
    if (!db) return;

    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.clear();

    setStatus(prev => ({ ...prev, totalStorageUsed: 0 }));
    toast.success('Contenu hors ligne effacé');
  }, [db]);

  return {
    status,
    saveForOffline,
    getOfflineContent,
    getAllOfflineContent,
    removeOfflineContent,
    downloadAllContent,
    clearOfflineContent,
    syncPendingChanges,
    isAvailable: isPremium(),
  };
}
