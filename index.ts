import THREE, {
	AddEquation,
	AdditiveBlending,
	AlwaysStencilFunc,
	AmbientLight,
	AxesHelper,
	BackSide,
	BlendingDstFactor,
	Color,
	ColorRepresentation,
	CustomBlending,
	DecrementStencilOp,
	DecrementWrapStencilOp,
	DirectionalLight,
	DoubleSide,
	DstAlphaFactor,
	EqualStencilFunc,
	ExtrudeGeometry,
	FrontSide,
	GreaterEqualDepth,
	Group,
	IncrementStencilOp,
	IncrementWrapStencilOp,
	KeepStencilOp,
	LessDepth,
	LessEqualDepth,
	MaxEquation,
	Mesh,
	MeshBasicMaterial,
	MeshStandardMaterial,
	MultiplyBlending,
	NeverStencilFunc,
	NoBlending,
	NormalBlending,
	NotEqualStencilFunc,
	OneFactor,
	PerspectiveCamera,
	ReplaceStencilOp,
	Scene,
	ShaderMaterial,
	Shape,
	ShapeGeometry,
	SrcAlphaFactor,
	SubtractiveBlending,
	Vector2,
	WebGLRenderer,
	ZeroStencilOp
} from 'three'
import { MapControls } from 'three/examples/jsm/controls/MapControls'
import { terrain } from './terrain'

// #region three-js-setup
const scene = new Scene()
const renderer = new WebGLRenderer()
const dom: HTMLElement = document.querySelector('#container')!
dom.appendChild(renderer.domElement)
const ambientLight = new AmbientLight(0x333333)
const directionalLight = new DirectionalLight(0xffffff)
directionalLight.position.set(1, 2, 3)
directionalLight.target.position.set(0, 0, 0)
const width = dom.clientWidth
const height = dom.clientHeight
renderer.setSize(width, height)
renderer.setPixelRatio(window.devicePixelRatio)
// renderer.state.buffers.stencil.setClear(2)
// renderer.autoClearStencil = false
const camera = new PerspectiveCamera(45, width / height, 1, 10000)
camera.position.set(5, 3, 5)
camera.lookAt(0, 0, 0)
const controls = new MapControls(camera, renderer.domElement)

scene.add(ambientLight, directionalLight)
renderer.render(scene, camera)

function animate(deltaTime: number) {
	requestAnimationFrame(animate)
	renderer.render(scene, camera)
	controls.update()
}
requestAnimationFrame(animate)
// #endregion

scene.add(terrain)
terrain.renderOrder = 1
camera.position.set(1000, 5000, 0)

// a triangle shape
const shape0 = new Shape([
	new Vector2(1000, 0),
	new Vector2(1000, 1000),
	new Vector2(0, 500),
	new Vector2(-1000, 1000),
	new Vector2(-1000, 0)
	// new Vector2(-1000, 0),
	//
	//   new Vector2(-0, 0),
])
const shape1 = new Shape([new Vector2(500, 500), new Vector2(1500, 500), new Vector2(500, -500)])
const shape2 = new Shape([new Vector2(-500, 0), new Vector2(1500, 0), new Vector2(500, -500)])

let order = 1
scene.add(
	createGroundMesh(shape0, 'red', order, true),

	createGroundMesh(shape1, 'green', order+=2, true),

	createGroundMesh(shape2, 'blue', order+=2, true)
)

function createGroundMesh(shape: Shape, color: ColorRepresentation, order: number, transparent: boolean): Group {
	const group = new Group()
	// create the shadow volume geometry as a extrude geometry
	const extrudeGeometry = new ExtrudeGeometry(shape, {
		steps: 1,
		depth: 1500, // it must be big enough to cover the depth range of the terrain
		bevelEnabled: false
	})
	extrudeGeometry.rotateX(-Math.PI / 2)

	// debug wireframe
	// const helperGeometry = extrudeGeometry.clone()
	// const helperMesh = new Mesh(helperGeometry, new MeshBasicMaterial({ wireframe: true }))
	// group.add(helperMesh) 

	/** render the shadow volume the first time for the front side to write to the stencil buffer  */
	const frontMaterial = new MeshBasicMaterial({
		side: FrontSide,
		depthWrite: false,
		colorWrite: false, // don't write to color buffer nor depth buffer
		stencilWrite: true,
		stencilFunc: AlwaysStencilFunc,
		stencilFail: KeepStencilOp,
		stencilZFail: DecrementWrapStencilOp, // decrease stencil value if depth test failed
		stencilZPass: KeepStencilOp, 
		transparent
	})

	/** render the shadow volume the 2nd time for the back side to write to the stencil buffer */
	const backMaterial = new MeshBasicMaterial({
		side: BackSide,
		depthWrite: false,
		colorWrite: false,
		stencilWrite: true,
		stencilFunc: AlwaysStencilFunc,
		stencilFail: KeepStencilOp,
		stencilZFail: IncrementWrapStencilOp, // increment stencil value if depth test fails
		stencilZPass: KeepStencilOp, // do nothing if depth test passes
		transparent
	})

	/** render the actual shape on the terrain, it writes the color buffer */
	const tintMaterial = new MeshBasicMaterial({
		side: DoubleSide,
		stencilWrite: true,
		stencilRef: 0,
		depthWrite: false,
		stencilFunc: NotEqualStencilFunc, // draw if stencil != 0
		stencilFail: ZeroStencilOp,
		stencilZFail: ZeroStencilOp,
		stencilZPass: ZeroStencilOp, //reset stencil value to zero so it would not effect later shadow volumes
		depthTest: false,
		transparent,
		opacity: 0.5,
		color
	})


	const front = new Mesh(extrudeGeometry, frontMaterial)
	front.renderOrder = order // render after the terrain

	const back = new Mesh(extrudeGeometry, backMaterial)
	back.renderOrder = order

	const tint = new Mesh(extrudeGeometry, tintMaterial)
	
	tint.renderOrder = order + 1 // render this one after the two stencil-write renderings
	// different shadow volumes should be rendered separatly
	group.add(
		front,
		back,
		tint
	)
	return group
}

export { scene, camera, controls, renderer }
