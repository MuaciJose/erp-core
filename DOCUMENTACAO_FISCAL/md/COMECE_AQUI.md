# 🚀 COMO COMEÇAR A USAR

## ⏱️ TEMPO ESTIMADO: 15-30 MINUTOS

---

## PASSO 1: Verificar que Tudo Foi Criado ✅

Execute este comando para verificar todos os arquivos:

```bash
cd /home/ubuntu/IdeaProjects/erp-core

# Verificar arquivo Java do serviço
ls -la src/main/java/com/grandport/erp/modules/fiscal/service/NfceCancelamentoService.java

# Verificar arquivo Java da DTO
ls -la src/main/java/com/grandport/erp/modules/fiscal/dto/NfceCancelamentoRequestDTO.java

# Verificar arquivo Java dos testes
ls -la src/test/java/com/grandport/erp/modules/fiscal/service/NfceCancelamentoServiceTest.java

# Verificar documentação
ls -la CANCELAMENTO_NFCE_README.md
ls -la DOCUMENTACAO_CANCELAMENTO_NFCE.md
ls -la RESUMO_TECNICO_CANCELAMENTO.md
ls -la CHECKLIST_FINAL.md
ls -la INDICE_ARQUIVOS.md
ls -la EXEMPLO_INTEGRACAO_FRONTEND.jsx
```

---

## PASSO 2: Compilar o Projeto ✅

```bash
cd /home/ubuntu/IdeaProjects/erp-core

# Compilar apenas (sem executar testes)
./mvnw clean compile

# Saída esperada:
# [INFO] BUILD SUCCESS
```

**Se aparecer error:** Envie a mensagem de erro que apareceu

---

## PASSO 3: Executar os Testes ✅

```bash
# Executar todos os testes
./mvnw test -Dtest=NfceCancelamentoServiceTest

# Saída esperada:
# [INFO] Tests run: 23, Failures: 0, Errors: 0, Skipped: 0
# [INFO] BUILD SUCCESS
```

---

## PASSO 4: Revisar a Documentação ⭐ (COMECE AQUI)

Abra em seu editor ou navegador:

1. **CANCELAMENTO_NFCE_README.md** ← 📖 COMECE AQUI
   - Guia rápido
   - O que é
   - Como usar
   - Exemplos simples

2. **DOCUMENTACAO_CANCELAMENTO_NFCE.md** ← 📖 DEPOIS
   - Documentação completa
   - API detalhada
   - 5 exemplos de código
   - FAQ

3. **RESUMO_TECNICO_CANCELAMENTO.md** ← 🔧 PARA ENTENDER
   - Como funciona internamente
   - Padrões utilizados
   - Arquitetura
   - Tecnicamente detalhado

4. **EXEMPLO_INTEGRACAO_FRONTEND.jsx** ← 💻 PARA INTEGRAR
   - Componente React pronto
   - Copia e cola
   - Bem comentado

---

## PASSO 5: Testar o Endpoint (Com cURL) ✅

Abra um terminal e execute:

```bash
# Substitua 123 pelo ID de uma nota AUTORIZADA no seu banco
curl -X POST http://localhost:8080/api/fiscal/cancelar-nfce/123 \
  -H "Content-Type: application/json" \
  -d '{
    "justificativa": "Cancelamento por erro na emissão conforme protocolo"
  }'
```

**Resposta esperada:**
```json
{
  "status": "SUCESSO",
  "mensagem": "NFC-e número 1234 cancelada com sucesso...",
  "notaId": 123,
  "numeroNota": 1234,
  "chaveAcesso": "35230101234567000101650010000001231234567890",
  "statusAtualizado": "CANCELADA"
}
```

**Ou com Postman:**
1. Abrir Postman
2. New Request
3. Method: POST
4. URL: `http://localhost:8080/api/fiscal/cancelar-nfce/123`
5. Headers: Content-Type = application/json
6. Body (JSON):
   ```json
   {
     "justificativa": "Cancelamento por erro na emissão"
   }
   ```
7. Click "Send"

---

## PASSO 6: Integrar no Frontend ⭐

### Opção A: Copiar Componente React (Mais Rápido)

1. Abra `EXEMPLO_INTEGRACAO_FRONTEND.jsx`
2. Copie o componente `ModalCancelarNfce`
3. Cole em seu projeto React
4. Adapte os nomes de classes conforme necessário

### Opção B: Implementar do Zero (Se Preferir)

Siga o guia em `DOCUMENTACAO_CANCELAMENTO_NFCE.md` seção "🔧 IMPLEMENTAÇÃO NO FRONTEND"

---

## PASSO 7: Validar Dados de Configuração ✅

Antes de testar com a SEFAZ, verifique no banco:

```sql
SELECT
  cnpj,
  uf,
  inscricao_estadual,
  crt,
  ambiente_sefaz,
  senha_certificado
FROM configuracoes_sistema
WHERE id = 1;
```

Todos estes campos devem estar preenchidos:
- ✅ CNPJ
- ✅ UF (sigla do estado, ex: SP, RJ)
- ✅ Inscrição Estadual
- ✅ CRT (1, 2 ou 3)
- ✅ Ambiente SEFAZ (2 para homologação)
- ✅ Senha do Certificado

---

## PASSO 8: Verificar Certificado Digital ✅

Execute este comando:

```bash
# Verificar se certificado existe
ls -la /home/ubuntu/IdeaProjects/erp-core/certificados/

# Esperado: Um arquivo chamado {CNPJ}.pfx
# Exemplo: 12345678000190.pfx
```

Se o arquivo não existir:
1. Acesse Configurações > Fiscal no seu aplicativo
2. Selecione o arquivo .pfx
3. Clique em "Upload"
4. Preencha a senha do certificado
5. Clique em "Salvar"

---

## PASSO 9: Testar Status da SEFAZ ✅

Execute este comando curl:

```bash
curl -X GET http://localhost:8080/api/fiscal/status-sefaz
```

**Esperado:**
```json
{
  "status": "ONLINE",
  "mensagem": "SEFAZ OK: Teste operacional"
}
```

Se retornar OFFLINE ou ERRO:
- [ ] Verificar conexão de internet
- [ ] Verificar certificado (validade)
- [ ] Verificar ambiente (homologação vs produção)
- [ ] Verificar configuração de UF

---

## 🔍 TROUBLESHOOTING

### "Nota não encontrada"
**Solução:** Verifique se o ID da nota existe e está AUTORIZADA
```sql
SELECT id, numero, status FROM notas_fiscais WHERE id = 123;
```

### "Status não AUTORIZADA"
**Solução:** Você tentou cancelar uma nota com status diferente de AUTORIZADA
- Apenas notas em status AUTORIZADA podem ser canceladas

### "Certificado não encontrado"
**Solução:**
```bash
# Verifique se existe
ls -la /home/ubuntu/IdeaProjects/erp-core/certificados/
# Se não existir, faça upload em Configurações > Fiscal
```

### "SEFAZ Offline"
**Solução:**
- Verifique conexão de internet
- Verifique se certificado está válido
- Teste em homologação (ambiente = 2)

### "Justificativa inválida"
**Solução:** A justificativa deve ter entre 15 e 255 caracteres

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Todos os arquivos foram criados com sucesso
- [ ] Projeto compila sem erros
- [ ] Testes executam com sucesso (23 testes)
- [ ] Li o arquivo CANCELAMENTO_NFCE_README.md
- [ ] Verifiquei a configuração fiscal (UF, CNPJ, Certificado)
- [ ] Testei o endpoint com cURL ou Postman
- [ ] Integrei o componente React no meu projeto
- [ ] Testei a interface do usuário
- [ ] Verifiquei a auditoria em logs_auditoria
- [ ] Testei em homologação SEFAZ

---

## 📚 DOCUMENTOS IMPORTANTES

| Documento | Para Quem | Tempo | Ação |
|-----------|-----------|-------|------|
| CANCELAMENTO_NFCE_README.md | Todos | 5 min | Ler primeiro |
| DOCUMENTACAO_CANCELAMENTO_NFCE.md | Devs/Analistas | 20 min | Estudar |
| RESUMO_TECNICO_CANCELAMENTO.md | Devs Sênior | 15 min | Revisar |
| EXEMPLO_INTEGRACAO_FRONTEND.jsx | Devs Frontend | 10 min | Copiar/Adaptar |
| CHECKLIST_FINAL.md | PMs/Líderes | 10 min | Referência |
| INDICE_ARQUIVOS.md | Todos | 5 min | Localizar tudo |

---

## 🎓 CURVA DE APRENDIZADO

```
Minuto 0:   Leia CANCELAMENTO_NFCE_README.md
Minuto 5:   Entenda a visão geral
Minuto 10:  Revise DOCUMENTACAO_CANCELAMENTO_NFCE.md
Minuto 20:  Teste com cURL
Minuto 30:  Integre componente React
Minuto 45:  Teste na UI
Minuto 60:  Pronto para usar!
```

---

## 🎯 OBJETIVOS ALCANÇÁVEIS

### ✅ Hoje (Primeiras 2 horas)
- Entender como funciona
- Testar endpoint básico
- Revisar código

### ✅ Amanhã (Próximas 4 horas)
- Integrar componente React
- Testar na interface do usuário
- Ajustar conforme necessário

### ✅ Esta Semana
- Testar em homologação SEFAZ
- Feedback de usuários
- Deploy para staging

### ✅ Próxima Semana
- Deploy para produção
- Monitoramento
- Suporte aos usuários

---

## 📞 DÚVIDAS?

1. **Consulte a documentação:** DOCUMENTACAO_CANCELAMENTO_NFCE.md > FAQ
2. **Revise os testes:** NfceCancelamentoServiceTest.java (exemplos de casos)
3. **Veja o exemplo:** EXEMPLO_INTEGRACAO_FRONTEND.jsx
4. **Procure no código:** Comentários em JavaDoc

---

## 🎉 BOA SORTE!

O sistema está 100% pronto para usar. Boa implementação! 🚀

---

**Dúvida rápida?** Veja a seção FAQ em DOCUMENTACAO_CANCELAMENTO_NFCE.md

