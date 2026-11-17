
const mongoose = require("mongoose");

function normalizarTelefone(telefone) {
    if (typeof telefone !== "string") {
        return telefone;
    }

    const valor = telefone.trim();

    if (!/^[\d\s().-]+$/.test(valor)) {
        return valor;
    }

    return valor.replace(/\D/g, "");
}

const usuarioSchema = new mongoose.Schema(
    {
        nomeCompleto: {
            type: String,
            required: function () {
                return this.perfil === "responsavel";
            },
            trim: true,
            minlength: [
                3,
                "O nome completo deve ter pelo menos 3 caracteres."
            ]
        },

        nomeUsuario: {
            type: String,
            required: [true, "O nome de usuário é obrigatório."],
            trim: true,
            lowercase: true,
            minlength: [
                3,
                "O nome de usuário deve ter pelo menos 3 caracteres."
            ],
            maxlength: [
                30,
                "O nome de usuário deve ter no máximo 30 caracteres."
            ],
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

        telefone: {
            type: String,
            required: function () {
                return this.perfil === "responsavel";
            },
            set: normalizarTelefone,
            validate: {
                validator: function (telefone) {
                    if (
                        this.perfil !== "responsavel" &&
                        !telefone
                    ) {
                        return true;
                    }

                    return /^\d{10,11}$/.test(telefone);
                },
                message:
                    "O telefone deve conter DDD e 10 ou 11 dígitos numéricos."
            }
        },

        email: {
            type: String,
            trim: true,
            lowercase: true,
            validate: {
                validator: function (email) {
                    if (
                        email === undefined ||
                        email === null ||
                        email === ""
                    ) {
                        return true;
                    }

                    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
                },
                message: "O e-mail informado possui formato inválido."
            }
        },

        perfil: {
            type: String,
            required: [true, "O perfil é obrigatório."],
            enum: {
                values: [
                    "responsavel",
                    "medico",
                    "gestor",
                    "admin"
                ],
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
                        return (
                            valor !== null &&
                            valor !== undefined
                        );
                    }

                    return true;
                },
                message:
                    "Uma conta de Gestor deve estar vinculada a uma instituição."
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
