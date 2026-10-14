
const swaggerJsdoc = require("swagger-jsdoc");

const urlRender = process.env.RENDER_EXTERNAL_URL
    ? process.env.RENDER_EXTERNAL_URL.replace(/\/+$/, "")
    : null;


const servidores = urlRender
    ? [
        {
            url: urlRender,
            description: "Servidor no Render"
        },
        {
            url: "http://localhost:3000",
            description: "Servidor local"
        }
    ]
    : [
        {
            url: "http://localhost:3000",
            description: "Servidor local"
        }
    ];

const options = {
    definition: {
        openapi: "3.0.0",

        info: {
            title: "API - Projeto Integrador Saúde Mental (TEA)",
            version: "1.0.0",
            description:
                "Backend desenvolvido em Node.js para o Projeto Integrador do curso de Análise e Desenvolvimento de Sistemas (SENAC)."
        },

        servers: servidores,

        tags: [
            {
                name: "Autenticação",
                description:
                    "Operações relacionadas ao login e à autenticação."
            },
            {
                name: "Administradores",
                description:
                    "Operações administrativas do TeaSaúde."
            },
            {
                name: "Gestores",
                description:
                    "Operações relacionadas às contas de Gestores."
            },
            {
                name: "Cadastro de Gestores",
                description:
                    "Operações relacionadas ao cadastro de Gestores."
            },
            {
                name: "Médicos",
                description:
                    "Operações de consulta de médicos e profissionais disponíveis."
            },
            {
                name: "Pacientes",
                description:
                    "Operações relacionadas ao cadastro e à gestão de pacientes."
            },
            {
                name: "Agendamentos",
                description:
                    "Operações relacionadas ao agendamento e à consulta de consultas dos pacientes."
            }
        ],

        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description:
                        "Informe o token JWT obtido no endpoint de login."
                }
            }
        }
    },

    apis: ["./src/routes/*.js"]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
