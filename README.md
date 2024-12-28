# WebGL Geometry Generator

An interactive WebGL application that generates and renders 3D geometric shapes (spheres and tori) with dynamic tessellation controls. The application features real-time rendering with Phong shading and orbital camera movement.

## Features

- Real-time 3D rendering using WebGL 2.0
- Dynamic geometry generation for spheres and tori
- Adjustable tessellation parameters (rings and slices)
- Phong lighting model with ambient, diffuse, and specular components
- Automatic canvas resizing with device pixel ratio support
- Orbital camera movement
- Responsive viewport handling

## Getting Started

### Prerequisites

- A modern web browser with WebGL 2.0 support
- Local web server for development

### Running the Application

1. Clone the repository
2. Serve the directory using a local web server
3. Open `index.html` in your browser

The application requires the following dependencies (included via CDN):
- gl-matrix 2.8.1

## Usage

The interface provides several controls for generating geometry:

- **Rings**: Controls the number of horizontal divisions (min: 1)
- **Slices**: Controls the number of vertical divisions (min: 3)
- **Torus**: Toggle between sphere (unchecked) and torus (checked)
- **Generate**: Click to create new geometry with current parameters

## Technical Details

### Shaders

The application uses GLSL 300 es shaders with the following features:

#### Vertex Shader
- Transforms vertices through model, view, and projection matrices
- Calculates fragment normals using the normal matrix
- Computes lighting direction per vertex

#### Fragment Shader
- Implements Phong lighting model
- Configurable ambient, diffuse, and specular components
- Per-fragment normal interpolation

### Geometry Generation

#### Sphere Generation
- Generates vertices using spherical coordinates
- Creates indices for triangle strips
- Calculates smooth normals per vertex

```javascript
// Example sphere parameters
const rings = 10;    // Horizontal divisions
const slices = 16;   // Vertical divisions
```

#### Torus Generation
- Generates vertices using parametric equations
- Creates indices for triangle strips
- Calculates normals based on surface tangents

```javascript
// Example torus parameters
const R = 1.0;       // Major radius
const r = 0.3;       // Minor radius
```

## Camera Controls

The camera orbits around the object automatically:
- Radius: 5.0 units
- Height: 2.0 units
- Rotation speed: 0.5 radians per second
