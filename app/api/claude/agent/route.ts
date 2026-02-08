/**
 * Agent Message Processing Endpoint
 *
 * POST /api/claude/agent
 *
 * Body:
 * {
 *   "message": "string - user message to agent"
 * }
 *
 * Response:
 * {
 *   "response": "string - agent's response to user",
 *   "toolCalls": [...],
 *   "toolResults": [...]
 * }
 *
 * Flow:
 * 1. User sends message
 * 2. Mock Claude analyzes and decides which tools to use
 * 3. We execute those tools
 * 4. Return response + tool results to user
 */

import { NextRequest, NextResponse } from 'next/server';
import { mockClaudeResponse } from '@/lib/claude/mockAgent';
import { executeTool } from '@/lib/claude/executeTools';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    // Validate request
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Step 1: Get mock Claude's response
    const { response, toolCalls } = await mockClaudeResponse(message);

    // Step 2: Execute any tools the mock decided to use
    const toolResults = [];
    for (const toolCall of toolCalls) {
      const result = await executeTool(
        toolCall.name as 'add_task' | 'complete_task' | 'delete_task',
        toolCall.input
      );
      toolResults.push({
        toolName: toolCall.name,
        success: result.success,
        data: result.data,
        error: result.error
      });
    }

    // Step 3: Return response + results
    return NextResponse.json({
      response,
      toolCalls,
      toolResults
    });
  } catch (error) {
    console.error('Agent error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
