
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePixelCart } from '@/lib/store';
import { Button } from './ui/button';
import { ShoppingCart, Menu, Search, Package, Phone, LayoutGrid, Home, Megaphone } from 'lucide-react';
import { Badge } from './ui/badge';
import Image from 'next/image';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { Skeleton } from './ui/skeleton';

export function Navbar() {
  const { cart, settings, isInitialLoading } = usePixelCart();
  const [mounted, setMounted] = useState(false);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navLinks = [
    { label: 'Accueil', href: '/', icon: Home },
    { label: 'Boutique', href: '/shop', icon: Package },
    { label: 'Catégories', href: '/categories', icon: LayoutGrid },
    { label: 'Contact', href: '/contact', icon: Phone },
  ];

  return (
    <div className="flex flex-col w-full sticky top-0 z-50">
      {/* Announcement Bar */}
      {mounted && !isInitialLoading && settings.showAnnouncement && settings.announcementText && (
        <div 
          className="w-full py-2 px-4 flex items-center justify-center gap-3 animate-in slide-in-from-top duration-500 overflow-hidden bg-primary text-primary-foreground shadow-sm"
          style={{ backgroundColor: settings.announcementBgColor ? `hsl(${settings.announcementBgColor})` : 'hsl(var(--primary))' }}
        >
          <Megaphone className="h-3.5 w-3.5 animate-pulse shrink-0" />
          <p className="text-[11px] font-black uppercase tracking-wide text-center leading-none">
            {settings.announcementText}
          </p>
        </div>
      )}

      <nav className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px]">
                <SheetHeader>
                  <div className="text-left py-4">
                    {mounted && !isInitialLoading ? (
                      <span className="text-lg font-bold">{settings.brandName || "PixelCart"}</span>
                    ) : (
                      <Skeleton className="h-6 w-32" />
                    )}
                  </div>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-8">
                  {navLinks.map((link) => (
                    <Link 
                      key={link.href} 
                      href={link.href} 
                      className="flex items-center gap-3 text-lg font-medium hover:text-primary transition-colors p-3"
                    >
                      <link.icon className="h-5 w-5" />
                      {link.label}
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>

            <Link href="/" className="flex items-center space-x-2">
              {!mounted || isInitialLoading ? (
                <Skeleton className="h-8 w-32 rounded-md" />
              ) : settings.logoUrl ? (
                <div className="relative h-10 w-40 overflow-hidden">
                  <Image 
                    src={settings.logoUrl} 
                    alt={settings.brandName} 
                    fill 
                    className="object-contain object-left"
                    priority
                  />
                </div>
              ) : (
                <span className="text-xl font-bold tracking-tight text-primary">
                  {settings.brandName || "PixelCart"}
                </span>
              )}
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2"
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <Link href="/shop">
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Search className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative h-10 w-10">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -right-1 -top-1 h-5 w-5 justify-center rounded-full bg-accent p-0 text-[10px] text-accent-foreground font-bold">
                    {cartCount}
                  </Badge>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
