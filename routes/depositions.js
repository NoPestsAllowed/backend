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
    User.findOne({ token: req.body.token }).then(user => {
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
        res.json({ result: true, data });
    })


    // Supprimer une déposition
    router.delete('/delete', (req, res) => {
        if (!checkBody(req.body, ['token', 'depositionId'])) {
          res.json({ result: false, error: 'Missing or empty fields' });
          return;
        }
      
        User.findOne({ token: req.body.token }).then(user => {
          if (user === null) {
            res.json({ result: false, error: 'User not found' });
            return;
          }
      
      Deposition.findById(req.body.depositionId)
        .populate('userId')
        .populate('placeId')
        .then(deposition => {
          if (!deposition) {
            res.json({ result: false, error: 'Deposition not found' });
            return;
          } else if (String(deposition.userId._id) !== String(user._id)) { // ObjectId needs to be converted to string (JavaScript cannot compare two objects)
            res.json({ result: false, error: 'Deposition can only be deleted by its author' });
            return;
          }
      
          Deposition.deleteOne({ _id: deposition._id }).then(() => {
            res.json({ result: true });
          });
        });
        });
      });

})



module.exports = router;