
const mongoose = require("mongoose");

const agendamentoSchema = new mongoose.Schema(
    {
        pacienteId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Paciente",
            required: [
                true,
                "O paciente é obrigatório."
            ],
            index: true
        },

        medicoId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Medico",
            required: [
                true,
                "O médico é obrigatório."
            ]
        },

        instituicaoId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Instituicao",
            required: [
                true,
                "A instituição é obrigatória."
            ],
            index: true
        },

        disponibilidadeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Disponibilidade",
            required: [
                true,
                "A disponibilidade selecionada é obrigatória."
            ],
            index: true
        },

        dataHora: {
            type: Date,
            required: [
                true,
                "A data e o horário da consulta são obrigatórios."
            ]
        },

        status: {
            type: String,
            enum: {
                values: [
                    "pendente",
                    "agendada",
                    "recusada",
                    "cancelada",
                    "concluida"
                ],
                message: "O status do agendamento é inválido."
            },
            default: "pendente"
        },

        motivo: {
            type: String,
            trim: true,
            default: ""
        },

        modalidade: {
            type: String,
            trim: true,
            default: ""
        },

        plano: {
            type: String,
            trim: true,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

const statusQueOcupamVaga = [
    "pendente",
    "agendada"
];

agendamentoSchema.index(
    {
        disponibilidadeId: 1
    },
    {
        unique: true,
        name: "uniq_disponibilidade_reserva_ativa",
        partialFilterExpression: {
            status: {
                $in: statusQueOcupamVaga
            }
        }
    }
);

agendamentoSchema.index(
    {
        medicoId: 1,
        dataHora: 1
    },
    {
        unique: true,
        name: "uniq_medico_horario_ativo",
        partialFilterExpression: {
            status: {
                $in: statusQueOcupamVaga
            }
        }
    }
);

agendamentoSchema.index(
    {
        pacienteId: 1,
        dataHora: 1
    },
    {
        unique: true,
        name: "uniq_paciente_horario_ativo",
        partialFilterExpression: {
            status: {
                $in: statusQueOcupamVaga
            }
        }
    }
);

module.exports = mongoose.model(
    "Agendamento",
    agendamentoSchema
);
