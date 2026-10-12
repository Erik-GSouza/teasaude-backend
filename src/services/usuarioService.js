
const bcrypt = require("bcryptjs");
const {
  buscarInstituicaoParaVinculo
} = require("./instituicaoService");

function validarSenha(senha) {
    if (typeof senha !== "string") {
        throw new Error("A senha deve ser informada como texto.");
    }

    const quantidadeCaracteres = Array.from(senha).length;

    if (quantidadeCaracteres < 8) {
        throw new Error("A senha deve ter pelo menos 8 caracteres.");
    }

    const quantidadeBytes = Buffer.byteLength(senha, "utf8");

    if (quantidadeBytes > 72) {
        throw new Error(
            "A senha não pode ultrapassar 72 bytes em UTF-8."
        );
    }

    return true;
}

async function gerarSenhaHash(senha) {
    validarSenha(senha);

    const senhaHash = await bcrypt.hash(senha, 10);

    return senhaHash;
}

async function prepararDadosUsuario({ nomeUsuario, senha }) {
  if (typeof nomeUsuario !== "string") {
    throw new Error("O nome de usuário é obrigatório.");
  }

  const nomeNormalizado = nomeUsuario.trim().toLowerCase();

  if (nomeNormalizado === "") {
    throw new Error("O nome de usuário é obrigatório.");
  }

  const senhaHash = await gerarSenhaHash(senha);

  return {
    nomeUsuario: nomeNormalizado,
    senhaHash
  };
}


async function prepararDadosGestor({
  nomeUsuario,
  senha,
  instituicaoId
}) {
  if (
    typeof nomeUsuario !== "string" ||
    nomeUsuario.trim() === ""
  ) {
    throw new Error("O nome de usuário é obrigatório.");
  }

  const instituicao = await buscarInstituicaoParaVinculo(
    instituicaoId
  );

  const dadosUsuario = await prepararDadosUsuario({
    nomeUsuario,
    senha
  });

  return {
    ...dadosUsuario,
    perfil: "gestor",
    instituicaoId: instituicao._id,
    ativo: true
  };
}


module.exports = {
    validarSenha,
    gerarSenhaHash,
    prepararDadosUsuario,
    prepararDadosGestor
};