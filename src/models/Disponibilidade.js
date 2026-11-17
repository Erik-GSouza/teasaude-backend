
const mongoose = require("mongoose");

const disponibilidadeSchema = new mongoose.Schema(
    {
        medicoId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Medico",
            required: [
                true,
                "O médico responsável pela disponibilidade é obrigatório."
            ]
        },

        inicio: {
            type: Date,
            required: [
                true,
                "O início da disponibilidade é obrigatório."
            ]
        },

        fim: {
            type: Date,
            required: [
                true,
                "O fim da disponibilidade é obrigatório."
            ],
            validate: {
                validator: function (valor) {
                    return (
                        this.inicio instanceof Date &&
                        !Number.isNaN(this.inicio.getTime()) &&
                        valor instanceof Date &&
                        !Number.isNaN(valor.getTime()) &&
                        valor > this.inicio
                    );
                },
                message:
                    "O horário final deve ser posterior ao horário inicial."
            }
        },

        ativo: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

disponibilidadeSchema.index({
    medicoId: 1,
    inicio: 1,
    ativo: 1
});

module.exports = mongoose.model(
    "Disponibilidade",
    disponibilidadeSchema
);
