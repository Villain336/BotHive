import type Anthropic from '@anthropic-ai/sdk';

export const chatTools: Anthropic.Tool[] = [
  {
    name: 'read_file',
    description: 'Read the contents of a file from the connected GitHub repository. Use this to understand the existing code before suggesting changes.',
    input_schema: {
      type: 'object' as const,
      properties: {
        file_path: {
          type: 'string',
          description: 'The path to the file relative to the repository root (e.g., "src/index.ts", "package.json")',
        },
      },
      required: ['file_path'],
    },
  },
  {
    name: 'list_files',
    description: 'List files in a directory of the connected GitHub repository. Use this to understand the project structure.',
    input_schema: {
      type: 'object' as const,
      properties: {
        directory: {
          type: 'string',
          description: 'The directory path relative to the repository root (e.g., "src", "tests"). Use "" for root.',
        },
      },
      required: ['directory'],
    },
  },
  {
    name: 'suggest_fix',
    description: 'Suggest a code fix by providing the file path and the new content. This will be shown to the user as a proposed change they can apply.',
    input_schema: {
      type: 'object' as const,
      properties: {
        file_path: {
          type: 'string',
          description: 'The file path to create or modify',
        },
        content: {
          type: 'string',
          description: 'The complete file content to write',
        },
        description: {
          type: 'string',
          description: 'Brief description of what this change does',
        },
      },
      required: ['file_path', 'content', 'description'],
    },
  },
];
