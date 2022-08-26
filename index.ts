import { AlwaysStencilFunc, AmbientLight, AxesHelper, BackSide, DecrementWrapStencilOp, DirectionalLight, ExtrudeBufferGeometry, FrontSide, IncrementWrapStencilOp, KeepStencilOp, Mesh, MeshBasicMaterial, NotEqualStencilFunc, PerspectiveCamera, Scene, Shape, Vector2, WebGLRenderer } from 'three'
import { MapControls } from 'three/examples/jsm/controls/OrbitControls'
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
const camera = new PerspectiveCamera(45, width / height, 1, 10000)
camera.position.set(5, 3, 5)
camera.lookAt(0, 0, 0)
const controls = new MapControls(camera, renderer.domElement)

scene.add(ambientLight, directionalLight,)
renderer.render(scene, camera)

function animate(deltaTime: number) {
    requestAnimationFrame(animate)
    renderer.render(scene, camera)
    controls.update()
}
requestAnimationFrame(animate)
// #endregion


scene.add(terrain)
camera.position.set(1000, 5000, 0)


// a triangle shape
const shape = new Shape([new Vector2(500, 0), new Vector2(0, 500), new Vector2(-500, 0)])

// create the shadow volume geometry
const extrude_geometry = new ExtrudeBufferGeometry(shape, {
    steps: 1,
    depth: 1000,
})
extrude_geometry.rotateX(-Math.PI / 2)

/** render the shadow volume the first time for the front side to write to the stencil buffer  */
const extrude_material_1 = new MeshBasicMaterial({
    side: FrontSide,
    depthWrite: false,
    colorWrite: false, // don't write to color buffer nor depth buffer
    stencilWrite: true,
    stencilFunc: AlwaysStencilFunc,
    stencilZFail: IncrementWrapStencilOp,
    stencilZPass: IncrementWrapStencilOp, // increment stencil buffer

})

/** render the shadow volume the 2nd time for the back side to write to the stencil buffer */
const extrude_material_2 = new MeshBasicMaterial({
    side: BackSide,
    depthWrite: false,
    colorWrite: false,
    stencilWrite: true,
    stencilFunc: AlwaysStencilFunc,
    stencilZFail: KeepStencilOp, // do nothing if depth test fails
    stencilZPass: DecrementWrapStencilOp, // decrement stencil buffer if depth test passes
})

/** render the actual shape on the terrain */
const extrude_material_3 = new MeshBasicMaterial({
    side: FrontSide,
    stencilWrite: true, // enable stencil test for this material even if you don't write to it
    stencilRef: 0,
    depthWrite: false,
    stencilFunc: NotEqualStencilFunc, // draw if stencil != 0
    color: 'limegreen',
    transparent: true,
    opacity: .4
})

const extrude1 = new Mesh(extrude_geometry, extrude_material_1)
extrude1.renderOrder = 1 // render after the terrain

const extrude2 = new Mesh(extrude_geometry, extrude_material_2)
extrude2.renderOrder = 1

const extrude3 = new Mesh(extrude_geometry, extrude_material_3)
extrude3.renderOrder = 2 // render this one last

scene.add(extrude1, extrude2, extrude3)




export { scene, camera, controls, renderer }
