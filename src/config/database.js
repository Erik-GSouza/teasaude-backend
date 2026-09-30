const mongoose = require("mongoose");

async function conectarBanco() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ Banco conectado:", mongoose.connection.name);

  } catch (erro) {
    console.error("Erro ao conectar:", erro.message);
    throw erro;
  }
}

module.exports = conectarBanco;