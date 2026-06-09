"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSent(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-muted/20">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-3xl font-bold tracking-tight text-primary">
              si4care<span className="text-foreground">.</span>
            </span>
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center pb-4">
            {isSent ? (
              <>
                <div className="flex justify-center mb-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                  </div>
                </div>
                <CardTitle className="text-2xl">Email Terkirim!</CardTitle>
                <CardDescription className="mt-1">
                  Kami telah mengirim link reset password ke <strong>{email}</strong>. Silakan cek inbox atau folder spam Anda.
                </CardDescription>
              </>
            ) : (
              <>
                <div className="flex justify-center mb-3">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="h-7 w-7 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-2xl">Lupa Password?</CardTitle>
                <CardDescription className="mt-1">
                  Masukkan email akun Anda. Kami akan mengirimkan link untuk mereset password.
                </CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent>
            {isSent ? (
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground text-center">
                  Link reset password berlaku selama <strong>30 menit</strong>. Jika tidak menerima email, coba kirim ulang.
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => { setIsSent(false); setEmail(""); }}
                >
                  Kirim ke email lain
                </Button>
                <Link href="/login">
                  <Button className="w-full">Kembali ke Login</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Alamat Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <Button type="submit" className="w-full h-11" disabled={isLoading || !email}>
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengirim...</>
                  ) : (
                    "Kirim Link Reset Password"
                  )}
                </Button>
                <div className="text-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Login
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
