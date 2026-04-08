"use client";

import { useState, useMemo } from 'react';
import { usePixelCart } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Edit, 
  Trash2, 
  Plus, 
  Search, 
  Filter, 
  Download,
  Coins,
  Banknote,
  PackageX,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export default function AdminProductListPage() {
  const { products } = usePixelCart();
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const categories = useMemo(() => {
    return ['all', ...Array.from(new Set(products.map(p => p.category)))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.reference && p.reference.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
      
      const stock = Number(p.countInStock) || 0;
      let matchesStock = true;
      if (stockFilter === 'in') matchesStock = stock >= 10;
      if (stockFilter === 'low') matchesStock = stock > 0 && stock < 10;
      if (stockFilter === 'out') matchesStock = stock === 0;

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchTerm, categoryFilter, stockFilter]);

  const handleDelete = (id: string) => {
    if (confirm("Voulez-vous vraiment supprimer ce produit ?")) {
      const docRef = doc(firestore, 'products', id);
      deleteDocumentNonBlocking(docRef);
      toast({
        title: "Produit supprimé",
        description: "L'article a été retiré de l'inventaire.",
      });
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Voulez-vous supprimer les ${selectedProducts.length} produits sélectionnés ?`)) {
      selectedProducts.forEach(id => {
        const docRef = doc(firestore, 'products', id);
        deleteDocumentNonBlocking(docRef);
      });
      setSelectedProducts([]);
      toast({
        title: "Action effectuée",
        description: "Les produits sélectionnés ont été supprimés.",
      });
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Référence', 'Nom', 'Catégorie', 'Prix Achat', 'Prix Vente', 'Stock'];
    const csvData = filteredProducts.map(p => [
      p.id, 
      p.reference || '', 
      p.name, 
      p.category, 
      p.purchasePrice || 0, 
      p.price, 
      p.countInStock
    ].join(','));
    const csvContent = [headers.join(','), ...csvData].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inventaire_outilya_dz_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Gestion du Catalogue</h1>
          <p className="text-muted-foreground">Pilotez votre inventaire et vos stocks OUTILYA DZ.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportToCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Exporter CSV
          </Button>
          <Button asChild className="gap-2">
            <Link href="/admin/products/new">
              <Plus className="h-4 w-4" />
              Nouveau Produit
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between bg-card p-4 rounded-lg border">
        <div className="flex flex-1 items-center gap-4 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Nom, description ou référence..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat === 'all' ? 'Toutes les catégories' : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="État du stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tout le stock</SelectItem>
              <SelectItem value="in">En stock (&gt;= 10)</SelectItem>
              <SelectItem value="low">Stock faible (&lt; 10)</SelectItem>
              <SelectItem value="out">Rupture</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedProducts.length > 0 && (
        <div className="flex items-center gap-4 bg-primary/10 p-4 rounded-lg border border-primary/20 animate-in fade-in slide-in-from-top-4">
          <span className="text-sm font-medium text-primary">
            {selectedProducts.length} produit(s) sélectionné(s)
          </span>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
            Supprimer la sélection
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedProducts([])}>
            Annuler
          </Button>
        </div>
      )}

      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) setSelectedProducts(filteredProducts.map(p => p.id));
                    else setSelectedProducts([]);
                  }}
                />
              </TableHead>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Référence</TableHead>
              <TableHead>Désignation</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  <Coins className="h-3 w-3" />
                  Achat
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  <Banknote className="h-3 w-3" />
                  Vente
                </div>
              </TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                  <PackageX className="h-8 w-8 opacity-20" />
                  <span>Aucun produit ne correspond à votre recherche.</span>
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => {
                const stock = Number(product.countInStock) || 0;
                return (
                  <TableRow key={product.id} className={selectedProducts.includes(product.id) ? 'bg-muted/50' : ''}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={(checked) => {
                          if (checked) setSelectedProducts(prev => [...prev, product.id]);
                          else setSelectedProducts(prev => prev.filter(id => id !== product.id));
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="relative h-12 w-12 overflow-hidden rounded-md bg-muted border">
                        <Image 
                          src={(product.images && product.images.length > 0) ? product.images[0] : 'https://picsum.photos/seed/placeholder/200/200'} 
                          alt={product.name} 
                          fill 
                          className="object-cover" 
                          data-ai-hint="industrial tool"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded border">
                        {product.reference || 'N/A'}
                      </code>
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.category}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground italic">
                      {product.purchasePrice ? product.purchasePrice.toLocaleString() : '-'}
                    </TableCell>
                    <TableCell className="font-bold text-emerald-600">
                      {product.price.toLocaleString()} DA
                    </TableCell>
                    <TableCell>
                      {stock < 10 ? (
                        <Badge variant="destructive" className="animate-pulse flex items-center gap-1 w-fit bg-red-500">
                          <AlertTriangle className="h-3 w-3" />
                          {stock}
                        </Badge>
                      ) : (
                        <span className="font-bold text-muted-foreground">{stock}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/admin/products/${product.id}/edit`}>
                            <Edit className="h-4 w-4 text-blue-500" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
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
