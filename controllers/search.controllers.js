const { response } = require('express');
const { ObjectId } = require('mongoose').Types;

const User = require('../models/user.js');

const allowedCollections = [
    'users'
]

const searchUsers = async( criterio = '', res = response ) => {

    const isMongoID = ObjectId.isValid(criterio);

    if(isMongoID){
        const user = await User.findById(criterio);
        return res.json({
            results: ( user ) ? [ user ] : []
        });
    }

    const regex = new RegExp( criterio, 'i' );
    const users = await User.find({
        $or: [{ name: regex }, { nick: regex } , {email: regex}]
    });

    res.json({
        results: users
    });

}

const search = (req, res = response) => {

    const { coleccion, criterio } = req.params;
    if(!allowedCollections.includes(coleccion)){
        return res.status(400).json({
            msg: `El buscador solo permite las colecciones: ${allowedCollections}`
        })
    }

    switch(coleccion){
        case 'users':
            searchUsers(criterio, res);
        break;
        default:
            res.status(500).json({
                msg: 'This search doesnt exists'
            });
    }
}

module.exports = {
    search
}