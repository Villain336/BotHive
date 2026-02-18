# Robotics — Expert Knowledge Base

## What Is Robotics?

Robotics is the interdisciplinary field combining mechanical engineering, electrical engineering, computer science, and artificial intelligence to design, build, and operate machines (robots) that can autonomously or semi-autonomously perform tasks. Robots sense their environment, process information, and act on the physical world.

---

## The Anatomy of a Robot

### Sensing (Perception)
Robots perceive the world through sensors:

| Sensor Type | What It Measures | Examples |
|------------|-----------------|---------|
| Camera (RGB) | Visual images | Industrial inspection, navigation |
| Depth camera (RGBD) | 3D point clouds | Intel RealSense, Microsoft Kinect |
| LiDAR | 3D laser point clouds | Autonomous vehicles, mapping |
| Ultrasonic | Distance (sonar) | Obstacle avoidance, parking sensors |
| IMU (Inertial Measurement Unit) | Acceleration, rotation | Drone stabilization, dead reckoning |
| Encoder | Joint/wheel position | Precise motor control |
| Force/Torque | Contact forces | Safe human-robot interaction |
| Microphone | Sound | Voice control, acoustic sensing |
| GPS | Global position | Outdoor navigation |

### Processing (Brain)
- Embedded microcontrollers: Arduino, STM32 (low-level motor control)
- Single-board computers: Raspberry Pi, Jetson Nano (mid-level processing)
- Industrial PCs / Edge AI computers (high-level compute)
- Neural processing units (NPUs): Dedicated AI inference hardware

### Actuation (Movement)
- **DC Motors**: Simple, cheap, high speed, variable control with PWM
- **Stepper motors**: Precise positioning without feedback; open-loop
- **Servo motors**: DC motor + gearbox + position encoder; closed-loop
- **Linear actuators**: Convert rotational to linear motion
- **Hydraulic actuators**: Very high force; used in heavy machinery and humanoid legs
- **Pneumatic actuators**: Air-pressure driven; soft robotics
- **Soft actuators**: Flexible, compliant; safe for human interaction

---

## Robot Types

### Industrial Robots
- **Articulated arm** (6-DOF): Most common; welding, assembly, painting
- **SCARA**: Fast, precise horizontal movement; electronics assembly
- **Delta robot**: Three-arm parallel design; extremely fast pick-and-place
- **Gantry/Cartesian**: XYZ linear motion; CNC machines, 3D printers
- **Collaborative robots (Cobots)**: Designed to work safely alongside humans; force-limited; Universal Robots, Fanuc CRX

### Mobile Robots
- **Wheeled robots**: Differential drive (two wheels), holonomic (Mecanum wheels)
- **Legged robots**: Boston Dynamics Spot, Atlas; more versatile terrain traversal
- **Tracked robots**: Snake-like; good for rough terrain, stairs
- **Autonomous Guided Vehicles (AGVs)**: Follow fixed paths; warehouse logistics
- **Autonomous Mobile Robots (AMRs)**: Navigate dynamically without fixed paths; Amazon Kiva

### Aerial Robots (Drones / UAVs)
- **Multirotor**: Quad, hexa, octocopter; vertical takeoff; most common
- **Fixed-wing**: Efficient long-range flight; GPS-guided
- **Hybrid VTOL**: Vertical takeoff + fixed-wing efficiency; military and logistics use

### Underwater Robots
- **ROV (Remotely Operated Vehicle)**: Tethered; used for inspection, salvage, oceanography
- **AUV (Autonomous Underwater Vehicle)**: Untethered; pre-programmed missions; ocean survey

### Humanoid Robots
- Tesla Optimus, Boston Dynamics Atlas, Figure 01, Agility Robotics Digit
- Designed for unstructured human environments (stairs, narrow spaces, varied tasks)
- Primary challenge: locomotion stability + dexterous manipulation
- Applications: manufacturing, dangerous tasks, eventually general purpose

### Medical Robots
- **Da Vinci Surgical System**: Teleoperated laparoscopic surgery; sub-millimeter precision
- **Rehabilitation robots**: Exoskeletons for physical therapy (Ekso, ReWalk)
- **Pharmacy robots**: Automated dispensing
- **Nanobots**: Theoretical; targeted drug delivery, diagnostics at cellular level

---

## Robotics Software

### Robot Operating System (ROS / ROS2)
- Open-source middleware; the standard framework for robot software development
- Provides: messaging (topics, services, actions), hardware abstraction, tools (Rviz, Gazebo)
- ROS2: rebuilt for real-time, safety-critical applications; DDS communication layer
- Widely used in research and increasingly in industry

### SLAM (Simultaneous Localization and Mapping)
- Robot builds a map of unknown environment while tracking its own position within it
- Key algorithms: GMapping, Cartographer (Google), RTAB-Map, ORB-SLAM
- Sensor inputs: LiDAR (2D or 3D), camera (visual SLAM), IMU

### Path Planning
- **A\* algorithm**: Optimal path on a discrete grid; widely used
- **RRT (Rapidly-exploring Random Trees)**: Probabilistic; good for high-dimensional spaces
- **Dijkstra's algorithm**: Guaranteed optimal; slower than A\*
- **Potential field methods**: Simple reactive navigation; local minima problem
- **DWA (Dynamic Window Approach)**: Real-time obstacle avoidance for mobile robots

### Motion Control
- **PID Controller**: Proportional-Integral-Derivative; foundational feedback control
- **Model Predictive Control (MPC)**: Optimizes over a time horizon; used in robotics and drones
- **Inverse Kinematics (IK)**: Given desired end-effector position, calculate joint angles
- **Force Control**: Control contact forces rather than position; essential for assembly tasks

### Computer Vision for Robotics
- **Object detection**: YOLO, Faster R-CNN; identify and locate objects
- **Semantic segmentation**: Pixel-level classification; understand scene content
- **Pose estimation**: Determine 3D position/orientation of objects
- **Optical flow**: Estimate motion from image sequences

---

## Robot Learning

### Reinforcement Learning (RL) in Robotics
- Robot learns through trial and error; rewards good actions
- **Sim-to-real transfer**: Train in simulation; deploy on physical robot
- Challenges: sample efficiency, safety during exploration, sim-to-real gap
- OpenAI Dactyl: RL-trained robotic hand that solved Rubik's cube

### Imitation Learning / Learning from Demonstration
- Robot learns by observing human demonstrations
- **Behavioral cloning**: Supervised learning from demonstration data
- **Inverse Reinforcement Learning (IRL)**: Infer reward function from demonstrations
- Toyota Research Institute, DeepMind, and Boston Dynamics use this heavily

### Foundation Models for Robotics
- **RT-2 (Google)**: Vision-language model controlling robot actions
- **CLIP + robot**: Language-grounded manipulation ("pick up the red cup")
- Large language models (LLMs) as robot planners: high-level task decomposition

---

## Kinematics and Dynamics

### Forward Kinematics
- Given joint angles → calculate end-effector position
- Denavit-Hartenberg (DH) parameters: standardized representation of robot geometry

### Inverse Kinematics
- Given desired end-effector position → calculate required joint angles
- Analytically solved for simple robots; numerical methods for complex ones
- Singularities: configurations where robot loses degrees of freedom

### Degrees of Freedom (DOF)
- The number of independent parameters that define position/configuration
- 6-DOF arm: reach any position and orientation in workspace
- Redundant robots (7-DOF): additional DOF enables obstacle avoidance while maintaining end-effector pose

---

## State of the Industry

### Market Size
- Global robotics market: ~$55B (2023) → projected $165B+ by 2030
- Industrial robots: largest segment; automotive + electronics dominate
- Service robots: fastest growing; logistics, healthcare, consumer

### Key Companies
| Company | Focus | Notable Products |
|---------|-------|----------------|
| Boston Dynamics | Legged, humanoid | Spot, Atlas, Stretch |
| iRobot (Amazon) | Consumer | Roomba |
| Universal Robots | Cobots | UR3, UR5, UR10 |
| FANUC | Industrial | Wide range of arm robots |
| ABB | Industrial + collaborative | YuMi, IRB series |
| Figure AI | Humanoid | Figure 01 |
| Agility Robotics | Humanoid | Digit (Amazon deployment) |
| DJI | Drones | Phantom, Mavic, agricultural drones |
| Intuitive Surgical | Medical | Da Vinci |
| Mobileye / Waymo | Autonomous vehicles | AV systems |

### Autonomous Vehicles (A Special Robot Category)
- **SAE Levels 0–5**: 0 = no automation; 5 = full self-driving (no driver needed)
- Current state: Level 2–3 commercially available; Level 4 in limited deployments (Waymo, Cruise)
- Key technologies: LiDAR, radar, cameras, HD maps, AI decision-making
- Primary challenge: Long-tail edge cases; robustness in all conditions

---

## Ethical and Safety Considerations

### Robot Safety Standards
- ISO 10218: Industrial robot safety
- ISO/TS 15066: Collaborative robot safety
- Power-and-force limiting: Cobots stop or reduce force on human contact

### Ethical Considerations
- Autonomous weapons: Lethal autonomous weapons systems (LAWS) — UN discussion on banning
- Job displacement: Manufacturing, logistics, service jobs at risk
- Surveillance: Drone and robot-based surveillance concerns
- Accountability: Who is responsible when a robot causes harm?
- Asimov's Laws (science fiction, not engineering): "A robot may not injure a human being..."

---

## Key Books and Resources

- *Probabilistic Robotics* — Thrun, Burgard, Fox (SLAM and probabilistic methods)
- *Modern Robotics* — Lynch & Park (free online; comprehensive)
- *Introduction to Robotics* — John J. Craig (kinematics and dynamics)
- *Robotics: Modelling, Planning and Control* — Siciliano et al.
- ROS documentation (docs.ros.org)
- OpenAI Robotics research papers
- Boston Dynamics blog (bostondynamics.com)
