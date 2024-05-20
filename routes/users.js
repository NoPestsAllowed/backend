var express = require('express');
var router = express.Router();
const User = require('../models/users');
const bcrypt = require("bcryptjs");

/* GET users listing. */
router.get('/', function(req, res, next) {
  User.find().then(data => {
    res.json(data);
  })
});

router.put('/update/:id', (req, res) => {
  const id = req.params.id;
  const { firstname, lastname, dateOfBirth, password, avatarUrl} = req.body;

  let hashedPassword;
  if (password) {
    hashedPassword =  bcrypt.hashSync(password, 10);
  }

  User.updateOne({_id: id}, 
    {firstname: firstname, lastname: lastname, dateOFBirth: dateOfBirth, password: hashedPassword ? hashedPassword : undefined, avatarUrl: avatarUrl})
    .then(response => {

      console.log(response);
      if (response.modifiedCount === 1) {
      res.status(200).json({ result: true, message: "Informations mises à jour avec succès" });
    } else {
      res.status(400).json({ result: false, error: "Vos modifications n'ont pas été prises en compte" });
    }
    })
})


router.delete('/delete/:id', (req, res) => {
  const id = req.params.id;

  User.deleteOne({_id:id}).then(deletedDoc => {
    if (deletedDoc.deletedCount > 0) { 
        res.status(200).json({ message: "Votre compte a bien été supprimé" });
        // res.redirect('/');
    } else {
        res.status(400).json({ result: false, error: "Ce compte n'existe pas" });
    }
});
});

module.exports = router;
