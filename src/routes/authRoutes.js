
const express = require("express");

const {
    cadastrarResponsavel,
    login,
    obterUsuarioAutenticado
} = require("../controllers/authController");

const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * /api/auth/cadastro:
 *   post:
 *     summary: Cadastra um responsável e seu primeiro paciente
 *     description: Cria a conta do responsável e o primeiro paciente de forma integrada.
 *     tags:
 *       - Autenticação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nomeUsuario
 *               - senha
 *               - nomeCompleto
 *               - dataNascimento
 *               - nomeContato
 *               - telefoneContato
 *             properties:
 *               nomeUsuario:
 *                 type: string
 *                 example: ana.silva
 *               senha:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: SenhaSegura2026!
 *               nomeCompleto:
 *                 type: string
 *                 description: Nome do primeiro paciente.
 *                 example: Pedro Silva
 *               dataNascimento:
 *                 type: string
 *                 format: date
 *                 example: "2015-04-20"
 *               nomeContato:
 *                 type: string
 *                 description: Nome completo do responsável.
 *                 example: Ana Paula Silva
 *               telefoneContato:
 *                 type: string
 *                 description: Telefone do responsável com DDD.
 *                 example: "81999998888"
 *               emailContato:
 *                 type: string
 *                 description: E-mail opcional do responsável.
 *                 example: ana@email.com
 *     responses:
 *       201:
 *         description: Responsável e primeiro paciente cadastrados.
 *       400:
 *         description: Dados inválidos ou campos não permitidos.
 *       409:
 *         description: Nome de usuário já cadastrado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.post("/cadastro", cadastrarResponsavel);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Autentica um usuário
 *     tags:
 *       - Autenticação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nomeUsuario
 *               - senha
 *             properties:
 *               nomeUsuario:
 *                 type: string
 *                 example: admin.teasaude
 *               senha:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login realizado com sucesso.
 *       400:
 *         description: Dados obrigatórios ausentes ou inválidos.
 *       401:
 *         description: Credenciais inválidas ou conta inativa.
 *       500:
 *         description: Erro interno do servidor.
 */
router.post("/login", login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Retorna os dados do usuário autenticado
 *     tags:
 *       - Autenticação
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados públicos do usuário autenticado.
 *       401:
 *         description: Token ausente, inválido, expirado ou conta inativa.
 *       500:
 *         description: Erro interno do servidor.
 */
router.get(
    "/me",
    authMiddleware,
    obterUsuarioAutenticado
);

module.exports = router;
