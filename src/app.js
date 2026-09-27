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

module.exports = app;