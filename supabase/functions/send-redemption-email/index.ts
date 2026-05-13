import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface RedemptionEmailRequest {
  email: string;
  nombre: string;
  reward_nombre: string;
  status: "pending" | "processing" | "completed" | "cancelled";
  puntos: number;
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

    <div class="details">
      <h3>Detalles de tu canje:</h3>
      <p><strong>Nombre:</strong> ${data.nombre}</p>
      <p><strong>Premio:</strong> ${data.reward_nombre}</p>
      <p><strong>Puntos utilizados:</strong> ${data.puntos.toLocaleString()}</p>
      <p><strong>Estado:</strong> ${statusInfo.status}</p>
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
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const data: RedemptionEmailRequest = await req.json();

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500 }
      );
    }

    const statusInfo = statusMessages[data.status];

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "PlayfulBet <noreply@playfulbet.com>",
        to: data.email,
        subject: statusInfo.subject,
        html: emailTemplate(data, statusInfo),
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", result);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: result }),
        { status: 500 }
      );
    }

    return new Response(JSON.stringify({ success: true, messageId: result.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
});
