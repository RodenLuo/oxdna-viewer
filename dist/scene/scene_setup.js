// <reference path="./three/index.d.ts" />
// <reference path="./controls/three-trackballcontrols.d.ts" />
// <reference path="./lib/stats.js" />
// stats code 
//var stats = new stats();
//document.body.append(
//    stats.dom
//);
const canvas_custom = document.getElementById("threeCanvas");
var renderer_custom;
renderer_custom = new THREE.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true,
    canvas: canvas_custom
});
renderer_custom.setSize(WIDTH, HEIGHT);
renderer_custom.autoClear = false;
renderer_custom.sortObjects = true;
// document.body.appendChild(renderer_custom.domElement);
function createBufferGeometrySphere() {
    var geometry = new THREE.BufferGeometry();
    return geometry;
}
function createBufferGeometryCyl() {
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
var impostorMaterialSphere;
var impostorMaterialCyl;
createImpostorMaterial_Sphere();
createImpostorMaterial_Cyl();
function createImpostorMaterial_Cyl() {
    var outline_shader = {
        uniforms: THREE.UniformsUtils.merge([
            THREE.UniformsLib['lights'],
            THREE.UniformsLib['fog'],
            {
                'viewport': { type: 'v4', value: new THREE.Vector4() },
                'modelViewMatrixInverse': { type: 'm4', value: new THREE.Matrix4() },
                'projectionMatrixInverse': { type: 'm4', value: new THREE.Matrix4() },
                'emissive': { type: 'c', value: new THREE.Color(0x000000) },
                'specular': { type: 'c', value: new THREE.Color(0x111111) },
                'shininess': { type: 'f', value: 30 },
                'diffuse': { type: 'c', value: new THREE.Color(0xFFFFFF) },
                'opacity': { type: 'f', value: 0.1 },
                'fog': true,
                'radius': { type: 'f', value: 1.0 },
            }
        ]),
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
}
function createImpostorMaterial_Sphere() {
    var outline_shader = {
        uniforms: THREE.UniformsUtils.merge([
            THREE.UniformsLib['lights'],
            THREE.UniformsLib['fog'],
            {
                'viewport': { type: 'v4', value: new THREE.Vector4() },
                'modelViewMatrixInverse': { type: 'm4', value: new THREE.Matrix4() },
                'projectionMatrixInverse': { type: 'm4', value: new THREE.Matrix4() },
                'emissive': { type: 'c', value: new THREE.Color(0x000000) },
                'specular': { type: 'c', value: new THREE.Color(0x111111) },
                'shininess': { type: 'f', value: 30 },
                'diffuse': { type: 'c', value: new THREE.Color(0xFFFFFF) },
                'opacity': { type: 'f', value: 0.1 },
                'fog': true,
                'radius': { type: 'f', value: 3.0 },
            }
        ]),
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
var scene_custom = new THREE.Scene();
var WIDTH = window.innerWidth - 20;
var HEIGHT = window.innerHeight - 20;
var camera_custom = new THREE.PerspectiveCamera(50, window.WIDTH / HEIGHT, 1, 100);
camera_custom.position.z = 30;
camera_custom.position.y = 0;
var ambient = new THREE.AmbientLight(0xffffff, 1);
scene_custom.add(ambient);
var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 3, 3);
scene_custom.add(directionalLight);
var helper = new THREE.DirectionalLightHelper(directionalLight, 1);
scene_custom.add(helper);
scene_custom.add(camera_custom);
var controls_custom = new THREE.OrbitControls(camera_custom);
function add_custom_atoms_bonds(scene_to_add) {
    var mesh1, mesh2;
    var geometry1 = createBufferGeometryCyl();
    mesh1 = new THREE.Points(geometry1, impostorMaterialCyl);
    scene_to_add.add(mesh1);
    // var sphere1 = createBufferGeometrySphere([10, 0, 0], 5, [0.8, 0.5, 0.2]);
    // mesh2 = new THREE.Points(sphere1, impostorMaterialSphere);
    // scene.add(mesh2);
    var sphere1 = createBufferGeometrySphere();
    // Creating vertex buffer
    var position = new Float32Array([10, 0, 0]);
    sphere1.addAttribute('position', new THREE.BufferAttribute(position, 3));
    // Creating color buffer
    var color = new Float32Array([0.8, 0.5, 0.2]);
    sphere1.addAttribute('color', new THREE.BufferAttribute(color, 3));
    sphere1.computeVertexNormals();
    sphere1.normalizeNormals();
    mesh2 = new THREE.Points(sphere1, impostorMaterialSphere);
    scene_to_add.add(mesh2);
    var sphere1 = createBufferGeometrySphere();
    // Creating vertex buffer
    var position = new Float32Array([-10, 0, 0]);
    sphere1.addAttribute('position', new THREE.BufferAttribute(position, 3));
    // Creating color buffer
    var color = new Float32Array([0.8, 0.5, 0.2]);
    sphere1.addAttribute('color', new THREE.BufferAttribute(color, 3));
    sphere1.computeVertexNormals();
    sphere1.normalizeNormals();
    mesh2 = new THREE.Points(sphere1, impostorMaterialSphere);
    scene_to_add.add(mesh2);
}
add_custom_atoms_bonds(scene_custom);
function updateMaterialUniforms(group, camera) {
    var projectionMatrixInverse = new THREE.Matrix4();
    var projectionMatrixTranspose = new THREE.Matrix4();
    var modelViewMatrixInverse = new THREE.Matrix4();
    var viewport = new THREE.Vector4(0.0, 0.0, WIDTH, HEIGHT);
    camera.updateMatrixWorld();
    camera.matrixWorldInverse.getInverse(camera.matrixWorld);
    projectionMatrixInverse.getInverse(camera.projectionMatrix);
    projectionMatrixTranspose.copy(camera.projectionMatrix).transpose();
    group.traverse(function (o) {
        if (!o.material) {
            return;
        }
        var u = o.material.uniforms;
        if (!u) {
            return;
        }
        if (u.projectionMatrixInverse) {
            u.projectionMatrixInverse.value = projectionMatrixInverse;
        }
        if (u.projectionMatrixTranspose) {
            u.projectionMatrixTranspose.value = projectionMatrixTranspose;
        }
        if (u.modelViewMatrixInverse) {
            var matrix = new THREE.Matrix4().multiplyMatrices(camera.matrixWorldInverse, o.matrixWorld);
            modelViewMatrixInverse.getInverse(matrix);
            u.modelViewMatrixInverse.value = modelViewMatrixInverse;
        }
        if (u.viewport) {
            u.viewport.value = viewport;
        }
    });
}
;
// scene update call definition
function render() {
    var custom_render = 1;
    if (custom_render == 1) {
        // Clear renderer
        renderer_custom.clear();
        // Update uniforms for outline
        updateMaterialUniforms(scene_custom, camera_custom);
        // Render the scene
        renderer_custom.render(scene_custom, camera_custom);
    }
    else {
        renderer.render(scene, camera);
        //renderer.render(pickingScene, camera);
    }
}
function renderColorbar() {
    colorbarRenderer.render(colorbarScene, colorbarCamera);
}
// animation cycle and control updates
function animate() {
    requestAnimationFrame(animate);
    controls.update();
}
//Fix Resize problems
window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
    if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    }
    if (camera instanceof THREE.OrthographicCamera) {
        let frustumSize = camera.left / aspect * -2;
        aspect = window.innerWidth / window.innerHeight;
        camera.left = frustumSize * aspect / -2;
        camera.right = frustumSize * aspect / 2;
        camera.top = frustumSize / 2;
        camera.bottom = -frustumSize / 2;
        camera.updateProjectionMatrix();
    }
    // updates the visible scene 
    renderer.setSize(window.innerWidth, window.innerHeight);
    // updates the picker texture to match the renderer 
    pickingTexture.setSize(window.innerWidth, window.innerHeight);
    controls.handleResize();
    render();
}
let camera;
let aspect = window.innerWidth / window.innerHeight;
function createPerspectiveCamera(fov, near, far, pos) {
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(pos[0], pos[1], pos[2]);
    return camera;
}
function createOrthographicCamera(left, right, top, bottom, near, far, pos) {
    const camera = new THREE.OrthographicCamera(left, right, top, bottom, near, far);
    camera.position.set(pos[0], pos[1], pos[2]);
    return camera;
}
//Setup the scene and renderer and camera 
const GREY = new THREE.Color(0x888888);
const BLACK = new THREE.Color(0x000000);
const WHITE = new THREE.Color();
const scene = new THREE.Scene();
scene.background = WHITE;
camera = createPerspectiveCamera(45, 0.1, 999999, [100, 0, 0]); //create camera
const refQ = camera.quaternion.clone();
// Create canvas and renderer
const canvas = document.getElementById("threeCanvas");
const renderer = new THREE.WebGLRenderer({
    preserveDrawingBuffer: true,
    alpha: true,
    antialias: true,
    canvas: canvas
});
renderer.setSize(window.innerWidth, window.innerHeight); //set size of renderer - where actions are recognized
document.body.appendChild(renderer.domElement); //add renderer to document body
// Colorbars are rendered on a second canvas
const colorbarCanvas = document.getElementById("colorbarCanvas");
const colorbarRenderer = new THREE.WebGLRenderer({
    canvas: colorbarCanvas,
    alpha: true
});
colorbarRenderer.setClearColor(0x000000, 0);
const colorbarCamera = new THREE.OrthographicCamera(-7, 7, 1.8, -2.5, -1, 1);
const colorbarScene = new THREE.Scene();
// set scene lighting 
// The point light follows the camera so lighting is always uniform.
const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.5);
scene.add(hemiLight);
const pointlight = new THREE.PointLight(0xffffff, 0.5, 0);
pointlight.position.set(0, 50, 0);
camera.add(pointlight);
scene.add(camera);
// Add coordinate axes to scene
let dir = new THREE.Vector3(1, 0, 0);
const Origin = new THREE.Vector3(0, 0, 0);
const len = 10;
let arrowHelper = new THREE.ArrowHelper(dir, Origin, len, 0x800000); //create x-axis arrow
arrowHelper.name = "x-axis";
scene.add(arrowHelper); //add x-axis arrow to scene
dir = new THREE.Vector3(0, 1, 0);
arrowHelper = new THREE.ArrowHelper(dir, Origin, len, 0x008000);
arrowHelper.name = "y-axis";
scene.add(arrowHelper); //add y-axis arrow to scene
dir = new THREE.Vector3(0, 0, 1);
arrowHelper = new THREE.ArrowHelper(dir, Origin, len, 0x000080);
arrowHelper.name = "z-axis";
scene.add(arrowHelper); //add z-axis to scene
// Declare bounding box object
let boxObj;
function toggleBox(chkBox) {
    if (chkBox.checked) {
        // Redraw from scratch, in case it has changed size
        redrawBox();
    }
    if (boxObj) {
        boxObj.visible = chkBox.checked;
    }
    render();
}
function redrawBox() {
    let visible;
    if (boxObj) {
        visible = boxObj.visible;
        scene.remove(boxObj);
    }
    else {
        visible = false;
    }
    boxObj = drawBox(box, getCenteringGoal());
    boxObj.visible = visible;
    render();
}
// Remove coordinate axes from scene.  Hooked to "Display Arrows" checkbox on sidebar.
function toggleArrows(chkBox) {
    if (chkBox.checked) {
        let arrowHelper = scene.getObjectByName("x-axis");
        arrowHelper.visible = true;
        arrowHelper = scene.getObjectByName("y-axis");
        arrowHelper.visible = true;
        arrowHelper = scene.getObjectByName("z-axis");
        arrowHelper.visible = true;
    }
    else { //if not checked, set all axes to invisible
        let arrowHelper = scene.getObjectByName("x-axis");
        arrowHelper.visible = false;
        arrowHelper = scene.getObjectByName("y-axis");
        arrowHelper.visible = false;
        arrowHelper = scene.getObjectByName("z-axis");
        arrowHelper.visible = false;
    }
    render(); //update scene
}
function toggleBackground() {
    if (scene.background == WHITE) {
        scene.background = BLACK;
        render();
    }
    else {
        scene.background = WHITE;
        render();
    }
}
;
function setFog(near, far) {
    near = near | parseFloat(document.getElementById("fogNear").value);
    far = near | parseFloat(document.getElementById("fogFar").value);
    scene.fog = new THREE.Fog(scene.background, near, far);
    render();
}
function toggleFog(near, far) {
    if (scene.fog == null) {
        setFog(near, far);
    }
    else {
        scene.fog = null;
    }
    render();
}
function drawBox(size, position) {
    if (!position) {
        position = box.clone().divideScalar(2);
    }
    let material = new THREE.LineBasicMaterial({ color: GREY });
    let points = [];
    let a = position.clone().sub(size.clone().divideScalar(2));
    let b = size.clone().add(a);
    let f = (xComp, yComp, zComp) => {
        return new THREE.Vector3(xComp.x, yComp.y, zComp.z);
    };
    // I'm sure there's a clever way to do this in a loop...
    points.push(f(a, a, a));
    points.push(f(b, a, a));
    points.push(f(a, a, b));
    points.push(f(b, a, b));
    points.push(f(a, b, a));
    points.push(f(b, b, a));
    points.push(f(a, b, b));
    points.push(f(b, b, b));
    points.push(f(a, a, a));
    points.push(f(a, b, a));
    points.push(f(a, a, b));
    points.push(f(a, b, b));
    points.push(f(b, a, a));
    points.push(f(b, b, a));
    points.push(f(b, a, b));
    points.push(f(b, b, b));
    points.push(f(a, a, b));
    points.push(f(a, a, a));
    points.push(f(a, b, b));
    points.push(f(a, b, a));
    points.push(f(b, a, b));
    points.push(f(b, a, a));
    points.push(f(b, b, b));
    points.push(f(b, b, a));
    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    var boxObj = new THREE.LineSegments(geometry, material);
    scene.add(boxObj);
    render();
    return boxObj;
}
// adding mouse control to the scene 
const controls = new THREE.TrackballControls(camera, canvas);
controls.rotateSpeed = 1.5;
controls.zoomSpeed = 2; //frequently structures are large so turned this up
controls.panSpeed = 1.5;
controls.noZoom = false;
controls.noPan = false;
controls.staticMoving = true;
controls.dynamicDampingFactor = 0.2;
controls.keys = [65, 83, 68];
// following the logic of updating the scene only when the scene changes 
// controlls induce change so we update the scene when we move it  
controls.addEventListener('change', render);
const transformControls = new THREE.TransformControls(camera, renderer.domElement);
transformControls.addEventListener('change', render);
scene.add(transformControls);
transformControls.addEventListener('dragging-changed', function (event) {
    controls.enabled = !event['value'];
});
// start animation cycle / actually control update cycle 
// requestAnimationFrame could be replaced with a 
// timer event as it is misleading. 
animate();
