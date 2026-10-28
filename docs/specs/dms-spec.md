# Especificação - Document Management System

## 1. Objetivo

Permitir que usuários identifiquem seus documentos, enviem arquivos, consultem a lista dos próprios envios e baixem esses arquivos, com armazenamento local.

## 2. Escopo

### Dentro do escopo

- Envio, listagem e download de documentos.
- Identificação simples do usuário para associar documentos ao dono.
- Interface web em React para essas operações.

### Fora do escopo

- Armazenamento externo ou em nuvem.
- Versionamento, autenticação, cadastro de contas ou recuperação de senha.
- Persistência durável dos metadados nesta fase.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O usuário pode enviar um arquivo não vazio por `multipart/form-data`. |
| RF-02 | O upload associa o documento ao identificador de usuário informado na requisição. |
| RF-03 | O usuário pode listar somente os documentos associados ao seu identificador. |
| RF-04 | O usuário pode baixar um documento pelo identificador se ele pertencer ao usuário informado. |
| RF-05 | A interface permite informar o identificador do usuário e enviar, listar e baixar documentos. |
| RF-06 | A interface apresenta estados de carregamento, lista vazia e erros retornados pela API. |

O identificador do usuário é enviado no cabeçalho `X-User-Id`. Na interface de demonstração, ele pode ser informado pelo usuário e mantido no navegador. Isso é apenas uma identificação funcional, não autenticação: não deve ser tratado como controle de segurança.

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos são gravados no filesystem local com `multer` e `diskStorage`, por padrão em `backend/storage`. |
| RNF-02 | Os metadados ficam em memória e podem ser perdidos ao reiniciar o processo. |
| RNF-03 | A configuração operacional usa variáveis de ambiente, com valores padrão documentados. |
| RNF-04 | O nome original não é usado como caminho de armazenamento; o arquivo recebe nome interno opaco. |
| RNF-05 | O limite inicial de upload é 10 MiB, configurável por `MAX_UPLOAD_SIZE_BYTES`. |
| RNF-06 | As respostas de erro da API usam JSON consistente e não expõem caminhos internos do filesystem. |

## 5. Modelo de dados

Metadados expostos pela API:

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string | Identificador único, gerado pelo servidor. |
| `originalName` | string | Nome original fornecido pelo cliente. |
| `size` | number | Tamanho do arquivo em bytes. |
| `uploadedAt` | string | Data e hora do upload em ISO 8601. |
| `owner` | string | Identificador recebido em `X-User-Id`. |

O repositório mantém internamente a associação entre `id`, metadados e nome opaco do arquivo em disco. O nome interno e o caminho físico não são retornados pela API.

## 6. Contratos de API

Todas as rotas abaixo são atendidas pelo backend sem prefixo. O frontend usa `/api`; o proxy Vite existente remove esse prefixo. As requisições que acessam documentos exigem `X-User-Id` não vazio.

### `POST /upload`

- Entrada: `multipart/form-data`, campo de arquivo `file`; cabeçalho `X-User-Id`.
- Sucesso: `201 Created`, corpo JSON com os metadados do documento.
- Erros: `400` para arquivo ausente ou vazio; `413` para arquivo acima do limite; `500` para falha inesperada de armazenamento.

### `GET /documents`

- Entrada: cabeçalho `X-User-Id`.
- Sucesso: `200 OK`, corpo JSON como lista de metadados pertencentes ao usuário. Lista vazia retorna `[]`.
- Ordenação: uploads mais recentes primeiro.

### `GET /documents/:id/download`

- Entrada: identificador na URL e cabeçalho `X-User-Id`.
- Sucesso: `200 OK`, conteúdo binário com nome de download baseado em `originalName`.
- Erros: `404` para documento inexistente ou que não pertence ao usuário.

### Formato de erro

`Content-Type: application/json`, corpo `{ "error": { "code": "CODIGO", "message": "Descrição" } }`. Usar `400` para entrada inválida, `401` para ausência de `X-User-Id`, `404` para recurso indisponível e `500` para falha inesperada. O tamanho acima do limite retorna `413`.

## 7. Decisões arquiteturais

- Backend CommonJS com dependências direcionadas `routes -> controllers -> services -> repositories`.
- Rotas encaminham requisições; controllers validam entrada e formatam respostas; services aplicam regras de negócio; repositories gerenciam filesystem e metadados em memória.
- `multer` com `diskStorage` grava exclusivamente em `backend/storage` ou no diretório definido por `UPLOAD_DIR`.
- Frontend React usa componentes funcionais e um serviço baseado em `fetch`, chamando a API pelo prefixo `/api`.
- Configuração: `PORT` (padrão `3000`), `UPLOAD_DIR` (padrão `backend/storage`) e `MAX_UPLOAD_SIZE_BYTES` (padrão `10485760`).
- O identificador informado pelo cliente não comprova identidade. Autenticação e autorização real ficam fora desta fase.

## 8. Plano de execução

1. **Especificação**: produzir este documento em `docs/specs/dms-spec.md`. Critério de aceite: escopo, contratos, modelo, decisões e etapas registrados; nenhum arquivo de implementação alterado nesta etapa.
2. **Backend**: em etapa posterior, implementar as camadas e rotas previstas, armazenamento local e metadados em memória. Critério de aceite: testes cobrem upload válido e inválido, limite, listagem por dono, download autorizado e documento indisponível; `npm test` passa.
3. **Frontend**: em etapa posterior, integrar upload, listagem e download via `/api`, enviando `X-User-Id`. Critério de aceite: operações funcionam pela interface e estados vazios, carregamento e erro são apresentados.
4. **Integração**: validar o fluxo completo com backend e frontend ativos. Critério de aceite: um arquivo enviado aparece na lista do mesmo usuário e pode ser baixado; outro identificador não lista nem baixa esse documento.

## 9. Riscos e limitações

- Reiniciar o backend perde os metadados em memória; arquivos já gravados podem permanecer sem referência.
- O cabeçalho `X-User-Id` pode ser falsificado e não substitui autenticação.
- O armazenamento local e o repositório em memória não são adequados para múltiplas instâncias do backend.