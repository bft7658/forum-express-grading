const { Restaurant, Category, Comment, User, Favorite, sequelize } = require('../models')
const { getOffset, getPagination } = require('../helpers/pagination-helper')

const restaurantServices = {
  getRestaurants: (req, cb) => {
    const DEFAULT_LIMIT = 9

    const categoryId = Number(req.query.categoryId) || ''

    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || DEFAULT_LIMIT
    const offset = getOffset(limit, page)

    Promise.all([
      Restaurant.findAndCountAll({
        include: Category,
        where: {
          ...categoryId ? { categoryId } : {}
        },
        limit,
        offset,
        nest: true,
        raw: true
      }),
      Category.findAll({ raw: true })
    ])
      .then(([restaurants, categories]) => {
        // 先看 req.user?.FavoritedRestaurants，這裡判斷 req.user 是否存在。不存在的話，會回傳 undefined ，存在的話會得到 req.user.FavoritedRestaurants
        // undefined ? req.user.FavoritedRestaurants.map(fr => fr.id) : []：得到空陣列
        // req.user.FavoritedRestaurants ? req.user.FavoritedRestaurants.map(fr => fr.id) : []：執行 map()
        const favoritedRestaurantsId = req.user?.FavoritedRestaurants ? req.user.FavoritedRestaurants.map(fr => fr.id) : []
        const likedRestaurantsId = req.user?.LikedRestaurants ? req.user.LikedRestaurants.map(lr => lr.id) : []

        const data = restaurants.rows.map(r => ({
          ...r,
          description: r.description.substring(0, 50),
          isFavorited: favoritedRestaurantsId.includes(r.id),
          isLiked: likedRestaurantsId.includes(r.id)
        }))
        return cb(null, {
          restaurants: data,
          categories,
          categoryId,
          pagination: getPagination(limit, page, restaurants.count)
        })
      })
      .catch(err => cb(err))
  },
  getRestaurant: (req, cb) => {
    return Restaurant.findByPk(req.params.id, {
      include: [
        Category,
        { model: Comment, include: User },
        { model: User, as: 'FavoritedUsers' },
        { model: User, as: 'LikedUsers' }
      ],
      order: [
        [{ model: Comment }, 'createdAt', 'DESC']
      ]
    })
      .then(restaurant => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")
        return restaurant.increment('viewCounts')
      })
      .then(restaurant => {
        const isFavorited = restaurant.FavoritedUsers.some(fu => fu.id === req.user.id)
        const isLiked = restaurant.LikedUsers.some(lu => lu.id === req.user.id)
        return cb(null, {
          restaurant: restaurant.toJSON(),
          isFavorited,
          isLiked
        })
      })
      .catch(err => cb(err))
  },
  getFeeds: (req, cb) => {
    return Promise.all([
      Restaurant.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [Category],
        raw: true,
        nest: true
      }),
      Comment.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [User, Restaurant],
        raw: true,
        nest: true
      })
    ])
      .then(([restaurants, comments]) => {
        const data = restaurants.map(r => ({
          ...r,
          name: r.name.substring(0, 15) + '...',
          description: r.description.substring(0, 30) + '...'
        }))
        const result = comments.map(c => ({
          ...c,
          text: c.text.substring(0, 20) + '...'
        }))
        return cb(null, {
          restaurants: data,
          comments: result
        })
      })
      .catch(err => cb(err))
  },
  getTopRestaurants: (req, cb) => {
    return Favorite.findAll({
      attributes: {
        include: [
          [sequelize.fn('COUNT', sequelize.col('restaurant_id')), 'counts']
        ]
      },
      include: [Restaurant],
      group: ['restaurant_id'],
      order: [[sequelize.col('counts'), 'DESC'], ['restaurantId', 'ASC']],
      limit: 10,
      raw: true,
      nest: true
    })
      .then(favoriteRestaurants => {
        const result = favoriteRestaurants.map(r => ({
          counts: r.counts,
          ...r.Restaurant,
          description: r.Restaurant.description.substring(0, 50),
          isFavorited: req.user && req.user.FavoritedRestaurants.some(fr => fr.id === r.Restaurant.id)
        }))
        return cb(null, { restaurants: result })
      })
      .catch(err => cb(err))
  },
  getDashboard: (req, cb) => {
    return Restaurant.findByPk(req.params.id, {
      include: [
        Category,
        Comment,
        { model: User, as: 'FavoritedUsers' },
        { model: User, as: 'LikedUsers' }
      ]
    })
      .then(restaurant => {
        if (!restaurant) throw new Error("Dashboard didn't exist!")
        return cb(null, { restaurant: restaurant.toJSON() })
      })
      .catch(err => cb(err))
  }
}

module.exports = restaurantServices
