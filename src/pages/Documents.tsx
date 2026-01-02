import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  Upload, 
  Search, 
  MoreVertical, 
  Trash2, 
  Eye,
  Brain,
  BookOpen,
  Sparkles
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
}

const Documents = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [documents] = useState<Document[]>([
    { id: '1', name: 'Histoire - Révolution Française.pdf', type: 'PDF', size: '2.4 MB', uploadedAt: '2024-01-15' },
    { id: '2', name: 'Mathématiques - Algèbre.pdf', type: 'PDF', size: '1.8 MB', uploadedAt: '2024-01-14' },
    { id: '3', name: 'Anglais - Grammar Guide.pdf', type: 'PDF', size: '3.1 MB', uploadedAt: '2024-01-12' },
    { id: '4', name: 'Physique - Mécanique.pdf', type: 'PDF', size: '2.9 MB', uploadedAt: '2024-01-10' },
  ]);

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
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
          <Button>
            <Upload className="w-4 h-4 mr-2" />
            Importer un document
          </Button>
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

        {/* Documents Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-medium truncate">
                        {doc.name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {doc.type} • {doc.size}
                      </CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="w-4 h-4 mr-2" />
                        Voir
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground mb-4">
                  Importé le {new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Brain className="w-3 h-3 mr-1" />
                    Quiz
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <BookOpen className="w-3 h-3 mr-1" />
                    Flashcards
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Résumé
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredDocuments.length === 0 && (
          <Card className="p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun document trouvé</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? "Aucun document ne correspond à votre recherche"
                : "Commencez par importer votre premier document"}
            </p>
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Importer un document
            </Button>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default Documents;
