import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  User,
  Bell,
  Palette,
  Globe,
  Shield,
  LogOut,
  Save,
  Loader2,
  Moon,
  Sun
} from "lucide-react";

const Settings = () => {
  const [displayName, setDisplayName] = useState("");
  const [theme, setTheme] = useState("light");
  const [language, setLanguage] = useState("fr");
  const [notifications, setNotifications] = useState(true);
  const [dailyGoal, setDailyGoal] = useState(30);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    toast.success("Paramètres sauvegardés");
    setIsSaving(false);
  };

  const handleSignOut = async () => {
    toast.success("Déconnexion réussie");
    window.location.href = '/';
  };

  return (
    <MainLayout>
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Paramètres</h1>
          <p className="text-muted-foreground">Gérez vos préférences et votre compte</p>
        </div>

        {/* Profile */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profil
            </CardTitle>
            <CardDescription>Vos informations personnelles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nom d'affichage</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Votre nom"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value="utilisateur@example.com" disabled />
              <p className="text-xs text-muted-foreground">L'email ne peut pas être modifié</p>
            </div>
            <div className="space-y-2">
              <Label>Type de compte</Label>
              <Select defaultValue="student">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Étudiant</SelectItem>
                  <SelectItem value="professional">Professionnel</SelectItem>
                  <SelectItem value="teacher">Enseignant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Apparence
            </CardTitle>
            <CardDescription>Personnalisez l'interface</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Thème</Label>
                <p className="text-sm text-muted-foreground">Choisissez entre clair et sombre</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('light')}
                >
                  <Sun className="w-4 h-4 mr-1" />
                  Clair
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('dark')}
                >
                  <Moon className="w-4 h-4 mr-1" />
                  Sombre
                </Button>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Langue
                </Label>
                <p className="text-sm text-muted-foreground">Langue de l'interface</p>
              </div>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
            <CardDescription>Gérez vos préférences de notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Activer les notifications</Label>
                <p className="text-sm text-muted-foreground">Rappels de révision et alertes</p>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Objectif quotidien (minutes)</Label>
              <Input
                type="number"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(parseInt(e.target.value) || 30)}
                min={5}
                max={480}
              />
              <p className="text-xs text-muted-foreground">
                Temps d'étude minimum par jour pour maintenir votre série
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Account */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Compte
            </CardTitle>
            <CardDescription>Sécurité et gestion du compte</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Statut de l'abonnement</p>
                <p className="text-sm text-muted-foreground capitalize">Gratuit</p>
              </div>
              <Button variant="outline" asChild>
                <a href="/subscription">Gérer</a>
              </Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-destructive">Déconnexion</p>
                <p className="text-sm text-muted-foreground">Se déconnecter de l'application</p>
              </div>
              <Button variant="destructive" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Sauvegarder les modifications
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;
