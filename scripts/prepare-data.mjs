import { cp, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';

const root = process.cwd();
const publicDir = join(root, 'public');
const dataDir = join(publicDir, 'data');
const cropSource = join(root, 'crops_preprocessados_por_campo');
const cropTarget = join(publicDir, 'crops');

await mkdir(dataDir, { recursive: true });
await mkdir(join(publicDir, 'assets'), { recursive: true });
await mkdir(join(publicDir, 'documents'), { recursive: true });

const raw = JSON.parse(await readFile(join(root, 'resultados_tratados.json'), 'utf8'));
const safe = raw.map((item) => ({
  pagina: Number(item.pagina),
  campo: item.campo,
  extraido_ia: item.extraido_ia,
  status: item.status,
  yolo_conf: item.yolo_conf,
  criticidade: item.criticidade,
  regra_negocio_alerta: Boolean(item.regra_negocio_alerta),
  regra_negocio_mensagem: item.regra_negocio_mensagem || '',
  sugestao_validacao: item.sugestao_validacao || '',
  alerta_critico: Boolean(item.alerta_critico),
  revisar_humano: Boolean(item.revisar_humano),
  acao: item.acao,
  regra_negocio_regras: item.regra_negocio_regras || '',
}));

const splitRules = (value) => String(value || '').split(' | ').filter(Boolean);
const joinUnique = (...values) => [...new Set(values.flatMap(splitRules))].join(' | ');
const integerValue = (value) => {
  const normalized = String(value ?? '').trim();
  return /^\d+$/.test(normalized) ? Number(normalized) : null;
};
const addReviewIssue = (item, rule, message, suggestion) => {
  item.regra_negocio_regras = joinUnique(item.regra_negocio_regras, rule);
  item.regra_negocio_mensagem = joinUnique(item.regra_negocio_mensagem, message);
  item.sugestao_validacao = joinUnique(item.sugestao_validacao, suggestion);
  item.regra_negocio_alerta = true;
  item.revisar_humano = true;
  item.acao = 'REVISAR_HUMANO';
  if (item.criticidade === 'SEM_ALERTA') item.criticidade = 'ALTA';
};

// Total devolvido ausente/não numérico deixa de ser motivo de revisão.
for (const item of safe) {
  if (item.campo !== 'total_devolvido') continue;
  const rules = splitRules(item.regra_negocio_regras);
  if (!rules.includes('QUANTIDADE_AUSENTE')) continue;
  const remainingRules = rules.filter((rule) => rule !== 'QUANTIDADE_AUSENTE');
  item.regra_negocio_regras = remainingRules.join(' | ');
  if (remainingRules.length === 0) {
    item.regra_negocio_alerta = false;
    item.regra_negocio_mensagem = '';
    item.sugestao_validacao = '';
    item.alerta_critico = false;
    item.revisar_humano = false;
    item.acao = 'AUTOMATICO';
    item.criticidade = 'SEM_ALERTA';
  }
}

const pages = new Map();
for (const item of safe) {
  const page = pages.get(item.pagina) || {};
  page[item.campo] = item;
  pages.set(item.pagina, page);
}

const periodMessage = 'Data deve estar entre 22/04/2026 e 11/05/2026.';
const periodSuggestion = 'Verificar a data informada. O período permitido vai de 22/04/2026 a 11/05/2026, inclusive.';

for (const fields of pages.values()) {
  const year = integerValue(fields.ano?.extraido_ia);
  const month = integerValue(fields.mes?.extraido_ia);
  const day = integerValue(fields.dia?.extraido_ia);

  // Ano válido: exclusivamente 2026.
  if (year !== null && year !== 2026 && fields.ano) {
    fields.ano.regra_negocio_mensagem = splitRules(fields.ano.regra_negocio_mensagem)
      .filter((message) => !message.startsWith('Ano deve estar entre '))
      .join(' | ');
    fields.ano.sugestao_validacao = splitRules(fields.ano.sugestao_validacao)
      .filter((suggestion) => suggestion !== 'Verificar o ano informado.')
      .join(' | ');
    addReviewIssue(fields.ano, 'ANO_FORA_DA_FAIXA', 'Ano deve ser 2026.', 'Corrigir o ano informado para 2026.');
  }

  // Quando mês e ano são legíveis, sinaliza o componente responsável por a
  // data ficar fora do período permitido. Datas ausentes continuam cobertas
  // pela regra DATA_AUSENTE.
  if (month !== null && month >= 1 && month <= 12) {
    if (month !== 4 && month !== 5 && fields.mes) {
      addReviewIssue(fields.mes, 'DATA_FORA_DO_PERIODO', periodMessage, periodSuggestion);
    } else if (day !== null && ((month === 4 && day < 22) || (month === 5 && day > 11)) && fields.dia) {
      addReviewIssue(fields.dia, 'DATA_FORA_DO_PERIODO', periodMessage, periodSuggestion);
    }
  }
}

const cropFiles = await readdir(cropSource);
const crops = {};
for (const filename of cropFiles) {
  const match = filename.match(/^page_(\d+)_(.+?)_det_/);
  if (!match) continue;
  const key = `${Number(match[1])}:${match[2]}`;
  crops[key] = `/crops/${filename}`;
}

await writeFile(join(dataDir, 'extractions.json'), JSON.stringify(safe));
await writeFile(join(dataDir, 'crop-manifest.json'), JSON.stringify(crops));

const targetCropStat = await stat(cropTarget).catch(() => null);
if (!targetCropStat) await cp(cropSource, cropTarget, { recursive: true });
await cp(join(root, 'assets'), join(publicDir, 'assets'), { recursive: true, force: true });
await cp(join(root, 'Form_Novo_300_pags.pdf'), join(publicDir, 'documents', basename('Form_Novo_300_pags.pdf')), { force: true });
