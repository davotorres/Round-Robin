const estados = {
    NUEVO: 'NUEVO',
    LISTO: 'LISTO',
    EJECUCION: 'EJECUCION',
    BLOQUEADO: 'BLOQUEADO',
    TERMINADO: 'TERMINADO'
}

// Declaramos la clase
class Proceso{
    //Operacion resultado operacion y resultado

    constructor(id, tiempoEstimado, operacion){
        this.operador;
        this.operandos = [];

        //Atributos 
        this.id = id;
        this.tiempoEstimado = tiempoEstimado;
        this.operacion = operacion;

        this.servicio = 0;
        this.bloqueado = 0;
        this._remain = 'NULL';

        this.estado = estados.NUEVO;
        this.info = '-';

        this.llegada = 'NULL';
        this.finalizo = 'NULL';
        this.retorno = 'NULL';
        this.espera = 'NULL';
        this.respuesta = 'NULL';

        this.respondio = false;
        this.resultado = null;
    }



    ToString = function(){
        return `Datos del Proceso: ${this.id}, ${this.tiempoEstimado}, ${this.operacion} = ${this.resultado}`;
    }

    ObtenerOperador = function(){
        this.operador = this.operacion.match('[+-/%\*x]{1,1}');
    }

    ObtenerOperandos = function(){
        const operando =  this.operacion.split(this.operador);
        for(let i=0 ; i<2; i++){
            this.operandos[i] = parseInt(operando[i]);
        }
    }

    RealizarOperacion =  function(){
        this.ObtenerOperador();
        this.ObtenerOperandos();

        switch(this.operador[0]){
            case '+':
                    this.resultado = this.operandos[0] + this.operandos[1];
                break;
            case '-':
                    this.resultado = this.operandos[0] - this.operandos[1];
                break;
            case '/':
                try{
                    this.resultado = Math.round((this.operandos[0] / this.operandos[1]) * 100) /100;
                }catch(error){
                    alert('Agregaste una division entre 0')
                    console.log(error);
                }
                break;
            case '*':
                    this.resultado = this.operandos[0] * this.operandos[1];
                break;
            case 'x':
                    this.resultado = this.operandos[0] * this.operandos[1];
                break;
            case '%':
                    this.resultado =  Math.round((this.operandos[0] % this.operandos[1]) * 100) /100
                break;
        }
    }

    
    set remain(value){
        this._remain = value;
    }

    get remain(){
        this.calcRemain();
        return this._remain;
    }

    calcRemain(){
        switch(this.estados){
            case estados.NUEVO:
                this._remain = 'NULL';
                break;
            case estados.TERMINADO:
                this._remain = 0;
                break;
            default:
                this.remain = this.tiempoEstimado - this.servicio;
                break;
        }
    }

    calcularTiempos( globalTime  = null){
        if(this.estado != estados.TERMINADO){
            if(this.estado != estados.NUEVO){
              
                this.espera = globalTime  - this.llegada - this.servicio;
            }
        }else{
            this.retorno = this.finalizo - this.llegada;
            this.espera = this.retorno - this.servicio; 
        }
    }
}