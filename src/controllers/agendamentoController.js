const mongoose = require("mongoose");

const Agendamento = require("../models/Agendamento");
const Paciente = require("../models/Paciente");
const Disponibilidade = require("../models/Disponibilidade");
const Medico = require("../models/Medico");
const Instituicao = require("../models/Instituicao");

const STATUS_QUE_OCUPAM_VAGA = [
    "pendente",
    "agendada"
];

async function criarAgendamento(req, res) {
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

    const camposPermitidos = [
        "pacienteId",
        "disponibilidadeId",
        "motivo",
        "modalidade",
        "plano"
    ];

    const camposRecebidos = Object.keys(dados);

    if (
        camposRecebidos.length === 0 ||
        camposRecebidos.some(
            campo => !camposPermitidos.includes(campo)
        )
    ) {
        return res.status(400).json({
            message: "O agendamento contém campos não permitidos."
        });
    }

    if (
        typeof dados.pacienteId !== "string" ||
        !mongoose.isValidObjectId(dados.pacienteId)
    ) {
        return res.status(400).json({
            message: "ID do paciente inválido."
        });
    }

    if (
        typeof dados.disponibilidadeId !== "string" ||
        !mongoose.isValidObjectId(dados.disponibilidadeId)
    ) {
        return res.status(400).json({
            message: "ID da disponibilidade inválido."
        });
    }

    for (const campo of [
        "motivo",
        "modalidade",
        "plano"
    ]) {
        if (
            dados[campo] !== undefined &&
            (
                typeof dados[campo] !== "string" ||
                dados[campo].trim() === ""
            )
        ) {
            return res.status(400).json({
                message: `O campo ${campo} deve ser um texto válido.`
            });
        }
    }

    try {
        const paciente = await Paciente.findOne({
            _id: dados.pacienteId,
            responsavelId: req.usuario._id
        });

        if (!paciente) {
            return res.status(404).json({
                message:
                    "Paciente não encontrado ou não pertence ao responsável autenticado."
            });
        }

        const disponibilidade = await Disponibilidade.findById(
            dados.disponibilidadeId
        );

        if (!disponibilidade) {
            return res.status(404).json({
                message: "Disponibilidade não encontrada."
            });
        }

        if (!disponibilidade.ativo) {
            return res.status(409).json({
                message: "Esta disponibilidade está inativa."
            });
        }

        if (disponibilidade.inicio <= new Date()) {
            return res.status(409).json({
                message:
                    "Não é possível solicitar uma disponibilidade passada."
            });
        }

        const medico = await Medico.findById(
            disponibilidade.medicoId
        );

        if (!medico) {
            return res.status(404).json({
                message: "Médico não encontrado."
            });
        }

        if (!medico.ativo) {
            return res.status(409).json({
                message: "O médico está inativo."
            });
        }

        const instituicao = await Instituicao.findById(
            medico.instituicaoId
        );

        if (!instituicao) {
            return res.status(404).json({
                message:
                    "A instituição vinculada ao médico não foi encontrada."
            });
        }

        if (!instituicao.ativo) {
            return res.status(409).json({
                message: "A instituição está inativa."
            });
        }

        if (dados.modalidade) {
            const modalidadesMedico = medico.modalidades || [];

            if (
                modalidadesMedico.length > 0 &&
                !modalidadesMedico.some(
                    modalidade =>
                        modalidade.toLowerCase() ===
                        dados.modalidade.trim().toLowerCase()
                )
            ) {
                return res.status(400).json({
                    message:
                        "A modalidade informada não está disponível para este médico."
                });
            }
        }

        const disponibilidadeOcupada =
            await Agendamento.exists({
                disponibilidadeId: disponibilidade._id,
                status: {
                    $in: STATUS_QUE_OCUPAM_VAGA
                }
            });

        if (disponibilidadeOcupada) {
            return res.status(409).json({
                message:
                    "Esta disponibilidade já foi solicitada ou confirmada."
            });
        }

        const medicoOcupado = await Agendamento.exists({
            medicoId: medico._id,
            dataHora: disponibilidade.inicio,
            status: {
                $in: STATUS_QUE_OCUPAM_VAGA
            }
        });

        if (medicoOcupado) {
            return res.status(409).json({
                message:
                    "O médico já possui um atendimento neste horário."
            });
        }

        const pacienteOcupado = await Agendamento.exists({
            pacienteId: paciente._id,
            dataHora: disponibilidade.inicio,
            status: {
                $in: STATUS_QUE_OCUPAM_VAGA
            }
        });

        if (pacienteOcupado) {
            return res.status(409).json({
                message:
                    "O paciente já possui um atendimento neste horário."
            });
        }

        const novoAgendamento = {
            pacienteId: paciente._id,
            medicoId: medico._id,
            instituicaoId: instituicao._id,
            disponibilidadeId: disponibilidade._id,
            dataHora: disponibilidade.inicio,
            status: "pendente"
        };

        if (dados.motivo !== undefined) {
            novoAgendamento.motivo = dados.motivo.trim();
        }

        if (dados.modalidade !== undefined) {
            novoAgendamento.modalidade =
                dados.modalidade.trim();
        }

        if (dados.plano !== undefined) {
            novoAgendamento.plano = dados.plano.trim();
        }

        const agendamento = await Agendamento.create(
            novoAgendamento
        );

        await agendamento.populate([
            {
                path: "pacienteId",
                select: "nomeCompleto dataNascimento"
            },
            {
                path: "medicoId",
                select: "nomeCompleto especialidade"
            },
            {
                path: "instituicaoId",
                select: "nomePublico"
            },
            {
                path: "disponibilidadeId",
                select: "inicio fim ativo"
            }
        ]);

        return res.status(201).json({
            message:
                "Solicitação de agendamento criada com sucesso. Aguarde a confirmação da clínica.",
            agendamento
        });

    } catch (erro) {

        if (erro.code === 11000) {
            return res.status(409).json({
                message:
                    "Este horário selecionado já foi reservado por outro agendamento."
            });
        }

        if (
            erro.name === "ValidationError" ||
            erro.name === "CastError"
        ) {
            return res.status(400).json({
                message:
                    "Os dados do agendamento são inválidos."
            });
        }

        console.error("Erro ao criar agendamento.");

        return res.status(500).json({
            message:
                "Não foi possível criar a solicitação de agendamento."
        });
    }
}


async function listarMeusAgendamentos(req, res) {
    try {
        const pacientes = await Paciente.find({
            responsavelId: req.usuario._id
        }).select("_id");

        const idsPacientes = pacientes.map(
            paciente => paciente._id
        );

        if (idsPacientes.length === 0) {
            return res.status(200).json({
                quantidade: 0,
                agendamentos: []
            });
        }

        const agendamentos = await Agendamento.find({
            pacienteId: {
                $in: idsPacientes
            }
        })
            .populate({
                path: "pacienteId",
                select: "nomeCompleto dataNascimento"
            })
            .populate({
                path: "medicoId",
                select: "nomeCompleto especialidade"
            })
            .populate({
                path: "instituicaoId",
                select: "nomePublico"
            })
            .populate({
                path: "disponibilidadeId",
                select: "inicio fim ativo"
            })
            .sort({
                dataHora: 1
            })
            .lean();

        return res.status(200).json({
            quantidade: agendamentos.length,
            agendamentos
        });

    } catch (erro) {
        console.error(
            "Erro ao listar agendamentos do responsável."
        );

        return res.status(500).json({
            message:
                "Não foi possível listar os agendamentos."
        });
    }
}

module.exports = {
    criarAgendamento,
    listarMeusAgendamentos
};