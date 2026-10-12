
require("dotenv").config();

const mongoose = require("mongoose");
const conectarBanco = require("../src/config/database");
const Instituicao = require("../src/models/Instituicao");

const NOME_INSTITUICAO_DEV = "Clínica de Desenvolvimento Teste TeaSaúde";

async function prepararInstituicaoDev() {
  try {
    await conectarBanco();

    let instituicao = await Instituicao.findOne({
      nomePublico: NOME_INSTITUICAO_DEV
    });

    if (instituicao) {
      if (!instituicao.ativo) {
        throw new Error(
          "A instituição de desenvolvimento existe, mas está inativa. Verifique o registro antes de continuar."
        );
      }

      console.log("Instituição de desenvolvimento já existe e está ativa.");
    } else {
      instituicao = await Instituicao.create({
        nomePublico: NOME_INSTITUICAO_DEV,
        ativo: true
      });

      console.log("Instituição de desenvolvimento criada com sucesso.");
    }

    console.log("ID da instituição:", instituicao._id.toString());
    console.log("Nome:", instituicao.nomePublico);
    console.log("Ativa:", instituicao.ativo);

  } catch (erro) {
    console.error("Não foi possível preparar a instituição de desenvolvimento.");
    console.error("Detalhes:", erro.message);
    process.exitCode = 1;

  } finally {
    await mongoose.disconnect();
    console.log("Conexão com o banco encerrada.");
  }
}

prepararInstituicaoDev();
