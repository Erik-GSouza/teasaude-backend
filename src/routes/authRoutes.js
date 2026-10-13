const express = require("express");

const {
    cadastrarPaciente,
    login,
    obterUsuarioAutenticado
} = require("../controllers/authController");

const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * /api/auth/cadastro:
 *   post:
 *     summary: Cadastra uma conta de paciente
 *     description: Cria a conta de acesso e o cadastro do paciente de forma integrada.
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
 *                 example: paciente.demo
 *               senha:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: TestePaciente2026!
 *               nomeCompleto:
 *                 type: string
 *                 example: Maria Eduarda Silva
 *               dataNascimento:
 *                 type: string
 *                 format: date
 *                 example: "2013-05-12"
 *               nomeContato:
 *                 type: string
 *                 example: Ana Paula Silva
 *               telefoneContato:
 *                 type: string
 *                 example: "81999998888"
 *               emailContato:
 *                 type: string
 *                 example: responsavel@exemplo.com
 *     responses:
 *       201:
 *         description: Conta e cadastro de paciente criados
 *       400:
 *         description: Dados inválidos ou campos não permitidos
 *       409:
 *         description: Nome de usuário já cadastrado
 *       500:
 *         description: Erro interno do servidor
 */
router.post("/cadastro", cadastrarPaciente);

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
 *                 example: "senha-de-teste-com-15-caracteres"
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *       400:
 *         description: Dados obrigatórios ausentes ou inválidos
 *       401:
 *         description: Credenciais inválidas ou conta inativa
 *       500:
 *         description: Erro interno do servidor
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
 *         description: Dados públicos do usuário autenticado
 *       401:
 *         description: Token ausente, inválido, expirado ou conta inativa
 *       500:
 *         description: Erro interno do servidor
 */
router.get("/me", authMiddleware, obterUsuarioAutenticado);


module.exports = router;