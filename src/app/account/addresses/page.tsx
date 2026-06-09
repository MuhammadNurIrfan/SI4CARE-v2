import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Plus, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const addresses = [
  {
    id: 1,
    name: "Budi Santoso",
    phone: "0812-3456-7890",
    address: "Jl. Kesehatan Raya No. 123, Blok B, RT 01/RW 02",
    city: "Kebayoran Baru, Jakarta Selatan, DKI Jakarta 12345",
    isPrimary: true,
    label: "Rumah",
  },
  {
    id: 2,
    name: "Budi Santoso",
    phone: "0812-3456-7890",
    address: "Gedung Medika Tower Lt. 12, Jl. Jend. Sudirman",
    city: "Setiabudi, Jakarta Selatan, DKI Jakarta 12920",
    isPrimary: false,
    label: "Kantor",
  },
];

export default function AddressesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Buku Alamat</h1>
          <p className="text-muted-foreground">Kelola alamat pengiriman pesanan Anda.</p>
        </div>
        <Button className="shrink-0 gap-2">
          <Plus className="h-4 w-4" /> Tambah Alamat Baru
        </Button>
      </div>

      <div className="grid gap-4">
        {addresses.map((addr) => (
          <Card key={addr.id} className={addr.isPrimary ? "border-primary/50 bg-primary/5" : ""}>
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    <MapPin className={`h-5 w-5 ${addr.isPrimary ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-base">{addr.label}</span>
                      {addr.isPrimary && <Badge variant="default" className="text-[10px] h-5 px-2">Utama</Badge>}
                    </div>
                    <p className="font-semibold text-foreground mb-1">{addr.name} <span className="font-normal text-muted-foreground">({addr.phone})</span></p>
                    <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">
                      {addr.address}<br />
                      {addr.city}
                    </p>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="-mr-2" />}>
                    <MoreVertical className="h-5 w-5 text-muted-foreground" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="gap-2">
                      <Pencil className="h-4 w-4" /> Ubah
                    </DropdownMenuItem>
                    {!addr.isPrimary && (
                      <DropdownMenuItem className="gap-2">
                        <MapPin className="h-4 w-4" /> Jadikan Utama
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
                      <Trash2 className="h-4 w-4" /> Hapus
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
