
"use client";

import { useState, useMemo, Suspense } from 'react';
import { usePixelCart } from '@/lib/store';
import { ProductCard } from '@/components/ProductCard';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Search, Filter, SlidersHorizontal, PackageX } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

function ShopContent() {
  const { products, settings } = usePixelCart();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState('newest');

  const categories = useMemo(() => {
    return ['all', ...Array.from(new Set(products.map(p => p.category)))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let results = products.filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.reference && p.reference.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    if (sortBy === 'price-asc') results.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') results.sort((a, b) => b.price - a.price);
    if (sortBy === 'newest') results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return results;
  }, [products, searchTerm, selectedCategory, sortBy]);

  // Map settings to Tailwind grid column classes
  const productGridCols = {
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
    5: 'lg:grid-cols-5',
    6: 'lg:grid-cols-6',
  }[settings.productColsDesktop || 6];

  return (
    <div className="container mx-auto px-4 py-12 animate-in fade-in duration-700">
      <div className="flex flex-col gap-8">
        <div className="animate-in slide-in-from-left-4 duration-500">
          <h1 className="text-4xl font-black font-headline mb-2">Notre Boutique</h1>
          <p className="text-muted-foreground">Découvrez notre gamme complète d'outillage professionnel.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-6 rounded-3xl border shadow-sm animate-in slide-in-from-top-4 duration-700">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher un produit ou référence..." 
              className="pl-12 h-12 rounded-2xl border-muted bg-muted/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2 flex-1 md:flex-initial">
              <Filter className="h-4 w-4 text-primary" />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-12 w-full md:w-[180px] rounded-2xl">
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

            <div className="flex items-center gap-2 flex-1 md:flex-initial">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-12 w-full md:w-[180px] rounded-2xl">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Nouveautés</SelectItem>
                  <SelectItem value="price-asc">Prix croissant</SelectItem>
                  <SelectItem value="price-desc">Prix décroissant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <div className={cn("grid grid-cols-2 gap-3 sm:gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700", productGridCols)}>
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="py-32 text-center bg-muted/20 rounded-3xl border-2 border-dashed">
            <PackageX className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-xl font-bold">Aucun produit trouvé</h3>
            <p className="text-muted-foreground">Essayez de modifier vos filtres ou votre recherche.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-20 text-center font-bold">Chargement de la boutique...</div>}>
      <ShopContent />
    </Suspense>
  );
}
