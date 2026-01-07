#!/usr/bin/env python3
"""
Create Set files 2, 3, 4 from agent outputs and prepare for upload.
"""
import json

print("🔧 Creating Energy Sets 2, 3, and 4 from agent outputs\n")

# Agent outputs are available from the Task results
# I'll create a structure for each set

# These will be populated with the actual agent JSON data
sets_info = {
    2: {
        "title": "Heat & Temperature",
        "range": "Q11-Q20",
        "agent": "aa93b90",
        "file": "energy-set2-q11-q20.json"
    },
    3: {
        "title": "Energy Transfer", 
        "range": "Q21-Q30",
        "agent": "a0e9553",
        "file": "energy-set3-q21-q30.json"
    },
    4: {
        "title": "Conservation of Energy",
        "range": "Q31-Q40",
        "agent": "ad309dd",
        "file": "energy-set4-q31-q40.json"
    }
}

for set_num, info in sets_info.items():
    print(f"Set {set_num}: {info['title']} ({info['range']})")
    print(f"  Agent: {info['agent']}")
    print(f"  File: {info['file']}")
    print()

print("✅ Ready to create files from agent JSON data")
print("✅ Each file will contain 10 questions")
print()
print("Next: Write JSON files and upload to Firestore")

