import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface RedemptionEmailRequest {
  email: string;
  nombre: string;
  reward_nombre: string;
  status: "pending" | "processing" | "completed" | "cancelled";
  puntos: number;
  codigo_digital?: string;
}

const statusMessages = {
  pending: {
    subject: "Canje de premio recibido - PlayfulBet",
    title: "¡Tu canje ha sido recibido!",
    message:
      "Hemos recibido tu solicitud de canje. Nos pondremos en contacto pronto para confirmarlo.",
    color: "#ffd700",
  },
  processing: {
    subject: "Tu canje está siendo procesado - PlayfulBet",
    title: "🔄 Tu pedido está siendo procesado",
    message:
      "Tu canje está siendo preparado. Te enviaremos los detalles de envío pronto.",
    color: "#4488ff",
  },
  completed: {
    subject: "¡Tu canje ha sido completado! - PlayfulBet",
    title: "✅ ¡Tu pedido está en camino!",
    message:
      "Tu canje ha sido completado y está siendo enviado. Revisa tu email para los detalles de seguimiento.",
    color: "#00e676",
  },
  cancelled: {
    subject: "Tu canje ha sido cancelado - PlayfulBet",
    title: "❌ Tu canje fue cancelado",
    message:
      "Lamentablemente tu canje ha sido cancelado. Los puntos han sido reembolsados a tu cuenta.",
    color: "#ff4444",
  },
};

const emailTemplate = (data: RedemptionEmailRequest, statusInfo: any) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #00e676, #4488ff); color: white; padding: 30px; border-radius: 10px; text-align: center; }
    .content { background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 10px; border-left: 4px solid ${statusInfo.color}; }
    .status-badge { display: inline-block; background: ${statusInfo.color}; color: white; padding: 8px 15px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
    .details { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border: 1px solid #ddd; }
    .key-box { background: #0a0a0f; border: 2px solid #00e676; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center; }
    .key-label { color: #00e676; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
    .key-value { color: #ffffff; font-family: monospace; font-size: 22px; font-weight: bold; letter-spacing: 3px; word-break: break-all; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>PlayfulBet</h1>
      <p>Notificación de Canje</p>
    </div>

    <div class="content">
      <h2>${statusInfo.title}</h2>
      <div class="status-badge">${statusInfo.subject.split(" - ")[0]}</div>
      <p>${statusInfo.message}</p>
    </div>

    ${data.codigo_digital ? `
    <div class="key-box">
      <div class="key-label">🔑 Tu código digital</div>
      <div class="key-value">${data.codigo_digital}</div>
    </div>
    <p style="text-align:center; color:#666; font-size:13px;">Guarda este código en un lugar seguro.</p>
    ` : ""}

    <div class="details">
      <h3>Detalles de tu canje:</h3>
      <p><strong>Nombre:</strong> ${data.nombre}</p>
      <p><strong>Premio:</strong> ${data.reward_nombre}</p>
      <p><strong>Puntos utilizados:</strong> ${data.puntos.toLocaleString()}</p>
      <p><strong>Estado:</strong> ${statusInfo.subject.split(" - ")[0]}</p>
    </div>

    <p>Si tienes dudas, contáctanos respondiendo a este email.</p>

    <div class="footer">
      <p>© 2024 PlayfulBet. Todos los derechos reservados.</p>
      <p>Este es un email automático, no responder a esta dirección.</p>
    </div>
  </div>
</body>
</html>
`;

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info, x-api-key",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    console.log("📧 Función invocada");
    const data: RedemptionEmailRequest = await req.json();
    console.log("📨 Datos recibidos:", { email: data.email, nombre: data.nombre, status: data.status, tiene_codigo: !!data.codigo_digital });

    if (!RESEND_API_KEY) {
      console.error("❌ RESEND_API_KEY no configurado");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ RESEND_API_KEY está configurado");
    const statusInfo = statusMessages[data.status];

    if (!statusInfo) {
      console.error("❌ Estado inválido:", data.status);
      return new Response(
        JSON.stringify({ error: "Invalid status" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("📤 Enviando email a Resend API...");
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "PlayfulBet <noreply@camposdegalicia.es>",
        to: data.email,
        subject: statusInfo.subject,
        html: emailTemplate(data, statusInfo),
      }),
    });

    const result = await response.json();
    console.log("📩 Respuesta Resend:", { status: response.status, result });

    if (!response.ok) {
      console.error("❌ Error Resend API:", result);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: result }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Email enviado exitosamente. ID:", result.id);
    return new Response(JSON.stringify({ success: true, messageId: result.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Error no capturado:", error);
    return new Response(JSON.stringify({ error: "Internal server error", details: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
