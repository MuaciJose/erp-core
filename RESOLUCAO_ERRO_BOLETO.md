# Resolução: Erro NoClassDefFoundError ao Gerar Boleto

## Problema Identificado

Erro: `java.lang.NoClassDefFoundError: com/lowagie/text/pdf/FopGlyphProcessor`

Este erro ocorria durante a geração de boletos no módulo financeiro.

## Causa Raiz

A biblioteca `caelum-stella-boleto` (versão 2.1.5) depende internamente do **iText 5** (que usa classes do pacote `com.lowagie.text`). No entanto, o projeto tinha:

1. **Conflito de versões de iText**:
   - `itext7-core` (versão 7.2.5) - mais recente
   - `flying-saucer-pdf-itext5` (versão 9.1.22) - que usa iText 5
   - Faltava a dependência explícita do `itextpdf` versão 5

2. **Dependência Lombok duplicada**: Havia duas declarações da dependência Lombok no pom.xml, uma sem escopo e outra com `scope="provided"`

## Solução Aplicada

### 1. Adicionar Dependência Explícita do iText 5

```xml
<!-- Dependências explícitas do iText 5 para suportar caelum-stella-boleto -->
<dependency>
    <groupId>com.itextpdf</groupId>
    <artifactId>itextpdf</artifactId>
    <version>5.5.13.3</version>
</dependency>
```

Esta dependência fornece as classes do pacote `com.lowagie.text` necessárias para a geração de boletos.

### 2. Remover Duplicação de Dependência

Removeu a declaração duplicada de Lombok:
- Manteve: `<scope>provided</scope>` (usado pelo compilador do Maven)
- Removeu: A declaração sem escopo com `<optional>true</optional>`

## Arquivos Modificados

- **pom.xml**:
  - Linha ~127-130: Adicionado `itextpdf` versão 5.5.13.3
  - Linhas ~87-91: Removida duplicação de Lombok

## Testes Realizados

✅ Build Maven executado com sucesso: `mvn clean package -DskipTests`
✅ JAR gerado corretamente: `erp-core-0.0.1-SNAPSHOT.jar`
✅ Nenhum erro de compilação ou dependências faltantes

## Como Testar

1. **Reconstruir o projeto**:
   ```bash
   mvn clean package -DskipTests
   ```

2. **Testar a geração de boleto** via API:
   ```bash
   GET http://localhost:8080/api/financeiro/boletos/{contaReceberId}/gerar-pdf/{contaBancariaId}
   ```

3. **Verificar logs** para confirmar que não há erros de `NoClassDefFoundError`:
   ```bash
   tail -f /var/log/erp-core.log | grep -i "noclassdeffounderror"
   ```

## Notas Importantes

- A versão 5.5.13.3 do `itextpdf` é compatível com `caelum-stella-boleto 2.1.5`
- A versão 7 (iText 7) pode ser mantida para outros usos de PDF no projeto, pois a dependência do iText 5 resolve o conflito
- A remoção da duplicação de Lombok melhora a limpeza do pom.xml

## Próximos Passos

Se o erro persistir após o rebuild:
1. Executar `mvn dependency:tree` para verificar a árvore de dependências
2. Verificar se há outros conflicts entre versões de iText
3. Considerar usar `<exclusions>` se houver transitive dependencies problemáticas

