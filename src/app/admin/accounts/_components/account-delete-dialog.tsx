"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { deleteAccount, type AccountRow } from "@/actions/accounts";

export function AccountDeleteDialog({
  account,
  onClose,
  onDeleted,
}: {
  account: AccountRow;
  onClose: () => void;
  onDeleted: (message: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function confirm() {
    setError(null);
    start(async () => {
      try {
        const result = await deleteAccount(account.id);
        if (!result.ok) return setError(result.error);
        onDeleted(`Akun ${account.email} dihapus`);
      } catch {
        setError("Gagal menghapus. Periksa koneksi lalu coba lagi.");
      }
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !pending && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Hapus akun ini?</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{account.name}</span> ({account.email}) tidak akan bisa login lagi, dan alamat serta keranjangnya ikut terhapus.
            {account.orderCount > 0 && ` ${account.orderCount} pesanan miliknya tetap tersimpan tanpa pemilik.`} Tindakan ini tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>

        {error && <p role="alert" className="rounded bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>Batal</Button>
          <Button variant="destructive" onClick={confirm} disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Hapus akun
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
