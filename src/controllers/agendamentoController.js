const mongoose = require("mongoose");

const Agendamento = require("../models/Agendamento");
const Paciente = require("../models/Paciente");
const Disponibilidade = require("../models/Disponibilidade");
const Medico = require("../models/Medico");
const Instituicao = require("../models/Instituicao");

// Estados que ocupam uma disponibilidade e impedem nova reserva.
const STATUS_QUE_OCUPAM_VAGA = ["pendente", "agendada"];

const STATUS_PERMITIDOS = [
    "pendente",
    "agendada",
    "recusada",
    "cancelada",
    "concluida"
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

    for (const campo of ["motivo", "modalidade", "plano"]) {
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
        // O paciente precisa pertencer ao responsável autenticado.
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

        // Confere a disponibilidade escolhida.
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

        // Confere o médico vinculado à disponibilidade.
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

        // Confere a instituição vinculada ao médico.
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

        // Se o médico possuir modalidades cadastradas,
        // a modalidade solicitada deve estar entre elas.
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

        // Verifica se a disponibilidade já foi reservada.
        const disponibilidadeOcupada = await Agendamento.exists({
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

        // Protege o médico contra dois atendimentos no mesmo horário.
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

        // Protege o paciente contra dois atendimentos no mesmo horário.
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
            novoAgendamento.modalidade = dados.modalidade.trim();
        }

        if (dados.plano !== undefined) {
            novoAgendamento.plano = dados.plano.trim();
        }

        const agendamento = await Agendamento.create(novoAgendamento);

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
                message: "Os dados do agendamento são inválidos."
            });
        }

        console.error("Erro ao criar agendamento:", erro);

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
            .sort({ dataHora: 1 });

        return res.status(200).json({
            quantidade: agendamentos.length,
            agendamentos
        });

    } catch (erro) {
        console.error(
            "Erro ao listar agendamentos do responsável:",
            erro
        );

        return res.status(500).json({
            message: "Não foi possível listar os agendamentos."
        });
    }
}

async function construirFiltroEscopo(req) {
    const filtro = {};

    if (req.usuario.perfil === "gestor") {
        if (!req.usuario.instituicaoId) {
            return null;
        }

        filtro.instituicaoId = req.usuario.instituicaoId;
    }

    if (req.usuario.perfil === "responsavel") {
        const pacientes = await Paciente.find({
            responsavelId: req.usuario._id
        }).select("_id");

        const idsPacientes = pacientes.map(
            paciente => paciente._id
        );

        filtro.pacienteId = {
            $in: idsPacientes
        };
    }

    return filtro;
}


async function listarAgendamentos(req, res) {
    try {
        const filtro = {};

        if (req.usuario.perfil === "gestor") {
            if (!req.usuario.instituicaoId) {
                return res.status(409).json({
                    message:
                        "A conta Gestor não possui instituição vinculada."
                });
            }

            filtro.instituicaoId = req.usuario.instituicaoId;
        }

        if (req.query.status !== undefined) {
            if (!STATUS_PERMITIDOS.includes(req.query.status)) {
                return res.status(400).json({
                    message: "Filtro de status inválido."
                });
            }

            filtro.status = req.query.status;
        }

        if (req.query.medicoId !== undefined) {
            if (!mongoose.isValidObjectId(req.query.medicoId)) {
                return res.status(400).json({
                    message: "ID do médico inválido."
                });
            }

            filtro.medicoId = req.query.medicoId;
        }

        const agendamentos = await Agendamento.find(filtro)
            .populate({
                path: "pacienteId",
                select: "nomeCompleto dataNascimento responsavelId",
                populate: {
                    path: "responsavelId",
                    select: "nomeCompleto telefone"
                }
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
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            quantidade: agendamentos.length,
            agendamentos
        });

    } catch (erro) {
        console.error("Erro ao listar agendamentos:", erro);

        return res.status(500).json({
            message: "Não foi possível listar os agendamentos."
        });
    }
}

async function buscarAgendamentoPorId(req, res) {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            message: "ID do agendamento inválido."
        });
    }

    try {
        const filtroEscopo = await construirFiltroEscopo(req);

        if (
            !filtroEscopo &&
            req.usuario.perfil === "gestor"
        ) {
            return res.status(409).json({
                message:
                    "A conta Gestor não possui instituição vinculada."
            });
        }

        const agendamento = await Agendamento.findOne({
            _id: id,
            ...filtroEscopo
        })
            .populate({
                path: "pacienteId",
                select: "nomeCompleto dataNascimento responsavelId",
                populate: {
                    path: "responsavelId",
                    select: "nomeCompleto telefone"
                }
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
            });

        if (!agendamento) {
            return res.status(404).json({
                message: "Agendamento não encontrado."
            });
        }

        return res.status(200).json({
            message: "Agendamento encontrado.",
            agendamento
        });

    } catch (erro) {
        console.error("Erro ao consultar agendamento:", erro);

        return res.status(500).json({
            message: "Não foi possível consultar o agendamento."
        });
    }
}


async function atualizarStatusAgendamento(req, res) {
    const { id } = req.params;
    const dados = req.body ?? {};

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            message: "ID do agendamento inválido."
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

    const camposPermitidos = ["status", "motivo"];
    const camposRecebidos = Object.keys(dados);

    if (
        camposRecebidos.length === 0 ||
        camposRecebidos.some(
            campo => !camposPermitidos.includes(campo)
        )
    ) {
        return res.status(400).json({
            message: "Informe somente status e motivo."
        });
    }

    const statusDestinoPermitidos = [
        "agendada",
        "recusada",
        "cancelada",
        "concluida"
    ];

    if (
        typeof dados.status !== "string" ||
        !statusDestinoPermitidos.includes(dados.status)
    ) {
        return res.status(400).json({
            message: "O status solicitado é inválido."
        });
    }

    if (
        dados.motivo !== undefined &&
        (
            typeof dados.motivo !== "string" ||
            dados.motivo.trim() === ""
        )
    ) {
        return res.status(400).json({
            message: "O motivo deve ser um texto válido."
        });
    }

    if (
        dados.motivo !== undefined &&
        dados.motivo.trim().length > 500
    ) {
        return res.status(400).json({
            message: "O motivo deve ter no máximo 500 caracteres."
        });
    }

    const perfil = req.usuario.perfil;
    const novoStatus = dados.status;
    const agora = new Date();

    // O Responsável somente pode solicitar cancelamento.
    if (
        perfil === "responsavel" &&
        novoStatus !== "cancelada"
    ) {
        return res.status(403).json({
            message:
                "O responsável somente pode solicitar o cancelamento de uma consulta."
        });
    }

    if (!["responsavel", "gestor", "admin"].includes(perfil)) {
        return res.status(403).json({
            message:
                "Você não possui permissão para alterar este agendamento."
        });
    }

    try {
        const filtroEscopo = await construirFiltroEscopo(req);

        if (!filtroEscopo && perfil === "gestor") {
            return res.status(409).json({
                message:
                    "A conta Gestor não possui instituição vinculada."
            });
        }

        const agendamento = await Agendamento.findOne({
            _id: id,
            ...filtroEscopo
        }).populate({
            path: "disponibilidadeId",
            select: "inicio fim ativo"
        });

        if (!agendamento) {
            return res.status(404).json({
                message: "Agendamento não encontrado."
            });
        }

        const statusAtual = agendamento.status;
        const inicio = new Date(agendamento.dataHora);

        // Confirmação: pendente -> agendada.
        if (novoStatus === "agendada") {
            if (perfil !== "gestor" && perfil !== "admin") {
                return res.status(403).json({
                    message:
                        "Somente o Gestor ou Admin pode confirmar uma solicitação."
                });
            }

            if (statusAtual !== "pendente") {
                return res.status(409).json({
                    message:
                        "Somente solicitações pendentes podem ser confirmadas."
                });
            }

            if (inicio <= agora) {
                return res.status(409).json({
                    message:
                        "Não é possível confirmar uma consulta cujo horário já começou."
                });
            }
        }

        // Recusa: pendente -> recusada.
        if (novoStatus === "recusada") {
            if (perfil !== "gestor" && perfil !== "admin") {
                return res.status(403).json({
                    message:
                        "Somente o Gestor ou Admin pode recusar uma solicitação."
                });
            }

            if (statusAtual !== "pendente") {
                return res.status(409).json({
                    message:
                        "Somente solicitações pendentes podem ser recusadas."
                });
            }

            if (inicio <= agora) {
                return res.status(409).json({
                    message:
                        "Não é possível recusar uma solicitação após o início do horário."
                });
            }

            if (!dados.motivo || dados.motivo.trim() === "") {
                return res.status(400).json({
                    message: "Informe o motivo da recusa."
                });
            }
        }

        // Cancelamento: pendente/agendada -> cancelada.
        if (novoStatus === "cancelada") {
            if (
                statusAtual !== "pendente" &&
                statusAtual !== "agendada"
            ) {
                return res.status(409).json({
                    message:
                        "Este agendamento não permite mais cancelamento."
                });
            }

            if (inicio <= agora) {
                return res.status(409).json({
                    message:
                        "Não é possível cancelar uma consulta cujo horário já começou."
                });
            }

            // Responsável pode retirar pedido pendente futuro.
            // Consulta confirmada exige pelo menos 24 horas.
            if (perfil === "responsavel") {
                if (statusAtual === "agendada") {
                    const milissegundosRestantes =
                        inicio.getTime() - agora.getTime();

                    const antecedenciaMinima =
                        24 * 60 * 60 * 1000;

                    if (milissegundosRestantes < antecedenciaMinima) {
                        return res.status(409).json({
                            message:
                                "Consultas confirmadas só podem ser canceladas com pelo menos 24 horas de antecedência. Entre em contato com a clínica."
                        });
                    }
                }
            } else if (!dados.motivo || dados.motivo.trim() === "") {
                // Cancelamento pela instituição exige justificativa.
                return res.status(400).json({
                    message: "Informe o motivo do cancelamento."
                });
            }
        }

        // Conclusão: agendada -> concluida, após o fim previsto.
        if (novoStatus === "concluida") {
            if (perfil !== "gestor" && perfil !== "admin") {
                return res.status(403).json({
                    message:
                        "Somente o Gestor ou Admin pode registrar a conclusão do atendimento."
                });
            }

            if (statusAtual !== "agendada") {
                return res.status(409).json({
                    message:
                        "Somente consultas confirmadas podem ser concluídas."
                });
            }

            const disponibilidade = agendamento.disponibilidadeId;

            if (!disponibilidade || !disponibilidade.fim) {
                return res.status(409).json({
                    message:
                        "Não foi possível verificar o término da disponibilidade."
                });
            }

            if (new Date(disponibilidade.fim) > agora) {
                return res.status(409).json({
                    message:
                        "O atendimento somente pode ser concluído após o horário previsto."
                });
            }
        }

        // A atualização confirma novamente o status atual e o escopo,
        // evitando que duas decisões concorrentes alterem o mesmo pedido.
        const filtroAtualizacao = {
            _id: agendamento._id,
            status: statusAtual
        };

        if (perfil === "gestor") {
            filtroAtualizacao.instituicaoId = req.usuario.instituicaoId;
        }

        if (perfil === "responsavel") {
            filtroAtualizacao.pacienteId = agendamento.pacienteId;
        }

        const atualizacoes = {
            status: novoStatus
        };

        if (dados.motivo !== undefined) {
            atualizacoes.motivo = dados.motivo.trim();
        }

        const atualizado = await Agendamento.findOneAndUpdate(
            filtroAtualizacao,
            {
                $set: atualizacoes
            },
            {
                returnDocument: "after",
                runValidators: true
            }
        );

        if (!atualizado) {
            return res.status(409).json({
                message:
                    "O agendamento foi alterado por outra operação. Consulte novamente o registro."
            });
        }

        await atualizado.populate([
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

        return res.status(200).json({
            message: "Status do agendamento atualizado com sucesso.",
            agendamento: atualizado
        });

    } catch (erro) {
        if (erro.code === 11000) {
            return res.status(409).json({
                message: "Conflito com outra reserva ativa."
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

        console.error("Erro ao atualizar status do agendamento:", erro);

        return res.status(500).json({
            message: "Não foi possível atualizar o status do agendamento."
        });
    }
}

module.exports = {
    criarAgendamento,
    listarMeusAgendamentos,
    listarAgendamentos,
    buscarAgendamentoPorId,
    atualizarStatusAgendamento
};
