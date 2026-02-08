/**
 * Tool Execution API Endpoint
 *
 * POST /api/claude/tools
 *
 * Body:
 * {
 *   "tool_name": "add_task" | "complete_task" | "delete_task",
 *   "tool_input": { ... tool parameters ... }
 * }
 *
 * Response:
 * {
 *   "success": boolean,
 *   "data": { ... result ... },
 *   "error": string (if failed)
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { executeTool } from '@/lib/claude/executeTools';

export async function POST(request: NextRequest) {
  try {
    const { tool_name, tool_input } = await request.json();

    // Validate request
    if (!tool_name || !tool_input) {
      return NextResponse.json(
        { error: 'Missing tool_name or tool_input' },
        { status: 400 }
      );
    }

    // Execute the tool
    const result = await executeTool(
      tool_name as string,
      tool_input as Record<string, unknown>
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Tool execution error:', error);
    return NextResponse.json(
      { error: 'Failed to execute tool' },
      { status: 500 }
    );
  }
}
