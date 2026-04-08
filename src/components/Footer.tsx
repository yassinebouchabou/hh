"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePixelCart } from '@/lib/store';
import { Phone, Mail, MapPin } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

export function Footer() {
  const { settings, isInitialLoading } = usePixelCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <footer className="bg-card py-20 border-t animate-in fade-in duration-500 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
          {/* Branding & Logo */}
          <div className="space-y-6 flex flex-col items-center md:items-start">
            <Link href="/" className="inline-block">
              {!mounted || isInitialLoading ? (
                <Skeleton className="h-10 w-40" />
              ) : settings.logoUrl ? (
                <div className="relative h-12 w-48 overflow-hidden">
                  <Image 
                    src={settings.logoUrl} 
                    alt={settings.brandName} 
                    fill 
                    className="object-contain object-center md:object-left"
                  />
                </div>
              ) : (
                <h2 className="text-2xl font-black text-primary">{settings.brandName || "PixelCart"}</h2>
              )}
            </Link>
            
            <div className="text-muted-foreground text-sm leading-relaxed max-w-xs min-h-[1.5rem]">
              {mounted && !isInitialLoading ? (
                settings.footerDescription || "Votre partenaire de confiance pour l'outillage professionnel."
              ) : (
                <Skeleton className="h-4 w-full" />
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold font-headline">Liens Rapides</h3>
            <nav className="flex flex-col gap-3">
              <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">Accueil</Link>
              <Link href="/shop" className="text-sm text-muted-foreground hover:text-primary transition-colors">Boutique</Link>
              <Link href="/categories" className="text-sm text-muted-foreground hover:text-primary transition-colors">Catégories</Link>
              <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">Contact</Link>
            </nav>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold font-headline">Contactez-nous</h3>
            <div className="space-y-4 flex flex-col items-center md:items-start">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  {mounted && !isInitialLoading ? (settings.contactPhone || "+213 55869637") : <Skeleton className="h-4 w-32" />}
                </span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  {mounted && !isInitialLoading ? (settings.contactEmail || "contact@shop.dz") : <Skeleton className="h-4 w-40" />}
                </span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  {mounted && !isInitialLoading ? (settings.contactAddress || "Alger, Algérie") : <Skeleton className="h-4 w-36" />}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-16 pt-8 border-t text-center text-muted-foreground text-xs">
          <p>&copy; {mounted ? new Date().getFullYear() : '2024'} {settings.brandName || "PixelCart"}. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
