
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
                    "agendada",
                    "cancelada",
                    "concluida"
                ],
                message: "O status do agendamento é inválido."
            },
            default: "agendada"
        }
    },
    {
        timestamps: true
    }
);


agendamentoSchema.index(
    {
        medicoId: 1,
        dataHora: 1
    },
    {
        unique: true,
        partialFilterExpression: {
            status: "agendada"
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
        partialFilterExpression: {
            status: "agendada"
        }
    }
);

module.exports = mongoose.model(
    "Agendamento",
    agendamentoSchema
);
