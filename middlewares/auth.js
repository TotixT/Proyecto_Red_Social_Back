// Importar dependencias

const jwt = require('jwt-simple');
const moment = require('moment');

// Importar Clave Secreta

const libJwt = require('../services/jwt.js');
const secret = libJwt.secret;

// MIDDLEWARE de Autenticacion

exports.auth = (req, res, next) => {
    
    // Comprobar si me llega la cabecera de atenticación

    if(!req.headers.authorization){
        return res.status(403).send({
            status: "error",
            msg: "La Peticion no tiene la cabecera de autenticación"
        });
    }

    // Limpiar el token 

    const token = req.headers.authorization.replace(/['"]+/g, '');

    // Decodificar el token 

    try {
        
        const payload = jwt.decode(token, secret);
        
        // Comprobar expiración del Token

        if(payload.exp <= moment().unix()){
            return res.status(401).send({
                status: "error",
                msg: "Token Expirado"
            });
        }

        // Agregar datos de usuario a la request

        req.user = payload;

    } catch (error) {
        return res.status(404).send({
            status: "error",
            msg: "Token invalido",
            error
        });
    }

    // Pasar a la ejecución de acción

    next();

}