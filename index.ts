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
	ZeroStencilOp,
	
} from 'three'
import { MapControls } from 'three/examples/jsm/controls/MapControls'
import { terrain } from './terrain'
import { ShadowVolumeMesh } from './ShadowVolume'

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
const TEST = false
if (TEST) {
	const d_light = new DirectionalLight(0xff0000)
	d_light.position.set(1000, 10000, 0)
	d_light.target.position.set(0, 0, 0)
	d_light.castShadow = true
	// scene.add(d_light)
	terrain.receiveShadow = true
	const geometry0 = new ExtrudeGeometry(shape0, {
		depth: 1500,
		steps: 1,
		bevelEnabled: false
	})
	geometry0.rotateX(-Math.PI / 2)
	// geometry0.translate(0,0,1000)
	// const mesh = new Mesh(geometry0, new MeshStandardMaterial())
	// mesh.position.y = 1500
	const volume = new ShadowVolumeMesh(shape0, renderer, 10, 'red')
	// const volume1 = new ShadowVolumeMesh(shape1,renderer)
	const volume2 = new ShadowVolumeMesh(shape2, renderer, 20, 'blue')
	// volume.setShadowDistance(2000)
	// volume.setLight(d_light)
	// volume.setShadowBias(0.1)
	// volume.visible = true
	scene.add(volume /** */, volume2)
} else {
	scene.add(
		createGroundMesh(shape0, 'red', 4, true) /**凹形 */,
		 createGroundMesh(shape1, 'yellow', 8, true)
		)
}
function createGroundMesh(shape: Shape, color: ColorRepresentation, order: number, transparent: boolean): Group {
	const group = new Group()
	// create the shadow volume geometry
	const extrudeGeometry = new ExtrudeGeometry(shape, {
		steps: 1,
		depth: 1100,
		bevelEnabled: false
	})
	extrudeGeometry.rotateX(-Math.PI / 2)

	const helper_geometry = extrudeGeometry.clone()
	const helper_mesh = new Mesh(helper_geometry, new MeshBasicMaterial({ wireframe: true }))
	scene.add(helper_mesh)

	// // a triangle shape
	// const shape2 = new Shape([new Vector2(500, 0), new Vector2(800, 0), new Vector2(800, 800), new Vector2(-800, 800), new Vector2(-800, 0), new Vector2(-600, 0), new Vector2(-600, 400)])

	// // create the shadow volume geometry
	// const extrude_geometry2 = new ExtrudeBufferGeometry(shape, {
	// 	steps: 1,
	// 	depth: 1500
	// })
	// extrude_geometry2.rotateX(-Math.PI / 2)
	const stencilFunction = AlwaysStencilFunc
	/** render the shadow volume the first time for the front side to write to the stencil buffer  */
	const frontMaterial = new MeshBasicMaterial({
		side: FrontSide,
		depthWrite: false,
		colorWrite: false, // don't write to color buffer nor depth buffer
		stencilWrite: true,
		// depthFunc: GreaterEqualDepth,
		stencilFunc: AlwaysStencilFunc,
		stencilFail: KeepStencilOp,
		stencilZFail: DecrementWrapStencilOp,
		stencilZPass: KeepStencilOp, // increment stencil buffer
		transparent
		// stencilWriteMask:0,
		// stencilFuncMask:0,
		// stencilRef:0x80,
	})

	/** render the shadow volume the 2nd time for the back side to write to the stencil buffer */
	const backMaterial = new MeshBasicMaterial({
		side: BackSide,
		depthWrite: false,
		// depthFunc: GreaterEqualDepth,
		colorWrite: false,
		stencilWrite: true,
		stencilFunc: AlwaysStencilFunc,
		stencilFail: KeepStencilOp,
		stencilZFail: IncrementWrapStencilOp, // decrement stencil buffer if depth test fails
		stencilZPass: KeepStencilOp, // do nothing if depth test passes
		transparent
		// stencilWriteMask:0,
		// stencilFuncMask:0,
		// stencilRef:0x80,
	})
	const frontMaterial1 = frontMaterial.clone()
	frontMaterial1.depthTest = false
	frontMaterial1.stencilZFail = DecrementWrapStencilOp
	const backMaterial1 = backMaterial.clone()
	backMaterial1.depthTest = false
	backMaterial1.stencilZFail = IncrementWrapStencilOp

	// for test purpose
	const setMaterial = new MeshBasicMaterial({
		side:BackSide,
		stencilWrite: true, //
		colorWrite:false,
		stencilWriteMask: 0xff,
		stencilRef: 1,
		depthWrite: false,
		stencilFunc: AlwaysStencilFunc, //
		stencilFail: KeepStencilOp,
		stencilZFail: ReplaceStencilOp,
		stencilZPass: KeepStencilOp,
		// depthTest: false,
		// blending: NormalBlending,
		// stencilFuncMask:0x0f,
		transparent,
	})

	/** render the actual shape on the terrain, writes to color buffer */
	const tintMaterial = new ShaderMaterial({
		side: FrontSide,
		stencilWrite: true, // enable stencil test for this material even if you don't write to it
		stencilWriteMask: 0,
		stencilRef: 0,
		depthWrite: false,
		stencilFunc: NotEqualStencilFunc, // draw if stencil != 0
		stencilFail: ZeroStencilOp,
		stencilZFail: ZeroStencilOp,
		stencilZPass: ZeroStencilOp,
		depthTest: false,
		blending: CustomBlending,
		blendEquationAlpha:SrcAlphaFactor,
		blendDst:DstAlphaFactor,
		// blendSrcAlpha:0.2,
		blendEquation:AddEquation,
		// stencilFuncMask:0x0f,
		transparent,
		// opacity: 0.8,
		uniforms: {
			color: {
				value: new Color(color)
			}
		},
		fragmentShader: `
			uniform vec3 color;
			void main(){
				gl_FragColor = vec4(color,0.5);
			}
		`

		// blending: NormalBlending,
		// blendDstAlpha: OneFactor
	})
	// reset all the stencil pixels changed by this shadow volume
	const resetMaterial = new MeshBasicMaterial({
		side: DoubleSide,
		stencilWrite: true,
		stencilWriteMask: 0xff,
		stencilRef: 0,
		depthWrite: false,
		depthTest: true,
		stencilFunc: NeverStencilFunc,
		stencilFail: ReplaceStencilOp,
		stencilZFail: ReplaceStencilOp,
		stencilZPass: ReplaceStencilOp,
		// depthTest: false,
		// blending: NoBlending,
		// stencilFuncMask:0x0f,
		transparent,
		// opacity: 0.8,
		// uniforms: {
		// 	color: {
		// 		value: new Color(color)
		// 	}
		// },
		// fragmentShader: `
		// 	uniform vec3 color;
		// 	void main(){
		// 		gl_FragColor = vec4(color,1.);
		// 	}
		// `

		// blending: NormalBlending,
		// blendDstAlpha: OneFactor
	})

	const front = new Mesh(extrudeGeometry, frontMaterial)
	front.renderOrder = order // render after the terrain

	const back = new Mesh(extrudeGeometry, backMaterial)
	back.renderOrder = order

	const front1 = new Mesh(extrudeGeometry, frontMaterial1)
	front1.renderOrder = order
	const back1 = new Mesh(extrudeGeometry, backMaterial1)
	back1.renderOrder = order

	const set = new Mesh(extrudeGeometry,setMaterial)

	const tint = new Mesh(extrudeGeometry, tintMaterial)
	// extrude3.onAfterRender = (renderer)=>{
	// 	// renderer.clearStencil()
	// 	// renderer.state.buffers.stencil.reset()
	// }
	const reset = new Mesh(extrudeGeometry, resetMaterial)
	reset.renderOrder = order + 2
	tint.renderOrder = order + 1 // render this one last
	group.add(
		front,
		back /** */,
		// set,
		tint,
		reset,
		// front1, back1
	)
	console.log(tint.material)
	return group
}

export { scene, camera, controls, renderer }
