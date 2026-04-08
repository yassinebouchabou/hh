
"use client";

import { usePixelCart } from '@/lib/store';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function CartPage() {
  const { cart, removeFromCart } = usePixelCart();
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  
  // Shipping estimation is just visual here, actual is calculated at checkout
  const shipping = subtotal > 0 ? 500 : 0; 
  const total = subtotal + shipping;

  if (cart.length === 0) return (
    <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center space-y-4 text-center">
      <div className="rounded-full bg-muted p-6">
        <ShoppingBag className="h-12 w-12 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold">Votre panier est vide</h2>
      <p className="text-muted-foreground">Ajoutez des articles pour commencer vos achats !</p>
      <Button asChild className="mt-4">
        <Link href="/shop">Parcourir les produits</Link>
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-8 font-headline text-3xl font-bold">Mon Panier</h1>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item, idx) => {
            const itemImage = (item.images && item.images.length > 0 && item.images[0]) 
              ? item.images[0] 
              : 'https://picsum.photos/seed/placeholder/200/200';
              
            return (
              <Card key={`${item.id}-${idx}`} className="overflow-hidden">
                <CardContent className="flex items-center p-4">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-muted border">
                    <Image 
                      src={itemImage} 
                      alt={item.name} 
                      fill 
                      className="object-cover" 
                    />
                  </div>
                  <div className="ml-4 flex-grow">
                    <Link href={`/product/${item.id}`} className="font-semibold hover:text-primary line-clamp-1">
                      {item.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">{item.category} {item.selectedVariant ? `• ${item.selectedVariant}` : ''}</p>
                    <p className="mt-1 font-bold text-sm">{item.price.toLocaleString()} DA x {item.quantity}</p>
                  </div>
                  <div className="ml-4 flex items-center space-x-4">
                    <p className="font-bold text-primary whitespace-nowrap">{(item.price * item.quantity).toLocaleString()} DA</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => removeFromCart(item.id, item.selectedVariant)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div>
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 text-xl font-bold">Résumé de la commande</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span className="font-bold">{subtotal.toLocaleString()} DA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Livraison (est.)</span>
                  <span className="text-sm italic">Calculé au paiement</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold pt-2">
                  <span>Total</span>
                  <span className="text-primary">{subtotal.toLocaleString()} DA</span>
                </div>
              </div>
              <Button className="mt-8 w-full h-14 font-black gap-2 text-lg shadow-xl" size="lg" asChild>
                <Link href="/checkout">
                  Continuer vers le paiement
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <p className="mt-4 text-center text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                Paiement à la livraison (COD)
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
