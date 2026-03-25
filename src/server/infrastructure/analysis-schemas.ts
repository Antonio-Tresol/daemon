import type { AnalysisType } from '@/server/domain/analysis/analysis.entity';
import { FailureSchema, ImprovementSchema, TimelinePlanSchema } from './entity-schemas';

// Re-export ENTITY_SCHEMAS for the /api/agent/schemas endpoint
export { ENTITY_SCHEMAS } from './entity-schemas';

/**
 * Structured output schemas for the SDK's outputFormat option.
 * Each wraps the entity schema in an object with the expected array key.
 */
const STRUCTURED_OUTPUT_SCHEMAS: Record<AnalysisType, Record<string, unknown>> = {
  timeline: {
    type: 'object',
    properties: {
      plans: {
        type: 'array',
        items: TimelinePlanSchema,
      },
    },
    required: ['plans'],
  },
  failures: {
    type: 'object',
    properties: {
      failures: {
        type: 'array',
        items: FailureSchema,
      },
    },
    required: ['failures'],
  },
  improvements: {
    type: 'object',
    properties: {
      improvements: {
        type: 'array',
        items: ImprovementSchema,
      },
    },
    required: ['improvements'],
  },
};

/**
 * Returns the SDK outputFormat config for a given analysis type.
 */
export function getOutputFormat(type: AnalysisType): {
  type: 'json_schema';
  schema: Record<string, unknown>;
} {
  return {
    type: 'json_schema',
    schema: STRUCTURED_OUTPUT_SCHEMAS[type],
  };
}
