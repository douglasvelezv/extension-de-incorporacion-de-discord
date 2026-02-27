// popup.js - Discord Onboarding Exporter

let guildData = null;
let onboardingData = null;
let currentToken = null;
let currentGuildId = null;

const btnScan = document.getElementById('btnScan');
const btnDownload = document.getElementById('btnDownload');
const mainContent = document.getElementById('mainContent');
const dlBar = document.getElementById('dlBar');
const serverInfo = document.getElementById('serverInfo');
const toast = document.getElementById('toast');

// ─────────────────────────────────────────────
// UI Helpers
// ─────────────────────────────────────────────
function setContent(html) { mainContent.innerHTML = html; }

function showToast(msg, color, duration = 3000) {
  toast.textContent = msg;
  toast.style.background = color || '#23a55a';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

function showLoading(msg) {
  setContent(`<div class="state"><div class="state-icon spin">⚙️</div>
    <div class="state-title">Cargando...</div>
    <div class="state-desc">${msg}</div></div>`);
}

function showError(msg) {
  dlBar.classList.remove('visible');
  setContent(`<div class="state"><div class="state-icon">⚠️</div>
    <div class="state-title">Error</div>
    <div class="state-desc">${msg}</div></div>`);
}

// ─────────────────────────────────────────────
// API Discord
// ─────────────────────────────────────────────
async function discordFetch(path, token) {
  const r = await fetch('https://discord.com/api/v10' + path, {
    headers: { 'Authorization': token }
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error('API ' + r.status + ': ' + (e.message || path));
  }
  return r.json();
}

// ─────────────────────────────────────────────
// Render sections
// ─────────────────────────────────────────────
function escHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function cdnEmoji(id, animated) {
  return 'https://cdn.discordapp.com/emojis/' + id + (animated ? '.gif' : '.png') + '?size=64';
}

function renderEmoji(emoji) {
  if (!emoji) return '❓';
  if (emoji.id) return `<img src="${cdnEmoji(emoji.id, emoji.animated)}" style="width:18px;height:18px;vertical-align:middle;border-radius:3px;">`;
  return emoji.name || '❓';
}

function sectionToggle(id) {
  const el = document.getElementById('sec-' + id);
  if (el) el.classList.toggle('open');
}

function buildSections(guild, onboarding) {
  // Mapeamos channel_ids a nombres usando la data del guild
  const channelMap = {};
  (guild.channels || []).forEach(c => { channelMap[c.id] = c.name; });

  // ── 1. INCORPORACIÓN / WELCOME ──
  let welcomeHtml = '';
  const welcome = onboarding.welcome_message || {};
  
  // Mensaje de bienvenida
  let wMsg = welcome.description || onboarding.description || '';
  
  // Banner/imagen del servidor
  let bannerHtml = '';
  if (guild.banner) {
    const ext = guild.banner.startsWith('a_') ? 'gif' : 'png';
    const bannerUrl = `https://cdn.discordapp.com/banners/${guild.id}/${guild.banner}.${ext}?size=480`;
    bannerHtml = `<div style="margin-bottom:8px;border-radius:8px;overflow:hidden;border:1px solid var(--border)">
      <img src="${bannerUrl}" style="width:100%;display:block;" onerror="this.parentElement.style.display='none'">
    </div>`;
  }

  // Splash del servidor
  let splashHtml = '';
  if (guild.splash) {
    const splashUrl = `https://cdn.discordapp.com/splashes/${guild.id}/${guild.splash}.png?size=480`;
    splashHtml = `<div style="margin-bottom:8px;border-radius:8px;overflow:hidden;border:1px solid var(--border)">
      <img src="${splashUrl}" style="width:100%;display:block;" onerror="this.parentElement.style.display='none'">
    </div>`;
  }

  welcomeHtml += bannerHtml + splashHtml;

  if (wMsg) {
    welcomeHtml += `<div class="item">
      <div class="item-icon">💬</div>
      <div class="item-text">
        <div class="item-title">Mensaje de bienvenida</div>
        <div class="item-content">${escHtml(wMsg)}</div>
      </div>
    </div>`;
  }

  // Tareas pendientes (prompts con type=0 suelen ser tareas de incorporación)
  const prompts = onboarding.prompts || [];
  const tasks = prompts.filter(p => p.in_onboarding && p.type === 0);
  const questions = prompts.filter(p => p.in_onboarding && p.type === 1);
  const rulesPrompts = prompts.filter(p => !p.in_onboarding);

  // Canales predeterminados
  const defaultChannels = onboarding.default_channel_ids || [];
  if (defaultChannels.length > 0) {
    welcomeHtml += `<div class="item">
      <div class="item-icon">📌</div>
      <div class="item-text">
        <div class="item-title">Canales predeterminados (${defaultChannels.length})</div>
        <div class="item-content">${defaultChannels.map(id => '#' + (channelMap[id] || id)).join(', ')}</div>
      </div>
    </div>`;
  }

  // Tareas de onboarding
  tasks.forEach(task => {
    const opts = task.options || [];
    let optsHtml = opts.map(o => {
      let iconHtml = '';
      if (o.emoji) iconHtml = renderEmoji(o.emoji);
      else if (o.emoji_id) iconHtml = `<img src="${cdnEmoji(o.emoji_id, false)}" style="width:16px;height:16px;vertical-align:middle;">`;
      
      const channels = (o.channel_ids || []).map(id => '#' + (channelMap[id] || id)).join(', ');
      return `<div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
        <span style="font-size:14px">${iconHtml || '📌'}</span>
        <div>
          <div style="font-size:11px;font-weight:700">${escHtml(o.title || o.description || '')}</div>
          ${channels ? `<div style="font-size:10px;color:var(--muted);font-family:'DM Mono',monospace">${channels}</div>` : ''}
        </div>
      </div>`;
    }).join('');

    welcomeHtml += `<div class="item">
      <div class="item-icon">✅</div>
      <div class="item-text">
        <div class="item-title">${escHtml(task.title || 'Tarea')}</div>
        <span class="tag ${task.required ? 'tag-req' : 'tag-opt'}">${task.required ? 'Requerida' : 'Opcional'}</span>
        ${optsHtml}
      </div>
    </div>`;
  });

  const countWelcome = (wMsg ? 1 : 0) + tasks.length + (defaultChannels.length > 0 ? 1 : 0);

  // ── 2. PREGUNTAS ──
  let questionsHtml = '';
  questions.forEach((q, qi) => {
    const opts = q.options || [];
    let optsHtml = opts.map(o => {
      let iconHtml = '';
      if (o.emoji && o.emoji.id) iconHtml = `<img src="${cdnEmoji(o.emoji.id, o.emoji.animated)}" style="width:20px;height:20px;border-radius:4px;vertical-align:middle;">`;
      else if (o.emoji && o.emoji.name) iconHtml = `<span style="font-size:16px">${o.emoji.name}</span>`;

      const channels = (o.channel_ids || []).map(id => '#' + (channelMap[id] || id));
      const roles = o.role_ids || [];

      return `<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
        <div style="width:26px;height:26px;background:var(--bg3);border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid var(--border)">
          ${iconHtml || '<span style="font-size:13px">•</span>'}
        </div>
        <div style="flex:1">
          <div style="font-size:11px;font-weight:700">${escHtml(o.title||o.description||'Opción '+(opts.indexOf(o)+1))}</div>
          ${o.description && o.title ? `<div style="font-size:10px;color:#9da5b4">${escHtml(o.description)}</div>` : ''}
          ${channels.length ? `<div style="font-size:9px;color:var(--muted);font-family:'DM Mono',monospace">→ ${channels.join(', ')}</div>` : ''}
          ${roles.length ? `<div style="font-size:9px;color:#a0aaff;font-family:'DM Mono',monospace">🎖 ${roles.length} rol(es) asignado(s)</div>` : ''}
        </div>
      </div>`;
    }).join('');

    const typeLabel = q.single_select ? 'Selección única' : 'Múltiple';
    questionsHtml += `<div class="item">
      <div class="item-icon" style="font-size:13px;font-weight:800;color:var(--accent)">${qi+1}</div>
      <div class="item-text">
        <div class="item-title">${escHtml(q.title || 'Pregunta ' + (qi+1))}</div>
        <span class="tag ${q.required ? 'tag-req' : 'tag-opt'}">${q.required ? 'Requerida' : 'Opcional'}</span>
        <span class="tag tag-choice">${typeLabel}</span>
        <div style="margin-top:4px">${optsHtml}</div>
      </div>
    </div>`;
  });

  // ── 3. NORMAS/REGLAS ──
  // Las normas pueden estar en el canal de reglas o en prompts especiales
  let rulesHtml = '';
  
  // Canal de reglas configurado
  if (guild.rules_channel_id) {
    const ruleName = channelMap[guild.rules_channel_id] || guild.rules_channel_id;
    rulesHtml += `<div class="item">
      <div class="item-icon">📌</div>
      <div class="item-text">
        <div class="item-title">Canal de normas</div>
        <div class="item-content">#${escHtml(ruleName)}</div>
      </div>
    </div>`;
  }

  // Normas de la pantalla de incorporación (último paso)
  const rulesScreen = onboarding.rules_prompt || onboarding.enabled && rulesPrompts[0];
  if (rulesScreen) {
    rulesHtml += `<div class="item">
      <div class="item-icon">📋</div>
      <div class="item-text">
        <div class="item-title">${escHtml(rulesScreen.title || 'Pantalla de normas')}</div>
        <div class="item-content">${escHtml(rulesScreen.description || rulesScreen.title || '')}</div>
      </div>
    </div>`;
  }

  // Descripción/normas del servidor
  if (guild.description) {
    rulesHtml += `<div class="item">
      <div class="item-icon">📝</div>
      <div class="item-text">
        <div class="item-title">Descripción del servidor</div>
        <div class="item-content">${escHtml(guild.description)}</div>
      </div>
    </div>`;
  }

  // Verificación requerida
  const verif = ['Ninguna','Baja (email verificado)','Media (5 min en Discord)','Alta (10 min en servidor)','Máxima (teléfono verificado)'];
  if (guild.verification_level !== undefined) {
    rulesHtml += `<div class="item">
      <div class="item-icon">🛡️</div>
      <div class="item-text">
        <div class="item-title">Verificación requerida</div>
        <div class="item-content">${verif[guild.verification_level] || 'Nivel ' + guild.verification_level}</div>
      </div>
    </div>`;
  }

  // Filtro de contenido explícito
  const filters = ['Sin filtro','Solo miembros sin roles','Todos los mensajes'];
  if (guild.explicit_content_filter !== undefined) {
    rulesHtml += `<div class="item">
      <div class="item-icon">🔞</div>
      <div class="item-text">
        <div class="item-title">Filtro de contenido</div>
        <div class="item-content">${filters[guild.explicit_content_filter] || 'Nivel ' + guild.explicit_content_filter}</div>
      </div>
    </div>`;
  }

  if (!rulesHtml) {
    rulesHtml = `<div style="padding:12px 0;font-size:11px;color:var(--muted);font-family:'DM Mono',monospace">
      No se encontraron normas en la API. Las normas pueden estar en mensajes fijados del canal de normas.
    </div>`;
  }

  // ── Build HTML ──
  const sectionsHtml = `
    <div class="sections visible" id="sectionsContainer">
      <div class="section open" id="sec-inc">
        <div class="section-header" onclick="sectionToggle('inc')">
          <div class="section-icon">📋</div>
          <div class="section-title">Incorporación</div>
          <div class="section-count">${countWelcome} elementos</div>
          <div class="section-arrow">▶</div>
        </div>
        <div class="section-body">${welcomeHtml || '<div style="font-size:11px;color:var(--muted);font-family:DM Mono,monospace;padding:8px 0">Sin datos de incorporación.</div>'}</div>
      </div>

      <div class="section" id="sec-preg">
        <div class="section-header" onclick="sectionToggle('preg')">
          <div class="section-icon">❓</div>
          <div class="section-title">Preguntas de unión</div>
          <div class="section-count">${questions.length} pregunta(s)</div>
          <div class="section-arrow">▶</div>
        </div>
        <div class="section-body">${questionsHtml || '<div style="font-size:11px;color:var(--muted);font-family:DM Mono,monospace;padding:8px 0">No hay preguntas configuradas.</div>'}</div>
      </div>

      <div class="section" id="sec-norm">
        <div class="section-header" onclick="sectionToggle('norm')">
          <div class="section-icon">📜</div>
          <div class="section-title">Normas del servidor</div>
          <div class="section-count">Configuración</div>
          <div class="section-arrow">▶</div>
        </div>
        <div class="section-body">${rulesHtml}</div>
      </div>
    </div>
  `;

  setContent(sectionsHtml);
  dlBar.classList.add('visible');
}

// ─────────────────────────────────────────────
// ZIP Builder
// ─────────────────────────────────────────────
function crc32(data) {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) { let c = i; for (let j = 0; j < 8; j++) c = (c&1) ? (0xEDB88320^(c>>>1)) : (c>>>1); t[i]=c; }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) crc = t[(crc^data[i])&0xFF]^(crc>>>8);
  return (crc^0xFFFFFFFF)>>>0;
}
function u16(n){return[n&0xFF,(n>>8)&0xFF];}
function u32(n){return[n&0xFF,(n>>8)&0xFF,(n>>16)&0xFF,(n>>24)&0xFF];}

function buildZip(files) {
  const enc = new TextEncoder();
  const now = new Date();
  const dd = ((now.getFullYear()-1980)<<9)|((now.getMonth()+1)<<5)|now.getDate();
  const dt = (now.getHours()<<11)|(now.getMinutes()<<5)|Math.floor(now.getSeconds()/2);
  const locals = [];
  let offset = 0;

  for (const f of files) {
    const nb = enc.encode(f.name);
    const data = f.data instanceof Uint8Array ? f.data : new Uint8Array(f.data);
    const crc = crc32(data);
    const local = new Uint8Array([
      0x50,0x4B,0x03,0x04,0x14,0x00,0x00,0x00,0x00,0x00,
      ...u16(dt),...u16(dd),...u32(crc),...u32(data.length),...u32(data.length),
      ...u16(nb.length),0x00,0x00,...nb
    ]);
    locals.push({local,data,nb,crc,size:data.length,offset,dt,dd});
    offset += local.length + data.length;
  }

  const centrals = locals.map(f => new Uint8Array([
    0x50,0x4B,0x01,0x02,0x14,0x00,0x14,0x00,0x00,0x00,0x00,0x00,
    ...u16(f.dt),...u16(f.dd),...u32(f.crc),...u32(f.size),...u32(f.size),
    ...u16(f.nb.length),0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    ...u32(f.offset),...f.nb
  ]));

  const cSize = centrals.reduce((s,c)=>s+c.length,0);
  const eocd = new Uint8Array([
    0x50,0x4B,0x05,0x06,0x00,0x00,0x00,0x00,
    ...u16(locals.length),...u16(locals.length),...u32(cSize),...u32(offset),0x00,0x00
  ]);

  const total = offset + cSize + eocd.length;
  const out = new Uint8Array(total);
  let pos = 0;
  for (const f of locals) { out.set(f.local,pos); pos+=f.local.length; out.set(f.data,pos); pos+=f.data.length; }
  for (const c of centrals) { out.set(c,pos); pos+=c.length; }
  out.set(eocd,pos);
  return out;
}

function sanitize(n) { return String(n).replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').replace(/\s+/g,'_').substring(0,80); }

async function fetchBlob(url) {
  try { const r = await fetch(url); if(!r.ok) return null; return r.blob(); } catch(e) { return null; }
}
function blobToAB(blob) {
  return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=e=>res(e.target.result); r.onerror=rej; r.readAsArrayBuffer(blob); });
}

// ─────────────────────────────────────────────
// Generate TXT files
// ─────────────────────────────────────────────
function generateIncorporacionTxt(guild, onboarding) {
  const channelMap = {};
  (guild.channels || []).forEach(c => { channelMap[c.id] = c.name; });

  const prompts = onboarding.prompts || [];
  const tasks = prompts.filter(p => p.in_onboarding && p.type === 0);
  const defaultChannels = onboarding.default_channel_ids || [];

  const lines = [];
  lines.push('╔══════════════════════════════════════════════════╗');
  lines.push('║         INCORPORACIÓN DEL SERVIDOR               ║');
  lines.push('╚══════════════════════════════════════════════════╝');
  lines.push('Servidor: ' + guild.name);
  lines.push('ID: ' + guild.id);
  lines.push('Generado: ' + new Date().toLocaleString('es'));
  lines.push('');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('MENSAJE DE BIENVENIDA');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const wMsg = (onboarding.welcome_message || {}).description || onboarding.description || '(Sin mensaje configurado)';
  lines.push(wMsg);
  lines.push('');

  if (defaultChannels.length > 0) {
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('CANALES PREDETERMINADOS (' + defaultChannels.length + ')');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    defaultChannels.forEach(id => { lines.push('  • #' + (channelMap[id] || id)); });
    lines.push('');
  }

  if (tasks.length > 0) {
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('TAREAS PENDIENTES (' + tasks.length + ')');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    tasks.forEach((t, i) => {
      lines.push('');
      lines.push('[Tarea ' + (i+1) + '] ' + (t.title || 'Sin título') + ' (' + (t.required ? 'REQUERIDA' : 'OPCIONAL') + ')');
      (t.options || []).forEach(o => {
        const ch = (o.channel_ids || []).map(id => '#'+(channelMap[id]||id)).join(', ');
        lines.push('  ▶ ' + (o.title || o.description || 'Opción') + (ch ? ' → ' + ch : ''));
      });
    });
  }

  lines.push('');
  lines.push('Incorporación activa: ' + (onboarding.enabled ? 'SÍ' : 'NO'));
  lines.push('Modo: ' + (onboarding.mode === 0 ? 'Servidor completo' : 'Solo canales seleccionados'));
  return lines.join('\n');
}

function generatePreguntasTxt(guild, onboarding) {
  const channelMap = {};
  (guild.channels || []).forEach(c => { channelMap[c.id] = c.name; });

  const prompts = onboarding.prompts || [];
  const questions = prompts.filter(p => p.in_onboarding && p.type === 1);

  const lines = [];
  lines.push('╔══════════════════════════════════════════════════╗');
  lines.push('║         PREGUNTAS DE UNIÓN AL SERVIDOR           ║');
  lines.push('╚══════════════════════════════════════════════════╝');
  lines.push('Servidor: ' + guild.name);
  lines.push('ID: ' + guild.id);
  lines.push('Generado: ' + new Date().toLocaleString('es'));
  lines.push('Total de preguntas: ' + questions.length);
  lines.push('');

  if (questions.length === 0) {
    lines.push('Este servidor no tiene preguntas de incorporación configuradas.');
  } else {
    questions.forEach((q, qi) => {
      lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      lines.push('PREGUNTA ' + (qi+1) + ' de ' + questions.length);
      lines.push('Título: ' + (q.title || 'Sin título'));
      lines.push('Tipo: ' + (q.single_select ? 'Selección única' : 'Selección múltiple'));
      lines.push('Requerida: ' + (q.required ? 'SÍ' : 'NO'));
      lines.push('');
      lines.push('Opciones:');
      (q.options || []).forEach((o, oi) => {
        const emoji = (o.emoji && o.emoji.name) ? o.emoji.name + ' ' : '';
        const channels = (o.channel_ids || []).map(id => '#'+(channelMap[id]||id)).join(', ');
        const roles = (o.role_ids || []).length;
        lines.push('  ' + (oi+1) + '. ' + emoji + (o.title || o.description || 'Opción ' + (oi+1)));
        if (o.description && o.title) lines.push('     ' + o.description);
        if (channels) lines.push('     → Canales: ' + channels);
        if (roles) lines.push('     → Roles asignados: ' + roles);
      });
      lines.push('');
    });
  }
  return lines.join('\n');
}

function generateNormasTxt(guild) {
  const verif = ['Ninguna','Baja (email verificado)','Media (5 min en Discord)','Alta (10 min en servidor)','Máxima (teléfono verificado)'];
  const filters = ['Sin filtro de contenido','Solo miembros sin roles','Todos los mensajes'];

  const lines = [];
  lines.push('╔══════════════════════════════════════════════════╗');
  lines.push('║            NORMAS Y CONFIGURACIÓN                ║');
  lines.push('╚══════════════════════════════════════════════════╝');
  lines.push('Servidor: ' + guild.name);
  lines.push('ID: ' + guild.id);
  lines.push('Generado: ' + new Date().toLocaleString('es'));
  lines.push('');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('INFORMACIÓN GENERAL');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (guild.description) lines.push('Descripción: ' + guild.description);
  lines.push('Verificación requerida: ' + (verif[guild.verification_level] || 'Nivel ' + guild.verification_level));
  lines.push('Filtro de contenido: ' + (filters[guild.explicit_content_filter] || 'Nivel ' + guild.explicit_content_filter));
  lines.push('Nivel de notificaciones: ' + (guild.default_message_notifications === 0 ? 'Todos los mensajes' : 'Solo menciones'));
  lines.push('');

  if (guild.rules_channel_id) {
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('CANAL DE NORMAS');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const channelMap = {};
    (guild.channels || []).forEach(c => { channelMap[c.id] = c.name; });
    lines.push('Canal: #' + (channelMap[guild.rules_channel_id] || guild.rules_channel_id));
    lines.push('(Las normas detalladas están en ese canal del servidor)');
    lines.push('');
  }

  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('CARACTERÍSTICAS DEL SERVIDOR');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('Miembros aprox.: ' + (guild.approximate_member_count || 'N/A'));
  lines.push('Miembros en línea: ' + (guild.approximate_presence_count || 'N/A'));
  lines.push('Nivel de boost: ' + (guild.premium_tier || 0));
  lines.push('Boosts: ' + (guild.premium_subscription_count || 0));
  lines.push('Región: ' + (guild.preferred_locale || 'N/A'));

  return lines.join('\n');
}

// ─────────────────────────────────────────────
// Download ZIP
// ─────────────────────────────────────────────
btnDownload.addEventListener('click', async function() {
  if (!guildData || !onboardingData) return;
  btnDownload.disabled = true;
  btnDownload.textContent = '⏳ Preparando...';
  showToast('⏳ Construyendo ZIP...', '#5865f2', 10000);

  try {
    const enc = new TextEncoder();
    const sName = sanitize(guildData.name);
    const files = [];

    // ── 1. Subcarpeta: 1_Incorporacion ──
    const txtInc = generateIncorporacionTxt(guildData, onboardingData);
    files.push({ name: '1_Incorporacion/incorporacion.txt', data: enc.encode(txtInc) });

    // Banner del servidor
    if (guildData.banner) {
      const ext = guildData.banner.startsWith('a_') ? 'gif' : 'png';
      const url = `https://cdn.discordapp.com/banners/${guildData.id}/${guildData.banner}.${ext}?size=1024`;
      const blob = await fetchBlob(url);
      if (blob) { const ab = await blobToAB(blob); files.push({ name: `1_Incorporacion/banner_servidor.${ext}`, data: new Uint8Array(ab) }); }
    }

    // Splash del servidor
    if (guildData.splash) {
      const url = `https://cdn.discordapp.com/splashes/${guildData.id}/${guildData.splash}.png?size=1024`;
      const blob = await fetchBlob(url);
      if (blob) { const ab = await blobToAB(blob); files.push({ name: '1_Incorporacion/splash_servidor.png', data: new Uint8Array(ab) }); }
    }

    // Icono del servidor
    if (guildData.icon) {
      const ext = guildData.icon.startsWith('a_') ? 'gif' : 'png';
      const url = `https://cdn.discordapp.com/icons/${guildData.id}/${guildData.icon}.${ext}?size=512`;
      const blob = await fetchBlob(url);
      if (blob) { const ab = await blobToAB(blob); files.push({ name: `1_Incorporacion/icono_servidor.${ext}`, data: new Uint8Array(ab) }); }
    }

    // Imágenes de emojis en tareas
    const tasks = (onboardingData.prompts || []).filter(p => p.in_onboarding && p.type === 0);
    for (const task of tasks) {
      for (const opt of (task.options || [])) {
        if (opt.emoji && opt.emoji.id) {
          const ext2 = opt.emoji.animated ? 'gif' : 'png';
          const url2 = cdnEmoji(opt.emoji.id, opt.emoji.animated);
          const blob2 = await fetchBlob(url2);
          if (blob2) {
            const ab2 = await blobToAB(blob2);
            const fname = sanitize((opt.emoji.name || opt.emoji.id));
            files.push({ name: `1_Incorporacion/emojis/${fname}.${ext2}`, data: new Uint8Array(ab2) });
          }
        }
      }
    }

    // ── 2. Subcarpeta: 2_Preguntas ──
    const txtPreg = generatePreguntasTxt(guildData, onboardingData);
    files.push({ name: '2_Preguntas/preguntas.txt', data: enc.encode(txtPreg) });

    // Emojis de preguntas
    const questions = (onboardingData.prompts || []).filter(p => p.in_onboarding && p.type === 1);
    let qIdx = 1;
    for (const q of questions) {
      for (const opt of (q.options || [])) {
        if (opt.emoji && opt.emoji.id) {
          const ext3 = opt.emoji.animated ? 'gif' : 'png';
          const url3 = cdnEmoji(opt.emoji.id, opt.emoji.animated);
          const blob3 = await fetchBlob(url3);
          if (blob3) {
            const ab3 = await blobToAB(blob3);
            const fname3 = 'P' + qIdx + '_' + sanitize(opt.emoji.name || opt.emoji.id);
            files.push({ name: `2_Preguntas/emojis/${fname3}.${ext3}`, data: new Uint8Array(ab3) });
          }
        } else if (opt.emoji_id) {
          const url3 = cdnEmoji(opt.emoji_id, false);
          const blob3 = await fetchBlob(url3);
          if (blob3) {
            const ab3 = await blobToAB(blob3);
            files.push({ name: `2_Preguntas/emojis/P${qIdx}_${opt.emoji_id}.png`, data: new Uint8Array(ab3) });
          }
        }
      }
      qIdx++;
    }

    // ── 3. Subcarpeta: 3_Normas ──
    const txtNorm = generateNormasTxt(guildData);
    files.push({ name: '3_Normas/normas.txt', data: enc.encode(txtNorm) });

    // BUILD & DOWNLOAD
    const zipData = buildZip(files);
    const blob = new Blob([zipData], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'onboarding_' + sName + '.zip';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('✅ ZIP descargado con ' + files.length + ' archivos', '#23a55a', 3500);

  } catch(err) {
    showToast('❌ Error: ' + err.message, '#ed4245', 4000);
  } finally {
    btnDownload.disabled = false;
    btnDownload.textContent = '⬇️ Descargar ZIP completo';
  }
});

// ─────────────────────────────────────────────
// SCAN
// ─────────────────────────────────────────────
btnScan.addEventListener('click', async function() {
  btnScan.disabled = true; btnScan.textContent = '...';
  showLoading('Buscando pestaña de Discord...');
  dlBar.classList.remove('visible');
  serverInfo.classList.remove('visible');

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];

    if (!tab?.url?.includes('discord.com')) {
      showError('Abre Discord Web (discord.com), entra a un servidor y haz clic en un canal.');
      return;
    }

    const match = tab.url.match(/discord\.com\/channels\/(\d+)/);
    if (!match) {
      showError('Haz clic en un canal dentro de un servidor y vuelve a escanear.');
      return;
    }

    currentGuildId = match[1];
    showLoading('Obteniendo token de Discord...');

    // Inject content.js
    try { await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] }); } catch(e) {}
    await new Promise(r => setTimeout(r, 400));

    // Get token
    let token = null;
    try {
      const res = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          try { const t = localStorage.getItem('token'); if(t) return t.replace(/"/g,''); } catch(e) {}
          try {
            for (let i=0;i<localStorage.length;i++) {
              const k=localStorage.key(i), v=localStorage.getItem(k);
              if(!v) continue;
              const c=v.replace(/^"|"$/g,'');
              if(c.split('.').length===3&&c.length>50&&/^[\w\-\.]+$/.test(c)) return c;
            }
          } catch(e) {}
          return null;
        }
      });
      if (res?.[0]?.result) token = res[0].result;
    } catch(e) {}

    if (!token) {
      showError('No se pudo obtener el token. Recarga Discord completamente y vuelve a intentar.');
      return;
    }

    currentToken = token;
    showLoading('Cargando datos del servidor...');

    // Fetch guild + onboarding in parallel
    const [guild, onboarding] = await Promise.all([
      discordFetch('/guilds/' + currentGuildId + '?with_counts=true', token),
      discordFetch('/guilds/' + currentGuildId + '/onboarding', token)
    ]);

    // Try to also get channels
    try {
      const channels = await discordFetch('/guilds/' + currentGuildId + '/channels', token);
      guild.channels = channels;
    } catch(e) { guild.channels = []; }

    guildData = guild;
    onboardingData = onboarding;

    // Show server info
    const avatarEl = document.getElementById('serverAvatar');
    if (guild.icon) {
      const ext = guild.icon.startsWith('a_') ? 'gif' : 'png';
      avatarEl.innerHTML = `<img src="https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.${ext}?size=64" onerror="this.parentElement.innerHTML='🏠'">`;
    } else {
      avatarEl.innerHTML = '🏠';
    }
    document.getElementById('serverName').textContent = guild.name;
    document.getElementById('serverId').textContent = 'ID: ' + guild.id + ' · ' + (guild.approximate_member_count || '?') + ' miembros';
    serverInfo.classList.add('visible');

    buildSections(guild, onboarding);

  } catch(err) {
    showError('Error: ' + err.message);
  } finally {
    btnScan.disabled = false;
    btnScan.textContent = 'Escanear';
  }
});

// Global toggle function for sections
window.sectionToggle = sectionToggle;

function cdnEmoji(id, animated) {
  return 'https://cdn.discordapp.com/emojis/' + id + (animated ? '.gif' : '.png') + '?size=64';
}
