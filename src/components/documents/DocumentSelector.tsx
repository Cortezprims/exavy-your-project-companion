import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FileText, Image, Music, Search, Check } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Document {
  id: string;
  title: string;
  file_type: string;
  status: string;
  created_at: string;
}

interface DocumentSelectorProps {
  onSelect: (document: Document) => void;
  selectedId?: string;
  trigger?: React.ReactNode;
  title?: string;
}

const getFileIcon = (type: string) => {
  switch (type) {
    case 'pdf':
      return <FileText className="w-5 h-5 text-red-500" />;
    case 'image':
      return <Image className="w-5 h-5 text-blue-500" />;
    case 'audio':
      return <Music className="w-5 h-5 text-purple-500" />;
    default:
      return <FileText className="w-5 h-5 text-muted-foreground" />;
  }
};

export const DocumentSelector = ({ 
  onSelect, 
  selectedId,
  trigger,
  title = "Sélectionner un document"
}: DocumentSelectorProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (open && user) {
      fetchDocuments();
    }
  }, [open, user]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, title, file_type, status, created_at')
        .eq('user_id', user?.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (doc: Document) => {
    onSelect(doc);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            Choisir un document
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'Aucun résultat' : 'Aucun document disponible'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDocuments.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => handleSelect(doc)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-accent ${
                    selectedId === doc.id ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  {getFileIcon(doc.file_type)}
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm truncate">{doc.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(doc.created_at), 'dd MMM yyyy', { locale: fr })}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {doc.file_type.toUpperCase()}
                  </Badge>
                  {selectedId === doc.id && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
