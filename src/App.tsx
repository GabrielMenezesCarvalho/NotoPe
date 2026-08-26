import { ChangeEvent, DragEvent, Fragment, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CircleAlert, CircleCheck, CircleX, Clock3, Download, ExternalLink, FilePenLine, FileSearch, FileUp, Info, LayoutDashboard, LoaderCircle, Menu, Moon, MoreVertical, Pause, Play, RotateCcw, Settings, Sun, Trash2, Upload as UploadIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { CropManifest, Extraction, PageData, Route } from './types';

const PDF_URL = '/documents/Form_Novo_300_pags.pdf';
const FIELD_LABELS: Record<string, string> = {
  dia: 'Dia', mes: 'Mês', ano: 'Ano', total_recebido: 'Total recebido',
  total_devolvido: 'Total devolvido', justificativa: 'Justificativa',
};
const FIELD_ORDER = ['dia', 'mes', 'ano', 'total_recebido', 'total_devolvido', 'justificativa'];
const MIN_FONT_SCALE = .85;
const MAX_FONT_SCALE = 4;
const FONT_SCALE_STEP = .1;

type UploadRow = { id: number; name: string; pages: string; progress: number; status: 'processing' | 'queued' | 'done' };
type UserRow = { id: number; name: string; email: string; cpf: string; role: string; active: boolean };

function Brand({ large = false }: { large?: boolean }) {
  return <span className={`brand ${large ? 'brand--large' : ''}`}><span>Noto</span><b>PE</b></span>;
}

function Login({ onLogin }: { onLogin: () => void }) {
  return <div className="prototype-window login-window">
    <header className="login-header"><Brand /></header>
    <main className="login-main">
      <div className="login-photo" role="img" aria-label="Pessoa trabalhando com documentos em um notebook" />
      <section className="login-card">
        <Brand large />
        <p>Documentos transformados em informação.</p>
        <h1>Entrar</h1>
        <span>Selecione uma das opções.</span>
        <button className="primary pill" onClick={onLogin}>Entrar com gov.br</button>
      </section>
    </main>
    <footer className="login-footer">
      <div><h2>NotoPE - Documentos transformados em informação.</h2><p>ARPE - Agência de Regulação de Pernambuco</p><small>ouvidoria@epti.pe.gov.br - (81) 3184-7717 - Rua da Aurora, 1377, Santo Amaro. Recife/PE</small></div>
      <div className="footer-logos">
        <img src="/assets/logo governo pernambuco.png" alt="Governo de Pernambuco" />
        <strong className="arpe-wordmark">ARPE</strong>
        <img src="/assets/logo ati.png" alt="ATI" />
        <img src="/assets/logo liga digital.png" alt="Liga Digital" />
      </div>
    </footer>
    <div className="copyright">Todos os direitos reservados ao órgão/secretaria</div>
  </div>;
}

function SideIcon({ kind }: { kind: string }) {
  const icons: Record<string, LucideIcon> = {
    dashboard: LayoutDashboard,
    upload: FileUp,
    detail: FileSearch,
    settings: Settings,
  };
  const Icon = icons[kind] || CircleAlert;
  return <span className={`side-icon side-icon--${kind}`} aria-hidden="true"><Icon strokeWidth={1.8} /></span>;
}

function NavChevron({ expanded = false }: { expanded?: boolean }) {
  return <span className={`nav-chevron ${expanded ? 'nav-chevron--expanded' : ''}`} aria-hidden="true"><ChevronRight /></span>;
}

function Sidebar({ route, onNavigate, fontScale, setFontScale, theme, onToggleTheme, collapsed }: {
  route: Route; onNavigate: (r: Route) => void; fontScale: number; setFontScale: (n: number) => void; theme: 'light' | 'dark'; onToggleTheme: () => void; collapsed: boolean;
}) {
  const active = (targets: Route[]) => targets.includes(route);
  const configurationRoutes: Route[] = ['users', 'profiles', 'permissions', 'metrics'];
  const [settingsOpen, setSettingsOpen] = useState(configurationRoutes.includes(route));
  return <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
    <div className="sidebar-brand"><Brand /></div>
    <div className="menu-label">Menu</div>
    <nav>
      <button className={active(['dashboard']) ? 'active' : ''} onClick={() => onNavigate('dashboard')}><SideIcon kind="dashboard" /><span>Dashboard</span><NavChevron /></button>
      <button className={active(['upload']) ? 'active' : ''} onClick={() => onNavigate('upload')}><SideIcon kind="upload" /><span>Envio e processamento</span><NavChevron /></button>
      <button className={active(['detail', 'guide', 'batch']) ? 'active' : ''} onClick={() => onNavigate('detail')}><SideIcon kind="detail" /><span>Detalhe e revisão</span><NavChevron /></button>
      <button className={active(configurationRoutes) ? 'active' : ''} onClick={() => setSettingsOpen(open => !open)} aria-expanded={settingsOpen} aria-controls="settings-subnav"><SideIcon kind="settings" /><span>Configurações</span><NavChevron expanded={settingsOpen} /></button>
      <div id="settings-subnav" className={`subnav ${settingsOpen ? 'expanded' : ''}`}>
        <button className={route === 'users' ? 'active' : ''} onClick={() => onNavigate('users')}>Usuários</button>
        <button className={route === 'profiles' ? 'active' : ''} onClick={() => onNavigate('profiles')}>Perfis</button>
        <button className={route === 'permissions' ? 'active' : ''} onClick={() => onNavigate('permissions')}>Permissões</button>
        <button className={route === 'metrics' ? 'active' : ''} onClick={() => onNavigate('metrics')}>Métricas</button>
      </div>
    </nav>
    <div className="sidebar-bottom">
      <div className="accessibility-controls">
        <button onClick={() => setFontScale(Math.max(MIN_FONT_SCALE, Number((fontScale - FONT_SCALE_STEP).toFixed(2))))} disabled={fontScale <= MIN_FONT_SCALE} aria-label={`Diminuir tamanho da letra. Tamanho atual: ${Math.round(fontScale * 100)}%`} title="Diminuir tamanho da letra">A−</button>
        <button onClick={() => setFontScale(Math.min(MAX_FONT_SCALE, Number((fontScale + FONT_SCALE_STEP).toFixed(2))))} disabled={fontScale >= MAX_FONT_SCALE} aria-label={`Aumentar tamanho da letra. Tamanho atual: ${Math.round(fontScale * 100)}%`} title="Aumentar tamanho da letra">A+</button>
        <button className="sun" onClick={onToggleTheme} aria-label={theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'} title={theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}>{theme === 'light' ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}</button>
      </div>
      <div className="profile"><span>FT</span><div><strong>Fulano de Tal</strong><small>ARPE - Gestor</small></div></div>
    </div>
  </aside>;
}

function Shell({ route, onNavigate, children, fontScale, setFontScale, theme, onToggleTheme }: { route: Route; onNavigate: (r: Route) => void; children: React.ReactNode; fontScale: number; setFontScale: (n: number) => void; theme: 'light' | 'dark'; onToggleTheme: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return <div className={`prototype-window prototype-window--${theme}`} style={{ '--font-scale': fontScale } as React.CSSProperties}>
    <div className="app-body">
      <Sidebar route={route} onNavigate={(r) => { onNavigate(r); setMenuOpen(false); }} fontScale={fontScale} setFontScale={setFontScale} theme={theme} onToggleTheme={onToggleTheme} collapsed={!menuOpen} />
      <div className="workspace">
        <nav className="breadcrumb" aria-label="Navegação estrutural"><div className="breadcrumb-trail">{breadcrumb(route).map((item, index, items) => <Fragment key={`${item.label}-${index}`}>{index > 0 && <ChevronRight className="breadcrumb-separator" aria-hidden="true" />}{index === items.length - 1 ? <span className="breadcrumb-current" aria-current="page">{item.label}</span> : <a className="breadcrumb-link" href={`#${item.route}`} onClick={() => item.route && onNavigate(item.route)}>{item.label}</a>}</Fragment>)}</div><button className="mobile-menu" onClick={() => setMenuOpen(v => !v)} aria-label="Abrir ou fechar menu"><Menu aria-hidden="true" /></button></nav>
        {children}
      </div>
    </div>
  </div>;
}

function breadcrumb(route: Route) {
  type BreadcrumbItem = { label: string; route?: Route };
  const home: BreadcrumbItem = { label: 'Início', route: 'dashboard' };
  const review: BreadcrumbItem = { label: 'Detalhe e revisão', route: 'detail' };
  const settings: BreadcrumbItem = { label: 'Configurações', route: 'users' };
  const map: Record<Route, BreadcrumbItem[]> = {
    dashboard: [home, { label: 'Dashboard' }],
    upload: [home, { label: 'Envio e processamento' }],
    detail: [home, { label: 'Detalhe e revisão' }],
    guide: [home, review, { label: 'Guia de Entrega' }],
    batch: [home, review, { label: 'Revisão em lote' }],
    users: [home, settings, { label: 'Usuários' }],
    profiles: [home, settings, { label: 'Perfis' }],
    permissions: [home, settings, { label: 'Permissões' }],
    metrics: [home, settings, { label: 'Métricas' }],
  };
  return map[route];
}

function PageHeading({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <div className="page-heading"><div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

function StatusPill({ kind, children }: { kind: 'processing' | 'queued' | 'done' | 'warning' | 'inactive'; children: React.ReactNode }) {
  const icons: Record<typeof kind, LucideIcon> = { processing: LoaderCircle, queued: Clock3, done: CircleCheck, warning: CircleAlert, inactive: CircleX };
  const Icon = icons[kind];
  return <span className={`status status--${kind}`}><Icon className="status-icon" aria-hidden="true" />{children}</span>;
}

function Dashboard({ pages, onNavigate }: { pages: PageData[]; onNavigate: (r: Route) => void }) {
  const reviewPages = pages.filter(p => p.needsReview).length;
  const regions = [225, 213, 203, 203, 183, 183, 169, 151, 128, 128, 114, 100, 88, 71, 53, 36];
  const names = ['Petrolina','Recife Norte','Caruaru','Recife Sul','Salgueiro','Garanhuns','Ouricuri','Serra Talhada','Araripina','Floresta','Afogados','Arcoverde','Palmares','Nazaré','Limoeiro','Goiana'];
  const products = [['Arroz',88],['Feijão',81],['Frango Coxa/Sobrecoxa',68],['Açúcar',61],['Carne Bovina',30]];
  return <main className="page dashboard-page">
    <PageHeading title="Dashboard" description="Acompanhe o volume de guias de entrega, o status dos processamentos e o fornecimento de alimentos por região." action={<button className="primary" onClick={() => window.print()}>Exportar relatório (PDF)</button>} />
    <div className="metric-grid">
      <article><span>Total de guias</span><strong>{pages.length || 300}</strong></article>
      <article><span>Guias em processamento</span><strong>03</strong></article>
      <article><span>Guias na fila</span><strong>03</strong></article>
      <article className="metric-link" onClick={() => onNavigate('batch')}><span>Guias para revisão</span><strong>{reviewPages || '02'}</strong></article>
    </div>
    <section className="panel region-panel"><h2>Regiões Atendidas por GRE</h2><p>Volume total de guias de entrega processadas por Gerência Regional de Educação.</p><div className="vertical-chart">{regions.map((value, i) => <div className="bar-col" key={names[i]}><i style={{ height: `${value / 2.3}px` }} /><span>{names[i]}</span></div>)}</div></section>
    <section className="panel products-panel"><h2>Top 10 Produtos Entregues</h2><p>Insumos alimentares com maior volume de distribuição registrado nas guias.</p><div>{products.map(([name, value]) => <div className="product-bar" key={name as string} style={{ width: `${value}%` }}>{name}</div>)}</div></section>
  </main>;
}

function Upload({ rows, setRows }: { rows: UploadRow[]; setRows: React.Dispatch<React.SetStateAction<UploadRow[]>> }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const next = Array.from(files).filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf')).map((file, i) => ({ id: Date.now() + i, name: file.name, pages: '—', progress: 0, status: 'queued' as const }));
    setRows(prev => [...next, ...prev]);
  };
  const drop = (event: DragEvent) => { event.preventDefault(); addFiles(event.dataTransfer.files); };
  const updateRow = (id: number, changes: Partial<UploadRow>) => {
    setRows(current => current.map(row => row.id === id ? { ...row, ...changes } : row));
    setOpenMenu(null);
  };
  const removeRow = (id: number) => {
    setRows(current => current.filter(row => row.id !== id));
    setOpenMenu(null);
  };
  return <main className="page upload-page">
    <PageHeading title="Envio e processamento" description="Envie as guias de entrega em formato PDF para leitura e extração automática de dados via OCR." />
    <button className="drop-zone" onClick={() => inputRef.current?.click()} onDrop={drop} onDragOver={e => e.preventDefault()}>
      <UploadIcon className="upload-symbol" aria-hidden="true" /><strong>Arraste e solte as guias de entrega aqui ou clique para selecionar do seu computador.</strong><small>Formato permitido: apenas PDF (máx. 50MB por arquivo)</small>
      <input ref={inputRef} hidden type="file" accept="application/pdf" multiple onChange={e => addFiles(e.target.files)} />
    </button>
    <div className="section-heading"><h2>Arquivos selecionados</h2><span>{rows.filter(row => row.status === 'processing').length} arquivos em processamento</span></div>
    <div className="table-panel"><table><thead><tr><th>ID Registro</th><th>Arquivo</th><th>Núm. de páginas</th><th>Status do processo</th><th>Ação</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td>{row.id}</td><td>{row.name}</td><td>{row.pages}</td><td>{row.status === 'processing' ? <StatusPill kind="processing">Processando ({row.progress}%)</StatusPill> : row.status === 'done' ? <StatusPill kind="done">Concluído</StatusPill> : <StatusPill kind="queued">Na Fila</StatusPill>}</td><td className="menu-cell"><button className="row-menu" aria-label={`Opções de ${row.name}`} aria-expanded={openMenu === row.id} onClick={() => setOpenMenu(current => current === row.id ? null : row.id)}><MoreVertical aria-hidden="true" /></button>{openMenu === row.id && <div className="context-menu upload-actions">{row.status === 'queued' && <button onClick={() => updateRow(row.id, { status: 'processing', progress: Math.max(1, row.progress) })}><Play aria-hidden="true" />Iniciar processamento</button>}{row.status === 'processing' && <button onClick={() => updateRow(row.id, { status: 'queued' })}><Pause aria-hidden="true" />Pausar e enviar à fila</button>}<button onClick={() => updateRow(row.id, { status: 'processing', progress: 0 })}><RotateCcw aria-hidden="true" />Reprocessar</button>{row.status !== 'done' && <button onClick={() => updateRow(row.id, { status: 'done', progress: 100 })}><CircleCheck aria-hidden="true" />Marcar como concluído</button>}<button className="danger" onClick={() => removeRow(row.id)}><Trash2 aria-hidden="true" />Remover da lista</button></div>}</td></tr>)}</tbody></table></div>
  </main>;
}

const baseDetailRows = [
  ['10','Guia_Entrega_708351.pdf','300','18/08/2026 - 10h20','...','processing','85'],
  ['9','Lote_Escolas_GRE_Agreste_03_2026.pdf','2.500','18/08/2026 - 10h20','...','processing','12'],
  ['8','CEASA_PE_Manifesto_883.pdf','9.150','18/08/2026 - 10h20','...','processing','5'],
  ['7','CEASA_PE_Manifesto_123.pdf','200','18/08/2026 - 10h20','...','queued',''],
  ['6','Lote_Escolas_GRE_Agreste_02_2026.pdf','540','18/08/2026 - 10h20','...','queued',''],
  ['5','Lote_Escolas_GRE_Agreste_01_2026.pdf','890','18/08/2026 - 10h20','...','queued',''],
  ['4','Guia_Entrega_71233123.pdf','300','16/08/2026 - 15h42','88% (350 alertas)','done',''],
  ['3','Guia_Entrega_71123411.pdf','120','16/08/2026 - 11h02','0%','done',''],
  ['2','Guia_Entrega_11233213.pdf','2.219','15/08/2026 - 8h40','9,4% (1.244 alertas)','done',''],
  ['1','Guia_Entrega_99877123.pdf','2.213','14/08/2026 - 9h10','62% (4.200 alertas)','done',''],
];

function Detail({ pages, onNavigate }: { pages: PageData[]; onNavigate: (r: Route) => void }) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const alertCount = pages.reduce((sum, p) => sum + p.reviewCount, 0);
  return <main className="page detail-page">
    <PageHeading title="Detalhe e revisão" description="Consulte o histórico de processamento, monitore o progresso do OCR e acesse a revisão detalhada dos documentos." action={<button className="primary" onClick={() => onNavigate('batch')}>Revisão em lote</button>} />
    <div className="table-panel detail-table"><table><thead><tr><th>Código</th><th>Arquivo</th><th>Núm. de páginas</th><th>Data e hora</th><th>Inconsistências</th><th>Status do processo</th><th>Ação</th></tr></thead><tbody>{baseDetailRows.map((row, index) => <tr key={row[0]}><td>{row[0]}</td><td className="truncate">{index === 0 ? 'Form_Novo_300_pags.pdf' : row[1]}</td><td>{row[2]}</td><td>{row[3]}</td><td className={index === 0 ? 'danger-text' : ''}>{index === 0 ? `${Math.round(alertCount / 6)} páginas (${alertCount} alertas)` : row[4]}</td><td>{row[5] === 'processing' ? <StatusPill kind="processing">Processando ({row[6]}%)</StatusPill> : row[5] === 'queued' ? <StatusPill kind="queued">Na Fila</StatusPill> : <StatusPill kind="done">Concluído</StatusPill>}</td><td className="menu-cell"><button className="row-menu" aria-label={`Opções de ${row[1]}`} onClick={() => setOpenMenu(openMenu === row[0] ? null : row[0])}><MoreVertical aria-hidden="true" /></button>{openMenu === row[0] && <div className="context-menu"><button onClick={() => onNavigate('guide')}><FilePenLine aria-hidden="true" />Revisar</button><button><RotateCcw aria-hidden="true" />Reprocessar</button><a href={PDF_URL} download><Download aria-hidden="true" />Baixar PDF original</a><button className="danger"><Trash2 aria-hidden="true" />Excluir</button></div>}</td></tr>)}</tbody></table></div>
  </main>;
}

function FieldInput({ extraction, value, onChange, corrected }: { extraction?: Extraction; value: string; onChange: (v: string) => void; corrected: boolean }) {
  const invalid = extraction?.revisar_humano && !corrected;
  return <label className={`field ${invalid ? 'field--invalid' : 'field--valid'}`}><span>{FIELD_LABELS[extraction?.campo || ''] || extraction?.campo}</span><input value={value === 'VAZIO' ? '' : value} onChange={e => onChange(e.target.value)} placeholder={invalid ? 'Valor não identificado.' : ''} />{invalid ? <small>{extraction?.regra_negocio_mensagem || 'Valor não identificado.'}</small> : <small>Leitura concluída.</small>}</label>;
}

function PdfPageViewer({ page }: { page: number }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [width, setWidth] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    let loadingTask: PDFDocumentLoadingTask | null = null;
    import('pdfjs-dist').then(({ GlobalWorkerOptions, getDocument }) => {
      if (!active) return null;
      GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
      loadingTask = getDocument({ url: PDF_URL });
      return loadingTask.promise;
    }).then(document => {
      if (active) setPdf(document);
    }).catch(() => {
      if (active) { setError('Não foi possível carregar o PDF.'); setLoading(false); }
    });
    return () => { active = false; renderTaskRef.current?.cancel(); if (loadingTask) void loadingTask.destroy(); };
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const updateWidth = () => setWidth(Math.max(1, host.clientWidth));
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!pdf || !canvas || !width) return;
    let active = true;
    renderTaskRef.current?.cancel();
    setLoading(true);
    setError('');
    pdf.getPage(page).then(pdfPage => {
      if (!active) return;
      const baseViewport = pdfPage.getViewport({ scale: 1 });
      const viewport = pdfPage.getViewport({ scale: width / baseViewport.width });
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(viewport.width * pixelRatio);
      canvas.height = Math.floor(viewport.height * pixelRatio);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      const renderTask = pdfPage.render({ canvas, viewport, transform: pixelRatio === 1 ? undefined : [pixelRatio, 0, 0, pixelRatio, 0, 0] });
      renderTaskRef.current = renderTask;
      return renderTask.promise;
    }).then(() => {
      if (active) setLoading(false);
    }).catch(reason => {
      if (active && reason?.name !== 'RenderingCancelledException') { setError('Não foi possível renderizar esta página.'); setLoading(false); }
    });
    return () => { active = false; renderTaskRef.current?.cancel(); };
  }, [pdf, page, width]);

  return <div className="pdf-viewer" ref={hostRef} aria-busy={loading}>
    <canvas ref={canvasRef} aria-label={`Página ${page} da guia`} />
    {loading && <div className="pdf-loading"><span className="spinner" />Carregando página {page}…</div>}
    {error && <div className="pdf-error">{error}</div>}
  </div>;
}

function Guide({ pages, manifest, page, setPage, edits, setEdits, onNavigate }: {
  pages: PageData[]; manifest: CropManifest; page: number; setPage: (p: number) => void; edits: Record<string,string>; setEdits: React.Dispatch<React.SetStateAction<Record<string,string>>>; onNavigate: (r: Route) => void;
}) {
  const [filter, setFilter] = useState<'all'|'issues'|'corrected'>('all');
  const pageData = pages[page - 1];
  const values = pageData?.values || {};
  const correctedCount = Object.keys(edits).filter(k => k.startsWith(`${page}:`)).length;
  const shown = FIELD_ORDER.filter(field => filter === 'all' || (filter === 'issues' ? values[field]?.revisar_humano && !(edits[`${page}:${field}`] !== undefined) : edits[`${page}:${field}`] !== undefined));
  const update = (field: string, value: string) => setEdits(prev => ({ ...prev, [`${page}:${field}`]: value }));
  const titlePage = page;
  return <main className="page guide-page">
    <PageHeading title={`Guia de Entrega Nº ${titlePage}`} description="Revisão de leitura OCR e validação dos dados de distribuição." action={<div className="heading-actions"><StatusPill kind="done">Processado: 100%</StatusPill><StatusPill kind="warning">Revisão necessária</StatusPill><button className="icon-button" aria-label="Abrir revisão em lote" onClick={() => onNavigate('batch')}><Menu aria-hidden="true" /></button></div>} />
    <div className="guide-toolbar"><div><b>Filtros:</b><button className={filter === 'all' ? 'selected' : ''} onClick={() => setFilter('all')}>Ver todos (300)</button><button className={filter === 'issues' ? 'selected' : ''} onClick={() => setFilter('issues')}>Página com inconsistência ({pages.filter(p => p.needsReview).length})</button><button className={filter === 'corrected' ? 'selected' : ''} onClick={() => setFilter('corrected')}>Páginas corrigidas ({correctedCount})</button></div><Pagination page={page} total={pages.length || 300} setPage={setPage} /></div>
    <div className="guide-split">
      <section className="pdf-card"><PdfPageViewer page={page} /><a className="open-pdf" href={`${PDF_URL}#page=${page}`} target="_blank" rel="noreferrer">Abrir PDF completo <ExternalLink aria-hidden="true" /></a></section>
      <section className="extraction-card">
        {pageData?.needsReview && <div className="notice"><Info aria-hidden="true" /><span>Atenção: alguns campos não foram lidos corretamente ou estão sem valor.</span></div>}
        {shown.length === 0 ? <div className="empty-state"><strong>Nenhum campo neste filtro.</strong><span>Selecione outro filtro ou avance para a próxima página.</span></div> : <div className="field-groups">
          <h2>IDENTIFICAÇÃO</h2><div className="field-grid">{shown.filter(f => ['dia','mes','ano'].includes(f)).map(field => <FieldInput key={field} extraction={values[field]} value={edits[`${page}:${field}`] ?? String(values[field]?.extraido_ia ?? '')} onChange={v => update(field,v)} corrected={edits[`${page}:${field}`] !== undefined} />)}</div>
          <h2>DEVOLUÇÃO</h2><div className="field-grid">{shown.filter(f => ['total_recebido','total_devolvido'].includes(f)).map(field => <FieldInput key={field} extraction={values[field]} value={edits[`${page}:${field}`] ?? String(values[field]?.extraido_ia ?? '')} onChange={v => update(field,v)} corrected={edits[`${page}:${field}`] !== undefined} />)}</div>
          {shown.includes('justificativa') && <><h2>JUSTIFICATIVA</h2><div className="field-grid"><FieldInput extraction={values.justificativa} value={edits[`${page}:justificativa`] ?? String(values.justificativa?.extraido_ia ?? '')} onChange={v => update('justificativa',v)} corrected={edits[`${page}:justificativa`] !== undefined} /></div></>}
        </div>}
        <button className="save-float" onClick={() => onNavigate('detail')}>Salvar</button>
      </section>
    </div>
  </main>;
}

function Pagination({ page, total, setPage }: { page: number; total: number; setPage: (n: number) => void }) {
  const [pageInput, setPageInput] = useState(String(page));
  useEffect(() => setPageInput(String(page)), [page]);
  const middlePage = Math.max(1, Math.floor(total / 2));
  const visiblePages = [...new Set([1, 2, 3, middlePage, middlePage + 1, middlePage + 2, total - 2, total - 1, total]
    .filter(number => number >= 1 && number <= total))].sort((a, b) => a - b);
  const typedPage = Number(pageInput);
  const inputIsValid = Number.isInteger(typedPage) && typedPage >= 1 && typedPage <= total;
  const updatePageInput = (value: string) => {
    if (value !== '' && !/^\d+$/.test(value)) return;
    setPageInput(value);
    const nextPage = Number(value);
    if (Number.isInteger(nextPage) && nextPage >= 1 && nextPage <= total) setPage(nextPage);
  };
  const normalizePageInput = () => {
    const nextPage = Math.min(total, Math.max(1, Number(pageInput) || page));
    setPageInput(String(nextPage));
    setPage(nextPage);
  };
  return <div className="pagination">
    <button disabled={page === 1} onClick={() => setPage(1)}><ChevronsLeft aria-hidden="true" />Primeira</button>
    <button disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft aria-hidden="true" />Anterior</button>
    {visiblePages.map((number, index) => <Fragment key={number}>
      {index > 0 && number - visiblePages[index - 1] > 1 && <span className="pagination-gap">…</span>}
      <button className={page === number ? 'selected' : ''} onClick={() => setPage(number)} aria-current={page === number ? 'page' : undefined}>{number}</button>
    </Fragment>)}
    <label className="page-jump"><span>Página</span><input type="text" inputMode="numeric" value={pageInput} onChange={event => updatePageInput(event.target.value)} onBlur={normalizePageInput} onKeyDown={event => { if (event.key === 'Enter') { normalizePageInput(); event.currentTarget.blur(); } }} aria-label={`Ir para uma página entre 1 e ${total}`} aria-invalid={!inputIsValid} /></label>
    <button disabled={page === total} onClick={() => setPage(page + 1)}>Próxima<ChevronRight aria-hidden="true" /></button>
    <button disabled={page === total} onClick={() => setPage(total)}>Última<ChevronsRight aria-hidden="true" /></button>
  </div>;
}

function BatchReview({ queue, manifest, index, setIndex, edits, setEdits, onNavigate, setPage }: {
  queue: Extraction[]; manifest: CropManifest; index: number; setIndex: React.Dispatch<React.SetStateAction<number>>; edits: Record<string,string>; setEdits: React.Dispatch<React.SetStateAction<Record<string,string>>>; onNavigate: (r: Route) => void; setPage: (p:number) => void;
}) {
  const item = queue[index];
  const key = item ? `${item.pagina}:${item.campo}` : '';
  const [draft, setDraft] = useState('');
  useEffect(() => setDraft(item ? edits[key] ?? (item.extraido_ia === 'VAZIO' ? '' : String(item.extraido_ia ?? '')) : ''), [key]);
  useEffect(() => {
    const handler = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'ArrowRight') setIndex(i => Math.min(queue.length - 1, i + 1));
      if (event.key === 'ArrowLeft') setIndex(i => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler);
  }, [queue.length]);
  if (!item) return <main className="page"><PageHeading title="Revisão em lote" description="Nenhuma inconsistência encontrada." /></main>;
  const save = () => { setEdits(prev => ({...prev, [key]: draft })); setIndex(i => Math.min(i, Math.max(0, queue.length - 2))); };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') save(); };
  const progress = ((index + 1) / queue.length) * 100;
  return <main className="page batch-page">
    <PageHeading title="Revisão em lote" description="Corrija apenas os campos com inconsistências detectadas pelo OCR para liberar o lote." />
    <div className="batch-progress"><div><b>Fila de Revisão: {index + 1} de {queue.length} pendentes</b><span>{progress.toFixed(2).replace('.', ',')}%</span></div><i><b style={{ width: `${Math.max(1, progress)}%` }} /></i></div>
    <div className="batch-stage"><button className="batch-arrow" aria-label="Inconsistência anterior" onClick={() => setIndex(i => Math.max(0,i-1))}><ChevronLeft aria-hidden="true" /></button><figure><div className="crop-frame">{manifest[key] ? <img src={manifest[key]} alt={`Recorte do campo ${FIELD_LABELS[item.campo]}`} /> : <iframe title="Página da guia" src={`${PDF_URL}#page=${item.pagina}&zoom=page-width&toolbar=0`} />}</div><figcaption>O trecho destacado apresenta incoerência.</figcaption></figure><section className="batch-card"><header><h2>Guia de Entrega Nº {item.pagina}</h2><button onClick={() => { setPage(item.pagina); onNavigate('guide'); }}>Abrir Guia <ExternalLink aria-hidden="true" /></button></header><label><span>{FIELD_LABELS[item.campo] || item.campo}</span><input autoFocus value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={onKey} placeholder="Valor não identificado." /><small>{item.regra_negocio_mensagem || 'Valor não identificado.'}</small></label>{item.campo.includes('total_') && <label className="no-value"><input type="checkbox" onChange={e => e.target.checked && setDraft('NÃO CONSTA')} /> Não consta.</label>}<footer><button onClick={() => setIndex(i => Math.min(queue.length - 1, i + 1))}>Pular</button><button className="success" onClick={save}>Salvar</button></footer></section><button className="batch-arrow" aria-label="Próxima inconsistência" onClick={() => setIndex(i => Math.min(queue.length - 1,i+1))}><ChevronRight aria-hidden="true" /></button></div>
    <div className="batch-hint">Pressione ENTER para Salvar | Use ← → para navegar</div>
  </main>;
}

function Users() {
  const [users, setUsers] = useState<UserRow[]>([
    {id:1,name:'Eduardo Francisco Thales Barbosa',email:'eduardo_barbosa@gmail.com',cpf:'631.192.771-34',role:'Convidado',active:true},
    {id:2,name:'Milena Tatiane Moreira',email:'milenatatianemoreira@gmail.com',cpf:'252.490.181-57',role:'Administrador',active:true},
    {id:3,name:'Jéssica Benedita Fogaça',email:'jessica_fogaca@gmail.com',cpf:'749.781.575-01',role:'Administrador',active:false},
  ]);
  return <main className="page users-page"><PageHeading title="Usuários" description="Gerencie os acessos e perfis autorizados no NotoPE." />
    <div className="table-panel users-table"><table><thead><tr><th>Nome</th><th>E-mail</th><th>CPF</th><th>Perfil de acesso</th><th>Status</th><th>Ação</th></tr></thead><tbody>{users.map(user => <tr key={user.id}><td>{user.name}</td><td className="truncate">{user.email}</td><td>{user.cpf}</td><td>{user.role}</td><td>{user.active ? <StatusPill kind="done">Ativo</StatusPill> : <StatusPill kind="inactive">Inativo</StatusPill>}</td><td><button className="row-menu" aria-label={`Alterar status de ${user.name}`} onClick={() => setUsers(prev => prev.map(u => u.id === user.id ? {...u,active:!u.active}:u))}><MoreVertical aria-hidden="true" /></button></td></tr>)}</tbody></table></div>
  </main>;
}

function Profiles() {
  const [profiles, setProfiles] = useState([
    {id:1,name:'Administrador',description:'Acesso completo à gestão e às configurações.',users:2,permissions:12,active:true},
    {id:2,name:'Gestor ARPE',description:'Acompanha processamentos e valida documentos.',users:8,permissions:8,active:true},
    {id:3,name:'Revisor',description:'Revisa inconsistências e corrige dados extraídos.',users:14,permissions:5,active:true},
    {id:4,name:'Convidado',description:'Consulta dados e relatórios autorizados.',users:3,permissions:2,active:false},
  ]);
  return <main className="page config-page"><PageHeading title="Perfis" description="Organize os níveis de acesso disponíveis para os usuários do NotoPE." action={<button className="primary">Novo perfil</button>} />
    <div className="table-panel profiles-table"><table><thead><tr><th>Perfil</th><th>Descrição</th><th>Usuários</th><th>Permissões</th><th>Status</th><th>Ação</th></tr></thead><tbody>{profiles.map(profile => <tr key={profile.id}><td><strong>{profile.name}</strong></td><td>{profile.description}</td><td>{profile.users}</td><td>{profile.permissions}</td><td>{profile.active ? <StatusPill kind="done">Ativo</StatusPill> : <StatusPill kind="inactive">Inativo</StatusPill>}</td><td><button className="row-menu" aria-label={`Alterar status do perfil ${profile.name}`} onClick={() => setProfiles(current => current.map(item => item.id === profile.id ? {...item,active:!item.active}:item))}><MoreVertical aria-hidden="true" /></button></td></tr>)}</tbody></table></div>
  </main>;
}

function Permissions() {
  const [rows, setRows] = useState([
    {id:'dashboard',resource:'Dashboard e relatórios',admin:true,manager:true,reviewer:true,guest:true},
    {id:'upload',resource:'Envio e processamento',admin:true,manager:true,reviewer:false,guest:false},
    {id:'review',resource:'Detalhe e revisão',admin:true,manager:true,reviewer:true,guest:false},
    {id:'users',resource:'Gestão de usuários',admin:true,manager:false,reviewer:false,guest:false},
    {id:'settings',resource:'Perfis e permissões',admin:true,manager:false,reviewer:false,guest:false},
  ]);
  const toggle = (id: string, key: 'admin'|'manager'|'reviewer'|'guest') => setRows(current => current.map(row => row.id === id ? {...row,[key]:!row[key]}:row));
  return <main className="page config-page"><PageHeading title="Permissões" description="Defina quais áreas do sistema cada perfil pode acessar." />
    <div className="table-panel permissions-table"><table><thead><tr><th>Recurso</th><th>Administrador</th><th>Gestor ARPE</th><th>Revisor</th><th>Convidado</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td><strong>{row.resource}</strong></td>{(['admin','manager','reviewer','guest'] as const).map(key => <td key={key}><label className="permission-toggle"><input type="checkbox" checked={row[key]} onChange={() => toggle(row.id,key)} /><span>{row[key] ? 'Permitido' : 'Bloqueado'}</span></label></td>)}</tr>)}</tbody></table></div>
  </main>;
}

function Metrics() {
  const profileUsage = [['Revisor',14,14],['Gestor ARPE',8,14],['Convidado',3,14],['Administrador',2,14]] as const;
  return <main className="page metrics-page"><PageHeading title="Métricas de acesso" description="Acompanhe a distribuição de usuários, perfis e permissões do sistema." />
    <div className="metric-grid config-metrics"><article><span>Usuários cadastrados</span><strong>27</strong></article><article><span>Usuários ativos</span><strong>24</strong></article><article><span>Perfis configurados</span><strong>04</strong></article><article><span>Permissões concedidas</span><strong>27</strong></article></div>
    <section className="panel access-panel"><h2>Usuários por perfil</h2><p>Quantidade de contas associadas a cada perfil de acesso.</p><div className="access-bars">{profileUsage.map(([name,value,max]) => <div className="access-row" key={name}><span>{name}</span><i><b style={{width:`${(value/max)*100}%`}} /></i><strong>{value}</strong></div>)}</div></section>
    <section className="panel audit-panel"><h2>Resumo de segurança</h2><div className="audit-grid"><article><span>Última revisão de permissões</span><strong>18/08/2026</strong></article><article><span>Contas inativas</span><strong>03</strong></article><article><span>Perfis com acesso administrativo</span><strong>01</strong></article></div></section>
  </main>;
}

function Loading() { return <div className="loading"><Brand large /><div className="spinner" /><p>Preparando as 300 guias e os resultados da IA…</p></div>; }

export default function App() {
  const [logged, setLogged] = useState(false);
  const [route, setRoute] = useState<Route>('dashboard');
  const [extractions, setExtractions] = useState<Extraction[]>([]);
  const [manifest, setManifest] = useState<CropManifest>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [batchIndex, setBatchIndex] = useState(0);
  const [edits, setEdits] = useState<Record<string,string>>(() => JSON.parse(localStorage.getItem('notope-edits') || '{}'));
  const [fontScale, setFontScale] = useState(() => {
    const savedScale = Number(localStorage.getItem('notope-font-scale')) || 1;
    return Math.min(MAX_FONT_SCALE, Math.max(MIN_FONT_SCALE, savedScale));
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => localStorage.getItem('notope-theme') === 'dark' ? 'dark' : 'light');
  const [rows, setRows] = useState<UploadRow[]>([
    {id:10,name:'Form_Novo_300_pags.pdf',pages:'300',progress:85,status:'processing'},
    {id:9,name:'Lote_Escolas_GRE_Agreste_03_2026.pdf',pages:'2.500',progress:12,status:'processing'},
    {id:8,name:'CEASA_PE_Manifesto_883.pdf',pages:'9.150',progress:5,status:'processing'},
    {id:7,name:'CEASA_PE_Manifesto_123.pdf',pages:'200',progress:0,status:'queued'},
    {id:6,name:'Lote_Escolas_GRE_Agreste_02_2026.pdf',pages:'540',progress:0,status:'queued'},
    {id:5,name:'Lote_Escolas_GRE_Agreste_01_2026.pdf',pages:'890',progress:0,status:'queued'},
  ]);

  useEffect(() => { Promise.all([fetch('/data/extractions.json').then(r => r.json()), fetch('/data/crop-manifest.json').then(r => r.json())]).then(([data,crops]) => { setExtractions(data); setManifest(crops); }).finally(() => setLoading(false)); }, []);
  useEffect(() => localStorage.setItem('notope-edits', JSON.stringify(edits)), [edits]);
  useEffect(() => localStorage.setItem('notope-font-scale', String(fontScale)), [fontScale]);
  useEffect(() => localStorage.setItem('notope-theme', theme), [theme]);
  const pages = useMemo(() => {
    const map = new Map<number, PageData>();
    for (const item of extractions) { const current = map.get(item.pagina) || {page:item.pagina,values:{},needsReview:false,reviewCount:0}; current.values[item.campo] = item; if (item.revisar_humano) { current.needsReview = true; current.reviewCount++; } map.set(item.pagina,current); }
    return Array.from(map.values()).sort((a,b) => a.page-b.page);
  }, [extractions]);
  const queue = useMemo(() => extractions.filter(item => item.revisar_humano && edits[`${item.pagina}:${item.campo}`] === undefined), [extractions, edits]);

  if (!logged) return <Login onLogin={() => setLogged(true)} />;
  if (loading) return <Loading />;
  return <Shell route={route} onNavigate={setRoute} fontScale={fontScale} setFontScale={setFontScale} theme={theme} onToggleTheme={() => setTheme(current => current === 'light' ? 'dark' : 'light')}>
    {route === 'dashboard' && <Dashboard pages={pages} onNavigate={setRoute} />}
    {route === 'upload' && <Upload rows={rows} setRows={setRows} />}
    {route === 'detail' && <Detail pages={pages} onNavigate={setRoute} />}
    {route === 'guide' && <Guide pages={pages} manifest={manifest} page={page} setPage={setPage} edits={edits} setEdits={setEdits} onNavigate={setRoute} />}
    {route === 'batch' && <BatchReview queue={queue} manifest={manifest} index={Math.min(batchIndex, Math.max(0, queue.length - 1))} setIndex={setBatchIndex} edits={edits} setEdits={setEdits} onNavigate={setRoute} setPage={setPage} />}
    {route === 'users' && <Users />}
    {route === 'profiles' && <Profiles />}
    {route === 'permissions' && <Permissions />}
    {route === 'metrics' && <Metrics />}
  </Shell>;
}
