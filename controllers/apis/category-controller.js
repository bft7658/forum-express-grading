const categoryServices = require('../../services/category-services')

const categoryController = {
  getCategories: (req, res, next) => {
    categoryServices.getCategories(req, (err, data) => err ? next(err) : res.json(data))
  },
  postCategories: (req, res, next) => {
    categoryServices.postCategories(req, (err, data) => err ? next(err) : res.json(data))
  }
}

module.exports = categoryController
