export type Route = 'dashboard' | 'upload' | 'detail' | 'guide' | 'batch' | 'users' | 'profiles' | 'permissions' | 'metrics';

export type Extraction = {
  pagina: number;
  campo: string;
  extraido_ia: string | number | null;
  status: number;
  yolo_conf: number | null;
  criticidade: 'SEM_ALERTA' | 'ATENCAO' | 'ALTA' | 'CRITICA';
  regra_negocio_alerta: boolean;
  regra_negocio_mensagem: string;
  sugestao_validacao: string;
  alerta_critico: boolean;
  revisar_humano: boolean;
  acao: string;
  regra_negocio_regras: string;
};

export type CropManifest = Record<string, string>;

export type PageData = {
  page: number;
  values: Record<string, Extraction>;
  needsReview: boolean;
  reviewCount: number;
};
