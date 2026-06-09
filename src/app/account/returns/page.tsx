import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ReturnsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Pengajuan Retur</h1>
        <p className="text-muted-foreground">Isi form di bawah ini untuk mengajukan pengembalian barang.</p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Ketentuan Retur</AlertTitle>
        <AlertDescription className="text-sm">
          Retur hanya dapat dilakukan maksimal 3x24 jam sejak pesanan berstatus Selesai, dan harus disertai dengan video unboxing lengkap tanpa jeda.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Form Retur</CardTitle>
          <CardDescription>Pilih pesanan dan jelaskan alasan retur secara detail.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6 max-w-2xl">
            <div className="space-y-2">
              <Label htmlFor="orderSelect">Pilih Pesanan</Label>
              <Select>
                <SelectTrigger id="orderSelect">
                  <SelectValue placeholder="Pilih Invoice yang selesai..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INV/20230902/0045">INV/20230902/0045 - 02 Sep 2023</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reasonSelect">Alasan Retur</Label>
              <Select>
                <SelectTrigger id="reasonSelect">
                  <SelectValue placeholder="Pilih alasan..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rusak">Barang Rusak / Cacat</SelectItem>
                  <SelectItem value="tidak_sesuai">Barang Tidak Sesuai Deskripsi</SelectItem>
                  <SelectItem value="kurang">Jumlah Barang Kurang</SelectItem>
                  <SelectItem value="expired">Barang Mendekati / Lewat Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="details">Detail Kendala</Label>
              <Textarea 
                id="details" 
                placeholder="Ceritakan secara spesifik kendala yang Anda alami..." 
                className="min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Bukti Foto / Video (Wajib)</Label>
              <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <UploadCloud className="h-6 w-6 text-primary" />
                </div>
                <p className="font-medium text-sm mb-1">Klik untuk upload atau drag & drop</p>
                <p className="text-xs text-muted-foreground">JPG, PNG, atau MP4 (Maks. 10MB)</p>
              </div>
            </div>

            <Button type="button" className="w-full sm:w-auto">Ajukan Retur</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
