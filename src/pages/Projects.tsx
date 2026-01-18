import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  FolderKanban, 
  Plus, 
  CheckSquare, 
  FileText,
  MoreVertical,
  Trash2,
  Edit,
  Pin,
  PinOff,
  Calendar,
  Tag,
  Archive,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Project {
  id: string;
  title: string;
  description: string | null;
  color: string;
  icon: string;
  is_archived: boolean;
  created_at: string;
}

interface Task {
  id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  completed_at: string | null;
  tags: string[];
  position: number;
}

interface Note {
  id: string;
  project_id: string | null;
  title: string;
  content: string | null;
  is_pinned: boolean;
  color: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');

  // Form states
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [newNoteOpen, setNewNoteOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const [projectForm, setProjectForm] = useState({ title: '', description: '', color: '#6366f1' });
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', due_date: '' });
  const [noteForm, setNoteForm] = useState({ title: '', content: '', color: '#ffffff' });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projectsRes, tasksRes, notesRes] = await Promise.all([
        supabase.from('projects').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }),
        supabase.from('tasks').select('*').eq('user_id', user?.id).order('position'),
        supabase.from('notes').select('*').eq('user_id', user?.id).order('is_pinned', { ascending: false }).order('updated_at', { ascending: false }),
      ]);

      if (projectsRes.error) throw projectsRes.error;
      if (tasksRes.error) throw tasksRes.error;
      if (notesRes.error) throw notesRes.error;

      setProjects(projectsRes.data || []);
      setTasks(tasksRes.data || []);
      setNotes(notesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  // Project functions
  const createProject = async () => {
    if (!projectForm.title.trim()) return;
    
    try {
      const { error } = await supabase.from('projects').insert({
        user_id: user?.id,
        title: projectForm.title,
        description: projectForm.description || null,
        color: projectForm.color,
      });

      if (error) throw error;
      
      toast.success('Projet créé !');
      setProjectForm({ title: '', description: '', color: '#6366f1' });
      setNewProjectOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Erreur lors de la création');
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
      toast.success('Projet supprimé');
      fetchData();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  // Task functions
  const createTask = async () => {
    if (!taskForm.title.trim()) return;
    
    try {
      const { error } = await supabase.from('tasks').insert({
        user_id: user?.id,
        project_id: selectedProject,
        title: taskForm.title,
        description: taskForm.description || null,
        priority: taskForm.priority,
        due_date: taskForm.due_date || null,
        position: tasks.length,
      });

      if (error) throw error;
      
      toast.success('Tâche créée !');
      setTaskForm({ title: '', description: '', priority: 'medium', due_date: '' });
      setNewTaskOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Erreur lors de la création');
    }
  };

  const toggleTask = async (task: Task) => {
    try {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', task.id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      toast.success('Tâche supprimée');
      fetchData();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  // Note functions
  const saveNote = async () => {
    if (!noteForm.title.trim()) return;
    
    try {
      if (editingNote) {
        const { error } = await supabase
          .from('notes')
          .update({
            title: noteForm.title,
            content: noteForm.content || null,
            color: noteForm.color,
          })
          .eq('id', editingNote.id);

        if (error) throw error;
        toast.success('Note mise à jour !');
      } else {
        const { error } = await supabase.from('notes').insert({
          user_id: user?.id,
          project_id: selectedProject,
          title: noteForm.title,
          content: noteForm.content || null,
          color: noteForm.color,
        });

        if (error) throw error;
        toast.success('Note créée !');
      }
      
      setNoteForm({ title: '', content: '', color: '#ffffff' });
      setNewNoteOpen(false);
      setEditingNote(null);
      fetchData();
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const toggleNotePin = async (note: Note) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ is_pinned: !note.is_pinned })
        .eq('id', note.id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const deleteNote = async (id: string) => {
    try {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;
      toast.success('Note supprimée');
      fetchData();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const filteredTasks = selectedProject 
    ? tasks.filter(t => t.project_id === selectedProject)
    : tasks;

  const filteredNotes = selectedProject
    ? notes.filter(n => n.project_id === selectedProject)
    : notes;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Haute';
      case 'medium': return 'Moyenne';
      case 'low': return 'Basse';
      default: return priority;
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FolderKanban className="h-8 w-8 text-primary" />
              Gestionnaire de Projets
            </h1>
            <p className="text-muted-foreground mt-1">
              Organisez vos tâches et notes
            </p>
          </div>
          <Dialog open={newProjectOpen} onOpenChange={setNewProjectOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau projet
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un projet</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input
                  placeholder="Nom du projet"
                  value={projectForm.title}
                  onChange={(e) => setProjectForm(prev => ({ ...prev, title: e.target.value }))}
                />
                <Textarea
                  placeholder="Description (optionnel)"
                  value={projectForm.description}
                  onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                />
                <div className="flex items-center gap-2">
                  <span className="text-sm">Couleur :</span>
                  <input
                    type="color"
                    value={projectForm.color}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, color: e.target.value }))}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                </div>
                <Button onClick={createProject} className="w-full">
                  Créer
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Projects sidebar */}
          <Card className="lg:col-span-1">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Projets</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <ScrollArea className="h-[400px]">
                <div className="space-y-1">
                  <Button
                    variant={selectedProject === null ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setSelectedProject(null)}
                  >
                    <FolderKanban className="h-4 w-4 mr-2" />
                    Tous
                  </Button>
                  {projects.map((project) => (
                    <div key={project.id} className="flex items-center gap-1">
                      <Button
                        variant={selectedProject === project.id ? 'secondary' : 'ghost'}
                        className="flex-1 justify-start"
                        onClick={() => setSelectedProject(project.id)}
                      >
                        <div 
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: project.color }}
                        />
                        <span className="truncate">{project.title}</span>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => deleteProject(project.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Main content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="tasks" className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Tâches ({filteredTasks.length})
                </TabsTrigger>
                <TabsTrigger value="notes" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notes ({filteredNotes.length})
                </TabsTrigger>
              </TabsList>

              {/* Tasks Tab */}
              <TabsContent value="tasks" className="space-y-4">
                <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full border-dashed">
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter une tâche
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nouvelle tâche</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <Input
                        placeholder="Titre de la tâche"
                        value={taskForm.title}
                        onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                      />
                      <Textarea
                        placeholder="Description (optionnel)"
                        value={taskForm.description}
                        onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-muted-foreground">Priorité</label>
                          <select
                            className="w-full mt-1 p-2 border rounded-lg"
                            value={taskForm.priority}
                            onChange={(e) => setTaskForm(prev => ({ ...prev, priority: e.target.value }))}
                          >
                            <option value="low">Basse</option>
                            <option value="medium">Moyenne</option>
                            <option value="high">Haute</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Échéance</label>
                          <Input
                            type="date"
                            value={taskForm.due_date}
                            onChange={(e) => setTaskForm(prev => ({ ...prev, due_date: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <Button onClick={createTask} className="w-full">
                        Créer
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <div className="space-y-2">
                  {filteredTasks.length === 0 ? (
                    <Card className="text-center py-8">
                      <CardContent>
                        <CheckSquare className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">Aucune tâche</p>
                      </CardContent>
                    </Card>
                  ) : (
                    filteredTasks.map((task) => (
                      <Card key={task.id} className={task.status === 'completed' ? 'opacity-60' : ''}>
                        <CardContent className="py-3 flex items-center gap-3">
                          <Checkbox
                            checked={task.status === 'completed'}
                            onCheckedChange={() => toggleTask(task)}
                          />
                          <div className="flex-1">
                            <p className={`font-medium ${task.status === 'completed' ? 'line-through' : ''}`}>
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={`${getPriorityColor(task.priority)} text-white text-xs`}>
                                {getPriorityLabel(task.priority)}
                              </Badge>
                              {task.due_date && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(task.due_date), 'dd MMM', { locale: fr })}
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteTask(task.id)}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* Notes Tab */}
              <TabsContent value="notes" className="space-y-4">
                <Dialog open={newNoteOpen} onOpenChange={(open) => {
                  setNewNoteOpen(open);
                  if (!open) {
                    setEditingNote(null);
                    setNoteForm({ title: '', content: '', color: '#ffffff' });
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full border-dashed">
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter une note
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{editingNote ? 'Modifier la note' : 'Nouvelle note'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <Input
                        placeholder="Titre"
                        value={noteForm.title}
                        onChange={(e) => setNoteForm(prev => ({ ...prev, title: e.target.value }))}
                      />
                      <Textarea
                        placeholder="Contenu de la note..."
                        className="min-h-[200px]"
                        value={noteForm.content}
                        onChange={(e) => setNoteForm(prev => ({ ...prev, content: e.target.value }))}
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Couleur :</span>
                        <input
                          type="color"
                          value={noteForm.color}
                          onChange={(e) => setNoteForm(prev => ({ ...prev, color: e.target.value }))}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                      </div>
                      <Button onClick={saveNote} className="w-full">
                        {editingNote ? 'Mettre à jour' : 'Créer'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {filteredNotes.length === 0 ? (
                  <Card className="text-center py-8">
                    <CardContent>
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Aucune note</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredNotes.map((note) => (
                      <Card 
                        key={note.id} 
                        className="relative overflow-hidden"
                        style={{ borderLeftColor: note.color, borderLeftWidth: '4px' }}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-base line-clamp-1 flex items-center gap-2">
                              {note.is_pinned && <Pin className="h-4 w-4 text-primary" />}
                              {note.title}
                            </CardTitle>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => {
                                  setEditingNote(note);
                                  setNoteForm({
                                    title: note.title,
                                    content: note.content || '',
                                    color: note.color,
                                  });
                                  setNewNoteOpen(true);
                                }}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toggleNotePin(note)}>
                                  {note.is_pinned ? (
                                    <>
                                      <PinOff className="h-4 w-4 mr-2" />
                                      Désépingler
                                    </>
                                  ) : (
                                    <>
                                      <Pin className="h-4 w-4 mr-2" />
                                      Épingler
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => deleteNote(note.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">
                            {note.content || 'Pas de contenu'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(note.updated_at), 'dd MMM yyyy', { locale: fr })}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
