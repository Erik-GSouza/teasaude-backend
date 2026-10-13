const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./docs/swagger");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const gestorRoutes = require("./routes/gestorRoutes");
const agendamentoRoutes = require("./routes/agendamentoRoutes");
const medicoRoutes = require("./routes/medicoRoutes");
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

app.use("/api/auth", authRoutes);
app.use("/api/admins", adminRoutes);
app.use("/api/gestores", gestorRoutes);
app.use("/api/pacientes", pacienteRoutes);
app.use("/api/agendamentos", agendamentoRoutes);
app.use("/api/medicos", medicoRoutes);

module.exports = app;