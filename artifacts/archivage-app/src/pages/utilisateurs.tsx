import { useState, useCallback } from "react";
import { apiUrl } from "@/lib/api";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, Loader2, User } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";

const ROLES = ["admin", "coordinateur", "chef_departement", "chef_projet", "responsable_lot"];

interface Utilisateur {
  id: number;
  nom: string;
  prenom: string;
  messager: string;
  role: string;
  grade?: string;
  adresse?: string;
  telephone_professional?: string;
  telephone_personnel?: string;
  is_chef_project?: boolean | number;
  id_departement?: number;
  nom_departement?: string;
}

interface Departement { id: number; nom: string; }

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  coordinateur: "bg-purple-100 text-purple-700",
  chef_departement: "bg-blue-100 text-blue-700",
  chef_projet: "bg-green-100 text-green-700",
  responsable_lot: "bg-orange-100 text-orange-700",
};

export default function UtilisateursPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<Utilisateur | null>(null);
  const [form, setForm] = useState({
    nom: "", prenom: "", messager: "", mot_pass: "", role: "chef_projet",
    grade: "", adresse: "", telephone_professional: "",
    telephone_personnel: "", is_chef_project: false, id_departement: ""
  });
  const [saving, setSaving] = useState(false);

  const { data: utilisateurs = [], isLoading } = useQuery<Utilisateur[]>({
    queryKey: ["utilisateurs"],
    queryFn: () => fetch(apiUrl("/utilisateurs"), { credentials: "include" }).then(r => r.json()),
  });

  const { data: departements = [] } = useQuery<Departement[]>({
    queryKey: ["departements"],
    queryFn: () => fetch(apiUrl("/departements"), { credentials: "include" }).then(r => r.json()),
  });

  const filtered = utilisateurs.filter(u =>
    !search ||
    u.nom?.toLowerCase().includes(search.toLowerCase()) ||
    u.prenom?.toLowerCase().includes(search.toLowerCase()) ||
    u.messager?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditUser(null);
    setForm({
      nom: "", prenom: "", messager: "", mot_pass: "", role: "chef_projet",
      grade: "", adresse: "", telephone_professional: "",
      telephone_personnel: "", is_chef_project: false, id_departement: ""
    });
    setDialogOpen(true);
  };

  const openEdit = (u: Utilisateur) => {
    setEditUser(u);
    setForm({
      nom: u.nom,
      prenom: u.prenom,
      messager: u.messager,
      mot_pass: "",
      role: u.role,
      grade: u.grade ?? "",
      adresse: u.adresse ?? "",
      telephone_professional: u.telephone_professional ?? "",
      telephone_personnel: u.telephone_personnel ?? "",
      is_chef_project: !!u.is_chef_project,
      id_departement: u.id_departement?.toString() ?? ""
    });
    setDialogOpen(true);
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        nom: form.nom,
        prenom: form.prenom,
        role: form.role,
        grade: form.grade,
        adresse: form.adresse,
        telephone_professional: form.telephone_professional,
        telephone_personnel: form.telephone_personnel,
        is_chef_project: form.is_chef_project ? 1 : 0,
        id_departement: form.id_departement ? parseInt(form.id_departement) : null,
      };

      if (!editUser) {
        body.messager = form.messager;
        body.mot_pass = form.mot_pass;
      } else if (form.mot_pass) {
        body.mot_pass = form.mot_pass;
      }

      const url = editUser ? apiUrl(`/utilisateurs/${editUser.id}`) : apiUrl("/utilisateurs");
      const method = editUser ? "PATCH" : "POST";

      const res = await fetch(url, {
        method, credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error || "Erreur lors de la sauvegarde");
      }

      await queryClient.invalidateQueries({ queryKey: ["utilisateurs"] });
      setDialogOpen(false);
      toast({ title: editUser ? "Utilisateur modifié" : "Utilisateur créé" });
    } catch (err) {
      toast({ title: "Erreur", description: err instanceof Error ? err.message : "Erreur", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [form, editUser, queryClient, toast]);

  const handleDelete = async (u: Utilisateur) => {
    if (u.id === currentUser?.id) {
      toast({ title: "Impossible", description: "Vous ne pouvez pas supprimer votre propre compte", variant: "destructive" });
      return;
    }
    if (!confirm(`Supprimer l'utilisateur "${u.prenom} ${u.nom}" ?`)) return;
    const res = await fetch(apiUrl(`/utilisateurs/${u.id}`), { method: "DELETE", credentials: "include" });
    if (res.ok) {
      await queryClient.invalidateQueries({ queryKey: ["utilisateurs"] });
      toast({ title: "Utilisateur supprimé" });
    } else {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion Utilisateurs"
        description="Administration des accès et profils professionnels"
        action={
          <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 shadow-md">
            <Plus className="mr-2 h-4 w-4" /> Nouvel Utilisateur
          </Button>
        }
      />

      <Card className="border-none shadow-sm ring-1 ring-slate-200">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, prénom ou messager..."
              className="pl-9 bg-slate-50 border-none ring-1 ring-slate-200 focus-visible:ring-blue-500"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-md overflow-hidden ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50 uppercase text-[11px] font-bold">
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Messager</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Département</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-muted-foreground italic">
                    Aucun profil trouvé
                  </TableCell>
                </TableRow>
              ) : filtered.map(u => (
                <TableRow key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200">
                        {u.prenom?.[0]}{u.nom?.[0]}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          {u.prenom} {u.nom}
                          {u.id === currentUser?.id && <Badge className="bg-slate-900 text-[9px]">MOI</Badge>}
                          {u.is_chef_project ? <Badge variant="secondary" className="text-[9px] bg-green-100 text-green-700">CHEF PROJET</Badge> : null}
                        </div>
                        <div className="text-[11px] text-slate-500 uppercase font-medium">{u.grade || 'Poste non défini'}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-slate-600">{u.messager}</TableCell>
                  <TableCell>
                    <Badge className={`border-0 capitalize text-[10px] ${ROLE_COLORS[u.role] ?? "bg-gray-100 text-gray-700"}`}>
                      {u.role?.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{u.nom_departement ?? "—"}</TableCell>
                  <TableCell className="text-sm">{u.grade ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(u)} className="h-8 w-8 text-blue-600 hover:bg-blue-50"><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-destructive hover:bg-rose-50" onClick={() => void handleDelete(u)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4 mb-4">
            <DialogTitle className="text-2xl font-bold text-slate-900">
              {editUser ? "Modifier le Profil" : "Nouveau Compte Utilisateur"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-500">Prénom <span className="text-slate-400 font-normal">(optionnel)</span></Label>
              <Input value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} placeholder="Prénom" className="border-slate-300" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-500">Nom <span className="text-slate-400 font-normal">(optionnel)</span></Label>
              <Input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Nom" className="border-slate-300" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-500">Messager (Identifiant) *</Label>
              <Input 
                value={form.messager} 
                onChange={e => setForm(f => ({ ...f, messager: e.target.value }))} 
                placeholder="identifiant@messager" 
                disabled={!!editUser}
                className="border-slate-300" 
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-500">{editUser ? "Changer le Mot de passe" : "Mot de passe *"}</Label>
              <Input type="password" value={form.mot_pass} onChange={e => setForm(f => ({ ...f, mot_pass: e.target.value }))} placeholder="••••••••" className="border-slate-300" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-500">Rôle au sein de l'app</Label>
              <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                <SelectTrigger className="border-slate-300 uppercase"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => <SelectItem key={r} value={r} className="uppercase">{r.replace(/_/g, " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-500">Département affecté</Label>
              <Select value={form.id_departement} onValueChange={v => setForm(f => ({ ...f, id_departement: v }))}>
                <SelectTrigger className="border-slate-300"><SelectValue placeholder="Sél. un département" /></SelectTrigger>
                <SelectContent>
                  {departements.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs font-bold uppercase text-slate-500">Grade / Fonction</Label>
              <Input value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))} placeholder="ex: Analyste Confirmé..." className="border-slate-300 font-medium" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600">Tel. Professionnel</Label>
              <Input value={form.telephone_professional} onChange={e => setForm(f => ({ ...f, telephone_professional: e.target.value }))} placeholder="0550..." className="border-blue-200" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600">Tel. Personnel</Label>
              <Input value={form.telephone_personnel} onChange={e => setForm(f => ({ ...f, telephone_personnel: e.target.value }))} placeholder="0660..." className="border-slate-200" />
            </div>

            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs font-bold uppercase text-slate-500">Adresse Résidentielle</Label>
              <Input value={form.adresse} onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))} placeholder="Cité 100 log..." className="border-slate-300" />
            </div>

            <div className="col-span-2 flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-dashed border-slate-300">
               <input 
                type="checkbox" 
                id="check_p"
                checked={form.is_chef_project} 
                onChange={e => setForm(f => ({ ...f, is_chef_project: e.target.checked }))}
                className="w-4 h-4 rounded text-blue-600"
               />
               <Label htmlFor="check_p" className="text-sm font-bold text-slate-700 cursor-pointer italic">Ce collaborateur agit en tant que Chef de Projet</Label>
            </div>
          </div>

          <DialogFooter className="bg-slate-50 -mx-6 -mb-6 p-6 mt-6 border-t rounded-b-lg">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-300">Annuler</Button>
            <Button onClick={() => void handleSave()} disabled={saving || (!editUser && (!form.messager || !form.mot_pass))} className="bg-blue-600 hover:bg-blue-700 min-w-[120px]">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {editUser ? "Enregistrer" : "Créer le Profil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
