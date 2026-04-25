import { useState, useCallback } from "react";
import { apiUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { Plus, Pencil, Trash2, Search, Tag } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface TagItem { id: number; lib_tag: string; description: string | null; }

const MANAGER_ROLES = ["admin", "coordinateur", "chef_departement"];
const ADMIN_ROLES = ["admin", "coordinateur"];
const emptyForm = { lib_tag: "", description: "" };

export default function TagsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<TagItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const canCreate = user ? MANAGER_ROLES.includes(user.role) : false;
  const canDelete = user ? ADMIN_ROLES.includes(user.role) : false;

  const { data: tags = [], isLoading } = useQuery<TagItem[]>({
    queryKey: ["tags"],
    queryFn: () => fetch(apiUrl("/tags"), { credentials: "include" }).then(r => r.json()),
  });

  const filtered = tags.filter(t =>
    !search || t.lib_tag?.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditItem(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (t: TagItem) => {
    setEditItem(t);
    setForm({ lib_tag: t.lib_tag, description: t.description || "" });
    setDialogOpen(true);
  };

  const handleSave = useCallback(async () => {
    if (!form.lib_tag.trim()) { toast({ title: "Libellé du tag requis", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const payload = { lib_tag: form.lib_tag, description: form.description || null };
      const url = editItem ? apiUrl(`/tags/${editItem.id}`) : apiUrl("/tags");
      const method = editItem ? "PATCH" : "POST";
      const res = await fetch(url, {
        method, credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Erreur");
      await queryClient.invalidateQueries({ queryKey: ["tags"] });
      setDialogOpen(false);
      toast({ title: editItem ? "Tag modifié" : "Tag créé" });
    } catch {
      toast({ title: "Erreur lors de la sauvegarde", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [form, editItem, queryClient, toast]);

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer ce tag ?")) return;
    const res = await fetch(apiUrl(`/tags/${id}`), { method: "DELETE", credentials: "include" });
    if (res.ok) {
      await queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast({ title: "Tag supprimé" });
    } else {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Tag className="h-6 w-6 text-primary" />
            Tags
          </h1>
          <p className="text-muted-foreground mt-1">Gestion des étiquettes de classification des documents</p>
        </div>
        {canCreate && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau Tag
          </Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher un tag..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Libellé</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Chargement...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Aucun tag enregistré</TableCell></TableRow>
            ) : filtered.map(t => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    <Tag className="h-3 w-3" />
                    {t.lib_tag}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm max-w-xs truncate">{t.description || "—"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {canCreate && (
                      <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(t.id)}>
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
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>{editItem ? "Modifier le tag" : "Nouveau tag"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Libellé *</Label>
              <Input value={form.lib_tag} onChange={e => setForm({ ...form, lib_tag: e.target.value })} placeholder="ex: Urgence" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description du tag..." rows={3} />
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
