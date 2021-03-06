var MAX_SPEED= 4.0
var MAX_STEER= 0.6
/*var cursorX=0;
var cursorY=0;*/
var targetPositions=[];
var mustUpdateParticles1=true;
var mustUpdateParticles2=true;
status=1;
var steerCounter=0;
var clock;
var bgColor,cBlanco,cNegro;
var linesColorBgNegro, linesColorBgBlanco, particlesColorBgNegro, particlesColorBgBlanco;

var MOBILE_THREESHOLD = 800

var bpoint1, bpoint2
/*document.onmousemove = function(e){
    cursorX = e.pageX-(window.innerWidth/2);
    cursorY = e.pageY-$('#backgroundCanvas').position().top- (window.innerHeight/2);
    ddd=e;
}*/

function startThree() {
    var totalh= $('body').height()
    var prjh=$('#prj_wrapper').position().top
    var teamh=$('#team').position().top
    var teamsizeh=$('#team').height()/totalh
    bpoint1=prjh/totalh
    bpoint2=teamh/totalh

    width = window.innerWidth;
	height = window.innerHeight;

    //d3 function scales
    scale1 = d3.scaleLinear()
    .domain([bpoint1/2, bpoint1])
    .range([0, 1]).clamp(true);

    scale2 = d3.scaleLinear()
    .domain([bpoint2, bpoint2+teamsizeh-0.01])
    .range([1, 0]).clamp(true)

    if(height< MOBILE_THREESHOLD) {
        scale2 = d3.scaleLinear()
        .domain([bpoint2, bpoint2+0.04])
        .range([1, 0]).clamp(true)
    }

    scaleColorParticlesIntensity = d3.scaleLinear()
    .domain([bpoint2, bpoint2+teamsizeh-0.01])
    .range([0, 1]).clamp(true)

    bgColor= new THREE.Color(0x001414);
    cBlanco= new THREE.Color(0xffffff);
    cNegro= new THREE.Color(0x001414);
    linesColorBgBlanco = new THREE.Color(0x1693A5);
    linesColorBgNegro = new THREE.Color(0xffffff);
    particlesColorBgBlanco = new THREE.Color(0x444444);
    particlesColorBgNegro = new THREE.Color(0x44FF44);
    nodeParticlesColorBgBlanco = new THREE.Color(0x1693A5);
    nodeParticlesColorBgNegro = new THREE.Color(0xDDFFDD);

    maxGeoX= d3.max(cleanTrafico, function(d){ return d.geo.x})
    maxGeoY= d3.max(cleanTrafico, function(d){ return d.geo.y})
    minGeoX= d3.min(cleanTrafico, function(d){ return d.geo.x})
    minGeoY= d3.min(cleanTrafico, function(d){ return d.geo.y})
    targetPositions.push(new THREE.Vector3(300,-300,-1000))
    targetPositions.push(new THREE.Vector3(-200,-1000,-300))
    targetPositions.push(new THREE.Vector3(0,-500,-400))
    //ofVec3f& a_target, bool a_slowdown, float a_scale, float a_minDist
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 10000);
    //controls = new THREE.OrbitControls( camera );
    camera.position.z = -1000;
    camera.position.y = -1000;
    camera.position.x=-300
    camera.lookAt(0,0,0)

    if(height< MOBILE_THREESHOLD) {
        height=height*1.2 //esto es por que en el iphone al hacer scroll el innerheight se amplia porque desaparece una barra de menu y se veia negro la parte de abjao
        //console.log("cambio height")
    }
    //camera.position.y=170
    renderer = new THREE.WebGLRenderer({antialias:false });
    renderer.domElement.id = 'backgroundCanvas';

    renderer.setSize(width, height);
    renderer.setClearColor(0x001414, 0.7);
    renderer.setPixelRatio( window.devicePixelRatio );
    document.body.appendChild(renderer.domElement);
    var renderModel = new THREE.RenderPass( scene, camera );
     effectBloom = new THREE.BloomBlendPass(4,1, new THREE.Vector2(width, height));
    composer = new THREE.EffectComposer(renderer);
    effectBloom.renderToScreen = true;
    composer.setSize(width, height );
    composer.addPass( renderModel );
    composer.addPass( effectBloom );
    renderer.autoClear = false;

    /*** add steer to vector 3 ***/
    THREE.Vector3.prototype.velocity=new THREE.Vector3(0,0,0);
    THREE.Vector3.prototype.acceleration=new THREE.Vector3(0,0,0);
    THREE.Vector3.prototype.steer=function(a_target,  a_slowdown,  a_scale,  a_minDist ) {
            _steer=new THREE.Vector3()
           var desired = new THREE.Vector3( a_target.x - this.x , a_target.y-this.y, a_target.z-this.z)

           var d = desired.length();

           // If the distance is greater than 0, calc _steering (otherwise return zero vector)
           if (d > 0) {
               //console.log(d)

               desired.normalize();

               if(a_minDist == 0) a_slowdown = false;
               // Two options for desired vector magnitude (1 -- based on distance, 2 -- maxspeed)
               if ((a_slowdown) && (d < a_minDist)) {
                   desired.multiplyScalar( (MAX_SPEED * (d/a_minDist)) )
                   } // This damping is somewhat arbitrary
               else {desired.multiplyScalar(MAX_SPEED); }

               _steer.set(desired.x - this.velocity.x,desired.y - this.velocity.y,desired.z - this.velocity.z);
               _steer.clampScalar(-MAX_STEER,MAX_STEER); //solo me interesa limite por arriba
               _steer.multiplyScalar(a_scale);
               aa=_steer;
               bb=desired
           } else {
               _steer.set(0, 0, 0);
               steerCounter++;
           }

           this.acceleration.x+= _steer.x
           this.acceleration.y+= _steer.y
           this.acceleration.z+= _steer.z
       }

    THREE.Vector3.prototype.update=function (){
       this.velocity.add(this.acceleration);
       this.add(this.velocity);
       //aa=this.acceleration;
       //console.log(this.acceleration[0])
       this.acceleration.x=0;
       this.acceleration.y=0;
       this.acceleration.z=0;
    }

/************** MATERIAL PARTICULAS *******************************************************************/
    //sistema de particulas
    // create the particle variables
     _size=8
     _size=_size/window.devicePixelRatio
    if(window.width<1024) _size=6
    //
    pMaterialStations = new THREE.PointsMaterial({
        color:0xDDFFDD,
        size: _size,
        map: new THREE.TextureLoader().load(
            "public/images/circle4.png"
        ),
        blending: THREE.NormalBlending,
        transparent: true,
        depthTest: false,

    });
    pMaterialStations.opacity=0.4
    _size=5;
    _size=_size/window.devicePixelRatio
    if(window.width<1024) _size=3

/// MATERIAL INTENSIDAD
    pMaterialIntensity=pMaterialStations.clone()
    pMaterialIntensity.color=new THREE.Color(0x44FF44);
    pMaterialIntensity.size=_size;
    pMaterialIntensity.opacity=0.4


// PARTICLE SYSTEMS
    particleCountStations=cleanTrafico.length
    particleCountIntensity=Math.round(d3.sum(cleanTrafico, function(d){ return d.rtdata.intensidad})/200)

    var particlesStationsGeo = new THREE.Geometry();
    for (var p = 0; p < particleCountStations; p++) {
        // create a particle with random
        // position values, -250 -> 250
        var p1 = new THREE.Vector3( (-cleanTrafico[p].geo.x+maxGeoX/2) *2, (-cleanTrafico[p].geo.y+maxGeoY/2) *2 , 0);
        var pX = p1.x+Math.random() * 300 - 150,
            pY = p1.y+Math.random() * 300 - 150,
            pZ = 0,
            particle =  new THREE.Vector3(pX, pY, pZ)
            particlesStationsGeo.vertices.push(particle);

    }
     particleSystemStations = new THREE.Points(
        particlesStationsGeo,
        pMaterialStations);
    particleSystemStations.geometry.dynamic = true;


    /**********************************************************/
    var particlesIntensityGeo = new THREE.Geometry();
    /*for (var p = 0; p < particleCountIntensity; p++) {
        // create a particle with random
        // position values, -250 -> 250
        var pX = Math.random() * 1000 - 500,
            pY = Math.random() * 1000 - 500,
            pZ = 0,
            particle =  new THREE.Vector3(pX, pY, pZ)
            particlesIntensityGeo.vertices.push(particle);
    } */
    var pCount=0;
    for (var i = 0; i < cleanTrafico.length; i++) {
        var intensidad = cleanTrafico[i].rtdata.intensidad/200;
        //if(intensidad==0) intensidad=1;
        for (var j = 1; j < intensidad; j+=1) {
            var p1;
            p1 = new THREE.Vector3( (-cleanTrafico[i].geo.x+maxGeoX/2) *2, (-cleanTrafico[i].geo.y+maxGeoY/2) *2 , 0);
            var pX = p1.x+Math.random() * 400 - 200,
                pY = p1.y+Math.random() * 400 - 200,
                pZ = 0
            pCount++;
            var particle =  new THREE.Vector3(pX, pY, pZ)
            particlesIntensityGeo.vertices.push(particle);
            if(pCount>=particleCountIntensity ) break;
        }
        if(pCount>=particleCountIntensity ) break;
    }

     particleSystemIntensity = new THREE.Points(
        particlesIntensityGeo,
        pMaterialIntensity);
    particleSystemIntensity.geometry.dynamic = true;

    // also update the particle system to
    // sort the particles which enables
    // the behaviour we want
//    particleSystem.sortParticles = true;

    // add it to the scene
    scene.add(particleSystemStations);
    scene.add(particleSystemIntensity);



/**********LINES CREATION ************/
    lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent:true, linewidth: 1 }); //0x167065
    lineMaterial.blending= THREE.NormalBlending
    lineMaterial.opacity=0.05;
    var geometry1 = new THREE.Geometry();
    var i=0, j=0;
    for (var i = 0; i < cleanTrafico.length; i+=4)
    {
        geometry1.vertices.push(particleSystemStations.geometry.vertices[i]);
    }

    line = new THREE.Line(geometry1, lineMaterial);
    line.geometry.dynamic = true;


    geometry1.verticesNeedUpdate=true
    scene.add(line)

    clock = new THREE.Clock(true)
    clock.start();
} //fin startThree

function animate() {

    if(globalScrolled<0.6) status=0
    else status=1

    updateColors();

    //particleSystemIntensity.material.opacity=globalScrolled/5
    if(mustUpdateParticles1==true) { ///OPTIMIZACION PARA PARAR ACTUALIZACION DE PARTICULAS CUANDO ESTAN ESTABLES
       for (var i = 0; i < cleanTrafico.length; i++) {
            var particle = particleSystemStations.geometry.vertices[i];
            p = new THREE.Vector3( (-cleanTrafico[i].geo.x+maxGeoX/2) *2, (-cleanTrafico[i].geo.y+maxGeoY/2) *2 , 0);
            particle.steer(p, true, 1, 5)
            particle.update();
            if(i%4==0)
                line.geometry.vertices[i/4].set(particle.x, particle.y, particle.z )
       }
        if(steerCounter> (cleanTrafico.length) && clock.getElapsedTime()>30 ) {
            mustUpdateParticles1=false
            console.log("mustUpdateParticles1=false")

        }
        particleSystemStations.geometry.verticesNeedUpdate=true
        line.geometry.verticesNeedUpdate=true
   }

       steerCounter=0;
       pCount = 0;

       if(status==1 || mustUpdateParticles2==true){ ///OPTIMIZACION PARA PARAR ACTUALIZACION DE PARTICULAS CUANDO ESTAN ESTABLES
           for (var i = 0; i < cleanTrafico.length; i++) {
               var intensidad = cleanTrafico[i].rtdata.intensidad/200;
               //if(intensidad==0) intensidad=1;
               for (var j = 1; j < intensidad; j+=1) {
                   var particle = particleSystemIntensity.geometry.vertices[pCount];
                   var p;
                   if(status==0)
                        p = new THREE.Vector3( (-cleanTrafico[i].geo.x+maxGeoX/2) *2, (-cleanTrafico[i].geo.y+maxGeoY/2) *2 , 0);
                   else
                        p = new THREE.Vector3( (-cleanTrafico[i].geo.x+maxGeoX/2) *2, (-cleanTrafico[i].geo.y+maxGeoY/2) *2 , -j*4);
                   particle.steer(p, true, 1, 5)
                   particle.update();
                   pCount++;
                   if(pCount>=particleCountIntensity ) break;
               }
               if(pCount>=particleCountIntensity ) break;
           }
           ///OPTIMIZACION PARA PARAR ACTUALIZACION DE PARTICULAS CUANDO ESTAN ESTABLES
           mustUpdateParticles2=true
           if( ( steerCounter>= (pCount-20)) && clock.getElapsedTime()>20 ) {
               mustUpdateParticles2=false

           }//////////////////////////////FIN OPTIMIZACION

            particleSystemIntensity.geometry.verticesNeedUpdate=true
        }
        //else console.log("not updating")
     if(globalScrolled<0.5)
      camera.position.lerpVectors(targetPositions[0], targetPositions[1], globalScrolled*2)
      else
      camera.position.lerpVectors(targetPositions[1], targetPositions[2], (globalScrolled-0.5)*2)
      camera.lookAt(0,0,0)
      //controls.update();
      // draw
      renderer.clear();
      //renderer.render(scene, camera);

      composer.render( );

      // set up the next call
      //requestAnimationFrame(animate);
      var fps=30
      if(globalIsVisible){ //if page is not visible, do not update again. needs to cal animate again
          setTimeout(function() {
              requestAnimationFrame(animate);
          }, 1000 / fps);
    }
        //console.log("cc")
    }

    function updateColors(){

        //bgColor.set()
        //bgColor.lerp(cBlanco,globalScrolled)
        var linecolorArr;
        var linesOpacity;
        //var bigPointOpacity;
        var smallPointOpacity;
        var particleSystemStationsColorArr;
        if(globalScrolled>(bpoint2) ){ //donde se vuelve negro otra vez
            //scale2 avanza en este tramo entre 1 y 0
                carray= interpolateColor([cNegro.r,cNegro.g,cNegro.b], [cBlanco.r,cBlanco.g,cBlanco.b],scale2(globalScrolled))
                linecolorArr = interpolateColor( [linesColorBgNegro.r,linesColorBgNegro.g,linesColorBgNegro.b],[linesColorBgBlanco.r,linesColorBgBlanco.g,linesColorBgBlanco.b],scale2(globalScrolled))
                particleSystemStationsColorArr = interpolateColor( [nodeParticlesColorBgNegro.r,nodeParticlesColorBgNegro.g,nodeParticlesColorBgNegro.b],[nodeParticlesColorBgBlanco.r,nodeParticlesColorBgBlanco.g,nodeParticlesColorBgBlanco.b],scale2(globalScrolled))
                linesOpacity=0.02*scale2(globalScrolled)
                bigPointOpacity=-0.3*scale2(globalScrolled)
            }
        else { // en este tramo scale1 vale 0 hasta que llega a al valor bpoint1 que vale 1
            carray= interpolateColor( [cNegro.r,cNegro.g,cNegro.b], [cBlanco.r,cBlanco.g,cBlanco.b], scale1(globalScrolled))
            linecolorArr = interpolateColor( [linesColorBgNegro.r,linesColorBgNegro.g,linesColorBgNegro.b],[linesColorBgBlanco.r,linesColorBgBlanco.g,linesColorBgBlanco.b],scale1(globalScrolled))
            particleSystemStationsColorArr = interpolateColor( [nodeParticlesColorBgNegro.r,nodeParticlesColorBgNegro.g,nodeParticlesColorBgNegro.b],[nodeParticlesColorBgBlanco.r,nodeParticlesColorBgBlanco.g,nodeParticlesColorBgBlanco.b],scale1(globalScrolled))
            linesOpacity=0.02*scale1(globalScrolled)
            bigPointOpacity=-0.3*scale1(globalScrolled)

        }
        //cambio color de particulas de intensidad
        var carrayPart=interpolateColor([particlesColorBgBlanco.r,particlesColorBgBlanco.g,particlesColorBgBlanco.b], [particlesColorBgNegro.r ,particlesColorBgNegro.g ,particlesColorBgNegro.b],scaleColorParticlesIntensity(globalScrolled))
        particleSystemStations.material.color.setRGB(particleSystemStationsColorArr[0],particleSystemStationsColorArr[1],particleSystemStationsColorArr[2]);
        particleSystemStations.material.opacity=0.4+bigPointOpacity

        particleSystemIntensity.material.color.setRGB(carrayPart[0],carrayPart[1],carrayPart[2]);
        if(status==1)
            particleSystemIntensity.material.opacity=0.4+bigPointOpacity;
        else particleSystemIntensity.material.opacity=0;

        line.material.color.setRGB(linecolorArr[0],linecolorArr[1],linecolorArr[2])
        line.material.opacity=0.05+linesOpacity;

        effectBloom.opacity = (1-(carray[0]) );
        bgColor.setRGB(carray[0],carray[1],carray[2])
        renderer.setClearColor(bgColor, 0.7+0.3*carray[0]);


    }

    function interpolateColor(color1, color2, factor) {
        var result = color1.slice();
        for (var i = 0; i < 3; i++) {
            result[i] = result[i] + factor * (color2[i] - color1[i]);
        }
        return result;
    };
