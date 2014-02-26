/* proy_temperatura
  Lee la temperatura del Thermistor y la luminosidad recibida con dos fotoresistores graduados a distinta intensidad de señal.
  en formato --- temperatura;milisecs ---
  Lee la entrada de datos desde el puerto serie con los siguientes disparadores:
    Si recibe una "D" envia los datos obtenidos de los sensores
    Si recibe una "B" enciende/apaga el led en un intervalo de INTERVALO_BLINK milisegundos
    Si recibe una "H" enciende un led. Al recibir "L" lo apaga
   
  Lectura del thermistor interpretada a partir del codigo del ejemplo: http://www.ladyada.net/make/logshield/lighttemp.html
*/


#define aref_voltage 3.3          // we tie 3.3V to ARef and measure it with a multimeter!
#define sensorTemp            A0  // pin de entrada analogicasensor TMP36
#define ThermistorPIN         A1  // Analog Pin 1
#define LeftPhotoresistorPIN  A2  // Analog Pin 2
#define RightPhotoresistorPIN A3  // Analog Pin 3
#define LED                    8  // Led para comprobar funcionamiento del sistema

const unsigned long int MAX_MARGEN_LECTURAS = 300000;  // Margen de tiempo maximo dentro del que se calculara media aritmetica de las lecturas ( 5 minutos )
const unsigned long int INTERVALO_BLINK = 100;  // tiempo de duracion del parpadeo
const unsigned long int INTERVALO_LECTURA_SENSORES = 60000;  // tiempo de duracion entre lecturas de sensores ( 1 minuto )


/*
Variables de ambito global
*/
// Si blink=1 el led esta encendido esperando apagarse
int blink = 0;
// Tiempo en milisegundos en que se empezo el parpadeo
unsigned long int inicio_blink = 0;

// Calculo de temperatura leida del termistor
int tempReading;  // lectura analogica obtenida del TMP36 
int fotoresistorIzq;
int fotoresistorDer;

float voltage;
float temperaturaC;
double temperaturaT;

unsigned long int ultima_lectura_datos = 0;

// FIN Declaraciones globales


double Thermistor(int RawADC) {
 // Inputs ADC Value from Thermistor and outputs Temperature in Celsius
 //  requires: include <math.h>
 // Utilizes the Steinhart-Hart Thermistor Equation:
 //    Temperature in Kelvin = 1 / {A + B[ln(R)] + C[ln(R)]^3}
 //    where A = 0.001129148, B = 0.000234125 and C = 8.76741E-08
 long Resistance;  double Temp;  // Dual-Purpose variable to save space.
 Resistance=((10240000/RawADC) - 10000);  // Assuming a 10k Thermistor.  Calculation is actually: Resistance = (1024 * BalanceResistor/ADC) - BalanceResistor
 Temp = log(Resistance); // Saving the Log(resistance) so not to calculate it 4 times later. // "Temp" means "Temporary" on this line.
 Temp = 1 / (0.001129148 + (0.000234125 * Temp) + (0.0000000876741 * Temp * Temp * Temp));   // Now it means both "Temporary" and "Temperature"
 Temp = Temp - 273.15;  // Convert Kelvin to Celsius                                         // Now it only means "Temperature"

 // BEGIN- Remove these lines for the function not to display anything
  //Serial.print("ADC: "); Serial.print(RawADC); Serial.print("/1024");  // Print out RAW ADC Number
  //Serial.print(", Volts: "); printDouble(((RawADC*4.860)/1024.0),3);   // 4.860 volts is what my USB Port outputs.
  //Serial.print(", Resistance: "); Serial.print(Resistance); Serial.print("ohms");
 // END- Remove these lines for the function not to display anything

 return Temp;  // Return the Temperature
}

void init_sensores()
{

  int lecturaTermistor;
  
  lecturaTermistor = analogRead(ThermistorPIN);
  temperaturaT = Thermistor(lecturaTermistor);           // read ADC and convert it to Celsius
  fotoresistorIzq = analogRead( LeftPhotoresistorPIN );
  fotoresistorDer = analogRead( RightPhotoresistorPIN );

  ultima_lectura_datos = millis();

}

void lee_sensores()
{

  int lecturaTermistor;
  double temperaturaT_actual;  
  int fotoresistorIzq_actual;
  int fotoresistorDer_actual;
  
  lecturaTermistor = analogRead(ThermistorPIN);
  temperaturaT_actual = Thermistor(lecturaTermistor);           // read ADC and convert it to Celsius
  fotoresistorIzq_actual = analogRead( LeftPhotoresistorPIN );
  fotoresistorDer_actual = analogRead( RightPhotoresistorPIN );
  
  // Si la lectura anterior y actual se han hecho en un corto margen, calculo la media aritmetica
  if (  millis() - ultima_lectura_datos < MAX_MARGEN_LECTURAS ){
    temperaturaT = ( temperaturaT + temperaturaT_actual ) / 2;
    fotoresistorIzq = ( fotoresistorIzq + fotoresistorIzq_actual ) / 2;
    fotoresistorDer = ( fotoresistorDer + fotoresistorDer_actual ) / 2;
  }
  else{
    temperaturaT = temperaturaT_actual;
    fotoresistorIzq = fotoresistorIzq_actual;
    fotoresistorDer = fotoresistorDer_actual;
  }

  ultima_lectura_datos = millis();

}

/*
  POST: Envia al puerto serie la informacion recogida de los sensores separada por ";" con el siguiente formato:
    temp. ºC thermisor; intensidad fotoresistor1; intensidad fotoresistor2; tiempo desde arranque en milisegundos;
*/
void envia_datos(){

  Serial.print(temperaturaT);     // ºC Thermistor
  Serial.print(";" );
  
  Serial.print( fotoresistorIzq );
  Serial.print(";");
  
  Serial.print( fotoresistorDer );
  Serial.print(";");
  
  Serial.println( ultima_lectura_datos );
 
}

void setup(){
  pinMode(LED,OUTPUT);
  Serial.begin(9600);
  
  // referencia de voltajes a partir de pin aref
  analogReference(EXTERNAL);
 
  init_sensores();
}

void loop(){
  
  // Interpreta los datos recibidos desde puerto serie  
  if ( Serial.available() ){
    char c = Serial.read();
    
    // Nos piden datos de temperatura
    if( c == 'D' ){
      envia_datos();
    }
    // Releer sensores y enviar resultado
    else if( c == 'R' ){
      lee_sensores();
      envia_datos();
    }
    // Encender el LED
    else if( c == 'H' ){
      digitalWrite(LED,HIGH);
    }
    // Apagar el LED
    else if( c == 'L' ){
      digitalWrite(LED,LOW);
    }
    // Parpadeo de LED
    else if( c == 'B' ){
      blink = 1;
      inicio_blink = millis();
      digitalWrite(LED,HIGH);
    }

  }
  
  // Comrpueba si hay que apagar el LED al final del parpadeo
  if( blink && ( millis() - inicio_blink ) > INTERVALO_BLINK ){
      blink = 0;
      digitalWrite(LED,LOW);
  }

  if ( ( millis() - ultima_lectura_datos ) > INTERVALO_LECTURA_SENSORES ){
    lee_sensores();
  }
  
  // Descansa el tiempo de un parpadeo del led como minimo
  delay(INTERVALO_BLINK);

  
}
