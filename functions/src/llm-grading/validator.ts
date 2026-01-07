// JSON Schema Validation for LLM Responses
// Based on COMBINED_LLM_GRADING_SPEC_v0_DEEPSEEK.md

import Ajv, { JSONSchemaType } from "ajv";
import addFormats from "ajv-formats";
import { GradeJSON, GradeJsonSchema } from "./types";

// Initialize Ajv with formats
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

// Compile the schema
const validateGradeJsonSchema = ajv.compile(GradeJsonSchema as JSONSchemaType<GradeJSON>);

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  data?: GradeJSON;
  errors?: string;
}

/**
 * Validates LLM response against the grade JSON schema
 */
export function validateGradeJson(data: any): ValidationResult {
  try {
    const isValid = validateGradeJsonSchema(data);
    
    if (isValid) {
      // Additional semantic validation
      const semanticErrors = performSemanticValidation(data);
      if (semanticErrors.length > 0) {
        return {
          isValid: false,
          errors: `Semantic validation errors: ${semanticErrors.join(", ")}`
        };
      }
      
      return {
        isValid: true,
        data: data as GradeJSON
      };
    } else {
      const errorMessages = validateGradeJsonSchema.errors?.map(err => 
        `${err.instancePath} ${err.message}`
      ).join("; ") || "Unknown validation error";
      
      return {
        isValid: false,
        errors: errorMessages
      };
    }
  } catch (error) {
    return {
      isValid: false,
      errors: `Validation exception: ${error}`
    };
  }
}

/**
 * Performs additional semantic validation beyond schema structure
 */
function performSemanticValidation(data: GradeJSON): string[] {
  const errors: string[] = [];

  // Validate overall object
  if (data.overall.pct < 0 || data.overall.pct > 1) {
    errors.push("overall.pct must be between 0 and 1");
  }

  if (data.overall.confidence < 0 || data.overall.confidence > 1) {
    errors.push("overall.confidence must be between 0 and 1");
  }

  // Validate label consistency with percentage
  const expectedLabel = getLabelForPercentage(data.overall.pct);
  if (data.overall.label !== expectedLabel) {
    errors.push(`Label "${data.overall.label}" doesn't match percentage ${data.overall.pct} (expected "${expectedLabel}")`);
  }

  // Validate key facts
  if (data.inferred_key_facts.length < 1 || data.inferred_key_facts.length > 8) {
    errors.push("Must have 1-8 inferred key facts");
  }

  // Check for duplicate fact IDs
  const factIds = data.inferred_key_facts.map(f => f.id);
  const uniqueIds = new Set(factIds);
  if (factIds.length !== uniqueIds.size) {
    errors.push("Duplicate key fact IDs found");
  }

  // Validate concepts references
  const validFactIds = new Set(factIds);
  
  // Check hit concepts reference valid fact IDs
  for (const hitId of data.concepts.hit) {
    if (!validFactIds.has(hitId)) {
      errors.push(`Hit concept "${hitId}" references non-existent fact`);
    }
  }

  // Check partial concepts reference valid fact IDs
  for (const partial of data.concepts.partial) {
    if (!validFactIds.has(partial.id)) {
      errors.push(`Partial concept "${partial.id}" references non-existent fact`);
    }
    if (!partial.reason || partial.reason.trim().length < 3) {
      errors.push(`Partial concept "${partial.id}" needs a meaningful reason`);
    }
  }

  // Check missing concepts reference valid fact IDs
  for (const missingId of data.concepts.missing) {
    if (!validFactIds.has(missingId)) {
      errors.push(`Missing concept "${missingId}" references non-existent fact`);
    }
  }

  // Validate feedback
  if (!data.explanations.student_friendly || data.explanations.student_friendly.trim().length < 5) {
    errors.push("student_friendly explanation too short");
  }

  if (!data.explanations.parent_friendly || data.explanations.parent_friendly.trim().length < 5) {
    errors.push("parent_friendly explanation too short");
  }

  // Check for reasonable text lengths
  if (data.explanations.student_friendly.length > 400) {
    errors.push("student_friendly explanation too long (max 400 chars)");
  }

  if (data.explanations.parent_friendly.length > 500) {
    errors.push("parent_friendly explanation too long (max 500 chars)");
  }

  return errors;
}

/**
 * Determines the correct label for a given percentage
 */
function getLabelForPercentage(pct: number): string {
  if (pct >= 0.85) return "correct";
  if (pct >= 0.70) return "mostly-correct";
  if (pct >= 0.40) return "partial";
  return "incorrect";
}

/**
 * Attempts to repair a malformed JSON response
 */
export function attemptJsonRepair(invalidJson: string): string | null {
  try {
    // Common repair strategies
    let repaired = invalidJson.trim();

    // Remove common prefixes/suffixes
    repaired = repaired.replace(/^```json\s*/, "");
    repaired = repaired.replace(/\s*```$/, "");
    repaired = repaired.replace(/^Here's the JSON:\s*/, "");
    repaired = repaired.replace(/^Here is the grading:\s*/, "");

    // Fix common JSON syntax issues
    repaired = repaired
      .replace(/,\s*}/g, "}") // Remove trailing commas
      .replace(/,\s*]/g, "]")
      .replace(/'/g, '"') // Replace single quotes with double quotes
      .replace(/(\w+):/g, '"$1":') // Quote unquoted keys
      .replace(/:\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*([,}])/g, ': "$1"$2'); // Quote unquoted string values

    // Validate the repaired JSON
    const parsed = JSON.parse(repaired);
    const validation = validateGradeJson(parsed);
    
    if (validation.isValid) {
      return repaired;
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Validates a complete grading response including metadata
 */
export function validateCompleteGradingResponse(response: any): ValidationResult {
  // First validate the core grading JSON
  const coreValidation = validateGradeJson(response);
  if (!coreValidation.isValid) {
    return coreValidation;
  }

  // Additional validations for complete response could go here
  return coreValidation;
}