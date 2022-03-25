//Cantidad maxima de procesos en memoria
const PROCESOS_MAX_EN_MEMORIA = 5;

//Tiempo maximo de espera
const MAX_LOCKED_TIME = 8;

// Cronómetros
const GLOBAL_TIMER = new Timer(1000);

//Proceso Nulo
const PROCESO_NULL = new Proceso(null, null, null);

//Quantium
let Quantium;
let valorQuantium;

// Lista de procesos
let procesosNuevos= [];
let procesosListos = [];
let procesosBloqueados = [];
let procesosTerminados = [];

let procesoActual;

let lastId;

// Detener proceso en ejecución
let abortController;
let abortSignal;

let pause;
let numeroLote = 0;
let numeroProcesos = 0;


document.addEventListener('DOMContentLoaded', function(){
    addEventListener();    
});

function addEventListener(){
    const botonIngresar =  document.querySelector('#ingresar');
    botonIngresar.addEventListener('click', ObtenerNumeroProcesos);  

    document.addEventListener('keydown', (e)=>{
        const alerta = document.querySelector('.alerta');
        switch(e.key){
            case 'e':
                if(!pause && procesoActual != PROCESO_NULL){
                    console.log('error');
                    procesoActual.resultado = 'ERROR';
                    setProcesoEstado(procesoActual, estados.TERMINADO, 'ERROR');
                    enviarTerminados();
                    Terminados(procesoActual);

                    if(!isLastProceso()){
                        sacarDeNuevos();
                        sacarDePreparados();
                    }else{
                        GLOBAL_TIMER.repeat(false);
                    }
                }
                break;
            case 'i':
                    alerta.innerHTML = `PROCESO BLOQUEADO`;
                    if(!pause && procesoActual != PROCESO_NULL){
                        setProcesoEstado(procesoActual, estados.BLOQUEADO, 'NULL');
                        procesosBloqueados.push(procesoActual);
                        sacarDePreparados();
                    }
                break;
            case 'p':
                    alerta.innerHTML = `PAUSE`;
                    console.log('Pause');
                    pause = true;
                    GLOBAL_TIMER.pause();
                break;
            case 'c':
                    alerta.innerHTML = ` `;
                    console.log('Continua');
                    pause = false;
                    document.querySelector('.contenedor').style.display ='grid';
                    document.querySelector('.bcp').style.display = 'none';
                    GLOBAL_TIMER.resume();
                break;
            case 'n':
                    if(!pause){
                        console.log('Nuevo Proceso');
                        GLOBAL_TIMER.repeat(true);
                        procesosNuevos.push(crearProcesos(lastId+1));
                    }
                break;
            case 't':
                console.log('BCP');
                pause = true;
                GLOBAL_TIMER.pause();
                document.querySelector('.contenedor').style.display ='none';
                document.querySelector('.bcp').style.display = 'block';
                const bcp = document.querySelector('#BCP');
                bcp.innerHTML = ` `;
                
                if(procesoActual != PROCESO_NULL){
                    createBCPTable([procesoActual]);
                }
                createBCPTable(procesosNuevos);
                createBCPTable(procesosListos);
                createBCPTable(procesosBloqueados);
                createBCPTable(procesosTerminados);
               break;
            default:
                break;

        }
    });
}


function ObtenerNumeroProcesos(){
    const procesos = Number(document.querySelector('#procesos').value);
    Quantium = Number(document.querySelector('#quantium').value);

    //Valida si es un numero mayor a 0
    if(procesos && Quantium){
        if(Quantium >= 3 && Quantium <= 6){
            document.querySelector('.Nproceso').style.display = 'none';
            ingresarProceso(procesos);
        }else{
            alert('El valor del Quantum debe ser mayor de 3 y menor que 6');
        } 
    }else{
        alert('Debes ingresar por lo menos 1 proceso y el valor del Quantum');
    }   
}

function ingresarProceso(procesos){
    
    for(let i = 0; i<procesos; i++){
        const proceso = crearProcesos(i+1);
        procesosNuevos.push(proceso);
    }
    run();
}

async function run(){
    while(isSacarNuevos()){
        sacarDeNuevos();
    }   
    sacarDePreparados();
    await manageProcess();    //Termino todos los procesos
    GLOBAL_TIMER.destroy();
    createFinalTable();

}


//Revisa si es posible agregar nuevos procesos a la cola --------------------
function isSacarNuevos(){
    return procesosEnMemoria() < PROCESOS_MAX_EN_MEMORIA && procesosNuevos.length;
}

function procesosEnMemoria(){
    //revisa si hay un proceso en ejecucion que no sea el nulo
    const ejecución = procesoActual == PROCESO_NULL ? 0 : 1;
    //Retorna la catidad de procesos en memoria incluyendo el de ejecucion
    return procesosListos.length + procesosBloqueados.length + ejecución;
}
//---------------------------------------------------------------------------

/**
 * Si es posible, obtiene el proceso al frente de la cola de nuevos
 * y lo agrega a Listos, si el proceso en ejecucion es el nulo, entonces envia 
 * el proceso obtenido a ejecucion
*/
function sacarDeNuevos(){
    if(isSacarNuevos()){
        let process =  procesosNuevos.shift();
        setProcesoEstado(process, estados.LISTO, '-');
        process.llegada = GLOBAL_TIMER.currentCycle;
        procesosListos.push(process);
        if(procesoActual == PROCESO_NULL){
            sacarDePreparados();
        }
    }
}


function sacarDePreparados(){
    if(procesosListos.length){
        valorQuantium = Quantium;
        procesoActual = procesosListos.shift();
        setProcesoEstado(procesoActual, estados.EJECUCION, '-');
        
        if(!procesoActual.respondio){
            //Calcula tiempo de  
            procesoActual.respuesta = GLOBAL_TIMER.currentCycle - procesoActual.llegada;
            procesoActual.respondio = true;
        }
    }else{
        procesoActual = PROCESO_NULL;
    }
}

function sacarDeBloqueados(){
    if(procesosBloqueados.length && procesosBloqueados[0].bloqueado == MAX_LOCKED_TIME){
        let process = procesosBloqueados.shift();
        process.bloqueado = 0;
        setProcesoEstado(process, estados.LISTO, '-');
        procesosListos.push(process);

        if(procesoActual == PROCESO_NULL){
            sacarDePreparados();
        }
    }
}

//Envia los procesos a Terminados
function enviarTerminados(){
    procesoActual.finalizo = GLOBAL_TIMER.currentCycle;
    procesosTerminados.push(procesoActual);
}

function checkQuantium(){
    if(procesoActual != PROCESO_NULL){
        document.querySelector('#VQuantium').textContent=`${valorQuantium}`;
        if(--valorQuantium == 0){
            console.log('Termine Quantum');
            setProcesoEstado(procesoActual, estados.LISTO, '-');
            procesosListos.push(procesoActual);
            sacarDePreparados();
        }
    }else{
        document.querySelector('#VQuantium').textContent=`NULL`;
    }
   
}

function checkMemoryProcess(){
    if(++procesoActual.servicio == procesoActual.tiempoEstimado){
        setProcesoEstado(procesoActual, estados.TERMINADO, 'OK');
        Terminados(procesoActual);
        enviarTerminados();
        sacarDePreparados();
    }

    procesosBloqueados.forEach(process=>{
        process.info = MAX_LOCKED_TIME - (++process.bloqueado);
    });
    sacarDeNuevos();
    sacarDeBloqueados();
}


function setProcesoEstado(proceso, estado, info){
    proceso.estado = estado;
    proceso.info = info;
}

async function manageProcess(){
    return new Promise((resolve)=>{
        GLOBAL_TIMER
        .action(timer=>{

            if(isLastProceso()){
                console.log('ultimo');
                //Termina timer
                timer.repeat(timer.currentCycle + procesoActual.remain - 1);
            }
            document.querySelector('#procesosNuevos').textContent = `Procesos Nuevos: ${procesosNuevos.length}`;
            document.querySelector('#numQuantium').textContent = `Quantium: ${Quantium}`;
            document.querySelector('#tiempoTotal').textContent = `Tiempo Global: ${timer.currentCycle} segundos`;
            
           
            checkMemoryProcess(); //Revisa si el tiempo maximo estimado de cada proceso finalizo
            actualizarPoceso();
            checkQuantium();
            actualizarProcesosListos();
            actualizarBloqueados();
        })
        .done(resolve)
        .start();   
    })
}

function isLastProceso(){
    return !procesosNuevos.length && !procesosListos.length && !procesosBloqueados.length;
}