# API — Projeto Integrador TeaSaúde

Backend desenvolvido em **Node.js, Express e MongoDB Atlas** para o Projeto Integrador do curso de **Análise e Desenvolvimento de Sistemas — SENAC**.

O TeaSaúde é um sistema em desenvolvimento voltado ao gerenciamento de usuários e pacientes no contexto de serviços de saúde e acompanhamento especializado.

## Tecnologias e dependências

- **Node.js** — ambiente de execução JavaScript.
- **Express** — construção da API REST.
- **MongoDB Atlas** — banco de dados NoSQL.
- **Mongoose** — modelagem e acesso aos dados.
- **Swagger UI** — documentação interativa e testes dos endpoints.
- **dotenv** — carregamento de variáveis de ambiente.
- **CORS** — configuração de acesso entre origens.
- **bcryptjs** — geração e verificação de hashes de senhas.
- **jsonwebtoken** — geração e validação de tokens JWT.
- **Helmet** — pacote para configuração de cabeçalhos HTTP de segurança.
- **Morgan** — pacote para registro de requisições HTTP.
- **Nodemon** — reinicialização automática do servidor durante o desenvolvimento.

> Helmet e Morgan estão incluídos nas dependências do projeto. A ativação efetiva desses middlewares deve ser confirmada no arquivo `src/app.js`.

## Funcionalidades implementadas

### Gerenciamento de pacientes

- Cadastro de pacientes.
- Listagem de pacientes.
- Consulta de paciente por ID.
- Atualização de dados por PATCH.
- Exclusão de paciente.
- Validação de campos, data de nascimento, telefone e e-mail opcional.

### Autenticação e usuários

- Login com nome de usuário e senha.
- Armazenamento de senhas como hash usando bcryptjs.
- Autenticação por token JWT.
- Consulta dos dados públicos do usuário autenticado.
- Identificação de usuários pelos perfis `paciente`, `gestor` e `admin`.
- Controle de acesso por perfil nas rotas administrativas implementadas.

### Administração

- Cadastro de administradores por usuário autenticado com perfil Admin.
- Listagem de administradores.
- Filtro de administradores por situação ativa ou inativa.

### Gestão de instituições e gestores

- Modelo de dados para instituições.
- Validação de existência e situação ativa da instituição antes de vinculá-la a um gestor.
- Cadastro de gestores por usuário autenticado com perfil Admin.
- Validação de nomes de usuário duplicados.
- Validação dos dados de cadastro e da senha.

## Como executar o projeto

### 1. Clonar o repositório

Substitua `<URL_DO_REPOSITORIO>` pela URL do repositório do projeto no GitHub.

```bash
git clone <URL_DO_REPOSITORIO>
cd PI-backend
```

### 2. Instalar as dependências

```bash
npm install
```

### 3. Configurar as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto, usando o arquivo `.env.example` como referência.

Exemplo de configuração:

```env
PORT=3000
MONGO_URI=sua_string_de_conexao_mongodb
JWT_SECRET=seu_segredo_jwt_forte
ADMIN_INICIAL_NOME_USUARIO=admin.inicial
ADMIN_INICIAL_SENHA=defina_uma_senha_forte
```

**Importante:**

- Substitua os valores de exemplo pelas configurações apropriadas ao seu ambiente.
- `MONGO_URI` deve apontar para o banco de dados de desenvolvimento autorizado.
- `JWT_SECRET` deve ser um segredo forte, aleatório e exclusivo do ambiente.
- As credenciais do Admin inicial são usadas pelo script de criação inicial.
- O arquivo `.env` não deve ser enviado ao GitHub.
- Não compartilhe senhas, tokens JWT ou strings de conexão reais.

### 4. Preparar os registros iniciais

Em um banco de desenvolvimento sem nenhuma conta Admin, execute:

```bash
node scripts/criarAdminInicial.js
```

O script cria a conta administrativa inicial de acordo com as variáveis configuradas no `.env`. Ele não foi feito para criar administradores repetidamente.

Para preparar a instituição de desenvolvimento utilizada nos testes de vínculo de gestores, execute:

```bash
node scripts/prepararInstituicaoDev.js
```

Esse segundo script é destinado ao ambiente de desenvolvimento. Não o utilize indiscriminadamente em produção.

### 5. Iniciar o servidor

```bash
npm run dev
```

O servidor deverá conectar-se ao banco antes de começar a aceitar requisições.

## URLs locais

| Recurso | URL |
|---|---|
| API | http://localhost:3000 |
| Documentação Swagger | http://localhost:3000/api-docs |

A URL local somente estará disponível enquanto o servidor estiver em execução na máquina correspondente.

## Endpoints da API

### Pacientes

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/api/pacientes` | Cadastra um paciente |
| GET | `/api/pacientes` | Lista pacientes |
| GET | `/api/pacientes/:id` | Busca um paciente por ID |
| PATCH | `/api/pacientes/:id` | Atualiza os dados de um paciente |
| DELETE | `/api/pacientes/:id` | Exclui um paciente |

### Autenticação

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/api/auth/login` | Autentica um usuário e retorna um JWT |
| GET | `/api/auth/me` | Consulta os dados do usuário autenticado |

### Administradores

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/api/admins` | Cadastra um administrador |
| GET | `/api/admins` | Lista administradores |
| GET | `/api/admins?ativo=true` | Lista administradores ativos |
| GET | `/api/admins?ativo=false` | Lista administradores inativos |

Os endpoints administrativos exigem autenticação e perfil Admin.

### Gestores

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/api/gestores` | Cadastra um gestor vinculado a uma instituição |

O cadastro de gestores exige autenticação e perfil Admin. A instituição informada deve existir e estar ativa.

> Consulte o Swagger para verificar os campos obrigatórios, exemplos de requisição, respostas documentadas e os requisitos de autenticação de cada operação.

## Autenticação com JWT

Para acessar os endpoints protegidos:

1. Faça login pelo endpoint `POST /api/auth/login`.
2. Copie o token JWT retornado pela API.
3. No Swagger, clique em **Authorize**.
4. Cole somente o token no campo de autenticação Bearer.
5. Confirme a autorização e execute a operação desejada.

O backend verifica o token e consulta o usuário no banco de dados para validar sua situação e seu perfil.

O token de autenticação não deve ser compartilhado ou enviado em repositórios, prints públicos ou documentação com credenciais reais.

## Principais códigos HTTP

| Código | Significado |
|---|---|
| `200 OK` | Operação executada com sucesso |
| `201 Created` | Recurso criado com sucesso |
| `204 No Content` | Operação concluída sem corpo de resposta |
| `400 Bad Request` | Dados inválidos ou requisição malformada |
| `401 Unauthorized` | Token ausente, inválido ou expirado, ou conta inativa |
| `403 Forbidden` | Usuário autenticado sem permissão para a operação |
| `404 Not Found` | Recurso não encontrado |
| `409 Conflict` | Conflito, como nome de usuário duplicado ou instituição inativa |
| `500 Internal Server Error` | Erro interno do servidor |

Os códigos específicos de cada operação devem ser consultados na documentação Swagger.

## Estrutura do projeto

```text
PI-backend/
├── scripts/
│   ├── criarAdminInicial.js
│   └── prepararInstituicaoDev.js
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   ├── docs/
│   │   └── swagger.js
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── app.js
│   └── server.js
├── tests/
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

## Testes

O projeto possui scripts de teste para validar regras dos serviços e modelos, incluindo:

- Validação das senhas e geração de hash.
- Preparação dos dados de usuários e gestores.
- Validação de vínculo com instituições existentes, inexistentes, ativas ou inativas.
- Verificação de autenticação e permissões.

Os testes que utilizam o MongoDB precisam de uma configuração válida de ambiente. Execute somente na base de desenvolvimento destinada a esses testes.

## Estado atual do projeto

O backend está em desenvolvimento incremental. As rotas documentadas representam as funcionalidades atualmente implementadas, mas a API ainda não deve ser considerada finalizada.

Funcionalidades adicionais, como o CRUD completo de instituições, a gestão completa de contas de usuários e a integração final com o frontend, permanecem sujeitas às próximas etapas do Projeto Integrador.

## Equipe

Projeto Integrador — Curso de Análise e Desenvolvimento de Sistemas (ADS), SENAC.