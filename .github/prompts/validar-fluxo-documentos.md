---
description: Verifica a integração de upload, listagem e download entre frontend e backend.
name: validar-fluxo-documentos
argument-hint: operação a verificar (ex. upload e download)
agent: agent
---

# Validar fluxo de documentos

Verifique a operação `${input:operacao:fluxo de documentos}` de ponta a ponta no DMS.

- Confira o contrato nas rotas e controllers, as regras no service e a persistência no repository.
- Confira se o cliente frontend envia os dados e cabeçalhos esperados e trata as respostas.
- Verifique testes existentes e execute os testes relevantes.
- Corrija divergências encontradas e adicione testes focados, sem refatorações fora do escopo.
- Preserve o armazenamento local com multer e metadados em memória.
- Ao final, resuma os arquivos alterados e as validações executadas.