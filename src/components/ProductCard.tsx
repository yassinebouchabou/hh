
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/lib/types';
import { Card, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { ShoppingCart, Tag, Hash } from 'lucide-react';
import { usePixelCart } from '@/lib/store';
import { toast } from '@/hooks/use-toast';

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = usePixelCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product, 1);
    toast({
      title: "Ajouté au panier",
      description: `${product.name} a été ajouté à votre panier.`,
    });
  };

  const displayImage = (product.images && product.images.length > 0) 
    ? product.images[0] 
    : 'https://picsum.photos/seed/placeholder/600/400';

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercentage = hasDiscount 
    ? Math.round((1 - product.price / product.originalPrice!) * 100) 
    : 0;

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg relative flex flex-col h-full rounded-2xl sm:rounded-3xl border-muted/50 bg-white">
      {/* Discount Badge */}
      {hasDiscount && (
        <div className="absolute top-3 left-3 z-10 bg-red-600 text-white px-2.5 py-1 rounded-full font-black text-[10px] sm:text-xs shadow-xl flex items-center gap-1 animate-in zoom-in duration-300">
          <Tag className="h-3 w-3" />
          -{discountPercentage}%
        </div>
      )}

      {/* SKU / Reference Overlay on Image */}
      {product.reference && (
        <div className="absolute top-3 right-3 z-10 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-lg font-black text-[8px] uppercase tracking-wider shadow-md">
          Ref: {product.reference}
        </div>
      )}

      <Link href={`/product/${product.id}`} className="block relative aspect-[4/3] overflow-hidden bg-muted">
        <Image
          src={displayImage}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        />
      </Link>
      
      <CardContent className="p-3 sm:p-4 flex-grow space-y-1 sm:space-y-1.5">
        <Link href={`/product/${product.id}`} className="block">
          <h3 className="line-clamp-1 font-headline text-xs sm:text-base font-bold group-hover:text-primary transition-colors uppercase">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-2">
          <p className="text-base sm:text-xl font-black text-primary">
            {product.price.toLocaleString()} <span className="text-[9px] sm:text-xs font-bold uppercase">DA</span>
          </p>
          {hasDiscount && (
            <p className="text-[10px] sm:text-sm text-muted-foreground/50 line-through font-bold">
              {product.originalPrice?.toLocaleString()}
            </p>
          )}
        </div>
        <div className="line-clamp-1 text-[9px] sm:text-xs text-muted-foreground leading-relaxed">
          {product.description}
        </div>
      </CardContent>
      
      <CardFooter className="p-3 sm:p-4 pt-0">
        <Button 
          onClick={handleAddToCart} 
          className="w-full gap-1.5 sm:gap-2 bg-primary/10 text-primary hover:bg-primary/20 border-none font-black text-[9px] sm:text-xs uppercase tracking-wider rounded-xl h-8 sm:h-10 transition-all active:scale-95" 
          variant="ghost"
        >
          <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Ajouter au panier</span>
          <span className="sm:hidden">Ajouter</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
