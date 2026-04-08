
"use client";

import { useMemo } from 'react';
import { usePixelCart } from '@/lib/store';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AdminCustomersPage() {
  const { orders } = usePixelCart();

  // Aggregate customer data from orders
  const customerData = useMemo(() => {
    const customersMap = new Map();

    orders.forEach(order => {
      const name = order.customerName;
      if (!customersMap.has(name)) {
        customersMap.set(name, {
          name,
          totalSpent: 0,
          ordersCount: 0,
          lastOrderDate: order.createdAt,
          location: order.state
        });
      }
      
      const stats = customersMap.get(name);
      stats.totalSpent += order.totalAmount;
      stats.ordersCount += 1;
      if (new Date(order.createdAt) > new Date(stats.lastOrderDate)) {
        stats.lastOrderDate = order.createdAt;
      }
    });

    return Array.from(customersMap.values());
  }, [orders]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Gestion Clients</h1>
        <p className="text-muted-foreground">Consultez votre base de clients et leurs habitudes d'achat.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clients Actifs</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerData.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Fidélité</CardTitle>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customerData.filter(c => c.ordersCount > 1).length} récurrents
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vérification</CardTitle>
            <ShieldCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100% sécurisé</div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom du Client</TableHead>
              <TableHead>Localisation</TableHead>
              <TableHead>Commandes</TableHead>
              <TableHead>Total Dépensé</TableHead>
              <TableHead>Dernier Achat</TableHead>
              <TableHead className="text-right">Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customerData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground italic">
                  Aucun client n'a encore passé de commande.
                </TableCell>
              </TableRow>
            ) : (
              customerData.map((customer, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell className="text-xs">{customer.location}</TableCell>
                  <TableCell>{customer.ordersCount}</TableCell>
                  <TableCell className="font-bold text-primary">{customer.totalSpent.toLocaleString()} DA</TableCell>
                  <TableCell className="text-xs">{new Date(customer.lastOrderDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">Client Actif</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
