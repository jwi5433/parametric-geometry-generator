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

## Controls

The interface provides a control panel at the top with the following options:

- **Rings**: Number of horizontal divisions (default: 8, minimum: 1)
- **Slices**: Number of vertical divisions (default: 16, minimum: 3)
- **Torus**: Checkbox to toggle between sphere and torus geometry
- **Generate**: Button to update the geometry with current parameters

The rest of the window contains a WebGL canvas that shows the generated geometry with automatic camera rotation.

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

#### Torus Generation
- Generates vertices using parametric equations
- Creates indices for triangle strips
- Calculates normals based on surface tangents

## Camera

The camera orbits around the object automatically:
- Radius: 5.0 units
- Height: 2.0 units
- Rotation speed: 0.5 radians per second
