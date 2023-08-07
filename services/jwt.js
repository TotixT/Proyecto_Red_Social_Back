// Importar dependencias

const jwt = require('jwt-simple');
const moment = require('moment');

// Clave Secreta

const secret = "CL4V3_S3CR3T4_D3L_PR0Y3CT0_D3_L4_R3D_S0C1AL_2004_1904";

// Crear una funcion para generar tokens 

const createToken = (user) => {
    const payload = {
        id: user._id,
        name: user.name,
        surname: user.surname,
        nick: user.nick,
        email: user.email,
        role: user.role,
        image: user.image,
        iat: moment().unix(),
        exp: moment().add(30, "days").unix()
    }

    // Devolver un jwt token codificado

    return jwt.encode(payload, secret);
}

module.exports = {
    secret,
    createToken
}