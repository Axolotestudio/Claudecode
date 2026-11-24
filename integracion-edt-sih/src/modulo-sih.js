  /* ===== Integración SIH: infraestructura y plantilla por nivel (sin equipos) ===== */
  const DIAS_SEMANA = 5;
  const fmt1 = n => n == null ? '—' : n.toLocaleString('es-MX', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  /* Catálogo de categorías del SIH. MF, ME y OM son los médicos que mide el EDT. */
  const CATEGORIAS = [['MF', 'Médicos familiares'], ['ME', 'Médicos especialistas'], ['OM', 'Otros médicos'], ['RE', 'Residentes'], ['EN', 'Enfermeras'],
    ['PA', 'Paramédicos'], ['TE', 'Técnicos'], ['AD', 'Administrativas'], ['LI', 'Limpieza e higiene']];
  const NOMBRE_CAT = Object.fromEntries(CATEGORIAS);
  const CAT_MEDIDAS = ['MF', 'ME', 'OM'];
  const TURNOS = ['Matutino', 'Matutino', 'Vespertino', 'Nocturno', 'Jornada acumulada'];
  const TEMAS = [['prod', 'Productividad', 'pulso'], ['infra', 'Infraestructura', 'hospital'], ['plant', 'Plantilla', 'personas']];

  function catMedicoArea(a) { return a.nombre === 'Medicina familiar' ? 'MF' : /Urgencias|continua/.test(a.nombre) ? 'OM' : 'ME'; }
  function plantilla(n) {
    if (n._pl) return n._pl;
    const t = Object.fromEntries(CATEGORIAS.map(([k]) => [k, 0]));
    if (n.tipo === 'area') {
      const r = rng('pl|' + n.id), m = n.medicos;
      t[catMedicoArea(n)] = m;
      t.RE = n.umf ? 0 : Math.round(m * entre(r, .05, .2));
      t.EN = n.enfermeria || 0;
      t.PA = Math.round(m * entre(r, .1, .25)); t.TE = Math.round(m * entre(r, .15, .4));
      t.AD = Math.round(m * entre(r, .3, .6)); t.LI = Math.round(m * entre(r, .2, .4));
    } else {
      (n.tipo === 'nacional' ? RAICES : hijos(n)).forEach(h => { const p = plantilla(h); CATEGORIAS.forEach(([k]) => { t[k] += p[k]; }); });
    }
    return (n._pl = completar(t));
  }
  function completar(t) {
    t.total = CATEGORIAS.reduce((s, [k]) => s + t[k], 0);
    t.medicos = CAT_MEDIDAS.reduce((s, k) => s + t[k], 0);
    t.otras = t.total - t.medicos - t.RE - t.EN;
    return t;
  }
  function plantillaDe(nodos) {
    const t = Object.fromEntries(CATEGORIAS.map(([k]) => [k, 0]));
    nodos.forEach(h => { const p = plantilla(h); CATEGORIAS.forEach(([k]) => { t[k] += p[k]; }); });
    return completar(t);
  }
  /* Uso de la capacidad: cruza la productividad del EDT con la infraestructura del SIH */
  function usoDe(nodos, w) {
    const t = { cam: 0, qui: 0, con: 0, cr: 0, qr: 0, hr: 0, at: 0 };
    nodos.forEach(h => {
      t.cam += h.camas || 0; t.qui += h.quirofanos || 0; t.con += h.consultorios || 0;
      const m = metricas(h, w); t.cr += m.cr; t.qr += m.qr; t.hr += m.hr; t.at += totalAt(m);
    });
    t.cpc = t.con ? t.cr / t.con / DIAS_SEMANA : null;
    t.cpq = t.qui ? t.qr / t.qui / DIAS_SEMANA : null;
    t.hpc = t.cam ? t.hr / t.cam : null;
    return t;
  }

  function pestanasTema(idv, actual) {
    return `<div class="s-subtabs" role="tablist" aria-label="Tema de consulta">${TEMAS.map(([k, t, ic]) => `<button class="s-subtab" type="button" role="tab" id="tab-${idv}-${k}" data-vista="${idv}" data-tab="${k}" aria-selected="${k === actual}" aria-controls="panel-${idv}" tabindex="${k === actual ? 0 : -1}">${I[ic]}<span>${t}</span></button>`).join('')}</div>`;
  }
  function conTema(idv, v, cab, cuerpo) {
    return cab + pestanasTema(idv, v.tab) + `<div id="panel-${idv}" role="tabpanel" aria-labelledby="tab-${idv}-${v.tab}">${cuerpo}</div>`;
  }
  function temaValido(v) { if (!TEMAS.some(([k]) => k === v.tab)) v.tab = 'prod'; return v.tab; }

  function thOrden(idv, v, campo, k, texto, der) {
    const o = v[campo], act = o.k === k, aria = act ? (o.dir > 0 ? 'ascending' : 'descending') : 'none';
    return `<th scope="col" class="s-th-ord${der ? ' s-der' : ''}" aria-sort="${aria}"><button class="s-lista__ord${act ? ' is-activa' : ''}" type="button" data-ordenar="${idv}" data-campo-orden="${campo}" data-k="${k}">${texto}<span class="s-lista__chev" aria-hidden="true">${I.ordenar}</span></button></th>`;
  }
  function paginar(v, filas) { const pags = Math.max(1, Math.ceil(filas.length / POR_PAGINA)); if (v.pagina > pags) v.pagina = pags; return filas.slice((v.pagina - 1) * POR_PAGINA, v.pagina * POR_PAGINA); }
  function celdaNombre(h, tema, sub) {
    return `<a class="s-celda-nombre" href="#/e/${h.id}?tab=${tema}"><span class="s-celda-nombre__t">${esc(h.nombre)}</span>${sub ? `<span class="s-celda-nombre__s">${esc(sub)}</span>` : ''}</a>`;
  }
  const subEntidad = h => [h.estado, h.tipoUnidad ? '' : '', h.titular].filter(Boolean).join(' · ');

  /* ---------- Infraestructura ---------- */
  function tarjetaRecurso(clase, icono, etiq, valor, usoEtq, usoVal, sinUso) {
    return `<article class="s-card s-recurso s-recurso--${clase}"><header class="s-recurso__cab"><span class="s-recurso__icono" aria-hidden="true">${icono}</span><h3 class="s-recurso__titulo">${etiq}</h3></header>
      <p class="s-recurso__valor s-num">${fmt(valor)}</p>
      <p class="s-recurso__uso">${usoVal == null ? esc(sinUso) : `<strong class="s-num">${fmt1(usoVal)}</strong> ${usoEtq}`}</p></article>`;
  }
  function panelInfra(idv, v, nodos, o) {
    const u = usoDe(nodos, ui.semana), al = esc(ctx.alcance || '');
    let html = `<section class="s-seccion" aria-labelledby="t-inf"><div class="s-seccion__cab"><h2 id="t-inf" class="s-seccion__h" tabindex="-1">Capacidad instalada <strong>${al}</strong></h2><p class="s-periodo">Uso calculado con la semana <mark class="s-num">${ui.semana}</mark></p></div>
      <div class="s-kpis s-kpis--3">
        ${tarjetaRecurso('cama', I.cama, 'Camas censables', u.cam, 'atenciones de hospitalización por cama en la semana', u.hpc, 'Sin camas censables')}
        ${tarjetaRecurso('quir', I.quirofano, 'Quirófanos', u.qui, 'cirugías por quirófano al día', u.cpq, 'Sin quirófanos')}
        ${tarjetaRecurso('cons', I.consultorio, 'Consultorios', u.con, 'consultas por consultorio al día', u.cpc, 'Sin consultorios')}
      </div></section>`;
    if (!o.hijos) return html;
    const filas = nodos.map(h => { const x = usoDe([h], ui.semana); return { n: h, nombre: h.nombre, cam: x.cam, qui: x.qui, con: x.con, cpc: x.cpc, cpq: x.cpq, hpc: x.hpc }; });
    const ord = ordenar(filas, v.ordenI), pag = paginar(v, ord);
    ui.conteo = ord.length;
    const cuerpo = pag.length ? pag.map(f => `<tr><td>${celdaNombre(f.n, 'infra', o.sub ? o.sub(f.n) : '')}</td><td class="s-der s-num">${fmt(f.cam)}</td><td class="s-der s-num">${fmt(f.qui)}</td><td class="s-der s-num">${fmt(f.con)}</td>
      <td class="s-der s-num">${fmt1(f.cpc)}</td><td class="s-der s-num">${fmt1(f.cpq)}</td><td class="s-der s-num">${fmt1(f.hpc)}</td></tr>`).join('')
      : '<tr><td colspan="7" class="s-vacio">Sin resultados con los filtros actuales.</td></tr>';
    return html + `<section class="s-seccion" aria-labelledby="t-${idv}">
      <div class="s-lista__barra"><h2 id="t-${idv}" class="s-seccion__h" tabindex="-1">${o.titulo} <span class="s-pill s-num">${fmt(ord.length)}</span></h2></div>
      <div class="s-card s-tabla-card"><div class="s-tabla-scroll" role="region" aria-labelledby="t-${idv}" tabindex="0"><table class="s-tabla s-tabla--ord"><caption class="s-sr">${o.titulo}: capacidad instalada y uso en la semana ${ui.semana}</caption>
        <thead><tr><th scope="col">${o.columna}</th>${thOrden(idv, v, 'ordenI', 'cam', 'Camas', 1)}${thOrden(idv, v, 'ordenI', 'qui', 'Quirófanos', 1)}${thOrden(idv, v, 'ordenI', 'con', 'Consultorios', 1)}
          ${thOrden(idv, v, 'ordenI', 'cpc', 'Consultas por consultorio al día', 1)}${thOrden(idv, v, 'ordenI', 'cpq', 'Cirugías por quirófano al día', 1)}${thOrden(idv, v, 'ordenI', 'hpc', 'Hospitalización por cama', 1)}</tr></thead>
        <tbody>${cuerpo}</tbody></table></div></div>${paginacion(idv, v, ord.length)}</section>`;
  }

  /* ---------- Plantilla ---------- */
  function graficaCategorias(pl) {
    const max = Math.max(1, ...CATEGORIAS.map(([k]) => pl[k]));
    return `<ul class="s-cats" aria-hidden="true">${CATEGORIAS.map(([k, t]) => `<li><span class="s-cats__valor s-num">${fmt(pl[k])}</span><span class="s-cats__barra${CAT_MEDIDAS.includes(k) ? ' s-cats__barra--medida' : ''}" style="height:${Math.max(2, Math.round(120 * pl[k] / max))}px"></span><span class="s-cats__etq">${t}</span></li>`).join('')}</ul>
      <p class="s-par__leyenda"><span class="s-cats__sw s-cats__sw--medida"></span>Con productividad medida <span class="s-cats__sw"></span>Sin productividad medida</p>
      <table class="s-sr"><caption>Personal por categoría</caption><thead><tr><th scope="col">Categoría</th><th scope="col">Personas</th><th scope="col">Productividad medida</th></tr></thead><tbody>${CATEGORIAS.map(([k, t]) => `<tr><td>${t}</td><td>${fmt(pl[k])}</td><td>${CAT_MEDIDAS.includes(k) ? 'Sí' : 'No'}</td></tr>`).join('')}</tbody></table>`;
  }
  function resumenPlantilla(pl, u) {
    const apm = pl.medicos ? u.at / pl.medicos : null;
    return `<section class="s-panel s-panel--personal s-resumen" aria-label="Resumen de la plantilla"><div class="s-ind__filas">
      ${filaInd('s-ind--personal', I.personas, 'Personal total', pl.total, [['Médicos', pl.medicos], ['Residentes', pl.RE], ['Enfermeras', pl.EN], ['Otras categorías', pl.otras]])}
      <span class="s-ind__sep" aria-hidden="true"></span>
      <div class="s-ind"><div class="s-ind__txt"><p class="s-ind__etq">Atenciones por médico en la semana ${ui.semana}</p><p class="s-ind__valor s-num">${fmt1(apm)}</p></div></div>
    </div></section>`;
  }
  function panelPlantilla(idv, v, nodos, o) {
    const pl = plantillaDe(nodos), u = usoDe(nodos, ui.semana), al = esc(ctx.alcance || '');
    let html = `<section class="s-seccion" aria-labelledby="t-pl"><div class="s-seccion__cab"><h2 id="t-pl" class="s-seccion__h" tabindex="-1">Plantilla <strong>${al}</strong></h2><p class="s-periodo">Atenciones de la semana <mark class="s-num">${ui.semana}</mark></p></div>
      ${resumenPlantilla(pl, u)}
      <section class="s-card s-seccion s-cats-card" aria-labelledby="t-cat-${idv}"><h3 id="t-cat-${idv}" class="s-seccion__h">Personal por categoría</h3>${graficaCategorias(pl)}</section></section>`;
    if (o.personas) return html + listaPersonal(idv, v, o.personas);
    if (!o.hijos) return html;
    const filas = nodos.map(h => { const p = plantilla(h), x = usoDe([h], ui.semana); return { n: h, nombre: h.nombre, tot: p.total, med: p.medicos, enf: p.EN, otr: p.total - p.medicos - p.EN, apm: p.medicos ? x.at / p.medicos : null }; });
    const ord = ordenar(filas, v.ordenP), pag = paginar(v, ord);
    ui.conteo = ord.length;
    const cuerpo = pag.length ? pag.map(f => `<tr><td>${celdaNombre(f.n, 'plant', o.sub ? o.sub(f.n) : '')}</td><td class="s-der s-num">${fmt(f.tot)}</td><td class="s-der s-num">${fmt(f.med)}</td><td class="s-der s-num">${fmt(f.enf)}</td><td class="s-der s-num">${fmt(f.otr)}</td><td class="s-der s-num">${fmt1(f.apm)}</td></tr>`).join('')
      : '<tr><td colspan="6" class="s-vacio">Sin resultados con los filtros actuales.</td></tr>';
    return html + `<section class="s-seccion" aria-labelledby="t-${idv}">
      <div class="s-lista__barra"><h2 id="t-${idv}" class="s-seccion__h" tabindex="-1">${o.titulo} <span class="s-pill s-num">${fmt(ord.length)}</span></h2></div>
      <div class="s-card s-tabla-card"><div class="s-tabla-scroll" role="region" aria-labelledby="t-${idv}" tabindex="0"><table class="s-tabla s-tabla--ord"><caption class="s-sr">${o.titulo}: plantilla y atenciones por médico en la semana ${ui.semana}</caption>
        <thead><tr><th scope="col">${o.columna}</th>${thOrden(idv, v, 'ordenP', 'tot', 'Personal total', 1)}${thOrden(idv, v, 'ordenP', 'med', 'Médicos', 1)}${thOrden(idv, v, 'ordenP', 'enf', 'Enfermeras', 1)}${thOrden(idv, v, 'ordenP', 'otr', 'Otras categorías', 1)}${thOrden(idv, v, 'ordenP', 'apm', 'Atenciones por médico', 1)}</tr></thead>
        <tbody>${cuerpo}</tbody></table></div></div>${paginacion(idv, v, ord.length)}</section>`;
  }
  /* Personas del servicio: médicos del EDT (con productividad) y resto de la plantilla del SIH (sin meta) */
  function personalArea(n) {
    if (n._pers) return n._pers;
    const k0 = catMedicoArea(n);
    const lista = hijos(n).map(mm => { const e = expediente(mm); return { med: mm, nombre: cap(mm.nombre), matricula: e.matricula, cat: k0, turno: e.turno }; });
    const pl = plantilla(n);
    ['RE', 'EN', 'PA', 'TE', 'AD', 'LI'].forEach(k => {
      for (let i = 0; i < pl[k]; i++) {
        const r = rng(`p|${n.id}|${k}|${i}`), p = persona(r);
        lista.push({ med: null, nombre: cap(`${p.ap1} ${p.ap2} ${p.nombre}`), matricula: String(10000000 + Math.floor(r() * 89999999)), cat: k, turno: elegir(r, TURNOS) });
      }
    });
    return (n._pers = lista);
  }
  function listaPersonal(idv, v, personas) {
    const filas = personas.map(p => { const it = p.med ? item(p.med, ui.semana) : null; return Object.assign({}, p, { cump: it ? it.cump : null, orden: CATEGORIAS.findIndex(([k]) => k === p.cat) }); })
      .sort((a, b) => a.orden - b.orden || (a.cump ?? 999) - (b.cump ?? 999) || a.nombre.localeCompare(b.nombre, 'es'));
    const pag = paginar(v, filas);
    ui.conteo = filas.length;
    const cuerpo = pag.length ? pag.map(p => `<tr><td>${p.med ? `<a class="s-celda-nombre" href="#/e/${p.med.id}"><span class="s-celda-nombre__t">${esc(p.nombre)}</span><span class="s-celda-nombre__s s-num">Matrícula ${p.matricula}</span></a>` : `<span class="s-celda-nombre"><span class="s-celda-nombre__t">${esc(p.nombre)}</span><span class="s-celda-nombre__s s-num">Matrícula ${p.matricula}</span></span>`}</td>
      <td>${NOMBRE_CAT[p.cat]}</td><td>${p.turno}</td><td>${p.med ? cumpFila(p.cump) : '<span class="s-sinmeta">Sin productividad medida</span>'}</td></tr>`).join('')
      : '<tr><td colspan="4" class="s-vacio">Sin resultados con los filtros actuales.</td></tr>';
    return `<section class="s-seccion" aria-labelledby="t-${idv}">
      <div class="s-lista__barra"><h2 id="t-${idv}" class="s-seccion__h" tabindex="-1">Personal del servicio <span class="s-pill s-num">${fmt(filas.length)}</span></h2></div>
      <div class="s-card s-tabla-card"><div class="s-tabla-scroll" role="region" aria-labelledby="t-${idv}" tabindex="0"><table class="s-tabla"><caption class="s-sr">Personal del servicio con su cumplimiento en la semana ${ui.semana}</caption>
        <thead><tr><th scope="col">Personal / matrícula</th><th scope="col">Categoría</th><th scope="col">Turno</th><th scope="col">Cumplimiento semana ${ui.semana}</th></tr></thead>
        <tbody>${cuerpo}</tbody></table></div></div>${paginacion(idv, v, filas.length)}</section>`;
  }

