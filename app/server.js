// Prepara la variable https con la que hara el envio a Xively

// Posicion de los datos leidos de Arduino
const POSICION_TEMPERATURA	= 0;
const POSICION_LUMINOSIDAD_IZQ	= 1;
const POSICION_LUMINOSIDAD_DER	= 2;
const POSICION_TIMER		= 3;
const POSICION_TMP280		= 4;
const POSICION_PREASURE0	= 5;

const INTERVALO_PETICION_LECTURAS = 5 * 60 * 1000;  // cada 5 minutos 
const INTERVALO_ENVIO_CANDADES =  10 * 60 * 1000;  // cada 10 minutos
const INTERVALO_ENVIO_XIVELY =  10 * 60 * 1000;  // cada 10 minutos
var https = require('https');

// Graba las temperaturas max. min. y las fechas
var temperatura_actual = 200;
var temperatura_minima = 200;
var temperatura_maxima = -100;
var fecha_minima;
var fecha_maxima;

// Tabla de temperaturas programadas en caldera t0 t1 t2 t3
var temp_prog = [0, 21, 19, 16.5];

// Matriz con los valores programados en la caldera t0 t1 t2 o t3
// Hora	 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3
var prog_caldera = [
	[3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,3],	// Sunday
	[3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,3],	// Monday
	[3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,3],	// Tuesday
	[3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,3],	// Thirday
	[3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,3],	// Wednesday
	[3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,3,3,3,3,3,3,3],	// Friday
	[3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],	// Saturday
    ];

/*
 Recige ek dato de la posicion <ind> en la cadena de datos <dato> separados por ";"
*/
function getDatoN( dato, ind ){
	var aDatos = dato.split(";");
	return( aDatos[ind] );
}

/********************************************************************************************
Se conecta a Xively y le envia la tempertura obtenida
********************************************************************************************/
function enviaXively( ){

        //var temperatura = ultimoDato.substring(0,ultimoDato.indexOf(';'));
	//temperatura = Math.round(temperatura);
	var temperatura = getDatoN( ultimoDato, POSICION_TEMPERATURA );
	var luminosidad_izq = getDatoN( ultimoDato, POSICION_LUMINOSIDAD_IZQ );
	var luminosidad_der = getDatoN( ultimoDato, POSICION_LUMINOSIDAD_DER );

	var tmp280 = getDatoN( ultimoDato, POSICION_TMP280 );
	tmp280 = parseFloat(tmp280).toFixed(2);

	var preassure0 = getDatoN( ultimoDato, POSICION_PREASURE0 );
	preassure0 = parseFloat(preassure0).toFixed(2);


	var date = new Date();
	var time_prog = prog_caldera[date.getDay()][date.getHours()];
	var pide_caldera = 0;
	
	if( temperatura < temp_prog[ time_prog ] )
		pide_caldera = 1;

	temperatura = parseFloat(temperatura).toFixed(2);
	
	console.log("Enviando a Xively temp: " + temperatura );

	   // Prepara el json que enviara Xively
	 var jdata = JSON.stringify({
		"version": '1.0.0',
		"datastreams" : [ {
		  "id" : "termistor",
        	  "current_value" : temperatura 
		},
		{
		  "id" : "luz_500_ohm",
        	  "current_value" : luminosidad_izq 
	   	 },
		{
		  "id" : "luz_dia",
        	  "current_value" : luminosidad_der 
	   	 },
		{
		  "id" : "tmp280",
        	  "current_value" : tmp280 
	   	 },
		{
		  "id" : "preassure0",
        	  "current_value" : preassure0 
	   	 },
		{
		  "id" : "pide_caldera",
        	  "current_value" : pide_caldera 
	   	 } ]
         }); 

	var options = {
	  host: 'api.xively.com',
	  path: '/v2/feeds/1651193641.json',
	  method: 'PUT',
	  headers: {
	    //'X-ApiKey': 'n157qWw4mF8ub5IjACAqX5TuuBGd7zdn2xGOclZGipHO8XgZ',
	    'X-ApiKey': 'wKos29LOwVEsHNZOETYNyNrKuxJY5vSNEm2abDO5Ojkai1Un',
	    'Content-Type': 'application/json',
	    'Content-Length': jdata.length,
	    'Host': 'api.xively.com'
	  }
	};

	var req = https.request( options, function(res) {
	  //console.log('Status Code: ' + res.statusCode);
	  //console.log('Headers:');
	  //console.log(res.headers);
	  res.setEncoding('utf8');

	  var buffer = '';
	  res.on('data', function(chunk) {
	    buffer += chunk;
	  });
	  res.on('end', function() {
	    //console.log('complete');
	    //console.log(buffer);
	  });
	});

	req.on('error', function(e){
	   console.log('problem with request: ' + e.message);
	});

        req.write(jdata);
        req.end();
}


/********************************************************************************************
Se conecta a Candades y le envia la tempertura obtenida
********************************************************************************************/
function enviaCandades( ){

        var temperatura = ultimoDato.substring(0,ultimoDato.indexOf(';'));
	temperatura = parseFloat(temperatura).toFixed(2);
	var luminosidad_der = getDatoN( ultimoDato, POSICION_LUMINOSIDAD_DER );
        var preassure0 = getDatoN( ultimoDato, POSICION_PREASURE0 );


	console.log("Enviando a Candades temp: " + temperatura );

	   // Prepara el json que enviara Xively
	 var jdata = JSON.stringify({
		"id_usuario": 'tmpcantemp',
		"temperatura" : temperatura,
		"preassure0" : preassure0,
		"luminosidad_der" : luminosidad_der 
             }); 

	var options = {
	  host: 'candades.com',
	  path: '/temperatura/json/graba_temperatura.php',
	  method: 'POST',
	  headers: {
	    'Content-Type': 'application/json',
	    'Content-Length': jdata.length,
	    'Host': 'candades.com'
	  }
	};

	var req = http.request( options, function(res) {
	  //console.log('Status Code: ' + res.statusCode);
	  //console.log('Headers:');
	  //console.log(res.headers);
	  res.setEncoding('utf8');

	  var buffer = '';
	  res.on('data', function(chunk) {
	    buffer += chunk;
	  });
	  res.on('end', function() {
	    //console.log('complete');
	    //console.log(buffer);
	  });
	});

	req.on('error', function(e){
	   console.log('problem with request: ' + e.message);
	});

        req.write(jdata);
        req.end();
}

/********************************************************************************************
 Zona de gestion de datos recibidos de RaspberryPi y envio de datos
********************************************************************************************/

var SerialPort = require("serialport").SerialPort;
var serialPort = new SerialPort("/dev/ttyUSB0", {
  baudrate: 9600
});

// Envia por puerto serie <senyal> que sera transferido a Arduino
senyalaLed = function( senyal ){
	serialPort.write( senyal );
}

var receivedData = "";
var ultimoDato = "";

console.log("Iniciado server.js");

serialPort.on("open", function(){
  console.log('open');
  
  serialPort.write("R");
  // genero un timer para pedir lecturas de temperatura a intervalos
  var interval_id = setInterval( function(){
                //console.log("Pido lectura");
                serialPort.write("D");
                } , INTERVALO_PETICION_LECTURAS );

  serialPort.on('data', function(data) {
    receivedData += data.toString();
    if( receivedData.indexOf('\n') ){
	var datos = receivedData.substring(0,receivedData.indexOf('\n'));
	if( datos.length > 1 ){
	   var fecha = new Date().toUTCString();
	   console.log(fecha + " Recibido desde serial (Xbee Arduino): " + datos);
	   ultimoDato = datos;

           temperatura_actual = parseFloat( ultimoDato.substring(0,ultimoDato.indexOf(';')) );
	   if( temperatura_actual < temperatura_minima ) {
	 	temperatura_minima = temperatura_actual;
		fecha_minima = fecha;
	   }
	   if( temperatura_actual > temperatura_maxima ) {
		temperatura_maxima = temperatura_actual;
		fecha_maxima= fecha;
	   }
	   //console.log("Temperatura: " + temperatura);
	}
	if( receivedData.length > receivedData.indexOf('\n') )
  	  receivedData = receivedData.substring( receivedData.indexOf('\n') +1 );
	else
	  receivedData ="";
    }
  });

});
// Fin Zona de gestion de datos recibidos de RaspberryPi y envio de datos



/********************************************************************************************
 Mini servidor Web
*********************************************************************************************/
var fs = require('fs');
var PORT=8080;
var http = require('http');



// Manifiesto para controlar la recarga de index.html
var postManifest = fs.readFileSync( '/home/pi/html/manifest.temperatura', 'UTF8'  );

// Contiene el HTML de la pagina index.html
var postHTML="";
function leeHTML( ){
  fs.readFile('/home/pi/html/server.html', { encoding: "UTF8" },
    function (err, data) {
      if (err) throw err;
      postHTML= data.toString();
    });
}
leeHTML();


// Contiene el HTML de la pagina programa_caldera.html
var progCalderaHTML="";
function leeHTML2( ){
  fs.readFile('/home/pi/html/programa_caldera.html', { encoding: "UTF8" },
    function (err, data) {
      if (err) throw err;
      progCalderaHTML= data.toString();
    });
}
leeHTML2();
var server = http.createServer(function (req, res) {
  // Parser de los parametros recibidos en el POST
  var qs = require('querystring');
  var body = "";

  req.on('data', function (chunk) {
    body += chunk;	// Datos recibidos desde POST
  });
  req.on('end', function () {
    senyalaLed('B');	// Genera un parpadeo en el led del Arduino
    var url = req.url;
    var fecha = new Date().toUTCString();
    console.log(fecha + " recivida peticion web: " + req.socket.remoteAddress + " " + url);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.writeHead(200);

    // Va releyendo el fichero esto solo por depuracion
    //leeHTML();  

    if( url == "/index.html" || url == "/temperatura.html" ){
      // TODO
      //leeHTML();  // Va releyendo el fichero esto solo por depuracion
      res.end( postHTML );
    }
    else if( url == "/programa_caldera.html"  ){
      // TODO
      leeHTML2();
      res.end( progCalderaHTML );
    }

    else if( url == "/temperatura.json" ){
	// Permite peticiones incrustradas en paginas externas

	//var temperatura = ultimoDato.substring(0,ultimoDato.indexOf(';') );
	var temperatura = getDatoN( ultimoDato, POSICION_TEMPERATURA );
	temperatura = parseFloat(temperatura).toFixed(2);
	var millis = getDatoN( ultimoDato, POSICION_TIMER );
	res.end( JSON.stringify([1, temperatura, millis ] ) );
	console.log("Enviado temp: " + temperatura + " millis: " + millis );
	return;
    }
    // manifiesto para evitar relecturas de paginas estaticas
    else if( url == "/manifest.temperatura" ){
	res.end(postManifest);
    }
    else if( url == "/tmp_max_min.json" ){
	//var temperatura = ultimoDato.substring(0,ultimoDato.indexOf(';') );
	var temperatura = getDatoN( ultimoDato, POSICION_TEMPERATURA );

	temperatura = parseFloat(temperatura).toFixed(2);
	var luminosidad_der = getDatoN( ultimoDato, POSICION_LUMINOSIDAD_DER );
	var millis = ultimoDato.substring(ultimoDato.indexOf(';')+1, ultimoDato.indexOf('\r'));

	res.end( JSON.stringify({
			"temperatura_maxima" : temperatura_maxima,
			"fecha_maxima" : fecha_maxima,
			"temperatura_minima" : temperatura_minima,
			"fecha_minima" : fecha_minima,
			"temperatura_actual" : temperatura_actual,
			"luminosidad_der" : luminosidad_der
		}) );	

	console.log("Enviado temperatura maxima y minima.");
	return;
    }

    /*
	Set / Get de programacion de caldera
	type: tipo de peticion  setProg / getProg
	options: { prog_caldera , temp_prog }  parametros de setProg
   */
    else if( url == "/manage_prog_caldera.json" ){

	var post = qs.parse(body);

	if( post['type'] === 'setProg' ){
		var options = JSON.parse( post['options'] );

		prog_caldera = options.prog_caldera;
		temp_prog = options.temp_prog;
	}

	res.end( JSON.stringify( [ prog_caldera, temp_prog ] ) );

	console.log("Enviado respuesta a programación de caldera.");
	return;
    }

    else if( url == "/reset" ){
	var temperatura = getDatoN( ultimoDato, POSICION_TEMPERATURA );
	var fecha = new Date().toUTCString();

	temperatura_maxima = temperatura;
	temperatura_minima = temperatura;
	fecha_maxima = fecha;
	fecha_minima = fecha;

	temperatura = Math.round(temperatura);

	var millis = ultimoDato.substring(ultimoDato.indexOf(';')+1, ultimoDato.indexOf('\r'));
	res.end( JSON.stringify({
			"temperatura_maxima" : temperatura_maxima,
			"fecha_maxima" : fecha_maxima,
			"temperatura_minima" : temperatura_minima,
			"fecha_minima" : fecha_minima,
			"temperatura_actual" : temperatura_actual
		}) );	

	console.log("Reseteado temperatura maxima y minima.");
	return;
    }
    // fuerza el envio a candades
    else if( url == "/envia" ){
	enviaCandades();
        res.end( );
	return;
    }
    // fuerza el envio a xively 
    else if( url == "/xively" ){
	enviaXively();
        res.end( );
	return;
    }
    else if ( body == "sel_led=H" ){
	senyalaLed('H');
	res.end( JSON.stringify([2,  1, 0] ) );
	return;
    }
    else if ( body == "sel_led=L" ){
	senyalaLed('H');
	res.end( JSON.stringify([2,  1, 0] ) );
	return;
    }
    else{
      //senyalaLed('L');
      res.end( );
   }
  });
});

server.listen(PORT);

/********************************************************************************************
  Temporizadores
********************************************************************************************/
setInterval( enviaCandades, INTERVALO_ENVIO_CANDADES );
setInterval( enviaXively, INTERVALO_ENVIO_XIVELY );
