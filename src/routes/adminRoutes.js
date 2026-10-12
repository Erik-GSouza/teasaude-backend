
const express = require("express");

const authMiddleware = require("../middlewares/authMiddleware");
const autorizarPerfis = require("../middlewares/perfilMiddleware");

const {
    criarAdmin,
    listarAdmins
} = require("../controllers/adminController");

const router = express.Router();

/**
 * @swagger
 * /api/admins:
 *   post:
 *     summary: Cria uma conta de administrador
 *     tags:
 *       - Administradores
 *     security:
 *       - bearerAuth: []
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
 *                 minLength: 3
 *                 maxLength: 30
 *                 example: admin.novo
 *               senha:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *     responses:
 *       201:
 *         description: Conta Admin criada
 *       400:
 *         description: Dados inválidos ou campos não permitidos
 *       401:
 *         description: Token inválido ou ausente
 *       403:
 *         description: Perfil sem permissão
 *       409:
 *         description: Nome de usuário já cadastrado
 *       500:
 *         description: Erro interno do servidor
 */
router.post(
    "/",
    authMiddleware,
    autorizarPerfis("admin"),
    criarAdmin
);

/**
 * @swagger
 * /api/admins:
 *   get:
 *     summary: Lista as contas de administradores
 *     tags:
 *       - Administradores
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ativo
 *         required: false
 *         description: Filtra contas pelo estado de ativação
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lista de administradores
 *       400:
 *         description: Filtro ativo inválido
 *       401:
 *         description: Token ausente, inválido ou conta inativa
 *       403:
 *         description: Perfil sem permissão
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
    "/",
    authMiddleware,
    autorizarPerfis("admin"),
    listarAdmins
);

module.exports = router;

