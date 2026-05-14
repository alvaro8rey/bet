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
    subject: "Premio solicitado - SharpBet",
    title: "¡Tu solicitud de premio ha sido recibida!",
    message: "Hemos recibido tu solicitud. Nos pondremos en contacto contigo pronto para confirmar los detalles.",
    color: "#ffd700",
    emoji: "🎁",
  },
  processing: {
    subject: "Tu premio está siendo preparado - SharpBet",
    title: "Tu premio está en camino",
    message: "Estamos preparando tu premio. Te avisaremos en cuanto esté listo para el envío.",
    color: "#4488ff",
    emoji: "🔄",
  },
  completed: {
    subject: "¡Tu premio está en camino! - SharpBet",
    title: "¡Premio enviado con éxito!",
    message: "Tu premio ha sido enviado. Si es un producto físico, recibirás los datos de seguimiento por separado.",
    color: "#00e676",
    emoji: "✅",
  },
  cancelled: {
    subject: "Solicitud de premio cancelada - SharpBet",
    title: "Tu solicitud ha sido cancelada",
    message: "Lamentablemente tu solicitud de premio ha sido cancelada. Los puntos han sido devueltos a tu cuenta.",
    color: "#ff4444",
    emoji: "❌",
  },
};

const emailTemplate = (data: RedemptionEmailRequest, statusInfo: any) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background: #f4f4f5; color: #18181b; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 24px 16px; }
    .card { background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: #09090b; padding: 32px 24px; text-align: center; }
    .logo { color: #00e676; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 4px; }
    .header-sub { color: #71717a; font-size: 13px; }
    .status-banner { background: ${statusInfo.color}18; border-bottom: 3px solid ${statusInfo.color}; padding: 20px 24px; text-align: center; }
    .status-emoji { font-size: 36px; margin-bottom: 8px; }
    .status-title { font-size: 20px; font-weight: 700; color: #18181b; margin-bottom: 6px; }
    .status-msg { font-size: 14px; color: #52525b; line-height: 1.6; }
    .body { padding: 24px; }
    .key-box { background: #09090b; border: 1.5px solid #00e676; border-radius: 12px; padding: 20px; margin: 0 0 24px; text-align: center; }
    .key-label { color: #00e676; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px; }
    .key-value { color: #ffffff; font-family: 'Courier New', monospace; font-size: 20px; font-weight: 700; letter-spacing: 4px; word-break: break-all; }
    .key-note { color: #52525b; font-size: 12px; margin-top: 8px; }
    .details { background: #fafafa; border: 1px solid #e4e4e7; border-radius: 10px; padding: 16px; margin-bottom: 20px; }
    .details-title { font-size: 13px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
    .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e4e4e7; font-size: 14px; }
    .detail-row:last-child { border-bottom: none; padding-bottom: 0; }
    .detail-label { color: #71717a; }
    .detail-value { font-weight: 600; color: #18181b; }
    .points-value { color: #00e676; }
    .help { font-size: 13px; color: #71717a; line-height: 1.6; margin-bottom: 20px; }
    .help a { color: #00e676; text-decoration: none; }
    .footer { background: #fafafa; border-top: 1px solid #e4e4e7; padding: 16px 24px; text-align: center; }
    .footer p { color: #a1a1aa; font-size: 11px; line-height: 1.8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">

      <div class="header">
        <div class="logo">⚡ SharpBet</div>
        <div class="header-sub">Plataforma de predicciones deportivas</div>
      </div>

      <div class="status-banner">
        <div class="status-emoji">${statusInfo.emoji}</div>
        <div class="status-title">${statusInfo.title}</div>
        <div class="status-msg">${statusInfo.message}</div>
      </div>

      <div class="body">

        ${data.codigo_digital ? `
        <div class="key-box">
          <div class="key-label">🔑 Tu código digital</div>
          <div class="key-value">${data.codigo_digital}</div>
          <div class="key-note">Guarda este código en un lugar seguro.</div>
        </div>
        ` : ""}

        <div class="details">
          <div class="details-title">Detalles del premio</div>
          <div class="detail-row">
            <span class="detail-label">Nombre</span>
            <span class="detail-value">${data.nombre}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Premio</span>
            <span class="detail-value">${data.reward_nombre}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Puntos utilizados</span>
            <span class="detail-value points-value">${data.puntos.toLocaleString("es-ES")} pts</span>
          </div>
        </div>

        <p class="help">
          ¿Tienes alguna pregunta? Escríbenos a <a href="mailto:premios@sharpbet.es">premios@sharpbet.es</a> y te respondemos lo antes posible.
        </p>

      </div>

      <div class="footer">
        <p>© 2025 SharpBet · Plataforma de predicciones con puntos virtuales<br>
        Sin dinero real · <a href="https://www.sharpbet.es/legal/terms" style="color:#71717a;">Términos</a> · <a href="https://www.sharpbet.es/legal/privacy" style="color:#71717a;">Privacidad</a></p>
      </div>

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
    const data: RedemptionEmailRequest = await req.json();

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY no configurado");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const statusInfo = statusMessages[data.status];
    if (!statusInfo) {
      return new Response(
        JSON.stringify({ error: "Invalid status" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "SharpBet <premios@sharpbet.es>",
        to: data.email,
        subject: statusInfo.subject,
        html: emailTemplate(data, statusInfo),
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Error Resend API:", result);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: result }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ Email enviado: ${data.email} status=${data.status} id=${result.id}`);
    return new Response(JSON.stringify({ success: true, messageId: result.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error no capturado:", error);
    return new Response(JSON.stringify({ error: "Internal server error", details: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
