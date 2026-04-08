
"use client";

import { useState, useRef, useEffect } from 'react';
import { usePixelCart } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { 
  Megaphone, 
  ImageIcon, 
  Plus, 
  Trash2, 
  Save, 
  Tag, 
  Sparkles, 
  LayoutGrid,
  Type,
  Search,
  CheckCircle2,
  X,
  ZoomIn,
  Link as LinkIcon,
  Check,
  Move,
  Palette,
  Edit,
  RefreshCw,
  MousePointer2,
  Maximize2,
  Type as TypeIcon,
  ShoppingBag as ShopIcon
} from 'lucide-react';
import Image from 'next/image';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const BANNER_COLOR_PRESETS = [
  { name: "Orange", value: "24 95% 53%" },
  { name: "Fire", value: "0 100% 50%" },
  { name: "Gold", value: "45 100% 50%" },
  { name: "Lime", value: "80 90% 50%" },
  { name: "Forest", value: "140 60% 40%" },
  { name: "Teal", value: "174 100% 29%" },
  { name: "Sky", value: "200 90% 60%" },
  { name: "Royal", value: "220 80% 50%" },
  { name: "Indigo", value: "239 84% 67%" },
  { name: "Violet", value: "280 80% 60%" },
  { name: "Berry", value: "330 80% 50%" },
  { name: "Hot Pink", value: "330 100% 50%" },
  { name: "Neon", value: "300 100% 50%" },
  { name: "Slate", value: "215 20% 50%" },
  { name: "Coal", value: "0 0% 20%" },
];

export default function MarketingPage() {
  const { settings, updateSettings, products } = usePixelCart();
  const [formData, setFormData] = useState(settings);
  const [productSearch, setProductSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceImgInputRef = useRef<HTMLInputElement>(null);

  const [isAddBannerDialogOpen, setIsAddBannerDialogOpen] = useState(false);
  const [tempBanner, setTempBanner] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Sync formData with store settings when they load
  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSave = () => {
    updateSettings(formData);
    toast({ title: "Modifications enregistrées", description: "Le marketing de votre boutique a été mis à jour." });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast({ variant: "destructive", title: "Image trop lourde (max 1Mo)" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempBanner({
          id: Math.random().toString(36).substr(2, 9),
          image: reader.result as string,
          title: "Nouveau Produit",
          subtitle: "Collection 2024",
          description: "Découvrez notre nouvelle gamme d'outils professionnels.",
          buttonText: "Commander Maintenant",
          buttonColor: formData.primaryColor || "24 95% 53%",
          zoom: 1,
          posX: 50,
          posY: 50,
          titleSize: 1,
          descSize: 1,
          link: "/shop"
        });
        setIsEditing(false);
        setIsAddBannerDialogOpen(true);
      };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
  };

  const handleReplaceImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && tempBanner) {
      if (file.size > 1024 * 1024) {
        toast({ variant: "destructive", title: "Image trop lourde (max 1Mo)" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempBanner({ ...tempBanner, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
  };

  const handleEditBanner = (banner: any) => {
    setTempBanner({ 
      ...banner,
      titleSize: banner.titleSize || 1,
      descSize: banner.descSize || 1,
      link: banner.link || '/shop'
    });
    setIsEditing(true);
    setIsAddBannerDialogOpen(true);
  };

  const confirmAddBanner = () => {
    if (tempBanner) {
      setFormData(prev => {
        const existingBanners = prev.banners || [];
        const isUpdate = existingBanners.some(b => b.id === tempBanner.id);
        
        let updatedBanners;
        if (isUpdate) {
          updatedBanners = existingBanners.map(b => b.id === tempBanner.id ? tempBanner : b);
        } else {
          updatedBanners = [...existingBanners, tempBanner];
        }
        
        return { ...prev, banners: updatedBanners };
      });
      
      setTempBanner(null);
      setIsAddBannerDialogOpen(false);
      toast({ 
        title: isEditing ? "Bannière mise à jour" : "Bannière ajoutée", 
        description: "Enregistrez les changements pour publier." 
      });
    }
  };

  const removeBanner = (id: string) => {
    setFormData(prev => ({
      ...prev,
      banners: (prev.banners || []).filter(b => b.id !== id)
    }));
  };

  const togglePromotedProduct = (productId: string) => {
    setFormData(prev => {
      const current = prev.promotedProductIds || [];
      const updated = current.includes(productId) 
        ? current.filter(id => id !== productId)
        : [...current, productId];
      return { ...prev, promotedProductIds: updated };
    });
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black font-headline tracking-tight uppercase">Marketing & Promos</h1>
          <p className="text-muted-foreground">Boostez vos ventes avec des bannières et des annonces ciblées.</p>
        </div>
        <Button onClick={handleSave} className="gap-2 h-12 px-8 font-black rounded-xl shadow-lg">
          <Save className="h-4 w-4" />
          Enregistrer tout
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Announcement Bar */}
        <Card className="rounded-3xl border-none shadow-xl bg-white overflow-hidden">
          <CardHeader className="bg-primary/5 border-b">
            <CardTitle className="flex items-center gap-2 text-lg font-black uppercase">
              <Megaphone className="h-5 w-5 text-primary" />
              Barre d'Annonce
            </CardTitle>
            <CardDescription>Affichez un message important tout en haut de votre boutique.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border">
              <div className="space-y-0.5">
                <Label className="font-black text-xs uppercase tracking-wider">Activer l'annonce</Label>
                <p className="text-[10px] text-muted-foreground">Rendre visible par tous les clients.</p>
              </div>
              <Switch 
                checked={formData.showAnnouncement} 
                onCheckedChange={(val) => setFormData({ ...formData, showAnnouncement: val })} 
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Contenu de l'annonce (Arabe ou Français)</Label>
              <Input 
                value={formData.announcementText || ''} 
                onChange={(e) => setFormData({ ...formData, announcementText: e.target.value })}
                placeholder="Ex: توصيل مجاني لكل الطلبات فوق 5000 دج"
                className="h-12 rounded-xl font-bold border-2 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Couleur de fond (HSL)</Label>
              <Input 
                value={formData.announcementBgColor || '24 95% 53%'} 
                onChange={(e) => setFormData({ ...formData, announcementBgColor: e.target.value })}
                placeholder="Ex: 24 95% 53%"
                className="h-12 rounded-xl border-2"
              />
              <div 
                className="h-4 w-full rounded-full border mt-2" 
                style={{ backgroundColor: `hsl(${formData.announcementBgColor})` }} 
              />
            </div>
          </CardContent>
        </Card>

        {/* Banner Management */}
        <Card className="rounded-3xl border-none shadow-xl bg-white overflow-hidden">
          <CardHeader className="bg-primary/5 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg font-black uppercase">
                <ImageIcon className="h-5 w-5 text-primary" />
                Carrousel Homepage
              </CardTitle>
              <Button size="sm" variant="outline" className="rounded-full h-8 px-4" onClick={() => fileInputRef.current?.click()}>
                <Plus className="h-3 w-3 mr-2" />
                Ajouter une image
              </Button>
            </div>
            <CardDescription>Gérez les grandes images de bienvenue.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="space-y-4 pb-6 border-b">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Maximize2 className="h-4 w-4 text-primary" />
                Taille de la section (Hauteur globale)
              </Label>
              <Select 
                value={formData.bannerHeight || 'standard'} 
                onValueChange={(val: any) => setFormData({ ...formData, bannerHeight: val })}
              >
                <SelectTrigger className="h-12 rounded-xl font-bold border-2">
                  <SelectValue placeholder="Choisir la hauteur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact" className="font-bold">Compact (Petit)</SelectItem>
                  <SelectItem value="standard" className="font-bold">Standard (Moyen)</SelectItem>
                  <SelectItem value="hero" className="font-bold">Hero (Grand)</SelectItem>
                  <SelectItem value="fullscreen" className="font-bold">Plein Écran</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-6">
                {(formData.banners || []).map((banner, idx) => (
                  <div key={banner.id} className="group relative flex flex-col gap-4 p-4 rounded-2xl bg-muted/20 border-2 border-transparent hover:border-primary/20 transition-all">
                    <div className="flex gap-4">
                      <div className="relative h-24 w-32 rounded-xl overflow-hidden shadow-inner border bg-muted shrink-0">
                        <Image 
                          src={banner.image} 
                          alt="Banner" 
                          fill 
                          className="object-cover transition-all duration-300" 
                          style={{ 
                            transform: `scale(${banner.zoom || 1})`,
                            objectPosition: `${banner.posX || 50}% ${banner.posY || 50}%`
                          }}
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="text-xs font-black uppercase truncate">{banner.title}</p>
                        <div className="flex flex-wrap gap-2">
                           <Badge variant="outline" className="text-[8px] font-black h-4 px-1">ZOOM: {banner.zoom || 1}x</Badge>
                           <Badge variant="outline" className="text-[8px] font-black h-4 px-1">POS: {banner.posX || 50}/{banner.posY || 50}</Badge>
                           <Badge variant="outline" className="text-[8px] font-black h-4 px-1">TEXT: {banner.titleSize || 1}x</Badge>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-primary hover:bg-primary/10"
                          onClick={() => handleEditBanner(banner)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => removeBanner(banner.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {(formData.banners || []).length === 0 && (
                  <div className="text-center py-12 text-muted-foreground opacity-50 flex flex-col items-center gap-2">
                    <ImageIcon className="h-10 w-10" />
                    <p className="font-bold text-xs">Aucune bannière active</p>
                  </div>
                )}
              </div>
            </ScrollArea>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          </CardContent>
        </Card>

        {/* Featured / Promoted Products */}
        <Card className="rounded-3xl border-none shadow-xl bg-white overflow-hidden lg:col-span-2">
          <CardHeader className="bg-primary/5 border-b flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg font-black uppercase">
                  <Tag className="h-5 w-5 text-primary" />
                  Produits en Promotion (Solds)
                </CardTitle>
                <CardDescription>Sélectionnez les produits qui apparaîtront dans la section "Offres Spéciales".</CardDescription>
              </div>
              <div className="h-12 px-4 bg-muted/30 rounded-2xl border flex items-center gap-3">
                <Label className="font-black text-[10px] uppercase tracking-wider text-muted-foreground">Activation des Promotions</Label>
                <Switch 
                  checked={formData.showPromotions ?? true} 
                  onCheckedChange={(val) => setFormData({ ...formData, showPromotions: val })} 
                />
              </div>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Chercher un produit..." 
                className="pl-10 h-10 rounded-xl"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <ScrollArea className="h-[400px]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map(product => {
                  const isPromoted = (formData.promotedProductIds || []).includes(product.id);
                  return (
                    <div 
                      key={product.id} 
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer",
                        isPromoted ? "border-primary bg-primary/5 shadow-md" : "border-muted/50 hover:border-muted-foreground/30 bg-white"
                      )}
                      onClick={() => togglePromotedProduct(product.id)}
                    >
                      <div className="relative h-16 w-16 rounded-xl overflow-hidden border bg-muted shrink-0 shadow-sm">
                        {product.images?.[0] && <Image src={product.images[0]} alt={product.name} fill className="object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-xs uppercase truncate leading-tight">{product.name}</p>
                        <p className="text-[10px] text-muted-foreground font-bold">{product.price.toLocaleString()} DA</p>
                        <Badge variant="outline" className="text-[8px] h-4 mt-1">{product.category}</Badge>
                      </div>
                      {isPromoted && <CheckCircle2 className="h-5 w-5 text-primary shrink-0 animate-in zoom-in" />}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Banner Configuration Wizard Modal */}
      <Dialog open={isAddBannerDialogOpen} onOpenChange={(open) => {
        setIsAddBannerDialogOpen(open);
        if (!open) { setTempBanner(null); setIsEditing(false); }
      }}>
        <DialogContent className="max-w-5xl rounded-[2.5rem] p-0 overflow-hidden">
          <DialogHeader className="p-8 bg-primary/5 border-b">
            <DialogTitle className="text-2xl font-black uppercase flex items-center gap-3">
              <ImageIcon className="h-6 w-6 text-primary" />
              {isEditing ? "Modifier la bannière" : "Design & Configuration"}
            </DialogTitle>
            <DialogDescription className="font-bold">
              Personnalisez l'apparence, les textes et le bouton de votre bannière.
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Column: Visual Settings */}
            <div className="lg:col-span-4 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <ZoomIn className="h-4 w-4 text-primary" />
                    Zoom Image ({tempBanner?.zoom || 1}x)
                  </Label>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-7 text-[10px] rounded-lg gap-2"
                    onClick={() => replaceImgInputRef.current?.click()}
                  >
                    <RefreshCw className="h-3 w-3" /> Remplacer l'image
                  </Button>
                  <input 
                    type="file" 
                    ref={replaceImgInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleReplaceImage} 
                  />
                </div>
                <Slider 
                  min={1} 
                  max={2.5} 
                  step={0.05} 
                  value={[tempBanner?.zoom || 1]}
                  onValueChange={([val]) => setTempBanner({ ...tempBanner, zoom: val })}
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-dashed">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Move className="h-4 w-4 text-primary" />
                  Position Image (X / Y)
                </Label>
                <div className="space-y-6">
                  <Slider 
                    min={0} 
                    max={100} 
                    step={1} 
                    value={[tempBanner?.posX || 50]}
                    onValueChange={([val]) => setTempBanner({ ...tempBanner, posX: val })}
                  />
                  <Slider 
                    min={0} 
                    max={100} 
                    step={1} 
                    value={[tempBanner?.posY || 50]}
                    onValueChange={([val]) => setTempBanner({ ...tempBanner, posY: val })}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-dashed">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <TypeIcon className="h-4 w-4 text-primary" />
                  Taille du Texte
                </Label>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-muted-foreground">TITRE: {tempBanner?.titleSize || 1}x</span>
                    <Slider 
                      min={0.5} 
                      max={2} 
                      step={0.1} 
                      value={[tempBanner?.titleSize || 1]}
                      onValueChange={([val]) => setTempBanner({ ...tempBanner, titleSize: val })}
                    />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-muted-foreground">DESCRIPTION: {tempBanner?.descSize || 1}x</span>
                    <Slider 
                      min={0.5} 
                      max={1.5} 
                      step={0.1} 
                      value={[tempBanner?.descSize || 1]}
                      onValueChange={([val]) => setTempBanner({ ...tempBanner, descSize: val })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-dashed">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Palette className="h-4 w-4 text-primary" />
                  Couleur du Bouton
                </Label>
                <div className="grid grid-cols-5 gap-2">
                  {BANNER_COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      title={preset.name}
                      onClick={() => setTempBanner({ ...tempBanner, buttonColor: preset.value })}
                      className={cn(
                        "h-8 w-8 rounded-full border-2 transition-all hover:scale-110",
                        tempBanner?.buttonColor === preset.value ? "border-foreground ring-2 ring-primary/20 scale-110" : "border-transparent"
                      )}
                      style={{ backgroundColor: `hsl(${preset.value})` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Middle Column: Text Settings */}
            <div className="lg:col-span-4 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Titre Principal</Label>
                <Input 
                  placeholder="Ex: NOUVELLE COLLECTION" 
                  value={tempBanner?.title || ''}
                  onChange={(e) => setTempBanner({ ...tempBanner, title: e.target.value })}
                  className="h-10 rounded-xl font-black uppercase"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sous-titre (Badge)</Label>
                <Input 
                  placeholder="Ex: Nouveauté Exclusive" 
                  value={tempBanner?.subtitle || ''}
                  onChange={(e) => setTempBanner({ ...tempBanner, subtitle: e.target.value })}
                  className="h-10 rounded-xl font-bold"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</Label>
                <Textarea 
                  placeholder="Expliquez votre offre ici..." 
                  value={tempBanner?.description || ''}
                  onChange={(e) => setTempBanner({ ...tempBanner, description: e.target.value })}
                  className="h-24 rounded-xl font-medium"
                />
              </div>

              <div className="space-y-2 pt-4 border-t border-dashed">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Configuration du Bouton</Label>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">Texte</span>
                    <Input 
                      placeholder="Ex: Commander" 
                      value={tempBanner?.buttonText || ''}
                      onChange={(e) => setTempBanner({ ...tempBanner, buttonText: e.target.value })}
                      className="h-10 rounded-xl font-black uppercase"
                    />
                  </div>
                  
                  <div className="space-y-4 pt-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Destination du Bouton</Label>
                    <Tabs defaultValue={tempBanner?.link?.startsWith('/product/') ? 'product' : 'url'} className="w-full">
                      <TabsList className="grid w-full grid-cols-2 h-9 rounded-xl bg-muted/50 p-1">
                        <TabsTrigger value="url" className="text-[9px] font-black uppercase rounded-lg">URL Manuelle</TabsTrigger>
                        <TabsTrigger value="product" className="text-[9px] font-black uppercase rounded-lg">Lien Produit</TabsTrigger>
                      </TabsList>
                      <TabsContent value="url" className="space-y-2 mt-4">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase">Lien Direct</span>
                          <Input 
                            placeholder="Ex: /shop ou https://..." 
                            value={tempBanner?.link || ''}
                            onChange={(e) => setTempBanner({ ...tempBanner, link: e.target.value })}
                            className="h-10 rounded-xl font-medium"
                          />
                        </div>
                      </TabsContent>
                      <TabsContent value="product" className="space-y-2 mt-4">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase">Choisir un produit</span>
                          <Select 
                            value={tempBanner?.link?.replace('/product/', '') || ''} 
                            onValueChange={(val) => setTempBanner({ ...tempBanner, link: `/product/${val}` })}
                          >
                            <SelectTrigger className="h-10 rounded-xl font-bold border-2">
                              <SelectValue placeholder="Sélectionner..." />
                            </SelectTrigger>
                            <SelectContent>
                              <ScrollArea className="h-48">
                                {products.map(p => (
                                  <SelectItem key={p.id} value={p.id} className="text-xs font-bold">
                                    <div className="flex items-center gap-3">
                                      <div className="relative h-6 w-6 rounded-md overflow-hidden bg-muted border shrink-0">
                                        {p.images?.[0] ? (
                                          <Image src={p.images[0]} alt={p.name} fill className="object-cover" />
                                        ) : (
                                          <ShopIcon className="h-3 w-3 m-auto opacity-50" />
                                        )}
                                      </div>
                                      <span className="truncate">{p.name}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </ScrollArea>
                            </SelectContent>
                          </Select>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Final Preview */}
            <div className="lg:col-span-4 space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Aperçu Réel</Label>
              <div className="relative aspect-[4/5] w-full rounded-3xl overflow-hidden border-4 border-white shadow-2xl bg-muted group">
                {tempBanner?.image && (
                  <Image 
                    src={tempBanner.image} 
                    alt="Preview" 
                    fill 
                    className="object-cover transition-all duration-200"
                    style={{ 
                      transform: `scale(${tempBanner.zoom})`,
                      objectPosition: `${tempBanner.posX}% ${tempBanner.posY}%`
                    }}
                  />
                )}
                <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-6 text-white text-left">
                  <div className="space-y-3">
                    <Badge className="bg-primary/20 text-white border-none text-[8px] uppercase">{tempBanner?.subtitle}</Badge>
                    <h4 
                      className="font-black uppercase leading-tight"
                      style={{ fontSize: `${(tempBanner?.titleSize || 1) * 1.5}rem` }}
                    >
                      {tempBanner?.title}
                    </h4>
                    <p 
                      className="font-bold opacity-80 line-clamp-2"
                      style={{ fontSize: `${(tempBanner?.descSize || 1) * 0.75}rem` }}
                    >
                      {tempBanner?.description}
                    </p>
                    <Button 
                      size="sm" 
                      className="h-10 px-6 rounded-xl font-black text-[10px] uppercase shadow-lg pointer-events-none"
                      style={{ backgroundColor: `hsl(${tempBanner?.buttonColor})` }}
                    >
                      {tempBanner?.buttonText}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 bg-muted/20 border-t flex items-center justify-end gap-4">
            <Button variant="ghost" onClick={() => { setIsAddBannerDialogOpen(false); setTempBanner(null); }} className="font-bold">
              Annuler
            </Button>
            <Button onClick={confirmAddBanner} className="h-12 px-10 rounded-xl font-black gap-2 shadow-xl">
              <CheckCircle2 className="h-4 w-4" />
              {isEditing ? "Mettre à jour" : "Finaliser la bannière"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
