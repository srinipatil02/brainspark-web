#!/usr/bin/env python3
"""
Build complete Energy questions file with all 50 questions.
Combines outputs from 4 parallel agents + existing Q41-Q50.
"""
import json

# Read existing file to get metadata
with open('year8-energy-questions.json', 'r') as f:
    data = json.load(f)

metadata = data['metadata']
q41_50 = data['questions']  # Set 5

print("Building complete 50-question Energy file...")
print(f"✓ Metadata loaded")
print(f"✓ Q41-Q50 loaded ({len(q41_50)} questions)")

# I'll create the merge by directly copying the agent JSON outputs
# This is safer than parsing from the text

# For now, let's verify the structure is correct
output_file = {
    "metadata": metadata,
    "questions": []
}

# Add placeholder for Q1-Q40 (will be filled from agent outputs)
print("\n⚠️  Q1-Q40 need to be added from agent outputs")
print("    These are in the Task tool results above")

# Add Q41-Q50
output_file['questions'].extend(q41_50)

print(f"\nCurrent file has {len(output_file['questions'])} questions")
print("Need to add 40 more questions from Sets 1-4")

