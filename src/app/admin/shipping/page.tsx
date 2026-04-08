"use client";

import { useState } from 'react';
import { usePixelCart } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { 
  Truck, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
  ShieldCheck,
  Database,
  HelpCircle
} from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { validateDeliveryCredentials } from '@/ai/flows/validate-delivery-credentials-flow';
import { cn } from '@/lib/utils';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export default function DeliveryPartnersPage() {
  const { settings, updateSettings, updateDeliveryTariff } = usePixelCart();
  const firestore = useFirestore();
  
  const [formData, setFormData] = useState({
    company: settings.deliveryCompanyName || 'ZR EXPRESS',
    accountName: settings.deliveryAccountNameAr || '',
    apiKey: settings.deliveryApiKey || '',
    xTenant: settings.deliveryXTenant || '',
    canOpenPackages: settings.deliveryCanOpenPackages ?? true,
    isFreeDelivery: settings.deliveryIsFree ?? false,
  });

  const [isLinking, setIsLinking] = useState(false);
  const [isConnected, setIsConnected] = useState(!!settings.deliveryApiKey);

  const hasChanges = 
    formData.company !== settings.deliveryCompanyName ||
    formData.accountName !== settings.deliveryAccountNameAr ||
    formData.apiKey !== settings.deliveryApiKey ||
    formData.xTenant !== settings.deliveryXTenant ||
    formData.canOpenPackages !== settings.deliveryCanOpenPackages ||
    formData.isFreeDelivery !== settings.deliveryIsFree;

  const handleLinkDelivery = async () => {
    if (!formData.apiKey || formData.apiKey.length < 15) {
      toast({
        variant: "destructive",
        title: "بيانات ناقصة",
        description: "يرجى إدخال مفتاح API صحيح (secretKey).",
      });
      return;
    }

    setIsLinking(true);
    try {
      const result = await validateDeliveryCredentials({
        apiKey: formData.apiKey,
        xTenant: formData.xTenant,
        company: formData.company
      });

      if (result && result.valid) {
        const updatedSettings = {
          deliveryCompanyName: result.companyName || formData.company,
          deliveryLogoUrl: result.logoUrl || `https://picsum.photos/seed/${formData.company}/400/100`,
          deliveryApiKey: formData.apiKey,
          deliveryXTenant: formData.xTenant,
          deliveryAccountNameAr: formData.accountName,
          deliveryCanOpenPackages: formData.canOpenPackages,
          deliveryIsFree: formData.isFreeDelivery
        };
        updateSettings(updatedSettings);

        const connectionRef = doc(firestore, 'delivery_connections', result.companyName || formData.company);
        setDocumentNonBlocking(connectionRef, {
          ...updatedSettings,
          lastTested: new Date().toISOString(),
          isActive: true
        }, { merge: true });

        if (result.tariffs && Array.isArray(result.tariffs)) {
          result.tariffs.forEach(tariff => {
            updateDeliveryTariff(tariff.stateName, {
              ...tariff,
              companyName: result.companyName || formData.company,
              lastUpdated: new Date().toISOString()
            });
          });
          
          toast({
            title: "تم استيراد الأسعار",
            description: `تم تحديث ${result.tariffs.length} تعريفة شحن بنجاح.`,
          });
        }

        setIsConnected(true);
        toast({
          title: "تم الربط بنجاح",
          description: result.message || "تم توصيل حساب الشحن الخاص بك.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "فشل في التحقق",
          description: result?.message || "يرجى التأكد من صحة البيانات.",
        });
      }
    } catch (error) {
      console.error("Link error:", error);
      toast({
        variant: "destructive",
        title: "خطأ تقني",
        description: "تعذر الاتصال بخدمة التحقق حالياً.",
      });
    } finally {
      setIsLinking(false);
    }
  };

  const partnerGuides = {
    'ZR EXPRESS': "تجد مفتاحك في لوحة تحكم ZR Express -> الإعدادات -> API.",
    'Yalidine': "تجد مفتاح API في حساب Yalidine الخاص بك تحت قسم API Settings.",
    'DHD': "يرجى مراجعة مدير حسابك في DHD للحصول على مفاتيح الربط."
  };

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 text-primary mb-1">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <LinkIcon className="h-5 w-5" />
          </div>
          <h1 className="text-3xl font-black font-headline tracking-tight uppercase">Entreprises de Livraison</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl">
          قم بربط متجرك OUTILYA DZ مباشرة مع حسابات شركات الشحن المفضلة لديك لأتمتة عمليات الإرسال وجلب الأسعار.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <Card className="border-primary/10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2.5rem] overflow-hidden border bg-white">
          <div className="bg-muted/30 p-12 border-b flex flex-col items-center gap-6 min-h-[200px] justify-center relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
             
             {settings.deliveryLogoUrl ? (
               <div className="relative h-20 w-72 animate-in zoom-in duration-700">
                  <Image 
                    src={settings.deliveryLogoUrl} 
                    alt="Delivery Company Logo" 
                    fill 
                    className="object-contain" 
                  />
               </div>
             ) : (
               <div className="flex flex-col items-center gap-4 text-muted-foreground/40">
                 <Truck className="h-16 w-16 stroke-[1.5]" />
                 <p className="text-[10px] font-black uppercase tracking-[0.2em]">En attente de connexion API</p>
               </div>
             )}
             
             {isConnected && (
               <div className="flex items-center gap-2 animate-in slide-in-from-top-4 duration-500">
                 <Badge variant="outline" className="bg-white/80 backdrop-blur-sm text-primary border-primary/20 font-black px-8 py-2 text-xs rounded-full shadow-sm">
                   <ShieldCheck className="h-3.5 w-3.5 mr-2 text-emerald-500" />
                   {settings.deliveryCompanyName} CONNECTÉ
                 </Badge>
               </div>
             )}
          </div>

          <CardContent className="p-12 space-y-10" dir="rtl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <Label className="text-right block font-black text-xs uppercase tracking-wider text-muted-foreground mr-1">إختر شركة الشحن</Label>
                <Select 
                  value={formData.company} 
                  onValueChange={(val) => setFormData(prev => ({ ...prev, company: val }))}
                >
                  <SelectTrigger className="text-right h-14 rounded-2xl border-2 border-primary/5 focus:border-primary focus:ring-0 text-lg font-bold bg-white transition-all">
                    <SelectValue placeholder="إختر الشركة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ZR EXPRESS">ZR EXPRESS</SelectItem>
                    <SelectItem value="Yalidine">Yalidine</SelectItem>
                    <SelectItem value="DHD">DHD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-right block font-black text-xs uppercase tracking-wider text-muted-foreground mr-1">رقم الحساب (Client ID / Ref)</Label>
                <Input 
                  placeholder="مثال: Shipping-001" 
                  className="text-right h-14 rounded-2xl border-2 border-primary/5 focus:border-primary focus:ring-0 text-lg font-bold bg-white transition-all"
                  value={formData.accountName}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountName: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-right block font-black text-xs uppercase tracking-wider text-muted-foreground mr-1">Secret Key (x-api-key)</Label>
                  <HelpCircle className="h-3.5 w-3.5 text-primary/40 cursor-help" title={partnerGuides[formData.company as keyof typeof partnerGuides]} />
                </div>
                <Input 
                  placeholder="Collez votre secretKey هنا" 
                  className="text-right h-14 rounded-2xl font-mono border-2 border-primary/5 focus:border-primary focus:ring-0 bg-white transition-all"
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-right block font-black text-xs uppercase tracking-wider text-muted-foreground mr-1">Tenant ID (x-tenant)</Label>
                <Input 
                  placeholder="ID الخاص بالمؤسسة" 
                  className="text-right h-14 rounded-2xl font-mono border-2 border-primary/5 focus:border-primary focus:ring-0 bg-white transition-all"
                  value={formData.xTenant}
                  onChange={(e) => setFormData(prev => ({ ...prev, xTenant: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="flex items-center justify-between p-6 bg-primary/5 rounded-[2rem] border border-primary/10 transition-colors hover:bg-primary/[0.07]">
                <div className="flex flex-col gap-1">
                  <span className="font-black text-sm text-primary">يمكن فتح الطرود؟</span>
                  <span className="text-[10px] font-bold text-muted-foreground opacity-70">Autoriser l'ouverture du colis</span>
                </div>
                <Switch 
                  checked={formData.canOpenPackages}
                  onCheckedChange={(val) => setFormData(prev => ({ ...prev, canOpenPackages: val }))}
                />
              </div>

              <div className="flex items-center justify-between p-6 bg-primary/5 rounded-[2rem] border border-primary/10 transition-colors hover:bg-primary/[0.07]">
                <div className="flex flex-col gap-1">
                  <span className="font-black text-sm text-primary">التوصيل مجاني؟</span>
                  <span className="text-[10px] font-bold text-muted-foreground opacity-70">Livraison gratuite</span>
                </div>
                <Switch 
                  checked={formData.isFreeDelivery}
                  onCheckedChange={(val) => setFormData(prev => ({ ...prev, isFreeDelivery: val }))}
                />
              </div>
            </div>

            <div className="flex flex-col gap-6 pt-4">
              <Button 
                className={cn(
                  "w-full h-20 font-black text-2xl rounded-[2.5rem] shadow-xl transition-all active:scale-95 gap-4",
                  isConnected && !hasChanges ? "bg-emerald-600 hover:bg-emerald-700" : "bg-primary hover:bg-primary/90"
                )}
                onClick={handleLinkDelivery}
                disabled={isLinking}
              >
                {isLinking ? <Loader2 className="h-8 w-8 animate-spin" /> : null}
                {isLinking ? "جاري التحقق من البيانات..." : "ربط الحساب واستيراد الأسعار"}
              </Button>
              
              <div className="flex items-center justify-center gap-2 text-emerald-600 text-xs font-bold animate-pulse">
                <Database className="h-3 w-3" />
                <span>سيتم استيراد تعريفة 48 ولاية تلقائياً عند نجاح الربط</span>
              </div>
            </div>

            <div className="pt-10 border-t border-dashed border-primary/20 flex flex-col items-center gap-6">
              <div className="flex items-center gap-2 text-muted-foreground text-[9px] font-black uppercase tracking-[0.1em]">
                <AlertCircle className="h-3 w-3 text-primary/60" />
                تشفير آمن للبيانات وفق معايير AES-256
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
