var camera, scene, light, renderer, geometryCyl, geometrySphere, material, mesh1, mesh2, gl;

var WIDTH = window.innerWidth - 20;
var HEIGHT = window.innerHeight - 20;

var controls;
var impostorMaterialCyl;
var impostorMaterialSphere;

createImpostorMaterial();
init();
animate();

function init() {
    scene = new THREE.Scene();

    // var axisHelper = new THREE.AxesHelper( 1 );
    // scene.add( axisHelper );

    camera = new THREE.PerspectiveCamera(50, WIDTH / HEIGHT, 1, 100);
    camera.position.z = 30;
    camera.position.y = 0;
    
    var ambient = new THREE.AmbientLight( 0xffffff, 5 );
    scene.add(ambient);
    
    var directionalLight = new THREE.DirectionalLight( 0xffffff, 1.0 );
    directionalLight.position.set( 0, 3, 3 );
    scene.add( directionalLight );
    
    var helper = new THREE.DirectionalLightHelper(directionalLight, 1);
    scene.add(helper);
    
    scene.add(camera);
    
    // controls
    controls = new THREE.OrbitControls( camera );

    var geometry1 = createBufferGeometryCyl();
    mesh1 = new THREE.Points(geometry1, impostorMaterialCyl);
    scene.add(mesh1);
    

    // var sphere1 = createBufferGeometrySphere([10, 0, 0], 5, [0.8, 0.5, 0.2]);
    // mesh2 = new THREE.Points(sphere1, impostorMaterialSphere);
    // scene.add(mesh2);
        var sphere1 = createBufferGeometrySphere();
        // Creating vertex buffer
        var position = new Float32Array( [10, 0, 0] );
        sphere1.addAttribute('position', new THREE.BufferAttribute(position, 3));
        
        // Creating color buffer
        var color = new Float32Array( [0.8, 0.5, 0.2] );
        sphere1.addAttribute('color', new THREE.BufferAttribute(color, 3));
        
        sphere1.computeVertexNormals();
        sphere1.normalizeNormals();
        mesh2 = new THREE.Points(sphere1, impostorMaterialSphere);
        scene.add(mesh2);   
        
        var sphere1 = createBufferGeometrySphere();
        // Creating vertex buffer
        var position = new Float32Array( [-10, 0, 0] );
        sphere1.addAttribute('position', new THREE.BufferAttribute(position, 3));
        
        // Creating color buffer
        var color = new Float32Array( [0.8, 0.5, 0.2] );
        sphere1.addAttribute('color', new THREE.BufferAttribute(color, 3));
        
        sphere1.computeVertexNormals();
        sphere1.normalizeNormals();
        mesh2 = new THREE.Points(sphere1, impostorMaterialSphere);
        scene.add(mesh2); 


    
    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true});
    renderer.setSize(WIDTH, HEIGHT);
    renderer.autoClear = false;
    renderer.sortObjects = true;

    document.body.appendChild(renderer.domElement);
}
    
function animate() {
  	requestAnimationFrame(animate);
    render();
}

function render() {
    // Clear renderer
		renderer.clear();

		// Update uniforms for outline
		updateMaterialUniforms(scene, camera);
    
    // Render the scene
    renderer.render(scene, camera);
}

function createBufferGeometryCyl( ) {
    var geometry = new THREE.BufferGeometry();

		// Creating array buffers
    var positionArray = [];
    var colorArray = [];
    var radiusArray = [];
    var dirArray = [];
    
    // Init sphere position
    positionArray.push(-10.0, 0, 0);
  	colorArray.push(1, 0, 0);
    radiusArray.push(2.5);
    dirArray.push(10.0, 0.0, 0.0);
    
    positionArray.push(10.0, 0, 0);
  	colorArray.push(0.2, 0.8, 0.5);
    radiusArray.push(2.5);
    dirArray.push(-10.0, 0.0, 0.0);
    
    // Creating vertex buffer
    var position = new Float32Array(positionArray);
    geometry.addAttribute('position', new THREE.BufferAttribute(position, 3));
    
    // // Creating radius buffer
    // var radius = new Float32Array(radiusArray);
    // geometry.addAttribute('radius', new THREE.BufferAttribute(radius, 1));
    
    // Creating radius buffer
    var direction = new Float32Array(dirArray);
    geometry.addAttribute('dir', new THREE.BufferAttribute(direction, 3));
    
    // Creating color buffer
    var color = new Float32Array(colorArray);
    geometry.addAttribute('color', new THREE.BufferAttribute(color, 3));
    
		geometry.computeVertexNormals();
		geometry.normalizeNormals();
    
    return geometry;
}

function createBufferGeometrySphere() {
    var geometry = new THREE.BufferGeometry();
    
    return geometry;
}

function createImpostorMaterial() {
	var outline_shader = {
        uniforms: THREE.UniformsUtils.merge([
            THREE.UniformsLib['lights'],
            THREE.UniformsLib['fog'],
            {
                'viewport':  { type: 'v4', value: new THREE.Vector4() },
                'modelViewMatrixInverse':  { type: 'm4', value: new THREE.Matrix4() },
                'projectionMatrixInverse':  { type: 'm4', value: new THREE.Matrix4() },
                'emissive' : { type: 'c', value: new THREE.Color(0x000000) },
                'specular' : { type: 'c', value: new THREE.Color(0x111111) },
                'shininess': { type: 'f', value: 30 },
                'diffuse': { type: 'c', value: new THREE.Color(0xFFFFFF) },
                'opacity': { type: 'f', value: 0.1 },
                'fog': true,
                'radius': {type: 'f', value: 1.0 },
            }]),
        vertex_shader: document.getElementById('shaderCyl-vs').innerHTML,
        fragment_shader: document.getElementById('shaderCyl-fs').innerHTML
    };

    impostorMaterialCyl = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.clone(outline_shader.uniforms),
        vertexShader: outline_shader.vertex_shader,
        fragmentShader: outline_shader.fragment_shader,
        lights: true,
        vertexColors: THREE.VertexColors,
        fog: true,
        clipping: true
    });
    impostorMaterialCyl.extensions.fragDepth = true;
    
    outline_shader = {
        uniforms: THREE.UniformsUtils.merge([
            THREE.UniformsLib['lights'],
            THREE.UniformsLib['fog'],
            {
                'viewport':  { type: 'v4', value: new THREE.Vector4() },
                'modelViewMatrixInverse':  { type: 'm4', value: new THREE.Matrix4() },
                'projectionMatrixInverse':  { type: 'm4', value: new THREE.Matrix4() },
                'emissive' : { type: 'c', value: new THREE.Color(0x000000) },
                'specular' : { type: 'c', value: new THREE.Color(0x111111) },
                'shininess': { type: 'f', value: 30 },
                'diffuse': { type: 'c', value: new THREE.Color(0xFFFFFF) },
                'opacity': { type: 'f', value: 0.1 },
                'fog': true,
                'radius': {type: 'f', value: 4.0 },
            }]),
        vertex_shader: document.getElementById('shaderSphere-vs').innerHTML,
        fragment_shader: document.getElementById('shaderSphere-fs').innerHTML
    };

    impostorMaterialSphere = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.clone(outline_shader.uniforms),
        vertexShader: outline_shader.vertex_shader,
        fragmentShader: outline_shader.fragment_shader,
        lights: true,
        vertexColors: THREE.VertexColors,
        fog: true,
        clipping: true
    });
    impostorMaterialSphere.extensions.fragDepth = true;
}

function updateMaterialUniforms(group, camera) {

    var projectionMatrixInverse = new THREE.Matrix4();
    var projectionMatrixTranspose = new THREE.Matrix4();

    var modelViewMatrixInverse = new THREE.Matrix4();

    var viewport = new THREE.Vector4(0.0, 0.0, WIDTH, HEIGHT);

		camera.updateMatrixWorld();
    camera.matrixWorldInverse.getInverse( camera.matrixWorld );
    
    projectionMatrixInverse.getInverse(
        camera.projectionMatrix
    );

    projectionMatrixTranspose.copy(
        camera.projectionMatrix
    ).transpose();

    group.traverse(function(o) {
        if (!o.material) { return; }

        var u = o.material.uniforms;
        if (!u) { return; }

        if (u.projectionMatrixInverse) {
            u.projectionMatrixInverse.value = projectionMatrixInverse;
        }

        if (u.projectionMatrixTranspose) {
            u.projectionMatrixTranspose.value = projectionMatrixTranspose;
        }

        if (u.modelViewMatrixInverse) {
            var matrix = new THREE.Matrix4().multiplyMatrices(camera.matrixWorldInverse, o.matrixWorld);
            modelViewMatrixInverse.getInverse(
                matrix
            );
            u.modelViewMatrixInverse.value = modelViewMatrixInverse;
        }

        if (u.viewport) {
            u.viewport.value = viewport;
        }
    });
};