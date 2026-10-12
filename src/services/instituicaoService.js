
const Instituicao = require("../models/Instituicao");

async function buscarInstituicaoParaVinculo(id) {
  if (typeof id !== "string" || !/^[a-f\d]{24}$/i.test(id)) {
    const erro = new Error("ID da instituição inválido.");
    erro.statusCode = 400;
    throw erro;
  }


  const instituicao = await Instituicao.findById(id);

  if (!instituicao) {
    const erro = new Error("Instituição não encontrada.");
    erro.statusCode = 404;
    throw erro;
  }

  if (!instituicao.ativo) {
    const erro = new Error("A instituição está inativa.");
    erro.statusCode = 409;
    throw erro;
  }

  return instituicao;
}

module.exports = {
  buscarInstituicaoParaVinculo
};
