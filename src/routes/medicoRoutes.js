const express = require("express");

const authMiddleware = require("../middlewares/authMiddleware");
const autorizarPerfis = require("../middlewares/perfilMiddleware");

const {
    listarMedicos,
    buscarMedicoPorId,
    criarMedico,
    atualizarMedico,
    criarContaMedico
} = require("../controllers/medicoController");

const router = express.Router();


/**
 * @swagger
 * /api/medicos:
 *   get:
 *     summary: Lista médicos disponíveis
 *     description: Responsáveis consultam médicos de instituições ativas. Gestores consultam apenas profissionais da própria instituição. Admin possui acesso global.
 *     tags:
 *       - Médicos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: instituicaoId
 *         schema:
 *           type: string
 *         description: Filtra os médicos por instituição.
 *       - in: query
 *         name: especialidade
 *         schema:
 *           type: string
 *         description: Filtra pela especialidade.
 *     responses:
 *       200:
 *         description: Lista de médicos disponíveis.
 *       400:
 *         description: Filtro inválido.
 *       401:
 *         description: Token ausente ou inválido.
 *       403:
 *         description: Perfil sem permissão.
 *       409:
 *         description: Instituição do Gestor inativa ou não vinculada.
 *       500:
 *         description: Erro interno.
 */
router.get(
    "/",
    authMiddleware,
    autorizarPerfis("responsavel", "gestor", "admin"),
    listarMedicos
);

/**
 * @swagger
 * /api/medicos/{id}:
 *   get:
 *     summary: Consulta os detalhes de um médico
 *     tags:
 *       - Médicos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do médico.
 *     responses:
 *       200:
 *         description: Detalhes do médico e da instituição.
 *       400:
 *         description: ID inválido.
 *       401:
 *         description: Token ausente ou inválido.
 *       403:
 *         description: Perfil sem acesso ao médico.
 *       404:
 *         description: Médico não encontrado ou indisponível.
 *       500:
 *         description: Erro interno.
 */
router.get(
    "/:id",
    authMiddleware,
    autorizarPerfis("responsavel", "gestor", "admin"),
    buscarMedicoPorId
);


/**
 * @swagger
 * /api/medicos:
 *   post:
 *     summary: Cadastra um médico
 *     description: Gestor cadastra profissionais na própria instituição. Admin pode escolher qualquer instituição ativa.
 *     tags:
 *       - Médicos
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nomeCompleto
 *               - especialidade
 *             properties:
 *               nomeCompleto:
 *                 type: string
 *                 example: Dr. João Silva
 *               especialidade:
 *                 type: string
 *                 example: Psicologia
 *               instituicaoId:
 *                 type: string
 *                 description: Obrigatório somente para Admin. Gestor utiliza sua própria instituição.
 *                 example: "507f1f77bcf86cd799439011"
 *               modalidades:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example:
 *                   - Presencial
 *                   - Online
 *               orientacoesDocumentos:
 *                 type: string
 *                 example: Apresentar documentos de identificação e encaminhamentos disponíveis.
 *     responses:
 *       201:
 *         description: Médico cadastrado.
 *       400:
 *         description: Dados inválidos.
 *       401:
 *         description: Token ausente ou inválido.
 *       403:
 *         description: Perfil sem permissão.
 *       404:
 *         description: Instituição não encontrada.
 *       409:
 *         description: Instituição inativa.
 *       500:
 *         description: Erro interno.
 */
router.post(
    "/",
    authMiddleware,
    autorizarPerfis("gestor", "admin"),
    criarMedico
);

/**
 * @swagger
 * /api/medicos/{id}:
 *   patch:
 *     summary: Atualiza ou desativa um médico
 *     description: Gestor somente pode alterar profissionais da própria instituição. Admin possui acesso global.
 *     tags:
 *       - Médicos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nomeCompleto:
 *                 type: string
 *                 example: Dr. João Silva
 *               especialidade:
 *                 type: string
 *                 example: Psicologia
 *               modalidades:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example:
 *                   - Presencial
 *                   - Online
 *               orientacoesDocumentos:
 *                 type: string
 *               ativo:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Médico atualizado.
 *       400:
 *         description: Dados inválidos.
 *       401:
 *         description: Token ausente ou inválido.
 *       403:
 *         description: Médico fora do escopo do Gestor.
 *       404:
 *         description: Médico não encontrado.
 *       409:
 *         description: Instituição inativa.
 *       500:
 *         description: Erro interno.
 */
router.patch(
    "/:id",
    authMiddleware,
    autorizarPerfis("gestor", "admin"),
    atualizarMedico
);


/**
 * @swagger
 * /api/medicos/{id}/conta:
 *   post:
 *     summary: Cria uma conta de acesso para um médico
 *     description: Operação exclusiva do Admin. Cria o usuário com perfil medico e estabelece o vínculo com o cadastro profissional.
 *     tags:
 *       - Médicos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do cadastro profissional.
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
 *                 example: medico.joao
 *               senha:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: MedicoTeste2026!
 *     responses:
 *       201:
 *         description: Conta criada e vinculada ao médico.
 *       400:
 *         description: Dados inválidos.
 *       401:
 *         description: Token ausente ou inválido.
 *       403:
 *         description: Operação exclusiva do Admin.
 *       404:
 *         description: Médico não encontrado.
 *       409:
 *         description: Médico já possui conta, instituição inativa ou nome de usuário duplicado.
 *       500:
 *         description: Erro interno.
 */
router.post(
    "/:id/conta",
    authMiddleware,
    autorizarPerfis("admin"),
    criarContaMedico
);

module.exports = router;