/* lector_temperatura_3v
  Lee la temperatura del sensor TMP36 y la envia a intervalos INTERVALO_ENVIO_DATOS seg.
  en formato --- temperatura;milisecs ---
  Lee la entrada del usb y si recibe una "H" enciende un led. Al recibir "L" lo apaga
  
  referenced temperature example from http://www.ladyada.net/make/logshield/lighttemp.html
*/
#define aref_voltage 3.3         // we tie 3.3V to ARef and measure it with a multimeter!
const long int INTERVALO_ENVIO_DATOS = 30 * 1000;

const int sensorTemp = A0;  // pin de entrada analogicasensor TMP36
const int led = 5;

int tempReading;  // lectura analogica obtenida del TMP36 
float voltage;
float temperaturaC;

void setup(){
  pinMode(led,OUTPUT);
  Serial.begin(9600);
  
  // referencia de voltajes a partir de pin aref
  analogReference(EXTERNAL);
}

void loop(){
  
  // Control del led de avisos si se pasa por usb el caracter H o L enciende/apaga el led
  if ( Serial.available() ){
    char c = Serial.read();
    if( c == 'H' ){
      digitalWrite(led,HIGH);
    }
    else if( c == 'L' ){
      digitalWrite(led,LOW);
    }
  }

  tempReading = analogRead(sensorTemp);
  
  //Serial.print("Temp reading = ");
  //Serial.print(tempReading);     // the raw analog reading

  // converting that reading to voltage, which is based off the reference voltage
  float voltage = tempReading * aref_voltage;
  voltage /= 1024.0; 

  // print out the voltage
  //Serial.print(" - ");
  //Serial.print(voltage); Serial.println(" volts");

  // now print out the temperature
  temperaturaC = (voltage - 0.5) * 100 ;  //converting from 10 mv per degree wit 500 mV offset
                                               //to degrees ((volatge - 500mV) times 100)
  //Serial.print(temperaturaC); Serial.println(" grados C");
      
  Serial.print(temperaturaC);
  Serial.print(";");
  //Serial.print( tempReading );
  //Serial.print(";");
  Serial.println( millis() );

  delay( INTERVALO_ENVIO_DATOS );

}
