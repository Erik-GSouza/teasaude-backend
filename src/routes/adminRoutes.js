
const express = require("express");

const authMiddleware = require("../middlewares/authMiddleware");
const autorizarPerfis = require("../middlewares/perfilMiddleware");

const {
    criarAdmin,
    listarAdmins,
    obterAdminPorId,
    atualizarAdmin
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

/**
 * @swagger
 * /api/admins/{id}:
 *   get:
 *     summary: Consulta um administrador pelo ID
 *     tags:
 *       - Administradores
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da conta de administrador
 *     responses:
 *       200:
 *         description: Administrador encontrado
 *       400:
 *         description: ID do administrador inválido
 *       401:
 *         description: Token ausente, inválido ou conta inativa
 *       403:
 *         description: Perfil sem permissão
 *       404:
 *         description: Administrador não encontrado
 *       500:
 *         description: Erro interno do servidor
 */

router.get(
    "/:id",
    authMiddleware,
    autorizarPerfis("admin"),
    obterAdminPorId
);

/**
 * @swagger
 * /api/admins/{id}:
 *   patch:
 *     summary: Atualiza uma conta de administrador
 *     description: Permite atualizar o nome de usuário ou o estado de ativação de um administrador.
 *     tags:
 *       - Administradores
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID da conta de administrador
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             additionalProperties: false
 *             properties:
 *               nomeUsuario:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *                 example: admin.atualizado
 *               ativo:
 *                 type: boolean
 *                 example: true
 *             description: Informe apenas os campos que deseja atualizar.
 *     responses:
 *       200:
 *         description: Conta atualizada com sucesso
 *       400:
 *         description: ID ou dados inválidos, corpo vazio ou campo não permitido
 *       401:
 *         description: Token ausente, inválido ou expirado
 *       403:
 *         description: Perfil sem permissão de administrador
 *       404:
 *         description: Administrador não encontrado
 *       409:
 *         description: Nome duplicado, tentativa de auto-desativação ou último administrador ativo
 *       500:
 *         description: Erro interno do servidor
 */

router.patch(
    "/:id",
    authMiddleware,
    autorizarPerfis("admin"),
    atualizarAdmin
);

module.exports = router;

