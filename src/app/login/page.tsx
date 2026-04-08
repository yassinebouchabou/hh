
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePixelCart } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import Image from 'next/image';
import { LogIn } from 'lucide-react';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { Skeleton } from '@/components/ui/skeleton';

export default function LoginPage() {
  const router = useRouter();
  const { user, settings, isInitialLoading } = usePixelCart();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-redirect when user state is initialized
  useEffect(() => {
    if (user && mounted) {
      if (user.isAdmin) {
        router.push('/admin');
      } else {
        router.push('/');
      }
    }
  }, [user, router, mounted]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Connexion réussie",
        description: "Chargement de votre espace personnel...",
      });
    } catch (error: any) {
      let message = "Impossible de se connecter. Vérifiez vos identifiants.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = "Email ou mot de passe incorrect.";
      } else if (error.code === 'auth/too-many-requests') {
        message = "Trop de tentatives. Veuillez réessayer plus tard.";
      }
      
      toast({
        variant: "destructive",
        title: "Échec de connexion",
        description: message,
      });
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      toast({
        title: "Connexion réussie",
        description: "Connexion via Google effectuée avec succès.",
      });
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        setLoading(false);
        return;
      }
      
      toast({
        variant: "destructive",
        title: "Erreur Google",
        description: error.message || "Impossible de se connecter avec Google.",
      });
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4">
      {/* Hydration-safe Branding Area */}
      <div className="h-20 w-60 mb-8 flex items-center justify-center">
        {!mounted || isInitialLoading ? (
          <Skeleton className="h-12 w-48" />
        ) : settings.logoUrl ? (
          <div className="relative h-20 w-60">
            <Image 
              src={settings.logoUrl} 
              alt={settings.brandName} 
              fill 
              className="object-contain"
              priority
            />
          </div>
        ) : (
          <h1 className="text-3xl font-black text-primary">{settings.brandName || "PixelCart"}</h1>
        )}
      </div>

      <Card className="w-full max-w-md shadow-xl border-primary/10">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-headline font-bold">Connexion</CardTitle>
          <CardDescription>Entrez vos identifiants pour accéder à votre compte</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full font-bold h-12" disabled={loading} type="submit">
              {loading ? "Connexion en cours..." : "Se connecter"}
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Ou continuer avec</span>
              </div>
            </div>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full gap-2 border-primary/20 text-primary hover:bg-primary/5 shadow-sm h-12"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <LogIn className="h-4 w-4" />
              Google
            </Button>

            <p className="text-center text-sm text-muted-foreground mt-2">
              Pas encore de compte ?{' '}
              <Link href="/register" className="text-primary font-semibold hover:underline">
                S'inscrire
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
