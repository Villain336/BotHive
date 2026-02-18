# Aerospace — Expert Knowledge Base

## What Is Aerospace?

Aerospace encompasses both aeronautics (flight within Earth's atmosphere) and astronautics (flight beyond Earth's atmosphere). It covers the design, development, testing, production, and operation of vehicles and systems that operate in Earth's atmosphere and in outer space.

---

## The Space Environment

### The Atmosphere's Layers
| Layer | Altitude | Key Characteristics |
|-------|---------|-------------------|
| Troposphere | 0–12 km | Weather; 75% of atmospheric mass |
| Stratosphere | 12–50 km | Ozone layer; stable; supersonic aircraft |
| Mesosphere | 50–85 km | Meteors burn up; very cold |
| Thermosphere | 85–600 km | ISS orbit; extreme temperatures (1,500°C but very low density) |
| Exosphere | 600–10,000 km | Gradual transition to space |

### The Karman Line
- 100 km (62 miles) — internationally recognized boundary of space (FAI)
- NASA uses 50 miles (80 km) for some purposes (US Air Force astronaut wings)

### The Space Environment Challenges
- **Vacuum**: No atmospheric pressure; requires pressurized spacecraft
- **Temperature extremes**: Sunlit side vs. shadow side differentials of ±250°C
- **Radiation**: Solar radiation, cosmic rays, Van Allen radiation belts damage electronics and DNA
- **Microgravity**: Fluid redistribution, muscle atrophy, bone density loss in humans
- **Orbital debris**: >27,000 tracked objects; millions of smaller untracked fragments
- **Micrometeorites**: High-velocity impacts; shielding required

---

## Orbital Mechanics

### Kepler's Laws
1. Planets (and spacecraft) travel in elliptical orbits with the body they orbit at one focus
2. A line joining a planet to the Sun sweeps equal areas in equal times (faster when closer)
3. The square of the orbital period is proportional to the cube of the semi-major axis: T² ∝ a³

### Orbital Parameters
- **Semi-major axis**: Defines orbital energy and period
- **Eccentricity**: 0 = circular; 0–1 = elliptical; 1 = parabolic escape; >1 = hyperbolic
- **Inclination**: Angle between orbital plane and Earth's equatorial plane
- **RAAN**: Right Ascension of Ascending Node — orbital orientation in space
- **Argument of perigee**: Angle of perigee within orbit plane

### Common Orbit Types
| Orbit | Altitude | Period | Use |
|-------|---------|--------|-----|
| LEO (Low Earth Orbit) | 200–2,000 km | 90–127 min | ISS, Hubble, Starlink, reconnaissance |
| MEO (Medium Earth Orbit) | 2,000–35,786 km | 2–24 hrs | GPS, navigation satellites |
| GEO (Geostationary) | 35,786 km | 24 hrs | Communications, weather satellites |
| HEO (Highly Elliptical) | Varies | Varies | Molniya orbit (high lat coverage) |
| Lunar orbit | ~384,400 km avg | 28 days | Lunar missions |

### The Vis-Viva Equation
```
v² = GM(2/r - 1/a)
```
Velocity at any point in an orbit given orbital energy. For circular orbit: v = √(GM/r)

### Orbital Velocity
- LEO: ~7.8 km/s (~17,500 mph)
- GEO: ~3.1 km/s (~6,900 mph)
- Lunar: ~1.0 km/s (~2,300 mph)
- Escape velocity from Earth's surface: ~11.2 km/s

### Hohmann Transfer
- Most fuel-efficient way to transfer between two circular orbits
- Two engine burns: first raises apogee to target orbit; second circularizes at target
- Delta-V required = change in orbital velocity

---

## Rocket Propulsion

### The Rocket Equation (Tsiolkovsky)
```
Δv = Isp × g₀ × ln(m₀/mf)
```
- Δv: change in velocity
- Isp: specific impulse (measure of fuel efficiency; seconds)
- m₀: initial mass (with propellant)
- mf: final mass (empty)
- ln: natural logarithm

**Key insight**: Mass ratio is exponential. Doubling Δv requires squaring the mass ratio.

### Specific Impulse (Isp)
The measure of rocket engine efficiency — thrust per unit of propellant mass flow:

| Propellant | Isp (vacuum) |
|-----------|-------------|
| Solid propellant | 260–300 s |
| Liquid O₂ / Kerosene (Merlin) | ~311 s |
| Liquid O₂ / LH₂ (Space Shuttle Main Engine) | ~453 s |
| Liquid O₂ / Methane (Raptor) | ~380 s |
| Hydrazine (monopropellant) | ~220 s |
| Ion thruster (Hall effect) | 1,500–10,000 s |
| Nuclear thermal (theoretical) | 800–1,000 s |

### Rocket Engine Types

**Liquid Propellant Engines**
- Separate oxidizer and fuel tanks; pumped into combustion chamber
- Throttleable; restartable; high Isp
- Examples: SpaceX Merlin (Falcon 9), Raptor (Starship), RS-25 (SLS)
- Major components: turbopumps, combustion chamber, nozzle, injectors

**Solid Propellant Engines**
- Propellant pre-mixed and cast into case; ignited and burns to depletion
- Simple; storable; reliable; not throttleable; not restartable
- Examples: Space Shuttle SRBs, Minuteman III ICBM, Ares I
- Used for boosters and military missiles

**Hybrid Engines**
- Solid fuel + liquid oxidizer; safer than liquids; simpler than full liquid
- SpaceShipOne/Two (Virgin Galactic) uses HTPB fuel + N₂O oxidizer
- Lower Isp than liquid; combustion instability challenges

**Ion Thrusters**
- Ionize propellant (xenon, argon); accelerate ions with electric field
- Extremely high Isp; very low thrust; must operate for months/years
- Used for: Dawn asteroid mission, Hayabusa, Boeing 702 GEO satellites
- Hall effect thrusters: used on Starlink satellites, commercial GEO satellites

**Nuclear Propulsion (Future)**
- Nuclear thermal: reactor heats propellant; 2x Isp of best chemical
- Nuclear pulse (Orion): nuclear bombs as propellant; not developed
- Project NERVA (1960s): demonstrated nuclear thermal rocket; canceled 1972
- NASA/DARPA DRACO program: developing nuclear thermal for lunar/Mars missions

---

## Launch Vehicles

### Expendable vs. Reusable
- **Expendable**: One-time use; less development cost; higher per-launch cost
- **Reusable**: Recover and refly hardware; higher development cost; dramatically lower marginal cost
- SpaceX Falcon 9: First orbital-class first stage reuse (2015); now routinely reflies boosters 10–20+ times
- SpaceX Starship: Fully reusable orbital vehicle; both stages recovered

### Major Launch Vehicles

| Vehicle | Operator | Payload to LEO | Status |
|---------|---------|---------------|--------|
| Falcon 9 | SpaceX | 22,800 kg | Operational (workhorse) |
| Falcon Heavy | SpaceX | 63,800 kg | Operational |
| Starship | SpaceX | 100,000+ kg (target) | Development/testing |
| Atlas V | ULA | 8,900–18,500 kg | Retiring |
| Vulcan Centaur | ULA | 27,200 kg | Operational (2024) |
| New Glenn | Blue Origin | 45,000 kg | First launch 2024 |
| SLS (Space Launch System) | NASA | 95,000–130,000 kg | Operational (Artemis) |
| Ariane 6 | ESA/ArianeGroup | 10,350–21,650 kg | Operational (2024) |
| Long March 5 | CASC (China) | 25,000 kg | Operational |
| H3 | JAXA (Japan) | 6,500 kg | Operational (2024) |

---

## Spacecraft Systems

### Attitude Determination and Control (ADCS)
- **Sensors**: Star trackers, sun sensors, magnetometers, IMUs
- **Actuators**:
  - Reaction wheels (momentum wheels): Apply torque by spinning/de-spinning
  - Magnetorquers: Interact with Earth's magnetic field (low power but slow)
  - Thrusters: Fast; uses propellant
  - Control moment gyroscopes (CMGs): Used on large vehicles (ISS)

### Power Systems
- **Solar arrays**: Photovoltaic conversion; most common for near-Earth missions
- **Batteries**: Store energy during eclipse periods
- **Radioisotope Thermoelectric Generators (RTGs)**: Decay heat → electricity; used for deep space (Voyager, New Horizons, Curiosity)
- **Nuclear reactors**: Kilopower project; power for lunar/Mars surface operations

### Thermal Control
- Radiation is only heat transfer mechanism in vacuum
- **Passive**: Coatings (high emissivity/low absorptivity), multi-layer insulation (MLI), radiators
- **Active**: Heat pipes, heaters, variable conductance heat pipes, fluid loops

### Communications
- S-band: LEO satellites, ISS communications
- X-band: Deep space network, military
- Ka-band: High throughput broadband (Starlink, HughesNet)
- Optical/Laser: Extremely high bandwidth; LCRD (Laser Communications Relay Demonstration)
- Deep Space Network (DSN): NASA's global network of large dishes; 3 sites (Goldstone CA, Madrid Spain, Canberra Australia)

---

## Human Spaceflight

### Physiological Effects of Spaceflight
- **Bone density loss**: 1–2% per month; critical for long missions
- **Muscle atrophy**: Without resistance exercise, rapid deterioration
- **Fluid redistribution**: "Puffy face and bird legs" syndrome; intracranial pressure increase
- **Vision changes**: Intracranial pressure → optic disc edema → visual acuity changes
- **Radiation exposure**: ISS astronauts receive dose equivalent to 10 chest X-rays per day
- **Immune suppression**: Reduced immune response; latent viruses can reactivate

### Life Support Systems (LSS)
- **Atmosphere**: O₂/N₂ mix at ~14.7 psi; CO₂ removal (LiOH or molecular sieve)
- **Water**: ISS recycles 93% of water (urine, sweat, condensation)
- **Waste management**: Solid waste collected; returned to Earth or burned on reentry (via waste spacecraft)
- **Temperature**: Thermal control system maintains 65–80°F cabin temperature

### International Space Station (ISS)
- Continuous human presence since November 2000
- 420 km altitude; inclined 51.6°; orbits Earth 16 times per day
- Size: ~109 meters wide; 1 million lb mass
- Crew: Typically 6–7; mix of NASA, Roscosmos, ESA, JAXA, CSA
- Operations: Science experiments, technology demonstration, Earth observation
- Deorbit planned: ~2030

### Artemis Program (Return to the Moon)
- NASA's program to land humans on the Moon by mid-2020s (Artemis 3)
- Vehicles: SLS rocket, Orion capsule, SpaceX Starship Human Landing System (HLS)
- Lunar Gateway: Orbital space station around the Moon (international partnership)
- Long-term: Sustainable lunar presence; preparation for Mars

### Mars Mission Considerations
- Travel time: ~6–9 months each way; 18-month surface stay or fast opposition class
- Radiation: No Earth magnetic field protection; estimated 600 mSv round trip (1.5x cancer risk)
- Gravity: 0.38g (intermediate between Earth and Moon)
- Atmosphere: 1% of Earth; mostly CO₂; insufficient for humans; useful for ISRU
- ISRU (In-Situ Resource Utilization): Making propellant (CH₄ + O₂) from Martian CO₂ and water ice

---

## Commercial Space

### New Space Revolution
- SpaceX disrupted launch costs: Falcon 9 ~$2,700/kg to LEO (vs. $54,000/kg Shuttle era)
- Reusability is the key cost driver
- Commercial crew: NASA pays SpaceX and Boeing to transport astronauts to ISS

### Satellite Megaconstellations
- SpaceX Starlink: 5,000+ satellites operational; targeting 12,000–42,000
- Amazon Kuiper: 3,236 satellites planned
- OneWeb: 648 satellites
- Provide global broadband internet; latency ~20-40ms (better than GEO at 600ms)
- Concerns: astronomical light pollution, orbital congestion

### Space Economy Sectors
- Launch services: $10B+ annually
- Satellite communications: $150B+ annually
- Earth observation: Growing rapidly (Planet, Maxar, Airbus)
- Space tourism: Virgin Galactic (suborbital), Blue Origin (suborbital), Axiom Space (orbital)
- In-space manufacturing: Pharmaceuticals, fiber optics, semiconductors in microgravity
- Lunar resources: Helium-3, rare earth elements, water ice (propellant)
- Asteroid mining: Long-term; trillions of $ in mineral resources

---

## Key Books and Resources

- *The Martian* — Andy Weir (accurate Mars survival)
- *Carrying the Fire* — Michael Collins (Apollo 11)
- *An Astronaut's Guide to Life on Earth* — Chris Hadfield
- *Ignition!* — John D. Clark (liquid propellant history; free PDF)
- *Fundamentals of Astrodynamics* — Bate, Mueller, White (free PDF; classic textbook)
- *Introduction to Space Dynamics* — William Thomson
- NASA Technical Reports Server (ntrs.nasa.gov) — free access to NASA research
- SpaceX updates (spacex.com) — current launch capabilities
- Gunter's Space Page (space.skyrocket.de) — comprehensive spacecraft database
