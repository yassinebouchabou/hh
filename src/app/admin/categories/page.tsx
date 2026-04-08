
"use client";

import { useState, useRef } from 'react';
import { usePixelCart } from '@/lib/store';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Plus, 
  Trash2, 
  Edit, 
  LayoutGrid, 
  ImageIcon, 
  X,
  Package,
  Save,
  Loader2
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import Image from 'next/image';
import { useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { toast } from '@/hooks/use-toast';

export default function AdminCategoriesPage() {
  const { categories, products } = usePixelCart();
  const firestore = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: ''
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800 * 1024) {
        toast({ variant: "destructive", title: "Fichier trop volumineux (max 800 Ko)" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!formData.name) {
      toast({ variant: "destructive", title: "Le nom est requis" });
      return;
    }

    const categoryId = editingCategory || Math.random().toString(36).substr(2, 9);
    const docRef = doc(firestore, 'categories', categoryId);
    
    setDocumentNonBlocking(docRef, {
      ...formData,
      id: categoryId
    }, { merge: true });

    toast({ 
      title: editingCategory ? "Catégorie mise à jour" : "Catégorie créée", 
      description: `${formData.name} a été enregistré.` 
    });
    
    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', image: '' });
    setEditingCategory(null);
  };

  const handleEdit = (cat: any) => {
    setFormData({
      name: cat.name,
      description: cat.description || '',
      image: cat.image || ''
    });
    setEditingCategory(cat.id);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Supprimer cette catégorie ? Les produits liés ne seront pas supprimés mais perdront leur lien visuel.")) {
      const docRef = doc(firestore, 'categories', id);
      deleteDocumentNonBlocking(docRef);
      toast({ title: "Catégorie supprimée" });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">Gestion des Catégories</h1>
          <p className="text-muted-foreground">Organisez votre catalogue pour une meilleure navigation.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle Catégorie
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingCategory ? "Modifier la catégorie" : "Ajouter une catégorie"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label>Nom de la catégorie</Label>
                <Input 
                  placeholder="Ex: Outillage Électroportatif" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description (Optionnel)</Label>
                <Input 
                  placeholder="Brève description..." 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-4">
                <Label>Image de couverture</Label>
                <div 
                  className="relative h-40 w-full rounded-2xl border-2 border-dashed bg-muted flex flex-col items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors overflow-hidden"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {formData.image ? (
                    <>
                      <Image 
                        src={formData.image} 
                        alt="Preview" 
                        fill 
                        className="object-cover" 
                        unoptimized={formData.image.startsWith('data:')}
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <ImageIcon className="h-8 w-8 text-white" />
                      </div>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-xs text-muted-foreground">Cliquez pour ajouter une image</p>
                    </>
                  )}
                </div>
                <input type="file" className="hidden" ref={fileInputRef} accept="image/*" onChange={handleImageUpload} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" />
                {editingCategory ? "Mettre à jour" : "Créer la catégorie"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Nombre Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{categories.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Produits liés</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground italic">
                  Aucune catégorie définie.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((cat) => {
                const productCount = products.filter(p => p.category === cat.name).length;
                return (
                  <TableRow key={cat.id}>
                    <TableCell>
                      <div className="relative h-12 w-12 rounded-lg bg-muted border overflow-hidden">
                        {cat.image ? (
                          <Image 
                            src={cat.image} 
                            alt={cat.name} 
                            fill 
                            className="object-cover" 
                            unoptimized={cat.image.startsWith('data:')}
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <LayoutGrid className="h-5 w-5 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold">{cat.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">{productCount} articles</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(cat)}>
                          <Edit className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
