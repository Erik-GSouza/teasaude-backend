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

async function listarGestores(req, res) {
    const filtro = {
        perfil: "gestor"
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
        const gestores = await Usuario.find(filtro)
            .select(
                "_id nomeUsuario perfil instituicaoId ativo createdAt updatedAt"
            )
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            quantidade: gestores.length,
            gestores
        });
    } catch (erro) {
        console.error("Erro ao listar gestores.");

        return res.status(500).json({
            message: "Não foi possível listar os gestores."
        });
    }
}


async function obterGestorPorId(req, res) {
    const { id } = req.params;


    if (!/^[a-f\d]{24}$/i.test(id)) {
        return res.status(400).json({
            message: "ID do gestor inválido."
        });
    }

    try {

        const gestor = await Usuario.findOne({
            _id: id,
            perfil: "gestor"
        })
            .select(
                "_id nomeUsuario perfil instituicaoId ativo createdAt updatedAt"
            )
            .lean();

        if (!gestor) {
            return res.status(404).json({
                message: "Gestor não encontrado."
            });
        }

        return res.status(200).json({
            usuario: usuarioPublico(gestor)
        });
    } catch (erro) {
        console.error("Erro ao consultar gestor por ID.");

        return res.status(500).json({
            message: "Não foi possível consultar o gestor."
        });
    }
}


async function atualizarGestor(req, res) {
    const { id } = req.params;
    const dados = req.body;

    if (!/^[a-f\d]{24}$/i.test(id)) {
        return res.status(400).json({
            message: "ID do gestor inválido."
        });
    }

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
        "instituicaoId",
        "ativo"
    ];

    const camposRecebidos = Object.keys(dados);

    if (camposRecebidos.length === 0) {
        return res.status(400).json({
            message: "Informe pelo menos um campo para atualizar."
        });
    }

    if (
        camposRecebidos.some(
            campo => !camposPermitidos.includes(campo)
        )
    ) {
        return res.status(400).json({
            message: "A atualização contém campos não permitidos."
        });
    }

    const atualizacoes = {};

    if (Object.hasOwn(dados, "nomeUsuario")) {
        if (
            typeof dados.nomeUsuario !== "string" ||
            dados.nomeUsuario.trim() === ""
        ) {
            return res.status(400).json({
                message: "O nome de usuário é obrigatório."
            });
        }

        atualizacoes.nomeUsuario =
            dados.nomeUsuario.trim().toLowerCase();
    }

    if (Object.hasOwn(dados, "instituicaoId")) {
        if (
            typeof dados.instituicaoId !== "string" ||
            dados.instituicaoId.trim() === ""
        ) {
            return res.status(400).json({
                message: "Informe um ID de instituição válido."
            });
        }

        try {
            const {
                buscarInstituicaoParaVinculo
            } = require("../services/instituicaoService");

            const instituicao = await buscarInstituicaoParaVinculo(
                dados.instituicaoId
            );

            atualizacoes.instituicaoId = instituicao._id;
        } catch (erro) {
            if (erro.statusCode === 400) {
                return res.status(400).json({
                    message: "ID da instituição inválido."
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

            console.error("Erro ao validar instituição do gestor.");

            return res.status(500).json({
                message: "Não foi possível atualizar o gestor."
            });
        }
    }

    if (Object.hasOwn(dados, "ativo")) {
        if (typeof dados.ativo !== "boolean") {
            return res.status(400).json({
                message: "O campo ativo deve ser booleano."
            });
        }

        atualizacoes.ativo = dados.ativo;
    }

    try {
        const gestor = await Usuario.findOneAndUpdate(
            { _id: id, perfil: "gestor" },
            { $set: atualizacoes },
            {
                returnDocument: "after",
                runValidators: true
            }
        ).select(
            "_id nomeUsuario perfil instituicaoId ativo createdAt updatedAt"
        );

        if (!gestor) {
            return res.status(404).json({
                message: "Gestor não encontrado."
            });
        }

        return res.status(200).json({
            message: "Conta Gestor atualizada com sucesso.",
            usuario: usuarioPublico(gestor)
        });
    } catch (erro) {
        if (erro.code === 11000) {
            return res.status(409).json({
                message: "Esse nome de usuário já está cadastrado."
            });
        }

        if (erro.name === "ValidationError") {
            return res.status(400).json({
                message: "Os dados informados são inválidos."
            });
        }

        console.error("Erro ao atualizar conta Gestor.");

        return res.status(500).json({
            message: "Não foi possível atualizar o gestor."
        });
    }
}

async function desativarGestor(req, res) {
    const { id } = req.params;

    if (!/^[a-f\d]{24}$/i.test(id)) {
        return res.status(400).json({
            message: "ID do gestor inválido."
        });
    }

    try {
        const gestor = await Usuario.findOne({
            _id: id,
            perfil: "gestor"
        });

        if (!gestor) {
            return res.status(404).json({
                message: "Gestor não encontrado."
            });
        }

        if (!gestor.ativo) {
            return res.status(200).json({
                message: "A conta Gestor já estava desativada.",
                usuario: usuarioPublico(gestor)
            });
        }

        gestor.ativo = false;
        await gestor.save();

        return res.status(200).json({
            message: "Conta Gestor desativada com sucesso.",
            usuario: usuarioPublico(gestor)
        });

    } catch (erro) {
        console.error("Erro ao desativar Gestor:", erro);

        return res.status(500).json({
            message: "Não foi possível desativar a conta Gestor."
        });
    }
}


module.exports = {
    criarGestor,
    listarGestores,
    obterGestorPorId,
    atualizarGestor,
    desativarGestor
};