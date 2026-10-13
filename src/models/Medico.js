
const mongoose = require("mongoose");

const medicoSchema = new mongoose.Schema(
    {
        nomeCompleto: {
            type: String,
            required: [
                true,
                "O nome do médico é obrigatório."
            ],
            trim: true,
            minlength: [
                3,
                "O nome deve ter pelo menos 3 caracteres."
            ]
        },

        especialidade: {
            type: String,
            required: [
                true,
                "A especialidade é obrigatória."
            ],
            trim: true,
            minlength: [
                3,
                "A especialidade deve ter pelo menos 3 caracteres."
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

        ativo: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Medico", medicoSchema);
