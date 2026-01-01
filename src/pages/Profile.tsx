import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { User, Bell, Globe, Palette, Save } from "lucide-react";

const Profile = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    education_level: '',
    language: 'fr',
    theme: 'light',
    notifications_enabled: true,
  });

  const handleSave = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    toast.success("Profil mis à jour");
    setIsLoading(false);
  };

  return (
    <MainLayout>
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Profil</h1>
          <p className="text-muted-foreground">Gérez vos informations personnelles et préférences</p>
        </div>

        <div className="space-y-6">
          {/* Personal Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Informations personnelles</CardTitle>
                  <CardDescription>Modifiez vos informations de base</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value="utilisateur@example.com" disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_name">Nom d'affichage</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="Votre nom"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="education_level">Niveau d'éducation</Label>
                <Select
                  value={formData.education_level}
                  onValueChange={(value) => setFormData({ ...formData, education_level: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez votre niveau" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primaire">Primaire</SelectItem>
                    <SelectItem value="college">Collège</SelectItem>
                    <SelectItem value="lycee">Lycée</SelectItem>
                    <SelectItem value="universite">Université</SelectItem>
                    <SelectItem value="professionnel">Professionnel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <Palette className="w-5 h-5 text-secondary-foreground" />
                </div>
                <div>
                  <CardTitle>Préférences</CardTitle>
                  <CardDescription>Personnalisez votre expérience</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Langue</p>
                    <p className="text-sm text-muted-foreground">Langue de l'interface</p>
                  </div>
                </div>
                <Select
                  value={formData.language}
                  onValueChange={(value) => setFormData({ ...formData, language: value })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Palette className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Thème</p>
                    <p className="text-sm text-muted-foreground">Apparence de l'application</p>
                  </div>
                </div>
                <Select
                  value={formData.theme}
                  onValueChange={(value) => setFormData({ ...formData, theme: value })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Clair</SelectItem>
                    <SelectItem value="dark">Sombre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Notifications</p>
                    <p className="text-sm text-muted-foreground">Recevoir des rappels</p>
                  </div>
                </div>
                <Switch
                  checked={formData.notifications_enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, notifications_enabled: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Subscription Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <span className="text-lg">👑</span>
                </div>
                <div>
                  <CardTitle>Abonnement</CardTitle>
                  <CardDescription>Gratuit</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => window.location.href = '/subscription'}>
                Gérer mon abonnement
              </Button>
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={isLoading} className="w-full md:w-auto">
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default Profile;
