export const ERP_MODULE_GROUPS = [
    {
        id: 'dashboard',
        titulo: 'Dashboard',
        icone: 'dashboard',
        acao: 'dash',
        gerenciavel: true
    },
    {
        id: 'vendas',
        titulo: 'Vendas & Frente de Loja',
        icone: 'vendas',
        gerenciavel: true,
        telas: [
            { acao: 'pdv', nome: 'Ponto de Venda Rápido (PDV)', menuTitulo: 'Ponto de Venda (PDV)' },
            { acao: 'vendas', nome: 'Balcão de Peças / Central', menuTitulo: 'Balcão / Central' },
            { acao: 'checklist', nome: 'Checklist de Entrada (Tablet)', menuTitulo: 'Checklist de Entrada' },
            { acao: 'os', nome: 'Ordem de Serviço (OS)', menuTitulo: 'Painel de OS (Kanban)' },
            { acao: 'listagem-os', nome: 'Consulta de OS (Histórico)', menuTitulo: 'Consulta de OS (Lista)' },
            { acao: 'orcamentos', nome: 'Orçamentos e Pedidos', menuTitulo: 'Orçamentos e Pedidos' },
            { acao: 'fila-caixa', nome: 'Fila do Caixa (Receber Pagamentos)', menuTitulo: 'Fila do Caixa' },
            { acao: 'caixa', nome: 'Controle de Caixa (Abrir/Fechar Turno)', menuTitulo: 'Controle de Caixa' },
            { acao: 'relatorio-comissoes', nome: 'Relatório de Comissões', menuTitulo: 'Relatório de Comissões' }
        ]
    },
    {
        id: 'crm',
        titulo: 'CRM & Relacionamento',
        icone: 'crm',
        gerenciavel: true,
        telas: [
            { acao: 'crm', nome: 'Painel de CRM / Pós-Venda', menuTitulo: 'Painel de CRM' },
            { acao: 'revisoes', nome: 'Gestão de Revisões (Agendamentos)', menuTitulo: 'Gestão de Revisões' },
            { acao: 'agenda', nome: 'Agenda Corporativa Inteligente', menuTitulo: 'Agenda Corporativa', livre: true },
            { acao: 'atendimento', nome: 'Atendimento SaaS', menuTitulo: 'Atendimento SaaS', livre: true },
            { acao: 'ficha-cadastral', nome: 'Ficha Cadastral da Empresa', menuTitulo: 'Ficha Cadastral', livre: true },
            { acao: 'whatsapp', nome: 'Integração WhatsApp', menuTitulo: 'Integração WhatsApp' }
        ]
    },
    {
        id: 'estoque',
        titulo: 'Estoque & Compras',
        icone: 'estoque',
        gerenciavel: true,
        telas: [
            { acao: 'estoque', nome: 'Buscar Peças / Consulta', menuTitulo: 'Buscar Peças' },
            { acao: 'marcas', nome: 'Gestão de Marcas', menuTitulo: 'Marcas' },
            { acao: 'categorias', nome: 'Gestão de Categorias', menuTitulo: 'Categorias' },
            { acao: 'etiquetas', nome: 'Gerador de Etiquetas', menuTitulo: 'Gerador de Etiquetas' },
            { acao: 'ajuste_estoque', nome: 'Ajuste de Estoque / Inventário', menuTitulo: 'Ajuste de Estoque' },
            { acao: 'compras', nome: 'Importar NF-e (XML)', menuTitulo: 'Importar NF-e (XML)' },
            { acao: 'previsao', nome: 'Previsão de Compras', menuTitulo: 'Previsão de Compras' },
            { acao: 'faltas', nome: 'Relatório de Faltas', menuTitulo: 'Relatório de Faltas' },
            { acao: 'inventario', nome: 'Inventário PWA', menuTitulo: 'Inventário PWA' },
            { acao: 'curva-abc', nome: 'Curva ABC', menuTitulo: 'Curva ABC' }
        ]
    },
    {
        id: 'financeiro',
        titulo: 'Financeiro',
        icone: 'financeiro',
        gerenciavel: true,
        telas: [
            { acao: 'contas-pagar', nome: 'Contas a Pagar (Despesas)', menuTitulo: 'Contas a Pagar' },
            { acao: 'contas-receber', nome: 'Contas a Receber (Fiado)', menuTitulo: 'Contas a Receber' },
            { acao: 'bancos', nome: 'Contas Bancárias / Tesouraria', menuTitulo: 'Contas Bancárias' },
            { acao: 'conciliacao', nome: 'Conciliação Bancária', menuTitulo: 'Conciliação Bancária' },
            { acao: 'plano-contas', nome: 'Plano de Contas', menuTitulo: 'Plano de Contas' },
            { acao: 'dre', nome: 'Resultado e Lucro (DRE)', menuTitulo: 'Resultado (DRE)' },
            { acao: 'fluxo-caixa-projecao', nome: 'Fluxo de Caixa Projetado', menuTitulo: 'Fluxo de Caixa Projetado' },
            { acao: 'recibo-avulso', nome: 'Gerador de Recibo Avulso', menuTitulo: 'Recibo Avulso' },
            { acao: 'historico-recibos', nome: 'Histórico de Recibos', menuTitulo: 'Histórico de Recibos' }
        ]
    },
    {
        id: 'cadastros',
        titulo: 'Administrativo',
        icone: 'administrativo',
        gerenciavel: true,
        telas: [
            { acao: 'parceiros', nome: 'Cadastros (Clientes/Fornecedores)', menuTitulo: 'Clientes & Fornecedores' },
            { acao: 'servicos', nome: 'Tabela de Serviços (Mão de Obra)', menuTitulo: 'Tabela de Mão de Obra' },
            { acao: 'usuarios', nome: 'Gestão de Usuários e Permissões', menuTitulo: 'Equipe e Acessos' },
            { acao: 'auditoria', nome: 'Auditoria de Sistema (Logs)', menuTitulo: 'Auditoria de Sistema' },
            { acao: 'fiscal', nome: 'Painel Fiscal Geral / Carga NCM', menuTitulo: 'Fiscal / NCM' },
            { acao: 'regras-fiscais', nome: 'Regras Fiscais de Tributação', menuTitulo: 'Regras Fiscais (NF-e)' },
            { acao: 'gerenciador-nfe', nome: 'Gerenciador de NF-e', menuTitulo: 'Gerenciador de NF-e' },
            { acao: 'emitir-nfe-avulsa', nome: 'Emitir NF-e Avulsa', menuTitulo: 'Emitir NF-e Avulsa' },
            { acao: 'central-saas', nome: 'Central SaaS', menuTitulo: 'Central SaaS', platformOnly: true, permissao: 'usuarios', gerenciavel: false }
        ]
    },
    {
        id: 'configuracoes',
        titulo: 'Configurações',
        icone: 'configuracoes',
        acao: 'configuracoes',
        gerenciavel: true
    },
    {
        id: 'manual',
        titulo: 'Manual do Usuário',
        icone: 'manual',
        acao: 'manual',
        livre: true,
        gerenciavel: true
    }
];

export const ROTAS_LIVRES_ERP = Array.from(
    new Set(
        ERP_MODULE_GROUPS.flatMap((grupo) => {
            if (grupo.telas) {
                return grupo.telas.filter((item) => item.livre).map((item) => item.acao);
            }
            return grupo.livre ? [grupo.acao] : [];
        })
    )
);

export const ERP_LOCAL_ALLOWLIST = Array.from(
    new Set(
        ERP_MODULE_GROUPS.flatMap((grupo) => {
            if (grupo.telas) {
                return grupo.telas
                    .filter((item) => item.livre)
                    .map((item) => item.acao);
            }
            return grupo.livre && grupo.acao ? [grupo.acao] : [];
        })
    )
);

export const MODULE_GROUPS_FOR_USER_MANAGEMENT = ERP_MODULE_GROUPS
    .filter((grupo) => grupo.gerenciavel !== false)
    .map((grupo) => {
        if (!grupo.telas) {
            return {
                grupo: grupo.titulo,
                telas: [{ acao: grupo.acao, nome: grupo.titulo }]
            };
        }

        return {
            grupo: grupo.titulo,
            telas: grupo.telas
                .filter((item) => item.gerenciavel !== false && !item.platformOnly)
                .map((item) => ({ acao: item.acao, nome: item.nome }))
        };
    })
    .filter((grupo) => grupo.telas.length > 0);
