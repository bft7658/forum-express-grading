// const bcrypt = require('bcryptjs')
const { User, Comment, Restaurant } = require('../models')
// const { imgurFileHandler } = require('../../helpers/file-helpers')

const userServices = {
  getUser: (req, cb) => {
    Promise.all([
      User.findByPk(req.params.id, {
        include: [
          { model: Comment, include: Restaurant },
          { model: Restaurant, as: 'FavoritedRestaurants' },
          { model: User, as: 'Followers' },
          { model: User, as: 'Followings' }
        ],
        order: [
          [{ model: Comment }, 'createdAt', 'DESC']
        ]
      }),
      // 將重複留言的餐廳進行篩選，使其合併代表同一間餐廳
      Comment.findAll({
        include: Restaurant,
        where: { userId: req.params.id },
        group: ['restaurant_id'],
        nest: true,
        raw: true
      })
    ])
      .then(([user, commentedRestaurants]) => {
        if (!user) throw new Error("User didn't exist!")
        // 判斷目前登入使用者是否已追蹤該 user 物件
        const isFollowed = req.user.Followings.some(f => f.id === user.id)
        cb(null, {
          user: user.toJSON(),
          commentedRestaurants,
          isFollowed
        })
      })
      .catch(err => cb(err))
  }
}

module.exports = userServices
