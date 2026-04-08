"use client";

import { useState, useMemo } from 'react';
import { usePixelCart } from '@/lib/store';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Truck, 
  Home, 
  Building2, 
  Save, 
  Search, 
  MapPin, 
  CheckCircle2, 
  Building,
  Plus,
  Trash2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ALGERIA_DATA, ALGERIA_STATES } from '@/lib/algeria-data';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function DeliveryTariffsPage() {
  const { deliveryTariffs, updateDeliveryTariff } = usePixelCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [localTariffs, setLocalTariffs] = useState<{ [key: string]: { home: string, desk: string } }>({});
  
  const [managingState, setManagingState] = useState<string | null>(null);
  const [communeCounts, setCommuneCounts] = useState<Record<string, number>>({});
  const [communeAddresses, setCommuneAddresses] = useState<Record<string, string>>({});
  const [activeCustomCommunes, setActiveCustomCommunes] = useState<string[]>([]);
  const [newCommuneName, setNewCommuneName] = useState('');

  const filteredStates = useMemo(() => {
    return ALGERIA_STATES.filter(state => 
      state.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const handlePriceChange = (state: string, type: 'home' | 'desk', value: string) => {
    setLocalTariffs(prev => ({
      ...prev,
      [state]: {
        ...(prev[state] || { 
          home: deliveryTariffs.find(t => t.stateName === state)?.homePrice.toString() || '0', 
          desk: deliveryTariffs.find(t => t.stateName === state)?.deskPrice.toString() || '0' 
        }),
        [type]: value
      }
    }));
  };

  const handleSave = (state: string) => {
    const tariff = localTariffs[state];
    const existing = deliveryTariffs.find(t => t.stateName === state);
    
    updateDeliveryTariff(state, {
      stateName: state,
      homePrice: tariff ? parseFloat(tariff.home) || 0 : (existing?.homePrice || 0),
      deskPrice: tariff ? parseFloat(tariff.desk) || 0 : (existing?.deskPrice || 0),
      companyName: existing?.companyName || 'Manual',
      communeDesktops: existing?.communeDesktops || {},
      communeAddresses: existing?.communeAddresses || {},
      customCommunes: existing?.customCommunes || [],
      lastUpdated: new Date().toISOString()
    });

    toast({
      title: "Tarif mis à jour",
      description: `Les prix pour ${state} ont été enregistrés.`
    });
    
    // Clear local state for this wilaya if it was modified
    if (tariff) {
      setLocalTariffs(prev => {
        const next = { ...prev };
        delete next[state];
        return next;
      });
    }
  };

  const handleOpenManageCommunes = (state: string) => {
    const existing = deliveryTariffs.find(t => t.stateName === state);
    setCommuneCounts(existing?.communeDesktops || {});
    setCommuneAddresses(existing?.communeAddresses || {});
    setActiveCustomCommunes(existing?.customCommunes || []);
    setManagingState(state);
    setNewCommuneName('');
  };

  const addCustomCommune = () => {
    if (!newCommuneName.trim()) return;
    
    const name = newCommuneName.trim();
    const defaults = managingState ? ALGERIA_DATA[managingState] || [] : [];
    
    if (defaults.includes(name) || activeCustomCommunes.includes(name)) {
      toast({ variant: "destructive", title: "Cette ville existe déjà." });
      return;
    }

    setActiveCustomCommunes(prev => [...prev, name]);
    setNewCommuneName('');
    toast({ title: "Ville ajoutée", description: `${name} a été ajouté à la liste locale.` });
  };

  const removeCustomCommune = (name: string) => {
    setActiveCustomCommunes(prev => prev.filter(c => c !== name));
    setCommuneCounts(prev => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
    setCommuneAddresses(prev => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const saveCommuneCounts = () => {
    if (!managingState) return;
    
    const existing = deliveryTariffs.find(t => t.stateName === managingState);
    const tariff = localTariffs[managingState];

    updateDeliveryTariff(managingState, {
      stateName: managingState,
      homePrice: tariff ? parseFloat(tariff.home) || 0 : (existing?.homePrice || 0),
      deskPrice: tariff ? parseFloat(tariff.desk) || 0 : (existing?.deskPrice || 0),
      companyName: existing?.companyName || 'Manual',
      communeDesktops: communeCounts,
      communeAddresses: communeAddresses,
      customCommunes: activeCustomCommunes,
      lastUpdated: new Date().toISOString()
    });

    toast({ title: "Villes mises à jour", description: `Les données pour ${managingState} ont été enregistrées.` });
    setManagingState(null);
  };

  const combinedCommunes = useMemo(() => {
    if (!managingState) return [];
    const defaults = ALGERIA_DATA[managingState] || [];
    return [...new Set([...defaults, ...activeCustomCommunes])];
  }, [managingState, activeCustomCommunes]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Tarifs de Livraison</h1>
        <p className="text-muted-foreground">Définissez les frais de port par wilaya et gérez les points de retrait.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Home className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Livraison à Domicile</CardTitle>
              <CardDescription>Prix pour le transport jusqu'au pas de la porte.</CardDescription>
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Livraison au Bureau</CardTitle>
              <CardDescription>Prix pour le retrait en point relais ou agence.</CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>

      <div className="bg-card p-4 rounded-xl border flex items-center gap-4 max-w-md">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Rechercher une wilaya..." 
          className="border-none shadow-none focus-visible:ring-0"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Wilaya</TableHead>
              <TableHead>Prix Domicile (DA)</TableHead>
              <TableHead>Prix Bureau (DA)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStates.map((state) => {
              const dbTariff = deliveryTariffs.find(t => t.stateName === state);
              const localTariff = localTariffs[state];
              
              const homeValue = localTariff?.home ?? (dbTariff?.homePrice.toString() || '0');
              const deskValue = localTariff?.desk ?? (dbTariff?.deskPrice.toString() || '0');
              
              const isDirty = localTariff !== undefined;

              return (
                <TableRow key={state}>
                  <TableCell className="font-bold">{state}</TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      className="w-32 h-9" 
                      value={homeValue}
                      onChange={(e) => handlePriceChange(state, 'home', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      className="w-32 h-9" 
                      value={deskValue}
                      onChange={(e) => handlePriceChange(state, 'desk', e.target.value)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="gap-2 h-9 rounded-lg"
                        onClick={() => handleOpenManageCommunes(state)}
                      >
                        <Building className="h-4 w-4" />
                        Gérer Villes
                      </Button>
                      <Button 
                        size="sm" 
                        className="gap-2 h-9 rounded-lg"
                        variant={isDirty ? "default" : "outline"}
                        onClick={() => handleSave(state)}
                      >
                        <Save className="h-4 w-4" />
                        {isDirty ? "Enregistrer" : "Sauvegardé"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!managingState} onOpenChange={(open) => !open && setManagingState(null)}>
        <DialogContent className="max-w-4xl rounded-[2rem] overflow-hidden p-0">
          <DialogHeader className="p-8 bg-muted/30 border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-black uppercase flex items-center gap-3">
                  <MapPin className="h-6 w-6 text-primary" />
                  Villes & Bureaux - {managingState}
                </DialogTitle>
                <DialogDescription className="font-bold">
                  Gérez les bureaux de retrait et adresses pour chaque commune.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="p-8 space-y-6">
            {/* Add New Commune Input */}
            <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-2xl border-2 border-dashed border-primary/20">
              <div className="flex-1 space-y-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Ajouter une nouvelle ville</Label>
                <Input 
                  placeholder="Ex: Nouvelle Ville, Cité X..." 
                  className="h-11 rounded-xl bg-white border-primary/10"
                  value={newCommuneName}
                  onChange={(e) => setNewCommuneName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomCommune()}
                />
              </div>
              <Button onClick={addCustomCommune} className="h-11 w-11 rounded-xl shrink-0" size="icon">
                <Plus className="h-5 w-5" />
              </Button>
            </div>

            <ScrollArea className="h-[450px] pr-4">
              <div className="grid grid-cols-1 gap-4">
                {combinedCommunes.map(commune => {
                  const isCustom = activeCustomCommunes.includes(commune);
                  return (
                    <div key={commune} className="grid grid-cols-1 md:grid-cols-12 items-center gap-4 p-4 bg-muted/20 border rounded-2xl transition-colors hover:bg-muted/40 relative group">
                      <div className="md:col-span-3 flex flex-col gap-0.5">
                        <span className="text-sm font-black uppercase truncate">{commune}</span>
                        {isCustom && <span className="text-[8px] font-black text-primary uppercase">Personnalisé</span>}
                      </div>
                      
                      <div className="md:col-span-2 flex flex-col gap-1">
                        <label className="text-[9px] font-black text-muted-foreground uppercase">Bureaux</label>
                        <Input 
                          type="number" 
                          className="h-10 text-center font-black rounded-xl border-2 border-primary/10" 
                          value={communeCounts[commune] || 0} 
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setCommuneCounts(prev => ({ ...prev, [commune]: val }));
                          }}
                        />
                      </div>

                      <div className="md:col-span-6 flex flex-col gap-1">
                        <label className="text-[9px] font-black text-muted-foreground uppercase">Adresse exacte du Stop Desk</label>
                        <Input 
                          placeholder="Ex: Rue 05, Cité 100 logts..." 
                          className="h-10 font-bold rounded-xl border-2 border-primary/10" 
                          value={communeAddresses[commune] || ''} 
                          onChange={(e) => {
                            const val = e.target.value;
                            setCommuneAddresses(prev => ({ ...prev, [commune]: val }));
                          }}
                        />
                      </div>

                      <div className="md:col-span-1 flex justify-end">
                        {isCustom && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeCustomCommune(commune)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter className="p-8 bg-muted/10 border-t">
            <Button variant="ghost" onClick={() => setManagingState(null)} className="font-bold">Annuler</Button>
            <Button onClick={saveCommuneCounts} className="gap-2 h-12 px-8 font-black rounded-xl shadow-lg">
              <CheckCircle2 className="h-4 w-4" />
              Enregistrer les données
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
