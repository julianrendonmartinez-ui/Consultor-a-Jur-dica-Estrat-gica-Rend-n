/* ==========================================================================
   TABLERO — galería de las 17 piezas, ficha de arte y comparativa
   ========================================================================== */

const { useState, useEffect, useRef, useLayoutEffect, useCallback, useMemo } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "tipografia": "fraunces",
  "composicion": "top",
  "paleta": "marfil",
  "telefono": "22 27 10 79 08",
  "mostrarCotas": false,
  "foto": true
}/*EDITMODE-END*/;

/* ---------- tarjeta del tablero ---------- */

function Card({ piece, tweaks, onOpen }) {
  const ref = useRef(null);
  const [scale, setScale] = useState(0.28);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(el.clientWidth / 1080));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <article className="card">
      <div className="card__frame" ref={ref} onClick={() => onOpen(piece)} role="button" tabIndex={0}
           onKeyDown={(e) => { if (e.key === 'Enter') onOpen(piece); }}
           aria-label={`Abrir pieza ${piece.n}: ${piece.servicio}`}>
        <div className="card__scaler" style={{ transform: `scale(${scale})` }}>
          <RPost piece={piece} tweaks={tweaks} />
        </div>
      </div>
      <div className="card__meta">
        <span className="card__n">{piece.n}</span>
        <div>
          <div className="card__t">{piece.servicio}</div>
          <div className="card__s">{labelFormato(piece.formato)} · {piece.linea === 'ia' ? 'Rendón IA' : 'Legal'}</div>
        </div>
      </div>
    </article>
  );
}

function labelFormato(f) {
  return ({
    portada: 'Portada', titular: 'Antes de firmar', clausula: 'Cláusula roja', retrato: 'Retrato · quién te atiende',
    marca: 'Sangrado tipográfico', checklist: 'Checklist de 3', documentos: 'Expediente',
    caso: 'Caso sin nombre', dato: 'Dato duro', cita: 'Cita editorial',
    tipografico: 'Tipográfico', energia: 'Energía', metodo: 'Método',
    cierre: 'Cómo empezar'
  })[f] || f;
}

/* ---------- ficha / detalle ---------- */

function Focus({ pieces, index, tweaks, onClose, onNav, onToast }) {
  const piece = pieces[index];
  const [tab, setTab] = useState('ig');
  const stageRef = useRef(null);
  const [scale, setScale] = useState(0.6);

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const fit = () => {
      const s = Math.min((el.clientWidth - 60) / 1080, (el.clientHeight - 130) / 1350);
      setScale(Math.max(0.18, s));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNav(1);
      if (e.key === 'ArrowLeft') onNav(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onNav]);

  useEffect(() => { setTab('ig'); }, [piece.id]);

  const texto = tab === 'fb' ? piece.captionFB : piece.captionIG;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      onToast('Copy copiado');
    } catch (e) {
      onToast('No se pudo copiar');
    }
  };

  const descargar = async () => {
    const nodo = document.querySelector(`[data-export="${piece.id}"] .rpost`);
    if (!nodo) { onToast('Pieza no encontrada'); return; }
    onToast('Generando PNG 1080 × 1350…');
    try {
      const dataUrl = await window.htmlToImage.toPng(nodo, {
        width: 1080, height: 1350, pixelRatio: 2,
        backgroundColor: 'transparent',
        style: { transform: 'none', transformOrigin: 'top left' }
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `Rendon-${piece.n}-${piece.id}.png`;
      a.click();
      onToast('PNG descargado');
    } catch (e) {
      console.error(e);
      onToast('Error al exportar');
    }
  };

  return (
    <div className="focus" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="focus__stage" ref={stageRef}>
        <div data-export={piece.id} style={{ width: 1080, height: 1350, transform: `scale(${scale})`, transformOrigin: 'center center', flex: '0 0 auto' }}>
          <RPost piece={piece} tweaks={tweaks} />
        </div>
        <div className="focus__nav" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => onNav(-1)} aria-label="Anterior">←</button>
          <span>{String(index + 1).padStart(2, '0')} / {pieces.length}</span>
          <button onClick={() => onNav(1)} aria-label="Siguiente">→</button>
        </div>
      </div>

      <aside className="focus__panel" onClick={(e) => e.stopPropagation()}>
        <div className="focus__top">
          <div>
            <h4>{piece.servicio}</h4>
            <p>Pieza {piece.n} · {labelFormato(piece.formato)} · {piece.persona}</p>
          </div>
          <button className="xbtn" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <div className="focus__tabs">
          <button aria-pressed={tab === 'ig'} onClick={() => setTab('ig')}>Instagram</button>
          <button aria-pressed={tab === 'fb'} onClick={() => setTab('fb')}>Facebook</button>
          <button aria-pressed={tab === 'arte'} onClick={() => setTab('arte')}>Arte</button>
        </div>

        <div className="focus__copy">
          {tab === 'arte' ? (
            <ArteFicha piece={piece} tweaks={tweaks} />
          ) : (
            <>
              <pre>{texto}</pre>
              {piece.clave && tab === 'ig' && (
                <pre style={{ color: 'rgba(18,35,59,.5)', fontSize: 11.5 }}>
                  {`Primer comentario:\n${piece.clave} → WhatsApp ${tweaks.telefono}\nTarjeta digital: ${RENDON.tarjeta}`}
                </pre>
              )}
            </>
          )}
        </div>

        <div className="focus__acts">
          <button className="btn btn--solid" onClick={descargar}>Descargar PNG</button>
          <button className="btn" onClick={copiar}>Copiar copy</button>
          <button className="btn btn--ghost" onClick={async () => {
            await navigator.clipboard.writeText(`${texto}\n\n${RENDON.tarjeta}`);
            onToast('Copy + tarjeta copiados');
          }}>Copy + tarjeta</button>
        </div>
      </aside>
    </div>
  );
}

function ArteFicha({ piece, tweaks }) {
  const filas = [
    ['Formato', labelFormato(piece.formato)],
    ['Línea', piece.linea === 'ia' ? 'Rendón IA' : 'Legal'],
    ['Persona', piece.persona],
    ['Palabra clave', piece.clave || '—'],
    ['Titular', piece.titular.filter(Boolean).join(' / ')],
    ['Prueba', piece.prueba || '—'],
    ['Medida', '1080 × 1350 px · 4:5'],
    ['Márgenes', '92 px laterales · 84 px superior'],
    ['Display', { fraunces: 'Fraunces', newsreader: 'Newsreader', instrument: 'Instrument Serif' }[tweaks.tipografia]],
    ['Texto', 'Public Sans'],
    ['Paleta', tweaks.paleta],
    ['CTA', piece.clave ? `${piece.clave} → WhatsApp ${tweaks.telefono}` : `WhatsApp ${tweaks.telefono}`]
  ];
  return (
    <div>
      {filas.map(([k, v]) => (
        <div key={k} style={{ display: 'grid', gridTemplateColumns: '92px 1fr', gap: 10, padding: '9px 0', borderBottom: '1px solid rgba(18,35,59,.09)' }}>
          <span style={{ fontSize: 9.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(18,35,59,.46)', paddingTop: 2 }}>{k}</span>
          <span style={{ fontSize: 12.5, lineHeight: 1.45, color: 'rgba(18,35,59,.88)' }}>{v}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- aplicación ---------- */

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [foco, setFoco] = useState(null);
  const [toast, setToast] = useState(null);
  const [filtro, setFiltro] = useState('todas');

  useEffect(() => {
    if (!foco) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (foco.index !== null) {
      window.parent.postMessage({ slideIndexChanged: foco.index }, '*');
      localStorage.setItem('rendon:pieza', String(foco.index));
    }
    return () => { document.body.style.overflow = prev; };
  }, [foco]);

  const notificar = useCallback((m) => {
    setToast(m);
    window.clearTimeout(notificar._t);
    notificar._t = window.setTimeout(() => setToast(null), 2200);
  }, []);

  /* agrupa en secciones por materia, respetando el orden de MATERIAS */
  const grupos = useMemo(() => {
    const visibles = filtro === 'todas' ? PIEZAS : PIEZAS.filter((p) => p.materia === filtro);
    return MATERIAS
      .map((m) => ({ ...m, piezas: visibles.filter((p) => p.materia === m.id) }))
      .filter((g) => g.piezas.length > 0);
  }, [filtro]);

  const abrir = (piece) => {
    const idx = PIEZAS.findIndex((p) => p.id === piece.id);
    setFoco({ index: idx });
  };

  const navegar = (delta) => {
    setFoco((f) => {
      if (!f) return f;
      const n = (f.index + delta + PIEZAS.length) % PIEZAS.length;
      return { index: n };
    });
  };

  return (
    <div className="board">
      <div className="bar">
        <div className="bar__id">
          <img className="bar__logo" src="assets/logo-rendon.png" alt="Consultoría Jurídica Estratégica Rendón" />
        </div>
        <div className="bar__spacer" />
      </div>

      <div className="intro">
            <h1 className="intro__wordmark">
              <span className="intro__wm-laton">Consultoría Jurídica</span>
              <span className="intro__wm-tinta">Estratégica Rendón</span>
            </h1>
            <div className="intro__cols">
              <p>
                Consultoría Jurídica Estratégica Rendón es un despacho en Puebla dedicado al derecho corporativo,
                contractual y laboral. Trabaja un paso antes de la firma: lee el documento, identifica el riesgo
                y lo explica antes de que la decisión sea irreversible. Su método tiene cuatro pasos —diagnóstico,
                documento, firma acompañada y seguimiento— y una regla interna: ninguna pieza sale de una plantilla.
              </p>
              <p>
                Al frente está Julián Alexander Rendón Martínez, abogado por la UPAEP, donde presentó la primera
                tesis de la Facultad sobre la incorporación de la inteligencia artificial al ejercicio jurídico
                en México. Cursó el Diplomado en Juicio de Amparo, es titular de la Dirección Legal Corporativa
                en Grupo Andar y ha asesorado controversias electorales ante el OPLE y el INE. Su trabajo cruza
                dos terrenos que rara vez se sientan en la misma mesa: el litigio y la tecnología aplicada al derecho.
              </p>
            </div>
          </div>

          <div className="chips" role="group" aria-label="Filtro">
            <button className="chip" aria-pressed={filtro === 'todas'} onClick={() => setFiltro('todas')}>
              Todas · {PIEZAS.length}
            </button>
            {MATERIAS.map((m) => (
              <button key={m.id} className="chip" aria-pressed={filtro === m.id} onClick={() => setFiltro(m.id)}>
                {m.nombre}
              </button>
            ))}
          </div>

          {grupos.map((g) => (
            <section className="materia" key={g.id} data-screen-label={`Materia — ${g.nombre}`}>
              <header className="materia__head">
                <div className="materia__title">
                  <h2>{g.nombre}</h2>
                  <span className="materia__count">{g.piezas.length} {g.piezas.length === 1 ? 'pieza' : 'piezas'}</span>
                </div>
                <p className="materia__nota">{g.nota}</p>
              </header>
              <div className="grid">
                {g.piezas.map((p) => <Card key={p.id} piece={p} tweaks={t} onOpen={abrir} />)}
              </div>
        </section>
      ))}


      {foco && (
        <Focus
          pieces={PIEZAS}
          index={foco.index}
          tweaks={t}
          onClose={() => setFoco(null)}
          onNav={navegar}
          onToast={notificar}
        />
      )}

      {toast && <div className="toast">{toast}</div>}

      <TweaksPanel>
        <TweakSection label="Tipografía" />
        <TweakSelect
          label="Display"
          value={t.tipografia}
          options={[
            { value: 'fraunces', label: 'Fraunces' },
            { value: 'newsreader', label: 'Newsreader' },
            { value: 'instrument', label: 'Instrument Serif' }
          ]}
          onChange={(v) => setTweak('tipografia', v)}
        />
        <TweakSection label="Composición" />
        <TweakRadio
          label="Titular"
          value={t.composicion}
          options={['top', 'bottom', 'bleed']}
          onChange={(v) => setTweak('composicion', v)}
        />
        <TweakSection label="Paleta" />
        <TweakRadio
          label="Fondo"
          value={t.paleta}
          options={['marfil', 'tinta', 'arena']}
          onChange={(v) => setTweak('paleta', v)}
        />
        <TweakSection label="Fotografía" />
        <TweakToggle
          label="Retrato en portada, 17 y cierre"
          value={t.foto !== false}
          onChange={(v) => setTweak('foto', v)}
        />
        <TweakSection label="CTA" />
        <TweakText label="Teléfono" value={t.telefono} onChange={(v) => setTweak('telefono', v)} />
        <TweakSuggestionBar suggestions={[
          'Cambia la tipografía a Newsreader y compárala',
          'Pon la composición en sangrado',
          'Prueba la paleta tinta dominante',
          '¿Cuál de las tres tipografías se lee mejor en celular?'
        ]} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
