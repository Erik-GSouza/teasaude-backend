
const mongoose = require("mongoose");

const usuarioSchema = new mongoose.Schema(
    {
        nomeUsuario: {
            type: String,
            required: [true, "O nome de usuário é obrigatório."],
            trim: true,
            lowercase: true,
            minlength: [3, "O nome de usuário deve ter pelo menos 3 caracteres."],
            maxlength: [30, "O nome de usuário deve ter no máximo 30 caracteres."],
            match: [
                /^[a-z0-9._-]+$/,
                "Use apenas letras, números, ponto, hífen e sublinhado."
            ],
            unique: true
        },

        senhaHash: {
            type: String,
            required: [true, "O hash da senha é obrigatório."],
            select: false
        },

        perfil: {
            type: String,
            required: [true, "O perfil é obrigatório."],
            enum: {
                values: ["paciente", "gestor", "admin"],
                message: "O perfil informado é inválido."
            }
        },

        instituicaoId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Instituicao",
            default: null,
            validate: {
                validator: function (valor) {
                    if (this.perfil === "gestor") {
                        return valor !== null && valor !== undefined;
                    }

                    return true;
                },
                message: "Uma conta de Gestor deve estar vinculada a uma instituição."
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

module.exports = mongoose.model("Usuario", usuarioSchema);
