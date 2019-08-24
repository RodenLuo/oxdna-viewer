/// <reference path="./three/index.d.ts" />
class TopReader extends FileReader {
    constructor(top_file, system, elements) {
        super();
        this.nuc_local_id = 0;
        this.onload = ((f) => {
            return (e) => {
                let file = this.result;
                let lines = file.split(/[\n]+/g);
                console.log(`lines in top: ${lines.length}`);
                lines = lines.slice(1); // discard the header
                this.configuration_length = lines.length;
                let l0 = lines[0].split(" "); //split the file and read each column, format is: "str_id base n3 n5"
                let str_id = parseInt(l0[0]);
                this.last_strand = str_id;
                let current_strand = this.system.create_Strand(str_id);
                this.system.add_strand(current_strand);
                // create empty list of elements with length equal to the topology
                // Note: this is implemented such that we have the elements for the DAT reader 
                let nuc; //DNANucleotide | RNANucleotide | AminoAcid;
                for (let j = 0; j < lines.length; j++)
                    this.elements.push(nuc);
                lines.forEach((line, i) => {
                    if (line == "") {
                        this.elements.pop();
                        return;
                    }
                    let l = line.split(" "); //split the file and read each column, format is: "str_id base n3 n5"
                    str_id = parseInt(l[0]);
                    if (str_id != this.last_strand) { //if new strand id, make new strand                        
                        current_strand = this.system.create_Strand(str_id);
                        this.system.add_strand(current_strand);
                        this.nuc_local_id = 0;
                    }
                    ;
                    if (this.elements[nuc_count + i] == null || this.elements[nuc_count + i] == undefined)
                        this.elements[nuc_count + i] = current_strand.create_basicElement(nuc_count + i);
                    let nuc = this.elements[nuc_count + i];
                    nuc.local_id = this.nuc_local_id;
                    let neighbor3 = parseInt(l[2]);
                    if (neighbor3 != -1) {
                        if (this.elements[nuc_count + neighbor3] == null || this.elements[nuc_count + neighbor3] == undefined) {
                            this.elements[nuc_count + neighbor3] = current_strand.create_basicElement(nuc_count + neighbor3);
                        }
                        nuc.neighbor3 = this.elements[nuc_count + neighbor3];
                    }
                    else
                        nuc.neighbor3 = null;
                    let neighbor5 = parseInt(l[3]);
                    if (neighbor5 != -1) {
                        if (this.elements[nuc_count + neighbor5] == null || this.elements[nuc_count + neighbor5] == undefined) {
                            this.elements[nuc_count + neighbor5] = current_strand.create_basicElement(nuc_count + neighbor5);
                        }
                        nuc.neighbor5 = this.elements[nuc_count + neighbor5];
                    }
                    else
                        nuc.neighbor5 = null;
                    let base = l[1]; // get base id
                    nuc.type = base;
                    //if we meet a U, we have an RNA (its dumb, but its all we got)
                    if (base === "U")
                        RNA_MODE = true;
                    current_strand.add_basicElement(nuc); //add nuc into Strand object
                    this.nuc_local_id += 1;
                    this.last_strand = str_id;
                    if (i == lines.length - 1) {
                        return;
                    }
                    ;
                });
                this.system.setDatFile(dat_file); //store dat_file in current System object
                systems.push(this.system); //add system to Systems[]
                nuc_count = this.elements.length;
                conf_len = nuc_count + 3;
            };
        })(this.top_file);
        this.top_file = top_file;
        this.system = system;
        this.elements = elements;
    }
    async read() {
        this.readAsText(this.top_file);
    }
}
class FileChunker {
    constructor(file, chunk_size) {
        this.file = file;
        this.chunk_size = chunk_size;
        this.current_chunk = 0;
    }
    get_next_chunk() {
        if (!this.is_last())
            this.current_chunk++;
        return this.get_chunk();
    }
    get_prev_chunk() {
        this.current_chunk--;
        if (this.current_chunk <= 0)
            this.current_chunk = 0;
        return this.get_chunk();
    }
    is_last() {
        if (this.current_chunk * this.chunk_size + this.chunk_size >= this.file.size)
            return true;
        return false;
    }
    get_chunk() {
        return this.file.slice(this.current_chunk * this.chunk_size, this.current_chunk * this.chunk_size + this.chunk_size);
    }
}
class DatReader extends FileReader {
    constructor(dat_file, top_reader, system, elements) {
        super();
        this.onload = ((f) => {
            return (e) => {
                let file = this.result;
                let lines = file.split(/[\n]+/g);
                this.cur_conf.push(...lines);
                //console.log(lines.length);
            };
        })(this.dat_file);
        this.top_reader = top_reader;
        this.dat_file = dat_file;
        this.system = system;
        this.elements = elements;
        this.chunker = new FileChunker(this.dat_file, top_reader.top_file.size * 30);
        this.conf_length = this.top_reader.configuration_length + 3;
        this.leftover_conf = [];
    }
    async get_next_conf() {
        this.cur_conf = [];
        this.cur_conf.push(...this.leftover_conf);
        // read up a chunk 
        this.readAsText(this.chunker.get_next_chunk());
        // we have to little, need to get more 
        if (this.cur_conf.length < this.conf_length)
            this.readAsText(this.chunker.get_next_chunk());
        //else{
        //    alert(".dat and .top files incompatible")
        //    return;
        //}
        // now make sure we have the right ammount of stuff in cur_conf
        this.leftover_conf = this.cur_conf.slice(this.conf_length);
        //now do the parsing 
        let lines = this.cur_conf;
        console.log(sys_count);
        console.log(strands);
        await sleep(2000);
        var current_strand = systems[sys_count][strands][0];
        let time = parseInt(lines[0].split(" ")[2]);
        box = parseFloat(lines[1].split(" ")[3]);
        // discard the header
        lines = lines.slice(3);
        for (let i = 0; i < this.top_reader.configuration_length; i++) { //from beginning to end of current configuration's list of positions; for each nucleotide in the system
            if (lines[i] == "" || lines[i].slice(0, 1) == 't') {
                break;
            }
            ;
            var current_nucleotide = elements[i + this.system.global_start_id];
            //get nucleotide information
            // consume a new line
            let l = lines[i].split(" ");
            // shift coordinates such that the 1st base of the
            // 1st strand is @ origin
            let x = parseFloat(l[0]), // - fx,
            y = parseFloat(l[1]), // - fy,
            z = parseFloat(l[2]); // - fz;
            //current_nucleotide.pos = new THREE.Vector3(x, y, z); //set pos; not updated by DragControls
            current_nucleotide.calculatePositions(x, y, z, l);
            //catch the two possible cases for strand ends (no connection or circular)
            if ((current_nucleotide.neighbor5 == undefined || current_nucleotide.neighbor5 == null) || (current_nucleotide.neighbor5.local_id < current_nucleotide.local_id)) { //if last nucleotide in straight strand
                this.system.add(current_strand); //add strand THREE.Group to system THREE.Group
                current_strand = this.system[strands][current_strand.strand_id]; //don't ask, its another artifact of strands being 1-indexed
                if (elements[current_nucleotide.global_id + 1] != undefined) {
                    current_strand = elements[current_nucleotide.global_id + 1].parent;
                }
            }
        }
        for (let i = 0; i < elements.length; i++) {
            elements[i].recalcPos(); //add any other sp connectors - used for circular strands
        }
        //bring things in the box based on the PBC/centering menus
        PBC_switchbox(systems[sys_count]);
        for (let i = systems[sys_count].global_start_id; i < elements.length; i++) { //create array of backbone sphere Meshes for base_selector
            backbones.push(elements[i][objects][elements[i].BACKBONE]);
        }
        scene.add(systems[sys_count]); //add system_3objects with strand_3objects with visual_object with Meshes
        sys_count += 1;
        render();
        renderer.domElement.style.cursor = "auto";
    }
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
