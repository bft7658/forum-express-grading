const { Category, Restaurant } = require('../../models')

const categoryController = {
  getCategories: (req, res, next) => {
    return Promise.all([
      Category.findAll({ raw: true }),
      req.params.id ? Category.findByPk(req.params.id, { raw: true }) : null
    ])
      .then(([categories, category]) => {
        res.render('admin/categories', {
          categories,
          category
        })
      })
      .catch(err => next(err))
  },
  postCategories: (req, res, next) => {
    const { name } = req.body
    if (!name) throw new Error('Category name is required!')
    return Category.findOne({ where: { name } })
      .then(existedName => {
        if (existedName) throw new Error('Category name already exists')
        return Category.create({ name })
      })
      .then(() => res.redirect('/admin/categories'))
      .catch(err => next(err))
  },
  putCategory: (req, res, next) => {
    const { name } = req.body
    if (!name) throw new Error('Category name is required!')
    return Category.findByPk(req.params.id)
      .then(category => {
        if (!category) throw new Error("Category doesn't exist!")
        return category.update({ name })
      })
      .then(() => res.redirect('/admin/categories'))
      .catch(err => next(err))
  },
  deleteCategory: (req, res, next) => {
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
      .then(() => {
        req.flash('success_messages', 'Category deleted. Related restaurants are updated to (尚待分類)!')
        res.redirect('/admin/categories')
      })
      .catch(err => next(err))
  }
}
module.exports = categoryController
