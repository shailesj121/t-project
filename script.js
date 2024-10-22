const canvas = document.getElementById("master-canvas");
const fragmentShader = document.getElementById("fragmentShader").innerText;
const vertexShader = document.getElementById("vertexShader").innerText;

gsap.registerPlugin(ScrollTrigger)

const uniforms = {
	uTime: { value: 0 },
	uProgress: { value: 0 },
}

/**
 * Debug
 */
// const gui = new dat.GUI()
// gui.add(uniforms.uProgress, 'value', 0, 1, 0.01)

gsap.to(uniforms.uProgress, {
	value: 1,
	duration: 2,
	ease: 'linear',
	scrollTrigger: {
		trigger: 'body',
		start: 'top top',
		end: 'bottom bottom',
		scrub: 2,
	},
})

/**
 * Scene
 */
const scene = new THREE.Scene()
// scene.background = new THREE.Color(0xdedede)
const manager = new THREE.LoadingManager()

const loader = new THREE.GLTFLoader(manager)

const models = {
	monkey: null,
	rabbit: null,
}



loader.load("/model/t-model1.glb", (gltf) => {
	// console.log(gltf.scene)
	let model

	gltf.scene.traverse((el) => {
		if (el instanceof THREE.Mesh) {
			model = el
		}
	})

	model.geometry.scale(10,10, 10)
	model.geometry.rotateX(Math.PI * 0.40)
	model.geometry.rotateY(Math.PI * 0.25)
	model.geometry.center()

	// scene.add(model)
  // console.log(model)
	models.rabbit = model
})

loader.load("/model/t-model1.glb", (gltf) => {
	let model

	gltf.scene.traverse((el) => {
		if (el instanceof THREE.Mesh) {
			model = el
		}
	})
	// console.log(model)
	// scene.add(model)
	model.geometry.scale(10, 10, 10)
	model.geometry.rotateX(Math.PI * 0.40)
	model.geometry.rotateY(Math.PI * 0.25)

	models.monkey = model
	// const sampler = new MeshSurfaceSampler(model).build()

	// createParticles(sampler)
})


manager.onLoad = () => {
	createParticles(models)
}

/**
 * BOX
 */
// const material = new THREE.MeshNormalMaterial()
// const material = new THREE.MeshStandardMaterial({ color: 'coral' })
// const geometry = new THREE.BoxGeometry(1, 1, 1)


const colors = [
	new THREE.Color('#ff0000'),
	new THREE.Color('#f93c3c'),
	new THREE.Color('#fea5a5'),
]

function createParticles({ monkey, rabbit }) {
  // console.log(rabbit)
	const monkeySampler = new MeshSurfaceSampler(monkey).build()
	const rabbitSampler = new MeshSurfaceSampler(rabbit).build()

	const geometry = new THREE.BufferGeometry()
	const num = 15000
	const bound = 20

	const positionArray = new Float32Array(num * 3)
	const position2Array = new Float32Array(num * 3)
	const colorArray = new Float32Array(num * 3)	
	const offsetArray = new Float32Array(num)

	const pos = new THREE.Vector3()

	for (let i = 0; i < num; i++) {
		// const x = Math.random() * bound - bound / 2
		// const y = Math.random() * bound - bound / 2
		// const z = Math.random() * bound - bound / 2

		monkeySampler.sample(pos)
		positionArray.set([pos.x, pos.y, pos.z], i * 3)

		rabbitSampler.sample(pos)
		position2Array.set([pos.x, pos.y, pos.z], i * 3)

		// const r = Math.random()
		// const g = Math.random()
		// const b = Math.random()
		const color = colors[Math.floor(Math.random() * colors.length)]

		const offset = Math.random()
		offsetArray[i] = offset

		colorArray.set([color.r, color.g, color.b], i * 3)
	}

	// console.log([positionArray])
	geometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3))
	geometry.setAttribute(
		'position2',
		new THREE.BufferAttribute(position2Array, 3)
	)
	geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3))

	const material = new THREE.ShaderMaterial({
		uniforms: {
			...uniforms,
		},
		fragmentShader,
		vertexShader,
		transparent: true,
		depthWrite: false,
		blending: THREE.AdditiveBlending,
	})

	const particles = new THREE.Points(geometry, material)
	scene.add(particles)
}

/**
 * render sizes
 */
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
}
/**
 * Camera
 */
const fov = 60
const camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight)
camera.position.set(4, 4, 4)
// camera.lookAt(new THREE.Vector3(0, 2.5, 0))

/**
 * Show the axes of coordinates system
 */
// const axesHelper = new THREE.AxesHelper(3)
// scene.add(axesHelper)

/**
 * renderer
 */
const renderer = new THREE.WebGLRenderer({canvas, 
	antialias: window.devicePixelRatio < 2,
	logarithmicDepthBuffer: true,
})
handleResize()

/**
 * OrbitControls
 */
const controls = new THREE.OrbitControls(camera, renderer.domElement)
controls.enableDamping = true

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5)
const directionalLight = new THREE.DirectionalLight(0xffffff, 4.5)
directionalLight.position.set(3, 10, 7)
scene.add(ambientLight, directionalLight)

/**
 * Three js Clock
 */
const clock = new THREE.Clock()

/**
 * frame loop
 */
function tic() {
	/**
	 * tempo trascorso dal frame precedente
	 */
	// const deltaTime = clock.getDelta()
	/**
	 * tempo totale trascorso dall'inizio
	 */
	const time = clock.getElapsedTime()
	uniforms.uTime.value = time

	controls.update()

	renderer.render(scene, camera)

	requestAnimationFrame(tic)
}

	requestAnimationFrame(tic)

window.addEventListener('resize', handleResize)

function handleResize() {
	sizes.width = window.innerWidth
	sizes.height = window.innerHeight

	camera.aspect = sizes.width / sizes.height
	camera.updateProjectionMatrix()

	renderer.setSize(sizes.width, sizes.height)

	const pixelRatio = Math.min(window.devicePixelRatio, 2)
	renderer.setPixelRatio(pixelRatio)
}
