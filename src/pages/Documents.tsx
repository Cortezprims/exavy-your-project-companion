import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DocumentUpload } from '@/components/documents/DocumentUpload';
import { DocumentProcessingProgress } from '@/components/documents/DocumentProcessingProgress';
import { GenerateOptionsDialog } from '@/components/documents/GenerateOptionsDialog';
import { GenerateExamDialog } from '@/components/documents/GenerateExamDialog';
import { GeneratePresentationDialog } from '@/components/presentations/GeneratePresentationDialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
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
  Loader2,
  Network,
  MessageSquare,
  Crown,
  GraduationCap,
  Presentation,
  Dumbbell
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Generate options dialog state
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [generateType, setGenerateType] = useState<'quiz' | 'flashcards'>('quiz');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  
  // Exam dialog state
  const [examDialogOpen, setExamDialogOpen] = useState(false);
  const [examDocument, setExamDocument] = useState<Document | null>(null);

  const openGenerateDialog = (doc: Document, type: 'quiz' | 'flashcards') => {
    setSelectedDocument(doc);
    setGenerateType(type);
    setGenerateDialogOpen(true);
  };

  const openExamDialog = (doc: Document) => {
    setExamDocument(doc);
    setExamDialogOpen(true);
  };

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

  // Realtime subscription for document status updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('documents-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'documents',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setDocuments(prev => 
            prev.map(doc => 
              doc.id === payload.new.id 
                ? { ...doc, status: payload.new.status as string } 
                : doc
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  const handleGenerateExercises = async (doc: Document) => {
    if (doc.status !== 'completed') {
      toast.error('Le document doit être traité avant de générer des exercices');
      return;
    }

    toast.loading('Génération des exercices en cours...', { id: 'exercises' });
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('generate-exercises', {
        body: { documentId: doc.id },
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Exercices générés avec succès !', { id: 'exercises' });
      navigate('/exercises');
    } catch (error: any) {
      console.error('Error generating exercises:', error);
      toast.error(error.message || 'Erreur lors de la génération', { id: 'exercises' });
    }
  };

  const [presentationDialogDoc, setPresentationDialogDoc] = useState<Document | null>(null);

  const handleGeneratePresentation = (doc: Document) => {
    if (doc.status !== 'completed') {
      toast.error('Le document doit être traité avant de générer une présentation');
      return;
    }
    setPresentationDialogDoc(doc);
  };

  const handleChatWithDocument = (doc: Document) => {
    if (doc.status !== 'completed') {
      toast.error('Le document doit être traité avant de discuter avec EXABOT');
      return;
    }
    navigate(`/chat?documentId=${doc.id}`);
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
                  
                  {/* Action Tabs */}
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid grid-cols-2 w-full h-8 mb-2">
                      <TabsTrigger value="basic" className="text-xs">Standard</TabsTrigger>
                      <TabsTrigger value="premium" className="text-xs flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        Premium
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="basic" className="mt-0">
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={doc.status !== 'completed'}
                          onClick={() => openGenerateDialog(doc, 'quiz')}
                          className="text-xs h-8"
                        >
                          <Brain className="w-3 h-3 mr-1" />
                          Quiz
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={doc.status !== 'completed'}
                          onClick={() => openGenerateDialog(doc, 'flashcards')}
                          className="text-xs h-8"
                        >
                          <BookOpen className="w-3 h-3 mr-1" />
                          Flashcards
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={doc.status !== 'completed'}
                          onClick={() => navigate(`/summaries/${doc.id}`)}
                          className="text-xs h-8"
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          Résumé
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={doc.status !== 'completed'}
                          onClick={() => navigate(`/mindmap/${doc.id}`)}
                          className="text-xs h-8"
                        >
                          <Network className="w-3 h-3 mr-1" />
                          Mind Map
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="premium" className="mt-0">
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={doc.status !== 'completed'}
                          onClick={() => openExamDialog(doc)}
                          className="text-xs h-8"
                        >
                          <GraduationCap className="w-3 h-3 mr-1" />
                          Examen Blanc
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={doc.status !== 'completed'}
                          onClick={() => handleGenerateExercises(doc)}
                          className="text-xs h-8"
                        >
                          <Dumbbell className="w-3 h-3 mr-1" />
                          Exercices
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={doc.status !== 'completed'}
                          onClick={() => handleGeneratePresentation(doc)}
                          className="text-xs h-8"
                        >
                          <Presentation className="w-3 h-3 mr-1" />
                          Présentation
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={doc.status !== 'completed'}
                          onClick={() => handleChatWithDocument(doc)}
                          className="text-xs h-8"
                        >
                          <MessageSquare className="w-3 h-3 mr-1" />
                          Chat IA
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  {/* Premium badge for audio/image */}
                  {(doc.file_type === 'audio' || doc.file_type === 'image') && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-amber-600">
                      <Crown className="w-3 h-3" />
                      <span>Contenu Premium</span>
                    </div>
                  )}
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

        {/* Generate Options Dialog */}
        {selectedDocument && user && (
          <GenerateOptionsDialog
            open={generateDialogOpen}
            onOpenChange={setGenerateDialogOpen}
            type={generateType}
            documentId={selectedDocument.id}
            documentTitle={selectedDocument.title}
            userId={user.id}
            onGenerated={fetchDocuments}
          />
        )}

        {/* Exam Dialog */}
        {examDocument && (
          <GenerateExamDialog
            open={examDialogOpen}
            onOpenChange={setExamDialogOpen}
            documentId={examDocument.id}
            documentTitle={examDocument.title}
          />
        )}

        {/* Presentation Dialog */}
        {presentationDialogDoc && (
          <GeneratePresentationDialog
            open={!!presentationDialogDoc}
            onOpenChange={(open) => { if (!open) setPresentationDialogDoc(null); }}
            documentId={presentationDialogDoc.id}
            documentTitle={presentationDialogDoc.title}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default Documents;
