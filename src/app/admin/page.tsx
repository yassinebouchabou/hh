
"use client";

import { usePixelCart } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Package, 
  ShoppingBag, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Bell,
  X,
  ChevronRight,
  AlertTriangle,
  BarChart3,
  Award,
  MapPin,
  Wallet
} from 'lucide-react';
import { 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Legend
} from 'recharts';
import { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AdminDashboard() {
  const { products, orders } = usePixelCart();
  const [newOrderNotify, setNewOrderNotify] = useState<string | null>(null);
  const [initialCount, setInitialCount] = useState<number | null>(null);

  // Calculate low stock products (less than 10)
  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.countInStock < 10);
  }, [products]);

  // Real-time Notification Logic
  useEffect(() => {
    if (orders.length > 0 && initialCount === null) {
      setInitialCount(orders.length);
    }
    
    if (initialCount !== null && orders.length > initialCount) {
      const latestOrder = [...orders].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
      
      if (latestOrder) {
        setNewOrderNotify(latestOrder.customerName);
        setInitialCount(orders.length);
      }
    }
  }, [orders, initialCount]);

  // Financial Calculations
  const analytics = useMemo(() => {
    let totalRevenue = 0;
    let totalProfit = 0;
    const productSales: Record<string, { name: string, qty: number, revenue: number, image?: string }> = {};
    const statePerformance: Record<string, number> = {};

    orders.forEach(order => {
      totalRevenue += order.totalAmount;
      statePerformance[order.state] = (statePerformance[order.state] || 0) + 1;

      // Calculate profit per order
      let orderCost = 0;
      const items = order.items || [];
      
      items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        const purchasePrice = product?.purchasePrice || (product?.price ? product.price * 0.7 : 0); // Fallback to 70% if no purchase price
        orderCost += (item.quantity * purchasePrice);

        // Best sellers tracking
        if (!productSales[item.productId]) {
          productSales[item.productId] = { name: item.productName, qty: 0, revenue: 0, image: item.productImage };
        }
        productSales[item.productId].qty += item.quantity;
        productSales[item.productId].revenue += (item.quantity * item.price);
      });

      // Simple profit: (Total - Shipping) - Cost
      const revenueExShipping = order.totalAmount - (order.deliveryCost || 0);
      totalProfit += (revenueExShipping - orderCost);
    });

    const bestSellers = Object.values(productSales)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    const topStates = Object.entries(statePerformance)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const aov = orders.length > 0 ? totalRevenue / orders.length : 0;

    return { totalRevenue, totalProfit, bestSellers, topStates, aov };
  }, [orders, products]);

  const stats = useMemo(() => [
    { title: "Produits Totaux", value: products.length, icon: Package, color: "text-blue-500", desc: "Inventaire actif" },
    { title: "Commandes Actives", value: orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length, icon: ShoppingBag, color: "text-emerald-500", desc: "En cours" },
    { title: "Chiffre d'Affaires", value: `${analytics.totalRevenue.toLocaleString()} DA`, icon: DollarSign, color: "text-orange-500", desc: "Revenu brut" },
    { title: "Profit Estimé", value: `${Math.round(analytics.totalProfit).toLocaleString()} DA`, icon: Wallet, color: "text-purple-500", desc: "Marge après coûts" },
  ], [products.length, orders, analytics]);

  // Chart Data: Last 7 Days Revenue vs Profit
  const chartData = useMemo(() => {
    const dates = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return dates.map(date => {
      const dayOrders = orders.filter(o => o.createdAt.split('T')[0] === date);
      let dayRev = 0;
      let dayProfit = 0;

      dayOrders.forEach(o => {
        dayRev += o.totalAmount;
        let dayCost = 0;
        (o.items || []).forEach(item => {
          const product = products.find(p => p.id === item.productId);
          const cost = product?.purchasePrice || (product?.price ? product.price * 0.7 : 0);
          dayCost += (item.quantity * cost);
        });
        dayProfit += ((o.totalAmount - (o.deliveryCost || 0)) - dayCost);
      });

      return {
        name: new Date(date).toLocaleDateString('fr-FR', { weekday: 'short' }),
        revenue: dayRev,
        profit: Math.round(dayProfit)
      };
    });
  }, [orders, products]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Notifications */}
      {newOrderNotify && (
        <div className="animate-in slide-in-from-top-4 fade-in duration-500">
          <div className="flex items-center justify-between p-4 bg-primary text-primary-foreground rounded-2xl shadow-2xl border-4 border-white/20">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center animate-bounce">
                <Bell className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-black text-sm uppercase tracking-tighter">Nouvelle Commande !</p>
                <p className="text-[11px] opacity-90 font-bold">{newOrderNotify} vient de passer commande.</p>
              </div>
            </div>
            <Link href="/admin/orders">
              <Button size="sm" className="bg-white text-primary hover:bg-white/90 font-black text-[10px] uppercase rounded-xl">Voir Commandes</Button>
            </Link>
          </div>
        </div>
      )}

      {/* Low Stock Alerts */}
      {lowStockProducts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="h-5 w-5" />
            <h2 className="text-sm font-black uppercase tracking-tighter">Alertes de Stock ({lowStockProducts.length})</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockProducts.slice(0, 3).map(product => (
              <div key={product.id} className="p-4 bg-white border-2 border-orange-100 rounded-2xl shadow-sm flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-orange-50 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate max-w-[120px]">{product.name}</p>
                    <p className="text-[9px] font-black text-orange-600 uppercase">{product.countInStock} restants</p>
                  </div>
                </div>
                <Link href={`/admin/products/${product.id}/edit`}>
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-orange-50"><ChevronRight className="h-4 w-4" /></Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-black font-headline tracking-tight uppercase">Dashboard Analytics</h1>
        <p className="text-muted-foreground text-sm">Aperçu financier et performances de vente.</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="hover:shadow-xl transition-all border-none shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black tracking-tight">{stat.value}</div>
              <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase opacity-60">{stat.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Profit vs Revenue Chart */}
        <Card className="lg:col-span-4 border-none shadow-md overflow-hidden">
          <CardHeader className="bg-muted/30 pb-6 border-b">
            <CardTitle className="flex items-center gap-2 text-lg font-black uppercase tracking-tight">
              <TrendingUp className="h-5 w-5 text-primary" />
              Profit vs Revenu
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-wider">Évolution financière des 7 derniers jours</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] pt-8">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }}
                  tickFormatter={(value) => `${value} DA`} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '10px', marginBottom: '8px' }}
                />
                <Legend iconType="circle" />
                <Line 
                  name="Revenu"
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={4} 
                  dot={{ r: 4, fill: 'white', strokeWidth: 3, stroke: 'hsl(var(--primary))' }}
                />
                <Line 
                  name="Profit"
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#8b5cf6" 
                  strokeWidth={4} 
                  dot={{ r: 4, fill: 'white', strokeWidth: 3, stroke: '#8b5cf6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Best Selling Products */}
        <Card className="lg:col-span-3 border-none shadow-md">
          <CardHeader className="bg-primary/5 pb-6 border-b">
            <CardTitle className="flex items-center gap-2 text-lg font-black uppercase tracking-tight">
              <Award className="h-5 w-5 text-primary" />
              Best-Sellers
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-wider">Top 5 des articles les plus vendus</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {analytics.bestSellers.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 group">
                  <div className="relative h-12 w-12 rounded-xl bg-muted border overflow-hidden shrink-0">
                    {item.image ? <img src={item.image} alt={item.name} className="object-cover h-full w-full" /> : <Package className="h-6 w-6 m-auto opacity-20" />}
                    <div className="absolute top-0 left-0 bg-primary text-white text-[8px] font-black px-1.5 py-0.5 rounded-br-lg">#{idx + 1}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black uppercase truncate">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground font-bold">{item.qty} unités vendues</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-primary">{item.revenue.toLocaleString()} DA</p>
                  </div>
                </div>
              ))}
              {analytics.bestSellers.length === 0 && (
                <div className="text-center py-12 opacity-50">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Aucune donnée de vente</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer Insights */}
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-black uppercase tracking-tight">
              <Users className="h-5 w-5 text-primary" />
              Customer Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/30 rounded-2xl border-2 border-dashed">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1">Panier Moyen (AOV)</p>
                <p className="text-xl font-black text-primary">{Math.round(analytics.aov).toLocaleString()} DA</p>
              </div>
              <div className="p-4 bg-muted/30 rounded-2xl border-2 border-dashed">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1">Taux de Rétention</p>
                <p className="text-xl font-black text-primary">100%</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <MapPin className="h-3 w-3" />
                Performance par Wilaya
              </h4>
              <div className="space-y-3">
                {analytics.topStates.map(([state, count]) => (
                  <div key={state} className="flex items-center justify-between p-3 bg-white rounded-xl border group hover:border-primary transition-colors">
                    <span className="text-xs font-bold uppercase">{state}</span>
                    <Badge variant="secondary" className="font-black text-[10px] group-hover:bg-primary group-hover:text-white">{count} Commandes</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity (Existing) */}
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-black uppercase tracking-tight">Activités Récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[350px] pr-4">
              <div className="space-y-6">
                {orders.slice(0, 8).map((order) => (
                  <div key={order.id} className="flex items-center gap-4 group">
                    <div className="h-2 w-2 rounded-full bg-primary shrink-0 group-hover:scale-150 transition-transform" />
                    <div className="flex-1 space-y-1">
                      <p className="text-xs font-black leading-none uppercase truncate">
                        {order.customerName}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-bold italic">
                        {order.totalAmount.toLocaleString()} DA • {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[8px] font-black uppercase">{order.status}</Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
