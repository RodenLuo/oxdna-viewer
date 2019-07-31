/// <reference path="./three/index.d.ts" />

// store rendering mode RNA  
let RNA_MODE = false; // By default we do DNA base spacing
// add base index visualistion
var elements: BasicElement[] = []; //contains references to all BasicElements
//initialize the space
var systems: System[] = [];
let sys_count: number = 0;
let strand_count: number = 0;
let nuc_count: number = 0;
//var selected_bases: number[] = [];
var selected_bases = new Set<BasicElement>();

var backbones: THREE.Object3D[] = [];
let lut, devs: number[]; //need for Lut coloring
let lutCols: THREE.Color[] = [];
let lutColsVis: boolean = false;

let DNA: number = 0;
let RNA: number = 1;
let AA: number = 2;


render();
// elements store the information about position, orientation, ID
// Eventually there should be a way to pair them
// Everything is an Object3D, but only elements have anything to render
class BasicElement extends THREE.Group{
    local_id: number;
    global_id: number; //location in world - all systems
    pos: THREE.Vector3; //not automatically updated; updated before rotation
    neighbor3: BasicElement | null;
    neighbor5: BasicElement | null;
    pair: number;
    elem_type: number | string; // 0:A 1:G 2:C 3:T/U OR 1 of 20 amino acids
    parent: Strand;
    //visual_object: THREE.Group; //contains 4 THREE.Mesh
    BACKBONE: number = 0;
    NUCLEOSIDE: number = 1;
    BB_NS_CON: number = 2;
    COM: number = 3;
    SP_CON: number = 4;
    element_type: number = -1;

    constructor(global_id: number, parent: Strand) {
        super();
        this.global_id = global_id;
        this.parent = parent;
    };

    calculatePositions(x: number, y: number, z: number, l: string) {

    };
    calculateNewConfigPositions(x: number, y: number, z: number, l: string) {

    };
    updateSP(): THREE.Object3D {
        return new THREE.Object3D();
    };
    getCOM(): number {
        return this.BACKBONE;
    };
    //abstract rotate(): void;
    toggle() {

    };
    strand_to_material(strandIndex: number) {
        return backbone_materials[Math.abs(strandIndex) % backbone_materials.length];
    };
    elem_to_material(type: number | string): THREE.MeshLambertMaterial {
        return new THREE.MeshLambertMaterial();
    };
    getDatFileOutput(): string {
        return "";
    };
    resetColor(nucNec: boolean) {

    };
};

class Nucleotide extends BasicElement {
    constructor(global_id: number, parent: Strand) {
        super(global_id, parent);
    };
    calculatePositions(x: number, y: number, z: number, l: string) {
        // extract axis vector a1 (backbone vector) and a3 (stacking vector) 
        let x_a1 = parseFloat(l[3]),
            y_a1 = parseFloat(l[4]),
            z_a1 = parseFloat(l[5]),
            x_a3 = parseFloat(l[6]),
            y_a3 = parseFloat(l[7]),
            z_a3 = parseFloat(l[8]);

        // according to base.py a2 is the cross of a1 and a3
        let [x_a2, y_a2, z_a2] = cross(x_a1, y_a1, z_a1, x_a3, y_a3, z_a3);
        // compute backbone cm
        let x_bb: number = 0;
        let y_bb: number = 0;
        let z_bb: number = 0;
        let bbpos: THREE.Vector3 = this.calcBBPos(x, y, z, x_a1, y_a1, z_a1, x_a2, y_a2, z_a2, x_a3, y_a3, z_a3);
        x_bb = bbpos.x;
        y_bb = bbpos.y;
        z_bb = bbpos.z;

        // compute nucleoside cm
        let x_ns = x + 0.4 * x_a1,
            y_ns = y + 0.4 * y_a1,
            z_ns = z + 0.4 * z_a1;

        //compute connector position
        let x_con = (x_bb + x_ns) / 2,
            y_con = (y_bb + y_ns) / 2,
            z_con = (z_bb + z_ns) / 2;

        //compute connector length
        let con_len = Math.sqrt(Math.pow(x_bb - x_ns, 2) + Math.pow(y_bb - y_ns, 2) + Math.pow(z_bb - z_ns, 2));

        let base_rotation = new THREE.Matrix4().makeRotationFromQuaternion( //create base sphere rotation
            new THREE.Quaternion().setFromUnitVectors(
                new THREE.Vector3(0, 1, 0),
                new THREE.Vector3(x_a3, y_a3, z_a3)));

        // correctly display stacking interactions
        let rotation_con = new THREE.Matrix4().makeRotationFromQuaternion( //creat nucleoside sphere rotation
            new THREE.Quaternion().setFromUnitVectors(
                new THREE.Vector3(0, 1, 0), new THREE.Vector3(x_con - x_ns, y_con - y_ns, z_con - z_ns).normalize()
            )
        );
        // adds a new "backbone", new "nucleoside", and new "connector" to the scene by adding to visual_object then to strand_3objects then to system_3objects then to scene
        //let group = new THREE.Group; //create visual_object group
        this.name = this.global_id + ""; //set name (string) to nucleotide's global id
        let backbone, nucleoside, con;
        // 4 Mesh to display DNA + 1 Mesh to store visual_object group's center of mass as its position
        //make material depending on whether there is an alternate color scheme available
        var material;
        if (lutColsVis) {
            material = new THREE.MeshLambertMaterial({
                color: lutCols[i],
                side: THREE.DoubleSide
            })
        }
        else {
            material = this.strand_to_material(this.parent.strand_id);
        }
        backbone = new THREE.Mesh(backbone_geometry, material); //sphere - sugar phosphate backbone
        nucleoside = new THREE.Mesh(nucleoside_geometry, this.elem_to_material(this.type)); //sphere - nucleotide
        con = new THREE.Mesh(connector_geometry, material); //cyclinder - backbone and nucleoside connector
        let posObj = new THREE.Mesh; //Mesh (no shape) storing visual_object group center of mass  
        con.applyMatrix(new THREE.Matrix4().makeScale(1.0, con_len, 1.0));
        // apply rotations
        nucleoside.applyMatrix(base_rotation);
        con.applyMatrix(rotation_con);
        //set positions and add to object (group - visual_object)
        backbone.position.set(x_bb, y_bb, z_bb);
        nucleoside.position.set(x_ns, y_ns, z_ns);
        con.position.set(x_con, y_con, z_con);
        posObj.position.set(x, y, z);
        this.add(backbone);
        this.add(nucleoside);
        this.add(con);
        this.add(posObj);

        //last, add the sugar-phosphate bond since its not done for the first nucleotide in each strand
        if (this.neighbor3 != null && this.neighbor3.local_id < this.local_id) {
            let x_sp = (x_bb + x_bb_last) / 2, //sugar phospate position in center of both current and last sugar phosphates
                y_sp = (y_bb + y_bb_last) / 2,
                z_sp = (z_bb + z_bb_last) / 2;

            let sp_len = Math.sqrt(Math.pow(x_bb - x_bb_last, 2) + Math.pow(y_bb - y_bb_last, 2) + Math.pow(z_bb - z_bb_last, 2));
            // easy periodic boundary condition fix  
            // if the bonds are to long just don't add them 
            if (sp_len <= 500) {
                let rotation_sp = new THREE.Matrix4().makeRotationFromQuaternion(
                    new THREE.Quaternion().setFromUnitVectors(
                        new THREE.Vector3(0, 1, 0), new THREE.Vector3(x_sp - x_bb, y_sp - y_bb, z_sp - z_bb).normalize()
                    )
                );
                let sp = new THREE.Mesh(connector_geometry, material); //cylinder - sugar phosphate connector
                sp.applyMatrix(new THREE.Matrix4().makeScale(1.0, sp_len, 1.0)); //set length according to distance between current and last sugar phosphate
                sp.applyMatrix(rotation_sp); //set rotation
                sp.position.set(x_sp, y_sp, z_sp);
                this.add(sp); //add to visual_object
            }
        }
        if (this.neighbor5 != null && this.neighbor5.local_id < this.local_id) { //handles strand end connection
            let x_sp = (x_bb + this.neighbor5.children[this.BACKBONE].position.x) / 2, //make sugar phosphate connection
                y_sp = (y_bb + this.neighbor5.children[this.BACKBONE].position.y) / 2,
                z_sp = (z_bb + this.neighbor5.children[this.BACKBONE].position.z) / 2;
            let sp_len = Math.sqrt(Math.pow(x_bb - this.neighbor5.children[this.BACKBONE].position.x, 2) + Math.pow(y_bb - this.neighbor5.children[this.BACKBONE].position.y, 2) + Math.pow(z_bb - this.neighbor5.children[this.BACKBONE].position.z, 2));
            let rotation_sp = new THREE.Matrix4().makeRotationFromQuaternion(
                new THREE.Quaternion().setFromUnitVectors(
                    new THREE.Vector3(0, 1, 0), new THREE.Vector3(x_sp - x_bb, y_sp - y_bb, z_sp - z_bb).normalize()
                )
            );
            let sp = new THREE.Mesh(connector_geometry, material); //cylinder - sugar phosphate connector
            sp.applyMatrix(new THREE.Matrix4().makeScale(1.0, sp_len, 1.0)); //set length according to distance between current and last sugar phosphate
            sp.applyMatrix(rotation_sp); //set rotation
            sp.position.set(x_sp, y_sp, z_sp);
            this.add(sp); //add to visual_object
        }

        //actually add the new items to the scene by adding to visual_object then to strand_3objects then to system_3objects then to scene
        //this.visual_object = group; //set Nucleotide nuc's attribute to group
        this.parent.add(this); //add group to strand_3objects
        //update last backbone position and last strand
        x_bb_last = x_bb;
        y_bb_last = y_bb;
        z_bb_last = z_bb;
    };
    calcBBPos(x: number, y: number, z: number, x_a1: number, y_a1: number, z_a1: number, x_a2: number, y_a2: number, z_a2: number, x_a3: number, y_a3: number, z_a3: number): THREE.Vector3 {
        return new THREE.Vector3(x, y, z);
    };
    calculateNewConfigPositions(x: number, y: number, z: number, l: string) {
        // extract axis vector a1 (backbone vector) and a3 (stacking vector) 
        let x_a1 = parseFloat(l[3]),
            y_a1 = parseFloat(l[4]),
            z_a1 = parseFloat(l[5]),
            x_a3 = parseFloat(l[6]),
            y_a3 = parseFloat(l[7]),
            z_a3 = parseFloat(l[8]);

        // according to base.py a2 is the cross of a1 and a3
        let [x_a2, y_a2, z_a2] = cross(x_a1, y_a1, z_a1, x_a3, y_a3, z_a3);
        // compute backbone cm
        let x_bb: number = 0;
        let y_bb: number = 0;
        let z_bb: number = 0;
        let bbpos: THREE.Vector3 = this.calcBBPos(x, y, z, x_a1, y_a1, z_a1, x_a2, y_a2, z_a2, x_a3, y_a3, z_a3);
        x_bb = bbpos.x;
        y_bb = bbpos.y;
        z_bb = bbpos.z;

        // compute nucleoside cm
        let x_ns = x + 0.4 * x_a1,
            y_ns = y + 0.4 * y_a1,
            z_ns = z + 0.4 * z_a1;

        //compute connector position
        let x_con = (x_bb + x_ns) / 2,
            y_con = (y_bb + y_ns) / 2,
            z_con = (z_bb + z_ns) / 2;

        //correctly display stacking interactions
        let old_a3 = new THREE.Matrix4();
        old_a3.extractRotation(this.children[this.NUCLEOSIDE].matrix);
        let base_rotation = new THREE.Matrix4().makeRotationFromQuaternion(
            new THREE.Quaternion().setFromUnitVectors(
                new THREE.Vector3(old_a3.elements[4], old_a3.elements[5], old_a3.elements[6]),
                new THREE.Vector3(x_a3, y_a3, z_a3)));

        // correctly orient connectors
        let neg_NS_pos = this.children[this.NUCLEOSIDE].position.multiplyScalar(-1);
        let curr_heading = this.children[this.BACKBONE].position.add(neg_NS_pos);

        let rotation_con = new THREE.Matrix4().makeRotationFromQuaternion(
            new THREE.Quaternion().setFromUnitVectors(
                curr_heading.normalize(), new THREE.Vector3(x_bb - x_ns, y_bb - y_ns, z_bb - z_ns).normalize()
            )
        );

        // update position and orientation of the elements
        let group = this;
        let locstrandID = this.parent.strand_id;
        group.name = this.global_id + "";

        //set new positions/rotations for the meshes.  Don't need to create new meshes since they exist.
        //if you position.set() before applyMatrix() everything explodes and I don't know why
        group.children[this.BACKBONE].position.set(x_bb, y_bb, z_bb);
        group.children[this.NUCLEOSIDE].applyMatrix(base_rotation);
        group.children[this.NUCLEOSIDE].position.set(x_ns, y_ns, z_ns);
        //not going to change the BB_NS_CON length because its the same out to 7 decimal places each time
        group.children[this.BB_NS_CON].applyMatrix(rotation_con);
        group.children[this.BB_NS_CON].position.set(x_con, y_con, z_con);
        group.children[this.COM].position.set(x, y, z);

        //last, add the sugar-phosphate bond since its not done for the first nucleotide in each strand
        if (this.neighbor3 != null) {
            //remove the current sugar-phosphate bond to make room for the new one
            scene.remove(group.children[this.SP_CON]);

            //get current and 3' backbone positions and set length/rotation
            let last_pos = new THREE.Vector3();
            this.neighbor3.children[this.BACKBONE].getWorldPosition(last_pos);
            let this_pos = new THREE.Vector3();
            group.children[this.BACKBONE].getWorldPosition(this_pos);
            let x_sp = (this_pos.x + last_pos.x) / 2,
                y_sp = (this_pos.y + last_pos.y) / 2,
                z_sp = (this_pos.z + last_pos.z) / 2;
            let sp_len = Math.sqrt(Math.pow(this_pos.x - last_pos.x, 2) + Math.pow(this_pos.y - last_pos.y, 2) + Math.pow(this_pos.z - last_pos.z, 2));

            let rotation_sp = new THREE.Matrix4().makeRotationFromQuaternion(
                new THREE.Quaternion().setFromUnitVectors(
                    new THREE.Vector3(0, 1, 0), new THREE.Vector3(this_pos.x - last_pos.x, this_pos.y - last_pos.y, this_pos.z - last_pos.z).normalize()
                )
            );
            this.updateSP();
            
            //group.children[SP_CON] = new THREE.Mesh(connector_geometry, system.strand_to_material(locstrandID));
            group.children[this.SP_CON].applyMatrix(new THREE.Matrix4().makeScale(1.0, sp_len, 1.0)); //length
            group.children[this.SP_CON].applyMatrix(rotation_sp); //rotate
            group.children[this.SP_CON].position.set(x_sp, y_sp, z_sp); //set position
            group.children[this.SP_CON].parent = this;
        };
    };
    updateSP(): THREE.Object3D{
        let sp_Mesh: THREE.Object3D = this.children[this.SP_CON];
        if (sp_Mesh !== undefined && sp_Mesh instanceof THREE.Mesh) {
            if (sp_Mesh.material instanceof THREE.MeshLambertMaterial) {
                sp_Mesh.material = this.strand_to_material(this.parent.strand_id);
            }
            let geo: THREE.Geometry | THREE.BufferGeometry = sp_Mesh.geometry;
            geo = connector_geometry;
            if (geo instanceof THREE.CylinderGeometry) {
                console.log(geo.parameters);
            }
            sp_Mesh.drawMode = THREE.TrianglesDrawMode;
            sp_Mesh.updateMorphTargets();

            sp_Mesh.up = THREE.Object3D.DefaultUp.clone();

            sp_Mesh.position.set(0, 0, 0);
            sp_Mesh.rotation.set(0, 0, 0);
            sp_Mesh.quaternion.set(0, 0, 0, 0);
            sp_Mesh.scale.set(1, 1, 1);

            sp_Mesh.matrix.set(1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1);
            sp_Mesh.matrixWorld.set(1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1);

            sp_Mesh.matrixAutoUpdate = THREE.Object3D.DefaultMatrixAutoUpdate;
            sp_Mesh.matrixWorldNeedsUpdate = false;

            //sp_Mesh.layers.set(1);
            sp_Mesh.visible = true;

            sp_Mesh.castShadow = false;
            sp_Mesh.receiveShadow = false;

            sp_Mesh.frustumCulled = true;
            sp_Mesh.renderOrder = 0;

            sp_Mesh.userData = {};
        }
        return sp_Mesh;
    }
    getCOM(): number {
        return this.COM;
    };
    resetColor(nucNec : boolean) {
        let back_Mesh: THREE.Object3D = this.children[this.BACKBONE]; //get clicked nucleotide's Meshes
        let nuc_Mesh: THREE.Object3D = this.children[this.NUCLEOSIDE];
        let con_Mesh: THREE.Object3D = this.children[this.BB_NS_CON];
        let sp_Mesh: THREE.Object3D = this.children[this.SP_CON];
        // figure out what that base was before you painted it black and revert it
        //recalculate Mesh's proper coloring and set Mesh material on scene to proper material
        if (back_Mesh instanceof THREE.Mesh) { //necessary for proper typing
            if (back_Mesh.material instanceof THREE.MeshLambertMaterial) {
                back_Mesh.material = this.strand_to_material(this.parent.strand_id);
            }
        }
        if (nucNec) {
            if (nuc_Mesh instanceof THREE.Mesh) {
                if (nuc_Mesh.material instanceof THREE.MeshLambertMaterial) {
                    nuc_Mesh.material = this.elem_to_material(this.type);
                }
            }
        }
        if (con_Mesh instanceof THREE.Mesh) {
            if (con_Mesh.material instanceof THREE.MeshLambertMaterial) {
                con_Mesh.material = this.strand_to_material(this.parent.strand_id);
            }
        }
        if (sp_Mesh !== undefined && sp_Mesh instanceof THREE.Mesh) {
            if (sp_Mesh.material instanceof THREE.MeshLambertMaterial) {
                sp_Mesh.material = this.strand_to_material(this.parent.strand_id);
            }
        }
    }
    toggle() {
        // highlight/remove highlight the bases we've clicked 
        let selected: boolean = false;
        let nucleotideID: number = this.global_id;
        let sysID: number = this.parent.parent.system_id;
        let back_Mesh: THREE.Object3D = this.children[this.BACKBONE]; //get clicked nucleotide's Meshes
        let nuc_Mesh: THREE.Object3D = this.children[this.NUCLEOSIDE];
        let con_Mesh: THREE.Object3D = this.children[this.BB_NS_CON];
        let sp_Mesh: THREE.Object3D = this.children[this.SP_CON];
        if (selected_bases.has(this)) { //if clicked nucleotide is already selected
            this.resetColor(true);
            selected_bases.delete(this); //"unselect" nucletide by setting value in selected_bases array at nucleotideID to 0
        }
        else {
            //set all materials to selection_material color - currently aqua
            if (back_Mesh instanceof THREE.Mesh) {
                if (back_Mesh.material instanceof THREE.MeshLambertMaterial)
                    back_Mesh.material = selection_material;
            }
            if (nuc_Mesh instanceof THREE.Mesh) {
                if (nuc_Mesh.material instanceof THREE.MeshLambertMaterial)
                    nuc_Mesh.material = selection_material;
            }
            if (con_Mesh instanceof THREE.Mesh) {
                if (con_Mesh.material instanceof THREE.MeshLambertMaterial)
                    con_Mesh.material = selection_material;
            }
            if (sp_Mesh !== undefined && sp_Mesh instanceof THREE.Mesh) {
                if (sp_Mesh.material instanceof THREE.MeshLambertMaterial)
                    sp_Mesh.material = selection_material;
            }
            //selList.push(nucleotideID);
            selected_bases.add(this); //"select" nucletide by setting value in selected_bases array at nucleotideID to 1
        }
    };
    elem_to_material(elem: number | string): THREE.MeshLambertMaterial {
        if (typeof elem == "string") {
            elem = { "A": 0, "G": 1, "C": 2, "T": 3, "U": 3 }[elem];
        }
        else elem = Math.abs(elem);
        return nucleoside_materials[elem];
    };
    getDatFileOutput(): string {
        let dat: string = "";
        let tempVec: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
        this.children[3].getWorldPosition(tempVec); //nucleotide's center of mass in world
        let x: number = tempVec.x;
        let y: number = tempVec.y;
        let z: number = tempVec.z;
        this.children[0].getWorldPosition(tempVec); //nucleotide's sugar phosphate backbone's world position
        let x_bb: number = tempVec.x;
        let y_bb: number = tempVec.y;
        let z_bb: number = tempVec.z;
        this.children[1].getWorldPosition(tempVec); //nucleotide's nucleoside's world position
        let x_ns: number = tempVec.x;
        let y_ns: number = tempVec.y;
        let z_ns: number = tempVec.z;
        let x_a1: number;
        let y_a1: number;
        let z_a1: number;
        //calculate axis vector a1 (backbone vector) and a3 (stacking vector)
        x_a1 = (x_ns - x) / 0.4;
        y_a1 = (y_ns - y) / 0.4;
        z_a1 = (z_ns - z) / 0.4;
        let a3: THREE.Vector3 = this.getA3(x_bb, y_bb, z_bb, x, y, z, x_a1, y_a1, z_a1);
        let x_a3: number = a3.x;
        let y_a3: number = a3.y;
        let z_a3: number = a3.z;
        dat = x + " " + y + " " + z + " " + x_a1 + " " + y_a1 + " " + z_a1 + " " + x_a3 + " " + y_a3 +
            " " + z_a3 + " 0 0 0 0 0 0" + "\n"; //add all locations to dat file string
        return dat;
    };
    getA3(x_bb: number, y_bb: number, z_bb: number, x: number, y: number, z: number, x_a1: number, y_a1: number, z_a1: number): THREE.Vector3 {
        return new THREE.Vector3();
    };
};

class DNANucleotide extends Nucleotide {
    constructor(global_id: number, parent: Strand) {
        super(global_id, parent);
        this.element_type = DNA;
    };
    calcBBPos(x: number, y: number, z: number, x_a1: number, y_a1: number, z_a1: number, x_a2: number, y_a2: number, z_a2: number, x_a3: number, y_a3: number, z_a3: number): THREE.Vector3 {
        let x_bb = x - (0.34 * x_a1 + 0.3408 * x_a2),
            y_bb = y - (0.34 * y_a1 + 0.3408 * y_a2),
            z_bb = z - (0.34 * z_a1 + 0.3408 * z_a2);
        return new THREE.Vector3(x_bb, y_bb, z_bb);
    };
    getA3(x_bb: number, y_bb: number, z_bb: number, x: number, y: number, z: number, x_a1: number, y_a1: number, z_a1: number): THREE.Vector3 {
        let x_a2: number;
        let y_a2: number;
        let z_a2: number;
        x_a2 = ((x_bb - x) + (0.34 * x_a1)) / (-0.3408);
        y_a2 = ((y_bb - y) + (0.34 * y_a1)) / (-0.3408);
        z_a2 = ((z_bb - z) + (0.34 * z_a1)) / (-0.3408);

        let Coeff = [[0, -(z_a1), y_a1], [-(z_a1), 0, x_a1], [-(y_a1), x_a1, 0]];
        let x_matrix = [[x_a2, -(z_a1), y_a1], [y_a2, 0, x_a1], [z_a2, x_a1, 0]];
        let y_matrix = [[0, x_a2, y_a1], [-(z_a1), y_a2, x_a1], [-(y_a1), z_a2, 0]];
        let z_matrix = [[0, -(z_a1), x_a2], [-(z_a1), 0, y_a2], [-(y_a1), x_a1, z_a2]];

        let a3: number[] = divAndNeg(cross(x_a1, y_a1, z_a1, x_a2, y_a2, z_a2), dot(x_a1, y_a1, z_a1, x_a1, y_a1, z_a1));
        let x_a3 = a3[0]; let y_a3 = a3[1]; let z_a3 = a3[2];
        return new THREE.Vector3(x_a3, y_a3, z_a3);
    };
};
class RNANucleotide extends Nucleotide {
    constructor(global_id: number, parent: Strand) {
        super(global_id, parent);
        this.element_type = RNA;
    };
    calcBBPos(x: number, y: number, z: number, x_a1: number, y_a1: number, z_a1: number, x_a2: number, y_a2: number, z_a2: number, x_a3: number, y_a3: number, z_a3: number): THREE.Vector3 {
        let x_bb = x - (0.4 * x_a1 + 0.2 * x_a3),
            y_bb = y - (0.4 * y_a1 + 0.2 * y_a3),
            z_bb = z - (0.4 * z_a1 + 0.2 * z_a3);
        return new THREE.Vector3(x_bb, y_bb, z_bb);
    };
    getA3(x_bb: number, y_bb: number, z_bb: number, x: number, y: number, z: number, x_a1: number, y_a1: number, z_a1: number): THREE.Vector3 {
        let x_a3 = ((x_bb - x) + (0.4 * x_a1)) / (-0.2);
        let y_a3 = ((y_bb - y) + (0.4 * y_a1)) / (-0.2);
        let z_a3 = ((z_bb - z) + (0.4 * z_a1)) / (-0.2);
        return new THREE.Vector3(x_a3, y_a3, z_a3);
    };
};
class AminoAcid extends BasicElement {
    constructor(global_id: number, parent: Strand) {
        super(global_id, parent);
        this.SP_CON = 1;
        this.element_type = AA;
    };
    elem_to_material(elem: number | string): THREE.MeshLambertMaterial {
        if (typeof elem == "string") {
            elem = { "R": 0, "H": 1, "K": 2, "D": 3, "E": 3, "S": 4, "T": 5, "N": 6, "Q": 7, "C": 8, "U": 9, "G": 10, "P": 11, "A": 12, "V": 13, "I": 14, "L": 15, "M": 16, "F": 17, "Y": 18, "W": 19 }[elem];
        }
        else elem = Math.abs(elem);
        return nucleoside_materials[elem];
    };
    calculatePositions(x: number, y: number, z: number, l: string) {
        // adds a new "backbone", new "nucleoside", and new "connector" to the scene by adding to visual_object then to strand_3objects then to system_3objects then to scene
        //let group = new THREE.Group(); //create visual_object group
        this.name = this.global_id + ""; //set name (string) to nucleotide's global id
        let backbone: THREE.Mesh;
        // 4 Mesh to display DNA + 1 Mesh to store visual_object group's center of mass as its position
        //make material depending on whether there is an alternate color scheme available
        var material: THREE.MeshLambertMaterial;
        if (lutColsVis) {
            material = new THREE.MeshLambertMaterial({
                color: lutCols[i],
                side: THREE.DoubleSide
            })
        }
        else {
            material = this.elem_to_material(this.type);
        }
        backbone = new THREE.Mesh(backbone_geometry, material); //sphere - sugar phosphate backbone
        backbone.position.set(x, y, z);
        this.add(backbone);

        //last, add the sugar-phosphate bond since its not done for the first nucleotide in each strand
        if (this.neighbor3 != null && this.neighbor3.local_id < this.local_id) {
            let x_sp = (x + x_bb_last) / 2, //sugar phospate position in center of both current and last sugar phosphates
                y_sp = (y + y_bb_last) / 2,
                z_sp = (z + z_bb_last) / 2;

            let sp_len = Math.sqrt(Math.pow(x - x_bb_last, 2) + Math.pow(y - y_bb_last, 2) + Math.pow(z - z_bb_last, 2));
            // easy periodic boundary condition fix  
            // if the bonds are to long just don't add them 
            if (sp_len <= 500) {
                let rotation_sp = new THREE.Matrix4().makeRotationFromQuaternion(
                    new THREE.Quaternion().setFromUnitVectors(
                        new THREE.Vector3(0, 1, 0), new THREE.Vector3(x_sp - x, y_sp - y, z_sp - z).normalize()
                    )
                );
                material = this.strand_to_material(this.parent.strand_id);
                let sp: THREE.Mesh = new THREE.Mesh(connector_geometry, material); //cylinder - sugar phosphate connector
                sp.applyMatrix(new THREE.Matrix4().makeScale(1.0, sp_len, 1.0)); //set length according to distance between current and last sugar phosphate
                sp.applyMatrix(rotation_sp); //set rotation
                sp.position.set(x_sp, y_sp, z_sp);
                sp.name = "sp" + this.id
                this.add(sp); //add to visual_object
            }
        }
        if (this.neighbor5 != null && this.neighbor5.local_id < this.local_id) { //handles strand end connection
            let x_sp = (x + this.neighbor5.children[this.BACKBONE].position.x) / 2, //make sugar phosphate connection
                y_sp = (y + this.neighbor5.children[this.BACKBONE].position.y) / 2,
                z_sp = (z + this.neighbor5.children[this.BACKBONE].position.z) / 2;
            let sp_len = Math.sqrt(Math.pow(x - this.neighbor5.children[this.BACKBONE].position.x, 2) + Math.pow(y - this.neighbor5.children[this.BACKBONE].position.y, 2) + Math.pow(z - this.neighbor5.children[this.BACKBONE].position.z, 2));
            let rotation_sp = new THREE.Matrix4().makeRotationFromQuaternion(
                new THREE.Quaternion().setFromUnitVectors(
                    new THREE.Vector3(0, 1, 0), new THREE.Vector3(x_sp - x, y_sp - y, z_sp - z).normalize()
                )
            );
            let sp: THREE.Mesh = new THREE.Mesh(connector_geometry, material); //cylinder - sugar phosphate connector
            sp.applyMatrix(new THREE.Matrix4().makeScale(1.0, sp_len, 1.0)); //set length according to distance between current and last sugar phosphate
            sp.applyMatrix(rotation_sp); //set rotation
            sp.position.set(x_sp, y_sp, z_sp);
            this.add(sp); //add to visual_object
        }

        //actually add the new items to the scene by adding to visual_object then to strand_3objects then to system_3objects then to scene
        //this = group; //set Nucleotide nuc's attribute to group
        this.parent.add(this); //add group to strand_3objects
        //update last backbone position and last strand
        x_bb_last = x;
        y_bb_last = y;
        z_bb_last = z;
    };
    calculateNewConfigPositions(x: number, y: number, z: number, l: string) {
        let group: THREE.Group = this;
        let locstrandID: number = this.parent.strand_id;
        group.name = this.global_id + "";

        //set new positions/rotations for the meshes.  Don't need to create new meshes since they exist.
        //if you position.set() before applyMatrix() everything explodes and I don't know why
        group.children[this.BACKBONE].position.set(x, y, z);

        //last, add the sugar-phosphate bond since its not done for the first nucleotide in each strand
        if (this.neighbor3 != null && this.neighbor3.local_id < this.local_id) {
            let x_sp = (x + x_bb_last) / 2, //sugar phospate position in center of both current and last sugar phosphates
                y_sp = (y + y_bb_last) / 2,
                z_sp = (z + z_bb_last) / 2;

            let sp_len = Math.sqrt(Math.pow(x - x_bb_last, 2) + Math.pow(y - y_bb_last, 2) + Math.pow(z - z_bb_last, 2));
            // easy periodic boundary condition fix  
            // if the bonds are to long just don't add them 
            if (sp_len <= 500) {
                let rotation_sp = new THREE.Matrix4().makeRotationFromQuaternion(
                    new THREE.Quaternion().setFromUnitVectors(
                        new THREE.Vector3(0, 1, 0), new THREE.Vector3(x_sp - x, y_sp - y, z_sp - z).normalize()
                    )
                );
                //let material: THREE.MeshLambertMaterial = this.strand_to_material(this.parent.strand_id);
                //let sp = new THREE.Mesh(connector_geometry, material); //cylinder - sugar phosphate connector
                let sp = group.children[this.SP_CON];
                this.updateSP();
                sp.applyMatrix(new THREE.Matrix4().makeScale(1.0, sp_len, 1.0)); //set length according to distance between current and last sugar phosphate
                sp.applyMatrix(rotation_sp); //set rotation
                sp.position.set(x_sp, y_sp, z_sp);
                group.children[this.SP_CON].parent = this;
                //group.children[this.SP_CON] = sp; //add to
            }
        }
        x_bb_last = x;
        y_bb_last = y;
        z_bb_last = z;
    };
    updateSP(): THREE.Object3D {
        let sp_Mesh: THREE.Object3D = this.children[this.SP_CON];
        if (sp_Mesh !== undefined && sp_Mesh instanceof THREE.Mesh) {
            if (sp_Mesh.material instanceof THREE.MeshLambertMaterial) {
                sp_Mesh.material = this.strand_to_material(this.parent.strand_id);
            }
            let geo: THREE.Geometry | THREE.BufferGeometry = sp_Mesh.geometry;
            geo = connector_geometry;
            if (geo instanceof THREE.CylinderGeometry) {
                console.log(geo.parameters);
            }
            sp_Mesh.drawMode = THREE.TrianglesDrawMode;
            sp_Mesh.updateMorphTargets();

            sp_Mesh.up = THREE.Object3D.DefaultUp.clone();

            sp_Mesh.position.set(0, 0, 0);
            sp_Mesh.rotation.set(0, 0, 0);
            sp_Mesh.quaternion.set(0, 0, 0, 0);
            sp_Mesh.scale.set(1, 1, 1);

            sp_Mesh.matrix.set(1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1);
            sp_Mesh.matrixWorld.set(1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1);

            sp_Mesh.matrixAutoUpdate = THREE.Object3D.DefaultMatrixAutoUpdate;
            sp_Mesh.matrixWorldNeedsUpdate = false;

            //sp_Mesh.layers.set(1);
            sp_Mesh.visible = true;

            sp_Mesh.castShadow = false;
            sp_Mesh.receiveShadow = false;

            sp_Mesh.frustumCulled = true;
            sp_Mesh.renderOrder = 0;

            sp_Mesh.userData = {};
        }
        return sp_Mesh;
    };
    getCOM(): number {
        return this.BACKBONE;
    };
    resetColor(nucNec: boolean) {
        let back_Mesh: THREE.Object3D = this.children[this.BACKBONE]; //get clicked nucleotide's Meshes
        let sp_Mesh: THREE.Object3D = this.children[this.SP_CON];

        // figure out what that base was before you painted it black and revert it
        //recalculate Mesh's proper coloring and set Mesh material on scene to proper material
        if (nucNec) {
            if (back_Mesh != undefined && back_Mesh instanceof THREE.Mesh) { //necessary for proper typing
                if (back_Mesh.material != undefined && (back_Mesh.material instanceof THREE.MeshBasicMaterial || back_Mesh.material instanceof THREE.MeshLambertMaterial)) {
                    back_Mesh.material = this.elem_to_material(this.type);
                }
            }
        }
        if (sp_Mesh != undefined && sp_Mesh instanceof THREE.Mesh) {
            if (sp_Mesh.material instanceof THREE.MeshBasicMaterial || sp_Mesh.material instanceof THREE.MeshLambertMaterial) {
                sp_Mesh.material = this.strand_to_material(this.parent.strand_id);
            }
        }
    };
    toggle() {
        // highlight/remove highlight the bases we've clicked 
        let selected: boolean = false;
        let nucleotideID: number = this.global_id;
        let sysID: number = this.parent.parent.system_id;
        let back_Mesh: THREE.Object3D = this.children[this.BACKBONE]; //get clicked nucleotide's Meshes
        let sp_Mesh: THREE.Object3D = this.children[this.SP_CON];

        if (selected_bases.has(this)) { //if clicked nucleotide is already selected
            this.resetColor(true);
            selected_bases.delete(this); //"unselect" nucletide by setting value in selected_bases array at nucleotideID to 0
        }
        else {
            //set all materials to selection_material color - currently aqua
            if (back_Mesh instanceof THREE.Mesh) {
                if (back_Mesh.material instanceof THREE.MeshBasicMaterial || back_Mesh.material instanceof THREE.MeshLambertMaterial) {
                    back_Mesh.material = selection_material;
                }
            }
            if (sp_Mesh != undefined && sp_Mesh instanceof THREE.Mesh) {
                if (sp_Mesh.material instanceof THREE.MeshBasicMaterial || sp_Mesh.material instanceof THREE.MeshLambertMaterial) {
                    sp_Mesh.material = selection_material;
                }
            }
            //selList.push(nucleotideID);
            selected_bases.add(this); //"select" nucletide by setting value in selected_bases array at nucleotideID to 1
        }
    }
    getDatFileOutput(): string {
        let dat: string = "";
        let tempVec: THREE.Vector3 = new THREE.Vector3();
        this.children[this.BACKBONE].getWorldPosition(tempVec); //nucleotide's center of mass in world
        let x: number = tempVec.x;
        let y: number = tempVec.y;
        let z: number = tempVec.z;
        dat = x + " " + y + " " + z + "1.0 1.0 0.0 0.0 0.0 -1.0 0.0 0.0 0.0 0.0 0.0 0.0" + "\n"; //add all locations to dat file string
        return dat;
    };
};

// strands are made up of elements
// strands have an ID within the system
class Strand extends THREE.Group {

    strand_id: number; //system location
    elements: BasicElement[] = [];
    pos: THREE.Vector3; //strand position
    parent: System;
    //strand_3objects: THREE.Group; //contains BasicElement.visual_objects

    constructor(id: number, parent: System) {
        super();
        this.strand_id = id;
        this.parent = parent;
        //this.strand_3objects = new THREE.Group;
    };

    add_basicElement(elem: BasicElement) {
        this.elements.push(elem);
        elem.parent = this;
    };

    create_basicElement(global_id: number): AminoAcid {
        return new AminoAcid(global_id, this);
    }

    remove_basicElement(to_remove: number) {
        for (let i = 0; i < this.elements.length; i++) {
            let n = this.elements[i];
            if (n.global_id == to_remove) { //changed from local to global id
                scene.remove(n);
                n = null;
            }
        }
    };


};

class NucleicAcidStrand extends Strand {
    constructor(id: number, parent: System) {
        super(id, parent);
    };

    create_basicElement(global_id: number): BasicElement {
        if (RNA_MODE)
            return new RNANucleotide(global_id, this);
        else
            return new DNANucleotide(global_id, this);
    };
}
class Peptide extends Strand {
    constructor(id: number, parent: System) {
        super(id, parent);
    };
    create_basicElement(global_id: number): AminoAcid {
        return new AminoAcid(global_id, this);
    }
}


// systems are made of strands
// systems can CRUD
class System extends THREE.Group {

    system_id: number;
    strands: Strand[] = [];
    CoM: THREE.Vector3; //System center of mass
    global_start_id: number; //1st nucleotide's global_id
    //system_3objects: THREE.Group; //contains strand_3objects
    dat_file;
    pos: THREE.Vector3; //system position
    constructor(id, start_id) {
        super();
        this.system_id = id;
        this.global_start_id = start_id;
        //this.system_3objects = new THREE.Group;
    };

    system_length(): number {
        let count: number = 0;
        for (let i = 0; i < this.strands.length; i++) {
            count += this.strands[i].elements.length;
        }
        return count;
    };

    create_Strand(str_id: number): Strand {
        if (str_id < 0)
            return new Peptide(str_id, this);
        else
            return new NucleicAcidStrand(str_id, this);
    };

    add_strand(strand: Strand) {
        this.strands.push(strand);
    };

    remove_strand(to_remove: number) {
        for (let i = 0; i < this.strands.length; i++) {
            let s = this.strands[i];
            if (s.strand_id == to_remove) {
                this.remove(s);
                for (let j = 0; j < s.elements.length; j++) {
                    s.remove(s.elements[j]);
                    s.remove_basicElement(j);
                }
                scene.remove(s);
                s = null;
            };

            render();
        }
    };

    setDatFile(dat_file) { //allows for trajectory function
        this.dat_file = dat_file;
    }
};

function updatePos() { //sets positions of system, strands, and visual objects to be located at their cms - messes up rotation sp recalculation and trajectory
    for (let h = 0; h < systems.length; h++) { //for current system
        let syscms = new THREE.Vector3(0, 0, 0); //system cms
        let n: number = systems[h].system_length(); //# of BasicElements in system
        for (let i = 0; i < systems[h].strands.length; i++) { //for each strand
            let n1 = systems[h].strands[i].elements.length; //for strand_3objects in system_3objects
            let strandcms = new THREE.Vector3(0, 0, 0); //strand cms
            for (let j = 0; j < n1; j++) { //for each visual_object
                let nucobj = systems[h].strands[i].elements[j]; //current nuc's visual_object
                let objcms = new THREE.Vector3(); //group cms
                //sum cms of all visual_object in each system, strand, and itself
                let bbint: number = systems[h].strands[i].elements[j].getCOM();
                let tempposition: THREE.Vector3 = nucobj.children[bbint].position.clone();
                objcms = tempposition; // nucobj.children[3].position; //nucobj cms
                strandcms.add(tempposition)//nucobj.children[3].position); //strand cms
                syscms.add(tempposition);//nucobj.children[3].position); //system cms
                systems[h].strands[i].elements[j].pos = objcms.clone(); // set nucleotide object position to objcms
                //elements[systems[h].strands[i].elements[j].global_id].pos = objcms.clone();
            }
            //calculate strand cms
            let mul = 1.0 / n1;
            strandcms.multiplyScalar(mul);
            systems[h].strands[i].pos = strandcms.clone(); //set strand object position to strand cms
        }
        //calculate system cms
        let mul = 1.0 / n;
        syscms.multiplyScalar(mul);
        systems[h].pos = syscms.clone(); //set system object position to system cms
    }
}


function updatePosOld() {
    for (let h = 0; h < systems.length; h++) {
        let cmssys = new THREE.Vector3();
        let n = systems[h].system_length();
        for (let i = 0; i < systems[h].children.length; i++) { //each strand
            let n1 = systems[h].children[i].children.length;
            let cms = new THREE.Vector3();
            for (let j = 0; j < n1; j++) { //each group
                let rotobj = systems[h].children[i].children[j];
                let n2 = rotobj.children.length;
                let cms1 = new THREE.Vector3(), currentpos = new THREE.Vector3();
                cms.add(rotobj.children[3].position);
                cms1 = rotobj.children[3].position;
                let cmsx = cms1.x, cmsy = cms1.y, cmsz = cms1.z;
                cmssys.add(rotobj.children[3].position);
                for (let k = 0; k < n2; k++) {
                    rotobj.children[k].applyMatrix(new THREE.Matrix4().makeTranslation(-cmsx, -cmsy, -cmsz));
                }
                rotobj.applyMatrix(new THREE.Matrix4().makeTranslation(cmsx, cmsy, cmsz));
            }
            let mul = 1.0 / n1;
            cms.multiplyScalar(mul);
            for (let k = 0; k < n1; k++) {
                systems[h].strands[i].children[k].applyMatrix(new THREE.Matrix4().makeTranslation(-cms.x, -cms.y, -cms.z));
            }
            systems[h].strands[i].applyMatrix(new THREE.Matrix4().makeTranslation(cms.x, cms.y, cms.z));
        }
        let mul = 1.0 / n;
        cmssys.multiplyScalar(mul);
        for (let k = 0; k < systems[h].children.length; k++) {
            systems[h].children[k].applyMatrix(new THREE.Matrix4().makeTranslation(-cmssys.x, -cmssys.y, -cmssys.z));
        }
        systems[h].applyMatrix(new THREE.Matrix4().makeTranslation(cmssys.x, cmssys.y, cmssys.z));
    }
}

function nextConfig() {
    if (next_reader.readyState == 1) { //0: nothing loaded 1: working 2: done
        return;
    }
    getNewConfig(1);
    let centering_on = (<HTMLInputElement>document.getElementById("centering")).checked
    if (centering_on) {
        centerSystems()
    }
}

function previousConfig() {
    if (previous_previous_reader.readyState == 1) {
        return;
    }
    getNewConfig(-1);
    let centering_on = (<HTMLInputElement>document.getElementById("centering")).checked
    if (centering_on) {
        centerSystems()
    }
}

document.addEventListener("keydown", function (event) {
    switch (event.key) {
        case 'n': nextConfig(); break;
        case 'b': previousConfig(); break;
    }
}, true);

function toggleVideoOptions() {
    let opt = document.getElementById("videoOptions");
    opt.hidden = !opt.hidden;
}

function toggleColorOptions() {
    let opt: HTMLElement = document.getElementById("colorOptions");
    opt.hidden = !opt.hidden;
    colorOptions();
}

function colorOptions() {
    let opt: HTMLElement = document.getElementById("colorOptions");
    if (!opt.hidden) {
        opt.innerHTML = "";  //Clear content
        let addButton = document.createElement('button');
        addButton.innerText = "Add Color";
        addButton.onclick = function () {
            backbone_materials.push(
                new THREE.MeshLambertMaterial({
                    color: 0x156289,
                    side: THREE.DoubleSide
                }));
            let index: number = 0;
            for (; index < elements.length; index++) {
                elements[index].resetColor(false);
            }
            colorOptions();
            render();
        }
        for (let i = 0; i < backbone_materials.length; i++) {
            let m = backbone_materials[i];
            let c = document.createElement('input');
            c.type = 'color';
            c.value = "#" + m.color.getHexString();
            c.oninput = function () {
                m.color = new THREE.Color(c.value);
                render();
            };
            c.oncontextmenu = function (event) {
                event.preventDefault();
                backbone_materials.splice(i, 1);
                colorOptions();
                return false;
            }
            opt.appendChild(c);
        }
        opt.appendChild(addButton);
        let index: number = 0;
        for (; index < elements.length; index++) {
            elements[index].resetColor(false);
        }
        render();
    }
}

function createVideo() {
    // Get canvas
    let canvas = <HTMLCanvasElement>document.getElementById("threeCanvas");

    // Get options:
    let format = (<HTMLInputElement>document.querySelector('input[name="videoFormat"]:checked')).value;
    let framerate = (<HTMLInputElement>document.getElementById("videoFramerate")).value;
    let videoType = <HTMLInputElement>document.getElementById("videoType");

    // Set up movie capturer
    const capturer = new CCapture({
        format: format,
        framerate: framerate,
        name: videoType.value,
        verbose: true,
        display: true,
        workersPath: 'ts/lib/'
    });

    let button = <HTMLInputElement> document.getElementById("videoStartStop");
    button.innerText = "Stop";
    button.onclick = function() {
        capturer.stop();
        capturer.save();
    }
    try {
        switch (videoType.value) {
            case "trajectory":
                createTrajectoryVideo(canvas, capturer);
                break;
            case "lemniscate":
                createLemniscateVideo(canvas, capturer, framerate);
                break;
        }
    } catch (e) {
        alert("Failed to capture video: \n" + e);
        capturer.stop();
    }

}

function createTrajectoryVideo(canvas, capturer) {
    // Listen for configuration loaded events
    function _load(e) {
        e.preventDefault(); // cancel default actions
        capturer.capture(canvas);
        nextConfig();
    }

    // Listen for last configuration event
    function _done(e) {
        document.removeEventListener('nextConfigLoaded', _load);
        document.removeEventListener('finalConfig', _done);
        capturer.stop();
        capturer.save();
        button.innerText = "Start";
        button.onclick = createVideo;
        return;
    }

    // Overload stop button so that we don't forget to remove listeners
    let button = <HTMLInputElement> document.getElementById("videoStartStop");
    button.onclick = _done;

    document.addEventListener('nextConfigLoaded', _load);
    document.addEventListener('finalConfig', _done);

    // Start capturing
    capturer.start();
    nextConfig();
}

function createLemniscateVideo(canvas, capturer, framerate) {
    // Setup timing
    let duration = 10; //Seconds
    let tMax = 2 * Math.PI;
    let nFrames = duration * (<number><unknown>framerate);
    let dt = tMax / nFrames;

    // Preserve camera distance from origin:
    let d = Origin.distanceTo(camera.position);

    capturer.start();

    // Overload stop button so that we don't forget to remove listeners
    let button = <HTMLInputElement> document.getElementById("videoStartStop");
    button.onclick = function() {tMax=0;};

    // Move camera and capture frames
    // This is not a for-loop since we need to use
    // requestAnimationFrame recursively.
    let t = 0;
    var animate = function () {
        if (t >= tMax) {
            capturer.stop();
            capturer.save();
            button.innerText = "Start";
            button.onclick = createVideo;
            return;
        }
        requestAnimationFrame(animate);
        camera.position.set(
            d * Math.cos(t),
            d * Math.sin(t) * Math.cos(t),
            d * Math.sqrt(Math.pow(Math.sin(t), 4))
        );
        camera.lookAt(Origin);
        t += dt;
        render();
        capturer.capture(canvas);
    }
    animate();
}

function toggleLut(chkBox) { //toggles display of coloring by json file / structure modeled off of base selector
    if (lutCols.length > 0) { //lutCols stores each nucleotide's color (determined by flexibility)
        if (lutColsVis) { //if "Display Alternate Colors" checkbox selected (currently displaying coloring) - does not actually get checkbox value; at onload of webpage is false and every time checkbox is changed, it switches boolean
            for (let i = 0; i < elements.length; i++) { //for all elements in all systems - does not work for more than one system
                elements[i].resetColor(true);
            }
            lutColsVis = false; //now flexibility coloring is not being displayed and checkbox is not selected
        }
        else {
            for (let i = 0; i < elements.length; i++) { //for each nucleotide in all systems - does not work for multiple systems yet
                let tmeshlamb = new THREE.MeshLambertMaterial({ //create new MeshLambertMaterial with appropriate coloring stored in lutCols
                    color: lutCols[i],
                    side: THREE.DoubleSide
                });
                for (let j = 0; j < elements[i].children.length; j++) { //for each Mesh in each nucleotide's visual_object
                    if (j != 3) { //for all except cms posObj Mesh
                        let tmesh: THREE.Mesh = <THREE.Mesh>elements[i].children[j];
                        tmesh.material = tmeshlamb;
                    }
                }
            }
            lutColsVis = true; //now flexibility coloring is being displayed and checkbox is selected
        }
        render();
    }
    else {
        alert("Please drag and drop the corresponding .json file.");
        chkBox.checked = false;
    }
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

function toggleFog(near, far) {
    if (scene.fog == null) {
        scene.fog = new THREE.Fog(scene.background, near, far);
    }
    else {
        scene.fog = null;
    }
    render();
}

function cross(a1, a2, a3, b1, b2, b3) { //calculate cross product of 2 THREE.Vectors but takes coordinates as (x,y,z,x1,y1,z1)
    return [a2 * b3 - a3 * b2,
    a3 * b1 - a1 * b3,
    a1 * b2 - a2 * b1];
}
/*
function moveWithinBox(pos, dpos) {
    a = pos.x + dpos.x;
    b = (pos.x+1.5*box)%box - box/2 + dpos.x)
    return Math.abs(a) < Math.abs(b) ? a:b;
}
*/

// Calculate center of mass taking periodic boundary conditions into account:
// https://doi.org/10.1080/2151237X.2008.10129266
// https://en.wikipedia.org/wiki/Center_of_mass#Systems_with_periodic_boundary_conditions
function centerSystems() { //centers systems based on cms calculated for world (all systems)
    /*
        //get center of mass for all systems
        let cms = new THREE.Vector3(0, 0, 0);
        for (let i = 0; i < elements.length; i++) {
            let tmp_pos = new THREE.Vector3;
            tmp_pos.setFromMatrixPosition(elements[i].visual_object.children[COM].matrixWorld);
            cms.add(tmp_pos);
        }
        let mul = 1.0 / elements.length;
        cms.multiplyScalar(mul * -1);
    */
    // Create one averaging variable for each dimension, representing that 1D
    // interval as a unit circle in 2D (with the circumference being the 
    // bounding box side length)
    let cm_x = new THREE.Vector2(),
        cm_y = new THREE.Vector2(),
        cm_z = new THREE.Vector2();

    for (let i = 0; i < elements.length; i++) {
        let bbint: number = elements[i].getCOM();
        let p = elements[i].children[bbint].position.clone();
        // Shift coordinates so that the origin is in the corner of the 
        // bounding box, instead of the centre.
        p.add(new THREE.Vector3().addScalar(1.5 * box));
        p.x %= box; p.y %= box; p.z %= box;

        // Calculate positions on unit circle for each dimension and that to the
        // sum.
        let angle = p.clone().multiplyScalar(2 * Math.PI / box);
        cm_x.add(new THREE.Vector2(Math.cos(angle.x), Math.sin(angle.x)));
        cm_y.add(new THREE.Vector2(Math.cos(angle.y), Math.sin(angle.y)));
        cm_z.add(new THREE.Vector2(Math.cos(angle.z), Math.sin(angle.z)));
    }

    // Divide center of mass sums to get the averages
    cm_x.divideScalar(elements.length);
    cm_y.divideScalar(elements.length);
    cm_z.divideScalar(elements.length);

    // Convert back from unit circle coordinates into x,y,z
    let cms = new THREE.Vector3(
        box / (2 * Math.PI) * (Math.atan2(-cm_x.x, -cm_x.y) + Math.PI),
        box / (2 * Math.PI) * (Math.atan2(-cm_y.x, -cm_y.y) + Math.PI),
        box / (2 * Math.PI) * (Math.atan2(-cm_z.x, -cm_z.y) + Math.PI)
    );
    // Shift back origin to center of the box
    cms.sub(new THREE.Vector3().addScalar(box / 2));

    // Change nucleotide positions by the center of mass
    for (let i = 0; i < elements.length; i++) {
        for (let j = 0; j < elements[i].children.length; j++) {
            /*
                        elements[i].visual_object.children[j].position.add(cms);
            */
            let p = elements[i].children[j].position;
            // Shift with centre of mass
            p.add(cms);
            // Keep positions within bounding box
            p.add(new THREE.Vector3().addScalar(1.5 * box));
            p.x %= box; p.y %= box; p.z %= box;
            p.sub(new THREE.Vector3().addScalar(0.75 * box));
        }
    }
    render();
}

//changes resolution on the nucleotide visual objects
function setResolution(resolution: number) {
    //change mesh_setup with the given resolution
    backbone_geometry = new THREE.SphereGeometry(.2, resolution, resolution);
    nucleoside_geometry = new THREE.SphereGeometry(.3, resolution, resolution).applyMatrix(
        new THREE.Matrix4().makeScale(0.7, 0.3, 0.7));
    connector_geometry = new THREE.CylinderGeometry(.1, .1, 1, Math.max(2, resolution));

    //update all elements and hide some meshes if resolution is low enough
    for (let i = 0; i < elements.length; i++) {
        let nuc_group: THREE.Mesh[] = <THREE.Mesh[]>elements[i].children;

        nuc_group[elements[i].BACKBONE].visible = resolution > 1;
        nuc_group[elements[i].BACKBONE].geometry = backbone_geometry;

        nuc_group[elements[i].NUCLEOSIDE].visible = resolution > 1;
        nuc_group[elements[i].NUCLEOSIDE].geometry = nucleoside_geometry;

        if (nuc_group[elements[i].BB_NS_CON]) {
            nuc_group[elements[i].BB_NS_CON].geometry = connector_geometry;
            nuc_group[elements[i].BB_NS_CON].visible = resolution > 1;
        }
        if (nuc_group[elements[i].SP_CON]) {
            nuc_group[elements[i].SP_CON].geometry = connector_geometry;
        }
    }
    render();
}

function toggleSideNav(button: HTMLInputElement) {
    let hidden = "show";
    let visible = "hide";
    let tabcontent = <HTMLCollectionOf<HTMLElement>>document.getElementsByClassName("tabcontent");
    let allNone = false;
    if (button.innerText == hidden) {
        tabcontent[0].style.display = "block";
        console.log("All was hidden, so we revealed");
        button.innerHTML = visible;
    } else {
        for (let i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
        }
        button.innerHTML = hidden;
    }
}

//strand delete testcode
document.addEventListener("keypress", event => {
    if (event.keyCode === 100) { //if d is pressed, delete first system's first strand
        systems[0].remove_strand(1);
        render();
    }
});
