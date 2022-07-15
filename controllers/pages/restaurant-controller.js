const { Restaurant, Category, Comment, User, sequelize, Favorite } = require('../../models')
const restaurantServices = require('../../services/restaurant-services')

const restaurantController = {
  getRestaurants: (req, res, next) => {
    restaurantServices.getRestaurants(req, (err, data) => err ? next(err) : res.render('restaurants', data))
  },
  getRestaurant: (req, res, next) => {
    restaurantServices.getRestaurant(req, (err, data) => err ? next(err) : res.render('restaurant', data))
  },
  getDashboard: (req, res, next) => {
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
        res.render('dashboard', { restaurant: restaurant.toJSON() })
      })
      .catch(err => next(err))
  },
  getFeeds: (req, res, next) => {
    restaurantServices.getFeeds(req, (err, data) => err ? next(err) : res.render('feeds', data))
  },
  getTopRestaurants: (req, res, next) => {
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
        res.render('top-restaurants', { restaurants: result })
      })
      .catch(err => next(err))
  }
}
module.exports = restaurantController
