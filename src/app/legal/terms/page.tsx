export const metadata = { title: "Términos y condiciones — SharpBet" };

export default function TermsPage() {
  return (
    <article className="prose-legal">
      <h1 className="font-display font-black text-3xl text-text-primary mb-2">Términos y condiciones</h1>
      <p className="text-text-muted text-sm mb-10">Última actualización: mayo de 2025</p>

      <Section title="1. Descripción del servicio">
        <p>
          SharpBet es una plataforma de entretenimiento de predicciones deportivas que opera
          exclusivamente con <strong>puntos virtuales</strong>. No se utiliza dinero real en ninguna
          operación de la plataforma. SharpBet no es un servicio de apuestas con dinero real y no
          está sujeto a la regulación de juegos de azar con dinero real.
        </p>
      </Section>

      <Section title="2. Aceptación de los términos">
        <p>
          Al crear una cuenta en SharpBet aceptas estos Términos y condiciones en su totalidad.
          Si no estás de acuerdo con alguno de los términos, debes dejar de utilizar el servicio.
        </p>
      </Section>

      <Section title="3. Elegibilidad">
        <ul>
          <li>Debes tener al menos <strong>18 años</strong> para registrarte.</li>
          <li>Solo se permite una cuenta por persona.</li>
          <li>El servicio está disponible para usuarios de cualquier país salvo restricción legal aplicable.</li>
        </ul>
      </Section>

      <Section title="4. Puntos virtuales">
        <ul>
          <li>Los puntos virtuales no tienen valor monetario y no pueden canjearse por dinero.</li>
          <li>Al registrarte recibes 1.000 puntos de bienvenida.</li>
          <li>Los puntos se pueden ganar realizando predicciones correctas, completando ofertas
              en la sección "Ganar puntos" y mediante otras promociones que SharpBet pueda ofrecer.</li>
          <li>Los puntos acumulados pueden canjearse por recompensas virtuales o físicas disponibles
              en el catálogo de la plataforma, sujeto a disponibilidad.</li>
          <li>SharpBet se reserva el derecho de ajustar el saldo de puntos en caso de error técnico
              o uso fraudulento.</li>
        </ul>
      </Section>

      <Section title="5. Reglas de predicción">
        <ul>
          <li>Cada usuario puede tener como máximo <strong>una apuesta activa</strong> simultáneamente.</li>
          <li>Una vez realizada una predicción no puede modificarse.</li>
          <li>Los resultados de los eventos son definitivos una vez publicados por el administrador.</li>
          <li>En caso de cancelación de un evento, los puntos apostados son devueltos íntegramente.</li>
        </ul>
      </Section>

      <Section title="6. Conducta del usuario">
        <p>Queda prohibido:</p>
        <ul>
          <li>Manipular, hackear o explotar errores de la plataforma.</li>
          <li>Crear cuentas múltiples para obtener ventaja.</li>
          <li>Usar bots o scripts automatizados.</li>
          <li>Cualquier comportamiento que perjudique la experiencia de otros usuarios.</li>
        </ul>
        <p>El incumplimiento puede resultar en la suspensión o eliminación de la cuenta sin previo aviso.</p>
      </Section>

      <Section title="7. Suspensión y cancelación">
        <p>
          SharpBet puede suspender o eliminar cualquier cuenta que infrinja estos términos.
          El usuario puede eliminar su cuenta en cualquier momento desde la página de perfil.
          Los puntos virtuales se eliminan junto con la cuenta y no son recuperables.
        </p>
      </Section>

      <Section title="8. Limitación de responsabilidad">
        <p>
          SharpBet se ofrece "tal cual", sin garantías de disponibilidad continua. No nos
          hacemos responsables de pérdidas de puntos virtuales por causas técnicas ajenas a
          nuestra voluntad. Dado que los puntos no tienen valor monetario, no existe responsabilidad
          económica asociada al uso de la plataforma.
        </p>
      </Section>

      <Section title="9. Modificaciones">
        <p>
          Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios
          sustanciales serán comunicados a los usuarios registrados con al menos 7 días de antelación.
          El uso continuado de la plataforma tras la entrada en vigor de los cambios implica su aceptación.
        </p>
      </Section>

      <Section title="10. Contacto">
        <p>
          Para cualquier consulta relacionada con estos términos puedes escribirnos a{" "}
          <a href="mailto:info@sharpbet.es" className="text-accent hover:underline">
            info@sharpbet.es
          </a>.
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
