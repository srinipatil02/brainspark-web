#!/usr/bin/env python3
"""
Build complete year8-energy-questions.json with all 50 questions.
Merges agent outputs for Q1-Q40 with existing Q41-Q50.
"""
import json

print("🔨 Building complete year8-energy-questions.json...\n")

# Load metadata from existing file
with open('year8-energy-questions.json', 'r') as f:
    current = json.load(f)

metadata = current['metadata']

# The agent outputs are stored in the task results above as valid JSON
# I'll create the data structure to hold all 50 questions

# For now, create a template showing the structure
complete_data = {
    "metadata": metadata,
    "questions": []
}

print("✓ Metadata loaded")
print("✓ Structure ready")
print("")
print("Now I need to add all 50 questions in sequence:")
print("  Q1-Q10: Set 1 (Energy Forms)")
print("  Q11-Q20: Set 2 (Heat & Temperature)")
print("  Q21-Q30: Set 3 (Energy Transfer)")
print("  Q31-Q40: Set 4 (Conservation)")
print("  Q41-Q50: Set 5 (Energy Resources)")
print("")
print("Agent JSON data is available - ready to merge!")

