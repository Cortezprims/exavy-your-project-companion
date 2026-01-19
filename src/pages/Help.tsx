import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { 
  HelpCircle, 
  Send, 
  MessageSquare,
  FileText,
  Brain,
  BookOpen,
  Sparkles,
  CreditCard,
  Download,
  Shield,
  Zap
} from 'lucide-react';

const faqItems = [
  {
    category: 'Général',
    icon: HelpCircle,
    questions: [
      {
        question: "Qu'est-ce qu'EXAVY ?",
        answer: "EXAVY est une plateforme d'apprentissage intelligente qui utilise l'IA pour vous aider à étudier plus efficacement. Elle transforme vos documents en quiz, flashcards, résumés, cartes mentales et bien plus encore."
      },
      {
        question: "Comment commencer à utiliser EXAVY ?",
        answer: "1. Créez un compte gratuit\n2. Téléchargez vos documents (PDF, Word, images, audio)\n3. Laissez l'IA analyser votre contenu\n4. Générez des quiz, flashcards, résumés ou cartes mentales\n5. Commencez à réviser !"
      },
      {
        question: "Quels formats de fichiers sont acceptés ?",
        answer: "EXAVY accepte : PDF, Word (.doc, .docx), PowerPoint (.ppt, .pptx), images (JPG, PNG), fichiers texte (.txt), et fichiers audio (MP3, WAV) pour la transcription automatique."
      }
    ]
  },
  {
    category: 'Documents',
    icon: FileText,
    questions: [
      {
        question: "Comment télécharger un document ?",
        answer: "Allez dans la section 'Documents', cliquez sur 'Ajouter un document', puis glissez-déposez votre fichier ou cliquez pour le sélectionner. Le document sera automatiquement analysé par l'IA."
      },
      {
        question: "Quelle est la taille maximale d'un document ?",
        answer: "La taille maximale est de 10 MB pour les documents texte et 25 MB pour les fichiers audio. Pour les utilisateurs Premium, ces limites sont doublées."
      },
      {
        question: "Comment supprimer un document ?",
        answer: "Dans la liste des documents, cliquez sur le menu (trois points) à côté du document, puis sélectionnez 'Supprimer'. Attention : cela supprimera également tous les contenus générés à partir de ce document."
      }
    ]
  },
  {
    category: 'Quiz & Flashcards',
    icon: Brain,
    questions: [
      {
        question: "Comment générer un quiz ?",
        answer: "1. Sélectionnez un document traité\n2. Cliquez sur 'Générer un quiz'\n3. Choisissez le niveau de difficulté et le nombre de questions\n4. L'IA créera automatiquement des questions basées sur le contenu"
      },
      {
        question: "Comment fonctionnent les flashcards ?",
        answer: "Les flashcards utilisent l'algorithme de répétition espacée. Plus vous répondez correctement, plus l'intervalle avant la prochaine révision augmente. Cela optimise votre mémorisation à long terme."
      },
      {
        question: "Puis-je modifier les questions générées ?",
        answer: "Oui ! Vous pouvez éditer, supprimer ou ajouter des questions à tout moment. Cliquez sur le quiz ou la flashcard concerné(e) pour accéder aux options d'édition."
      }
    ]
  },
  {
    category: 'Résumés & Mind Maps',
    icon: Sparkles,
    questions: [
      {
        question: "Comment obtenir un résumé de mon document ?",
        answer: "Après avoir téléchargé et traité un document, allez dans 'Résumés' et sélectionnez le document. Vous obtiendrez un résumé court, un résumé détaillé et les concepts clés."
      },
      {
        question: "Que sont les cartes mentales (Mind Maps) ?",
        answer: "Les cartes mentales visualisent les concepts de votre document sous forme de diagramme interactif. Elles montrent les relations entre les idées principales et secondaires."
      },
      {
        question: "Puis-je exporter mes résumés ?",
        answer: "Oui, vous pouvez copier le texte ou utiliser la fonction d'export pour télécharger vos résumés en format texte."
      }
    ]
  },
  {
    category: 'EXABOT (Coach IA)',
    icon: MessageSquare,
    questions: [
      {
        question: "Qui est EXABOT ?",
        answer: "EXABOT est votre coach IA personnel. Il vous aide à réviser, répond à vos questions sur vos documents, vous motive et adapte ses conseils à votre style d'apprentissage."
      },
      {
        question: "Comment discuter avec EXABOT ?",
        answer: "Allez dans 'Chat IA' pour démarrer une conversation. Vous pouvez poser des questions sur vos cours, demander des explications ou obtenir des conseils de révision."
      },
      {
        question: "EXABOT peut-il accéder à mes documents ?",
        answer: "Oui, EXABOT a accès au contenu de vos documents pour vous fournir des réponses contextuelles et personnalisées."
      }
    ]
  },
  {
    category: 'Abonnement Premium',
    icon: CreditCard,
    questions: [
      {
        question: "Quels sont les avantages du Premium ?",
        answer: "Le Premium offre :\n- Documents illimités\n- Quiz et flashcards illimités\n- Génération d'examens blancs\n- Mode hors ligne complet\n- Transcription audio\n- Planning personnalisé\n- Support prioritaire"
      },
      {
        question: "Comment passer à Premium ?",
        answer: "Allez dans 'Abonnement' depuis le menu, choisissez votre forfait (mensuel ou annuel), et effectuez le paiement via Mobile Money."
      },
      {
        question: "Puis-je annuler mon abonnement ?",
        answer: "Oui, vous pouvez annuler à tout moment. Votre accès Premium restera actif jusqu'à la fin de la période payée."
      }
    ]
  },
  {
    category: 'Mode Hors Ligne',
    icon: Download,
    questions: [
      {
        question: "Comment fonctionne le mode hors ligne ?",
        answer: "Les utilisateurs Premium peuvent télécharger leurs contenus pour y accéder sans connexion Internet. Les modifications sont synchronisées automatiquement au retour en ligne."
      },
      {
        question: "Quels contenus sont disponibles hors ligne ?",
        answer: "Vous pouvez télécharger : documents, quiz, flashcards, résumés et cartes mentales. Allez dans Paramètres > Mode Hors Ligne pour gérer vos téléchargements."
      }
    ]
  },
  {
    category: 'Sécurité & Confidentialité',
    icon: Shield,
    questions: [
      {
        question: "Mes documents sont-ils sécurisés ?",
        answer: "Oui, tous vos documents sont chiffrés et stockés de manière sécurisée. Seul vous avez accès à vos contenus. Nous ne partageons jamais vos données avec des tiers."
      },
      {
        question: "Comment supprimer mon compte ?",
        answer: "Contactez notre support via le formulaire ci-dessous. Toutes vos données seront définitivement supprimées dans les 30 jours suivant la demande."
      }
    ]
  }
];

const Help = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !subject || !message) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('send-support-ticket', {
        body: { email, phone, subject, message },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (response.error) throw new Error(response.error.message);

      toast.success('Votre ticket a été envoyé ! Nous vous répondrons rapidement.');
      setSubject('');
      setMessage('');
      setPhone('');
    } catch (error: any) {
      console.error('Error submitting ticket:', error);
      toast.error('Erreur lors de l\'envoi: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <HelpCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Centre d'aide</h1>
          <p className="text-muted-foreground mt-2">
            Trouvez des réponses à vos questions ou contactez notre support
          </p>
        </div>

        {/* FAQ Section */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Questions fréquentes
          </h2>

          {faqItems.map((category, idx) => (
            <Card key={idx}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <category.icon className="w-5 h-5 text-primary" />
                  {category.category}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {category.questions.map((item, qIdx) => (
                    <AccordionItem key={qIdx} value={`item-${idx}-${qIdx}`}>
                      <AccordionTrigger className="text-left">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground whitespace-pre-line">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Form */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              Contacter le support
            </CardTitle>
            <CardDescription>
              Vous n'avez pas trouvé la réponse ? Envoyez-nous un message !
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitTicket} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone (optionnel)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+237 6XX XXX XXX"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Sujet *</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Résumez votre demande en quelques mots"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Décrivez votre problème ou question en détail..."
                  rows={5}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={sending}>
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Envoyer le ticket
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Help;