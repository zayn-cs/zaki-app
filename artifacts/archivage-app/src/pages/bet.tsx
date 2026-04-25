import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";

interface BET {
  id: number;
  nom_bet: string;
  adresse: string | null;
  telephone_fixe: string | null;
  nom_gerant: string | null;
  prenom_gerant: string | null;
  telephone_bet: string | null;
}

const MANAGER_ROLES = ["admin", "coordinateur", "chef_departement"];
const ADMIN_ROLES = ["admin", "coordinateur"];

export default function BETPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<BET | null>(null);

  const canCreate = user ? MANAGER_ROLES.includes(user.role) : false;
  const canDelete = user ? ADMIN_ROLES.includes(user.role) : false;

  const [form, setForm] = useState({
    nom_bet: "",
    adresse: "",
    telephone_fixe: "",
    nom_gerant: "",
    prenom_gerant: "",
    telephone_bet: "",
  });

  const { data: bets = [], isLoading } = useQuery<BET[]>({
    queryKey: ["bet"],
    queryFn: async () => {
      const r = await api("/bet");
      if (!r.ok) throw new Error("Erreur");
      return r.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const r = await api("/bet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom_bet: data.nom_bet,
          adresse: data.adresse || null,
          telephone_fixe: data.telephone_fixe || null,
          nom_gerant: data.nom_gerant || null,
          prenom_gerant: data.prenom_gerant || null,
          telephone_bet: data.telephone_bet || null,
        }),
      });
      if (!r.ok) throw new Error("Erreur création");
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bet"] });
      toast({ title: "BET créé avec succès" });
      setIsOpen(false);
      resetForm();
    },
    onError: () => toast({ title: "Erreur lors de la création", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof form & { id: number }) => {
      const r = await api(`/bet/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom_bet: data.nom_bet,
          adresse: data.adresse || null,
          telephone_fixe: data.telephone_fixe || null,
          nom_gerant: data.nom_gerant || null,
          prenom_gerant: data.prenom_gerant || null,
          telephone_bet: data.telephone_bet || null,
        }),
      });
      if (!r.ok) throw new Error("Erreur modification");
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bet"] });
      toast({ title: "BET modifié avec succès" });
      setIsOpen(false);
      setEditing(null);
      resetForm();
    },
    onError: () => toast({ title: "Erreur lors de la modification", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const r = await api(`/bet/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Erreur suppression");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bet"] });
      toast({ title: "BET supprimé" });
    },
    onError: () => toast({ title: "Erreur lors de la suppression", variant: "destructive" }),
  });

  function resetForm() {
    setForm({ nom_bet: "", adresse: "", telephone_fixe: "", nom_gerant: "", prenom_gerant: "", telephone_bet: "" });
  }

  function openCreate() {
    setEditing(null);
    resetForm();
    setIsOpen(true);
  }

  function openEdit(bet: BET) {
    setEditing(bet);
    setForm({
      nom_bet: bet.nom_bet,
      adresse: bet.adresse || "",
      telephone_fixe: bet.telephone_fixe || "",
      nom_gerant: bet.nom_gerant || "",
      prenom_gerant: bet.prenom_gerant || "",
      telephone_bet: bet.telephone_bet || "",
    });
    setIsOpen(true);
  }

  function handleSubmit() {
    if (!form.nom_bet.trim()) {
      toast({ title: "Nom du BET requis", variant: "destructive" });
      return;
    }
    if (editing) {
      updateMutation.mutate({ ...form, id: editing.id });
    } else {
      createMutation.mutate(form);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Bureaux d'Études Techniques
          </h1>
          <p className="text-muted-foreground mt-1">Gestion des BET partenaires</p>
        </div>
        {canCreate && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau BET
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom BET</TableHead>
              <TableHead>Gérant</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Adresse</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : bets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Aucun BET enregistré
                </TableCell>
              </TableRow>
            ) : (
              bets.map((bet) => (
                <TableRow key={bet.id}>
                  <TableCell className="font-medium">{bet.nom_bet}</TableCell>
                  <TableCell>
                    {bet.prenom_gerant || bet.nom_gerant
                      ? `${bet.prenom_gerant || ""} ${bet.nom_gerant || ""}`.trim()
                      : "—"}
                  </TableCell>
                  <TableCell>{bet.telephone_bet || bet.telephone_fixe || "—"}</TableCell>
                  <TableCell className="max-w-xs truncate">{bet.adresse || "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {canCreate && (
                        <Button variant="ghost" size="icon" onClick={() => openEdit(bet)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm("Supprimer ce BET ?")) {
                              deleteMutation.mutate(bet.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) { setEditing(null); resetForm(); } }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier le BET" : "Nouveau BET"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Nom du BET *</Label>
              <Input
                value={form.nom_bet}
                onChange={(e) => setForm({ ...form, nom_bet: e.target.value })}
                placeholder="ex: Cabinet Ingénierie SA"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prénom gérant</Label>
                <Input
                  value={form.prenom_gerant}
                  onChange={(e) => setForm({ ...form, prenom_gerant: e.target.value })}
                />
              </div>
              <div>
                <Label>Nom gérant</Label>
                <Input
                  value={form.nom_gerant}
                  onChange={(e) => setForm({ ...form, nom_gerant: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Téléphone BET</Label>
                <Input
                  value={form.telephone_bet}
                  onChange={(e) => setForm({ ...form, telephone_bet: e.target.value })}
                />
              </div>
              <div>
                <Label>Téléphone fixe</Label>
                <Input
                  value={form.telephone_fixe}
                  onChange={(e) => setForm({ ...form, telephone_fixe: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Adresse</Label>
              <Input
                value={form.adresse}
                onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                placeholder="Adresse complète"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsOpen(false); setEditing(null); resetForm(); }}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editing ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
