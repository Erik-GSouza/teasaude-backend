
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
    definition: {
        openapi: "3.0.0",

        info: {
            title: "API - Projeto Integrador Saúde Mental (TEA)",
            version: "1.0.0",
            description:
                "Backend desenvolvido em Node.js para o Projeto Integrador do curso de Análise e Desenvolvimento de Sistemas (SENAC)."
        },

        servers: [
            {
                url: "http://localhost:3000",
                description: "Servidor local"
            }
        ],

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
                    "Operações relacionadas a conta de Gestores."
            },
            {
                name: "Pacientes",
                description:
                    "Operações relacionadas ao cadastro de pacientes."
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
