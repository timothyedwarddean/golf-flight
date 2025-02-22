# Golf Shot Visualizer

## Overview

The **Golf Shot Visualizer** is a React-based 3D simulation tool designed to model golf ball trajectories based on **club face angle, club path angle, and swing speed**. Built using **React Three Fiber**, this project applies real-world physics principles, including **gravity and the Magnus effect**, to provide realistic shot visualizations.

This project is hosted at [golf-flight.com](https://golf-flight.com).

## Features

- **Real-time golf shot simulation** with 3D visualization.
- **User-controlled input parameters**:
  - Club Face Angle (°)
  - Club Path Angle (°)
  - Swing Speed (mph)
  - Launch Angle (°)
  - Pin Distance (yards)
- **Physics-based shot classification**, including fades, draws, hooks, and slices.
- **Magnus effect implementation** to simulate real-world ball spin and curvature.
- **3D rendering using React Three Fiber** with realistic ground, pin, and ball flight path.

## Installation & Setup

### Prerequisites

Ensure you have the following installed:

- **Node.js** (>=14.0.0)
- **npm** (or yarn)

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/golf-shot-visualizer.git
   cd golf-shot-visualizer
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
   *or*
   ```sh
   yarn install
   ```
3. Start the development server:
   ```sh
   npm start
   ```
   The application will be available at `http://localhost:3000/`.

## Usage

1. Adjust the shot parameters using the input fields.
2. Click **Hit Shot** to visualize the trajectory.
3. Observe the shot classification and distance results.
4. Modify parameters and iterate to analyze different shot outcomes.

## Code Breakdown

### Key Components

- **GolfShotVisualizer.js** – Main component handling shot calculation and visualization.
- **Ball.js** – Renders the moving golf ball with real-time physics updates.
- **Tracer.js** – Draws the shot trajectory as a red line in the 3D space.
- **PathFaceArrows.js** – Displays directional arrows for club path and face angles.

### Physics Calculations

- **Magnus Effect** is applied using a cross-product function to simulate side spin effects:
  ```js
  function cross(ax, ay, az, bx, by, bz) {
    return [
      ay * bz - az * by,
      az * bx - ax * bz,
      ax * by - ay * bx,
    ];
  }
  ```
- **Shot Classification** is determined based on face angle, path angle, and side spin RPM:
  ```js
  function getShotCategory(faceDeg, pathDeg, sideSpinRpm) {
    const diff = pathDeg - faceDeg;
    return diff > 0.5 ? "Draw" : diff < -0.5 ? "Fade" : "Straight";
  }
  ```

## Known Issues

- **Mobile UI Scaling**: Some elements may not display properly on smaller screens.
- **Shot Variability**: Additional refinements could improve real-world accuracy.

## Future Enhancements

- Add **wind effects** to further simulate real-world conditions.
- Implement **turf interaction** to model bounce and roll after landing.
- Introduce **club selection** for different loft and spin characteristics.
- Improve mobile responsiveness.

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository.
2. Create a new feature branch: `git checkout -b feature-name`.
3. Commit changes: `git commit -m "Add feature"`.
4. Push to your branch: `git push origin feature-name`.
5. Open a **pull request**.

## License

This project is licensed under the **MIT License**.

## Contact

For questions, suggestions, or bug reports, reach out via:

- **GitHub Issues**: Open an issue in this repository.
- **LinkedIn**: [Your LinkedIn Profile](https://linkedin.com/in/yourprofile)
- **Blog**: Read more at [itwasdns.io](https://itwasdns.io)

Happy coding and keep working on that perfect draw! 🏌️‍♂️

