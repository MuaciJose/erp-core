-- ================================================================
-- 📋 MIGRATIONS - EXTRATO FINANCEIRO
-- ================================================================
--
-- Arquivo com as alterações de banco necessárias para suportar
-- a funcionalidade de Extratos Financeiros
--
-- Executar ANTES de reiniciar a aplicação
-- ================================================================

-- 1. Adicionar coluna para layout do extrato de clientes
ALTER TABLE configuracoes_sistema
ADD COLUMN IF NOT EXISTS layoutHtmlExtratoCliente LONGTEXT;

-- 2. Adicionar coluna para layout do extrato de fornecedores
ALTER TABLE configuracoes_sistema
ADD COLUMN IF NOT EXISTS layoutHtmlExtratoFornecedor LONGTEXT;

-- 3. Visualizar a estrutura atualizada
-- SHOW COLUMNS FROM configuracoes_sistema;

-- ================================================================
-- DADOS PADRÃO (se as colunas estavam NULL)
-- ================================================================

-- Nenhuma ação necessária - o sistema usa templates padrão se NULL

-- ================================================================
-- EXEMPLO DE CONSULTAS DE TESTE
-- ================================================================

-- Buscar todos os clientes com suas contas a receber pendentes
SELECT
  p.id,
  p.nome,
  p.documento,
  cr.id as conta_id,
  cr.descricao,
  cr.dataVencimento,
  cr.valorOriginal,
  cr.status,
  DATEDIFF(NOW(), cr.dataVencimento) as dias_atraso
FROM parceiros p
LEFT JOIN contas_receber cr ON p.id = cr.parceiro_id
WHERE p.tipo = 'CLIENTE'
  AND cr.status = 'PENDENTE'
ORDER BY p.nome, cr.dataVencimento;


-- Buscar todos os fornecedores com suas contas a pagar pendentes
SELECT
  p.id,
  p.nome,
  p.documento,
  cp.id as conta_id,
  cp.descricao,
  cp.dataVencimento,
  cp.valorOriginal,
  cp.status,
  DATEDIFF(NOW(), cp.dataVencimento) as dias_atraso
FROM parceiros p
LEFT JOIN contas_pagar cp ON p.id = cp.parceiro_id
WHERE p.tipo = 'FORNECEDOR'
  AND cp.status = 'PENDENTE'
ORDER BY p.nome, cp.dataVencimento;


-- Contar quantas contas cada cliente tem
SELECT
  p.id,
  p.nome,
  COUNT(cr.id) as total_contas,
  SUM(CASE WHEN cr.status = 'PENDENTE' THEN cr.valorOriginal ELSE 0 END) as total_pendente,
  SUM(CASE WHEN cr.status IN ('PAGO', 'LIQUIDADO') THEN cr.valorOriginal ELSE 0 END) as total_recebido
FROM parceiros p
LEFT JOIN contas_receber cr ON p.id = cr.parceiro_id
WHERE p.tipo = 'CLIENTE'
GROUP BY p.id, p.nome
HAVING total_contas > 0
ORDER BY total_pendente DESC;


-- Contar quantas contas cada fornecedor tem
SELECT
  p.id,
  p.nome,
  COUNT(cp.id) as total_contas,
  SUM(CASE WHEN cp.status = 'PENDENTE' THEN cp.valorOriginal ELSE 0 END) as total_pendente,
  SUM(CASE WHEN cp.status IN ('PAGO', 'LIQUIDADO') THEN cp.valorOriginal ELSE 0 END) as total_pago
FROM parceiros p
LEFT JOIN contas_pagar cp ON p.id = cp.parceiro_id
WHERE p.tipo = 'FORNECEDOR'
GROUP BY p.id, p.nome
HAVING total_contas > 0
ORDER BY total_pendente DESC;


-- Relatório de dias em atraso (clientes)
SELECT
  p.id,
  p.nome,
  p.email,
  p.telefone,
  COUNT(cr.id) as contas_atrasadas,
  MAX(DATEDIFF(NOW(), cr.dataVencimento)) as max_dias_atraso,
  SUM(cr.valorOriginal) as total_atrasado
FROM parceiros p
LEFT JOIN contas_receber cr ON p.id = cr.parceiro_id
WHERE p.tipo = 'CLIENTE'
  AND cr.status = 'PENDENTE'
  AND cr.dataVencimento < NOW()
GROUP BY p.id, p.nome, p.email, p.telefone
ORDER BY max_dias_atraso DESC;


-- Listar contas vencidas para cobrança
SELECT
  p.nome,
  cr.id,
  cr.descricao,
  cr.dataVencimento,
  cr.valorOriginal,
  DATEDIFF(NOW(), cr.dataVencimento) as dias_atraso,
  ROUND(cr.valorOriginal * (DATEDIFF(NOW(), cr.dataVencimento) / 30) * 0.01, 2) as multa_estimada
FROM contas_receber cr
JOIN parceiros p ON cr.parceiro_id = p.id
WHERE cr.status = 'PENDENTE'
  AND cr.dataVencimento < NOW()
ORDER BY dias_atraso DESC;


-- ================================================================
-- LIMPEZA / ROLLBACK (se necessário)
-- ================================================================

-- Remover as colunas (somente se necessário reverter)
-- ALTER TABLE configuracoes_sistema DROP COLUMN layoutHtmlExtratoCliente;
-- ALTER TABLE configuracoes_sistema DROP COLUMN layoutHtmlExtratoFornecedor;


-- ================================================================
-- ÍNDICES PARA MELHORAR PERFORMANCE (OPCIONAL)
-- ================================================================

-- Índice para buscar contas de um cliente rapidamente
CREATE INDEX IF NOT EXISTS idx_contas_receber_parceiro
ON contas_receber(parceiro_id);

-- Índice para buscar contas de um fornecedor rapidamente
CREATE INDEX IF NOT EXISTS idx_contas_pagar_parceiro
ON contas_pagar(parceiro_id);

-- Índice para filtrar por data de vencimento
CREATE INDEX IF NOT EXISTS idx_contas_receber_vencimento
ON contas_receber(dataVencimento);

CREATE INDEX IF NOT EXISTS idx_contas_pagar_vencimento
ON contas_pagar(dataVencimento);

-- Índice para filtrar por status
CREATE INDEX IF NOT EXISTS idx_contas_receber_status
ON contas_receber(status);

CREATE INDEX IF NOT EXISTS idx_contas_pagar_status
ON contas_pagar(status);

-- Índice composto para buscas otimizadas
CREATE INDEX IF NOT EXISTS idx_contas_receber_composto
ON contas_receber(parceiro_id, status, dataVencimento);

CREATE INDEX IF NOT EXISTS idx_contas_pagar_composto
ON contas_pagar(parceiro_id, status, dataVencimento);


-- ================================================================
-- VERIFICAÇÃO DE ESTRUTURA
-- ================================================================

-- Verificar se as colunas foram adicionadas
SELECT
  COLUMN_NAME,
  DATA_TYPE,
  IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'configuracoes_sistema'
  AND COLUMN_NAME LIKE '%layoutHtml%Extrato%';


-- Verificar indices criados
SHOW INDEX FROM contas_receber WHERE Key_name LIKE 'idx_%';
SHOW INDEX FROM contas_pagar WHERE Key_name LIKE 'idx_%';


-- ================================================================
-- PERFORMANCE: VERIFICAR QUERY PLAN
-- ================================================================

-- Explicar plano de execução para otimização
EXPLAIN SELECT * FROM contas_receber
WHERE parceiro_id = 15
  AND status = 'PENDENTE'
  AND dataVencimento BETWEEN '2026-01-01' AND '2026-03-31';

EXPLAIN SELECT * FROM contas_pagar
WHERE parceiro_id = 8
  AND status = 'PENDENTE'
  AND dataVencimento BETWEEN '2026-01-01' AND '2026-03-31';


-- ================================================================
-- DADOS DE TESTE (opcional)
-- ================================================================

-- Inserir cliente de teste (se não existir)
INSERT INTO parceiros (nome, documento, tipo, email, telefone)
VALUES ('Cliente Teste', '123.456.789-00', 'CLIENTE', 'teste@example.com', '11987654321')
ON DUPLICATE KEY UPDATE nome = nome;


-- Inserir contas a receber de teste
INSERT INTO contas_receber (parceiro_id, descricao, valor_original, data_vencimento, status)
SELECT id, 'Venda Teste', 1000.00, '2026-01-15', 'PENDENTE'
FROM parceiros
WHERE documento = '123.456.789-00'
LIMIT 1;


-- ================================================================
-- RESETAR SEQUÊNCIAS (se necessário)
-- ================================================================

-- Para MariaDB/MySQL - resetar AUTO_INCREMENT
-- ALTER TABLE contas_receber AUTO_INCREMENT = 1;
-- ALTER TABLE contas_pagar AUTO_INCREMENT = 1;


-- ================================================================
-- COMMIT E VALIDAÇÃO FINAL
-- ================================================================

-- Se tudo correu bem, fazer COMMIT
-- COMMIT;

-- Verificação final
SELECT VERSION() as mysql_version;
SELECT COUNT(*) as total_contas_receber FROM contas_receber;
SELECT COUNT(*) as total_contas_pagar FROM contas_pagar;
SELECT COUNT(*) as total_clientes FROM parceiros WHERE tipo = 'CLIENTE';
SELECT COUNT(*) as total_fornecedores FROM parceiros WHERE tipo = 'FORNECEDOR';

