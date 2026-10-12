
require("dotenv").config();

const mongoose = require("mongoose");
const conectarBanco = require("../src/config/database");
const Usuario = require("../src/models/Usuario");

const {
  prepararDadosUsuario
} = require("../src/services/usuarioService");

async function criarAdminInicial() {
  let conectado = false;

  try {
    const nomeUsuario = process.env.ADMIN_INICIAL_NOME_USUARIO;
    const senha = process.env.ADMIN_INICIAL_SENHA;

    if (!nomeUsuario || !senha) {
      throw new Error(
        "Defina ADMIN_INICIAL_NOME_USUARIO e ADMIN_INICIAL_SENHA no .env local."
      );
    }

    await conectarBanco();
    conectado = true;

    const adminExistente = await Usuario.exists({
      perfil: "admin"
    });

    if (adminExistente) {
      throw new Error(
        "Já existe uma conta Admin. Verifique o cadastro antes de continuar."
      );
    }

    const dadosUsuario = await prepararDadosUsuario({
      nomeUsuario,
      senha
    });

    const admin = await Usuario.create({
      ...dadosUsuario,
      perfil: "admin",
      instituicaoId: null,
      ativo: true
    });

    console.log("✅ Conta Admin inicial criada.");
    console.log("ID:", admin._id.toString());
    console.log("Nome de usuário:", admin.nomeUsuario);
    console.log("Perfil:", admin.perfil);
    console.log("Ativo:", admin.ativo);
    console.log("A senha original não foi exibida.");

  } catch (erro) {
    console.error("Não foi possível criar o Admin inicial.");
    console.error("Motivo:", erro.message);
    process.exitCode = 1;

  } finally {
    if (conectado) {
      await mongoose.disconnect();
      console.log("Conexão com o banco encerrada.");
    }
  }
}

criarAdminInicial();
