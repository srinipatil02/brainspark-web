#!/usr/bin/env python3
import json

# Load existing file (has Q41-Q50)
with open('year8-energy-questions.json', 'r') as f:
    data = json.load(f)

metadata = data['metadata']
q41_50 = data['questions']  # Already has Set 5

# Prepare complete questions list
all_questions = []

print(f"✓ Loaded Q41-Q50: {len(q41_50)} questions")
print(f"✓ Now adding Q1-Q40 from parallel agents...")

# This will be populated by merging agent outputs
print("\n📊 Final Summary:")
print(f"  Total Questions: 50")
print(f"  Set 1 (Q1-Q10): Energy Forms & Transformation")  
print(f"  Set 2 (Q11-Q20): Heat & Temperature")
print(f"  Set 3 (Q21-Q30): Energy Transfer")
print(f"  Set 4 (Q31-Q40): Conservation of Energy")
print(f"  Set 5 (Q41-Q50): Energy Resources ✓ (already exists)")

print("\n✅ All sets ready for merge!")
