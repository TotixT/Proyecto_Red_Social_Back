// Importar modulos

const fs = require('fs');
const path = require('path');

// Importar modelo

const Publication = require('../models/publication.js');

// Importar servicios

const followService = require('../services/followService.js');

// Acciones de prueba

const pruebaPublication = (req, res) => {
    return res.status(200).send({
        msg: "Mensaje enviado desde: controllers/publication.js"
    });
}

// Guardar publicaciones

const save = (req, res) => {

    // Recoger datos del body

    const params = req.body;

    // Si no me llegan, dar respuesta negativa

    if (!params.text) return res.status(400).send({ status: "error", msg: "Debes enviar el texto de la publicación." });

    // Crear y rellenar el objeto del modelo

    let newPublication = new Publication(params);
    newPublication.user = req.user.id;

    // Guardar objeto en BD

    newPublication.save((error, publicationStored) => {

        if (error || !publicationStored) return res.status(400).send({ status: "error", msg: "No se ha guardado la publicación." });

        // Devolver respuesta
        return res.status(200).send({
            status: "success",
            msg: "Publicación Guardada",
            publicationStored
        });

    });

}

// Sacar una publicacion

const detail = (req, res) => {

    // Sacar id de publicacion de la url

    const publicationId = req.params.id;

    // Find con la condicion del id

    Publication.findById(publicationId, (error, publicationStored) => {

        if (error || !publicationStored) {
            return res.status(404).send({
                status: "error",
                msg: "No existe la publicación"
            });
        }

        // Devolver respuesta
        return res.status(200).send({
            status: "Success",
            msg: "Mostrar Publicacion",
            publication: publicationStored
        });

    });

}

// Eliminar publicaciones

const remove = (req, res) => {

    // Sacar el id de la publicacion a eliminar

    const publicationId = req.params.id

    // Find y luego un remove

    Publication.find({ "user": req.user.id, "_id": publicationId }).remove(error => {
        if (error) {
            return res.status(500).send({
                status: "error",
                msg: "No se ha eliminado la publicación"
            });
        }

        // Devolver la respuesta
        return res.status(200).send({
            status: "Success",
            msg: "Eliminar Publicacion",
            publication: publicationId
        });
    });

}

// Listar publicaciones de un usuario

const user = (req, res) => {

    // Sacar el id del usuario

    const userId = req.params.id

    // Controlar la pagina

    let page = 1;

    if (req.params.page) page = req.params.page

    const itemsPerPage = 5;

    // Find, pupulate, ordenar, paginar

    Publication.find({ "user": userId })
        .sort("-create_at")
        .populate("user", "-password -__v -role -email")
        .paginate(page, itemsPerPage, (error, publications, total) => {

            if (error || !publications || publications.length <= 0) {
                return res.status(404).send({
                    status: "error",
                    msg: "No hay publicaciones para mostrar"
                });
            }

            // Devolver la respuesta
            return res.status(200).send({
                status: "Success",
                msg: "Publicaciones del perfil de un usuario",
                page,
                total,
                pages: Math.ceil(total / itemsPerPage),
                publications,
            });

        })

}

// Subir ficheros

const upload = (req, res) => {
    // Sacar publicacion id

    const publicationId = req.params.id;

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

    Publication.findOneAndUpdate({ "user": req.user.id, "_id": publicationId }, { file: req.file.filename }, { new: true }, (error, publicationUpdated) => {

        if (error || !publicationUpdated) {
            return res.status(500).send({
                status: "error",
                msg: "Error en la subida del avatar"
            });
        }

        // Devolver respuesta
        return res.status(200).send({
            status: "Success",
            publication: publicationUpdated,
            file: req.file
        });

    });

}

// Devolver archivos multimedia-imagenes

const media = (req, res) => {

    // Sacar el parametro de la url

    const file = req.params.file;

    // Montar un path real de la imagen

    const filePath = "./uploads/publications/" + file;

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

// Listar todas las publicaciones (FEED)

const feed = async (req, res) => {

    // Sacar la pagina actual

    let page = 1;

    if (req.params.page) {
        page = req.params.page;
    }

    // Establecer numero de elementos por pagina

    let itemsPerPage = 5;

    // Sacar un array de identificadores de usuarios que yo sigo como usuario identificado

    try {

        const myFollows = await followService.followUserIds(req.user.id);

        // Find a publicaciones in, ordenar, popular, paginar

        const publications = Publication.find({ user: myFollows.following })
            .populate("user", "-password -role -__v -email")
            .sort("-create_at")
            .paginate(page, itemsPerPage, (error, publications, total) => {

                if(error || !publications){
                    return res.status(500).send({
                        status: "error",
                        msg: "No hay publicaciones para mostrar"
                    });
                }

                return res.status(200).send({
                    status: "Success",
                    msg: "Feed de publicaciones",
                    following: myFollows.following,
                    total,
                    page,
                    pages: Math.ceil( total / itemsPerPage),
                    publications
                });

            });

    } catch (error) {

        return res.status(500).send({
            status: "error",
            msg: "No se han listado las publicaciones del feed"
        });

    }

}

// Exportar acciones
module.exports = {
    pruebaPublication,
    save,
    detail,
    remove,
    user,
    upload,
    media,
    feed
}