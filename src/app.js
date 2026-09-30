const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./docs/swagger");

const pacienteRoutes = require("./routes/pacienteRoutes");

const app = express();

app.use(cors());

app.use(express.json());

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

app.get("/", (req, res) => {
    res.json({
        status: "API do Projeto Integrador funcionando!"
    });
});


app.use("/api/pacientes", pacienteRoutes);

app.use((req, res) => {
  return res.status(404).json({success: false, message: "Rota não encontrada"});
});

app.use((erro, req, res, next) => {
  if (erro instanceof SyntaxError && erro.status === 400 && "body" in erro) {
    return res.status(400).json({success: false, message: "JSON inválido"});
  }

  console.error("Erro não tratado:", erro);

  return res.status(500).json({success: false, message: "Erro interno do servidor"});
});

module.exports = app;