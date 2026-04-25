import { useState, useCallback } from "react";
import { apiUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { Plus, Pencil, Trash2, Search, Boxes } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Block {
  id: number;
  nom_block: string;
  surface: number | null;
  nature_structure: string | null;
  situation: string | null;
  date_transmission: string | null;
  id_projet: number | null;
  projet_numero: string | null;
  created_at: string;
  updated_at: string;
}

interface Projet { id: number; numero: string; }
interface Lot { id: number; nom_lot: string; }

const MANAGER_ROLES = ["admin", "coordinateur", "chef_departement", "chef_projet"];
const ADMIN_ROLES = ["admin", "coordinateur"];

const emptyForm = {
  nom_block: "",
  surface: "",
  nature_structure: "",
  situation: "",
  date_transmission: "",
  id_projet: "",
};

export default function BlocksPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Block | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedLots, setSelectedLots] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const canCreate = user ? MANAGER_ROLES.includes(user.role) : false;
  const canDelete = user ? ADMIN_ROLES.includes(user.role) : false;

  const { data: blocks = [], isLoading } = useQuery<Block[]>({
    queryKey: ["blocks"],
    queryFn: () => fetch(apiUrl("/blocks"), { credentials: "include" }).then(r => r.json()),
  });

  const { data: projets = [] } = useQuery<Projet[]>({
    queryKey: ["projets-list"],
    queryFn: () => fetch(apiUrl("/projets"), { credentials: "include" }).then(r => r.json()),
  });

  const { data: lots = [] } = useQuery<Lot[]>({
    queryKey: ["lots-list"],
    queryFn: () => fetch(apiUrl("/lots"), { credentials: "include" }).then(r => r.json()),
  });

  const filtered = blocks.filter(b =>
    !search || b.nom_block?.toLowerCase().includes(search.toLowerCase()) ||
    b.nature_structure?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditItem(null);
    setForm(emptyForm);
    setSelectedLots([]);
    setDialogOpen(true);
  };

  const openEdit = (b: Block) => {
    setEditItem(b);
    setForm({
      nom_block: b.nom_block,
      surface: b.surface != null ? String(b.surface) : "",
      nature_structure: b.nature_structure || "",
      situation: b.situation || "",
      date_transmission: b.date_transmission ? b.date_transmission.slice(0, 16) : "",
      id_projet: b.id_projet != null ? String(b.id_projet) : "",
    });
    setSelectedLots([]);
    setDialogOpen(true);
  };

  const handleSave = useCallback(async () => {
    if (!form.nom_block.trim()) {
      toast({ title: "Nom du block requis", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nom_block: form.nom_block,
        surface: form.surface ? parseFloat(form.surface) : null,
        nature_structure: form.nature_structure || null,
        situation: form.situation || null,
        date_transmission: form.date_transmission || null,
        id_projet: form.id_projet ? parseInt(form.id_projet, 10) : null,
        lot_ids: selectedLots,
      };
      const url = editItem ? apiUrl(`/blocks/${editItem.id}`) : apiUrl("/blocks");
      const method = editItem ? "PATCH" : "POST";
      const res = await fetch(url, {
        method, credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Erreur");
      await queryClient.invalidateQueries({ queryKey: ["blocks"] });
      setDialogOpen(false);
      toast({ title: editItem ? "Block modifié" : "Block créé" });
    } catch {
      toast({ title: "Erreur lors de la sauvegarde", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [form, selectedLots, editItem, queryClient, toast]);

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer ce block ?")) return;
    const res = await fetch(apiUrl(`/blocks/${id}`), { method: "DELETE", credentials: "include" });
    if (res.ok) {
      await queryClient.invalidateQueries({ queryKey: ["blocks"] });
      toast({ title: "Block supprimé" });
    } else {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    }
  };

  const toggleLot = (id: number) => {
    setSelectedLots(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Boxes className="h-6 w-6 text-primary" />
            Blocks
          </h1>
          <p className="text-muted-foreground mt-1">Gestion des blocks de construction</p>
        </div>
        {canCreate && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau Block
          </Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom du block</TableHead>
              <TableHead>Surface (m²)</TableHead>
              <TableHead>Nature structure</TableHead>
              <TableHead>Projet</TableHead>
              <TableHead>Date transmission</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Chargement...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucun block enregistré</TableCell></TableRow>
            ) : filtered.map(b => (
              <TableRow key={b.id}>
                <TableCell className="font-medium">{b.nom_block}</TableCell>
                <TableCell>{b.surface != null ? b.surface : "—"}</TableCell>
                <TableCell>{b.nature_structure || "—"}</TableCell>
                <TableCell>{b.projet_numero || "—"}</TableCell>
                <TableCell>{b.date_transmission ? new Date(b.date_transmission).toLocaleDateString("fr-FR") : "—"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {canCreate && (
                      <Button variant="ghost" size="icon" onClick={() => openEdit(b)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(b.id)}>
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

      <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) { setEditItem(null); setForm(emptyForm); setSelectedLots([]); } }}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? "Modifier le block" : "Nouveau block"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Nom du block *</Label>
              <Input value={form.nom_block} onChange={e => setForm({ ...form, nom_block: e.target.value })} placeholder="ex: Block A" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Surface (m²)</Label>
                <Input type="number" step="0.01" value={form.surface} onChange={e => setForm({ ...form, surface: e.target.value })} placeholder="ex: 250.5" />
              </div>
              <div>
                <Label>Nature structure</Label>
                <Input value={form.nature_structure} onChange={e => setForm({ ...form, nature_structure: e.target.value })} placeholder="ex: Béton armé" />
              </div>
            </div>
            <div>
              <Label>Situation</Label>
              <Textarea value={form.situation} onChange={e => setForm({ ...form, situation: e.target.value })} placeholder="Description de la situation..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date de transmission</Label>
                <Input type="datetime-local" value={form.date_transmission} onChange={e => setForm({ ...form, date_transmission: e.target.value })} />
              </div>
              <div>
                <Label>Projet associé</Label>
                <Select value={form.id_projet} onValueChange={v => setForm({ ...form, id_projet: v === "none" ? "" : v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un projet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    {projets.map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.numero || `Projet #${p.id}`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Lots associés</Label>
                {lots.length > 0 && (
                  <Button 
                    type="button" 
                    variant="link" 
                    className="h-auto p-0 text-xs text-blue-600"
                    onClick={() => {
                      if (selectedLots.length === lots.length) {
                        setSelectedLots([]);
                      } else {
                        setSelectedLots(lots.map(l => l.id));
                      }
                    }}
                  >
                    {selectedLots.length === lots.length ? "Désélectionner tout" : "Tout sélectionner"}
                  </Button>
                )}
              </div>
              <div className="mt-1 border rounded-md p-2 max-h-40 overflow-y-auto space-y-1">
                {lots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun lot disponible</p>
                ) : lots.map(l => (
                  <label key={l.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-accent rounded px-1 py-0.5">
                    <input
                      type="checkbox"
                      checked={selectedLots.includes(l.id)}
                      onChange={() => toggleLot(l.id)}
                      className="rounded"
                    />
                    {l.nom_lot}
                  </label>
                ))}
              </div>
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
