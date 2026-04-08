"use client";

import { useState, useEffect, useRef } from 'react';
import { usePixelCart } from '@/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { 
  Palette, 
  Globe, 
  Check, 
  Upload, 
  ImageIcon, 
  X, 
  ShieldAlert, 
  Trash2, 
  Type, 
  ShieldCheck, 
  UserPlus,
  Truck,
  Save,
  ExternalLink,
  Loader2,
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
  Facebook,
  Instagram,
  Send,
  Music,
  LayoutGrid,
  LayoutTemplate
} from 'lucide-react';
import Image from 'next/image';
import { collection, getDocs, deleteDoc } from 'firebase/firestore';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const THEME_PRESETS = [
  { name: "Orange Outilya", value: "24 95% 53%" },
  { name: "Outilya Dark", value: "0 0% 15%" },
  { name: "Emerald", value: "160 84% 39%" },
  { name: "Blue Prof.", value: "210 50% 37%" },
  { name: "Rouge Brico", value: "0 72% 51%" },
  { name: "Deep Navy", value: "222 47% 11%" },
  { name: "Slate", value: "215 16% 47%" },
  { name: "Forest", value: "142 76% 22%" },
  { name: "Amber", value: "38 92% 50%" },
  { name: "Royal Blue", value: "225 73% 57%" },
  { name: "Midnight", value: "263 34% 15%" },
  { name: "Teal", value: "174 100% 29%" },
  { name: "Charcoal", value: "210 10% 23%" },
  { name: "Bronze", value: "28 45% 45%" },
  { name: "Crimson", value: "348 83% 47%" },
  { name: "Indigo", value: "239 84% 67%" },
  { name: "Steel", value: "200 18% 46%" },
  { name: "Rust", value: "18 80% 40%" },
  { name: "Graphite", value: "210 5% 31%" },
  { name: "Cyber Blue", value: "199 89% 48%" },
];

const ACCENT_PRESETS = [
  { name: "Purple", value: "270 70% 50%" },
  { name: "Electric", value: "210 100% 50%" },
  { name: "Ruby", value: "0 80% 45%" },
  { name: "Leaf", value: "140 60% 35%" },
  { name: "Vibrant", value: "24 95% 53%" },
  { name: "Cyan", value: "180 100% 45%" },
  { name: "Hot Pink", value: "330 100% 50%" },
  { name: "Gold", value: "45 100% 50%" },
  { name: "Lime", value: "75 100% 50%" },
  { name: "Violet", value: "280 80% 60%" },
];

const BG_PRESETS = [
  { name: "Pure White", value: "0 0% 100%" },
  { name: "Soft Gray", value: "210 20% 98%" },
  { name: "Midnight", value: "210 40% 8%" },
  { name: "Cream", value: "40 30% 96%" },
  { name: "Slate Tint", value: "215 25% 95%" },
  { name: "Mint Tint", value: "150 20% 97%" },
];

const BADGE_PRESETS = [
  { name: "Gold", value: "45 100% 50%" },
  { name: "Fire", value: "0 100% 50%" },
  { name: "Lime", value: "80 90% 50%" },
  { name: "Sunset", value: "24 95% 53%" },
  { name: "Neon", value: "300 100% 50%" },
  { name: "Aqua", value: "190 100% 50%" },
  { name: "Berry", value: "330 80% 50%" },
  { name: "Forest", value: "140 60% 40%" },
  { name: "Royal", value: "220 80% 50%" },
  { name: "Slate", value: "215 20% 50%" },
  { name: "Night", value: "210 20% 15%" },
  { name: "Leaf", value: "100 70% 45%" },
  { name: "Sky", value: "200 90% 60%" },
  { name: "Rose", value: "350 90% 65%" },
  { name: "Coal", value: "0 0% 20%" },
];

const SUPER_ADMIN_UIDS = ['cgeNA9jvuCeC42zZV4EcntT21Jw2', '2EyPzIYJzNUa9H0fMXQ7L0cA7iC3'];

export default function AdminSettingsPage() {
  const { settings, updateSettings, addAdmin, removeAdmin } = usePixelCart();
  const { user: firebaseUser } = useUser();
  const firestore = useFirestore();
  const [formData, setFormData] = useState(settings);
  const [isWiping, setIsWiping] = useState(false);
  const [newAdminId, setNewAdminId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch all current admins
  const adminsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'roles_admin');
  }, [firestore]);
  
  const { data: adminsList } = useCollection(adminsQuery);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(settings);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800 * 1024) {
        toast({
          variant: "destructive",
          title: "Fichier trop volumineux",
          description: "Veuillez choisir une image de moins de 800 Ko.",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logoUrl: reader.result as string }));
        toast({
          title: "Logo chargé",
          description: "Aperçu mis à jour. N'oubliez pas de sauvegarder.",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    updateSettings(formData);
    toast({
      title: "Configuration enregistrée",
      description: "Les modifications ont été enregistrées en base de données.",
    });
  };

  const handleAddAdmin = () => {
    if (!newAdminId.trim()) return;
    addAdmin(newAdminId.trim());
    setNewAdminId('');
    toast({ title: "Accès ajouté", description: "L'utilisateur a été promu administrateur." });
  };

  const handleRemoveAdmin = (id: string) => {
    if (confirm("Retirer les privilèges d'administration ?")) {
      removeAdmin(id);
      toast({ title: "Accès retiré" });
    }
  };

  const handleWipeAdmins = async () => {
    if (!firestore || !firebaseUser) return;
    
    const confirmWipe = confirm("ATTENTION : Cette action supprimera TOUS les administrateurs de la base de données. Vous perdrez l'accès au panneau d'administration immédiatement. Voulez-vous continuer ?");
    
    if (!confirmWipe) return;

    setIsWiping(true);
    try {
      const rolesRef = collection(firestore, 'roles_admin');
      const snapshot = await getDocs(rolesRef);
      
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      toast({
        title: "Base de données nettoyée",
        description: "Tous les rôles administrateurs ont été supprimés.",
      });
      
      window.location.href = '/';
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur de suppression",
        description: error.message || "Impossible de vider la liste des administrateurs.",
      });
    } finally {
      setIsWiping(false);
    }
  };

  const isSuperAdmin = firebaseUser && SUPER_ADMIN_UIDS.includes(firebaseUser.uid);

  const ColorSwatch = ({ value, label, active, onClick, isSpecial }: { value: string, label: string, active: boolean, onClick: () => void, isSpecial?: boolean }) => (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center gap-1.5 rounded-lg border p-2 transition-all hover:bg-accent",
        active ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border",
        isSpecial && "border-dashed border-primary/40 bg-primary/5"
      )}
    >
      <div 
        className="h-8 w-8 rounded-full border shadow-inner" 
        style={{ backgroundColor: `hsl(${value})` }}
      />
      <span className="text-[9px] font-medium truncate w-full text-center">{label}</span>
      {active && (
        <div className="absolute top-1 right-1 h-3 w-3 rounded-full bg-primary flex items-center justify-center">
          <Check className="h-2 w-2 text-white" />
        </div>
      )}
    </button>
  );

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">Configuration du Site</h1>
          <p className="text-muted-foreground">Gérez l'identité visuelle et les paramètres de base de votre boutique.</p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button variant="outline" size="sm" onClick={() => setFormData(settings)}>
              Annuler
            </Button>
          )}
          <Button onClick={handleSave} disabled={!hasChanges} className="gap-2">
            <Save className="h-4 w-4" />
            Enregistrer les modifications
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Branding */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Identité de Marque
            </CardTitle>
            <CardDescription>Mettez à jour le nom et le logo de votre entreprise</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="brandName">Nom de la boutique</Label>
              <Input
                id="brandName"
                value={formData.brandName}
                onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
              />
            </div>
            
            <div className="space-y-4">
              <Label>Logo de la boutique</Label>
              <div className="relative h-24 w-full overflow-hidden rounded-lg border-2 border-dashed bg-muted flex flex-col items-center justify-center p-4">
                {formData.logoUrl ? (
                  <>
                    <Image 
                      src={formData.logoUrl} 
                      alt="Logo Preview" 
                      fill 
                      className="object-contain"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 rounded-full shadow-lg"
                      onClick={() => setFormData({ ...formData, logoUrl: '' })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ImageIcon className="h-8 w-8 opacity-50" />
                    <p className="text-xs">Aucun logo sélectionné</p>
                  </div>
                )}
              </div>
              
              <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleLogoUpload}
              />
              
              <Button
                type="button"
                variant="secondary"
                className="w-full gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                Importer un logo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Global Theme */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Thème Visuel
            </CardTitle>
            <CardDescription>Choisissez la couleur principale du site</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {THEME_PRESETS.map((theme) => (
                <ColorSwatch 
                  key={theme.value}
                  label={theme.name}
                  value={theme.value}
                  active={formData.primaryColor === theme.value}
                  onClick={() => setFormData({ ...formData, primaryColor: theme.value })}
                />
              ))}
            </div>
            <div className="space-y-2 pt-4 border-t">
              <Label>Code Couleur HSL Manuel</Label>
              <Input
                value={formData.primaryColor}
                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                placeholder="Ex: 210 50% 37%"
              />
            </div>
          </CardContent>
        </Card>

        {/* Layout Settings */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-primary" />
              Mise en Page (Grid)
            </CardTitle>
            <CardDescription>Configurez l'affichage des produits et catégories sur le site.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-8 md:grid-cols-2">
            <div className="space-y-6">
              <div className="space-y-4">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Colonnes Produits (Desktop)</Label>
                <Select 
                  value={formData.productColsDesktop?.toString() || "6"} 
                  onValueChange={(val) => setFormData({ ...formData, productColsDesktop: parseInt(val) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir le nombre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 Colonnes</SelectItem>
                    <SelectItem value="4">4 Colonnes</SelectItem>
                    <SelectItem value="5">5 Colonnes</SelectItem>
                    <SelectItem value="6">6 Colonnes</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">Définit combien de produits s'affichent par ligne sur ordinateur.</p>
              </div>

              <div className="space-y-4 pt-4 border-t border-dashed">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Colonnes Catégories (Desktop)</Label>
                <Select 
                  value={formData.categoryColsDesktop?.toString() || "3"} 
                  onValueChange={(val) => setFormData({ ...formData, categoryColsDesktop: parseInt(val) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir le nombre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 Colonnes</SelectItem>
                    <SelectItem value="3">3 Colonnes</SelectItem>
                    <SelectItem value="4">4 Colonnes</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">Définit combien de catégories s'affichent par ligne sur ordinateur.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Catégories sur l'accueil</Label>
                <Select 
                  value={formData.homeCategoriesLimit?.toString() || "3"} 
                  onValueChange={(val) => setFormData({ ...formData, homeCategoriesLimit: parseInt(val) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir la limite" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 Catégories</SelectItem>
                    <SelectItem value="3">3 Catégories</SelectItem>
                    <SelectItem value="4">4 Catégories</SelectItem>
                    <SelectItem value="6">6 Catégories</SelectItem>
                    <SelectItem value="8">8 Catégories</SelectItem>
                    <SelectItem value="12">12 Catégories</SelectItem>
                    <SelectItem value="16">16 Catégories</SelectItem>
                    <SelectItem value="20">20 Catégories</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">Contrôle le nombre de catégories affichées dans la section "Nos Univers Métiers" de la page d'accueil.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Homepage Titles & Subtitles */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutTemplate className="h-5 w-5 text-primary" />
              Textes de l'Accueil
            </CardTitle>
            <CardDescription>Personnalisez les titres et sous-titres des sections de votre page d'accueil.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Categories Section */}
            <div className="space-y-4 p-4 rounded-xl bg-muted/20 border border-dashed">
              <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-2">Section Catégories</h4>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Titre</Label>
                <Input 
                  value={formData.homeCategoriesTitle || ''} 
                  onChange={(e) => setFormData({ ...formData, homeCategoriesTitle: e.target.value })}
                  placeholder="Ex: Nos Univers Métiers"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Sous-titre</Label>
                <Input 
                  value={formData.homeCategoriesSubtitle || ''} 
                  onChange={(e) => setFormData({ ...formData, homeCategoriesSubtitle: e.target.value })}
                  placeholder="Ex: Trouvez l'équipement adapté..."
                />
              </div>
            </div>

            {/* Products Section */}
            <div className="space-y-4 p-4 rounded-xl bg-muted/20 border border-dashed">
              <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-2">Section Produits</h4>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Titre</Label>
                <Input 
                  value={formData.homeProductsTitle || ''} 
                  onChange={(e) => setFormData({ ...formData, homeProductsTitle: e.target.value })}
                  placeholder="Ex: Derniers Arrivages"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Sous-titre</Label>
                <Input 
                  value={formData.homeProductsSubtitle || ''} 
                  onChange={(e) => setFormData({ ...formData, homeProductsSubtitle: e.target.value })}
                  placeholder="Ex: Équipez-vous avec les outils..."
                />
              </div>
            </div>

            {/* Promotions Section */}
            <div className="space-y-4 p-4 rounded-xl bg-muted/20 border border-dashed">
              <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-2">Section Promotions</h4>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Titre</Label>
                <Input 
                  value={formData.homePromotionsTitle || ''} 
                  onChange={(e) => setFormData({ ...formData, homePromotionsTitle: e.target.value })}
                  placeholder="Ex: Ventes Flash & Offres"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Badge (Sub)</Label>
                <Input 
                  value={formData.homePromotionsSubtitle || ''} 
                  onChange={(e) => setFormData({ ...formData, homePromotionsSubtitle: e.target.value })}
                  placeholder="Ex: Sélection du Moment"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              Coordonnées & Support
            </CardTitle>
            <CardDescription>Configurez les informations affichées sur la page contact et le footer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-blue-500" /> Téléphone</Label>
                <Input value={formData.contactPhone || ''} onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })} placeholder="+213 ..." />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-emerald-500" /> Email Support</Label>
                <Input value={formData.contactEmail || ''} onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })} placeholder="contact@shop.dz" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-orange-500" /> Adresse / Localisation</Label>
                <Input value={formData.contactAddress || ''} onChange={(e) => setFormData({ ...formData, contactAddress: e.target.value })} placeholder="Alger, Algérie" />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3 border-t pt-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-muted-foreground" /> Samedi - Mercredi</Label>
                <Input value={formData.workingHoursWeek || ''} onChange={(e) => setFormData({ ...formData, workingHoursWeek: e.target.value })} placeholder="08:00 - 18:00" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-muted-foreground" /> Jeudi</Label>
                <Input value={formData.workingHoursThu || ''} onChange={(e) => setFormData({ ...formData, workingHoursThu: e.target.value })} placeholder="08:00 - 13:00" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-destructive" /> Vendredi</Label>
                <Input value={formData.workingHoursFri || ''} onChange={(e) => setFormData({ ...formData, workingHoursFri: e.target.value })} placeholder="Fermé" />
              </div>
            </div>

            <div className="space-y-6 border-t pt-6">
              <Label className="text-lg font-bold flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Réseaux Sociaux & Messagerie
              </Label>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><MessageCircle className="h-3.5 w-3.5 text-emerald-500" /> WhatsApp URL</Label>
                  <Input value={formData.whatsappUrl || ''} onChange={(e) => setFormData({ ...formData, whatsappUrl: e.target.value })} placeholder="https://wa.me/..." />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Send className="h-3.5 w-3.5 text-sky-500" /> Telegram URL</Label>
                  <Input value={formData.telegramUrl || ''} onChange={(e) => setFormData({ ...formData, telegramUrl: e.target.value })} placeholder="https://t.me/..." />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Facebook className="h-3.5 w-3.5 text-blue-600" /> Facebook Page</Label>
                  <Input value={formData.facebookUrl || ''} onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })} placeholder="https://facebook.com/..." />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Instagram className="h-3.5 w-3.5 text-pink-500" /> Instagram Profile</Label>
                  <Input value={formData.instagramUrl || ''} onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })} placeholder="https://instagram.com/..." />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Music className="h-3.5 w-3.5 text-foreground" /> TikTok Profile</Label>
                  <Input value={formData.tiktokUrl || ''} onChange={(e) => setFormData({ ...formData, tiktokUrl: e.target.value })} placeholder="https://tiktok.com/@..." />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Management - Super Admin Only */}
        {isSuperAdmin && (
          <Card className="border-primary/20 bg-primary/5 md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Gestion des Administrateurs
              </CardTitle>
              <CardDescription>Ajoutez ou retirez des privilèges d'accès au panneau d'administration.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label>User ID (UID Firebase)</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Collez l'UID ici..." 
                      value={newAdminId}
                      onChange={(e) => setNewAdminId(e.target.value)}
                    />
                    <Button onClick={handleAddAdmin} className="gap-2">
                      <UserPlus className="h-4 w-4" />
                      Ajouter
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Liste des Administrateurs actifs</Label>
                <div className="grid gap-2">
                  {SUPER_ADMIN_UIDS.map(uid => (
                    <div key={uid} className="flex items-center justify-between p-3 rounded-xl bg-card border">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">Super Admin {uid === firebaseUser?.uid ? '(Vous)' : ''}</span>
                        <code className="text-[10px] text-muted-foreground">{uid}</code>
                      </div>
                      <Badge className="bg-primary/20 text-primary border-none">Propriétaire</Badge>
                    </div>
                  ))}
                  {adminsList?.filter(a => !SUPER_ADMIN_UIDS.includes(a.id)).map((admin) => (
                    <div key={admin.id} className="flex items-center justify-between p-3 rounded-xl bg-card border animate-in slide-in-from-left-2">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">Administrateur</span>
                        <code className="text-[10px] text-muted-foreground">{admin.id}</code>
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveAdmin(admin.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Checkout Colors */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Styles Visuels du Checkout
            </CardTitle>
            <CardDescription>Personnalisez les couleurs du formulaire avec des choix rapides</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-8 md:grid-cols-3">
            <div className="space-y-4">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Couleur d'Accentuation</Label>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                <ColorSwatch 
                  label="Thème"
                  value={formData.primaryColor}
                  active={formData.checkoutColor === formData.primaryColor}
                  onClick={() => setFormData({ ...formData, checkoutColor: formData.primaryColor })}
                  isSpecial
                />
                {ACCENT_PRESETS.map((p) => (
                  <ColorSwatch 
                    key={p.value}
                    label={p.name}
                    value={p.value}
                    active={formData.checkoutColor === p.value}
                    onClick={() => setFormData({ ...formData, checkoutColor: p.value })}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fond du Formulaire</Label>
              <div className="grid grid-cols-3 gap-2">
                {BG_PRESETS.map((p) => (
                  <ColorSwatch 
                    key={p.value}
                    label={p.name}
                    value={p.value}
                    active={formData.checkoutBgColor === p.value}
                    onClick={() => setFormData({ ...formData, checkoutBgColor: p.value })}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Badge Prix</Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                <ColorSwatch 
                  label="Thème"
                  value={formData.primaryColor}
                  active={formData.priceBadgeColor === formData.primaryColor}
                  onClick={() => setFormData({ ...formData, priceBadgeColor: formData.primaryColor })}
                  isSpecial
                />
                {BADGE_PRESETS.map((p) => (
                  <ColorSwatch 
                    key={p.value}
                    label={p.name}
                    value={p.value}
                    active={formData.priceBadgeColor === p.value}
                    onClick={() => setFormData({ ...formData, priceBadgeColor: p.value })}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Checkout Content */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5 text-primary" />
              Textes du Formulaire (Arabe)
            </CardTitle>
            <CardDescription>Modifiez tous les titres, boutons et étiquettes du formulaire</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Titre du Formulaire</Label>
                <Input dir="rtl" value={formData.checkoutTitleAr} onChange={(e) => setFormData({ ...formData, checkoutTitleAr: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Texte du Bouton d'Achat</Label>
                <Input dir="rtl" value={formData.checkoutButtonTextAr} onChange={(e) => setFormData({ ...formData, checkoutButtonTextAr: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Message de Succès</Label>
                <Input dir="rtl" value={formData.checkoutSuccessMsgAr} onChange={(e) => setFormData({ ...formData, checkoutSuccessMsgAr: e.target.value })} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Super Admin Critical Actions */}
      {isSuperAdmin && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              Zone de Danger
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-background">
              <div>
                <p className="font-bold text-sm">Réinitialiser tous les administrateurs</p>
                <p className="text-xs text-muted-foreground italic">Supprime tout sauf les comptes Super Admin.</p>
              </div>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleWipeAdmins}
                disabled={isWiping}
                className="gap-2"
              >
                {isWiping ? "En cours..." : <Trash2 className="h-4 w-4" />}
                Tout Supprimer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="fixed bottom-8 right-8 z-50">
        <Button 
          size="lg" 
          onClick={handleSave} 
          className="px-12 h-14 text-lg font-bold shadow-2xl scale-110" 
          disabled={!hasChanges}
        >
          {hasChanges ? "Enregistrer tout" : "Aucun changement"}
        </Button>
      </div>
    </div>
  );
}
