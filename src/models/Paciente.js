
const mongoose = require("mongoose");

function dataNascimentoValida(dataNascimento) {
    if (
        !(dataNascimento instanceof Date) ||
        Number.isNaN(dataNascimento.getTime())
    ) {
        return false;
    }

    const hoje = new Date();

    const dataHoje = Date.UTC(
        hoje.getFullYear(),
        hoje.getMonth(),
        hoje.getDate()
    );

    const dataNascimentoCivil = Date.UTC(
        dataNascimento.getUTCFullYear(),
        dataNascimento.getUTCMonth(),
        dataNascimento.getUTCDate()
    );

    return dataNascimentoCivil <= dataHoje;
}

const pacienteSchema = new mongoose.Schema(
    {
        nomeCompleto: {
            type: String,
            required: [
                true,
                "O nome do paciente é obrigatório."
            ],
            trim: true,
            minlength: [
                3,
                "O nome deve ter pelo menos 3 caracteres."
            ]
        },

        dataNascimento: {
            type: Date,
            required: [
                true,
                "A data de nascimento é obrigatória."
            ],
            validate: {
                validator: dataNascimentoValida,
                message:
                    "A data de nascimento deve ser válida e não pode ser futura."
            }
        },

        responsavelId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Usuario",
            required: [
                true,
                "O responsável pelo paciente é obrigatório."
            ],
            index: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Paciente", pacienteSchema);
