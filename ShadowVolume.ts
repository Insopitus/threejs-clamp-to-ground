import { ShaderMaterial, ShaderLib, Group, FrontSide, LessDepth, BackSide, Shape, ExtrudeGeometry, Mesh, DoubleSide, WebGLRenderer, ColorRepresentation, Color } from 'three'
function cloneShader(lib:any){
	const output = {
		vertexShader: lib.vertexShader,
		fragmentShader:lib.fragmentShader,
		uniforms:{}
	}
	for (let key in lib.uniforms){
		if(lib.uniforms.hasOwnProperty(key)){
			output.uniforms[key] = {value:lib.uniforms[key].value}
		}
	}
	return output

}
export class ShadowVolumeMaterial extends ShaderMaterial {
	constructor(source = ShaderLib.basic) {
		super(cloneShader(source))
	}

	setLight(light) {
		// TODO: get position in world space
		const vec = this.uniforms.lightInfo.value
		if (light.isPointLight) {
			vec.copy(light.position)
			vec.w = 1.0
		} else {
			vec.copy(light.position).sub(light.target.position)
			vec.w = 0.0
		}
	}

	setShadowDistance(dist) {
		this.uniforms.shadowDistance.value = dist
	}

	setShadowBias(bias) {
		this.uniforms.shadowBias.value = bias
	}

	clone() {
		const newMat = new ShadowVolumeMaterial()
		newMat.copy(this)
		return newMat
	}
}

export class ShadowVolumeMesh extends Group {
	get shadowGeometry() {
		return this.children[0].geometry
	}

	constructor(shape: Shape, renderer: WebGLRenderer, renderOrder: number, color: ColorRepresentation) {
		super()
		this.renderOrder = renderOrder
		function incrFunc() {
			stencilBuffer.setTest(true)
			stencilBuffer.setFunc(gl.ALWAYS, 0, 0xff)
			stencilBuffer.setOp(gl.KEEP, gl.KEEP, gl.INCR_WRAP)

			stencilBuffer.setLocked(true)
		}

		function decrFunc() {
			stencilBuffer.setTest(true)
			stencilBuffer.setFunc(gl.ALWAYS, 0, 0xff)
			stencilBuffer.setOp(gl.KEEP, gl.KEEP, gl.DECR_WRAP)

			stencilBuffer.setLocked(true)
		}

		function noteqFunc() {
			stencilBuffer.setTest(true)
			stencilBuffer.setFunc(gl.NOTEQUAL, 0, 0xff)
			stencilBuffer.setOp(gl.ZERO, gl.ZERO, gl.ZERO)

			stencilBuffer.setLocked(true)
		}

		function disableFunc() {
			stencilBuffer.setLocked(false)
			stencilBuffer.setTest(false)
		}
		function disableAndClearFunc() {
			disableFunc()
			renderer.clearStencil()
		}

		const stencilBuffer = renderer.state.buffers.stencil
		stencilBuffer.setClear(0)

		const gl = renderer.getContext()
		const shadowVolumeGeometry = new ExtrudeGeometry(shape, {
			depth: 2000,
			steps: 1,
			bevelEnabled: false
		})
		shadowVolumeGeometry.rotateX(-Math.PI / 2)
		// const test = new Mesh(shadowVolumeGeometry,new MeshBasicMaterial({wireframe:true}))
		// this.add(test)
		// Materials
		const frontMaterial = new ShadowVolumeMaterial()
		frontMaterial.side = FrontSide
		frontMaterial.colorWrite = false
		frontMaterial.depthWrite = false
		frontMaterial.depthTest = true
		frontMaterial.depthFunc = LessDepth

		const backMaterial = new ShadowVolumeMaterial()
		frontMaterial.side = BackSide
		backMaterial.colorWrite = false
		backMaterial.depthWrite = false
		backMaterial.depthTest = true
		backMaterial.depthFunc = LessDepth

		const tintMaterial = new ShadowVolumeMaterial()
		tintMaterial.side = FrontSide
		tintMaterial.depthWrite = false
		tintMaterial.depthTest = false
		tintMaterial.uniforms.diffuse.value = new Color(color)
		tintMaterial.uniforms.opacity.value = 0.7
		tintMaterial.transparent = true

		// Meshes
		const frontMesh = new Mesh(shadowVolumeGeometry, frontMaterial)
		frontMesh.renderOrder = this.renderOrder
		frontMesh.onBeforeRender = incrFunc
		frontMesh.onAfterRender = disableFunc
		frontMesh.autoUpdateMatrixWorld = false

		const backMesh = new Mesh(shadowVolumeGeometry, backMaterial)
		backMesh.renderOrder = this.renderOrder
		backMesh.onBeforeRender = decrFunc
		backMesh.onAfterRender = disableFunc
		backMesh.autoUpdateMatrixWorld = false

		const tintMesh = new Mesh(shadowVolumeGeometry, tintMaterial)
		tintMesh.renderOrder = this.renderOrder + 1
		tintMesh.onBeforeRender = noteqFunc
		tintMesh.onAfterRender = disableAndClearFunc
		tintMesh.autoUpdateMatrixWorld = false

		// Add meshes to group
		this.add(frontMesh)
		this.add(backMesh)
		this.add(tintMesh)

		// Intersect Cap
		const frontMaterial2 = frontMaterial.clone()
		frontMaterial2.depthTest = false

		const backMaterial2 = backMaterial.clone()
		backMaterial2.depthTest = false

		const frontMesh2 = new Mesh(shadowVolumeGeometry, frontMaterial2)
		frontMesh2.renderOrder = this.renderOrder
		frontMesh2.onBeforeRender = decrFunc
		frontMesh2.onAfterRender = disableFunc
		frontMesh2.autoUpdateMatrixWorld = false

		const backMesh2 = new Mesh(shadowVolumeGeometry, backMaterial2)
		backMesh2.renderOrder = this.renderOrder
		backMesh2.onBeforeRender = incrFunc
		backMesh2.onAfterRender = disableFunc
		backMesh2.autoUpdateMatrixWorld = false

		this.add(frontMesh2)
		this.add(backMesh2)
	}

	setLight(light) {
		this.children.forEach((c) => c.material.setLight?.(light))
	}

	setShadowDistance(distance) {
		this.children.forEach((c) => c.material.setShadowDistance?.(distance))
	}

	setShadowBias(bias) {
		this.children.forEach((c) => c.material.setShadowBias?.(bias))
	}

	setIntensity(intensity) {
		this.children[2].material.uniforms.opacity.value = intensity
	}
}
