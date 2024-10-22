// Non-modular MeshSurfaceSampler.js implementation with optimizations
function MeshSurfaceSampler(mesh) {
    this.geometry = mesh.geometry;
    this.positionAttribute = this.geometry.getAttribute('position');
    this.weightAttribute = null;
    this.distribution = null;
    this.randomFunction = Math.random;  // Allow random function injection for testing

    // Temporary vectors to avoid recreating them repeatedly
    this._vA = new THREE.Vector3();
    this._vB = new THREE.Vector3();
    this._vC = new THREE.Vector3();
    this._sampledPosition = new THREE.Vector3();
}

MeshSurfaceSampler.prototype.setWeightAttribute = function (name) {
    this.weightAttribute = name ? this.geometry.getAttribute(name) : null;
    return this;
};

MeshSurfaceSampler.prototype.build = function () {
    const index = this.geometry.index;
    const faceCount = index.count / 3;
    const faceWeights = new Float32Array(faceCount);
    this.distribution = new Float32Array(faceCount + 1);

    // Iterate through each face to calculate its weight
    for (let i = 0; i < faceCount; i++) {
        const a = index.getX(i * 3);
        const b = index.getX(i * 3 + 1);
        const c = index.getX(i * 3 + 2);

        // Get the vertices for the face
        this._vA.fromBufferAttribute(this.positionAttribute, a);
        this._vB.fromBufferAttribute(this.positionAttribute, b);
        this._vC.fromBufferAttribute(this.positionAttribute, c);

        // Compute face area using cross product
        this._vB.sub(this._vA);
        this._vC.sub(this._vA);
        faceWeights[i] = this._vB.cross(this._vC).length();

        // Apply weight attribute if provided
        if (this.weightAttribute) {
            const weight = (this.weightAttribute.getX(a) + this.weightAttribute.getX(b) + this.weightAttribute.getX(c)) / 3;
            faceWeights[i] *= weight;
        }
    }

    // Build cumulative distribution for sampling
    for (let i = 0; i < faceCount; i++) {
        this.distribution[i + 1] = this.distribution[i] + faceWeights[i];
    }

    return this;
};

MeshSurfaceSampler.prototype.sample = function (targetPosition) {
    // Randomly pick a face based on the distribution
    const totalWeight = this.distribution[this.distribution.length - 1];
    const faceIndex = this._binarySearch(this.randomFunction() * totalWeight);

    const a = this.geometry.index.getX(faceIndex * 3);
    const b = this.geometry.index.getX(faceIndex * 3 + 1);
    const c = this.geometry.index.getX(faceIndex * 3 + 2);

    // Get the vertices for the chosen face
    this._vA.fromBufferAttribute(this.positionAttribute, a);
    this._vB.fromBufferAttribute(this.positionAttribute, b);
    this._vC.fromBufferAttribute(this.positionAttribute, c);

    // Barycentric coordinates for uniformly sampling within the triangle
    const r1 = Math.sqrt(this.randomFunction());
    const r2 = this.randomFunction();

    this._vB.sub(this._vA);
    this._vC.sub(this._vA);

    // Compute the final position using barycentric interpolation
    this._sampledPosition.copy(this._vA)
        .addScaledVector(this._vB, 1 - r1)
        .addScaledVector(this._vC, r1 * (1 - r2));

    targetPosition.copy(this._sampledPosition);
};

MeshSurfaceSampler.prototype._binarySearch = function (value) {
    let start = 0;
    let end = this.distribution.length - 1;

    while (start <= end) {
        const middle = (start + end) >> 1;
        if (this.distribution[middle] < value) {
            start = middle + 1;
        } else {
            end = middle - 1;
        }
    }

    return start - 1;
};
