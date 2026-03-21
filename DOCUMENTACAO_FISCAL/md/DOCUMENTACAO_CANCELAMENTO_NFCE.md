/**
 * 📋 DOCUMENTAÇÃO DO ENDPOINT DE CANCELAMENTO DE NFC-e
 *
 * ============================================================================
 * 🚀 NOVO ENDPOINT: POST /api/fiscal/cancelar-nfce/{id}
 * ============================================================================
 *
 * 📌 DESCRIÇÃO
 * -----------
 * Cancela uma Nota Fiscal Eletrônica (NFC-e) que foi previamente autorizada
 * pela SEFAZ. O cancelamento só é permitido para notas em status AUTORIZADA.
 *
 * 🔐 SEGURANÇA
 * -----------
 * - Validação obrigatória de justificativa (15-255 caracteres)
 * - Verificação de certificado digital antes do cancelamento
 * - Registro completo em auditoria
 * - Apenas notas autorizadas podem ser canceladas
 *
 * 📡 REQUISIÇÃO HTTP
 * ------------------
 * POST /api/fiscal/cancelar-nfce/{id}
 *
 * Parâmetro de URL:
 *   {id} = ID da nota fiscal no banco de dados (Long)
 *
 * Headers:
 *   Content-Type: application/json
 *   Authorization: Bearer {token} (se autenticação estiver ativa)
 *
 * Body (JSON):
 * {
 *   "justificativa": "Operação cancelada conforme solicitação do cliente"
 * }
 *
 * ⚠️ VALIDAÇÕES DO BODY
 * --------------------
 * - justificativa: Obrigatória (@NotBlank)
 * - Tamanho mínimo: 15 caracteres
 * - Tamanho máximo: 255 caracteres
 * - Deve conter pelo menos uma letra válida (sem apenas números/símbolos)
 *
 * 📤 RESPOSTA DE SUCESSO (200 OK)
 * --------------------------------
 * {
 *   "status": "SUCESSO",
 *   "mensagem": "NFC-e número 1234 cancelada com sucesso na SEFAZ. Chave: 35230101234567000101650010000001231234567890 | Protocolo: 1234567890",
 *   "notaId": 123,
 *   "numeroNota": 1234,
 *   "chaveAcesso": "35230101234567000101650010000001231234567890",
 *   "statusAtualizado": "CANCELADA"
 * }
 *
 * 📤 RESPOSTA DE ERRO (400 Bad Request)
 * -----------------------------------
 * {
 *   "status": "ERRO",
 *   "mensagem": "Apenas notas com status AUTORIZADA podem ser canceladas. Status atual: PENDENTE",
 *   "detalhes": "Verifique se a nota está autorizada e se os dados de configuração estão corretos."
 * }
 *
 * 🔴 POSSÍVEIS ERROS
 * ------------------
 *
 * 1. Nota não encontrada (404)
 *    → "Nota Fiscal com ID 999 não encontrada."
 *
 * 2. Status inválido
 *    → "Apenas notas com status AUTORIZADA podem ser canceladas."
 *
 * 3. Justificativa inválida
 *    → "Justificativa é obrigatória para cancelamento."
 *    → "Justificativa deve ter no mínimo 15 caracteres."
 *    → "Justificativa não pode ultrapassar 255 caracteres."
 *
 * 4. Configuração fiscal incompleta
 *    → "Estado (UF) não configurado."
 *    → "CNPJ não configurado."
 *    → "Certificado Digital não encontrado para o CNPJ 12345678000190."
 *
 * 5. Erro de comunicação com SEFAZ
 *    → "Erro ao comunicar com SEFAZ: [mensagem]"
 *
 * 💻 EXEMPLOS DE USO
 * ------------------
 *
 * EXEMPLO 1: Com cURL
 * -------------------
 * curl -X POST http://localhost:8080/api/fiscal/cancelar-nfce/123 \
 *   -H "Content-Type: application/json" \
 *   -d '{"justificativa": "Cancelamento por erro na emissão. O cliente solicitou novo documento"}'
 *
 *
 * EXEMPLO 2: Com JavaScript/Fetch
 * ---------------------------------
 * const id = 123;
 * const justificativa = "Cancelamento por erro na emissão";
 *
 * fetch(`/api/fiscal/cancelar-nfce/${id}`, {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *   },
 *   body: JSON.stringify({
 *     justificativa: justificativa
 *   })
 * })
 * .then(response => response.json())
 * .then(data => {
 *   if (data.status === 'SUCESSO') {
 *     console.log('NFC-e cancelada:', data.mensagem);
 *   } else {
 *     console.error('Erro:', data.mensagem);
 *   }
 * })
 * .catch(error => console.error('Erro na requisição:', error));
 *
 *
 * EXEMPLO 3: Com React (hook)
 * ----------------------------
 * const [loading, setLoading] = useState(false);
 * const [mensagem, setMensagem] = useState('');
 *
 * const cancelarNota = async (notaId) => {
 *   setLoading(true);
 *   try {
 *     const response = await fetch(`/api/fiscal/cancelar-nfce/${notaId}`, {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify({
 *         justificativa: 'Erro na emissão. Documento será reenviado.'
 *       })
 *     });
 *
 *     const resultado = await response.json();
 *     if (resultado.status === 'SUCESSO') {
 *       setMensagem('✅ ' + resultado.mensagem);
 *       // Atualizar UI (remover nota da lista, etc)
 *     } else {
 *       setMensagem('❌ ' + resultado.mensagem);
 *     }
 *   } catch (error) {
 *     setMensagem('❌ Erro ao cancelar: ' + error.message);
 *   } finally {
 *     setLoading(false);
 *   }
 * };
 *
 *
 * EXEMPLO 4: Com Axios
 * --------------------
 * import axios from 'axios';
 *
 * const cancelarNota = async (notaId, justificativa) => {
 *   try {
 *     const { data } = await axios.post(
 *       `/api/fiscal/cancelar-nfce/${notaId}`,
 *       { justificativa },
 *       { headers: { 'Content-Type': 'application/json' } }
 *     );
 *
 *     console.log('Sucesso:', data.mensagem);
 *     return data;
 *   } catch (error) {
 *     console.error('Erro:', error.response?.data?.mensagem);
 *     throw error;
 *   }
 * };
 *
 *
 * EXEMPLO 5: Com Python/Requests
 * --------------------------------
 * import requests
 * import json
 *
 * url = "http://localhost:8080/api/fiscal/cancelar-nfce/123"
 * headers = {"Content-Type": "application/json"}
 * payload = {"justificativa": "Cancelamento por erro na emissão"}
 *
 * response = requests.post(url, headers=headers, json=payload)
 * resultado = response.json()
 *
 * if resultado['status'] == 'SUCESSO':
 *     print(f"✅ {resultado['mensagem']}")
 * else:
 *     print(f"❌ {resultado['mensagem']}")
 *
 *
 * 🔄 FLUXO DE CANCELAMENTO
 * ------------------------
 *
 * 1. Cliente faz POST com justificativa
 * 2. Controller localiza nota no banco
 * 3. NfceCancelamentoService valida:
 *    - Status AUTORIZADA?
 *    - Justificativa válida?
 *    - Certificado existe?
 * 4. Envia evento de cancelamento para SEFAZ
 * 5. SEFAZ processa e retorna confirmação
 * 6. Status da nota muda para CANCELADA
 * 7. Registro na auditoria (quem, quando, por quê)
 * 8. Resposta JSON com detalhes
 *
 * 📊 ESTADOS DA NOTA
 * ------------------
 *
 * Antes do cancelamento: AUTORIZADA
 * Depois do cancelamento: CANCELADA
 *
 * Outros possíveis estados (não podem ser cancelados):
 * - PENDENTE: Aguardando autorização da SEFAZ
 * - REJEITADA: SEFAZ recusou a nota
 * - ERRO: Problema técnico na emissão
 * - CANCELADA: Já foi cancelada
 *
 * 🔐 AUDITORIA
 * -----------
 * Todo cancelamento é registrado em logs:
 *
 * Registro de SUCESSO:
 *   Tipo: CANCELAMENTO_NFCE_SUCESSO
 *   Dados: Número da nota, chave, justificativa, protocolo, usuário
 *
 * Registro de ERRO:
 *   Tipo: CANCELAMENTO_NFCE_ERRO
 *   Dados: Número da nota, motivo do erro, usuário
 *
 * ⏱️ TEMPO DE PROCESSAMENTO
 * -------------------------
 * - Validações locais: < 100ms
 * - Comunicação SEFAZ: 1-5 segundos (depende da rede)
 * - Tempo total esperado: 1-6 segundos
 *
 * Recomendação: Adicione timeout de 30 segundos no frontend
 *
 * 🔧 IMPLEMENTAÇÃO NO FRONTEND (React exemplo)
 * -----------------------------------------------
 *
 * import { useState } from 'react';
 * import { AlertDialog, Button, Input, Spinner, toast } from 'sua-ui-library';
 *
 * export function ModalCancelarNota({ nota, onConfirm, onCancel }) {
 *   const [justificativa, setJustificativa] = useState('');
 *   const [loading, setLoading] = useState(false);
 *   const [erro, setErro] = useState('');
 *
 *   const handleCancelar = async () => {
 *     // Validação básica no frontend
 *     if (!justificativa.trim()) {
 *       setErro('Digite uma justificativa');
 *       return;
 *     }
 *
 *     if (justificativa.length < 15) {
 *       setErro('Justificativa deve ter no mínimo 15 caracteres');
 *       return;
 *     }
 *
 *     setLoading(true);
 *     try {
 *       const response = await fetch(
 *         `/api/fiscal/cancelar-nfce/${nota.id}`,
 *         {
 *           method: 'POST',
 *           headers: { 'Content-Type': 'application/json' },
 *           body: JSON.stringify({ justificativa })
 *         }
 *       );
 *
 *       const data = await response.json();
 *
 *       if (data.status === 'SUCESSO') {
 *         toast.success('✅ ' + data.mensagem);
 *         onConfirm(data);
 *       } else {
 *         toast.error('❌ ' + data.mensagem);
 *         setErro(data.mensagem);
 *       }
 *     } catch (error) {
 *       toast.error('Erro na comunicação');
 *       setErro(error.message);
 *     } finally {
 *       setLoading(false);
 *     }
 *   };
 *
 *   return (
 *     <AlertDialog open onOpenChange={onCancel}>
 *       <div className="space-y-4 p-6">
 *         <h2 className="text-xl font-bold">Cancelar NFC-e #{nota.numero}</h2>
 *         <p className="text-sm text-gray-600">
 *           Chave: {nota.chaveAcesso}
 *         </p>
 *
 *         <div>
 *           <label className="block text-sm font-medium mb-2">
 *             Justificativa (15-255 caracteres) *
 *           </label>
 *           <textarea
 *             value={justificativa}
 *             onChange={(e) => setJustificativa(e.target.value)}
 *             placeholder="Explique por que está cancelando..."
 *             className="w-full p-3 border rounded-lg focus:border-blue-500"
 *             rows={4}
 *           />
 *           <p className="text-xs text-gray-500 mt-1">
 *             {justificativa.length}/255 caracteres
 *           </p>
 *         </div>
 *
 *         {erro && <p className="text-red-600 text-sm">❌ {erro}</p>}
 *
 *         <div className="flex justify-end gap-3">
 *           <Button onClick={onCancel} disabled={loading}>
 *             Voltar
 *           </Button>
 *           <Button
 *             onClick={handleCancelar}
 *             disabled={loading || !justificativa.trim()}
 *             className="bg-red-600 hover:bg-red-700"
 *           >
 *             {loading ? <Spinner /> : 'Cancelar NFC-e'}
 *           </Button>
 *         </div>
 *       </div>
 *     </AlertDialog>
 *   );
 * }
 *
 *
 * ❓ DÚVIDAS FREQUENTES
 * --------------------
 *
 * P: Posso cancelar uma nota pendente de autorização?
 * R: Não. Use o endpoint DELETE /api/fiscal/notas/{id} para excluir notas pendentes.
 *
 * P: Posso cancelar uma nota já cancelada?
 * R: Não. O status mudou para CANCELADA e não pode ser alterado.
 *
 * P: Qual é a diferença entre DELETE e este cancelamento?
 * R: DELETE remove do banco (perdendo histórico). Cancelamento registra na SEFAZ
 *    e mantém histórico para auditoria.
 *
 * P: Posso usar uma justificativa muito longa?
 * R: Não. Máximo 255 caracteres. O campo será validado no frontend e backend.
 *
 * P: E se a SEFAZ não responder?
 * R: Será retornado erro após timeout de ~30 segundos. A nota permanece AUTORIZADA.
 *
 * P: O cliente pode ver quem cancelou?
 * R: Sim, está registrado em auditoria. Use logs_auditoria no banco.
 *
 *
 * 📚 REFERÊNCIAS
 * --------------
 * - Especificação SEFAZ: https://www.nfe.fazenda.gov.br/
 * - Manual de Cancelamento: https://www.nfe.fazenda.gov.br/portal/webServices.shtml
 * - Documentação da Biblioteca: java-nfe v4.00.25
 *
 */

