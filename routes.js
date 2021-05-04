const express = require("express")
const Room = require("./models/RoomModel") // new
const router = express.Router()

// Get all posts
router.get("/rooms", async (req, res) => {
    const posts = await Room.find()
    res.send(posts)
})

// router.post("/rooms", async (req, res) => {
//     const post = new Post({
//         title: req.body.title,
//         content: req.body.content,
//     })
//     await post.save()
//     res.send(post)
// })

router.get("/rooms/:name", async (req, res) => {
    const room = await Room.findOne({ name: req.params.name })
    res.send(room);
})

module.exports = router
