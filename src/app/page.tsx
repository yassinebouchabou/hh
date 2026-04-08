"use client";

import { useMemo } from 'react';
import { usePixelCart } from '@/lib/store';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Hammer, Wrench, LayoutGrid, ChevronRight, Sparkles, ShoppingBag, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import Loading from './loading';
import { cn } from '@/lib/utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

export default function Home() {
  const { products, settings, categories, isInitialLoading } = usePixelCart();

  const latestProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 12);
  }, [products]);

  const promotedProducts = useMemo(() => {
    if (!settings.promotedProductIds || settings.promotedProductIds.length === 0) return [];
    return products.filter(p => settings.promotedProductIds?.includes(p.id));
  }, [products, settings.promotedProductIds]);

  // Map settings to Tailwind grid column classes
  const productGridCols = {
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
    5: 'lg:grid-cols-5',
    6: 'lg:grid-cols-6',
  }[settings.productColsDesktop || 6];

  const categoryGridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
  }[settings.categoryColsDesktop || 3];

  const bannerHeightClass = {
    compact: 'h-[300px] md:h-[400px]',
    standard: 'h-[400px] md:h-[600px]',
    hero: 'h-[500px] md:h-[750px]',
    fullscreen: 'h-[calc(100vh-4rem)]',
  }[settings.bannerHeight || 'standard'];

  if (isInitialLoading) {
    return <Loading />;
  }

  const autoplayPlugin = Autoplay({ delay: 3000, stopOnInteraction: true });

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Banner Carousel */}
      {settings.banners && settings.banners.length > 0 && (
        <section className="w-full relative bg-muted/30 overflow-hidden">
          <Carousel 
            plugins={[autoplayPlugin]}
            className="w-full"
            opts={{ loop: true }}
          >
            <CarouselContent>
              {settings.banners.map((banner) => (
                <CarouselItem key={banner.id}>
                  <div className={cn("relative w-full flex items-center justify-center overflow-hidden transition-all duration-500", bannerHeightClass)}>
                    <Image 
                      src={banner.image} 
                      alt={banner.title || "Banner"} 
                      fill 
                      className="object-cover transition-transform duration-1000"
                      priority
                      unoptimized={banner.image.startsWith('data:')}
                      style={{ 
                        transform: `scale(${banner.zoom || 1})`,
                        objectPosition: `${banner.posX ?? 50}% ${banner.posY ?? 50}%`
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent flex items-center p-8 md:p-20">
                      <div className="max-w-2xl space-y-6 animate-in slide-in-from-left-8 duration-700">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 backdrop-blur-md text-primary-foreground text-[10px] font-black uppercase tracking-widest">
                          <Sparkles className="h-3 w-3" />
                          {banner.subtitle || "Nouveauté Exclusive"}
                        </div>
                        <h2 
                          className="font-black text-white leading-tight uppercase tracking-tighter"
                          style={{ fontSize: `calc(${(banner.titleSize || 1) * 2.5}rem + 1vw)` }}
                        >
                          {banner.title}
                        </h2>
                        <p 
                          className="text-white/80 font-bold max-w-lg"
                          style={{ fontSize: `${(banner.descSize || 1) * 1.25}rem` }}
                        >
                          {banner.description || banner.subtitle}
                        </p>
                        <Button 
                          asChild 
                          size="lg" 
                          className="h-16 px-12 rounded-2xl font-black text-xl gap-3 shadow-2xl hover:scale-105 transition-transform"
                          style={{ backgroundColor: banner.buttonColor ? `hsl(${banner.buttonColor})` : undefined }}
                        >
                          <Link 
                            href={banner.link || "/shop"} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            {banner.buttonText || "Commander Maintenant"}
                            <ShoppingBag className="h-6 w-6" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="absolute bottom-10 right-20 flex gap-4 z-20">
              <CarouselPrevious className="relative inset-0 h-12 w-12 bg-white/10 hover:bg-white/20 border-white/20 text-white rounded-2xl" />
              <CarouselNext className="relative inset-0 h-12 w-12 bg-white/10 hover:bg-white/20 border-white/20 text-white rounded-2xl" />
            </div>
          </Carousel>
        </section>
      )}

      {/* Promoted Products Section */}
      {(settings.showPromotions ?? true) && promotedProducts.length > 0 && (
        <section className="bg-primary/5 py-16">
          <div className="container mx-auto px-4">
            <div className="mb-10 flex items-center justify-between">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px]">
                  <Sparkles className="h-3.5 w-3.5" />
                  {settings.homePromotionsSubtitle || "Sélection du Moment"}
                </div>
                <h2 className="text-3xl font-black font-headline tracking-tight uppercase">
                  {settings.homePromotionsTitle || "Ventes Flash & Offres"}
                </h2>
              </div>
              <Button variant="outline" className="hidden md:flex rounded-xl gap-2 font-bold" asChild>
                <Link href="/shop">
                  Tout Voir
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {promotedProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories Explorer Section */}
      <section className="container mx-auto px-4 py-16 animate-in fade-in slide-in-from-bottom-8 duration-500">
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-l-4 border-primary pl-6">
          <div>
            <h2 className="font-headline text-3xl font-black uppercase tracking-tight">
              {settings.homeCategoriesTitle || "Nos Univers Métiers"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {settings.homeCategoriesSubtitle || "Trouvez l'équipement adapté à votre expertise."}
            </p>
          </div>
          <Button asChild variant="ghost" className="text-primary font-black gap-2 text-xs h-10 px-6 rounded-xl hover:bg-primary/5">
            <Link href="/categories">
              Toutes les catégories
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className={cn("grid grid-cols-1 gap-6", categoryGridCols)}>
          {categories.slice(0, settings.homeCategoriesLimit || settings.categoryColsDesktop || 3).map((cat) => (
            <Link key={cat.id} href={`/shop?category=${encodeURIComponent(cat.name)}`}>
              <Card className="group relative h-56 overflow-hidden rounded-3xl border-none shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <div className="absolute inset-0 z-0">
                  <Image 
                    src={cat.image || 'https://picsum.photos/seed/cat-industrial/600/400'} 
                    alt={cat.name} 
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110" 
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    unoptimized={cat.image?.startsWith('data:')}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                </div>
                
                <CardContent className="relative z-10 h-full flex flex-col justify-end p-8 text-white">
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <h2 className="text-2xl font-black uppercase tracking-tight">{cat.name}</h2>
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-accent mt-1 flex items-center gap-2">
                        Explorer la gamme <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center group-hover:bg-primary transition-colors duration-300 shadow-xl border border-white/10">
                      <ChevronRight className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest Products Grid */}
      <section id="products" className="container mx-auto px-4 py-16 scroll-mt-16 bg-white rounded-[3rem] shadow-sm mb-20">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4 border-l-4 border-primary pl-6">
          <div>
            <h2 className="font-headline text-3xl font-black uppercase tracking-tight">
              {settings.homeProductsTitle || "Derniers Arrivages"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {settings.homeProductsSubtitle || "Équipez-vous avec les outils les plus récents du marché."}
            </p>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-full text-xs font-bold text-primary">
            <Hammer className="h-4 w-4" />
            <span>{products.length} Articles en stock</span>
          </div>
        </div>

        {latestProducts.length > 0 ? (
          <div className={cn("grid grid-cols-2 gap-4 sm:gap-8", productGridCols)}>
            {latestProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          !isInitialLoading && (
            <div className="bg-muted/50 rounded-[2rem] border-2 border-dashed p-20 text-center">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Wrench className="h-8 w-8 text-muted-foreground opacity-30" />
              </div>
              <h3 className="text-xl font-bold mb-2">Inventaire en cours de mise à jour</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Revenez très bientôt pour découvrir nos nouveautés Outilya DZ !
              </p>
            </div>
          )
        )}
      </section>
    </div>
  );
}
