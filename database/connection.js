const mongoose = require('mongoose');

const connection = async () => {
    try {
        // En caso de ser especifico a una Db Especifica
        await mongoose.connect("mongodb+srv://redsocial:12345@redsocial.pceqeiz.mongodb.net/mi_red_social",{
            useNewUrlParser: true,
            useUnifiedTopology: true   
        });

        // En caso de usarlo por localhost o el puerto 127.0.0.1 el cual es el local del equipo
        // await mongoose.connect("mongodb://127.0.0.1:27017/mi_red_social",{
        //     useNewUrlParser: true,
        //     useUnifiedTopology: true   
        // });

        console.log("Se ha conectado Correctamente a la Base de Datos de MongoDB de la Red Social");
    
    } catch (error) {

        console.log(error);
        throw new Error("No se ha podido conectar a la Base de Datos de MongoDB")
        
    }
}

module.exports = connection