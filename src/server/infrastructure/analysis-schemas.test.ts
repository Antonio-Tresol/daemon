import { describe, expect, it } from 'vitest';
import { ENTITY_SCHEMAS, getOutputFormat } from './analysis-schemas';

describe('ENTITY_SCHEMAS', () => {
  it('contains all expected entity types', () => {
    const expectedTypes = [
      'Session',
      'TimelinePlan',
      'Task',
      'Failure',
      'Improvement',
      'HookEvent',
      'AnalysisResult',
    ];

    for (const type of expectedTypes) {
      expect(ENTITY_SCHEMAS[type]).toBeDefined();
    }
  });

  it('each schema has $schema and title fields', () => {
    for (const [name, schema] of Object.entries(ENTITY_SCHEMAS)) {
      const s = schema as Record<string, unknown>; // ENTITY_SCHEMAS values are typed as JsonSchema (opaque object)
      expect(s.$schema).toBe('http://json-schema.org/draft-07/schema#');
      expect(s.title).toBe(name);
    }
  });

  it('TimelinePlan schema includes task properties inline', () => {
    // Narrowing opaque JsonSchema objects to inspect nested properties in test assertions
    const schema = ENTITY_SCHEMAS.TimelinePlan as Record<string, unknown>;
    const props = schema.properties as Record<string, unknown>;
    const tasks = props.tasks as Record<string, unknown>;
    const items = tasks.items as Record<string, unknown>;
    expect(items.type).toBe('object');
    expect(items.properties).toBeDefined();
  });
});

describe('getOutputFormat', () => {
  it('returns json_schema format for timeline', () => {
    const format = getOutputFormat('timeline');
    expect(format.type).toBe('json_schema');
    expect(format.schema).toBeDefined();

    const schema = format.schema as { required: string[]; properties: Record<string, unknown> }; // format.schema is opaque; narrowing for test inspection
    expect(schema.required).toContain('plans');
    expect(schema.properties.plans).toBeDefined();
  });

  it('returns json_schema format for failures', () => {
    const format = getOutputFormat('failures');
    expect(format.type).toBe('json_schema');

    const schema = format.schema as { required: string[]; properties: Record<string, unknown> }; // format.schema is opaque; narrowing for test inspection
    expect(schema.required).toContain('failures');
    expect(schema.properties.failures).toBeDefined();
  });

  it('returns json_schema format for improvements', () => {
    const format = getOutputFormat('improvements');
    expect(format.type).toBe('json_schema');

    const schema = format.schema as { required: string[]; properties: Record<string, unknown> }; // format.schema is opaque; narrowing for test inspection
    expect(schema.required).toContain('improvements');
    expect(schema.properties.improvements).toBeDefined();
  });

  it('wraps entity schemas in array envelopes', () => {
    for (const type of ['timeline', 'failures', 'improvements'] as const) {
      const format = getOutputFormat(type);
      const schema = format.schema as { type: string }; // format.schema is opaque; narrowing for test inspection
      expect(schema.type).toBe('object');
    }
  });
});
