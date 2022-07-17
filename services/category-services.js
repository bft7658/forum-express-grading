const { Category, Restaurant } = require('../models')

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
  },
  putCategory: (req, cb) => {
    const { name } = req.body
    if (!name) throw new Error('Category name is required!')
    return Category.findByPk(req.params.id)
      .then(category => {
        if (!category) throw new Error("Category doesn't exist!")
        return category.update({ name })
      })
      .then(putCategory => cb(null, { category: putCategory }))
      .catch(err => cb(err))
  },
  deleteCategory: (req, cb) => {
    return Promise.all([
      Category.findByPk(req.params.id),
      Category.findOne({
        where: { name: '(尚待分類)' },
        raw: true
      })
    ])
      .then(([categoryDelete, categoryUngrouped]) => {
        if (!categoryDelete) throw new Error("Category doesn't exist!")
        if (!categoryUngrouped) {
          req.flash('error_messages', "Category '(尚待分類)' doesn't exist!")
        }
        // 先將指定刪除分類裡包含的餐廳，轉移到尚待分類裡
        return Restaurant.update({ categoryId: categoryUngrouped.id }, {
          where: { categoryId: categoryDelete.id }
        })
          .then(() => {
            // 然後再將指定的分類刪除(此時裡面已經沒有餐廳了)
            return categoryDelete.destroy()
          })
      })
      .then(deleteCategory => cb(null, { category: deleteCategory }))
      .catch(err => cb(err))
  }
}

module.exports = categoryServices
