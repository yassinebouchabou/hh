
"use client";

import { useState, useMemo, useEffect, Suspense } from 'react';
import { usePixelCart } from '@/lib/store';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  ShoppingBag, 
  Clock, 
  DollarSign, 
  Search, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  Clipboard,
  Trash2,
  BoxSelect,
  Eye,
  Inbox,
  Truck,
  Archive,
  Download,
  CheckSquare,
  PhoneOff,
  PackagePlus
} from 'lucide-react';
import { Order, OrderStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Checkbox } from '@/components/ui/checkbox';
import * as XLSX from 'xlsx';

function OrdersContent() {
  const { orders, updateOrderStatus } = usePixelCart();
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get('status');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('pending');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  const statusOptions: { label: string; value: OrderStatus | 'all'; icon: any }[] = [
    { label: 'Flux à Traiter', value: 'pending', icon: Inbox },
    { label: 'Ne réponde pas', value: 'no_answer', icon: PhoneOff },
    { label: 'Ajouter des produits', value: 'add_products', icon: PackagePlus },
    { label: 'Prêt', value: 'ready', icon: CheckCircle2 },
    { label: 'Dispatch', value: 'dispatch', icon: Clipboard },
    { label: 'Au bureau / À domicile', value: 'at_office', icon: MapPin },
    { label: 'En livraison', value: 'delivering', icon: Clock },
    { label: 'Livrée', value: 'delivered', icon: ShoppingBag },
    { label: 'Global (Tous)', value: 'all', icon: Archive },
  ];

  useEffect(() => {
    if (statusParam) {
      const validStatus = statusOptions.find(opt => opt.value === statusParam);
      if (validStatus) {
        setStatusFilter(statusParam as OrderStatus | 'all');
      }
    }
  }, [statusParam]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    orders.forEach(order => {
      counts[order.status] = (counts[order.status] || 0) + 1;
    });
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders
      .filter(order => {
        const matchesSearch = 
          order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
          order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.phone.includes(searchTerm) ||
          (order.trackingNumber && order.trackingNumber.includes(searchTerm)) ||
          order.items?.some(i => i.productName.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, searchTerm, statusFilter]);

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">En attente</Badge>;
      case 'no_answer': return <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">Ne réponde pas</Badge>;
      case 'add_products': return <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">Ajouter produits</Badge>;
      case 'ready': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Prêt</Badge>;
      case 'dispatch': return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Dispatch</Badge>;
      case 'at_office': return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">Au bureau / À domicile</Badge>;
      case 'delivering': return <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200">En livraison</Badge>;
      case 'delivered': return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Livrée</Badge>;
      case 'cancelled': return <Badge variant="destructive">Annulée</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const handleStatusChange = (order: Order, newStatus: OrderStatus) => {
    updateOrderStatus(order.id, newStatus);
    toast({
      title: "Statut mis à jour",
      description: `La commande a été déplacée vers la section "${statusOptions.find(o => o.value === newStatus)?.label}".`,
    });
  };

  const handleDeleteOrder = (id: string) => {
    if (confirm("Voulez-vous vraiment supprimer cette commande ?")) {
      const docRef = doc(firestore, 'orders', id);
      deleteDocumentNonBlocking(docRef);
      toast({
        title: "Commande supprimée",
        description: "La commande a été retirée de la base de données.",
      });
    }
  };

  const exportToExcel = () => {
    const ordersToExport = selectedOrders.length > 0 
      ? filteredOrders.filter(o => selectedOrders.includes(o.id))
      : filteredOrders;

    if (ordersToExport.length === 0) {
      toast({ variant: "destructive", title: "Aucune commande à exporter" });
      return;
    }

    const data = ordersToExport.map(order => {
      const itemsString = (order.items || [])
        .map(i => `${i.productName} (x${i.quantity}${i.selectedVariant ? `, ${i.selectedVariant}` : ''})`)
        .join(' | ');
      
      const stateParts = order.state.split(' - ');
      const stateCode = parseInt(stateParts[0], 10);
      const stateName = stateParts[1] || order.state;

      return {
        'reference commande': order.id,
        'nom et prenom du destinataire*': order.customerName,
        'telephone*': order.phone.replace('+213 ', '').trim(),
        'telephone 2': '',
        'wilaya de livraison': stateName,
        'code wilaya*': stateCode,
        'commune de livraison*': order.commune,
        'adresse de livraison*': `${order.commune}, ${stateName}`,
        'produit': itemsString,
        'poids (kg)': '',
        'montant du colis*': order.totalAmount,
        'remarque': '',
        'FRAGILE ( si oui mettez OUI sinon laissez vide )': '',
        'ECHANGE ( si oui mettez OUI sinon laissez vide )': '',
        'PICK UP ( si oui mettez OUI sinon laissez vide )': '',
        'RECOUVREMENT ( si oui mettez OUI sinon laissez vide )': 'OUI',
        'STOP DESK ( si oui mettez OUI sinon laissez vide )': order.deliveryType === 'desk' ? 'OUI' : '',
        'Lien map': ''
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Commandes");

    const wscols = [
      {wch: 20}, {wch: 25}, {wch: 15}, {wch: 15}, {wch: 20}, {wch: 12}, 
      {wch: 20}, {wch: 35}, {wch: 40}, {wch: 10}, {wch: 15}, {wch: 20}, 
      {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 20}
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `import_commandes_outilya_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({ title: "Exportation Excel réussie", description: `${ordersToExport.length} commandes exportées avec les titres requis.` });
  };

  const totalRevenue = orders.reduce((acc, order) => acc + order.totalAmount, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-headline tracking-tight uppercase">Gestion Logistique</h1>
          <p className="text-muted-foreground text-sm">Suivez le déplacement de vos colis en temps réel.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportToExcel} className="gap-2 border-primary/20 text-primary hover:bg-primary/5 rounded-xl h-11">
            <Download className="h-4 w-4" />
            Exporter Excel
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <ScrollArea className="w-full">
          <div className="flex items-center min-w-max p-1">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setStatusFilter(opt.value);
                  setSelectedOrders([]);
                }}
                className={cn(
                  "relative flex items-center gap-3 px-6 py-4 transition-all duration-200 group",
                  statusFilter === opt.value 
                    ? "text-primary font-bold bg-primary/5" 
                    : "text-muted-foreground hover:text-foreground hover:bg-black/[0.02]"
                )}
              >
                <opt.icon className={cn("h-4 w-4", statusFilter === opt.value ? "text-primary" : "text-muted-foreground/50")} />
                <span className="text-sm whitespace-nowrap">{opt.label}</span>
                <span className={cn(
                  "flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full text-[11px] font-black transition-colors",
                  statusFilter === opt.value 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted group-hover:bg-muted-foreground/10"
                )}>
                  {statusCounts[opt.value] || 0}
                </span>
                {statusFilter === opt.value && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary" />
                )}
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="border-none shadow-md bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Volume Inbox</CardTitle>
            <Inbox className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{statusCounts['pending'] || 0} Nouvelles</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">En Transit</CardTitle>
            <Truck className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{orders.filter(o => ['at_office', 'delivering'].includes(o.status)).length} Colis</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Chiffre d'Affaires</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-600">{totalRevenue.toLocaleString()} DA</div>
          </CardContent>
        </Card>
      </div>

      {selectedOrders.length > 0 && (
        <div className="flex items-center gap-4 bg-primary text-primary-foreground p-4 rounded-xl shadow-lg animate-in slide-in-from-top-4 duration-300">
          <CheckSquare className="h-5 w-5" />
          <span className="text-sm font-black uppercase tracking-tight">{selectedOrders.length} Commandes sélectionnées</span>
          <div className="flex-1" />
          <Button variant="secondary" size="sm" onClick={exportToExcel} className="gap-2 font-black text-[10px] uppercase h-8">
            <Download className="h-3 w-3" /> Exporter la sélection (Excel)
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedOrders([])} className="hover:bg-white/10 h-8 text-[10px] font-black uppercase">
            Annuler
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between bg-white p-4 rounded-xl border">
        <div className="flex flex-1 items-center gap-4 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Rechercher client, produit, tracking..." 
              className="pl-10 h-11 border-none bg-muted/30 focus-visible:ring-primary/20 rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) setSelectedOrders(filteredOrders.map(o => o.id));
                    else setSelectedOrders([]);
                  }}
                />
              </TableHead>
              <TableHead className="w-[220px]">Détails Articles</TableHead>
              <TableHead>Client & Contact</TableHead>
              <TableHead>Localisation</TableHead>
              <TableHead>Tracking</TableHead>
              <TableHead>Total (COD)</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-24 text-muted-foreground">
                  <div className="flex flex-col items-center gap-3">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500 opacity-20" />
                    <p className="font-bold">Aucune commande à afficher dans cette section.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => {
                const items = (order.items && order.items.length > 0)
                  ? order.items 
                  : [{ 
                      productName: order.productName, 
                      quantity: order.quantity, 
                      selectedVariant: order.selectedVariant,
                      productImage: order.productImage 
                    }];

                return (
                  <TableRow key={order.id} className={cn("hover:bg-muted/10 transition-colors", selectedOrders.includes(order.id) && "bg-primary/5")}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedOrders.includes(order.id)}
                        onCheckedChange={(checked) => {
                          if (checked) setSelectedOrders(prev => [...prev, order.id]);
                          else setSelectedOrders(prev => prev.filter(id => id !== order.id));
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        {items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 group/item">
                            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center border overflow-hidden relative shrink-0 shadow-sm">
                              {item.productImage ? (
                                <Image 
                                  src={item.productImage} 
                                  alt={item.productName || "item"} 
                                  fill 
                                  className="object-cover" 
                                  unoptimized={item.productImage.startsWith('data:')}
                                />
                              ) : <BoxSelect className="h-5 w-5 opacity-20" />}
                            </div>
                            <div className="flex flex-col leading-tight min-w-0">
                              <span className="text-[10px] font-black truncate max-w-[140px] uppercase">{item.productName}</span>
                              <span className="text-[9px] text-muted-foreground font-bold">
                                {item.quantity}x {item.selectedVariant ? `(${item.selectedVariant})` : ''}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-xs truncate max-w-[120px]">{order.customerName}</div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Phone className="h-2.5 w-2.5 text-primary opacity-60" /> {order.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-[10px] font-black">{order.state}</div>
                      <div className="text-[9px] text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-2.5 w-2.5 opacity-40" /> {order.commune}
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.trackingNumber ? (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/5 border border-primary/10 rounded-md w-fit">
                          <code className="text-[9px] font-black text-primary">{order.trackingNumber}</code>
                        </div>
                      ) : (
                        <span className="text-[9px] text-muted-foreground italic">Non assigné</span>
                      )}
                    </TableCell>
                    <TableCell className="font-black text-primary text-xs whitespace-nowrap">{order.totalAmount.toLocaleString()} DA</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/orders/${order.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10 rounded-lg">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        
                        <Select 
                          value={order.status} 
                          onValueChange={(val) => handleStatusChange(order, val as OrderStatus)}
                        >
                          <SelectTrigger className="w-[120px] h-8 text-[10px] rounded-lg font-bold border-primary/10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.filter(opt => opt.value !== 'all').map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                            <SelectItem value="cancelled" className="text-destructive font-bold">Annulée</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg"
                          onClick={() => handleDeleteOrder(order.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="flex h-96 items-center justify-center font-black uppercase tracking-widest text-muted-foreground opacity-50">Chargement du flux...</div>}>
      <OrdersContent />
    </Suspense>
  );
}
