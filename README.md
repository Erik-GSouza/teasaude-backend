# API - Projeto Integrador TEA Saúde

Backend desenvolvido em **Node.js + Express + MongoDB Atlas** para o Projeto Integrador do curso de **Análise e Desenvolvimento de Sistemas - SENAC**.

## Tecnologias

* Node.js
* Express
* MongoDB Atlas
* Mongoose
* Swagger UI

## Como executar o projeto

### 1. Clonar o repositório

```bash
git clone <URL_DO_REPOSITORIO>
cd PI-backend
```

### 2. Instalar as dependências

```bash
npm install
```

### 3. Criar o arquivo `.env`

```env
PORT=3000
MONGO_URI=sua_string_de_conexao_mongodb
```

### 4. Executar o servidor

```bash
npm run dev
```

Servidor disponível em:

* API: http://localhost:3000
* Swagger: http://localhost:3000/api-docs

## Endpoints disponíveis

| Método | Endpoint              | Descrição                |
| ------ | --------------------- | ------------------------ |
| GET    | `/api/pacientes`      | Lista todos os pacientes |
| GET    | `/api/pacientes/{id}` | Busca um paciente por ID |
| POST   | `/api/pacientes`      | Cadastra um paciente     |
| PATCH  | `/api/pacientes/{id}` | Atualiza um paciente     |
| DELETE | `/api/pacientes/{id}` | Remove um paciente       |

## Estrutura do projeto

```text
src/
├── config/
├── controllers/
├── docs/
├── middlewares/
├── models/
├── routes/
├── app.js
└── server.js
```

## Desenvolvido para o Projeto Integrador

Equipe do Projeto Integrador – ADS SENAC.
