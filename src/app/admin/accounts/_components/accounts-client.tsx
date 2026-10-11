"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Eye, Pencil, Search, Trash2, UserPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ROLES, ROLE_LABEL, type AccountRole } from "@/lib/accounts-rules";
import type { AccountRow } from "@/actions/accounts";
import { RoleBadge, dateFmt } from "./role-badge";
import { AccountFormDialog } from "./account-form-dialog";
import { AccountViewDialog } from "./account-view-dialog";
import { AccountDeleteDialog } from "./account-delete-dialog";

type Dialog =
  | { kind: "create" }
  | { kind: "edit"; account: AccountRow }
  | { kind: "view"; id: string }
  | { kind: "delete"; account: AccountRow };

export function AccountsClient({ accounts, currentUserId }: { accounts: AccountRow[]; currentUserId: string }) {
  const router = useRouter();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<AccountRole | "all">("all");
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return accounts.filter(
      (a) =>
        (roleFilter === "all" || a.role === roleFilter) &&
        (!q || a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || (a.phone ?? "").includes(q)),
    );
  }, [accounts, query, roleFilter]);

  const close = () => setDialog(null);
  const done = (message: string) => {
    setDialog(null);
    setNotice(message);
    router.refresh();
  };

  const actions = (a: AccountRow, layout: "icons" | "full") => {
    const isSelf = a.id === currentUserId;
    const base = layout === "icons" ? "h-8 w-8" : "h-8 flex-1 gap-1.5";
    const variant = layout === "icons" ? "ghost" : "outline";
    const size = layout === "icons" ? "icon" : "sm";
    return (
      <>
        <Button variant={variant} size={size} className={base} onClick={() => setDialog({ kind: "view", id: a.id })} aria-label={`Lihat ${a.name}`} title="Lihat">
          <Eye className="h-3.5 w-3.5" />{layout === "full" && "Lihat"}
        </Button>
        <Button variant={variant} size={size} className={base} onClick={() => setDialog({ kind: "edit", account: a })} aria-label={`Edit ${a.name}`} title="Edit">
          <Pencil className="h-3.5 w-3.5" />{layout === "full" && "Edit"}
        </Button>
        <Button
          variant={variant}
          size={size}
          className={`${base} text-destructive hover:bg-destructive/10`}
          onClick={() => setDialog({ kind: "delete", account: a })}
          disabled={isSelf}
          aria-label={`Hapus ${a.name}`}
          title={isSelf ? "Akun Anda sendiri tidak dapat dihapus" : "Hapus"}
        >
          <Trash2 className="h-3.5 w-3.5" />{layout === "full" && "Hapus"}
        </Button>
      </>
    );
  };

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Kelola Akun</h1>
          <p className="text-muted-foreground">Semua akun pelanggan, admin, dan Super Admin.</p>
        </div>
        <Button size="icon-lg" className="shrink-0" onClick={() => setDialog({ kind: "create" })} aria-label="Buat akun baru" title="Buat akun baru">
          <UserPlus className="h-4 w-4" />
        </Button>
      </div>

      {notice && (
        <p role="status" className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {notice}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama, email, atau telepon…" className="pl-8" aria-label="Cari akun" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Filter peran">
          {(["all", ...ROLES] as const).map((r) => (
            <Button key={r} size="sm" variant={roleFilter === r ? "default" : "outline"} className="whitespace-nowrap" onClick={() => setRoleFilter(r)} aria-pressed={roleFilter === r}>
              {r === "all" ? "Semua" : ROLE_LABEL[r]}
            </Button>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} dari {accounts.length} akun</p>

      <Card>
        <CardContent className="p-0">
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Peran</TableHead>
                  <TableHead>Dibuat</TableHead>
                  <TableHead className="text-right">Pesanan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">{accounts.length === 0 ? "Belum ada akun" : "Tidak ada akun yang cocok"}</TableCell></TableRow>
                )}
                {filtered.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.name}{a.id === currentUserId && <span className="ml-2 text-xs font-normal text-muted-foreground">(Anda)</span>}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.email}</TableCell>
                    <TableCell><RoleBadge role={a.role} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{dateFmt(a.createdAt)}</TableCell>
                    <TableCell className="text-right text-sm">{a.orderCount}</TableCell>
                    <TableCell><div className="flex justify-end gap-1">{actions(a, "icons")}</div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="divide-y md:hidden">
            {filtered.map((a) => (
              <div key={a.id} className="space-y-2 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{a.name}{a.id === currentUserId && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(Anda)</span>}</p>
                    <p className="truncate text-xs text-muted-foreground">{a.email}</p>
                  </div>
                  <RoleBadge role={a.role} />
                </div>
                <p className="text-[11px] text-muted-foreground">Dibuat {dateFmt(a.createdAt)} · {a.orderCount} pesanan</p>
                <div className="flex gap-2 pt-1">{actions(a, "full")}</div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">{accounts.length === 0 ? "Belum ada akun" : "Tidak ada akun yang cocok"}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {dialog?.kind === "create" && (
        <AccountFormDialog account={null} currentUserId={currentUserId} onClose={close} onSaved={done} />
      )}
      {dialog?.kind === "edit" && (
        <AccountFormDialog key={dialog.account.id} account={dialog.account} currentUserId={currentUserId} onClose={close} onSaved={done} />
      )}
      {dialog?.kind === "view" && <AccountViewDialog accountId={dialog.id} onClose={close} />}
      {dialog?.kind === "delete" && <AccountDeleteDialog account={dialog.account} onClose={close} onDeleted={done} />}
    </div>
  );
}
