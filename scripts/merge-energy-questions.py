#!/usr/bin/env python3
"""
Merge all Energy question sets into the complete file.
"""

import json

# Agent outputs (Q1-Q40)
set1_questions = [
  {
    "questionId": "nsw-y8-energy-001",
    "questionType": "multiple-choice",
    "stem": "A cricket ball is thrown upward. Which type of energy does it gain as it rises?",
    "options": [
      "Kinetic energy only",
      "Gravitational potential energy only",
      "Both kinetic and gravitational potential energy",
      "Chemical energy only"
    ],
    "correctAnswer": 1,
    "solution": "As the cricket ball rises, it gains gravitational potential energy (GPE) because it is moving higher above the ground. The formula GPE = mgh shows that energy increases with height (h). While the ball does have kinetic energy due to its motion, the question asks what energy it *gains* as it rises. As the ball goes up, it actually loses kinetic energy (slows down) while gaining gravitational potential energy. At the peak of its flight, all the kinetic energy has been converted to gravitational potential energy. The ball doesn't gain kinetic energy while rising - it gains GPE.",
    "difficulty": 1,
    "estimatedTime": 90,
    "curriculum": {
      "system": "NSW",
      "codes": ["ACSSU155"],
      "year": 8,
      "subject": "Science",
      "strand": "Physical Sciences"
    },
    "hints": [
      {
        "level": 1,
        "content": "Think about what happens to the ball's position relative to the ground as it moves upward.",
        "revealsCriticalInfo": False
      },
      {
        "level": 2,
        "content": "Energy related to an object's height above the ground is called gravitational potential energy.",
        "revealsCriticalInfo": True
      }
    ],
    "paperMetadata": {
      "setId": "year8-science-energy-medium",
      "sequenceInPaper": 1
    },
    "status": "active"
  },
  {
    "questionId": "nsw-y8-energy-002",
    "questionType": "short-answer",
    "stem": "List three different forms of energy present in a campfire.",
    "solution": "A campfire contains three main forms of energy: (1) Heat energy - the warmth you feel radiating from the flames, (2) Light energy - the visible glow and flames you can see, (3) Chemical energy - stored in the wood before it burns. When wood burns, chemical energy is converted into heat and light energy. You could also include sound energy (crackling sounds) as a fourth form. These energy transformations occur continuously during combustion, with the chemical bonds in the wood breaking and releasing stored energy as heat and light that spreads to the surroundings.",
    "difficulty": 1,
    "estimatedTime": 120,
    "curriculum": {
      "system": "NSW",
      "codes": ["ACSSU155"],
      "year": 8,
      "subject": "Science",
      "strand": "Physical Sciences"
    },
    "hints": [
      {
        "level": 1,
        "content": "Think about what you can feel, see, and hear from a fire.",
        "revealsCriticalInfo": False
      },
      {
        "level": 2,
        "content": "Consider the energy stored in wood before it burns, plus the energy released during burning.",
        "revealsCriticalInfo": True
      }
    ],
    "paperMetadata": {
      "setId": "year8-science-energy-medium",
      "sequenceInPaper": 2
    },
    "status": "active"
  },
  {
    "questionId": "nsw-y8-energy-003",
    "questionType": "multiple-choice",
    "stem": "A skateboard rolls down a hill. What energy transformation occurs?",
    "options": [
      "Kinetic energy → gravitational potential energy",
      "Gravitational potential energy → kinetic energy",
      "Chemical energy → kinetic energy",
      "Electrical energy → kinetic energy"
    ],
    "correctAnswer": 1,
    "solution": "The correct answer is gravitational potential energy → kinetic energy. At the top of the hill, the skateboard has maximum gravitational potential energy due to its height. As it rolls down, this stored potential energy is converted into kinetic energy (movement energy), making the skateboard speed up. The higher the hill, the more potential energy available to convert, and the faster the skateboard will be moving at the bottom. This is why skateboards (and bikes, cars, etc.) naturally accelerate when going downhill - gravity is converting their height-based potential energy into motion energy.",
    "difficulty": 1,
    "estimatedTime": 90,
    "curriculum": {
      "system": "NSW",
      "codes": ["ACSSU155"],
      "year": 8,
      "subject": "Science",
      "strand": "Physical Sciences"
    },
    "hints": [
      {
        "level": 1,
        "content": "What type of energy does the skateboard have at the top of the hill due to its height?",
        "revealsCriticalInfo": False
      },
      {
        "level": 2,
        "content": "As the skateboard rolls down and speeds up, height decreases and speed increases.",
        "revealsCriticalInfo": True
      }
    ],
    "paperMetadata": {
      "setId": "year8-science-energy-medium",
      "sequenceInPaper": 3
    },
    "status": "active"
  },
  {
    "questionId": "nsw-y8-energy-004",
    "questionType": "explanation",
    "stem": "Explain why a battery-powered torch gets warm when it is switched on.",
    "solution": "When a battery-powered torch is switched on, not all the chemical energy from the battery is converted into useful light energy. Some of the energy is 'lost' as heat energy due to resistance in the electrical circuits and the bulb or LED. This is why the torch feels warm to touch after being on for a while. The energy transformation sequence is: chemical energy (battery) → electrical energy (current flowing) → light energy + heat energy. No energy conversion is 100% efficient - there is always some energy converted to unwanted heat. This heat energy spreads into the torch casing and surroundings, making the torch warm.",
    "difficulty": 2,
    "estimatedTime": 150,
    "curriculum": {
      "system": "NSW",
      "codes": ["ACSSU155"],
      "year": 8,
      "subject": "Science",
      "strand": "Physical Sciences"
    },
    "hints": [
      {
        "level": 1,
        "content": "Think about the energy transformations happening inside the torch, starting from the battery.",
        "revealsCriticalInfo": False
      },
      {
        "level": 2,
        "content": "Not all energy is converted to light - some is 'wasted' as another form of energy.",
        "revealsCriticalInfo": True
      }
    ],
    "paperMetadata": {
      "setId": "year8-science-energy-medium",
      "sequenceInPaper": 4
    },
    "status": "active"
  },
  {
    "questionId": "nsw-y8-energy-005",
    "questionType": "short-answer",
    "stem": "A book with a mass of 2 kg sits on a shelf 3 metres above the ground. Calculate its gravitational potential energy. (Use g = 10 m/s²)",
    "solution": "Using the formula GPE = mgh:\n\nm = 2 kg (mass of book)\ng = 10 m/s² (acceleration due to gravity)\nh = 3 m (height above ground)\n\nGPE = 2 × 10 × 3 = 60 J\n\nThe book has 60 joules of gravitational potential energy. This energy is stored due to the book's position above the ground. If the book fell, this potential energy would be converted into kinetic energy. The higher the shelf or the heavier the book, the more potential energy would be stored. This is why objects falling from greater heights can cause more damage - they have more stored energy to release.",
    "difficulty": 2,
    "estimatedTime": 120,
    "curriculum": {
      "system": "NSW",
      "codes": ["ACSSU155"],
      "year": 8,
      "subject": "Science",
      "strand": "Physical Sciences"
    },
    "hints": [
      {
        "level": 1,
        "content": "Use the formula GPE = mgh, where m is mass, g is gravity, and h is height.",
        "revealsCriticalInfo": False
      },
      {
        "level": 2,
        "content": "Multiply the mass (2 kg) by gravity (10) by height (3 m). The answer will be in joules.",
        "revealsCriticalInfo": True
      }
    ],
    "paperMetadata": {
      "setId": "year8-science-energy-medium",
      "sequenceInPaper": 5
    },
    "status": "active"
  },
  {
    "questionId": "nsw-y8-energy-006",
    "questionType": "multiple-choice",
    "stem": "Which of the following is an example of chemical energy being converted to kinetic energy?",
    "options": [
      "A solar panel powering a light",
      "A person eating food then running",
      "A wind turbine generating electricity",
      "Water falling down a waterfall"
    ],
    "correctAnswer": 1,
    "solution": "The correct answer is 'A person eating food then running'. Food contains chemical energy stored in its molecules. When a person eats and digests food, this chemical energy is released through cellular respiration in the body. The energy is then used to power muscles, which contract to produce movement (kinetic energy). This energy transformation is: chemical energy (food) → chemical energy (glucose in cells) → kinetic energy (body movement). The other options involve different energy transformations: solar panels convert light to electrical energy, wind turbines convert kinetic to electrical energy, and waterfalls convert gravitational potential energy to kinetic energy.",
    "difficulty": 1,
    "estimatedTime": 90,
    "curriculum": {
      "system": "NSW",
      "codes": ["ACSSU155"],
      "year": 8,
      "subject": "Science",
      "strand": "Physical Sciences"
    },
    "hints": [
      {
        "level": 1,
        "content": "Chemical energy is stored in substances like food, fuel, and batteries.",
        "revealsCriticalInfo": False
      },
      {
        "level": 2,
        "content": "Think about which option involves a substance being broken down to produce movement.",
        "revealsCriticalInfo": True
      }
    ],
    "paperMetadata": {
      "setId": "year8-science-energy-medium",
      "sequenceInPaper": 6
    },
    "status": "active"
  },
  {
    "questionId": "nsw-y8-energy-007",
    "questionType": "explanation",
    "stem": "A solar panel on a roof converts sunlight into electricity. Describe the energy transformation and explain one reason why this process is not 100% efficient.",
    "solution": "The energy transformation in a solar panel is: light energy (from the Sun) → electrical energy. Solar panels contain photovoltaic cells that absorb photons of light and convert them into an electric current that can power devices or be stored in batteries.\n\nThis process is not 100% efficient for several reasons. One main reason is that some of the light energy is converted to heat energy instead of electricity, which is why solar panels get warm in the sun. Other light wavelengths may be reflected off the panel surface or pass through without being absorbed. Typical solar panels are only about 15-20% efficient, meaning most of the light energy is not converted to useful electrical energy.",
    "difficulty": 2,
    "estimatedTime": 150,
    "curriculum": {
      "system": "NSW",
      "codes": ["ACSSU155"],
      "year": 8,
      "subject": "Science",
      "strand": "Physical Sciences"
    },
    "hints": [
      {
        "level": 1,
        "content": "Start by identifying what form of energy goes into the panel and what form comes out.",
        "revealsCriticalInfo": False
      },
      {
        "level": 2,
        "content": "Think about unwanted energy forms produced during the conversion - what do you feel when you touch a solar panel in the sun?",
        "revealsCriticalInfo": True
      }
    ],
    "paperMetadata": {
      "setId": "year8-science-energy-medium",
      "sequenceInPaper": 7
    },
    "status": "active"
  },
  {
    "questionId": "nsw-y8-energy-008",
    "questionType": "multiple-choice",
    "stem": "A loudspeaker converts electrical energy into which form of energy?",
    "options": [
      "Light energy",
      "Sound energy",
      "Chemical energy",
      "Gravitational potential energy"
    ],
    "correctAnswer": 1,
    "solution": "A loudspeaker converts electrical energy into sound energy. When an electrical signal flows through the speaker's coil, it creates a magnetic field that causes the speaker cone to vibrate. These vibrations push and pull air molecules, creating sound waves that travel through the air to your ears. The energy transformation is: electrical energy → kinetic energy (vibrating cone) → sound energy (pressure waves in air). Like all energy conversions, this process also produces some unwanted heat energy, which is why speakers can get warm when playing loudly for extended periods.",
    "difficulty": 1,
    "estimatedTime": 90,
    "curriculum": {
      "system": "NSW",
      "codes": ["ACSSU155"],
      "year": 8,
      "subject": "Science",
      "strand": "Physical Sciences"
    },
    "hints": [
      {
        "level": 1,
        "content": "Think about what a loudspeaker produces that you can detect with your ears.",
        "revealsCriticalInfo": False
      },
      {
        "level": 2,
        "content": "Loudspeakers are designed to produce vibrations in the air that we hear as sound.",
        "revealsCriticalInfo": True
      }
    ],
    "paperMetadata": {
      "setId": "year8-science-energy-medium",
      "sequenceInPaper": 8
    },
    "status": "active"
  },
  {
    "questionId": "nsw-y8-energy-009",
    "questionType": "short-answer",
    "stem": "A tennis ball with mass 0.06 kg is moving at 10 m/s. Calculate its kinetic energy using KE = ½mv².",
    "solution": "Using the formula KE = ½mv²:\n\nm = 0.06 kg (mass of tennis ball)\nv = 10 m/s (velocity)\n\nKE = ½ × 0.06 × 10²\nKE = ½ × 0.06 × 100\nKE = 0.5 × 6\nKE = 3 J\n\nThe tennis ball has 3 joules of kinetic energy. This is the energy of motion - the faster the ball moves or the more massive it is, the more kinetic energy it has. Notice that velocity is squared in the formula, which means doubling the speed actually quadruples the kinetic energy. This is why faster-moving objects can cause much more damage in collisions.",
    "difficulty": 2,
    "estimatedTime": 120,
    "curriculum": {
      "system": "NSW",
      "codes": ["ACSSU155"],
      "year": 8,
      "subject": "Science",
      "strand": "Physical Sciences"
    },
    "hints": [
      {
        "level": 1,
        "content": "Use the formula KE = ½mv². Remember to square the velocity first before multiplying.",
        "revealsCriticalInfo": False
      },
      {
        "level": 2,
        "content": "Calculate: ½ × 0.06 × (10 × 10). Work through each step: square 10, then multiply by 0.06, then multiply by ½.",
        "revealsCriticalInfo": True
      }
    ],
    "paperMetadata": {
      "setId": "year8-science-energy-medium",
      "sequenceInPaper": 9
    },
    "status": "active"
  },
  {
    "questionId": "nsw-y8-energy-010",
    "questionType": "explanation",
    "stem": "A wind turbine generates electricity in a wind farm. Describe the complete energy transformation sequence from start to finish.",
    "solution": "The complete energy transformation sequence in a wind turbine is:\n\n1. Kinetic energy (moving air/wind) → kinetic energy (rotating turbine blades)\n2. Kinetic energy (rotating blades) → kinetic energy (spinning generator shaft)\n3. Kinetic energy (spinning shaft) → electrical energy (generator produces current)\n\nThe wind has kinetic energy due to the movement of air molecules. When wind hits the turbine blades, this kinetic energy is transferred to the blades, making them rotate. The rotating blades turn a shaft connected to a generator inside the turbine. The generator converts the rotational kinetic energy into electrical energy through electromagnetic induction. This electricity can then be transmitted through power lines to homes and businesses. Some energy is lost as heat due to friction in the moving parts.",
    "difficulty": 2,
    "estimatedTime": 180,
    "curriculum": {
      "system": "NSW",
      "codes": ["ACSSU155"],
      "year": 8,
      "subject": "Science",
      "strand": "Physical Sciences"
    },
    "hints": [
      {
        "level": 1,
        "content": "Start with the form of energy in moving wind, then think about what happens to the blades, then the generator.",
        "revealsCriticalInfo": False
      },
      {
        "level": 2,
        "content": "The sequence involves: wind movement → blade rotation → generator spinning → electricity production. Identify the energy type at each stage.",
        "revealsCriticalInfo": True
      }
    ],
    "paperMetadata": {
      "setId": "year8-science-energy-medium",
      "sequenceInPaper": 10
    },
    "status": "active"
  }
]

# Read existing file to get metadata and Q41-Q50
with open('/Users/srini/code/brainspark-web/scripts/year8-energy-questions.json', 'r') as f:
    existing_data = json.load(f)

# Collect all questions from agent outputs (these are already parsed from the JSON strings)
# I'll manually add the parsed questions from all 4 agents

print("Merging questions from all sets...")
print(f"Set 1 (Q1-Q10): {len(set1_questions)} questions")
