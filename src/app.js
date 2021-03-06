import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import * as dat from 'dat.gui'
import fragmentShader from './shader/fragment.glsl'
import vertexShader from './shader/vertex.glsl'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import {GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer'
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass'
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass'
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { AberrationShader } from './shader/customPass.js'
const canvas = document.querySelector('.webgl')

function sleep(milliseconds) {
	const date = Date.now();
	let currentDate = null;
	do {
	  currentDate = Date.now();
	} while (currentDate - date < milliseconds);
  }

class NewScene{
    constructor(){
		this.done = 0;
		this.ind = 35;
        this._Init()
    }
    
    _Init(){
        this.scene = new THREE.Scene()
		//this.scene.background = new THREE.Color( 0xffff00, 0);
        this.clock = new THREE.Clock()
        //this.InitGLTF()
        this.InitDisplay()
        this.InitSettings()
        this.InitCamera()
        this.InitRenderer()
        this.InitPostProcessing()
        this.InitLights()
        this.InitControls()
        this.Update()
        window.addEventListener('resize', () => {
            this.Resize()
        })
    }

    InitGLTF(){
        this.dracoLoader = new DRACOLoader()
        this.dracoLoader.setDecoderPath('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/js/libs/draco/')
        this.gltfLoader = new GLTFLoader()
        this.gltfLoader.setDRACOLoader(this.dracoLoader)
        this.gltfLoader.load('dna-02.glb', (gltf) => {
            this.geometry = gltf.scene.children[0].geometry
            this.geometry.center()
            //console.log(this.geometry)
            this.InitSettings()
            this.InitDisplay()
            this.InitPostProcessing()
            window.addEventListener('resize', () => {
            this.Resize()
        })
        })
        
    }

    InitDisplay(){
        this.geometry = new THREE.BufferGeometry()
        
        this.number = 300000;

        // for (let i=0; i <= this.number; i++){

        // }
        //this.number = this.geometry.attributes.position.array.length
        console.log(this.number/3)
        let positions = new Float32Array(this.number)
        let randoms = new Float32Array(this.number/3)
        let colorRandoms = new Float32Array(this.number/3)

        let row = 100;
        for(let i = 0; i < this.number/3; i++){
            randoms.set([Math.random()], i)
            colorRandoms.set([Math.random()], i)

            let theta = 0.002 * Math.PI * 2 * (Math.floor(i/100))
            let radius = 0.17 * ((i%100) - 50)            

            let x = radius * Math.cos(theta)
            let y = 0.1 * (Math.floor(i/100))
            let z = radius * Math.sin(theta)
            positions.set([x,y,z], i * 3)
        }
        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        this.geometry.setAttribute('randoms', new THREE.BufferAttribute(randoms,1))
        this.geometry.setAttribute('colorRandoms', new THREE.BufferAttribute(colorRandoms,1))
        this.material = new THREE.ShaderMaterial({
            side: THREE.DoubleSide,
            vertexShader:  vertexShader,
            fragmentShader: fragmentShader,
            uniforms: {
                u_time: { value: 0},
                u_color1: { value: new THREE.Color(0x0F7A00)},
                u_color2: { value: new THREE.Color(0x0F7A00)},
                u_color3: { value: new THREE.Color(0x0F7A00)}
            },
            transparent: true,
            depthTest: false,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        })

        this.geometry.center()
        //this.geometry = new THREE.PlaneGeometry(1, 1, 10, 10)
        this.plane = new THREE.Points(this.geometry, this.material)
        this.scene.add(this.plane)
    }

    InitPostProcessing(){
        this.renderScene = new RenderPass(this.scene, this.camera)
        this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.9, 0.05)
        this.customPass = new ShaderPass(AberrationShader)
        this.composer = new EffectComposer(this.renderer)
        

        this.composer.addPass(this.renderScene)
        this.composer.addPass(this.customPass)
        
        this.composer.addPass(this.bloomPass)
        
    }
    
    InitRenderer(){
        this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
        })
        this.renderer.shadowMap.enabled = true
        this.renderer.setClearColor(0x8D88A3,0.05)
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        //this.renderer.render(this.scene, this.camera)
    }

    InitCamera(){
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000)
		this.camera.position.set(0, 0, 25)
		this.camera.setFocalLength(35);
        this.scene.add(this.camera)
    }

    InitLights(){
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
        this.scene.add(this.ambientLight)
    }

    InitSettings(){
        this.settings = {
            progress: 0,
            bloomStrength: 0.85,
            bloomRadius: 0.0,
            bloomThreshold: 0.0
        }
        this.gui = new dat.GUI()
        this.gui.add(this.settings, 'progress', 0, 1, 0.01)
        this.gui.add(this.settings, 'bloomStrength', 0, 10, 0.01)
        this.gui.add(this.settings, 'bloomRadius', 0, 10, 0.01)
        this.gui.add(this.settings, 'bloomThreshold', 0, 10, 0.01)
    }

    InitControls(){
        this.controls = new OrbitControls(this.camera, canvas)
        this.controls.enableDamping = true;
		this.controls.enableZoom = true;
        this.controls.update()
    }

    Resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight
        this.camera.updateProjectionMatrix()
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        this.composer.setSize(window.innerWidth, window.innerHeight)
    }
	
    Update(){
        requestAnimationFrame(() => {
            if(this.bloomPass){
                this.bloomPass.threshold = this.settings.bloomThreshold
                this.bloomPass.strength = this.settings.bloomStrength
                this.bloomPass.radius = this.settings.bloomRadius
                this.composer.render(this.scene, this.camera)
            }
            if(this.geometry){
                this.plane.rotation.y = this.clock.getElapsedTime()/11
                this.material.uniforms.u_time.value = this.clock.getElapsedTime()
			}
			if(this.ind > 11.5){
				this.camera.setFocalLength(this.ind);
				sleep(25);
				this.ind -= 0.09;
			}
            //this.renderer.render(this.scene, this.camera)
            this.controls.update()
            this.Update()
        })
    }
}

let _APP = null

window.addEventListener('load', () => {
	setTimeout(() => {  _APP = new NewScene(); }, 3000);
    //_APP = new NewScene()
})

window.onload = function() {
    var name = document.querySelector("#info");
    setTimeout(() => { name.style.animation = "glitch-skew 0.5s infinite linear alternate-reverse"; }, 1000);
    setTimeout(() => { name.style.animation = "none"; }, 3000);
    setTimeout(() => { name.setAttribute('data-text', "mercy"); }, 1200);
    setTimeout(() => { name.setAttribute('data-text', ""); }, 3000);
    //setTimeout(() => { name.style.transform = "scaleX(1)" }, 2400);
//_APP = new NewScene()
};