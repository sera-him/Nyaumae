import type { ToolCallRecord } from './types.ts';
import { createId } from './utils.ts';

export interface ToolDefinition {
  name: string;
  description: string;
  execute: (argumentsValue: Record<string, unknown>) => Promise<unknown> | unknown;
}

export class ToolDispatcher {
  private readonly tools = new Map<string, ToolDefinition>();

  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  list(): Pick<ToolDefinition, 'name' | 'description'>[] {
    return [...this.tools.values()].map(({ name, description }) => ({ name, description }));
  }

  async dispatch(call: Pick<ToolCallRecord, 'name' | 'arguments'>): Promise<ToolCallRecord> {
    const tool = this.tools.get(call.name);
    const record: ToolCallRecord = {
      id: createId('tool-call'),
      name: call.name,
      arguments: call.arguments,
      status: 'pending',
    };
    if (!tool) return { ...record, status: 'failed', result: { error: 'Tool is not registered.' } };
    try {
      const result = await tool.execute(call.arguments);
      return { ...record, status: 'completed', result };
    } catch {
      return { ...record, status: 'failed', result: { error: 'Tool execution failed.' } };
    }
  }
}

export const toolDispatcher = new ToolDispatcher();
