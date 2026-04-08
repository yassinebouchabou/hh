
"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { usePixelCart } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles, ArrowLeft, Loader2, X, Plus, Trash2, Tag, Layers, Hash, Coins, Banknote, LayoutGrid, Percent } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { generateProductDescription } from '@/ai/flows/generate-product-description-flow';
import Image from 'next/image';
import { useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import Link from 'next/link';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';
  
  const firestore = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { products, categories } = usePixelCart();
  
  // Find the product safely
  const product = id ? products.find(p => p.id === id) : null;

  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const [formData, setFormData] = useState({
    reference: '',
    name: '',
    category: '',
    price: '',
    purchasePrice: '',
    originalPrice: '',
    countInStock: '',
    description: '',
    images: [] as string[],
    tags: [] as string[],
    variants: [] as { name: string; price: number; countInStock: number }[]
  });

  const [discountPercent, setDiscountPercent] = useState<string>('0');
  const [currentTag, setCurrentTag] = useState('');

  useEffect(() => {
    if (product) {
      setFormData({
        reference: product.reference || '',
        name: product.name,
        category: product.category,
        price: product.price.toString(),
        purchasePrice: product.purchasePrice?.toString() || '',
        originalPrice: product.originalPrice?.toString() || '',
        countInStock: product.countInStock.toString(),
        description: product.description,
        images: product.images || [],
        tags: product.tags || [],
        variants: product.variants || []
      });
    }
  }, [product]);

  // Helper to calculate discount percentage whenever prices change
  useEffect(() => {
    const price = parseFloat(formData.price);
    const original = parseFloat(formData.originalPrice);
    if (price && original && original > price) {
      const pct = Math.round((1 - price / original) * 100);
      setDiscountPercent(pct.toString());
    } else {
      setDiscountPercent('0');
    }
  }, [formData.price, formData.originalPrice]);

  const handleDiscountChange = (val: string) => {
    setDiscountPercent(val);
    const original = parseFloat(formData.originalPrice);
    const pct = parseFloat(val);
    if (original && !isNaN(pct)) {
      const newPrice = original * (1 - pct / 100);
      setFormData(prev => ({ ...prev, price: Math.round(newPrice).toString() }));
    }
  };

  if (!id || !product) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Chargement du produit...</p>
      </div>
    );
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        if (file.size > 800 * 1024) {
          toast({ variant: "destructive", title: "Image trop lourde (max 800 Ko)" });
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({ 
            ...prev, 
            images: [...prev.images, reader.result as string] 
          }));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentTag.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(currentTag.trim())) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, currentTag.trim()] }));
      }
      setCurrentTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, { name: '', price: parseFloat(prev.price) || 0, countInStock: parseInt(prev.countInStock) || 0 }]
    }));
  };

  const updateVariant = (index: number, field: string, value: any) => {
    const updated = [...formData.variants];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, variants: updated }));
  };

  const removeVariant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const handleGenerateDescription = async () => {
    if (!formData.name) {
      toast({ variant: "destructive", title: "Veuillez entrer un nom d'abord" });
      return;
    }
    setAiLoading(true);
    try {
      const result = await generateProductDescription({
        productName: formData.name,
        productCategory: formData.category
      });
      setFormData(prev => ({ ...prev, description: result.description }));
      toast({ title: "Description générée" });
    } catch (error) {
      toast({ variant: "destructive", title: "Échec de l'IA" });
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const updatedData = {
      reference: formData.reference,
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price) || 0,
      purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) || 0 : null,
      originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) || 0 : null,
      countInStock: parseInt(formData.countInStock) || 0,
      description: formData.description,
      images: formData.images,
      tags: formData.tags,
      variants: formData.variants.map(v => ({
        ...v,
        price: Number(v.price) || 0,
        countInStock: Number(v.countInStock) || 0
      })),
      updatedAt: new Date().toISOString()
    };

    const docRef = doc(firestore, 'products', id);
    updateDocumentNonBlocking(docRef, updatedData);

    toast({ title: "Produit mis à jour", description: `${updatedData.name} enregistré.` });
    router.push('/admin/products');
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <Button variant="ghost" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Retour au catalogue
      </Button>

      <div className="max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Détails de l'Article</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="reference" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <Hash className="h-3 w-3" />
                    Référence / SKU
                  </Label>
                  <Input
                    id="reference"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <span>Catégorie</span>
                    <Link href="/admin/categories" className="text-[10px] text-primary hover:underline flex items-center gap-1 font-bold">
                      <LayoutGrid className="h-2 w-2" /> Gérer
                    </Link>
                  </Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(val) => setFormData({ ...formData, category: val })}
                  >
                    <SelectTrigger className="h-10 rounded-lg">
                      <SelectValue placeholder="Choisir une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Désignation</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <Coins className="h-3 w-3 text-orange-500" />
                    Prix Achat
                  </Label>
                  <Input
                    type="number"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <Banknote className="h-3 w-3 text-emerald-500" />
                    Prix Vente
                  </Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Original (Barré)</Label>
                  <Input
                    type="number"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount" className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"><Percent className="h-3 w-3 text-red-500" /> Remise (%)</span>
                    {parseFloat(discountPercent) > 0 && <Badge variant="destructive" className="h-4 text-[9px]">SOLDE</Badge>}
                  </Label>
                  <Input
                    id="discount"
                    type="number"
                    value={discountPercent}
                    onChange={(e) => handleDiscountChange(e.target.value)}
                    placeholder="Auto-calculé"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Stock</Label>
                  <Input
                    type="number"
                    value={formData.countInStock}
                    onChange={(e) => setFormData({ ...formData, countInStock: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateDescription}
                    disabled={aiLoading}
                    className="h-7 text-[10px] gap-2"
                  >
                    {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    Générer par IA
                  </Button>
                </div>
                <Textarea
                  rows={6}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Variantes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.variants.map((variant, index) => (
                <div key={index} className="flex flex-col md:flex-row gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex-1">
                    <Input 
                      placeholder="Nom (ex: Taille L, 5Ah)"
                      value={variant.name}
                      onChange={(e) => updateVariant(index, 'name', e.target.value)}
                    />
                  </div>
                  <div className="w-full md:w-32">
                    <Input 
                      type="number"
                      placeholder="Prix"
                      value={variant.price}
                      onChange={(e) => updateVariant(index, 'price', e.target.value)}
                    />
                  </div>
                  <div className="w-full md:w-32">
                    <Input 
                      type="number"
                      placeholder="Stock"
                      value={variant.countInStock}
                      onChange={(e) => updateVariant(index, 'countInStock', e.target.value)}
                    />
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => removeVariant(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" className="w-full border-dashed gap-2" onClick={addVariant}>
                <Plus className="h-4 w-4" /> Ajouter Variante
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader><CardTitle className="text-lg">Médias</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Galerie Photos</Label>
                <div className="grid grid-cols-2 gap-3">
                  {formData.images.map((img, index) => (
                    <div key={index} className="relative aspect-square rounded-xl border overflow-hidden group">
                      <Image src={img} alt="Preview" fill className="object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => removeImage(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed bg-muted flex flex-col items-center justify-center hover:bg-muted/80 transition-colors"
                  >
                    <Plus className="h-5 w-5 text-muted-foreground mb-1" />
                    <span className="text-[10px] text-muted-foreground font-bold uppercase">Ajouter Photo</span>
                  </button>
                </div>
                <input type="file" className="hidden" ref={fileInputRef} multiple accept="image/*" onChange={handleImageUpload} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Tags & SEO</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Appuyez sur Entrée"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyDown={handleAddTag}
              />
              <div className="flex flex-wrap gap-1.5">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1.5 py-1">
                    {tag}
                    <X className="h-3 w-3 cursor-pointer opacity-60 hover:opacity-100" onClick={() => removeTag(tag)} />
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={handleSubmit} 
            className="w-full h-16 text-lg font-bold shadow-xl rounded-2xl"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
            {loading ? "Mise à jour..." : "Enregistrer les modifications"}
          </Button>
        </div>
      </div>
    </div>
  );
}
