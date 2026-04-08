
"use client";

import { usePixelCart } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  ShoppingBag, 
  User, 
  Phone, 
  MapPin, 
  Home, 
  Building2, 
  Loader2,
  ArrowLeft,
  CheckCircle2,
  PackageCheck,
  Search,
  Building,
  Info
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Order, OrderItem } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { ALGERIA_DATA, ALGERIA_STATES } from '@/lib/algeria-data';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, addOrder, settings, deliveryTariffs, clearCart } = usePixelCart();
  
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [deliveryType, setDeliveryType] = useState<'home' | 'desk'>('home');
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '+213 ',
    state: '',
    commune: ''
  });

  const [stateSearch, setStateSearch] = useState('');
  const [communeSearch, setCommuneSearch] = useState('');

  const filteredStates = useMemo(() => {
    return ALGERIA_STATES.filter(s => s.toLowerCase().includes(stateSearch.toLowerCase()));
  }, [stateSearch]);

  const communesForState = useMemo(() => {
    if (!formData.state) return [];
    const list = ALGERIA_DATA[formData.state] || [];
    return list.filter(c => c.toLowerCase().includes(communeSearch.toLowerCase()));
  }, [formData.state, communeSearch]);

  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [cart]);

  const deliveryCost = useMemo(() => {
    if (!formData.state) return 0;
    const tariff = deliveryTariffs.find(t => t.stateName === formData.state);
    if (!tariff) return 0;
    return deliveryType === 'home' ? tariff.homePrice : tariff.deskPrice;
  }, [formData.state, deliveryType, deliveryTariffs]);

  const currentTariff = useMemo(() => {
    if (!formData.state) return null;
    return deliveryTariffs.find(t => t.stateName === formData.state);
  }, [formData.state, deliveryTariffs]);

  const communeOfficeCount = useMemo(() => {
    if (!formData.state || !formData.commune || !currentTariff) return 0;
    return currentTariff.communeDesktops?.[formData.commune] || 0;
  }, [formData.state, formData.commune, currentTariff]);

  const communeOfficeAddress = useMemo(() => {
    if (!formData.state || !formData.commune || !currentTariff) return '';
    return currentTariff.communeAddresses?.[formData.commune] || '';
  }, [formData.state, formData.commune, currentTariff]);

  const total = subtotal + deliveryCost;

  useEffect(() => {
    if (cart.length === 0 && !isSuccess) {
      router.push('/shop');
    }
  }, [cart, isSuccess, router]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    const prefix = '+213 ';
    
    if (!val.startsWith(prefix)) {
      val = prefix;
    }
    
    const digits = val.slice(prefix.length).replace(/\D/g, '').slice(0, 10);
    setFormData({ ...formData, phone: prefix + digits });
  };

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneDigits = formData.phone.replace('+213 ', '').trim();
    
    if (!formData.fullName || phoneDigits.length < 8 || !formData.state || !formData.commune) {
      toast({ 
        variant: "destructive", 
        title: "بيانات ناقصة", 
        description: "يرجى ملء جميع الحقول وادخال رقم هاتف صحيح." 
      });
      return;
    }

    setPurchaseLoading(true);

    try {
      const orderItems: OrderItem[] = cart.map(item => ({
        productId: item.id,
        productName: item.name,
        productImage: (item.images && item.images.length > 0) ? item.images[0] : '',
        quantity: item.quantity,
        price: item.price,
        selectedVariant: item.selectedVariant || ''
      }));

      const newOrder: Order = {
        id: 'ORD-' + Math.random().toString(36).substring(2, 11).toUpperCase(),
        customerName: formData.fullName,
        phone: formData.phone,
        state: formData.state,
        commune: formData.commune,
        productId: orderItems[0]?.productId || '',
        productName: orderItems[0]?.productName || '',
        productImage: orderItems[0]?.productImage || '',
        quantity: orderItems.reduce((acc, i) => acc + i.quantity, 0),
        selectedVariant: orderItems[0]?.selectedVariant || '',
        items: orderItems,
        totalAmount: total,
        deliveryType: deliveryType,
        deliveryCost: deliveryCost,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      addOrder(newOrder);
      setIsSuccess(true);
      clearCart();
      toast({
        title: "تم إرسال طلبك بنجاح!",
        description: settings.checkoutSuccessMsgAr || "شكرا، سنتصل بك قريبا لتأكيد الطلب.",
      });
    } catch (error) {
      console.error("Checkout error:", error);
      toast({ variant: "destructive", title: "خطأ", description: "تعذر إرسال الطلب، حاول مرة أخرى." });
    } finally {
      setPurchaseLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center animate-in zoom-in duration-500">
        <div className="h-24 w-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="h-14 w-14 text-emerald-600" />
        </div>
        <h1 className="text-4xl font-black mb-4">تم استلام طلبك!</h1>
        <p className="text-muted-foreground text-lg max-w-md mb-8">
          {settings.checkoutSuccessMsgAr || "شكرا لك! سنتواصل معك هاتفياً خلال الساعات القادمة لتأكيد تفاصيل الشحن."}
        </p>
        <Button size="lg" className="rounded-2xl px-10 h-14 text-lg font-bold" onClick={() => router.push('/shop')}>
          العودة للتسوق
        </Button>
      </div>
    );
  }

  const checkoutStyles = {
    '--checkout-accent': `hsl(${settings.checkoutColor || settings.primaryColor})`,
    '--checkout-bg': `hsl(${settings.checkoutBgColor || "0 0% 100%"})`,
    '--checkout-badge': `hsl(${settings.priceBadgeColor || "24 95% 53%"})`
  } as React.CSSProperties;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-in fade-in duration-500" dir="rtl" style={checkoutStyles}>
      <Button variant="ghost" className="mb-8 gap-2" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" />
        العودة للسلة
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <PackageCheck className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-black">ملخص طلبك</h2>
          </div>
          
          <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden bg-white">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pl-2">
                {cart.map((item, idx) => (
                  <div key={`${item.id}-${idx}`} className="flex items-center gap-4 group">
                    <div className="relative h-16 w-16 rounded-xl overflow-hidden border bg-muted flex-shrink-0">
                      <Image src={(item.images && item.images.length > 0) ? item.images[0] : ''} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm truncate">{item.name}</h3>
                      <p className="text-[10px] text-muted-foreground">
                        {item.selectedVariant ? `النوع: ${item.selectedVariant} • ` : ''}
                        {item.quantity} قطعة
                      </p>
                    </div>
                    <div className="text-sm font-black text-primary">
                      {(item.price * item.quantity).toLocaleString()} دج
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-3 px-2 pb-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">المجموع الفرعي:</span>
                  <span className="font-bold">{subtotal.toLocaleString()} دج</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">مصاريف الشحن:</span>
                  <span className="font-bold">
                    {formData.state ? `${deliveryCost.toLocaleString()} دج` : "اختر الولاية"}
                  </span>
                </div>
                <div className="flex justify-between text-xl font-black pt-2 border-t border-dashed">
                  <span>المجموع الكلي:</span>
                  <span className="text-primary">{total.toLocaleString()} دج</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-primary shadow-sm shrink-0">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold leading-relaxed text-primary/80">
              جميع الطلبات يتم الدفع فيها نقداً عند الاستلام (COD). سيتم الاتصال بك لتأكيد الطلب.
            </p>
          </div>
        </div>

        <div className="lg:col-span-7">
          <Card 
            className="border-[var(--checkout-accent)]/30 shadow-[0_30px_60px_rgba(0,0,0,0.1)] rounded-[2.5rem] overflow-hidden border-2"
            style={{ backgroundColor: 'var(--checkout-bg)' }}
          >
            <div className="bg-[var(--checkout-accent)]/5 p-8 border-b border-[var(--checkout-accent)]/10 text-center">
              <h2 className="text-3xl font-black text-[var(--checkout-accent)] flex items-center justify-center gap-4">
                <User className="h-8 w-8" />
                {settings.checkoutTitleAr || "تأكيد معلومات الشحن"}
              </h2>
            </div>
            
            <CardContent className="p-10">
              <form onSubmit={handleConfirmOrder} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-sm font-black text-muted-foreground mr-1">{settings.nameLabelAr || "الاسم الكامل"}</Label>
                    <div className="relative">
                      <User className="absolute right-4 top-4 h-5 w-5 text-[var(--checkout-accent)]" />
                      <Input 
                        placeholder={settings.nameLabelAr || "الاسم الكامل"} 
                        className="pr-12 h-14 border-2 border-[var(--checkout-accent)]/10 focus:border-[var(--checkout-accent)] rounded-2xl text-lg font-bold"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-black text-muted-foreground mr-1">{settings.phoneLabelAr || "رقم الهاتف"}</Label>
                    <div className="relative">
                      <Phone className="absolute right-4 top-4 h-5 w-5 text-[var(--checkout-accent)]" />
                      <Input 
                        placeholder={settings.phoneLabelAr || "رقم الهاتف"} 
                        type="tel"
                        className="pr-12 h-14 border-2 border-[var(--checkout-accent)]/10 focus:border-[var(--checkout-accent)] rounded-2xl text-lg font-bold"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-sm font-black text-muted-foreground mr-1">{settings.stateLabelAr || "الولاية"}</Label>
                    <Select 
                      value={formData.state}
                      onValueChange={(value) => setFormData({ ...formData, state: value, commune: '' })} 
                      required
                    >
                      <SelectTrigger className="h-14 border-2 border-[var(--checkout-accent)]/10 rounded-2xl text-lg font-bold">
                        <SelectValue placeholder={settings.stateLabelAr || "الولاية"} />
                      </SelectTrigger>
                      <SelectContent className="p-0 overflow-hidden">
                        <div className="p-2 border-b bg-muted/20">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              placeholder="بحث..." 
                              className="pl-9 h-9 text-xs rounded-lg"
                              value={stateSearch}
                              onChange={(e) => setStateSearch(e.target.value)}
                            />
                          </div>
                        </div>
                        <ScrollArea className="h-60">
                          {filteredStates.map((state) => (
                            <SelectItem key={state} value={state} className="font-bold">
                              {state}
                            </SelectItem>
                          ))}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-black text-muted-foreground mr-1">{settings.communeLabelAr || "البلدية"}</Label>
                    <Select
                      value={formData.commune}
                      onValueChange={(val) => setFormData({ ...formData, commune: val })}
                      disabled={!formData.state}
                      required
                    >
                      <SelectTrigger className="h-14 border-2 border-[var(--checkout-accent)]/10 rounded-2xl text-lg font-bold">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-[var(--checkout-accent)]" />
                          <SelectValue placeholder={formData.state ? (settings.communeLabelAr || "البلدية") : "اختر الولاية أولاً"} />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="p-0 overflow-hidden">
                        <div className="p-2 border-b bg-muted/20">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              placeholder="بحث..." 
                              className="pl-9 h-9 text-xs rounded-lg"
                              value={communeSearch}
                              onChange={(e) => setCommuneSearch(e.target.value)}
                            />
                          </div>
                        </div>
                        <ScrollArea className="h-60">
                          {communesForState.map((commune) => {
                            const stateTariff = deliveryTariffs.find(t => t.stateName === formData.state);
                            const officeCount = stateTariff?.communeDesktops?.[commune] || 0;
                            return (
                              <SelectItem key={commune} value={commune} className="font-bold">
                                <div className="flex items-center justify-between w-full gap-4">
                                  <span>{commune}</span>
                                  {officeCount > 0 && (
                                    <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-emerald-100 text-emerald-700 border-emerald-200">
                                      {officeCount} مكتب
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            );
                          })}
                          {communesForState.length === 0 && (
                            <div className="p-4 text-center text-xs text-muted-foreground italic">لا توجد نتائج</div>
                          )}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                    
                    {communeOfficeCount > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 animate-in slide-in-from-top-2">
                          <Building className="h-3 w-3" />
                          <span>{communeOfficeCount} bureaux de retrait disponibles dans cette ville</span>
                        </div>
                        
                        {communeOfficeAddress && (
                          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-[10px] text-blue-700 font-bold flex items-start gap-2 animate-in slide-in-from-top-2">
                            <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            <div>
                              <span className="block uppercase text-[8px] opacity-70 mb-0.5">عنوان مكتب الاستلام:</span>
                              {communeOfficeAddress}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-black text-muted-foreground mr-1">طريقة التوصيل:</Label>
                  <RadioGroup 
                    value={deliveryType} 
                    onValueChange={(val: 'home' | 'desk') => setDeliveryType(val)}
                    className="grid grid-cols-2 gap-6"
                  >
                    <div className="relative group">
                      <RadioGroupItem value="home" id="home" className="peer sr-only" />
                      <Label
                        htmlFor="home"
                        className="flex flex-1 flex-col items-center justify-center p-6 rounded-3xl border-2 cursor-pointer transition-all peer-data-[state=checked]:border-[var(--checkout-accent)] peer-data-[state=checked]:bg-[var(--checkout-accent)]/5 border-border hover:border-[var(--checkout-accent)]/40 shadow-sm"
                      >
                        <Home className="h-8 w-8 mb-3 text-[var(--checkout-accent)]" />
                        <span className="font-black text-sm">توصيل للمنزل</span>
                      </Label>
                    </div>
                    <div className="relative group">
                      <RadioGroupItem value="desk" id="desk" className="peer sr-only" />
                      <Label
                        htmlFor="desk"
                        className="flex flex-1 flex-col items-center justify-center p-6 rounded-3xl border-2 cursor-pointer transition-all peer-data-[state=checked]:border-[var(--checkout-accent)] peer-data-[state=checked]:bg-[var(--checkout-accent)]/5 border-border hover:border-[var(--checkout-accent)]/40 shadow-sm"
                      >
                        <Building2 className="h-8 w-8 mb-3 text-[var(--checkout-accent)]" />
                        <span className="font-black text-sm">استلام من المكتب</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="relative pt-12">
                  <div 
                    className="absolute -top-4 left-10 z-20 text-white px-8 py-3 rounded-full font-black text-xl shadow-2xl transform -rotate-6 animate-bounce flex flex-col items-center border-2 border-white/20"
                    style={{ background: `var(--checkout-badge)` }}
                  >
                    <span>{total.toLocaleString()} دج</span>
                    {deliveryCost > 0 && (
                      <span className="text-[9px] opacity-90 font-bold">(شامل التوصيل)</span>
                    )}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-20 text-3xl font-black rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] transition-all hover:scale-[1.02] active:scale-95 gap-4" 
                    style={{ backgroundColor: 'var(--checkout-accent)' }}
                    disabled={purchaseLoading}
                  >
                    {purchaseLoading ? <Loader2 className="h-10 w-10 animate-spin" /> : <ShoppingBag className="h-10 w-10" />}
                    {settings.checkoutButtonTextAr || "تأكيد الطلبية"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
