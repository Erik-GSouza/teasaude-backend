
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const { autenticarUsuario } = require("../services/authService");
const { prepararDadosUsuario } = require("../services/usuarioService");

const Usuario = require("../models/Usuario");
const Paciente = require("../models/Paciente");

// Valida se a data recebida representa uma data civil existente.
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

// Verifica se o paciente possui menos de 18 anos.
function menorDe18Anos(dataNascimento) {
    const [ano, mes, dia] = dataNascimento.split("-").map(Number);
    const hoje = new Date();

    let idade = hoje.getFullYear() - ano;

    const aindaNaoFezAniversario =
        hoje.getMonth() + 1 < mes ||
        (
            hoje.getMonth() + 1 === mes &&
            hoje.getDate() < dia
        );

    if (aindaNaoFezAniversario) {
        idade--;
    }

    return idade < 18;
}

// Remove dados sensíveis antes de retornar o usuário.
function usuarioPublico(usuario) {
    return {
        _id: usuario._id,
        nomeCompleto: usuario.nomeCompleto,
        nomeUsuario: usuario.nomeUsuario,
        telefone: usuario.telefone,
        email: usuario.email,
        perfil: usuario.perfil,
        instituicaoId: usuario.instituicaoId,
        ativo: usuario.ativo,
        createdAt: usuario.createdAt,
        updatedAt: usuario.updatedAt
    };
}

// Cadastra a conta do responsável e seu primeiro paciente.
async function cadastrarResponsavel(req, res) {
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

    // Mantém os nomes dos campos utilizados pelo frontend atual.
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
        dados.nomeCompleto.trim() === "" ||
        typeof dados.nomeContato !== "string" ||
        dados.nomeContato.trim() === "" ||
        typeof dados.telefoneContato !== "string" ||
        dados.telefoneContato.trim() === ""
    ) {
        return res.status(400).json({
            message: "Informe todos os campos obrigatórios do cadastro."
        });
    }

    if (!dataCivilValida(dados.dataNascimento)) {
        return res.status(400).json({
            message:
                "A data de nascimento deve estar no formato AAAA-MM-DD e representar uma data válida."
        });
    }

    if (!menorDe18Anos(dados.dataNascimento)) {
        return res.status(400).json({
            message: "O paciente cadastrado deve ter menos de 18 anos."
        });
    }

    if (
        dados.emailContato !== undefined &&
        typeof dados.emailContato !== "string"
    ) {
        return res.status(400).json({
            message: "O e-mail do responsável deve ser um texto."
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
        // Prepara o login e criptografa a senha com bcrypt.
        const dadosAcesso = await prepararDadosUsuario({
            nomeUsuario: dados.nomeUsuario,
            senha: dados.senha
        });

        // Dados pertencentes ao responsável.
        const dadosResponsavel = {
            ...dadosAcesso,
            nomeCompleto: dados.nomeContato.trim(),
            telefone: dados.telefoneContato,
            perfil: "responsavel",
            instituicaoId: null,
            ativo: true
        };

        if (dados.emailContato !== undefined) {
            dadosResponsavel.email = dados.emailContato;
        }

        session = await mongoose.startSession();

        let usuarioCriado;
        let pacienteCriado;

        // Cria responsável e paciente na mesma transação.
        await session.withTransaction(async () => {

            const usuarios = await Usuario.create(
                [dadosResponsavel],
                { session }
            );

            usuarioCriado = usuarios[0];

            const pacientes = await Paciente.create(
                [
                    {
                        nomeCompleto: dados.nomeCompleto.trim(),
                        dataNascimento: new Date(
                            `${dados.dataNascimento}T00:00:00.000Z`
                        ),
                        responsavelId: usuarioCriado._id
                    }
                ],
                { session }
            );

            pacienteCriado = pacientes[0];
        });

        // Gera o token JWT do responsável.
        const token = jwt.sign(
            { id: String(usuarioCriado._id) },
            process.env.JWT_SECRET,
            {
                algorithm: "HS256",
                expiresIn: "1h"
            }
        );

        return res.status(201).json({
            message: "Responsável e paciente cadastrados com sucesso.",
            token,

            usuario: usuarioPublico(usuarioCriado),

            paciente: {
                _id: pacienteCriado._id,
                nomeCompleto: pacienteCriado.nomeCompleto,
                dataNascimento: pacienteCriado.dataNascimento,
                responsavelId: pacienteCriado.responsavelId,
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

        console.error(
            "Erro ao cadastrar responsável e primeiro paciente."
        );

        return res.status(500).json({
            message: "Não foi possível realizar o cadastro."
        });

    } finally {
        if (session) {
            await session.endSession();
        }
    }
}

// Login utilizado por todos os perfis.
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

        console.error("Erro ao autenticar usuário.");

        return res.status(500).json({
            message: "Não foi possível realizar o login."
        });
    }
}

// Retorna os dados da conta autenticada.
function obterUsuarioAutenticado(req, res) {
    return res.status(200).json({
        message: "Usuário autenticado.",
        usuario: req.usuario
    });
}

module.exports = {
    cadastrarResponsavel,
    login,
    obterUsuarioAutenticado
};
