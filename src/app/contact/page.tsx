
"use client";

import { usePixelCart } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  MessageCircle, 
  Clock, 
  Facebook, 
  Instagram, 
  Music,
  ExternalLink,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ContactPage() {
  const { settings } = usePixelCart();

  const contactInfo = [
    {
      icon: Phone,
      title: "Téléphone",
      value: settings.contactPhone || "+213 55869637",
      desc: "Appelez-nous du Samedi au Jeudi",
      color: "text-blue-500",
      bg: "bg-blue-50"
    },
    {
      icon: Mail,
      title: "Email",
      value: settings.contactEmail || "contact@bricopro.dz",
      desc: "Nous répondons sous 24h",
      color: "text-emerald-500",
      bg: "bg-emerald-50"
    }
  ];

  const socialLinks = [
    { name: "WhatsApp", icon: MessageCircle, url: settings.whatsappUrl, color: "bg-emerald-500 hover:bg-emerald-600" },
    { name: "Telegram", icon: Send, url: settings.telegramUrl, color: "bg-sky-500 hover:bg-sky-600" },
    { name: "Facebook", icon: Facebook, url: settings.facebookUrl, color: "bg-blue-600 hover:bg-blue-700" },
    { name: "Instagram", icon: Instagram, url: settings.instagramUrl, color: "bg-pink-500 hover:bg-pink-600" },
    { name: "TikTok", icon: Music, url: settings.tiktokUrl, color: "bg-foreground hover:bg-foreground/90" }
  ].filter(link => link.url);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl animate-in fade-in duration-700">
      {/* Header */}
      <div className="text-center mb-10 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mx-auto">
          <Globe className="h-3 w-3" />
          Support & Contact
        </div>
        <h1 className="text-3xl md:text-4xl font-black font-headline tracking-tight leading-tight">
          Parlons de vos <span className="text-primary">Projets</span>
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-sm">
          Une question ? Notre équipe d'experts est à votre disposition pour vous conseiller.
        </p>
      </div>

      {/* Google Maps Section - Moved to top */}
      <div className="mb-12 space-y-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-black font-headline uppercase tracking-tight">Notre Localisation</h2>
          <div className="h-px flex-1 bg-border/50" />
        </div>
        <Card className="overflow-hidden rounded-[2rem] border-none shadow-2xl h-[400px]">
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d199.81434!2d3.3037994!3d36.7389892!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x128e45846a905d8f%3A0x94dc09078f0fa12e!2sSARL%20FIEP%20DACHIR!5e0!3m2!1sfr!2sdz!4v1710000000000!5m2!1sfr!2sdz"
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen={true} 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
          />
        </Card>
      </div>

      {/* Social Media Links */}
      {socialLinks.length > 0 && (
        <div className="mb-12 space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-black font-headline uppercase tracking-tight">Rejoignez-nous</h2>
            <div className="h-px flex-1 bg-border/50" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {socialLinks.map((social) => (
              <a 
                key={social.name} 
                href={social.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-2xl text-white transition-all hover:scale-105 active:scale-95 shadow-lg group",
                  social.color
                )}
              >
                <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md shadow-inner group-hover:rotate-12 transition-transform mb-2">
                  <social.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-black tracking-tight">{social.name}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start border-t pt-10 border-border/50">
        {/* Contact Coordinates */}
        <div className="lg:col-span-3 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-black font-headline uppercase tracking-tight">Nos Coordonnées</h2>
            <p className="text-xs text-muted-foreground">Comment nous joindre rapidement.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contactInfo.map((info, i) => (
              <div 
                key={i} 
                className="flex items-center gap-4 p-5 rounded-2xl bg-card border shadow-sm transition-all hover:shadow-md hover:border-primary/20"
              >
                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shadow-md shrink-0", info.bg, info.color)}>
                  <info.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">{info.title}</h3>
                  <div className="font-black text-lg text-foreground tracking-tight">{info.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Availability Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-black font-headline uppercase tracking-tight">Horaires</h2>
            <p className="text-xs text-muted-foreground">Planifiez votre visite.</p>
          </div>
          
          <Card className="rounded-[2rem] border-primary/10 bg-primary/5 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Clock className="h-20 w-20" />
            </div>
            <CardContent className="p-8 relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg">
                  <Clock className="h-5 w-5" />
                </div>
                <h3 className="font-black text-xl tracking-tight">Disponibilité</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-primary/10 pb-4">
                  <div className="flex flex-col">
                    <span className="text-foreground font-bold text-sm">Samedi - Mercredi</span>
                    <span className="text-[9px] text-muted-foreground font-bold uppercase">Semaine</span>
                  </div>
                  <span className="font-black text-primary text-sm px-3 py-1 bg-white rounded-lg shadow-sm">
                    {settings.workingHoursWeek || "08:00 - 18:00"}
                  </span>
                </div>
                
                <div className="flex justify-between items-center border-b border-primary/10 pb-4">
                  <div className="flex flex-col">
                    <span className="text-foreground font-bold text-sm">Jeudi</span>
                    <span className="text-[9px] text-muted-foreground font-bold uppercase">Matinée</span>
                  </div>
                  <span className="font-black text-primary text-sm px-3 py-1 bg-white rounded-lg shadow-sm">
                    {settings.workingHoursThu || "08:00 - 13:00"}
                  </span>
                </div>
                
                <div className="flex justify-between items-center pt-1">
                  <div className="flex flex-col">
                    <span className="text-foreground font-bold text-sm">Vendredi</span>
                  </div>
                  <span className="text-destructive font-black uppercase tracking-widest text-[10px] px-4 py-1.5 bg-destructive/10 rounded-full border border-destructive/20">
                    {settings.workingHoursFri || "Fermé"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
