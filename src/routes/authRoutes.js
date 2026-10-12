const express = require("express");

const {
    login,
    obterUsuarioAutenticado
} = require("../controllers/authController");

const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

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