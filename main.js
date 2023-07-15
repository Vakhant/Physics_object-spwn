import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import bg from './bg.jpg'

const renderer = new THREE.WebGLRenderer({
	antialias: true
});
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.shadowMap.enabled = true
document.body.appendChild( renderer.domElement );
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.set( -10, 30, 30 );
camera.lookAt( 0, 0, 0 );


// -- LIGHT START --

const ambientLight = new THREE.AmbientLight(0x333333)
scene.add(ambientLight)

const spotLight = new THREE.SpotLight(0xFFFFFF, 1)
spotLight.position.set( 0, 30, 0 );
spotLight.castShadow = true // источник тени
spotLight.shadow.mapSize.width = 3024
spotLight.shadow.mapSize.height = 3024
spotLight.distance = 100 // угол
spotLight.angle = 0.65 // угол
scene.add(spotLight)

scene.fog = new THREE.Fog(0x111111, 100, 300)

const cubeTextureLoader = new THREE.CubeTextureLoader()
scene.background = cubeTextureLoader.load([
	bg,bg,bg,bg,bg,bg
]) // 3d фон

// -- HELPERS START --

const orbit = new OrbitControls(camera, renderer.domElement) // перемещение в пространстве
orbit.update()


const mouse = new THREE.Vector2()
const intersectionPoint = new THREE.Vector3()
const planeNormal = new THREE.Vector3()
const plane = new THREE.Plane()
const raycaster = new THREE.Raycaster()


// -- HELPERS END --


const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.81, 0)
})

const planeGeo = new THREE.PlaneGeometry(30,30)
const planeMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, side:THREE.DoubleSide }) // отображение с обеих сторон
const planeMesh = new THREE.Mesh( planeGeo, planeMat );
scene.add( planeMesh );
planeMesh.receiveShadow = true // принимать(ловить) тень

const planePhysMat = new CANNON.Material()
const planeBody = new CANNON.Body({
	// shape: new CANNON.Plane(),
	shape: new CANNON.Box(new CANNON.Vec3(15, 15, 0.1)),
	type: CANNON.Body.STATIC,
	position: new CANNON.Vec3(0, -0.1, 0),
	material: planePhysMat
})
planeBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);

world.addBody(planeBody)

const meshes = []
const bodies = []

window.addEventListener('mousemove', function(e){
	mouse.x = (e.clientX / window.innerWidth) * 2 - 1
	mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
	planeNormal.copy(camera.position).normalize()
	plane.setFromNormalAndCoplanarPoint(planeNormal, scene.position)
	raycaster.setFromCamera(mouse, camera)
	raycaster.ray.intersectPlane(plane, intersectionPoint)
})

window.addEventListener('click', function(e){
	const sphereSize = Math.random()
	const sphereGeo = new THREE.SphereGeometry(sphereSize, sphereSize*25+10, sphereSize*25+10)
	const sphereMat = new THREE.MeshStandardMaterial({
		color: Math.random() * 0xFFFFFF,
		metalness: 0,
		roughness: 0
	})
	const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat)
	scene.add(sphereMesh)
	sphereMesh.receiveShadow = true // принимать(ловить) тень
	sphereMesh.castShadow = true // источник тени
	sphereMesh.position.copy(intersectionPoint)

	const spherePhysMat = new CANNON.Material()
	const sphereBody = new CANNON.Body({
		mass: Math.random(),
		shape: new CANNON.Sphere(sphereSize),
		position: new CANNON.Vec3(intersectionPoint.x, intersectionPoint.y, intersectionPoint.z),
		material: spherePhysMat
	})
	world.addBody(sphereBody)

	const planeSphereContactMat = new CANNON.ContactMaterial(
		planePhysMat,
		sphereBody,
		{restitution: Math.random()},
		{friction: Math.random()}
	)
	
	world.addContactMaterial(planeSphereContactMat)

	meshes.push(sphereMesh)
	bodies.push(sphereBody)
})



const timeStpe = 1/60

function animate(time) {
	world.step(timeStpe)

	planeMesh.quaternion.copy(planeBody.quaternion)

	for (let i = 0; i < meshes.length; i++) {
		meshes[i].position.copy(bodies[i].position);
		meshes[i].quaternion.copy(bodies[i].quaternion);
	}

	renderer.render( scene, camera );
}
renderer.setAnimationLoop(animate)


// canvas media resize

window.addEventListener('resize', function(){
	camera.aspect = window.innerWidth/window.innerHeight
	camera.updateProjectionMatrix()
	renderer.setSize(window.innerWidth, window.innerHeight, )
})






