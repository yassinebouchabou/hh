
"use client";

import { usePixelCart } from '@/lib/store';
import { useParams, useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  MapPin, 
  ShoppingBag, 
  DollarSign, 
  Calendar, 
  Trash2,
  LayoutGrid,
  BoxSelect,
  PackageCheck,
  Plus,
  Search,
  CheckCircle2,
  Home,
  Building2,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { OrderStatus, OrderItem, Product } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ALGERIA_DATA, ALGERIA_STATES } from '@/lib/algeria-data';

export default function OrderDetailPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';
  const router = useRouter();
  const firestore = useFirestore();
  const { orders, updateOrderStatus, products, settings, deliveryTariffs } = usePixelCart();
  
  const [productSearch, setProductSearch] = useState('');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  const order = useMemo(() => orders.find(o => o.id === id), [orders, id]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
      (p.reference && p.reference.toLowerCase().includes(productSearch.toLowerCase()))
    );
  }, [products, productSearch]);

  const items = useMemo(() => {
    if (!order) return [];
    return (order.items && order.items.length > 0)
      ? order.items 
      : [{ 
          productId: order.productId,
          productName: order.productName, 
          quantity: order.quantity, 
          price: (order.totalAmount - (order.deliveryCost || 0)) / (order.quantity || 1),
          selectedVariant: order.selectedVariant || '',
          productImage: order.productImage 
        }];
  }, [order]);

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <LayoutGrid className="h-12 w-12 text-muted-foreground opacity-20" />
        <p className="text-muted-foreground font-black uppercase tracking-widest">Commande introuvable</p>
        <Button onClick={() => router.push('/admin/orders')}>Retour aux commandes</Button>
      </div>
    );
  }

  const handleDelete = () => {
    if (confirm("Supprimer définitivement cette commande ?")) {
      const docRef = doc(firestore, 'orders', order.id);
      deleteDocumentNonBlocking(docRef);
      toast({ title: "Commande supprimée" });
      router.push('/admin/orders');
    }
  };

  const handleUpdateDeliveryType = (newType: 'home' | 'desk') => {
    const tariff = deliveryTariffs.find(t => t.stateName === order.state);
    const newDeliveryCost = tariff ? (newType === 'home' ? tariff.homePrice : tariff.deskPrice) : (order.deliveryCost || 0);
    
    const itemsTotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const newTotal = itemsTotal + newDeliveryCost;

    const docRef = doc(firestore, 'orders', order.id);
    updateDocumentNonBlocking(docRef, {
      deliveryType: newType,
      deliveryCost: newDeliveryCost,
      totalAmount: newTotal
    });

    toast({
      title: "Mode de livraison mis à jour",
      description: `Cout de livraison actualisé: ${newDeliveryCost} DA`,
    });
  };

  const handleUpdateLocation = (field: 'state' | 'commune', value: string) => {
    const updates: any = { [field]: value };
    
    if (field === 'state') {
      updates.commune = '';
      const tariff = deliveryTariffs.find(t => t.stateName === value);
      if (tariff) {
        updates.deliveryCost = order.deliveryType === 'home' ? tariff.homePrice : tariff.deskPrice;
        const itemsTotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        updates.totalAmount = itemsTotal + updates.deliveryCost;
      }
    }

    const docRef = doc(firestore, 'orders', order.id);
    updateDocumentNonBlocking(docRef, updates);
    toast({ title: "Localisation mise à jour" });
  };

  const handleAddProductToOrder = (product: Product) => {
    let currentItems = [...items];
    const existingIndex = currentItems.findIndex(i => i.productId === product.id);
    
    if (existingIndex > -1) {
      currentItems[existingIndex].quantity += 1;
    } else {
      currentItems.push({
        productId: product.id,
        productName: product.name,
        productImage: product.images?.[0] || '',
        quantity: 1,
        price: product.price,
        selectedVariant: ''
      });
    }

    const itemsTotal = currentItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const newTotal = itemsTotal + (order.deliveryCost || 0);

    const docRef = doc(firestore, 'orders', order.id);
    updateDocumentNonBlocking(docRef, {
      items: currentItems,
      totalAmount: newTotal,
      quantity: currentItems.reduce((acc, item) => acc + item.quantity, 0)
    });

    toast({
      title: "Produit ajouté",
      description: `${product.name} a été ajouté à la commande.`
    });
    
    setIsAddProductOpen(false);
  };

  const handleRemoveItem = (index: number) => {
    let currentItems = [...items];
    if (currentItems.length === 1) {
      toast({ variant: "destructive", title: "Impossible", description: "Une commande doit contenir au moins un article." });
      return;
    }

    currentItems.splice(index, 1);
    const itemsTotal = currentItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const newTotal = itemsTotal + (order.deliveryCost || 0);

    const docRef = doc(firestore, 'orders', order.id);
    updateDocumentNonBlocking(docRef, {
      items: currentItems,
      totalAmount: newTotal,
      quantity: currentItems.reduce((acc, item) => acc + item.quantity, 0)
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link href="/admin/orders" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-xs font-black uppercase tracking-widest mb-4">
            <ArrowLeft className="h-3 w-3" />
            Retour à la liste
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black font-headline tracking-tighter uppercase">{order.id}</h1>
            <Badge variant="outline" className="h-7 px-4 font-black uppercase text-[10px]">
              {order.status}
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            Passée le {new Date(order.createdAt).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select 
            value={order.status} 
            onValueChange={(val) => updateOrderStatus(order.id, val as OrderStatus)}
          >
            <SelectTrigger className="w-48 h-12 rounded-xl border-2 border-primary/10 font-bold">
              <SelectValue placeholder="Changer le statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Flux à Traiter</SelectItem>
              <SelectItem value="no_answer">Ne réponde pas</SelectItem>
              <SelectItem value="add_products">Ajouter des produits</SelectItem>
              <SelectItem value="ready">Prêt</SelectItem>
              <SelectItem value="dispatch">Dispatch</SelectItem>
              <SelectItem value="at_office">Au bureau / À domicile</SelectItem>
              <SelectItem value="delivering">En livraison</SelectItem>
              <SelectItem value="delivered">Livrée</SelectItem>
              <SelectItem value="cancelled">Annulée</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl text-destructive border-destructive/20 hover:bg-destructive/10" onClick={handleDelete}>
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="rounded-3xl border-none shadow-xl overflow-hidden bg-white">
            <CardHeader className="bg-muted/30 border-b pb-6 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                Détails du Panier
              </CardTitle>
              
              <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 gap-2 rounded-full font-black text-[10px] uppercase">
                    <Plus className="h-3.5 w-3.5" />
                    Ajouter un article
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-3xl">
                  <DialogHeader className="p-6 bg-muted/30 border-b">
                    <DialogTitle className="text-xl font-black uppercase tracking-tight">Ajouter un produit à l'ordre</DialogTitle>
                  </DialogHeader>
                  <div className="p-6 space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Rechercher par nom ou référence..." 
                        className="pl-10 h-12 rounded-xl border-2 border-muted"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                      />
                    </div>
                    <ScrollArea className="h-[400px]">
                      <div className="grid gap-3 pr-4">
                        {filteredProducts.map(p => (
                          <div key={p.id} className="flex items-center gap-4 p-3 rounded-2xl border hover:bg-muted/30 transition-colors group">
                            <div className="relative h-14 w-14 rounded-xl overflow-hidden border bg-muted shrink-0">
                              {p.images?.[0] ? <Image src={p.images[0]} alt={p.name} fill className="object-cover" /> : null}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm truncate uppercase">{p.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant="outline" className="text-[9px] font-black">{p.price.toLocaleString()} DA</Badge>
                                <span className={cn("text-[9px] font-bold", p.countInStock < 10 ? "text-red-500" : "text-muted-foreground")}>
                                  Stock: {p.countInStock}
                                </span>
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              onClick={() => handleAddProductToOrder(p)}
                              className="h-8 w-8 rounded-full p-0 shrink-0"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        {filteredProducts.length === 0 && (
                          <div className="text-center py-12 text-muted-foreground italic text-sm">
                            Aucun produit trouvé.
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-6 p-6 group hover:bg-muted/5 transition-colors">
                    <div className="relative h-20 w-20 rounded-2xl bg-muted border overflow-hidden shrink-0 shadow-inner">
                      {item.productImage ? (
                        <Image src={item.productImage} alt={item.productName} fill className="object-cover" unoptimized={item.productImage.startsWith('data:')} />
                      ) : <BoxSelect className="h-8 w-8 text-muted-foreground/30 m-auto" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <h3 className="font-black text-sm uppercase">{item.productName}</h3>
                      <div className="flex flex-wrap gap-2">
                        {item.selectedVariant && (
                          <Badge variant="secondary" className="text-[9px] font-bold uppercase">{item.selectedVariant}</Badge>
                        )}
                        <Badge variant="outline" className="text-[9px] font-bold">Qté: {item.quantity}</Badge>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-6">
                      <div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Prix Unitaire</p>
                        <p className="font-black text-primary">{(item.price || 0).toLocaleString()} DA</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveItem(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-8 bg-muted/10 border-t space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-bold uppercase">Sous-total</span>
                  <span className="font-black">{(order.totalAmount - (order.deliveryCost || 0)).toLocaleString()} DA</span>
                </div>
                <div className="flex justify-between text-sm">
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground font-bold uppercase">Livraison ({order.deliveryType === 'home' ? 'Domicile' : 'Bureau'})</span>
                    <span className="text-[10px] text-primary italic font-bold">Tarif automatique basé sur la Wilaya</span>
                  </div>
                  <span className="font-black">{(order.deliveryCost || 0).toLocaleString()} DA</span>
                </div>
                <div className="flex justify-between text-2xl font-black border-t-2 border-dashed pt-4 border-primary/10">
                  <span className="uppercase tracking-tighter">Total à Encaisser</span>
                  <span className="text-primary">{order.totalAmount.toLocaleString()} DA</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg w-fit border border-emerald-100">
                  <DollarSign className="h-3 w-3" />
                  PAIEMENT CASH À LA LIVRAISON (COD)
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="rounded-3xl border-none shadow-xl overflow-hidden bg-white">
            <CardHeader className="bg-primary text-primary-foreground">
              <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                <User className="h-5 w-5" />
                Client
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Nom Complet</label>
                <p className="text-xl font-black">{order.customerName}</p>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Téléphone</label>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                    <Phone className="h-5 w-5" />
                  </div>
                  <p className="text-lg font-black">{order.phone}</p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Destination</label>
                <div className="space-y-3">
                  <Select value={order.state} onValueChange={(val) => handleUpdateLocation('state', val)}>
                    <SelectTrigger className="h-10 border-2 rounded-xl font-bold">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-orange-500" />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {ALGERIA_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <Select value={order.commune} onValueChange={(val) => handleUpdateLocation('commune', val)} disabled={!order.state}>
                    <SelectTrigger className="h-10 border-2 rounded-xl font-bold">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Choisir la commune" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {(ALGERIA_DATA[order.state] || []).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4 border-t flex flex-col gap-3">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Type de livraison</label>
                
                <div className="grid grid-cols-1 gap-2">
                  <Button 
                    variant={order.deliveryType === 'home' ? 'default' : 'outline'}
                    className={cn(
                      "justify-start gap-3 h-12 rounded-xl transition-all",
                      order.deliveryType === 'home' ? "bg-blue-600 hover:bg-blue-700 shadow-lg border-none" : "border-blue-100 text-blue-600"
                    )}
                    onClick={() => handleUpdateDeliveryType('home')}
                  >
                    <Home className="h-4 w-4 shrink-0" />
                    <span className="font-bold text-xs">À DOMICILE</span>
                    {order.deliveryType === 'home' && <CheckCircle2 className="h-3 w-3 ml-auto opacity-50" />}
                  </Button>

                  <Button 
                    variant={order.deliveryType === 'desk' ? 'default' : 'outline'}
                    className={cn(
                      "justify-start gap-3 h-12 rounded-xl transition-all",
                      order.deliveryType === 'desk' ? "bg-indigo-600 hover:bg-indigo-700 shadow-lg border-none" : "border-indigo-100 text-indigo-600"
                    )}
                    onClick={() => handleUpdateDeliveryType('desk')}
                  >
                    <Building2 className="h-4 w-4 shrink-0" />
                    <span className="font-bold text-xs">AU BUREAU (AGENCE)</span>
                    {order.deliveryType === 'desk' && <CheckCircle2 className="h-3 w-3 ml-auto opacity-50" />}
                  </Button>
                </div>
                
                <p className="text-[9px] text-muted-foreground italic font-medium px-1">
                  * Le total de la commande sera automatiquement recalculé selon les tarifs en vigueur pour cette Wilaya.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
