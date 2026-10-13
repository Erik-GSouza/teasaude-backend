const mongoose = require("mongoose");
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

async function obterAdminPorId(req, res) {
    const { id } = req.params;

    if (!/^[a-f\d]{24}$/i.test(id)) {
        return res.status(400).json({
            message: "ID do administrador inválido."
        });
    }

    try {
    
        const admin = await Usuario.findOne({
            _id: id,
            perfil: "admin"
        })
            .select(
                "_id nomeUsuario perfil instituicaoId ativo createdAt updatedAt"
            )
            .lean();


        if (!admin) {
            return res.status(404).json({
                message: "Administrador não encontrado."
            });
        }

        return res.status(200).json({
            usuario: admin
        });

    } catch (erro) {
        console.error("Erro ao consultar administrador.");

        return res.status(500).json({
            message: "Não foi possível consultar o administrador."
        });
    }
}

async function atualizarAdmin(req, res) {
    const { id } = req.params;
    const dados = req.body;

    if (!/^[a-f\d]{24}$/i.test(id)) {
        return res.status(400).json({
            message: "ID do administrador inválido."
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

    const camposPermitidos = ["nomeUsuario", "ativo"];
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

    if (Object.hasOwn(dados, "ativo")) {
        if (typeof dados.ativo !== "boolean") {
            return res.status(400).json({
                message: "O campo ativo deve ser booleano."
            });
        }

        atualizacoes.ativo = dados.ativo;
    }

    if (
        atualizacoes.ativo === false &&
        String(req.usuario._id).toLowerCase() === id.toLowerCase()
    ) {
        return res.status(409).json({
            message: "Você não pode desativar sua própria conta."
        });
    }

    let session;

    try {
        let adminAtualizado;
        let jaEstavaDesativado = false;

        if (atualizacoes.ativo === false) {
        
            session = await mongoose.startSession();

            await session.withTransaction(async () => {
            
                const trava = await Usuario.findOne({
                    perfil: "admin"
                })
                    .sort({ _id: 1 })
                    .select("_id")
                    .session(session);

                if (!trava) {
                    const erro = new Error(
                        "Não foi possível verificar os administradores."
                    );
                    erro.statusCode = 409;
                    throw erro;
                }


                await Usuario.updateOne(
                    { _id: trava._id },
                    { $inc: { __v: 1 } },
                    { session }
                );

                const adminAtual = await Usuario.findOne({
                    _id: id,
                    perfil: "admin"
                }).session(session);

                if (!adminAtual) {
                    const erro = new Error(
                        "Administrador não encontrado."
                    );
                    erro.statusCode = 404;
                    throw erro;
                }

                if (
                    !adminAtual.ativo &&
                    camposRecebidos.length === 1 &&
                    camposRecebidos[0] === "ativo"
                ) {
                    adminAtualizado = adminAtual;
                    jaEstavaDesativado = true;
                    return;
                }

              
                if (adminAtual.ativo) {
                    const quantidadeAtivos =
                        await Usuario.countDocuments({
                            perfil: "admin",
                            ativo: true
                        }).session(session);

                    if (quantidadeAtivos <= 1) {
                        const erro = new Error(
                            "Não é possível desativar o último administrador ativo."
                        );
                        erro.statusCode = 409;
                        throw erro;
                    }
                }

                adminAtualizado = await Usuario.findOneAndUpdate(
                    { _id: id, perfil: "admin" },
                    { $set: atualizacoes },
                    {
                        returnDocument: "after",
                        runValidators: true,
                        session
                    }
                ).select(
                    "_id nomeUsuario perfil instituicaoId ativo createdAt updatedAt"
                );
            });
        } else {
           
            adminAtualizado = await Usuario.findOneAndUpdate(
                { _id: id, perfil: "admin" },
                { $set: atualizacoes },
                {
                    returnDocument: "after",
                    runValidators: true
                }
            ).select(
                "_id nomeUsuario perfil instituicaoId ativo createdAt updatedAt"
            );
        }

        if (!adminAtualizado) {
            return res.status(404).json({
                message: "Administrador não encontrado."
            });
        }

        return res.status(200).json({
            message: jaEstavaDesativado
                ? "A conta Admin já estava desativada."
                : "Conta Admin atualizada com sucesso.",
            usuario: usuarioPublico(adminAtualizado)
        });

    } catch (erro) {
        if (erro.code === 11000) {
            return res.status(409).json({
                message: "Esse nome de usuário já está cadastrado."
            });
        }

        if (erro.statusCode) {
            return res.status(erro.statusCode).json({
                message: erro.message
            });
        }

        if (
            erro.name === "ValidationError" ||
            erro.name === "CastError"
        ) {
            return res.status(400).json({
                message: "Os dados informados são inválidos."
            });
        }

        console.error("Erro ao atualizar administrador.");

        return res.status(500).json({
            message: "Não foi possível atualizar o administrador."
        });

    } finally {
        if (session) {
            await session.endSession();
        }
    }
}
module.exports = {
    criarAdmin,
    listarAdmins,
    obterAdminPorId,
    atualizarAdmin
};
