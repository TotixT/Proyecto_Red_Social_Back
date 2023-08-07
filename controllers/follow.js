// Importar modelo

const Follow = require('../models/follow.js');
const User = require('../models/user.js');

// Importar Servicio

const followService = require('../services/followService.js');

// Importar dependencias

const mongoosePaginate = require('mongoose-pagination');

// Acciones de prueba
const pruebaFollow = (req, res) =>{
    return res.status(200).send({
        msg: "Mensaje enviado desde: controllers/follow.js"
    });
}

// Accion de guardar un follow (Accion Seguir)

const save = (req, res) => {

    // Conseguir datos por body

    const params = req.body;

    // Sacar id del usuario identificado

    const identity = req.user;

    // Crear objeto con modelo follow
    // Forma 1
    // let userToFollow = new Follow();
    // userToFollow.user = identity.id;
    // userToFollow.followed = params.followed;
    // Forma 2
    let userToFollow = new Follow({
        user: identity.id,
        followed: params.followed
    });

    // Guardar objeto en la BD

    userToFollow.save((error, followStored) => {
        
        if(error || !followStored){
            return res.status(500).send({
                status: "error",
                msg: "No se ha podido seguir al usuario"
            });
        }

        return res.status(200).send({
            status: "Success",
            identity: req.user,
            follow: followStored
        });

    })

    
}

// Accion de borrar un follow (Accion Dejar de seguir)

const unfollow = (req, res) => {
    
    // Recoger el id del usuario identificado

    const userId = req.user.id;

    // Recoger el id del usuario que sigo y quiero dejar de seguir

    const followedId = req.params.id;

    // Find de las coincidencias y hacer remove

    Follow.find({
        "user": userId,
        "followed": followedId
    }).remove((error, followDeleted) => {

        if(error || !followDeleted){
            return res.status(500).send({
                status: "error",
                msg: "No has dejado de seguir a nadie"
            });
        }

        return res.status(200).send({
            status: "Success",
            msg: "Follow Eliminado Correctamente"
        });
    });

}

// Accion listado de usuarios que cualquier usuario esta siguiendo (siguiendo)

const following = (req, res) => {

    // Sacar el id del usuario identificado

    let userId = req.user.id;

    // Comprobar si me llega el id por parametro en url

    if(req.params.id) userId = req.params.id;

    // Comprobar si me llega la pagina, si no la pagina 1

    let page = 1;

    if(req.params.page) page = req.params.page;
    
    // Usuarios por pagina quiero mostrar

    const itemsPerPage = 5;

    // Find a follow, popular datos de los usuarios y paginar con mongoose pagination

    Follow.find({ user: userId })
        .populate("user followed", "-password -role -__v -email")
        .paginate(page, itemsPerPage, async (error, follows, total) => {

            // Listado de usuarios de Cristian, y yo soy Santiago
            // Sacar un array de ids de los usuarios que me siguen y los que sigo como Santiago
            let followUserIds = await followService.followUserIds(req.user.id);


            return res.status(200).send({
                status: "Success",
                msg: "Listado de usuarios que estoy siguiendo",
                follows,
                total,
                pages: Math.ceil(total/itemsPerPage),
                user_following: followUserIds.following,
                user_follow_me: followUserIds.followers 
            });

        })

}

// Accion del listado de usuarios que me siguen a cualquier otro usuario (soy seguido, mis seguidores)

const followers = (req, res) => {

    // Sacar el id del usuario identificado

    let userId = req.user.id;

    // Comprobar si me llega el id por parametro en url

    if(req.params.id) userId = req.params.id;

    // Comprobar si me llega la pagina, si no la pagina 1

    let page = 1;

    if(req.params.page) page = req.params.page;
    
    // Usuarios por pagina quiero mostrar

    const itemsPerPage = 5;

    Follow.find({ followed: userId })
        .populate("user", "-password -role -__v -email")
        .paginate(page, itemsPerPage, async (error, follows, total) => {

            let followUserIds = await followService.followUserIds(req.user.id);

            return res.status(200).send({
                status: "Success",
                msg: "Listado de usuarios que me siguen",
                follows,
                total,
                pages: Math.ceil(total/itemsPerPage),
                user_following: followUserIds.following,
                user_follow_me: followUserIds.followers 
            });

        })

}

// Exportar acciones
module.exports = {
    pruebaFollow,
    save,
    unfollow,
    following,
    followers
}