const mongoose = require("mongoose");

const Medico = require("../models/Medico");
const Instituicao = require("../models/Instituicao");
const Usuario = require("../models/Usuario");

const {
    prepararDadosUsuario
} = require("../services/usuarioService");


function idValido(id) {
    return mongoose.isValidObjectId(id);
}

function corpoValido(dados) {
    return (
        typeof dados === "object" &&
        dados !== null &&
        !Array.isArray(dados)
    );
}

function escaparRegex(valor) {
    return valor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function validarModalidades(modalidades) {
    if (!Array.isArray(modalidades)) {
        return {
            valido: false
        };
    }

    const valores = [];

    for (const modalidade of modalidades) {
        if (
            typeof modalidade !== "string" ||
            modalidade.trim() === ""
        ) {
            return {
                valido: false
            };
        }

        valores.push(modalidade.trim());
    }

    return {
        valido: true,
        valor: valores
    };
}

function medicoPublico(medico) {
    return {
        _id: medico._id,
        nomeCompleto: medico.nomeCompleto,
        especialidade: medico.especialidade,
        instituicaoId: medico.instituicaoId,
        modalidades: medico.modalidades || [],
        orientacoesDocumentos:
            medico.orientacoesDocumentos || "",
        ativo: medico.ativo,
        createdAt: medico.createdAt,
        updatedAt: medico.updatedAt
    };
}

async function listarMedicos(req, res) {
    try {
        const perfil = req.usuario.perfil;

        const instituicoesAtivas = await Instituicao.find({
            ativo: true
        })
            .select("_id")
            .lean();

        const idsInstituicoesAtivas = instituicoesAtivas.map(
            instituicao => instituicao._id
        );

        const filtro = {
            ativo: true,
            instituicaoId: {
                $in: idsInstituicoesAtivas
            }
        };

        if (perfil === "gestor") {
            const instituicaoId = req.usuario.instituicaoId;

            if (!instituicaoId) {
                return res.status(409).json({
                    message:
                        "A conta Gestor não possui uma instituição vinculada."
                });
            }

            const possuiInstituicaoAtiva =
                idsInstituicoesAtivas.some(
                    id => String(id) === String(instituicaoId)
                );

            if (!possuiInstituicaoAtiva) {
                return res.status(409).json({
                    message:
                        "A instituição do Gestor não está ativa ou não foi encontrada."
                });
            }

            filtro.instituicaoId = instituicaoId;
        }

        const { instituicaoId, especialidade } = req.query;

        if (instituicaoId) {
            if (!idValido(instituicaoId)) {
                return res.status(400).json({
                    message: "ID da instituição inválido."
                });
            }

            if (
                perfil === "gestor" &&
                String(instituicaoId) !==
                    String(req.usuario.instituicaoId)
            ) {
                return res.status(403).json({
                    message:
                        "Você não pode consultar médicos de outra instituição."
                });
            }

            filtro.instituicaoId = instituicaoId;
        }

        if (especialidade !== undefined) {
            if (
                typeof especialidade !== "string" ||
                especialidade.trim() === ""
            ) {
                return res.status(400).json({
                    message: "Informe uma especialidade válida."
                });
            }

            filtro.especialidade = {
                $regex: escaparRegex(especialidade.trim()),
                $options: "i"
            };
        }

        const medicos = await Medico.find(filtro)
            .select(
                "_id nomeCompleto especialidade instituicaoId modalidades orientacoesDocumentos ativo createdAt updatedAt"
            )
            .populate({
                path: "instituicaoId",
                select: "nomePublico"
            })
            .sort({
                nomeCompleto: 1
            })
            .lean();

        return res.status(200).json({
            quantidade: medicos.length,
            medicos
        });

    } catch (erro) {
        console.error("Erro ao listar médicos.");

        return res.status(500).json({
            message: "Não foi possível listar os médicos."
        });
    }
}

async function buscarMedicoPorId(req, res) {
    const { id } = req.params;

    if (!idValido(id)) {
        return res.status(400).json({
            message: "ID do médico inválido."
        });
    }

    try {
        const medico = await Medico.findById(id)
            .select(
                "_id nomeCompleto especialidade instituicaoId modalidades orientacoesDocumentos ativo createdAt updatedAt"
            )
            .populate({
                path: "instituicaoId",
                select: "nomePublico ativo"
            })
            .lean();

        if (!medico) {
            return res.status(404).json({
                message: "Médico não encontrado."
            });
        }

        const perfil = req.usuario.perfil;
        const instituicao = medico.instituicaoId;

        if (!instituicao) {
            return res.status(404).json({
                message: "Instituição do médico não encontrada."
            });
        }

        if (
            perfil === "responsavel" &&
            (!medico.ativo || !instituicao.ativo)
        ) {
            return res.status(404).json({
                message: "Médico não encontrado ou indisponível."
            });
        }

        if (perfil === "gestor") {
            if (
                String(instituicao._id) !==
                String(req.usuario.instituicaoId)
            ) {
                return res.status(403).json({
                    message:
                        "Você não possui acesso aos dados deste médico."
                });
            }
        }

        return res.status(200).json({
            message: "Médico encontrado com sucesso.",
            medico
        });

    } catch (erro) {
        console.error("Erro ao consultar médico.");

        return res.status(500).json({
            message: "Não foi possível consultar o médico."
        });
    }
}


async function criarMedico(req, res) {
    const dados = req.body ?? {};
    const perfil = req.usuario.perfil;

    if (!corpoValido(dados)) {
        return res.status(400).json({
            message: "Envie um objeto JSON válido."
        });
    }

    const camposPermitidos =
        perfil === "admin"
            ? [
                "nomeCompleto",
                "especialidade",
                "instituicaoId",
                "modalidades",
                "orientacoesDocumentos"
            ]
            : [
                "nomeCompleto",
                "especialidade",
                "modalidades",
                "orientacoesDocumentos"
            ];

    if (
        Object.keys(dados).some(
            campo => !camposPermitidos.includes(campo)
        )
    ) {
        return res.status(400).json({
            message: "O cadastro contém campos não permitidos."
        });
    }

    if (
        typeof dados.nomeCompleto !== "string" ||
        dados.nomeCompleto.trim().length < 3 ||
        typeof dados.especialidade !== "string" ||
        dados.especialidade.trim().length < 3
    ) {
        return res.status(400).json({
            message:
                "Informe o nome completo e a especialidade do médico."
        });
    }

    if (
        dados.orientacoesDocumentos !== undefined &&
        typeof dados.orientacoesDocumentos !== "string"
    ) {
        return res.status(400).json({
            message:
                "As orientações sobre documentos devem ser informadas como texto."
        });
    }

    let modalidades = [];

    if (dados.modalidades !== undefined) {
        const validacao = validarModalidades(dados.modalidades);

        if (!validacao.valido) {
            return res.status(400).json({
                message:
                    "Modalidades deve ser uma lista de textos válidos."
            });
        }

        modalidades = validacao.valor;
    }

    let instituicaoId;

    if (perfil === "gestor") {
        instituicaoId = req.usuario.instituicaoId;

        if (!instituicaoId) {
            return res.status(409).json({
                message:
                    "A conta Gestor não possui instituição vinculada."
            });
        }
    } else {
        if (
            typeof dados.instituicaoId !== "string" ||
            !idValido(dados.instituicaoId)
        ) {
            return res.status(400).json({
                message: "Informe um ID de instituição válido."
            });
        }

        instituicaoId = dados.instituicaoId;
    }

    try {
        const instituicao = await Instituicao.findById(
            instituicaoId
        );

        if (!instituicao) {
            return res.status(404).json({
                message: "Instituição não encontrada."
            });
        }

        if (!instituicao.ativo) {
            return res.status(409).json({
                message: "A instituição está inativa."
            });
        }

        const medico = await Medico.create({
            nomeCompleto: dados.nomeCompleto.trim(),
            especialidade: dados.especialidade.trim(),
            instituicaoId: instituicao._id,
            modalidades,
            orientacoesDocumentos:
                dados.orientacoesDocumentos
                    ? dados.orientacoesDocumentos.trim()
                    : "",
            ativo: true
        });

        await medico.populate({
            path: "instituicaoId",
            select: "nomePublico"
        });

        return res.status(201).json({
            message: "Médico cadastrado com sucesso.",
            medico
        });

    } catch (erro) {
        if (
            erro.name === "ValidationError" ||
            erro.name === "CastError"
        ) {
            return res.status(400).json({
                message: erro.message
            });
        }

        console.error("Erro ao cadastrar médico.");

        return res.status(500).json({
            message: "Não foi possível cadastrar o médico."
        });
    }
}

async function atualizarMedico(req, res) {
    const { id } = req.params;
    const dados = req.body ?? {};

    if (!idValido(id)) {
        return res.status(400).json({
            message: "ID do médico inválido."
        });
    }

    if (!corpoValido(dados)) {
        return res.status(400).json({
            message: "Envie um objeto JSON válido."
        });
    }

    const camposPermitidos = [
        "nomeCompleto",
        "especialidade",
        "modalidades",
        "orientacoesDocumentos",
        "ativo"
    ];

    const camposRecebidos = Object.keys(dados);

    if (
        camposRecebidos.length === 0 ||
        camposRecebidos.some(
            campo => !camposPermitidos.includes(campo)
        )
    ) {
        return res.status(400).json({
            message: "Informe somente os campos permitidos."
        });
    }

    try {
        const medico = await Medico.findById(id);

        if (!medico) {
            return res.status(404).json({
                message: "Médico não encontrado."
            });
        }

        if (req.usuario.perfil === "gestor") {
            if (
                String(medico.instituicaoId) !==
                String(req.usuario.instituicaoId)
            ) {
                return res.status(403).json({
                    message:
                        "Você não pode alterar médicos de outra instituição."
                });
            }
        }

        if (dados.nomeCompleto !== undefined) {
            if (
                typeof dados.nomeCompleto !== "string" ||
                dados.nomeCompleto.trim().length < 3
            ) {
                return res.status(400).json({
                    message: "O nome deve ter pelo menos 3 caracteres."
                });
            }

            medico.nomeCompleto = dados.nomeCompleto.trim();
        }

        if (dados.especialidade !== undefined) {
            if (
                typeof dados.especialidade !== "string" ||
                dados.especialidade.trim().length < 3
            ) {
                return res.status(400).json({
                    message:
                        "A especialidade deve ter pelo menos 3 caracteres."
                });
            }

            medico.especialidade = dados.especialidade.trim();
        }

        if (dados.modalidades !== undefined) {
            const validacao = validarModalidades(
                dados.modalidades
            );

            if (!validacao.valido) {
                return res.status(400).json({
                    message:
                        "Modalidades deve ser uma lista de textos válidos."
                });
            }

            medico.modalidades = validacao.valor;
        }

        if (dados.orientacoesDocumentos !== undefined) {
            if (
                typeof dados.orientacoesDocumentos !== "string"
            ) {
                return res.status(400).json({
                    message:
                        "As orientações sobre documentos devem ser um texto."
                });
            }

            medico.orientacoesDocumentos =
                dados.orientacoesDocumentos.trim();
        }

        if (dados.ativo !== undefined) {
            if (typeof dados.ativo !== "boolean") {
                return res.status(400).json({
                    message: "O campo ativo deve ser booleano."
                });
            }

            if (dados.ativo === true) {
                const instituicao = await Instituicao.findById(
                    medico.instituicaoId
                );

                if (!instituicao || !instituicao.ativo) {
                    return res.status(409).json({
                        message:
                            "Não é possível ativar um médico vinculado a uma instituição inativa."
                    });
                }
            }

            medico.ativo = dados.ativo;
        }

        await medico.save();

        await medico.populate({
            path: "instituicaoId",
            select: "nomePublico"
        });

        return res.status(200).json({
            message: "Médico atualizado com sucesso.",
            medico
        });

    } catch (erro) {
        if (
            erro.name === "ValidationError" ||
            erro.name === "CastError"
        ) {
            return res.status(400).json({
                message: erro.message
            });
        }

        console.error("Erro ao atualizar médico.");

        return res.status(500).json({
            message: "Não foi possível atualizar o médico."
        });
    }
}


async function criarContaMedico(req, res) {
    const { id } = req.params;
    const dados = req.body ?? {};

    if (!idValido(id)) {
        return res.status(400).json({
            message: "ID do médico inválido."
        });
    }

    if (!corpoValido(dados)) {
        return res.status(400).json({
            message: "Envie um objeto JSON válido."
        });
    }

    const camposPermitidos = [
        "nomeUsuario",
        "senha"
    ];

    if (
        Object.keys(dados).length !== 2 ||
        Object.keys(dados).some(
            campo => !camposPermitidos.includes(campo)
        )
    ) {
        return res.status(400).json({
            message:
                "Informe somente nomeUsuario e senha."
        });
    }

    let session;

    try {
        const medicoExistente = await Medico.findById(id);

        if (!medicoExistente) {
            return res.status(404).json({
                message: "Médico não encontrado."
            });
        }

        if (!medicoExistente.ativo) {
            return res.status(409).json({
                message:
                    "Não é possível criar uma conta para um médico inativo."
            });
        }

        if (medicoExistente.usuarioId) {
            return res.status(409).json({
                message:
                    "Este médico já possui uma conta de acesso."
            });
        }

        const instituicao = await Instituicao.findById(
            medicoExistente.instituicaoId
        );

        if (!instituicao || !instituicao.ativo) {
            return res.status(409).json({
                message:
                    "A instituição do médico não está ativa."
            });
        }

        const dadosAcesso = await prepararDadosUsuario({
            nomeUsuario: dados.nomeUsuario,
            senha: dados.senha
        });

        session = await mongoose.startSession();

        let usuarioCriado;
        let medicoAtualizado;

        await session.withTransaction(async () => {
            medicoAtualizado = await Medico.findById(id)
                .session(session);

            if (!medicoAtualizado) {
                throw new Error("Médico não encontrado.");
            }

            if (medicoAtualizado.usuarioId) {
                throw new Error(
                    "Este médico já possui uma conta de acesso."
                );
            }

            const usuarios = await Usuario.create(
                [
                    {
                        ...dadosAcesso,
                        perfil: "medico",
                        instituicaoId: null,
                        ativo: true
                    }
                ],
                { session }
            );

            usuarioCriado = usuarios[0];

            medicoAtualizado.usuarioId = usuarioCriado._id;

            await medicoAtualizado.save({
                session
            });
        });

        return res.status(201).json({
            message:
                "Conta de acesso criada e vinculada ao médico com sucesso.",

            usuario: {
                _id: usuarioCriado._id,
                nomeUsuario: usuarioCriado.nomeUsuario,
                perfil: usuarioCriado.perfil,
                ativo: usuarioCriado.ativo
            },

            medico: {
                _id: medicoAtualizado._id,
                nomeCompleto: medicoAtualizado.nomeCompleto,
                especialidade: medicoAtualizado.especialidade,
                usuarioId: usuarioCriado._id
            }
        });

    } catch (erro) {
        if (erro.code === 11000) {
            return res.status(409).json({
                message:
                    "O nome de usuário já está cadastrado ou este médico já possui uma conta."
            });
        }

        if (
            erro.name === "ValidationError" ||
            erro.name === "CastError" ||
            erro.statusCode === 400 ||
            [
                "O nome de usuário é obrigatório.",
                "A senha deve ser informada como texto.",
                "A senha deve ter pelo menos 8 caracteres.",
                "A senha não pode ultrapassar 72 bytes em UTF-8.",
                "Este médico já possui uma conta de acesso.",
                "Médico não encontrado."
            ].includes(erro.message)
        ) {
            return res.status(400).json({
                message: erro.message
            });
        }

        console.error("Erro ao criar conta de médico.");

        return res.status(500).json({
            message:
                "Não foi possível criar a conta de acesso do médico."
        });

    } finally {
        if (session) {
            await session.endSession();
        }
    }
}

module.exports = {
    listarMedicos,
    buscarMedicoPorId,
    criarMedico,
    atualizarMedico,
    criarContaMedico
};