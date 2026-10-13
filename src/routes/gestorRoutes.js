
const express = require("express");

const authMiddleware = require("../middlewares/authMiddleware");
const autorizarPerfis = require("../middlewares/perfilMiddleware");

const {
    criarGestor,
    listarGestores,
    obterGestorPorId,
    atualizarGestor,
    desativarGestor
} = require("../controllers/gestorController");

const router = express.Router();

/**
 * @swagger
 * /api/gestores:
 *   get:
 *     summary: Lista contas de Gestores
 *     tags:
 *       - Gestores
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ativo
 *         required: false
 *         description: Informe true ou false. Outros valores retornam 400.
 *         schema:
 *           type: string
 *         example: "true"
 *     responses:
 *       200:
 *         description: Lista de gestores retornada com sucesso
 *       400:
 *         description: Filtro ativo inválido
 *       401:
 *         description: Token inválido ou ausente, ou conta inativa
 *       403:
 *         description: Perfil sem permissão
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
    "/",
    authMiddleware,
    autorizarPerfis("admin"),
    listarGestores
);

/**
 * @swagger
 * /api/gestores/{id}:
 *   get:
 *     summary: Consulta um Gestor pelo ID
 *     tags:
 *       - Gestores
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Identificador da conta de Gestor
 *         schema:
 *           type: string
 *         example: 6acd0358799d1d8d3f9971be
 *     responses:
 *       200:
 *         description: Gestor encontrado
 *       400:
 *         description: ID do gestor inválido
 *       401:
 *         description: Token inválido ou ausente, ou conta inativa
 *       403:
 *         description: Perfil sem permissão
 *       404:
 *         description: Gestor não encontrado
 *       500:
 *         description: Erro interno do servidor
 */

router.get(
    "/:id",
    authMiddleware,
    autorizarPerfis("admin"),
    obterGestorPorId
);

/**
 * @swagger
 * /api/gestores:
 *   post:
 *     summary: Cria uma conta de Gestor
 *     tags:
 *        - Cadastro de Gestores
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
 *         description: Token inválido ou ausente, ou conta inativa
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

/**
 * @swagger
 * /api/gestores/{id}:
 *   patch:
 *     summary: Atualiza uma conta Gestor
 *     description: Permite que um Administrador autenticado atualize o nome de usuário, a instituição vinculada ou o status da conta Gestor.
 *     tags: [Gestores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da conta Gestor
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
 *                 example: gestor.recife
 *               instituicaoId:
 *                 type: string
 *                 example: 6acc1e0db714754d0d7a6af6
 *               ativo:
 *                 type: boolean
 *                 example: true
 *             description: Informe apenas os campos que deseja atualizar.
 *     responses:
 *       200:
 *         description: Conta Gestor atualizada com sucesso
 *       400:
 *         description: ID ou dados inválidos, corpo vazio ou campo não permitido
 *       401:
 *         description: Token ausente, inválido ou expirado
 *       403:
 *         description: Usuário autenticado sem permissão de Administrador
 *       404:
 *         description: Gestor ou instituição não encontrada
 *       409:
 *         description: Nome de usuário duplicado ou instituição inativa
 *       500:
 *         description: Erro interno do servidor
 */
router.patch(
    "/:id",
    authMiddleware,
    autorizarPerfis("admin"),
    atualizarGestor
);

/**
 * @swagger
 * /api/gestores/{id}:
 *   delete:
 *     summary: Desativa uma conta Gestor
 *     description: Desativa logicamente uma conta Gestor, preservando seu registro no banco de dados. Se a conta já estiver desativada, retorna sucesso sem atualizá-la novamente.
 *     tags: [Gestores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da conta Gestor
 *     responses:
 *       200:
 *         description: Conta desativada ou já desativada
 *       400:
 *         description: ID do Gestor inválido
 *       401:
 *         description: Token ausente, inválido ou expirado
 *       403:
 *         description: Usuário sem permissão de Administrador
 *       404:
 *         description: Gestor não encontrado
 *       500:
 *         description: Erro interno do servidor
 */

router.delete(
    "/:id",
    authMiddleware,
    autorizarPerfis("admin"),
    desativarGestor
);


module.exports = router;
