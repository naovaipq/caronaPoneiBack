// API REST das Caronas
import express from 'express'
import { connectToDatabase } from '../utils/mongodb.js'
import { check, validationResult } from 'express-validator'

const router = express.Router()
const nomeCollection = 'caronas'
const { db, ObjectId } = await connectToDatabase()

/**********************************************
 * Validações
 * 
 **********************************************/
const validaCarona = [
  check('ponei')
    .not()
    .isEmpty().withMessage('É obrigatório informar o nome do ponei')
    .isLength({ min: 5, max: 250 }).withMessage('O tamanho do Nome informado é inválido.'),
  check('data', 'A data de início de atividade é inválida')
    .optional({ nullable: true })
    .isDate({ format: 'YYYY-MM-DD' }),
  check('horario')
    .not()
    .isEmpty().withMessage('É obrigatório informar o horário da carona'),
  check('logradouro_origem')
    .not()
    .isEmpty().withMessage('É obrigatório informar o logradouro de origem da carona'),
  check('logradouro_destino')
    .not()
    .isEmpty().withMessage('É obrigatório informar o logradouro de destino da carona'),
  check('preco')
    .not()
    .isEmpty().withMessage('É obrigatório informar o preco da carona')
    .isNumeric()
]


check('text_settings_descriptions.*.value')

/**********************************************
 * GET /api/prestadores
 **********************************************/
router.get('/', async (req, res) => {
  /* 
   #swagger.tags = ['Prestadores']
   #swagger.description = 'Endpoint para obter todos os Prestadores de Serviço do sistema.' 
   */
  try {
    db.collection(nomeCollection).find({}, {
      projection: { senha: false }
    }).sort({ nome: 1 }).toArray((err, docs) => {
      if (!err) {
        /* 
        #swagger.responses[200] = { 
     schema: { "$ref": "#/definitions/Prestadores" },
     description: "Listagem dos prestadores de serviço obtida com sucesso" } 
     */
        res.status(200).json(docs)
      }
    })
  } catch (err) {
    /* 
       #swagger.responses[500] = { 
    schema: { "$ref": "#/definitions/Erro" },
    description: "Erro ao obter a listagem dos prestadores" } 
    */
    res.status(500).json({
      errors: [
        {
          value: `${err.message}`,
          msg: 'Erro ao obter a listagem dos prestadores de serviço',
          param: '/'
        }
      ]
    })
  }
})

/**********************************************
 * GET /prestadores/id/:id
 **********************************************/
router.get("/id/:id", async (req, res) => {
  /* #swagger.tags = ['Prestadores']
  #swagger.description = 'Endpoint que retorna os dados do prestador filtrando pelo id' 
  */
  try {
    db.collection(nomeCollection).find({ "_id": { $eq: ObjectId(req.params.id) } }).toArray((err, docs) => {
      if (err) {
        res.status(400).json(err) //bad request
      } else {
        res.status(200).json(docs) //retorna o documento
      }
    })
  } catch (err) {
    res.status(500).json({ "error": err.message })
  }
})

/**********************************************
 * GET /prestadores/razao/:razao
 **********************************************/
router.get("/razao/:razao", async (req, res) => {
  /* #swagger.tags = ['Prestadores']
    #swagger.description = 'Endpoint que retorna os dados do prestador filtrando por parte da Razão Social' 
    */
  try {
    db.collection(nomeCollection).find({ razao_social: { $regex: req.params.razao, $options: "i" } }).toArray((err, docs) => {
      if (err) {
        res.status(400).json(err) //bad request
      } else {
        res.status(200).json(docs) //retorna o documento
      }
    })
  } catch (err) {
    res.status(500).json({ "error": err.message })
  }
})

/**********************************************
 * POST /prestadores/
 **********************************************/
router.post('/', validaCarona, async (req, res) => {
  /* #swagger.tags = ['Prestadores']
    #swagger.description = 'Endpoint que inclui um novo prestador' 
    */
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json(({
      errors: errors.array()
    }))
  } else {
    await db.collection(nomeCollection)
      .insertOne(req.body)
      .then(result => res.status(201).send(result)) //retorna o ID do documento inserido)
      .catch(err => res.status(400).json(err))
  }
})

/**********************************************
 * PUT /prestadores
 * Alterar um prestador pelo ID
 **********************************************/
router.put('/', validaCarona, async (req, res) => {
  let idDocumento = req.body._id
  delete req.body._id //removendo o ID do body para o update não apresentar o erro 66
  /* #swagger.tags = ['Prestadores']
    #swagger.description = 'Endpoint que permite alterar os dados do prestador pelo id' 
    */
  const schemaErrors = validationResult(req)
  if (!schemaErrors.isEmpty()) {
    return res.status(403).json(({
      errors: schemaErrors.array() //retorna um Forbidden
    }))
  } else {
    await db.collection(nomeCollection)
      .updateOne({ '_id': { $eq: ObjectId(idDocumento) } },
        { $set: req.body }
      )
      .then(result => res.status(202).send(result))
      .catch(err => res.status(400).json(err))
  }
})

/**********************************************
 * DELETE /prestadores/
 **********************************************/
router.delete('/:id', async (req, res) => {
  /* #swagger.tags = ['Prestadores']
    #swagger.description = 'Endpoint que permite excluir um prestador filtrando pelo id' 
    */
  await db.collection(nomeCollection)
    .deleteOne({ "_id": { $eq: ObjectId(req.params.id) } })
    .then(result => res.status(202).send(result))
    .catch(err => res.status(400).json(err))
})

export default router