import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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
} from '@/components/ui/alert-dialog';
import { 
  Download, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Trash2, 
  HardDrive,
  Cloud,
  CloudOff,
  Crown,
  Loader2
} from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useNavigate } from 'react-router-dom';

export function OfflineSettings() {
  const navigate = useNavigate();
  const {
    status,
    downloadAllContent,
    clearOfflineContent,
    syncPendingChanges,
    isAvailable,
  } = useOfflineSync();
  const [isDownloading, setIsDownloading] = useState(false);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownloadAll = async () => {
    setIsDownloading(true);
    await downloadAllContent();
    setIsDownloading(false);
  };

  if (!isAvailable) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CloudOff className="w-5 h-5" />
            Mode Hors Ligne
            <Badge variant="secondary" className="ml-2">
              <Crown className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          </CardTitle>
          <CardDescription>
            Accédez à vos contenus même sans connexion internet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-6 bg-muted rounded-lg text-center">
            <Crown className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
            <h3 className="font-semibold mb-2">Fonctionnalité Premium</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Le mode hors ligne complet est réservé aux abonnés Premium.
              Téléchargez tous vos cours et révisez partout, même sans internet.
            </p>
            <Button onClick={() => navigate('/subscription')}>
              Passer à Premium
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {status.isOnline ? (
              <Wifi className="w-5 h-5 text-green-500" />
            ) : (
              <WifiOff className="w-5 h-5 text-orange-500" />
            )}
            Mode Hors Ligne
          </div>
          <Badge variant={status.isOnline ? 'default' : 'secondary'}>
            {status.isOnline ? 'En ligne' : 'Hors ligne'}
          </Badge>
        </CardTitle>
        <CardDescription>
          Gérez le stockage hors ligne de vos contenus
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Storage usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              Stockage utilisé
            </Label>
            <span className="text-sm text-muted-foreground">
              {formatBytes(status.totalStorageUsed)}
            </span>
          </div>
          <Progress value={Math.min((status.totalStorageUsed / (100 * 1024 * 1024)) * 100, 100)} />
          <p className="text-xs text-muted-foreground">
            Maximum recommandé: 100 MB
          </p>
        </div>

        <Separator />

        {/* Sync status */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Synchronisation</Label>
              <p className="text-sm text-muted-foreground">
                {status.isSyncing 
                  ? 'Synchronisation en cours...' 
                  : status.lastSyncAt 
                    ? `Dernière sync: ${status.lastSyncAt.toLocaleString('fr-FR')}`
                    : 'Jamais synchronisé'}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={syncPendingChanges}
              disabled={!status.isOnline || status.isSyncing}
            >
              {status.isSyncing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>

          {status.pendingChanges > 0 && (
            <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <Cloud className="w-4 h-4 text-yellow-600" />
              <span className="text-sm">
                {status.pendingChanges} modification(s) en attente de synchronisation
              </span>
            </div>
          )}
        </div>

        <Separator />

        {/* Actions */}
        <div className="space-y-3">
          <Button
            className="w-full"
            onClick={handleDownloadAll}
            disabled={!status.isOnline || isDownloading || status.isSyncing}
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Téléchargement...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Télécharger tout le contenu
              </>
            )}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Effacer le contenu hors ligne
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Effacer le contenu hors ligne ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action supprimera tous les contenus téléchargés pour le mode hors ligne.
                  Vos données en ligne ne seront pas affectées.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={clearOfflineContent}>
                  Effacer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Info */}
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">
            💡 Conseil: Téléchargez vos contenus lorsque vous êtes connecté au WiFi pour économiser vos données mobiles.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
