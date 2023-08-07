// Importar dependencias

const bcrypt = require('bcrypt');
const mongoosePagination = require('mongoose-pagination');
const fs = require('fs');
const path = require('path');

// Importar modelos
const User = require('../models/user.js');
const Follow = require('../models/follow.js');
const Publication = require('../models/publication.js');


// Importar servicios

const jwt = require('../services/jwt.js');
const followService = require('../services/followService.js');
const validate = require("../helpers/validate.js");

// Acciones de prueba
const pruebaUser = (req, res) => {
    return res.status(200).send({
        msg: "Mensaje enviado desde: controllers/user.js",
        usuario: req.user
    });
}

// Registro de Usuarios 

const register = (req, res) => {

    // Recoger datos de la peticion

    const params = req.body;

    // Comprobar que llegan bien los datos (+ validacion)

    if (!params.name || !params.email || !params.password || !params.nick) {
        return res.status(400).json({
            status: "error",
            message: "Faltan datos por enviar"
        });
    }

    // Validación Avanzada
    try {
        validate(params);
    } catch (error) {
        return res.status(400).json({
            status: "error",
            message: "Validacion No Superada"
        });
    }
    

    // Control de usuarios duplicados 
    User.find({
        $or: [
            { email: params.email },
            { nick: params.nick }
        ]
    }).exec(async (error, users) => {

        if (error) return res.status(500).json({ status: "error", "msg": "Error en la Consulta de usuarios" });

        if (users && users.length >= 1) {
            return res.status(200).send({
                status: "error",
                msg: "El Usuario ya Existe"
            });

        }

        // Cifrar la contraseña 

        let pwd = await bcrypt.hash(params.password, 10);
        params.password = pwd;

        // Crear objeto de usuario 

        const user_to_save = new User(params);

        // Guardar usuario en la DB

        user_to_save.save((error, userStored) => {

            if (error || !userStored) return res.status(500).send({ status: "error", "msg": "Error al guardar el usuario" });

            // Devolver resultado

            return res.status(200).json({
                status: "success",
                message: "Usuario registrado Correctamente",
                user: userStored
            });

        });

    });

}

const login = (req, res) => {

    // Recoger parametros del body

    const params = req.body

    if (!params.email || !params.password) {
        return res.status(400).send({
            status: "error",
            msg: "Faltan datos por enviar"
        });
    }

    // Buscar en la base de datos si existe

    User.findOne({ email: params.email })
        // .select({"password": 0})
        .exec((error, user) => {

            if (error || !user) return res.status(400).send({ status: "error", msg: "No existe el usuario" });

            // Comprobar contraseña

            const pwd = bcrypt.compareSync(params.password, user.password);

            if (!pwd) {
                return res.status(400).send({
                    status: "error",
                    msg: "No te has identificado correctamente"
                });
            }

            // Conseguir Token 

            const token = jwt.createToken(user);

            // Devolver Datos del Usuario

            return res.status(200).send({
                status: "success",
                message: "Te has identificado Correctamente",
                user: {
                    id: user._id,
                    name: user.name,
                    nick: user.nick,
                },
                token
            });
        });
}

const profile = (req, res) => {

    // Recibir el parametro del id de usuario por la Url

    let id = req.params.id;

    // Consulta para sacar los datos del usuario
    // const userProfile = await User.findById(id);
    User.findById(id)
        .select({ password: 0, role: 0 })
        .exec(async (error, userProfile) => {
            if (error || !userProfile) {
                return res.status(404).send({
                    status: "error",
                    msg: "El usuario no existe o hay un error"
                });
            }

            // Informacion de seguimiento
            const followInfo = await followService.followThisUser(req.user.id, id);

            // Devolver resultado
            // Posteriormente: Devolver información de follows
            return res.status(200).send({
                status: "Success",
                user: userProfile,
                following: followInfo.following,
                follower: followInfo.follower
            });

        });

}

const list = (req, res) => {

    // Controlar en que pagina estamos

    let page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    page = parseInt(page);

    // Consulta con Mongoose paginate

    let itemsPerPage = 5;

    User.find().select("-password -email -role -__v").sort('_id').paginate(page, itemsPerPage, async (error, users, total) => {

        if (error || !users) {
            return res.status(404).send({
                status: "error",
                msg: "No hay usuarios disponibles",
                error
            });
        }

        // Sacar un array de ids de los usuarios que me siguen y los que sigo como Santiago
        let followUserIds = await followService.followUserIds(req.user.id);

        // Devolver resultado (posteriormente info follows) 
        return res.status(200).send({
            status: "Success",
            users,
            page,
            itemsPerPage,
            total,
            pages: Math.ceil(total / itemsPerPage),
            user_following: followUserIds.following,
            user_follow_me: followUserIds.followers
        });

    });

}

const update = (req, res) => {

    // Recoger info del usuario a actualizar

    let userIdentity = req.user;
    let userToUpdate = req.body;

    // Eliminar campos sobrantes

    delete userToUpdate.iat;
    delete userToUpdate.exp;
    delete userToUpdate.role;
    delete userToUpdate.image;

    // Comprobar si el usuario ya existe

    User.find({
        $or: [
            { email: userToUpdate.email.toLowerCase() },
            { nick: userToUpdate.nick.toLowerCase() }
        ]
    }).exec(async (error, users) => {

        if (error) return res.status(500).json({ status: "error", "msg": "Error en la Consulta de usuarios" });

        let userIsset = false;

        users.forEach(user => {
            if (user && user._id != userIdentity.id) userIsset = true;
        });

        if (userIsset) {
            return res.status(200).send({
                status: "success",
                msg: "El Usuario ya Existe"
            });

        }

        // Cifrar la contraseña 

        if (userToUpdate.password) {
            let pwd = await bcrypt.hash(userToUpdate.password, 10);
            userToUpdate.password = pwd;
        } else {
            delete userToUpdate.password;
        }

        // Buscar y actualizar

        try {

            let userUpdated = await User.findByIdAndUpdate({ _id: userIdentity.id }, userToUpdate, { new: true });

            if (!userUpdated) {
                return res.status(400).send({
                    status: "error",
                    msg: "Error al actualizar el usuario"
                });
            }

            // Devolver respuesta
            return res.status(200).send({
                status: "Success",
                msg: "Metodo de actualizar usuario",
                user: userUpdated
            });

        } catch (error) {
            return res.status(400).send({
                status: "error",
                msg: "Error al actualizar"
            });
        }

    });

}

const upload = (req, res) => {

    // Recoger el fichero de imagen y comprobar que existe

    if (!req.file) {
        return res.status(404).send({
            status: "error",
            msg: "Petición no incluye la imagen"
        });
    }

    // Conseguir el nombre del archivo

    let image = req.file.originalname;

    // Sacar la extension del archivo

    const imageSplit = image.split("\.");
    const extension = imageSplit[1];

    // Comprobar extension

    if (extension != "png" && extension != "jpg" && extension != "jpeg" && extension != "gif") {

        // Borrar archivo
        const filePath = req.file.path;
        const fileDeleted = fs.unlinkSync(filePath);

        // Devolver respuesta negativa
        return res.status(400).send({
            status: "error",
            msg: "Extension del fichero invalida"
        });
    }

    // Si es correcta, guardar imagen en Base Datos

    User.findOneAndUpdate({ _id: req.user.id }, { image: req.file.filename }, { new: true }, (error, userUpdated) => {

        if (error || !userUpdated) {
            return res.status(500).send({
                status: "error",
                msg: "Error en la subida del avatar"
            });
        }

        // Devolver respuesta
        return res.status(200).send({
            status: "Success",
            user: userUpdated,
            file: req.file
        });

    });

}

const avatar = (req, res) => {

    // Sacar el parametro de la url

    const file = req.params.file;

    // Montar un path real de la imagen

    const filePath = "./uploads/avatars/" + file;

    // Comprobar que el archivo existe

    fs.stat(filePath, (error, exists) => {
        if (!exists) {
            return res.status(404).send({
                status: "error",
                msg: "No existe la imagen"
            });
        }

        // Devolver un file

        return res.sendFile(path.resolve(filePath))
    });

}

// Añadido
const counters = async (req, res) => {

    let userId = req.user.id;

    if (req.params.id) {
        userId = req.params.id;
    }

    try {

        const following = await Follow.count({ "user": userId });

        const followed = await Follow.count({ "followed": userId });

        const publications = await Publication.count({ "user": userId });

        return res.status(200).send({
            userId,
            following: following,
            followed: followed,
            publications: publications
        });

    } catch (error) {

        return res.status(500).send({
            status: "error",
            msg: "Error en los comentaarios",
            error
        });

    }

}

// Exportar acciones
module.exports = {
    pruebaUser,
    register,
    login,
    profile,
    list,
    update,
    upload,
    avatar,
    counters
}