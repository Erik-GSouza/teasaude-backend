
const express = require("express");

const authMiddleware = require("../middlewares/authMiddleware");
const autorizarPerfis = require("../middlewares/perfilMiddleware");

const {
    criarGestor
} = require("../controllers/gestorController");

const router = express.Router();

/**
 * @swagger
 * /api/gestores:
 *   post:
 *     summary: Cria uma conta de Gestor
 *     tags:
 *       - Gestores
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
 *               - instituicaoId
 *             properties:
 *               nomeUsuario:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *                 example: gestor.clinica
 *               senha:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *               instituicaoId:
 *                 type: string
 *                 example: 6acc1e0db714754d0d7a6af6
 *     responses:
 *       201:
 *         description: Conta Gestor criada
 *       400:
 *         description: Dados inválidos ou campos não permitidos
 *       401:
 *         description: Token inválido ou ausente
 *       403:
 *         description: Perfil sem permissão
 *       404:
 *         description: Instituição não encontrada
 *       409:
 *         description: Nome de usuário duplicado ou instituição inativa
 *       500:
 *         description: Erro interno do servidor
 */
router.post(
    "/",
    authMiddleware,
    autorizarPerfis("admin"),
    criarGestor
);

module.exports = router;
