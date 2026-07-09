# Extensão Chrome - consolidador de notas SEFAZ

uma extensão para google chrome criada para automatizar a leitura e consolidação de itens de notas fiscais (NFC-e) diretamente do portal da SEFAZ.

## Problema resolvido

antes o processo era manual e suscetível a erros, agora é possivel somar os valores totais por produto evalor, direcionados a uma planilha do excel.

## O que a extensão faz:
1. le o HTML da nota fiscal na pagina da SEFAZ.
2. extrai linha a linha os produtos, quantidades e valores.
3. Gera um relatório contendo:
- a lista detalhada de cada item da nota
- um resumo consolidado com a soma das quantidades (litros) e valores por tipo de produto.
- o total geral da nota.

## Como instalar:
1. Baixe os arquivos desse repositório;
2. Abra o chrome e acesse: chrome://extensions/;
3. Ative o "modo desenvolvedor" no canto;
4. Clique em "carregar sem compactação" e selecione a pasta com os arquivos.