import React, {Component} from 'react'
import ReactDOM from 'react-dom'
import {useState, useEffect} from 'react';

import * as THREE from "three";
import {TrackballControls} from "three/examples/jsm/controls/TrackballControls"

const SERVICE_ID = '42673824-33e5-4aeb-ae5c-38dc66250000'
const SENSOR_ID = "42673824-33e5-4aeb-ae5c-38dc66250002"

let cube;

class CubeDemo extends Component {
    componentDidMount() {
        // === THREE.JS CODE START ===
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);
        const geometry = new THREE.BoxGeometry();
        const cubeMaterials = [
            new THREE.MeshBasicMaterial({color: 0xA04040}),
            new THREE.MeshBasicMaterial({color: 0xA04040}),
            new THREE.MeshBasicMaterial({color: 0x40A040}),
            new THREE.MeshBasicMaterial({color: 0x40A040}),
            new THREE.MeshBasicMaterial({color: 0x4040A0}),
            new THREE.MeshBasicMaterial({color: 0x4040A0}),
        ];
        renderer.setClearColor("#233143");

        const boxMaterial = new THREE.MeshLambertMaterial({color: 0xFFFFFF});

        const material = new THREE.MeshFaceMaterial(cubeMaterials);
        cube = new THREE.Mesh(geometry, cubeMaterials);
        scene.add(cube);
        const cubeAxis = new THREE.AxesHelper(3); // X axis = red, Y axis = green, Z axis = blue
        cube.add(cubeAxis);

        camera.position.set(5, 5, 5);
        camera.up.set(0, 0, 1);
        camera.lookAt(0, 0, 0);

        //Trackball Controls for Camera
        const controls = new TrackballControls(camera, renderer.domElement);
        controls.rotateSpeed = 4;
        controls.dynamicDampingFactor = 0.15;
        renderer.render(scene, camera);

        const animate = function () {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
            controls.update();
        };
        animate();
        // === THREE.JS EXAMPLE CODE END ===
    }

    render() {
        return (
            <div/>
        )
    }
}

const App = () => {
    const [supportsBluetooth, setSupportsBluetooth] = useState(false);
    const [isDisconnected, setIsDisconnected] = useState(true);
    const [sensorData, setSensorData] = useState(null);

    // When the component mounts, check that the browser supports Bluetooth
    useEffect(() => {
        if (navigator.bluetooth) {
            setSupportsBluetooth(true);
        }
    }, []);

    /**
     * Let the user know when their device has been disconnected.
     */
    const onDisconnected = (event) => {
        alert(`The device ${event.target} is disconnected`);
        setIsDisconnected(true);
    }

    /**
     * Update the value shown on the web page when a notification is
     * received.
     */
    const handleCharacteristicValueChanged = (event) => {
        let buf = event.target.value.buffer;
        let data = new Int32Array(buf);
        let pos = 0;
        const Ax = data[pos++] + data[pos++] / 1000000;
        const Ay = data[pos++] + data[pos++] / 1000000;
        const Az = data[pos++] + data[pos++] / 1000000;
        const Gx = data[pos++] + data[pos++] / 1000000;
        const Gy = data[pos++] + data[pos++] / 1000000;
        const Gz = data[pos++] + data[pos++] / 1000000;


        // Work out the squares
        const x2 = Ax * Ax;
        const y2 = Ay * Ay;
        const z2 = Az * Az;

        //X Axis
        let result = Math.sqrt(y2 + z2);
        result = Ax / result;
        const accel_angle_x = Math.atan(result);

        //Y Axis
        result = Math.sqrt(x2 + z2);
        result = Ay / result;
        const accel_angle_y = Math.atan(result);

        setSensorData(JSON.stringify({
            Gx: Gx,
            Gy: Gy,
            Gz: Gz,
            Ax: Ax,
            Ay: Ay,
            Az: Az
        }) + ` \t x: ${accel_angle_x}, y: ${accel_angle_y}, z: 0`);

        // Change cube rotation after receiving the readinds
        cube.rotation.x = accel_angle_y;
        cube.rotation.y = -accel_angle_x;
        cube.rotation.z = 0;
        // renderer.render(scene, camera);
    }

    /**
     * Attempts to connect to a Bluetooth device and subscribe to
     * battery level readings using the battery service.
     */
    const connectToDeviceAndSubscribeToUpdates = async () => {
        try {
            // Search for Bluetooth devices that advertise a battery service
            const device = await navigator.bluetooth
                .requestDevice({
                    filters: [{ services: [SERVICE_ID] },
                    { name: 'MotionSensor' },]
                    // acceptAllDevices: true
                });

            setIsDisconnected(false);

            // Add an event listener to detect when a device disconnects
            device.addEventListener('gattserverdisconnected', onDisconnected);

            // Try to connect to the remote GATT Server running on the Bluetooth device
            const server = await device.gatt.connect();

            // Get the battery service from the Bluetooth device
            const service = await server.getPrimaryService(SERVICE_ID);

            // Get the battery level characteristic from the Bluetooth device
            const characteristic = await service.getCharacteristic(SENSOR_ID);

            // Subscribe to battery level notifications
            characteristic.startNotifications();

            // When the battery level changes, call a function
            characteristic.addEventListener('characteristicvaluechanged',
                handleCharacteristicValueChanged);

        } catch (error) {
            console.log(`There was an error: ${error}`);
        }
    };

    return (
        <div className="App">
            <h1>Get Motion sensor Over Bluetooth</h1>
            {supportsBluetooth && !isDisconnected &&
            <p>Motion sensor Data: {sensorData}</p>
            }
            {supportsBluetooth && isDisconnected &&
            <button onClick={connectToDeviceAndSubscribeToUpdates}>Connect to a Bluetooth device</button>
            }
            {!supportsBluetooth &&
            <p>This browser doesn't support the Web Bluetooth API</p>
            }
            <CubeDemo/>
        </div>
    );
}
ReactDOM.render(
    <React.StrictMode>
        <App/>
    </React.StrictMode>,
    document.getElementById('root')
);


