const vertexShaderSource = `#version 300 es
layout(location=0) in vec3 position;
layout(location=1) in vec3 normal;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;
uniform vec3 lightPos;

out vec3 fragNormal;
out vec3 fragPos;
out vec3 lightDirection;

void main() {
    vec4 worldPos = model * vec4(position, 1.0);
    fragPos = worldPos.xyz;
    fragNormal = mat3(transpose(inverse(model))) * normal;
    lightDirection = normalize(lightPos - fragPos);
    
    gl_Position = projection * view * worldPos;
}`;

const fragmentShaderSource = `#version 300 es
precision highp float;

in vec3 fragNormal;
in vec3 fragPos;
in vec3 lightDirection;

uniform vec3 viewPos;

out vec4 fragColor;

void main() {
    vec3 objectColor = vec3(0.7, 0.7, 0.9);
    float ambientStrength = 0.1;
    float specularStrength = 0.5;
    float shininess = 32.0;

    vec3 ambient = ambientStrength * vec3(1.0);

    vec3 norm = normalize(fragNormal);
    float diff = max(dot(norm, lightDirection), 0.0);
    vec3 diffuse = diff * vec3(1.0);

    vec3 viewDir = normalize(viewPos - fragPos);
    vec3 reflectDir = reflect(-lightDirection, norm);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
    vec3 specular = specularStrength * spec * vec3(1.0);

    vec3 result = (ambient + diffuse + specular) * objectColor;
    fragColor = vec4(result, 1.0);
}`;

const POSITION_LOC = 0;
const NORMAL_LOC = 1;

let gl;
let program;
let lastTime = 0;
let cameraAngle = 0;
let currentBuffers = null;

function resizeCanvas() {
    const canvas = gl.canvas;
    const pixelRatio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth * pixelRatio;
    const height = canvas.clientHeight * pixelRatio;

    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
    }
}

function compileShader(vs_source, fs_source) {
    const vs = gl.createShader(gl.VERTEX_SHADER)
    gl.shaderSource(vs, vs_source)
    gl.compileShader(vs)
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(vs))
        throw Error("Vertex shader compilation failed")
    }

    const fs = gl.createShader(gl.FRAGMENT_SHADER)
    gl.shaderSource(fs, fs_source)
    gl.compileShader(fs)
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(fs))
        throw Error("Fragment shader compilation failed")
    }

    const program = gl.createProgram()
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program))
        throw Error("Linking failed")
    }
    
    const uniforms = {}
    for(let i=0; i<gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS); i+=1) {
        let info = gl.getActiveUniform(program, i)
        uniforms[info.name] = gl.getUniformLocation(program, info.name)
    }
    program.uniforms = uniforms

    return program
}

function generateSphere(rings, slices) {
    const vertices = [];
    const indices = [];
    const normals = [];
    
    vertices.push(0, 1, 0);
    normals.push(0, 1, 0);
    
    for (let ring = 1; ring <= rings; ring++) {
        const phi = (Math.PI * ring) / (rings + 1);
        for (let slice = 0; slice < slices; slice++) {
            const theta = (2 * Math.PI * slice) / slices;
            
            const x = Math.sin(phi) * Math.cos(theta);
            const y = Math.cos(phi);
            const z = Math.sin(phi) * Math.sin(theta);
            
            vertices.push(x, y, z);
            normals.push(x, y, z);
        }
    }
    
    vertices.push(0, -1, 0);
    normals.push(0, -1, 0);
    
    for (let slice = 0; slice < slices; slice++) {
        indices.push(
            0,
            1 + ((slice + 1) % slices),
            1 + slice
        );
    }
    
    for (let ring = 0; ring < rings - 1; ring++) {
        for (let slice = 0; slice < slices; slice++) {
            const current = 1 + ring * slices + slice;
            const next = 1 + ring * slices + ((slice + 1) % slices);
            const nextRing = 1 + (ring + 1) * slices + slice;
            const nextRingNext = 1 + (ring + 1) * slices + ((slice + 1) % slices);
            
            indices.push(current, next, nextRing);
            indices.push(next, nextRingNext, nextRing);
        }
    }
    
    const lastVertex = vertices.length / 3 - 1;
    for (let slice = 0; slice < slices; slice++) {
        indices.push(
            lastVertex,
            lastVertex - slices + slice,
            lastVertex - slices + ((slice + 1) % slices)
        );
    }
    
    return { vertices, indices, normals };
}

function generateTorus(rings, slices) {
    const vertices = [];
    const indices = [];
    const normals = [];
    const R = 1.0;
    const r = 0.3;
    
    for (let ring = 0; ring < rings; ring++) {
        const phi = (2 * Math.PI * ring) / rings;
        for (let slice = 0; slice < slices; slice++) {
            const theta = (2 * Math.PI * slice) / slices;
            
            const x = (R + r * Math.cos(theta)) * Math.cos(phi);
            const y = r * Math.sin(theta);
            const z = (R + r * Math.cos(theta)) * Math.sin(phi);
            
            const centerX = R * Math.cos(phi);
            const centerZ = R * Math.sin(phi);
            const nx = (x - centerX);
            const ny = y;
            const nz = (z - centerZ);
            const len = Math.sqrt(nx*nx + ny*ny + nz*nz);
            
            vertices.push(x, y, z);
            normals.push(nx/len, ny/len, nz/len);
        }
    }
    
    for (let ring = 0; ring < rings; ring++) {
        for (let slice = 0; slice < slices; slice++) {
            const current = ring * slices + slice;
            const next = ring * slices + ((slice + 1) % slices);
            const nextRing = ((ring + 1) % rings) * slices + slice;
            const nextRingNext = ((ring + 1) % rings) * slices + ((slice + 1) % slices);
            
            indices.push(current, next, nextRing);
            indices.push(next, nextRingNext, nextRing);
        }
    }
    
    return { vertices, indices, normals };
}

function setupBuffers() {
    currentBuffers = {
        vao: gl.createVertexArray(),
        position: gl.createBuffer(),
        normal: gl.createBuffer(),
        index: gl.createBuffer()
    };
}

function generateGeometry() {
    const rings = parseInt(document.getElementById('rings').value);
    const slices = parseInt(document.getElementById('slices').value);
    const isTorus = document.getElementById('torus').checked;
    
    const geometry = isTorus ? 
        generateTorus(Math.max(3, rings), Math.max(3, slices)) :
        generateSphere(Math.max(1, rings), Math.max(3, slices));
    
    gl.bindVertexArray(currentBuffers.vao);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, currentBuffers.position);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.vertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(POSITION_LOC);
    gl.vertexAttribPointer(POSITION_LOC, 3, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, currentBuffers.normal);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.normals), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(NORMAL_LOC);
    gl.vertexAttribPointer(NORMAL_LOC, 3, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, currentBuffers.index);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(geometry.indices), gl.STATIC_DRAW);
    
    currentBuffers.indexCount = geometry.indices.length;
}

function tick(currentTime) {
    const seconds = currentTime / 1000;
    const dt = seconds - lastTime;
    lastTime = seconds;
    
    cameraAngle += dt * 0.5;
    
    resizeCanvas();
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    
    if (currentBuffers && currentBuffers.indexCount) {
        draw(seconds);
    }
    
    requestAnimationFrame(tick);
}

function draw(seconds) {
    gl.useProgram(program);
    gl.bindVertexArray(currentBuffers.vao);
    
    const aspect = gl.canvas.width / gl.canvas.height;
    const projection = mat4.perspective(mat4.create(), 45 * Math.PI / 180, aspect, 0.1, 100.0);
    
    const radius = 5.0;
    const camX = Math.sin(cameraAngle) * radius;
    const camZ = Math.cos(cameraAngle) * radius;
    const view = mat4.lookAt(mat4.create(), 
        [camX, 2.0, camZ],
        [0, 0, 0],
        [0, 1, 0]
    );
    
    const model = mat4.create();
    
    gl.uniformMatrix4fv(program.uniforms.projection, false, projection);
    gl.uniformMatrix4fv(program.uniforms.view, false, view);
    gl.uniformMatrix4fv(program.uniforms.model, false, model);
    gl.uniform3fv(program.uniforms.lightPos, [5, 5, 5]);
    gl.uniform3fv(program.uniforms.viewPos, [camX, 2.0, camZ]);
    
    gl.drawElements(gl.TRIANGLES, currentBuffers.indexCount, gl.UNSIGNED_SHORT, 0);
}

window.addEventListener('load', async (event) => {
    const canvas = document.querySelector('canvas');
    gl = canvas.getContext('webgl2', {
        antialias: true,
        depth: true,
        preserveDrawingBuffer: true
    });
    
    program = compileShader(vertexShaderSource, fragmentShaderSource);
    setupBuffers();
    
    document.getElementById('generate').addEventListener('click', generateGeometry);
    generateGeometry(); 
    
    requestAnimationFrame(tick);
});