const express = require("express")
const authenticate = require("../middleware/authenticate")

const router = express.Router()

router.use(authenticate)

module.exports = router
