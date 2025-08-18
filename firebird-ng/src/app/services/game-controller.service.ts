import { Injectable } from '@angular/core';
import * as THREE from "three";
import {BehaviorSubject, Observable, Subject} from "rxjs";
import {ThreeService} from "./three.service";


export enum GamepadButtonIndexes {
  ButtonA = 0,
  ButtonB = 1,
  ButtonX = 2,
  ButtonY = 3,
  ButtonLB = 4,
  ButtonRB = 5,
  ButtonLT = 6,
  ButtonRT = 7,
  Select = 8,
  Start = 9,
}

export class GamepadObservableButton {
  private onPressSubject = new Subject<boolean>();
  public onPress = this.onPressSubject.asObservable();
  public state: GamepadButton = {pressed: false, touched: false, value: 0};

  constructor(public index: GamepadButtonIndexes) {
  }

  updateState(newState: GamepadButton) {
    if(this.onPressSubject.observed) {
      if(newState.pressed != this.state.pressed) {
        this.onPressSubject.next(newState.pressed);
      }
    }
    this.state = newState;
  }

  updateFromGamepadState(gamepad: Gamepad) {
    this.updateState(gamepad.buttons[this.index]);
  }
}

@Injectable({
  providedIn: 'root'
})
export class GameControllerService {

  private xAxisSubject = new BehaviorSubject<number>(0);
  public xAxisChanged = this.xAxisSubject.asObservable();
  public xAxis = 0;

  private yAxisSubject = new BehaviorSubject<number>(0);
  private yAxisChanged = this.yAxisSubject.asObservable();
  public yAxis: number = 0;
  public buttons: GamepadButton[] = [];
  public prevButtons: GamepadButton[] = [];


  public buttonA: GamepadObservableButton = new GamepadObservableButton(GamepadButtonIndexes.ButtonA);
  public buttonB: GamepadObservableButton = new GamepadObservableButton(GamepadButtonIndexes.ButtonB);
  public buttonX: GamepadObservableButton = new GamepadObservableButton(GamepadButtonIndexes.ButtonX);
  public buttonY: GamepadObservableButton = new GamepadObservableButton(GamepadButtonIndexes.ButtonY);
  public buttonLB: GamepadObservableButton = new GamepadObservableButton(GamepadButtonIndexes.ButtonLB);
  public buttonRB: GamepadObservableButton = new GamepadObservableButton(GamepadButtonIndexes.ButtonRB);
  public buttonLT: GamepadObservableButton = new GamepadObservableButton(GamepadButtonIndexes.ButtonLT);
  public buttonRT: GamepadObservableButton = new GamepadObservableButton(GamepadButtonIndexes.ButtonRT);
  public buttonStart: GamepadObservableButton = new GamepadObservableButton(GamepadButtonIndexes.Start);
  public buttonSelect: GamepadObservableButton = new GamepadObservableButton(GamepadButtonIndexes.Select);

  public activeGamepad: Gamepad|null = null;

  animationLoopHandler () {

    const epsilon = 0.01;
    const gamepads = navigator.getGamepads();
    for (const gamepad of gamepads) {
      if (gamepad) {

        this.activeGamepad = gamepad;
        // Example: Using left joystick to control OrbitControls
        // Axis 0: Left joystick horizontal (left/right)
        // Axis 1: Left joystick vertical (up/down)
        this.xAxis = gamepad.axes[0];
        this.yAxis = gamepad.axes[1];

        if(Math.abs(this.xAxis - this.xAxisSubject.value) > epsilon) {
          this.xAxisSubject.next(this.xAxis);
        }

        if(Math.abs(this.yAxis - this.yAxisSubject.value) > epsilon) {
          this.yAxisSubject.next(this.yAxis);
        }

        const xAxis = gamepad.axes[0];
        const yAxis = gamepad.axes[1];

        if (Math.abs(xAxis) > 0.1 || Math.abs(yAxis) > 0.1) {
          this.rotateCamera(xAxis, yAxis);
        }

        // Zooming using buttons
        const zoomInButton = gamepad.buttons[2];
        const zoomOutButton = gamepad.buttons[0];

        if (zoomInButton.pressed) {
          this.zoom(0.99);
        }

        if (zoomOutButton.pressed) {
          this.zoom(1.01);
        }

        this.buttonSelect.updateFromGamepadState(gamepad);
        this.buttonStart.updateFromGamepadState(gamepad);

        this.buttonA.updateFromGamepadState(gamepad);
        this.buttonB.updateFromGamepadState(gamepad);
        this.buttonY.updateFromGamepadState(gamepad);
        this.buttonX.updateFromGamepadState(gamepad);

        this.buttonLB.updateFromGamepadState(gamepad);
        this.buttonRB.updateFromGamepadState(gamepad);
        this.buttonLT.updateFromGamepadState(gamepad);
        this.buttonRT.updateFromGamepadState(gamepad);

        break; // Only use the first connected gamepad
      }
    }
  };


  rotateCamera(xAxisChange: number, yAxisChange: number) {
    let orbitControls = this.three.controls;
    let camera = this.three.camera;

    const offset = new THREE.Vector3(); // Offset of the camera from the target
    const quat = new THREE.Quaternion().setFromUnitVectors(camera.up, new THREE.Vector3(0, 1, 0));
    const quatInverse = quat.clone().invert();

    const currentPosition = camera.position.clone().sub(orbitControls.target);
    currentPosition.applyQuaternion(quat); // Apply the quaternion

    // Spherical coordinates
    const spherical = new THREE.Spherical().setFromVector3(currentPosition);

    // Adjusting spherical coordinates
    spherical.theta -= xAxisChange * 0.023; // Azimuth angle change
    spherical.phi += yAxisChange * 0.023; // Polar angle change, for rotating up/down

    // Ensure phi is within bounds to avoid flipping
    spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

    // Convert back to Cartesian coordinates
    const newPostion = new THREE.Vector3().setFromSpherical(spherical);
    newPostion.applyQuaternion(quatInverse);

    camera.position.copy(newPostion.add(orbitControls.target));
    camera.lookAt(orbitControls.target);
    orbitControls.update();
  }

  zoom(factor: number) {
    let orbitControls = this.three.controls;
    let camera = this.three.camera;
    orbitControls.object.position.subVectors(camera.position, orbitControls.target).multiplyScalar(factor).add(orbitControls.target);
    orbitControls.update();
  }

  constructor(
    private three: ThreeService

  ) {
    // Run it on contruction so if we have an active controller we set up values

    this.three.addFrameCallback(()=>{this.animationLoopHandler();});
    this.xAxisChanged.subscribe((data)=>{
      console.log(`[joystick] x: ${data}`);
    });
    this.yAxisChanged.subscribe((data)=>{
      console.log(`[joystick] y: ${data}`);
    });

  }
}
