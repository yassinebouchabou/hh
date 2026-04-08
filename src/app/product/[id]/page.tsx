
"use client";

import { useParams, useRouter } from 'next/navigation';
import { usePixelCart } from '@/lib/store';
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
import { useState, useMemo, useEffect } from 'react';
import { 
  ShoppingCart, 
  ArrowLeft, 
  ShieldCheck, 
  Truck, 
  RefreshCw, 
  User, 
  Phone, 
  ShoppingBag, 
  Plus, 
  Minus, 
  MapPin, 
  ChevronLeft, 
  ChevronRight, 
  Tags, 
  Layers,
  Home,
  Building2,
  Loader2,
  Search,
  Building
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Order, ProductVariant, OrderItem } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { ALGERIA_DATA, ALGERIA_STATES } from '@/lib/algeria-data';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ProductDetailPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';
  const router = useRouter();
  const { products, addToCart, addOrder, settings, deliveryTariffs } = usePixelCart();
  const product = id ? products.find(p => p.id === id) : null;
  
  const [quantity, setQuantity] = useState(1);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [deliveryType, setDeliveryType] = useState<'home' | 'desk'>('home');
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '+213 ',
    state: '',
    commune: ''
  });

  const [stateSearch, setStateSearch] = useState('');
  const [communeSearch, setCommuneSearch] = useState('');

  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
    }
  }, [product]);

  const filteredStates = useMemo(() => {
    return ALGERIA_STATES.filter(s => s.toLowerCase().includes(stateSearch.toLowerCase()));
  }, [stateSearch]);

  const communesForState = useMemo(() => {
    if (!formData.state) return [];
    const list = ALGERIA_DATA[formData.state] || [];
    return list.filter(c => c.toLowerCase().includes(communeSearch.toLowerCase()));
  }, [formData.state, communeSearch]);

  const currentPrice = useMemo(() => {
    if (selectedVariant) return selectedVariant.price;
    return product?.price || 0;
  }, [selectedVariant, product]);

  const currentStock = useMemo(() => {
    if (selectedVariant) return selectedVariant.countInStock;
    return product?.countInStock || 0;
  }, [selectedVariant, product]);

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

  const totalWithShipping = useMemo(() => {
    return (currentPrice * quantity) + deliveryCost;
  }, [currentPrice, quantity, deliveryCost]);

  const productImages = useMemo(() => {
    if (!product || !product.images || product.images.length === 0) {
      return ['https://picsum.photos/seed/placeholder/800/800'];
    }
    return product.images;
  }, [product]);

  if (!id || !product) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Chargement du produit...</p>
      </div>
    );
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    const prefix = '+213 ';
    
    if (!val.startsWith(prefix)) {
      val = prefix;
    }
    
    const digits = val.slice(prefix.length).replace(/\D/g, '').slice(0, 10);
    setFormData({ ...formData, phone: prefix + digits });
  };

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedVariant?.name);
    toast({
      title: "Ajouté au panier",
      description: `${quantity} ${product.name} ajouté(s).`,
    });
  };

  const handleQuickPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    
    const phoneDigits = formData.phone.replace('+213 ', '').trim();
    if (!formData.fullName || phoneDigits.length < 8 || !formData.state || !formData.commune) {
      toast({
        variant: "destructive",
        title: "معلومات ناقصة",
        description: "يرجى ملء جميع الحقول وادخال رقم هاتف صحيح لإكمال الطلب.",
      });
      return;
    }

    setPurchaseLoading(true);

    const newOrder: Order = {
      id: 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      customerName: formData.fullName,
      phone: formData.phone,
      state: formData.state,
      commune: formData.commune,
      productId: product.id,
      productName: product.name,
      productImage: productImages[0],
      quantity: quantity,
      totalAmount: totalWithShipping,
      deliveryType: deliveryType,
      deliveryCost: deliveryCost,
      selectedVariant: selectedVariant?.name || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      items: [{
        productId: product.id,
        productName: product.name,
        productImage: productImages[0],
        quantity: quantity,
        price: currentPrice,
        selectedVariant: selectedVariant?.name || ''
      }]
    };

    addOrder(newOrder);

    setPurchaseLoading(false);
    toast({
      title: "تم إرسال طلبك بنجاح!",
      description: `${settings.checkoutSuccessMsgAr || "شكرا، سنتصل بك قريبا لتأكيد الطلب."}`,
    });
    
    setFormData({ fullName: '', phone: '+213 ', state: '', commune: '' });
    setQuantity(1);
  };

  const checkoutStyles = {
    '--checkout-accent': `hsl(${settings.checkoutColor || settings.primaryColor})`,
    '--checkout-bg': `hsl(${settings.checkoutBgColor || "0 0% 100%"})`,
    '--checkout-badge': `hsl(${settings.priceBadgeColor || "24 95% 53%"})`
  } as React.CSSProperties;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-in fade-in duration-500">
      <Button variant="ghost" className="mb-6 gap-2" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" />
        العودة للمتجر
      </Button>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-start">
        <div className="space-y-6 lg:sticky lg:top-24">
          <div className="relative aspect-square overflow-hidden rounded-3xl bg-white shadow-2xl border border-primary/5 group">
            <Image
              src={productImages[currentImageIndex]}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
            
            {productImages.length > 1 && (
              <>
                <Button 
                  variant="ghost" size="icon" 
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full shadow-lg z-10"
                  onClick={() => setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length)}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button 
                  variant="ghost" size="icon" 
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full shadow-lg z-10"
                  onClick={() => setCurrentImageIndex((prev) => (prev + 1) % productImages.length)}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
            
            {product.originalPrice && product.originalPrice > product.price && (
              <div className="absolute top-6 left-6 bg-red-600 text-white px-4 py-1 rounded-full font-black text-sm animate-pulse shadow-xl z-10">
                -{Math.round((1 - product.price / product.originalPrice) * 100)}%
              </div>
            )}
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-2">
            {productImages.map((img, i) => (
              <button 
                key={i}
                className={`relative h-20 w-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${i === currentImageIndex ? 'border-primary ring-4 ring-primary/20 scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}
                onClick={() => setCurrentImageIndex(i)}
              >
                <Image src={img} alt={`Thumb ${i}`} fill className="object-cover" />
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center p-4 text-center border rounded-2xl bg-card shadow-sm">
              <Truck className="mb-2 h-6 w-6 text-primary" />
              <p className="text-[10px] font-black uppercase tracking-widest">توصيل سريع</p>
            </div>
            <div className="flex flex-col items-center p-4 text-center border rounded-2xl bg-card shadow-sm">
              <RefreshCw className="mb-2 h-6 w-6 text-primary" />
              <p className="text-[10px] font-black uppercase tracking-widest">ضمان حقيقي</p>
            </div>
            <div className="flex flex-col items-center p-4 text-center border rounded-2xl bg-card shadow-sm">
              <ShieldCheck className="mb-2 h-6 w-6 text-primary" />
              <p className="text-[10px] font-black uppercase tracking-widest">أصلي 100%</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-6" dir="rtl" style={checkoutStyles}>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-primary/10 text-primary border-none text-xs px-3 py-1">{product.category}</Badge>
              {product.tags?.map(tag => (
                <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
              ))}
            </div>
            
            <h1 className="font-headline text-3xl font-black lg:text-4xl text-foreground leading-tight">{product.name}</h1>
            
            <div className="flex items-baseline gap-4">
              <span className="text-3xl font-black text-primary">{currentPrice.toLocaleString()} دج</span>
              {product.originalPrice && product.originalPrice > currentPrice && (
                <span className="text-lg text-muted-foreground/60 line-through font-bold">
                  {product.originalPrice.toLocaleString()} دج
                </span>
              )}
            </div>
          </div>

          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-black flex items-center gap-2 text-muted-foreground">
                <Layers className="h-3 w-3 text-primary" /> اختر النوع:
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.name}
                    className={`p-2.5 text-xs rounded-xl border-2 transition-all font-bold ${selectedVariant?.name === v.name ? 'border-primary bg-primary/5 shadow-md' : 'border-border bg-white hover:border-primary/40'}`}
                    onClick={() => setSelectedVariant(v)}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Card 
            className="border-[var(--checkout-accent)]/30 shadow-[0_15px_40px_rgba(0,0,0,0.15)] rounded-[2.5rem] overflow-hidden border-2"
            style={{ backgroundColor: 'var(--checkout-bg)' }}
          >
            <div className="bg-[var(--checkout-accent)]/5 p-5 border-b border-[var(--checkout-accent)]/10 text-center">
              <h2 className="text-xl font-black text-[var(--checkout-accent)] flex items-center justify-center gap-3">
                <ShoppingBag className="h-5 w-5" />
                {settings.checkoutTitleAr || "املأ البيانات للطلب"}
              </h2>
            </div>
            <CardContent className="p-6 md:p-8 space-y-6">
              <form onSubmit={handleQuickPurchase} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground mr-1 uppercase tracking-wider">{settings.nameLabelAr || "الاسم الكامل"}</Label>
                    <div className="relative">
                      <User className="absolute right-4 top-3.5 h-4 w-4 text-[var(--checkout-accent)]" />
                      <Input 
                        placeholder={settings.nameLabelAr || "الاسم الكامل"} 
                        className="pr-12 h-12 border-2 border-[var(--checkout-accent)]/10 focus:border-[var(--checkout-accent)] rounded-2xl text-lg"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground mr-1 uppercase tracking-wider">{settings.phoneLabelAr || "رقم الهاتف"}</Label>
                    <div className="relative">
                      <Phone className="absolute right-4 top-3.5 h-4 w-4 text-[var(--checkout-accent)]" />
                      <Input 
                        placeholder={settings.phoneLabelAr || "رقم الهاتف"} 
                        type="tel"
                        className="pr-12 h-12 border-2 border-[var(--checkout-accent)]/10 focus:border-[var(--checkout-accent)] rounded-2xl text-lg"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground mr-1 uppercase tracking-wider">{settings.stateLabelAr || "الولاية"}</Label>
                    <Select 
                      value={formData.state}
                      onValueChange={(value) => setFormData({ ...formData, state: value, commune: '' })} 
                      required
                    >
                      <SelectTrigger className="h-12 border-2 border-[var(--checkout-accent)]/10 rounded-2xl text-lg">
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
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground mr-1 uppercase tracking-wider">{settings.communeLabelAr || "البلدية"}</Label>
                    <Select
                      value={formData.commune}
                      onValueChange={(val) => setFormData({ ...formData, commune: val })}
                      disabled={!formData.state}
                      required
                    >
                      <SelectTrigger className="h-12 border-2 border-[var(--checkout-accent)]/10 rounded-2xl text-lg">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-[var(--checkout-accent)]" />
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
                              <SelectItem key={commune} value={commune}>
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
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                    
                    {communeOfficeCount > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[9px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 animate-in slide-in-from-top-2">
                          <Building className="h-2.5 w-2.5" />
                          <span>{communeOfficeCount} bureaux de retrait disponibles</span>
                        </div>
                        
                        {communeOfficeAddress && (
                          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-[9px] text-blue-700 font-bold flex items-start gap-2 animate-in slide-in-from-top-2">
                            <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
                            <div>
                              <span className="block uppercase text-[7px] opacity-70 mb-0.5">عنوان مكتب الاستلام:</span>
                              {communeOfficeAddress}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground mr-1 uppercase tracking-wider">طريقة التوصيل:</Label>
                  <RadioGroup 
                    value={deliveryType} 
                    onValueChange={(val: 'home' | 'desk') => setDeliveryType(val)}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div className="relative">
                      <RadioGroupItem value="home" id="home" className="peer sr-only" />
                      <Label
                        htmlFor="home"
                        className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all peer-data-[state=checked]:border-[var(--checkout-accent)] peer-data-[state=checked]:bg-[var(--checkout-accent)]/5 border-border hover:border-[var(--checkout-accent)]/40"
                      >
                        <Home className="h-6 w-6 mb-2 text-[var(--checkout-accent)]" />
                        <span className="font-bold text-xs">إلى المنزل</span>
                      </Label>
                    </div>
                    <div className="relative">
                      <RadioGroupItem value="desk" id="desk" className="peer sr-only" />
                      <Label
                        htmlFor="desk"
                        className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all peer-data-[state=checked]:border-[var(--checkout-accent)] peer-data-[state=checked]:bg-[var(--checkout-accent)]/5 border-border hover:border-[var(--checkout-accent)]/40"
                      >
                        <Building2 className="h-6 w-6 mb-2 text-[var(--checkout-accent)]" />
                        <span className="font-bold text-xs">إلى المكتب</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="relative pt-10">
                  <div 
                    className="absolute -top-6 left-6 z-20 text-white px-6 py-2 rounded-full font-black text-lg shadow-2xl transform -rotate-6 animate-bounce flex flex-col items-center border-2 border-white/20"
                    style={{ background: `var(--checkout-badge)` }}
                  >
                    <span>{totalWithShipping.toLocaleString()} دج</span>
                    {deliveryCost > 0 && (
                      <span className="text-[9px] opacity-80 font-bold">(شامل التوصيل)</span>
                    )}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-16 text-2xl font-black rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.15)] transition-all hover:scale-[1.02] active:scale-95 gap-4" 
                    style={{ backgroundColor: 'var(--checkout-accent)' }}
                    disabled={currentStock <= 0 || purchaseLoading}
                  >
                    <ShoppingBag className="h-8 w-8" />
                    {settings.checkoutButtonTextAr || "تأكيد الطلب"}
                  </Button>
                </div>

                <div className="flex items-center gap-4 pt-2">
                   <div className="flex items-center border-2 border-[var(--checkout-accent)]/20 rounded-2xl bg-white h-14 overflow-hidden shadow-inner">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-full w-12 rounded-none hover:bg-[var(--checkout-accent)]/10 text-[var(--checkout-accent)]"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Minus className="h-5 w-5" />
                    </Button>
                    <span className="w-12 text-center font-black text-xl">{quantity}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-full w-12 rounded-none hover:bg-[var(--checkout-accent)]/10 text-[var(--checkout-accent)]"
                      onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-14 gap-3 border-2 text-[var(--checkout-accent)] font-black rounded-2xl hover:bg-[var(--checkout-accent)]/5"
                    style={{ borderColor: 'var(--checkout-accent)' }}
                    onClick={handleAddToCart}
                    disabled={currentStock <= 0}
                  >
                    <ShoppingCart className="h-6 w-6" />
                    إضافة للسلة
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-primary" />
              وصف المنتج
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground bg-muted/30 p-6 rounded-2xl border-r-4 border-primary/20">
              {product.description}
            </p>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-muted-foreground font-bold text-[10px] uppercase tracking-widest pb-10">
            <Tags className="h-3 w-3" />
            <span>عرض حصري من أوتيليا ديزاد</span>
          </div>
        </div>
      </div>
    </div>
  );
}
