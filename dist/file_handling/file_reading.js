/// <reference path="../typescript_definitions/index.d.ts" />
// chunk .dat file so its not trying to read the entire thing at once
function datChunker(datFile, currentChunk, chunkSize) {
    const sliced = datFile.slice(currentChunk * chunkSize, currentChunk * chunkSize + chunkSize);
    return sliced;
}
//markers are used by the trajectory reader to keep track of configuration start/ends
class marker {
}
// Creates color overlays
function makeLut(data, key) {
    const min = Math.min.apply(null, data[key]), max = Math.max.apply(null, data[key]);
    if (lut == undefined) {
        lut = new THREE.Lut(defaultColormap, 512);
        lut.setMax(max);
        lut.setMin(min);
    }
    if (max > lut.maxV) {
        lut.setMax(max);
        api.removeColorbar();
    }
    if (min < lut.minV) {
        lut.setMin(min);
        api.removeColorbar();
    }
    lut.setLegendOn({ 'layout': 'horizontal', 'position': { 'x': 0, 'y': 0, 'z': 0 }, 'dimensions': { 'width': 2, 'height': 12 } }); //create legend
    lut.setLegendLabels({ 'title': key, 'ticks': 5 }); //set up legend format
    //update every system's color map
    for (let i = 0; i < systems.length; i++) {
        const system = systems[i];
        const end = system.systemLength();
        for (let i = 0; i < end; i++) { //insert lut colors into lutCols[] to toggle Lut coloring later
            system.lutCols[i] = lut.getColor(Number(system.colormapFile[key][i]));
        }
    }
}
// define the drag and drop behavior of the scene
const target = renderer.domElement;
target.addEventListener("dragover", function (event) {
    event.preventDefault();
}, false);
target.addEventListener("dragenter", function (event) {
    event.preventDefault();
    const e = document.getElementById("dragInstruction");
    e.style.opacity = "0.1";
}, false);
target.addEventListener("dragexit", function (event) {
    event.preventDefault();
    const e = document.getElementById("dragInstruction");
    e.style.opacity = "0.8";
}, false);
// the actual code to drop in the config files
//First, a bunch of global variables for trajectory reading
const datReader = new FileReader();
var trajReader;
let confNum = 0, datFileout = "", datFile, //currently var so only 1 datFile stored for all systems w/ last uploaded system's dat
box = new THREE.Vector3(); //box size for system
//and a couple relating to overlay files
var toggleFailure = false, defaultColormap = "cooltowarm";
// What to do if a file is dropped
target.addEventListener("drop", function (event) {
    // cancel default actions
    event.preventDefault();
    const files = event.dataTransfer.files, filesLen = files.length;
    let topFile, jsonFile;
    // assign files to the extentions
    for (let i = 0; i < filesLen; i++) {
        // get file extension
        const fileName = files[i].name;
        const ext = fileName.split('.').pop();
        if (ext === "dat")
            datFile = files[i];
        else if (ext === "conf")
            datFile = files[i];
        else if (ext === "oxdna")
            datFile = files[i];
        else if (ext === "top")
            topFile = files[i];
        else if (ext === "json")
            jsonFile = files[i];
        else {
            notify("This reader uses file extensions to determine file type.\nRecognized extensions are: .conf, .dat, .oxdna, .top, and .json\nPlease drop one .dat/.conf/.oxdna and one .top file.  .json data overlay is optional and can be added later.");
            return;
        }
    }
    let jsonAlone = false;
    if (jsonFile && !topFile)
        jsonAlone = true;
    if ((filesLen > 3 || filesLen < 2) && !jsonAlone) {
        notify("Please drag and drop 1 .dat and 1 .top file. .json is optional.  More .jsons can be dropped individually later");
        return;
    }
    readFiles(topFile, datFile, jsonFile);
    if (jsonFile && jsonAlone) {
        const jsonReader = new FileReader(); //read .json
        jsonReader.onload = () => {
            readJson(systems[systems.length - 1], jsonReader);
        };
        jsonReader.readAsText(jsonFile);
        renderer.domElement.style.cursor = "auto";
    }
    render();
}, false);
// Files can also be retrieved from a path
function readFilesFromPath(topologyPath, configurationPath) {
    if (topologyPath && configurationPath) {
        let topReq = new XMLHttpRequest();
        topReq.open("GET", topologyPath);
        topReq.responseType = "blob";
        topReq.onload = () => {
            const topFile = topReq.response;
            var datReq = new XMLHttpRequest();
            datReq.open("GET", configurationPath);
            datReq.responseType = "blob";
            datReq.onload = () => {
                datFile = datReq.response;
                readFiles(topFile, datFile);
            };
            datReq.send();
        };
        topReq.send();
    }
}
// And from the URL
function readFilesFromURLParams() {
    const url = new URL(window.location.href);
    const topologyPath = url.searchParams.get("topology");
    const configurationPath = url.searchParams.get("configuration");
    readFilesFromPath(topologyPath, configurationPath);
}
// Now that the files are identified, make sure the files are the correct ones and begin the reading process
function readFiles(topFile, datFile, jsonFile) {
    // Remove drag instructions
    const dragInstruction = document.getElementById("dragInstruction");
    dragInstruction.style.display = "none";
    //make system to store the dropped files in
    const system = new System(sysCount, elements.getNextId());
    if (topFile) {
        //read topology file
        const topReader = new TopReader(topFile, system, elements);
        topReader.read();
        // asynchronously read the first two chunks of a configuration file
        if (datFile) {
            renderer.domElement.style.cursor = "wait";
            //anonymous functions to handle fileReader outputs
            datReader.onload = () => {
                let isTraj = readDat(system.systemLength(), datReader, system);
                document.dispatchEvent(new Event('nextConfigLoaded'));
                //if its a trajectory, create the other readers
                if (isTraj) {
                    trajReader = new TrajectoryReader(datFile, system, approxDatLen, datReader.result);
                }
            };
            let approxDatLen = topFile.size * 30; //the relation between .top and a single .dat size is very variable, the largest I've found is 27x, although most are around 15x
            // read the first chunk
            const firstChunkBlob = datChunker(datFile, 0, approxDatLen);
            datReader.readAsText(firstChunkBlob);
            if (jsonFile) {
                const jsonReader = new FileReader(); //read .json
                jsonReader.onload = () => {
                    readJson(system, jsonReader);
                };
                jsonReader.readAsText(jsonFile);
                renderer.domElement.style.cursor = "auto";
            }
        }
    }
}
let xbbLast, ybbLast, zbbLast;
function readDat(numNuc, datReader, system) {
    let currentStrand = systems[sysCount].strands[0];
    // parse file into lines
    let lines = datReader.result.split(/[\n]+/g);
    if (lines.length - 3 < numNuc) { //Handles dat files that are too small.  can't handle too big here because you don't know if there's a trajectory
        notify(".dat and .top files incompatible");
        return;
    }
    //get the simulation box size
    box.x = parseFloat(lines[1].split(" ")[2]);
    box.y = parseFloat(lines[1].split(" ")[3]);
    box.z = parseFloat(lines[1].split(" ")[4]);
    const time = parseInt(lines[0].split(" ")[2]);
    confNum += 1;
    console.log(confNum, "t =", time);
    let timedisp = document.getElementById("trajTimestep");
    timedisp.innerHTML = `t = ${time}`;
    timedisp.hidden = false;
    // discard the header
    lines = lines.slice(3);
    let currentNucleotide, l;
    //for each line in the current configuration, read the line and calculate positions
    for (let i = 0; i < numNuc; i++) {
        if (lines[i] == "" || lines[i].slice(0, 1) == 't') {
            break;
        }
        ;
        // get the nucleotide associated with the line
        currentNucleotide = elements.get(i + system.globalStartId);
        // consume a new line from the file
        l = lines[i].split(" ");
        currentNucleotide.calculatePositions(l);
        //when a strand is finished, add it to the system
        if ((currentNucleotide.neighbor5 == undefined || currentNucleotide.neighbor5 == null) || (currentNucleotide.neighbor5.lid < currentNucleotide.lid)) { //if last nucleotide in straight strand
            system.addStrand(currentStrand); // add strand to system
            currentStrand = system.strands[currentStrand.strandID]; //don't ask, its another artifact of strands being 1-indexed
            if (elements.get(currentNucleotide.gid + 1) != undefined) {
                currentStrand = elements.get(currentNucleotide.gid + 1).strand;
            }
        }
    }
    addSystemToScene(system);
    PBCswitchbox();
    sysCount++;
    //if there's another time line after the first configuration is loaded, its a trajectory
    if (lines[numNuc].slice(0, 1) == 't')
        return true;
    return false;
}
function readJson(system, jsonReader) {
    const file = jsonReader.result;
    const data = JSON.parse(file);
    for (var key in data) {
        if (data[key].length == system.systemLength()) { //if json and dat files match/same length
            if (typeof (data[key][0]) == "number") { //we assume that scalars denote a new color map
                system.setColorFile(data);
                makeLut(data, key);
                try { //you need to toggle here for small systems, during the scene add for large systems because asynchronous reading.
                    setColoringMode("Overlay");
                }
                catch {
                    toggleFailure = true;
                }
            }
            if (data[key][0].length == 3) { //we assume that 3D vectors denote motion
                const end = system.systemLength() + system.globalStartId;
                for (let i = system.globalStartId; i < end; i++) {
                    const vec = new THREE.Vector3(data[key][i][0], data[key][i][1], data[key][i][2]);
                    const len = vec.length();
                    vec.normalize();
                    const arrowHelper = new THREE.ArrowHelper(vec, elements.get(i).getInstanceParameter3("bbOffsets"), len / 5, 0x000000);
                    arrowHelper.name = i + "disp";
                    scene.add(arrowHelper);
                }
            }
        }
        else if (data[key][0].length == 6) { //draw arbitrary arrows on the scene
            for (let entry of data[key]) {
                const pos = new THREE.Vector3(entry[0], entry[1], entry[2]);
                const vec = new THREE.Vector3(entry[3], entry[4], entry[5]);
                vec.normalize();
                const arrowHelper = new THREE.ArrowHelper(vec, pos, 5 * vec.length(), 0x00000);
                scene.add(arrowHelper);
            }
        }
        else { //if json and dat files do not match, display error message and set filesLen to 2 (not necessary)
            notify(".json and .top files are not compatible.");
            return;
        }
    }
}
function addSystemToScene(system) {
    // If you make any modifications to the drawing matricies here, they will take effect before anything draws
    // however, if you want to change once stuff is already drawn, you need to add "<attribute>.needsUpdate" before the render() call.
    // This will force the gpu to check the vectors again when redrawing.
    bachbone_impostor_geometry.addAttribute('position', new THREE.BufferAttribute(system.bbOffsets, 3));
    bachbone_impostor_geometry.addAttribute('color', new THREE.BufferAttribute(system.bbColors, 3));
    bachbone_impostor_geometry.computeVertexNormals();
    bachbone_impostor_geometry.normalizeNormals();
    var bachbone_impostor_geometry_mesh = new THREE.Points(bachbone_impostor_geometry, impostorMaterialSphere);
    scene_custom.add(bachbone_impostor_geometry_mesh);
    nucleosideGeometry_impostor.addAttribute('position', new THREE.BufferAttribute(system.nsOffsets, 3));
    nucleosideGeometry_impostor.addAttribute('color', new THREE.BufferAttribute(system.nsColors, 3));
    nucleosideGeometry_impostor.computeVertexNormals();
    nucleosideGeometry_impostor.normalizeNormals();
    var nucleosideGeometry_impostor_mesh = new THREE.Points(nucleosideGeometry_impostor, impostorMaterialSmallerSphere);
    scene_custom.add(nucleosideGeometry_impostor_mesh);
    connectorGeometry_impostor.addAttribute('position', new THREE.BufferAttribute(system.conOffsets, 3));
    connectorGeometry_impostor.addAttribute('dir', new THREE.BufferAttribute(system.conRotation, 3));
    connectorGeometry_impostor.addAttribute('color', new THREE.BufferAttribute(system.conOffsets, 3));
    connectorGeometry_impostor.computeVertexNormals();
    connectorGeometry_impostor.normalizeNormals();
    var connectorGeometry_impostor_mesh = new THREE.Points(connectorGeometry_impostor, impostorMaterialCyl);
    scene_custom.add(connectorGeometry_impostor_mesh);
    // Add the geometries to the systems
    system.backboneGeometry = instancedBackbone.clone();
    system.nucleosideGeometry = instancedNucleoside.clone();
    system.connectorGeometry = instancedConnector.clone();
    system.spGeometry = instancedBBconnector.clone();
    system.pickingGeometry = instancedBackbone.clone();
    // Feed data arrays to the geometries
    // system.backboneGeometry.addAttribute('position', new THREE.BufferAttribute(system.bbOffsets, 3));
    // system.backboneGeometry.addAttribute('color', new THREE.BufferAttribute(system.bbColors, 3));
    // system.backboneGeometry.computeVertexNormals();
    // system.backboneGeometry.normalizeNormals();
    // // Creating radius buffer
    // var radius = new Float32Array( [1] );
    // system.backboneGeometry.addAttribute('radius', new THREE.BufferAttribute(radius, 1));
    // // Creating color buffer
    // // var color = new Float32Array( [0.8, 0.5, 0.2] );
    // system.backboneGeometry.addAttribute('color', new THREE.BufferAttribute(system.bbColors, 3));
    // system.backboneGeometry.computeVertexNormals();
    // system.backboneGeometry.normalizeNormals();
    system.backboneGeometry.addAttribute('instanceOffset', new THREE.InstancedBufferAttribute(system.bbOffsets, 3));
    system.backboneGeometry.addAttribute('instanceRotation', new THREE.InstancedBufferAttribute(system.bbRotation, 4));
    system.backboneGeometry.addAttribute('instanceColor', new THREE.InstancedBufferAttribute(system.bbColors, 3));
    system.backboneGeometry.addAttribute('instanceScale', new THREE.InstancedBufferAttribute(system.scales, 3));
    system.backboneGeometry.addAttribute('instanceVisibility', new THREE.InstancedBufferAttribute(system.visibility, 3));
    system.nucleosideGeometry.addAttribute('instanceOffset', new THREE.InstancedBufferAttribute(system.nsOffsets, 3));
    system.nucleosideGeometry.addAttribute('instanceRotation', new THREE.InstancedBufferAttribute(system.nsRotation, 4));
    system.nucleosideGeometry.addAttribute('instanceColor', new THREE.InstancedBufferAttribute(system.nsColors, 3));
    system.nucleosideGeometry.addAttribute('instanceScale', new THREE.InstancedBufferAttribute(system.nsScales, 3));
    system.nucleosideGeometry.addAttribute('instanceVisibility', new THREE.InstancedBufferAttribute(system.visibility, 3));
    system.connectorGeometry.addAttribute('instanceOffset', new THREE.InstancedBufferAttribute(system.conOffsets, 3));
    system.connectorGeometry.addAttribute('instanceRotation', new THREE.InstancedBufferAttribute(system.conRotation, 4));
    system.connectorGeometry.addAttribute('instanceColor', new THREE.InstancedBufferAttribute(system.bbColors, 3));
    system.connectorGeometry.addAttribute('instanceScale', new THREE.InstancedBufferAttribute(system.conScales, 3));
    system.connectorGeometry.addAttribute('instanceVisibility', new THREE.InstancedBufferAttribute(system.visibility, 3));
    system.spGeometry.addAttribute('instanceOffset', new THREE.InstancedBufferAttribute(system.bbconOffsets, 3));
    system.spGeometry.addAttribute('instanceRotation', new THREE.InstancedBufferAttribute(system.bbconRotation, 4));
    system.spGeometry.addAttribute('instanceColor', new THREE.InstancedBufferAttribute(system.bbColors, 3));
    system.spGeometry.addAttribute('instanceScale', new THREE.InstancedBufferAttribute(system.bbconScales, 3));
    system.spGeometry.addAttribute('instanceVisibility', new THREE.InstancedBufferAttribute(system.visibility, 3));
    system.pickingGeometry.addAttribute('instanceColor', new THREE.InstancedBufferAttribute(system.bbLabels, 3));
    system.pickingGeometry.addAttribute('instanceOffset', new THREE.InstancedBufferAttribute(system.bbOffsets, 3));
    system.pickingGeometry.addAttribute('instanceVisibility', new THREE.InstancedBufferAttribute(system.visibility, 3));
    // Those were geometries, the mesh is actually what gets drawn
    system.backbone = new THREE.Mesh(system.backboneGeometry, instanceMaterial);
    system.backbone.frustumCulled = false; //you have to turn off culling because instanced materials all exist at (0, 0, 0)
    system.nucleoside = new THREE.Mesh(system.nucleosideGeometry, instanceMaterial);
    system.nucleoside.frustumCulled = false;
    system.connector = new THREE.Mesh(system.connectorGeometry, instanceMaterial);
    system.connector.frustumCulled = false;
    system.bbconnector = new THREE.Mesh(system.spGeometry, instanceMaterial);
    system.bbconnector.frustumCulled = false;
    system.dummyBackbone = new THREE.Mesh(system.pickingGeometry, pickingMaterial);
    system.dummyBackbone.frustumCulled = false;
    // Add everything to the scene
    scene.add(system.backbone);
    scene.add(system.nucleoside);
    scene.add(system.connector);
    scene.add(system.bbconnector);
    pickingScene.add(system.dummyBackbone);
    // Catch an error caused by asynchronous readers and different file sizes
    if (toggleFailure) {
        setColoringMode("Overlay");
    }
    render();
    // Reset the cursor from the loading spinny and reset canvas focus
    renderer.domElement.style.cursor = "auto";
    canvas.focus();
}
