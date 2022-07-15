const { Category } = require('../models')

const categoryServices = {
  getCategories: (req, cb) => {
    return Promise.all([
      Category.findAll({ raw: true }),
      req.params.id ? Category.findByPk(req.params.id, { raw: true }) : null
    ])
      .then(([categories, category]) => {
        return cb(null, {
          categories,
          category
        })
      })
      .catch(err => cb(err))
  },
  postCategories: (req, cb) => {
    const { name } = req.body
    if (!name) throw new Error('Category name is required!')
    return Category.findOne({ where: { name } })
      .then(existedName => {
        if (existedName) throw new Error('Category name already exists')
        return Category.create({ name })
      })
      .then(newCategory => cb(null, { category: newCategory }))
      .catch(err => cb(err))
  }
}

module.exports = categoryServices
