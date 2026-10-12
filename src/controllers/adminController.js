
const Usuario = require("../models/Usuario");
const {
    prepararDadosUsuario
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

async function criarAdmin(req, res) {
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

    const camposPermitidos = ["nomeUsuario", "senha"];
    const camposRecebidos = Object.keys(dados);

    if (camposRecebidos.some(
        campo => !camposPermitidos.includes(campo)
    )) {
        return res.status(400).json({
            message: "O cadastro contém campos não permitidos."
        });
    }

    if (
        typeof dados.nomeUsuario !== "string" ||
        dados.nomeUsuario.trim() === "" ||
        typeof dados.senha !== "string" ||
        dados.senha === ""
    ) {
        return res.status(400).json({
            message: "Informe nomeUsuario e senha."
        });
    }

    try {
        const dadosUsuario = await prepararDadosUsuario({
            nomeUsuario: dados.nomeUsuario,
            senha: dados.senha
        });

        const admin = await Usuario.create({
            ...dadosUsuario,
            perfil: "admin",
            instituicaoId: null,
            ativo: true
        });

        return res.status(201).json({
            message: "Conta Admin criada com sucesso.",
            usuario: usuarioPublico(admin)
        });
    } catch (erro) {
        if (erro.code === 11000) {
            return res.status(409).json({
                message: "Esse nome de usuário já está cadastrado."
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

        console.error("Erro ao criar conta Admin.");

        return res.status(500).json({
            message: "Não foi possível criar a conta Admin."
        });
    }
}

async function listarAdmins(req, res) {
    const filtro = {
        perfil: "admin"
    };

    if (req.query.ativo !== undefined) {
        if (
            typeof req.query.ativo !== "string" ||
            !["true", "false"].includes(req.query.ativo)
        ) {
            return res.status(400).json({
                message: "O filtro ativo deve ser true ou false."
            });
        }

        filtro.ativo = req.query.ativo === "true";
    }

    try {
        const admins = await Usuario.find(filtro)
            .select(
                "_id nomeUsuario perfil instituicaoId ativo createdAt updatedAt"
            )
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            quantidade: admins.length,
            admins
        });
    } catch (erro) {
        console.error("Erro ao listar administradores.");

        return res.status(500).json({
            message: "Não foi possível listar os administradores."
        });
    }
}

module.exports = {
    criarAdmin,
    listarAdmins
};

