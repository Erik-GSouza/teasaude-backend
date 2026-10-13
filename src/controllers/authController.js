
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const { autenticarUsuario } = require("../services/authService");
const { prepararDadosUsuario } = require("../services/usuarioService");

const Usuario = require("../models/Usuario");
const Paciente = require("../models/Paciente");

function dataCivilValida(valor) {
    if (
        typeof valor !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(valor)
    ) {
        return false;
    }

    const [ano, mes, dia] = valor.split("-").map(Number);
    const data = new Date(Date.UTC(ano, mes - 1, dia));

    return (
        data.getUTCFullYear() === ano &&
        data.getUTCMonth() === mes - 1 &&
        data.getUTCDate() === dia
    );
}

function usuarioPublico(usuario) {
    return {
        _id: usuario._id,
        nomeUsuario: usuario.nomeUsuario,
        perfil: usuario.perfil,
        instituicaoId: usuario.instituicaoId,
        ativo: usuario.ativo,
        createdAt: usuario.createdAt,
        updatedAt: usuario.updatedAt
    };
}


async function cadastrarPaciente(req, res) {
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
        "nomeUsuario",
        "senha",
        "nomeCompleto",
        "dataNascimento",
        "nomeContato",
        "telefoneContato",
        "emailContato"
    ];

    const camposRecebidos = Object.keys(dados);

    if (
        camposRecebidos.some(
            campo => !camposPermitidos.includes(campo)
        )
    ) {
        return res.status(400).json({
            message: "O cadastro contém campos não permitidos."
        });
    }

    if (
        typeof dados.nomeUsuario !== "string" ||
        dados.nomeUsuario.trim() === "" ||
        typeof dados.senha !== "string" ||
        dados.senha === "" ||
        typeof dados.nomeCompleto !== "string" ||
        typeof dados.nomeContato !== "string" ||
        typeof dados.telefoneContato !== "string"
    ) {
        return res.status(400).json({
            message: "Informe os campos obrigatórios do cadastro."
        });
    }

    if (!dataCivilValida(dados.dataNascimento)) {
        return res.status(400).json({
            message:
                "A data de nascimento deve estar no formato AAAA-MM-DD e representar uma data válida."
        });
    }

    if (
        dados.emailContato !== undefined &&
        typeof dados.emailContato !== "string"
    ) {
        return res.status(400).json({
            message: "O e-mail do contato deve ser um texto."
        });
    }

    if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET não está configurado.");

        return res.status(500).json({
            message: "Não foi possível realizar o cadastro."
        });
    }

    let session;

    try {
    
        const dadosUsuario = await prepararDadosUsuario({
            nomeUsuario: dados.nomeUsuario,
            senha: dados.senha
        });

        session = await mongoose.startSession();

        let usuarioCriado;
        let pacienteCriado;

        await session.withTransaction(async () => {
            const usuarios = await Usuario.create(
                [
                    {
                        ...dadosUsuario,
                        perfil: "paciente",
                        instituicaoId: null,
                        ativo: true
                    }
                ],
                { session }
            );

            usuarioCriado = usuarios[0];

            const dadosPaciente = {
                nomeCompleto: dados.nomeCompleto,
                dataNascimento: dados.dataNascimento,
                nomeContato: dados.nomeContato,
                telefoneContato: dados.telefoneContato,
                usuarioId: usuarioCriado._id
            };

            if (dados.emailContato !== undefined) {
                dadosPaciente.emailContato = dados.emailContato;
            }

            const pacientes = await Paciente.create(
                [dadosPaciente],
                { session }
            );

            pacienteCriado = pacientes[0];
        });

        // Cria uma sessão para o usuário que acabou de se cadastrar.
        const token = jwt.sign(
            { id: String(usuarioCriado._id) },
            process.env.JWT_SECRET,
            {
                algorithm: "HS256",
                expiresIn: "1h"
            }
        );

        return res.status(201).json({
            message: "Paciente cadastrado com sucesso.",
            token,
            usuario: usuarioPublico(usuarioCriado),
            paciente: {
                _id: pacienteCriado._id,
                nomeCompleto: pacienteCriado.nomeCompleto,
                dataNascimento: pacienteCriado.dataNascimento,
                nomeContato: pacienteCriado.nomeContato,
                telefoneContato: pacienteCriado.telefoneContato,
                emailContato: pacienteCriado.emailContato,
                usuarioId: pacienteCriado.usuarioId,
                createdAt: pacienteCriado.createdAt,
                updatedAt: pacienteCriado.updatedAt
            }
        });

    } catch (erro) {
        if (erro.code === 11000) {
            return res.status(409).json({
                message: "Esse nome de usuário já está cadastrado."
            });
        }

        if (
            erro.name === "ValidationError" ||
            erro.name === "CastError" ||
            erro.statusCode === 400
        ) {
            return res.status(400).json({
                message: erro.message
            });
        }

        if (
            erro.message === "O nome de usuário é obrigatório." ||
            erro.message === "A senha deve ser informada como texto." ||
            erro.message === "A senha deve ter pelo menos 8 caracteres." ||
            erro.message === "A senha não pode ultrapassar 72 bytes em UTF-8."
        ) {
            return res.status(400).json({
                message: erro.message
            });
        }

        console.error("Erro ao cadastrar paciente e usuário.");

        return res.status(500).json({
            message: "Não foi possível realizar o cadastro."
        });

    } finally {
        if (session) {
            await session.endSession();
        }
    }
}

async function login(req, res) {
    const { nomeUsuario, senha } = req.body ?? {};

    if (
        typeof nomeUsuario !== "string" ||
        nomeUsuario.trim() === "" ||
        typeof senha !== "string" ||
        senha === ""
    ) {
        return res.status(400).json({
            message: "Informe o nome de usuário e a senha."
        });
    }

    try {
        const resultado = await autenticarUsuario(
            nomeUsuario,
            senha
        );

        return res.status(200).json({
            message: "Login realizado com sucesso.",
            token: resultado.token,
            usuario: resultado.usuario
        });
    } catch (erro) {
        if (
            erro.message === "Credenciais inválidas." ||
            erro.message === "Conta inativa."
        ) {
            return res.status(401).json({
                message: "Nome de usuário ou senha inválidos."
            });
        }

        console.error("Erro ao autenticar usuário:", erro);

        return res.status(500).json({
            message: "Não foi possível realizar o login."
        });
    }
}

function obterUsuarioAutenticado(req, res) {
    return res.status(200).json({
        message: "Usuário autenticado.",
        usuario: req.usuario
    });
}

module.exports = {
    cadastrarPaciente,
    login,
    obterUsuarioAutenticado
};
