"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import Link from "next/link";
import { ArrowLeft, Upload } from "lucide-react";

const CATEGORY_OPTIONS = [
  { value: "digital", label: "Digital" },
  { value: "fisico", label: "Físico" },
];

export default function NewRewardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");

  const [form, setForm] = useState({
    id: "",
    nombre: "",
    descripcion: "",
    puntos_necesarios: "",
    valor_euros: "",
    categoria: "digital" as "digital" | "fisico",
    imagen_url: "",
  });

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setForm((f) => ({ ...f, imagen_url: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nombre || !form.descripcion || !form.puntos_necesarios || !form.valor_euros || !form.imagen_url) {
      toast.error("Rellena todos los campos");
      return;
    }

    setLoading(true);
    try {
      const rewardId = parseInt(form.id) || Date.now();

      const { error } = await supabase.from("rewards").insert({
        id: rewardId,
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        puntos_necesarios: parseInt(form.puntos_necesarios),
        valor_euros: parseFloat(form.valor_euros),
        categoria: form.categoria,
        tipo: form.categoria,
        imagen_url: form.imagen_url,
      });

      if (error) {
        toast.error("Error al crear el premio: " + error.message);
        setLoading(false);
        return;
      }

      toast.success("¡Premio creado correctamente!");
      router.push("/admin/rewards");
    } catch (error) {
      toast.error("Error al guardar la imagen o premio");
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Link href="/admin/rewards">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={16} />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="font-display font-black text-3xl text-text-primary">Nuevo Premio</h1>
            <p className="text-text-muted text-sm">Crea un nuevo premio para los usuarios</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-text-primary">Información del premio</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              {/* ID */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">ID (auto)</label>
                <Input
                  type="number"
                  value={form.id}
                  onChange={(e) => update("id", e.target.value)}
                  placeholder="Dejar vacío para auto-generar"
                />
                <p className="text-xs text-text-muted mt-1">Se genera automáticamente si está vacío</p>
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Nombre *</label>
                <Input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => update("nombre", e.target.value)}
                  placeholder="Ej: Tarjeta Amazon 5€"
                  required
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Descripción *</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => update("descripcion", e.target.value)}
                  placeholder="Ej: Código regalo Amazon válido en amazon.es"
                  rows={3}
                  className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition resize-none"
                  required
                />
              </div>

              {/* Puntos necesarios */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Puntos necesarios *</label>
                <Input
                  type="number"
                  value={form.puntos_necesarios}
                  onChange={(e) => update("puntos_necesarios", e.target.value)}
                  placeholder="Ej: 15000"
                  required
                />
              </div>

              {/* Valor en euros */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Valor en euros *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.valor_euros}
                  onChange={(e) => update("valor_euros", e.target.value)}
                  placeholder="Ej: 5.00"
                  required
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Categoría *</label>
                <Select
                  value={form.categoria}
                  onChange={(e) => update("categoria", e.target.value)}
                  options={CATEGORY_OPTIONS}
                />
              </div>

              {/* Imagen */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Imagen *</label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-accent transition cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-input"
                    required={!imagePreview}
                  />
                  <label htmlFor="image-input" className="cursor-pointer block">
                    {imagePreview ? (
                      <div className="space-y-2">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-32 h-32 object-cover mx-auto rounded-lg"
                        />
                        <p className="text-sm text-text-muted">Click para cambiar imagen</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="mx-auto text-text-muted" size={32} />
                        <p className="text-text-primary font-medium">Sube una imagen</p>
                        <p className="text-text-muted text-sm">Haz click o arrastra una imagen</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </CardBody>
          </Card>

          <div className="flex gap-3 mt-6">
            <Link href="/admin/rewards" className="flex-1">
              <Button variant="secondary" className="w-full">
                Cancelar
              </Button>
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-lg bg-accent hover:bg-accent-dim text-background font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creando..." : "Crear Premio"}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
