import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  BookOpen,
  Brain,
  Lightbulb,
  GraduationCap
} from "lucide-react";

const Skills = () => {
  // Mock data
  const avgScore = 75;
  const totalQuizzes = 12;
  const masteredCards = 45;
  const streakDays = 7;

  const performanceData = [
    { subject: "Quiz", score: avgScore, fullMark: 100 },
    { subject: "Flashcards", score: 82, fullMark: 100 },
    { subject: "Documents", score: 60, fullMark: 100 },
    { subject: "Régularité", score: 70, fullMark: 100 },
  ];

  const weeklyData = [
    { day: "Lun", minutes: 45 },
    { day: "Mar", minutes: 60 },
    { day: "Mer", minutes: 30 },
    { day: "Jeu", minutes: 75 },
    { day: "Ven", minutes: 50 },
    { day: "Sam", minutes: 20 },
    { day: "Dim", minutes: 40 },
  ];

  const strengths = [
    { skill: "Mémorisation", level: 85, trend: 'up' as const },
    { skill: "Compréhension", level: 78, trend: 'up' as const },
    { skill: "Analyse", level: 72, trend: 'stable' as const },
    { skill: "Synthèse", level: 65, trend: 'down' as const },
  ];

  const recommendations = [
    {
      icon: Brain,
      title: "Pratiquez la répétition espacée",
      description: "Révisez vos flashcards quotidiennement pour améliorer la rétention à long terme.",
    },
    {
      icon: BookOpen,
      title: "Diversifiez vos sources",
      description: "Importez plus de documents variés pour enrichir votre apprentissage.",
    },
    {
      icon: Target,
      title: "Fixez des objectifs quotidiens",
      description: "Définissez un temps d'étude minimum chaque jour pour maintenir votre régularité.",
    },
  ];

  return (
    <MainLayout>
      <div className="p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Profil de Compétences</h1>
          <p className="text-muted-foreground">Analysez vos performances et identifiez vos axes d'amélioration</p>
        </div>

        {/* Stats cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Award className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Score moyen</p>
                  <p className="text-2xl font-bold">{avgScore}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-secondary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quiz complétés</p>
                  <p className="text-2xl font-bold">{totalQuizzes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cartes maîtrisées</p>
                  <p className="text-2xl font-bold">{masteredCards}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Série actuelle</p>
                  <p className="text-2xl font-bold">{streakDays} jours</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Radar chart */}
          <Card>
            <CardHeader>
              <CardTitle>Vue d'ensemble des compétences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={performanceData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Weekly activity */}
          <Card>
            <CardHeader>
              <CardTitle>Activité de la semaine</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Strengths */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Points forts & axes d'amélioration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {strengths.map((item, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.skill}</span>
                      {item.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                      {item.trend === 'down' && <TrendingDown className="w-4 h-4 text-destructive" />}
                    </div>
                    <Badge variant={item.level >= 80 ? "default" : item.level >= 60 ? "secondary" : "outline"}>
                      {item.level}%
                    </Badge>
                  </div>
                  <Progress value={item.level} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Recommandations personnalisées
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recommendations.map((rec, i) => {
                const Icon = rec.icon;
                return (
                  <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{rec.title}</h4>
                      <p className="text-sm text-muted-foreground">{rec.description}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Skills;
