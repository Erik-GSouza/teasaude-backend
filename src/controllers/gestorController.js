
const Usuario = require("../models/Usuario");

const {
    prepararDadosGestor
} = require("../services/usuarioService");

function usuarioPublico(usuario) {
    return {
        _id: usuario._id,
        nomeUsuario: usuario.nomeUsuario,
        perfil: usuario.perfil,
        instituicaoId: usuario.instituicaoId,
        ativo: usuario.ativo,
        createdAt: usuario.createdAt,
        updatedAt: usuario.updatedAt
    };
}

async function criarGestor(req, res) {
    const dados = req.body;

    if (
        !dados ||
        typeof dados !== "object" ||
        Array.isArray(dados)
    ) {
        return res.status(400).json({
            message: "Envie um objeto JSON válido."
        });
    }

    const camposPermitidos = [
        "nomeUsuario",
        "senha",
        "instituicaoId"
    ];

    const camposRecebidos = Object.keys(dados);

    if (
        camposRecebidos.some(
            campo => !camposPermitidos.includes(campo)
        )
    ) {
        return res.status(400).json({
            message: "O cadastro contém campos não permitidos."
        });
    }

    if (
        typeof dados.nomeUsuario !== "string" ||
        dados.nomeUsuario.trim() === "" ||
        typeof dados.senha !== "string" ||
        dados.senha === "" ||
        typeof dados.instituicaoId !== "string" ||
        dados.instituicaoId.trim() === ""
    ) {
        return res.status(400).json({
            message:
                "Informe nomeUsuario, senha e instituicaoId."
        });
    }

    try {

        const dadosUsuario = await prepararDadosGestor({
            nomeUsuario: dados.nomeUsuario,
            senha: dados.senha,
            instituicaoId: dados.instituicaoId
        });

        const gestor = await Usuario.create(dadosUsuario);

        return res.status(201).json({
            message: "Conta Gestor criada com sucesso.",
            usuario: usuarioPublico(gestor)
        });
    } catch (erro) {
        if (erro.code === 11000) {
            return res.status(409).json({
                message:
                    "Esse nome de usuário já está cadastrado."
            });
        }

        if (erro.statusCode === 404) {
            return res.status(404).json({
                message: "Instituição não encontrada."
            });
        }

        if (erro.statusCode === 409) {
            return res.status(409).json({
                message: "A instituição está inativa."
            });
        }

        if (
            erro.name === "ValidationError" ||
            erro.statusCode === 400 ||
            [
                "O nome de usuário é obrigatório.",
                "A senha deve ser informada como texto.",
                "A senha deve ter pelo menos 8 caracteres.",
                "A senha não pode ultrapassar 72 bytes em UTF-8."
            ].includes(erro.message)
        ) {
            return res.status(400).json({
                message: erro.message
            });
        }

        console.error("Erro ao criar conta Gestor.");

        return res.status(500).json({
            message: "Não foi possível criar a conta Gestor."
        });
    }
}

module.exports = {
    criarGestor
};
