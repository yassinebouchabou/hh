
"use client";

import { useMemo } from 'react';
import { usePixelCart } from '@/lib/store';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, LayoutGrid, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export default function CategoriesPage() {
  const { products, settings, categories: storeCategories } = usePixelCart();

  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    
    // Use storeCategories as the primary source of truth for metadata and images
    return storeCategories.map(cat => ({
      ...cat,
      count: counts[cat.name] || 0
    }));
  }, [products, storeCategories]);

  // Map settings to Tailwind grid column classes
  const categoryGridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
  }[settings.categoryColsDesktop || 3];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-black font-headline mb-1">Nos Catégories</h1>
        <p className="text-sm text-muted-foreground">Explorez notre catalogue par domaine d'activité.</p>
      </div>

      <div className={cn("grid grid-cols-1 gap-6", categoryGridCols)}>
        {categories.length > 0 ? (
          categories.map((cat) => (
            <Link key={cat.id} href={`/shop?category=${encodeURIComponent(cat.name)}`}>
              <Card className="group relative h-48 overflow-hidden rounded-2xl border-none shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                <div className="absolute inset-0 z-0">
                  {cat.image ? (
                    <Image 
                      src={cat.image} 
                      alt={cat.name} 
                      fill 
                      className="object-cover transition-transform duration-700 group-hover:scale-110" 
                      unoptimized={cat.image.startsWith('data:')}
                    />
                  ) : (
                    <div className="h-full w-full bg-muted flex items-center justify-center">
                      <LayoutGrid className="h-12 w-12 text-muted-foreground/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                </div>
                
                <CardContent className="relative z-10 h-full flex flex-col justify-end p-6 text-white">
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <Tag className="h-3 w-3 text-accent" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-accent/90">
                          {cat.count} {cat.count > 1 ? 'Produits' : 'Produit'}
                        </span>
                      </div>
                      <h2 className="text-xl font-black">{cat.name}</h2>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full py-16 text-center bg-muted/20 rounded-2xl border-2 border-dashed">
            <LayoutGrid className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-20" />
            <p className="text-sm text-muted-foreground">Aucune catégorie disponible pour le moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
