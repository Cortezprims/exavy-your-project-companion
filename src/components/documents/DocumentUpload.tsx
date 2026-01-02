import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, FileText, Image, Music, X, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DocumentUploadProps {
  onUploadComplete?: () => void;
}

const MAX_FILE_SIZES = {
  'application/pdf': 50 * 1024 * 1024, // 50MB
  'image/jpeg': 10 * 1024 * 1024, // 10MB
  'image/png': 10 * 1024 * 1024, // 10MB
  'audio/mpeg': 100 * 1024 * 1024, // 100MB
  'audio/mp4': 100 * 1024 * 1024, // 100MB
  'audio/wav': 100 * 1024 * 1024, // 100MB
  'audio/x-m4a': 100 * 1024 * 1024, // 100MB
};

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'audio/mpeg': ['.mp3'],
  'audio/mp4': ['.m4a'],
  'audio/wav': ['.wav'],
  'audio/x-m4a': ['.m4a'],
};

const getFileType = (mimeType: string): 'pdf' | 'image' | 'audio' | 'note' => {
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'note';
};

const getFileIcon = (type: string) => {
  switch (type) {
    case 'pdf':
      return <FileText className="w-8 h-8 text-red-500" />;
    case 'image':
      return <Image className="w-8 h-8 text-blue-500" />;
    case 'audio':
      return <Music className="w-8 h-8 text-purple-500" />;
    default:
      return <FileText className="w-8 h-8 text-gray-500" />;
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export const DocumentUpload = ({ onUploadComplete }: DocumentUploadProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<string>('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => {
      const maxSize = MAX_FILE_SIZES[file.type as keyof typeof MAX_FILE_SIZES];
      if (!maxSize) {
        toast.error(`Type de fichier non supporté: ${file.type}`);
        return false;
      }
      if (file.size > maxSize) {
        toast.error(`Fichier trop volumineux: ${file.name} (max ${formatFileSize(maxSize)})`);
        return false;
      }
      return true;
    });
    setFiles(prev => [...prev, ...validFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    multiple: true,
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (!user || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setCurrentFile(file.name);
        setUploadProgress(((i) / files.length) * 100);

        const fileType = getFileType(file.type);
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `${user.id}/${fileName}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`Erreur lors de l'upload de ${file.name}`);
          continue;
        }

        // Create document record
        const { data: docData, error: dbError } = await supabase.from('documents').insert({
          user_id: user.id,
          title: file.name.replace(/\.[^/.]+$/, ''),
          file_type: fileType,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          status: 'pending',
        }).select().single();

        if (dbError) {
          console.error('DB error:', dbError);
          toast.error(`Erreur lors de l'enregistrement de ${file.name}`);
          continue;
        }

        // Trigger document processing in background
        if (docData) {
          supabase.functions.invoke('process-document', {
            body: { documentId: docData.id }
          }).then(({ error }) => {
            if (error) {
              console.error('Processing error:', error);
            }
          });
        }

        setUploadProgress(((i + 1) / files.length) * 100);
      }

      toast.success(`${files.length} document(s) importé(s) avec succès`);
      setFiles([]);
      setOpen(false);
      onUploadComplete?.();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erreur lors de l\'upload');
    } finally {
      setUploading(false);
      setCurrentFile('');
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="w-4 h-4 mr-2" />
          Importer un document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Importer des documents</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-primary font-medium">Déposez les fichiers ici...</p>
            ) : (
              <>
                <p className="font-medium">Glissez-déposez vos fichiers ici</p>
                <p className="text-sm text-muted-foreground mt-1">
                  ou cliquez pour sélectionner
                </p>
              </>
            )}
            <p className="text-xs text-muted-foreground mt-4">
              PDF (50 MB) • Images JPG/PNG (10 MB) • Audio MP3/M4A/WAV (100 MB)
            </p>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {files.map((file, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  {getFileIcon(getFileType(file.type))}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removeFile(index)}
                    disabled={uploading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Upload progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">{currentFile}</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={uploading}>
              Annuler
            </Button>
            <Button onClick={uploadFiles} disabled={files.length === 0 || uploading}>
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Upload en cours...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Importer ({files.length})
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
