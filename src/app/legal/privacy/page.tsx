import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de privacidad — SharpBet",
  description: "Política de privacidad y tratamiento de datos personales de SharpBet conforme al RGPD.",
  alternates: { canonical: "https://www.sharpbet.es/legal/privacy" },
  robots: { index: true, follow: false },
};

export default function PrivacyPage() {
  return (
    <article>
      <h1 className="font-display font-black text-3xl text-text-primary mb-2">Política de privacidad</h1>
      <p className="text-text-muted text-sm mb-10">Última actualización: mayo de 2025</p>

      <Section title="1. Responsable del tratamiento">
        <p>
          El responsable del tratamiento de los datos personales recogidos a través de SharpBet es el
          titular de la plataforma. Para ejercer tus derechos o resolver cualquier duda puedes
          contactar en{" "}
          <a href="mailto:info@sharpbet.es" className="text-accent hover:underline">
            info@sharpbet.es
          </a>.
        </p>
      </Section>

      <Section title="2. Datos que recogemos">
        <ul>
          <li><strong>Datos de cuenta:</strong> dirección de correo electrónico y nombre de usuario elegido al registrarse.</li>
          <li><strong>Datos de actividad:</strong> predicciones realizadas, puntos acumulados, historial de canjes.</li>
          <li><strong>Datos técnicos:</strong> dirección IP, tipo de navegador y sistema operativo, recogidos automáticamente para seguridad y rendimiento.</li>
        </ul>
        <p>No recogemos datos de pago ni información financiera de ningún tipo.</p>
      </Section>

      <Section title="3. Finalidad del tratamiento">
        <ul>
          <li>Gestionar el registro y la cuenta del usuario.</li>
          <li>Proveer el servicio de predicciones y gestión de puntos virtuales.</li>
          <li>Enviar comunicaciones relacionadas con el servicio (resolución de canjes, novedades).</li>
          <li>Detectar y prevenir usos fraudulentos o contrarios a los términos de uso.</li>
          <li>Mejorar la plataforma mediante el análisis anónimo del uso.</li>
        </ul>
      </Section>

      <Section title="4. Base legal">
        <p>
          El tratamiento se basa en la ejecución del contrato de servicio aceptado al registrarse
          (Art. 6.1.b RGPD) y en el interés legítimo para la seguridad de la plataforma (Art. 6.1.f RGPD).
          Los correos de comunicación de servicio se envían en base al mismo contrato.
        </p>
      </Section>

      <Section title="5. Proveedores de servicios">
        <p>
          Para el funcionamiento de la plataforma utilizamos los siguientes proveedores, que pueden
          tratar datos como encargados del tratamiento:
        </p>
        <ul>
          <li><strong>Supabase</strong> — base de datos y autenticación (servidores en la UE).</li>
          <li><strong>Vercel</strong> — alojamiento web (servidores en la UE/EEA).</li>
          <li><strong>Monlix</strong> — sistema de ofertas para ganar puntos (datos de actividad anónima).</li>
        </ul>
        <p>
          Dichos proveedores están sujetos a sus propias políticas de privacidad y cumplen con el RGPD o
          cuentan con las garantías adecuadas para transferencias internacionales.
        </p>
      </Section>

      <Section title="6. Conservación de datos">
        <p>
          Los datos se conservan mientras la cuenta esté activa. Al eliminar la cuenta, los datos
          personales se borran en un plazo máximo de 30 días, salvo obligación legal de conservación.
        </p>
      </Section>

      <Section title="7. Tus derechos">
        <p>Tienes derecho a:</p>
        <ul>
          <li><strong>Acceso:</strong> solicitar qué datos tuyos tenemos.</li>
          <li><strong>Rectificación:</strong> corregir datos inexactos.</li>
          <li><strong>Supresión:</strong> solicitar el borrado de tu cuenta y datos asociados.</li>
          <li><strong>Portabilidad:</strong> recibir tus datos en formato legible por máquina.</li>
          <li><strong>Oposición:</strong> oponerte a determinados tratamientos.</li>
        </ul>
        <p>
          Para ejercer cualquiera de estos derechos, escríbenos a{" "}
          <a href="mailto:info@sharpbet.es" className="text-accent hover:underline">
            info@sharpbet.es
          </a>{" "}
          con el asunto "Derechos RGPD". Responderemos en un plazo máximo de 30 días.
          También puedes presentar reclamación ante la Agencia Española de Protección de Datos (aepd.es).
        </p>
      </Section>

      <Section title="8. Cookies">
        <p>
          SharpBet utiliza únicamente cookies técnicas estrictamente necesarias para el
          funcionamiento de la sesión de usuario. No utilizamos cookies de rastreo publicitario
          propias. Los proveedores terceros (Monlix) pueden utilizar cookies propias sujetas
          a sus políticas.
        </p>
      </Section>

      <Section title="9. Cambios en esta política">
        <p>
          Podemos actualizar esta política ocasionalmente. Te notificaremos por correo electrónico
          si los cambios son sustanciales. La versión actualizada siempre estará disponible en esta página.
        </p>
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="font-semibold text-text-primary text-lg mb-3">{title}</h2>
      <div className="text-text-secondary text-sm leading-relaxed space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_strong]:text-text-primary">
        {children}
      </div>
    </section>
  );
}
