require("dotenv").config();

const app = require("./app");
const conectarBanco = require("./config/database");

const PORT = process.env.PORT || 3000;

async function iniciarServidor() {
    try {await conectarBanco();
        app.listen(PORT, () => {
            console.log(`Servidor rodando na porta ${PORT}`);
        });

    } catch (erro) {  console.error("Servidor não iniciado: falha na conexão com o banco");
        process.exit(1);
    }
}

iniciarServidor();