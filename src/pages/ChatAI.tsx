import { useState, useRef, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Copy, 
  Check,
  Settings,
  Brain,
  Clock,
  Flame,
  Coffee
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ExabotProfile {
  personality_type: string;
  learning_style: string;
  burnout_score: number;
  streak_days: number;
  total_study_minutes: number;
}

const PERSONALITY_OPTIONS = [
  { value: 'encouraging', label: '🌟 Encourageant', description: 'Bienveillant et motivant' },
  { value: 'strict', label: '📏 Exigeant', description: 'Pousse à se dépasser' },
  { value: 'friendly', label: '😊 Amical', description: 'Décontracté et fun' },
  { value: 'analytical', label: '📊 Analytique', description: 'Basé sur les données' },
];

const LEARNING_STYLES = [
  { value: 'visual', label: '👁️ Visuel' },
  { value: 'auditory', label: '👂 Auditif' },
  { value: 'kinesthetic', label: '✋ Kinesthésique' },
  { value: 'reading', label: '📖 Lecture/Écriture' },
];

const ChatAI = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Salut ! 👋 Je suis EXABOT, ton coach d'apprentissage personnel. Je suis là pour t'aider à réviser, te motiver, et t'accompagner vers la réussite ! Comment puis-je t'aider aujourd'hui ?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ExabotProfile | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('exabot_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (data) {
      setProfile(data as ExabotProfile);
    }
  };

  const updateProfile = async (field: string, value: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('exabot_profiles')
      .upsert({
        user_id: user.id,
        [field]: value,
        updated_at: new Date().toISOString(),
      });

    if (!error) {
      setProfile(prev => prev ? { ...prev, [field]: value } : null);
      toast.success('Préférences mises à jour');
    }
  };

  const handleCopy = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(messageId);
      toast.success("Réponse copiée !");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Erreur lors de la copie");
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const chatMessages = messages
        .filter(m => m.id !== '1')
        .map(m => ({ role: m.role, content: m.content }));
      chatMessages.push({ role: 'user', content: input });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/exabot-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: chatMessages,
            userId: user.id,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur de connexion');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // Stream the response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      const assistantMessageId = (Date.now() + 1).toString();

      // Add empty assistant message
      setMessages(prev => [...prev, {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      }]);

      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        // Process line by line
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => 
                prev.map(m => 
                  m.id === assistantMessageId 
                    ? { ...m, content: assistantContent }
                    : m
                )
              );
            }
          } catch {
            // Incomplete JSON, put back and wait
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      toast.error(errorMessage);
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Désolé, j'ai rencontré une erreur. Réessaie dans un instant ! 🙏",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getBurnoutStatus = () => {
    if (!profile) return null;
    const score = profile.burnout_score;
    if (score >= 70) return { color: 'destructive', label: 'Repos nécessaire', icon: Coffee };
    if (score >= 40) return { color: 'warning', label: 'Attention fatigue', icon: Clock };
    return { color: 'default', label: 'En forme', icon: Flame };
  };

  const burnoutStatus = getBurnoutStatus();

  return (
    <MainLayout>
      <div className="h-[calc(100vh-2rem)] p-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                EXABOT
                <Badge variant="secondary" className="text-xs">Coach IA</Badge>
              </h1>
              <p className="text-sm text-muted-foreground">Ton coach d'apprentissage personnel</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {profile && burnoutStatus && (
              <Badge variant={burnoutStatus.color as any} className="gap-1">
                <burnoutStatus.icon className="w-3 h-3" />
                {burnoutStatus.label}
              </Badge>
            )}
            
            {profile?.streak_days ? (
              <Badge variant="outline" className="gap-1">
                <Flame className="w-3 h-3 text-orange-500" />
                {profile.streak_days}j
              </Badge>
            ) : null}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Personnalité d'EXABOT</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {PERSONALITY_OPTIONS.map(opt => (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => updateProfile('personality_type', opt.value)}
                    className={profile?.personality_type === opt.value ? 'bg-accent' : ''}
                  >
                    <div>
                      <div className="font-medium">{opt.label}</div>
                      <div className="text-xs text-muted-foreground">{opt.description}</div>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Style d'apprentissage</DropdownMenuLabel>
                {LEARNING_STYLES.map(style => (
                  <DropdownMenuItem
                    key={style.value}
                    onClick={() => updateProfile('learning_style', style.value)}
                    className={profile?.learning_style === style.value ? 'bg-accent' : ''}
                  >
                    {style.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="py-3 border-b">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              {profile?.personality_type === 'friendly' ? '💬 Discussion avec EXABOT' : 'Assistant EXABOT'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 flex flex-col">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs opacity-70">
                          {message.timestamp.toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        {message.role === 'assistant' && message.content && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                            onClick={() => handleCopy(message.content, message.id)}
                          >
                            {copiedId === message.id ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-secondary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Pose ta question à EXABOT..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading || !user}
                  className="flex-1"
                />
                <Button onClick={handleSend} disabled={!input.trim() || isLoading || !user}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              {!user && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Connectez-vous pour discuter avec EXABOT
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default ChatAI;
