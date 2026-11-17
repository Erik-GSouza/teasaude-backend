
const mongoose = require("mongoose");

const Disponibilidade = require("../models/Disponibilidade");
const Agendamento = require("../models/Agendamento");
const Medico = require("../models/Medico");
const Instituicao = require("../models/Instituicao");

const STATUS_QUE_OCUPAM_VAGA = [
    "pendente",
    "agendada"
];

function idValido(id) {
    return mongoose.isValidObjectId(id);
}

function converterDataHora(valor) {
    if (typeof valor !== "string") {
        return null;
    }

    const regex =
        /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;

    const partes = regex.exec(valor);

    if (!partes) {
        return null;
    }

    const ano = Number(partes[1]);
    const mes = Number(partes[2]);
    const dia = Number(partes[3]);

    const dataCivil = new Date(
        Date.UTC(ano, mes - 1, dia)
    );

    if (
        dataCivil.getUTCFullYear() !== ano ||
        dataCivil.getUTCMonth() !== mes - 1 ||
        dataCivil.getUTCDate() !== dia
    ) {
        return null;
    }

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
        return null;
    }

    return data;
}

async function obterMedicoInstituicaoAtivos(medicoId) {
    const medico = await Medico.findById(medicoId);

    if (!medico) {
        return {
            erro: "Médico não encontrado.",
            status: 404
        };
    }

    if (!medico.ativo) {
        return {
            erro: "O médico está inativo.",
            status: 409
        };
    }

    const instituicao = await Instituicao.findById(
        medico.instituicaoId
    );

    if (!instituicao) {
        return {
            erro: "A instituição do médico não foi encontrada.",
            status: 404
        };
    }

    if (!instituicao.ativo) {
        return {
            erro: "A instituição do médico está inativa.",
            status: 409
        };
    }

    return {
        medico,
        instituicao
    };
}

function usuarioPodeGerenciarMedico(usuario, medico) {
    if (usuario.perfil === "admin") {
        return true;
    }

    if (usuario.perfil === "gestor") {
        return (
            usuario.instituicaoId &&
            String(usuario.instituicaoId) ===
                String(medico.instituicaoId)
        );
    }

    if (usuario.perfil === "medico") {
        return (
            medico.usuarioId &&
            String(medico.usuarioId) === String(usuario._id)
        );
    }

    return false;
}

async function existeSobreposicao(
    medicoId,
    inicio,
    fim,
    disponibilidadeIdExcluir = null
) {
    const filtro = {
        medicoId,
        ativo: true,
        inicio: {
            $lt: fim
        },
        fim: {
            $gt: inicio
        }
    };

    if (disponibilidadeIdExcluir) {
        filtro._id = {
            $ne: disponibilidadeIdExcluir
        };
    }

    return Disponibilidade.exists(filtro);
}


async function listarDisponibilidades(req, res) {
    try {
        const { perfil, _id, instituicaoId } = req.usuario;
        const { medicoId, ativo } = req.query;

        const filtro = {
            inicio: {
                $gt: new Date()
            }
        };

        if (perfil === "responsavel") {
            if (!medicoId || !idValido(medicoId)) {
                return res.status(400).json({
                    message:
                        "Informe um ID de médico válido para consultar os horários."
                });
            }

            const resultado = await obterMedicoInstituicaoAtivos(
                medicoId
            );

            if (resultado.erro) {
                return res.status(resultado.status).json({
                    message: resultado.erro
                });
            }

            filtro.medicoId = resultado.medico._id;
            filtro.ativo = true;
        }

        if (perfil === "medico") {
            const medico = await Medico.findOne({
                usuarioId: _id
            });

            if (!medico) {
                return res.status(404).json({
                    message:
                        "Não existe cadastro profissional vinculado à sua conta."
                });
            }

            if (!medico.ativo) {
                return res.status(409).json({
                    message: "O cadastro profissional está inativo."
                });
            }

            if (
                medicoId &&
                (
                    !idValido(medicoId) ||
                    String(medicoId) !== String(medico._id)
                )
            ) {
                return res.status(403).json({
                    message:
                        "Você somente pode consultar sua própria agenda."
                });
            }

            filtro.medicoId = medico._id;
        }

        if (perfil === "gestor") {
            if (!instituicaoId) {
                return res.status(409).json({
                    message:
                        "Sua conta não possui instituição vinculada."
                });
            }

            const instituicao = await Instituicao.findById(
                instituicaoId
            );

            if (!instituicao || !instituicao.ativo) {
                return res.status(409).json({
                    message: "Sua instituição não está ativa."
                });
            }

            const filtroMedicos = {
                instituicaoId
            };

            if (medicoId) {
                if (!idValido(medicoId)) {
                    return res.status(400).json({
                        message: "ID do médico inválido."
                    });
                }

                filtroMedicos._id = medicoId;
            }

            const idsMedicos = await Medico.find(filtroMedicos)
                .distinct("_id");

            filtro.medicoId = {
                $in: idsMedicos
            };
        }

        if (perfil === "admin" && medicoId) {
            if (!idValido(medicoId)) {
                return res.status(400).json({
                    message: "ID do médico inválido."
                });
            }

            filtro.medicoId = medicoId;
        }

        if (
            perfil !== "responsavel" &&
            ativo !== undefined
        ) {
            if (!["true", "false"].includes(ativo)) {
                return res.status(400).json({
                    message:
                        "O filtro ativo deve ser true ou false."
                });
            }

            filtro.ativo = ativo === "true";
        }

        const disponibilidades = await Disponibilidade.find(filtro)
            .populate({
                path: "medicoId",
                select:
                    "nomeCompleto especialidade instituicaoId ativo",
                populate: {
                    path: "instituicaoId",
                    select: "nomePublico"
                }
            })
            .sort({
                inicio: 1
            })
            .lean();

        const idsDisponibilidades = disponibilidades.map(
            disponibilidade => disponibilidade._id
        );

        let idsReservados = [];

        if (idsDisponibilidades.length > 0) {
            idsReservados = await Agendamento.distinct(
                "disponibilidadeId",
                {
                    disponibilidadeId: {
                        $in: idsDisponibilidades
                    },
                    status: {
                        $in: STATUS_QUE_OCUPAM_VAGA
                    }
                }
            );
        }

        const reservadas = new Set(
            idsReservados.map(id => String(id))
        );

        let resultado = disponibilidades.map(disponibilidade => ({
            ...disponibilidade,
            ocupada: reservadas.has(
                String(disponibilidade._id)
            )
        }));

        if (perfil === "responsavel") {
            resultado = resultado.filter(
                disponibilidade => !disponibilidade.ocupada
            );
        }

        return res.status(200).json({
            quantidade: resultado.length,
            disponibilidades: resultado
        });

    } catch (erro) {
        console.error("Erro ao listar disponibilidades.");

        return res.status(500).json({
            message:
                "Não foi possível consultar as disponibilidades."
        });
    }
}


async function criarDisponibilidade(req, res) {
    const dados = req.body ?? {};

    if (
        typeof dados !== "object" ||
        dados === null ||
        Array.isArray(dados)
    ) {
        return res.status(400).json({
            message: "Envie um objeto JSON válido."
        });
    }

    const perfil = req.usuario.perfil;

    const camposPermitidos =
        perfil === "medico"
            ? ["inicio", "fim"]
            : ["medicoId", "inicio", "fim"];

    if (
        Object.keys(dados).length === 0 ||
        Object.keys(dados).some(
            campo => !camposPermitidos.includes(campo)
        )
    ) {
        return res.status(400).json({
            message: "A requisição contém campos não permitidos."
        });
    }

    if (
        typeof dados.inicio !== "string" ||
        typeof dados.fim !== "string"
    ) {
        return res.status(400).json({
            message:
                "Informe inicio e fim com fuso horário explícito."
        });
    }

    const inicio = converterDataHora(dados.inicio);
    const fim = converterDataHora(dados.fim);

    if (!inicio || !fim) {
        return res.status(400).json({
            message:
                "As datas devem ser válidas e incluir o fuso horário, por exemplo -03:00."
        });
    }

    if (inicio <= new Date()) {
        return res.status(400).json({
            message:
                "A disponibilidade deve começar em uma data futura."
        });
    }

    if (fim <= inicio) {
        return res.status(400).json({
            message:
                "O horário final deve ser posterior ao horário inicial."
        });
    }

    try {
        let medico;

        if (perfil === "medico") {
            medico = await Medico.findOne({
                usuarioId: req.usuario._id
            });

            if (!medico) {
                return res.status(404).json({
                    message:
                        "Não existe cadastro profissional vinculado à sua conta."
                });
            }
        } else {
            if (
                typeof dados.medicoId !== "string" ||
                !idValido(dados.medicoId)
            ) {
                return res.status(400).json({
                    message: "Informe um ID de médico válido."
                });
            }

            medico = await Medico.findById(dados.medicoId);
        }

        if (!medico) {
            return res.status(404).json({
                message: "Médico não encontrado."
            });
        }

        if (!usuarioPodeGerenciarMedico(req.usuario, medico)) {
            return res.status(403).json({
                message:
                    "Você não possui permissão para administrar a agenda deste médico."
            });
        }

        const resultado = await obterMedicoInstituicaoAtivos(
            medico._id
        );

        if (resultado.erro) {
            return res.status(resultado.status).json({
                message: resultado.erro
            });
        }

        const sobreposicao = await existeSobreposicao(
            medico._id,
            inicio,
            fim
        );

        if (sobreposicao) {
            return res.status(409).json({
                message:
                    "Já existe uma disponibilidade deste médico que se sobrepõe ao horário informado."
            });
        }

        const disponibilidade = await Disponibilidade.create({
            medicoId: medico._id,
            inicio,
            fim,
            ativo: true
        });

        return res.status(201).json({
            message: "Disponibilidade cadastrada com sucesso.",
            disponibilidade
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

        console.error("Erro ao criar disponibilidade.");

        return res.status(500).json({
            message:
                "Não foi possível cadastrar a disponibilidade."
        });
    }
}



async function atualizarDisponibilidade(req, res) {
    const { id } = req.params;
    const dados = req.body ?? {};

    if (!idValido(id)) {
        return res.status(400).json({
            message: "ID da disponibilidade inválido."
        });
    }

    if (
        typeof dados !== "object" ||
        dados === null ||
        Array.isArray(dados)
    ) {
        return res.status(400).json({
            message: "Envie um objeto JSON válido."
        });
    }

    const camposPermitidos = [
        "inicio",
        "fim",
        "ativo"
    ];

    if (
        Object.keys(dados).length === 0 ||
        Object.keys(dados).some(
            campo => !camposPermitidos.includes(campo)
        )
    ) {
        return res.status(400).json({
            message: "Informe somente inicio, fim ou ativo."
        });
    }

    if (
        (dados.inicio !== undefined) !==
        (dados.fim !== undefined)
    ) {
        return res.status(400).json({
            message:
                "Para alterar o horário, informe inicio e fim juntos."
        });
    }

    if (
        dados.ativo !== undefined &&
        typeof dados.ativo !== "boolean"
    ) {
        return res.status(400).json({
            message: "O campo ativo deve ser booleano."
        });
    }

    try {
        const disponibilidade = await Disponibilidade.findById(id);

        if (!disponibilidade) {
            return res.status(404).json({
                message: "Disponibilidade não encontrada."
            });
        }

        const medico = await Medico.findById(
            disponibilidade.medicoId
        );

        if (!medico) {
            return res.status(404).json({
                message: "Médico da disponibilidade não encontrado."
            });
        }

        if (!usuarioPodeGerenciarMedico(req.usuario, medico)) {
            return res.status(403).json({
                message:
                    "Você não possui permissão para alterar esta disponibilidade."
            });
        }

        const possuiHistorico = await Agendamento.exists({
            disponibilidadeId: disponibilidade._id
        });

        if (possuiHistorico) {
            return res.status(409).json({
                message:
                    "Esta disponibilidade possui histórico de agendamento e não pode ser alterada."
            });
        }

        let novoInicio = disponibilidade.inicio;
        let novoFim = disponibilidade.fim;

        if (dados.inicio !== undefined) {
            novoInicio = converterDataHora(dados.inicio);
            novoFim = converterDataHora(dados.fim);

            if (!novoInicio || !novoFim) {
                return res.status(400).json({
                    message:
                        "Informe datas válidas com fuso horário explícito."
                });
            }

            if (
                novoInicio <= new Date() ||
                novoFim <= novoInicio
            ) {
                return res.status(400).json({
                    message:
                        "Informe um período futuro com horário final posterior ao inicial."
                });
            }
        }

        const novoAtivo =
            dados.ativo !== undefined
                ? dados.ativo
                : disponibilidade.ativo;

        if (novoAtivo && novoInicio <= new Date()) {
            return res.status(409).json({
                message:
                    "Não é possível ativar uma disponibilidade passada."
            });
        }

        if (novoAtivo) {
            const sobreposicao = await existeSobreposicao(
                medico._id,
                novoInicio,
                novoFim,
                disponibilidade._id
            );

            if (sobreposicao) {
                return res.status(409).json({
                    message:
                        "Já existe outra disponibilidade ativa que se sobrepõe ao horário informado."
                });
            }
        }

        disponibilidade.inicio = novoInicio;
        disponibilidade.fim = novoFim;
        disponibilidade.ativo = novoAtivo;

        await disponibilidade.save();

        return res.status(200).json({
            message: "Disponibilidade atualizada com sucesso.",
            disponibilidade
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

        console.error("Erro ao atualizar disponibilidade.");

        return res.status(500).json({
            message:
                "Não foi possível atualizar a disponibilidade."
        });
    }
}

module.exports = {
    listarDisponibilidades,
    criarDisponibilidade,
    atualizarDisponibilidade
};
