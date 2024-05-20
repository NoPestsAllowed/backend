var express = require('express');
var router = express.Router();
const User = require('../models/users');
const Deposition = require('../models/depositions');
//const Place = require('../models/place');
const { checkBody } = require('../modules/checkBody');

router.post('/create', (req, res) => {
if (!checkBody(req.body, ['token', 'content'])) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }
  User.findOne({ token: req.body.token }).then(user =>{
    if (user === null) {
        res.json({ result: false, error: "User not found" });
        return;
    }
    const newDeposition = new Deposition({
        name: req.body.name,
        description: req.body.description,
        userId: user._id,
        placeId: place._id,
    })
  })
})

router.get('/', (req, res) => {
    Deposition.find().then(data => {
        res.json({result: true, data});
    })
    
})

// faire une delete 

module.exports = router;