import { useState, useCallback } from "react";
import { apiUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { Plus, Pencil, Trash2, Search, Globe } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Region { id: number; nom_region: string; }

const MANAGER_ROLES = ["admin", "coordinateur", "chef_departement"];
const ADMIN_ROLES = ["admin", "coordinateur"];

export default function RegionsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Region | null>(null);
  const [nom_region, setNomRegion] = useState("");
  const [saving, setSaving] = useState(false);

  const canCreate = user ? MANAGER_ROLES.includes(user.role) : false;
  const canDelete = user ? ADMIN_ROLES.includes(user.role) : false;

  const { data: regions = [], isLoading } = useQuery<Region[]>({
    queryKey: ["regions"],
    queryFn: () => fetch(apiUrl("/regions"), { credentials: "include" }).then(r => r.json()),
  });

  const filtered = regions.filter(r => !search || r.nom_region?.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => { setEditItem(null); setNomRegion(""); setDialogOpen(true); };
  const openEdit = (r: Region) => { setEditItem(r); setNomRegion(r.nom_region); setDialogOpen(true); };

  const handleSave = useCallback(async () => {
    if (!nom_region.trim()) { toast({ title: "Nom de la région requis", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const url = editItem ? apiUrl(`/regions/${editItem.id}`) : apiUrl("/regions");
      const method = editItem ? "PATCH" : "POST";
      const res = await fetch(url, {
        method, credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom_region }),
      });
      if (!res.ok) throw new Error("Erreur");
      await queryClient.invalidateQueries({ queryKey: ["regions"] });
      setDialogOpen(false);
      toast({ title: editItem ? "Région modifiée" : "Région créée" });
    } catch {
      toast({ title: "Erreur lors de la sauvegarde", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [nom_region, editItem, queryClient, toast]);

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cette région ?")) return;
    const res = await fetch(apiUrl(`/regions/${id}`), { method: "DELETE", credentials: "include" });
    if (res.ok) {
      await queryClient.invalidateQueries({ queryKey: ["regions"] });
      toast({ title: "Région supprimée" });
    } else {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            Régions
          </h1>
          <p className="text-muted-foreground mt-1">Gestion des régions géographiques</p>
        </div>
        {canCreate && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle Région
          </Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Nom de la région</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Chargement...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Aucune région enregistrée</TableCell></TableRow>
            ) : filtered.map(r => (
              <TableRow key={r.id}>
                <TableCell className="text-muted-foreground">{r.id}</TableCell>
                <TableCell className="font-medium">{r.nom_region}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {canCreate && (
                      <Button variant="ghost" size="icon" onClick={() => openEdit(r)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(r.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) { setEditItem(null); setNomRegion(""); } }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{editItem ? "Modifier la région" : "Nouvelle région"}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label>Nom de la région *</Label>
            <Input className="mt-1" value={nom_region} onChange={e => setNomRegion(e.target.value)} placeholder="ex: Région du Nord" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving}>{editItem ? "Modifier" : "Créer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
