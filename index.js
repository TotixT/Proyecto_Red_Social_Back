// Importar dependencias
const connection = require('./database/connection.js');
const express = require('express');
const cors = require('cors');


// Mensaje de Bienvenida
console.log("API NODE para Red Social arrancada");

// Conexion a la Base de Datos

connection();

// Crear servidor Node

const app = express();
const puerto = 3500;

// Configurar Cors

app.use(cors());

// Convertir los datos del Body a Objetos js

app.use(express.json());
app.use(express.urlencoded({extended: true}));

//Cargar conf rutas

const userRoutes = require('./routes/user.js');
const publicationRoutes = require('./routes/publication.js');
const followRoutes = require('./routes/follow.js');
const searchRoutes = require('./routes/search.routes.js');

app.use("/api/user", userRoutes);
app.use("/api/publication", publicationRoutes);
app.use("/api/follow", followRoutes);
app.use("/api/search", searchRoutes);


// Ruta de prueba
// app.get("/ruta-prueba", (req, res) =>{
//     return res.status(200).json({
//         "id":1,
//         "nombre":"Santiago",
//         "web":"Vtubverse.es"
//     });
// });

// Poner servidor a escuchar peticiones http

app.listen(puerto, ()=> {
    console.log("Servidor de node corriendo en el puerto: ",puerto);
})