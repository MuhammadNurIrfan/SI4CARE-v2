import { Badge } from "@/components/ui/badge";
import { ROLE_LABEL, type AccountRole } from "@/lib/accounts-rules";

const VARIANT: Record<AccountRole, "default" | "secondary" | "outline"> = {
  super_admin: "default",
  admin: "secondary",
  customer: "outline",
};

export function RoleBadge({ role }: { role: AccountRole }) {
  return <Badge variant={VARIANT[role]}>{ROLE_LABEL[role]}</Badge>;
}

export const dateFmt = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
