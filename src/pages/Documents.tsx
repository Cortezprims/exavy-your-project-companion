import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DocumentUpload } from '@/components/documents/DocumentUpload';
import { DocumentProcessingProgress } from '@/components/documents/DocumentProcessingProgress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  FileText, 
  Search, 
  MoreVertical, 
  Trash2, 
  Eye,
  Brain,
  BookOpen,
  Sparkles,
  Image,
  Music,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Document {
  id: string;
  title: string;
  file_type: string;
  file_name: string | null;
  file_path: string | null;
  file_size: number | null;
  status: string;
  created_at: string;
}

const getFileIcon = (type: string) => {
  switch (type) {
    case 'pdf':
      return <FileText className="w-6 h-6 text-red-500" />;
    case 'image':
      return <Image className="w-6 h-6 text-blue-500" />;
    case 'audio':
      return <Music className="w-6 h-6 text-purple-500" />;
    default:
      return <FileText className="w-6 h-6 text-gray-500" />;
  }
};

const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'completed':
      return <Badge variant="default" className="bg-secondary">Traité</Badge>;
    case 'processing':
      return <Badge variant="outline" className="text-warning border-warning">En cours</Badge>;
    case 'error':
      return <Badge variant="destructive">Erreur</Badge>;
    default:
      return <Badge variant="outline">En attente</Badge>;
  }
};

const Documents = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching documents:', error);
        toast.error('Erreur lors du chargement des documents');
        return;
      }

      setDocuments(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  const deleteDocument = async (id: string, filePath: string | null) => {
    try {
      // Delete from storage if file exists
      if (filePath) {
        await supabase.storage.from('documents').remove([filePath]);
      }

      // Delete from database
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error('Erreur lors de la suppression');
        return;
      }

      toast.success('Document supprimé');
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Mes Documents</h1>
            <p className="text-muted-foreground">
              Gérez vos documents et générez du contenu d'apprentissage
            </p>
          </div>
          <DocumentUpload onUploadComplete={fetchDocuments} />
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un document..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Documents Grid */}
        {!loading && filteredDocuments.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {getFileIcon(doc.file_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-medium truncate">
                          {doc.title}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {doc.file_type.toUpperCase()} {doc.file_size && `• ${formatFileSize(doc.file_size)}`}
                        </CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          Voir
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => deleteDocument(doc.id, doc.file_name)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground mb-3">
                    Importé le {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                  </p>
                  <div className="mb-4">
                    <DocumentProcessingProgress status={doc.status} />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" disabled={doc.status !== 'completed'}>
                      <Brain className="w-3 h-3 mr-1" />
                      Quiz
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" disabled={doc.status !== 'completed'}>
                      <BookOpen className="w-3 h-3 mr-1" />
                      Flashcards
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" disabled={doc.status !== 'completed'}>
                      <Sparkles className="w-3 h-3 mr-1" />
                      Résumé
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredDocuments.length === 0 && (
          <Card className="p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun document trouvé</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? "Aucun document ne correspond à votre recherche"
                : "Commencez par importer votre premier document"}
            </p>
            <DocumentUpload onUploadComplete={fetchDocuments} />
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default Documents;
