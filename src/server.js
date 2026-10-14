
require("dotenv").config();

const app = require("./app");
const conectarBanco = require("./config/database");

const PORT = process.env.PORT || 3000;

async function iniciarServidor() {
  try {
    await conectarBanco();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  } catch (erro) {
    console.error(
      "❌ Não foi possível iniciar a API. Verifique a conexão e a configuração do banco."
    );

    process.exit(1);
  }
}

iniciarServidor();
