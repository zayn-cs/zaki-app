import { useState, useCallback } from "react";
import { apiUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { Plus, Pencil, Trash2, Search, MapPin } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Zone {
  id: number;
  nom_zone: string;
  id_block: number | null;
  nom_block: string | null;
  created_at: string;
  updated_at: string;
}

interface Block { id: number; nom_block: string; }

const MANAGER_ROLES = ["admin", "coordinateur", "chef_departement", "chef_projet"];
const ADMIN_ROLES = ["admin", "coordinateur"];

const emptyForm = { nom_zone: "", id_block: "" };

export default function ZonesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Zone | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const canCreate = user ? MANAGER_ROLES.includes(user.role) : false;
  const canDelete = user ? ADMIN_ROLES.includes(user.role) : false;

  const { data: zones = [], isLoading } = useQuery<Zone[]>({
    queryKey: ["zones"],
    queryFn: () => fetch(apiUrl("/zones"), { credentials: "include" }).then(r => r.json()),
  });

  const { data: blocks = [] } = useQuery<Block[]>({
    queryKey: ["blocks-list"],
    queryFn: () => fetch(apiUrl("/blocks"), { credentials: "include" }).then(r => r.json()),
  });

  const filtered = zones.filter(z =>
    !search || z.nom_zone?.toLowerCase().includes(search.toLowerCase()) ||
    z.nom_block?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditItem(null); setForm(emptyForm); setDialogOpen(true); };

  const openEdit = (z: Zone) => {
    setEditItem(z);
    setForm({ nom_zone: z.nom_zone, id_block: z.id_block != null ? String(z.id_block) : "" });
    setDialogOpen(true);
  };

  const handleSave = useCallback(async () => {
    if (!form.nom_zone.trim()) {
      toast({ title: "Nom de la zone requis", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nom_zone: form.nom_zone,
        id_block: form.id_block ? parseInt(form.id_block, 10) : null,
      };
      const url = editItem ? apiUrl(`/zones/${editItem.id}`) : apiUrl("/zones");
      const method = editItem ? "PATCH" : "POST";
      const res = await fetch(url, {
        method, credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Erreur");
      await queryClient.invalidateQueries({ queryKey: ["zones"] });
      setDialogOpen(false);
      toast({ title: editItem ? "Zone modifiée" : "Zone créée" });
    } catch {
      toast({ title: "Erreur lors de la sauvegarde", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [form, editItem, queryClient, toast]);

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cette zone ?")) return;
    const res = await fetch(apiUrl(`/zones/${id}`), { method: "DELETE", credentials: "include" });
    if (res.ok) {
      await queryClient.invalidateQueries({ queryKey: ["zones"] });
      toast({ title: "Zone supprimée" });
    } else {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            Zones
          </h1>
          <p className="text-muted-foreground mt-1">Gestion des zones par block</p>
        </div>
        {canCreate && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle Zone
          </Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher une zone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom de la zone</TableHead>
              <TableHead>Block associé</TableHead>
              <TableHead>Créée le</TableHead>
              <TableHead>Mise à jour</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Chargement...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Aucune zone enregistrée</TableCell></TableRow>
            ) : filtered.map(z => (
              <TableRow key={z.id}>
                <TableCell className="font-medium">{z.nom_zone}</TableCell>
                <TableCell>{z.nom_block || "—"}</TableCell>
                <TableCell>{new Date(z.created_at).toLocaleDateString("fr-FR")}</TableCell>
                <TableCell>{new Date(z.updated_at).toLocaleDateString("fr-FR")}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {canCreate && (
                      <Button variant="ghost" size="icon" onClick={() => openEdit(z)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(z.id)}>
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

      <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) { setEditItem(null); setForm(emptyForm); } }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editItem ? "Modifier la zone" : "Nouvelle zone"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Nom de la zone *</Label>
              <Input value={form.nom_zone} onChange={e => setForm({ ...form, nom_zone: e.target.value })} placeholder="ex: Zone Nord" />
            </div>
            <div>
              <Label>Block associé</Label>
              <Select value={form.id_block} onValueChange={v => setForm({ ...form, id_block: v === "none" ? "" : v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un block" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {blocks.map(b => (
                    <SelectItem key={b.id} value={String(b.id)}>{b.nom_block}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
