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
import { Task } from '@/lib/tasks';
import {
  addTaskServer,
  toggleTaskServer,
  deleteTaskServer
} from '@/lib/tasks-server';

export async function POST(request: NextRequest) {
  try {
    const { message, tasks: clientTasks } = await request.json();

    // Validate request
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Step 1: Get mock Claude's response
    const { response, toolCalls } = await mockClaudeResponse(message, clientTasks || []);

    // Step 2: Execute any tools the mock decided to use (in-memory)
    let updatedTasks: Task[] = clientTasks || [];
    const toolResults = [];

    for (const toolCall of toolCalls) {
      try {
        const input = toolCall.input as Record<string, unknown>;

        switch (toolCall.name) {
          case 'add_task': {
            const title = input.title as string;
            if (!title) {
              toolResults.push({
                toolName: toolCall.name,
                success: false,
                error: 'Title is required'
              });
            } else {
              const { task } = addTaskServer(updatedTasks, title);
              updatedTasks = [task, ...updatedTasks];
              toolResults.push({
                toolName: toolCall.name,
                success: true,
                data: task
              });
            }
            break;
          }

          case 'complete_task': {
            const taskId = input.task_id as string;
            if (!taskId) {
              toolResults.push({
                toolName: toolCall.name,
                success: false,
                error: 'Task ID is required'
              });
            } else {
              const task = updatedTasks.find(t => t.id === taskId);
              if (!task) {
                toolResults.push({
                  toolName: toolCall.name,
                  success: false,
                  error: `Task with ID '${taskId}' not found`
                });
              } else {
                updatedTasks = toggleTaskServer(updatedTasks, taskId);
                const updated = updatedTasks.find(t => t.id === taskId);
                toolResults.push({
                  toolName: toolCall.name,
                  success: true,
                  data: updated
                });
              }
            }
            break;
          }

          case 'delete_task': {
            const taskId = input.task_id as string;
            if (!taskId) {
              toolResults.push({
                toolName: toolCall.name,
                success: false,
                error: 'Task ID is required'
              });
            } else {
              const task = updatedTasks.find(t => t.id === taskId);
              if (!task) {
                toolResults.push({
                  toolName: toolCall.name,
                  success: false,
                  error: `Task with ID '${taskId}' not found`
                });
              } else {
                updatedTasks = deleteTaskServer(updatedTasks, taskId);
                toolResults.push({
                  toolName: toolCall.name,
                  success: true,
                  data: { title: task.title, id: task.id }
                });
              }
            }
            break;
          }

          default:
            toolResults.push({
              toolName: toolCall.name,
              success: false,
              error: `Unknown tool: ${toolCall.name}`
            });
        }
      } catch (error) {
        toolResults.push({
          toolName: toolCall.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Step 3: Return response + results + updated tasks
    return NextResponse.json({
      response,
      toolCalls,
      toolResults,
      tasks: updatedTasks
    });
  } catch (error) {
    console.error('Agent error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
